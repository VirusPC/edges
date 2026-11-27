import { relative, dirname, basename } from "node:path";
import { InternalNode, type InternalCreateInput } from "../../core/internal-node.js";
import { InternalSyntax, type SyntaxContent, type SyntaxReference } from "../node/document.js";
import { identifyNodeType, resolveEntryHref, isHarnessMaterial } from "../node/layout.js";
import type { NodeReference } from "../../core/types.js";
import { stripComposeBlock } from "../compose/compose-readme-node.js";
import { MATERIAL_TYPES } from "../../config/material-types.js";
import { CONSTRAINT_SEED_PREAMBLE, PREVIOUS_OFFICIAL_CONSTRAINT_LINES, constraintSeedMarker } from "../../config/constraint-seeds.js";
import { CONSTRAINTS_END, CONSTRAINTS_START, INTERNAL_SECTIONS } from "../../config/sections.js";

function seedBlockEnd(inner: string, from: number): number {
  const next = inner.indexOf("<!-- edges-seed:", from);
  return next < 0 ? inner.length : next;
}

function replaceSeedBlock(inner: string, id: string, official: string): string {
  const at = inner.indexOf(constraintSeedMarker(id));
  const bodyStart = inner.indexOf("\n", at);
  const end = seedBlockEnd(inner, bodyStart + 1);
  return `${inner.slice(0, bodyStart + 1)}${official}\n${inner.slice(end)}`;
}

function insertSeedBlock(inner: string, id: string, official: string, afterId: string | null): string {
  const piece = `${constraintSeedMarker(id)}\n${official}\n`;
  if (afterId && inner.includes(constraintSeedMarker(afterId))) {
    const markerAt = inner.indexOf(constraintSeedMarker(afterId));
    const bodyStart = inner.indexOf("\n", markerAt);
    const end = seedBlockEnd(inner, bodyStart + 1);
    const prefix = inner[end - 1] === "\n" ? "" : "\n";
    return inner.slice(0, end) + prefix + piece + inner.slice(end);
  }
  const heading = inner.indexOf(`## ${INTERNAL_SECTIONS.constraints.heading}`);
  if (heading >= 0) {
    const lineEnd = inner.indexOf("\n", heading);
    const at = lineEnd < 0 ? inner.length : lineEnd + 1;
    const prefix = at > 0 && inner[at - 1] === "\n" ? "" : "\n";
    return inner.slice(0, at) + prefix + piece + inner.slice(at);
  }
  return piece + inner;
}

function ensureSeedBlock(inner: string, id: string, official: string, afterId: string | null): string {
  const at = inner.indexOf(constraintSeedMarker(id));
  if (at < 0) return insertSeedBlock(inner, id, official, afterId);
  const bodyStart = inner.indexOf("\n", at);
  const end = seedBlockEnd(inner, bodyStart + 1);
  const raw = inner.slice(bodyStart + 1, end);
  if (raw.trim() !== official || raw === `${official}\n`) return inner;
  return replaceSeedBlock(inner, id, official);
}

function normalizeSeedBlock(inner: string, id: string, official: string): string {
  const at = inner.indexOf(constraintSeedMarker(id));
  if (at < 0) return inner;
  const bodyStart = inner.indexOf("\n", at);
  const end = seedBlockEnd(inner, bodyStart + 1);
  const raw = inner.slice(bodyStart + 1, end);
  if (raw.trim() !== official || raw === `${official}\n`) return inner;
  return replaceSeedBlock(inner, id, official);
}

function stripPreviousOfficialConstraintLines(inner: string): string {
  return inner.split("\n").filter((line) => {
    const text = line.trim().replace(/^- /, "").trim();
    return !(PREVIOUS_OFFICIAL_CONSTRAINT_LINES as readonly string[]).includes(text);
  }).join("\n");
}

function refreshConstraintSection(document: string, initializedTypes: readonly string[]): string {
  const start = document.indexOf(CONSTRAINTS_START);
  const end = document.indexOf(CONSTRAINTS_END);
  if (start < 0 || end < start) return document;
  const selected = new Set(initializedTypes);
  let inner = stripPreviousOfficialConstraintLines(document.slice(start + CONSTRAINTS_START.length, end));
  inner = ensureSeedBlock(inner, "preamble", CONSTRAINT_SEED_PREAMBLE, null);
  let previous = "preamble";
  for (const type of MATERIAL_TYPES) {
    const id = type.id;
    if (!selected.has(id)) {
      if (inner.includes(constraintSeedMarker(id))) previous = id;
      continue;
    }
    inner = ensureSeedBlock(inner, id, type.constraint, previous);
    previous = id;
  }
  inner = normalizeSeedBlock(inner, "preamble", CONSTRAINT_SEED_PREAMBLE);
  for (const type of MATERIAL_TYPES) {
    if (inner.includes(constraintSeedMarker(type.id)))
      inner = normalizeSeedBlock(inner, type.id, type.constraint);
  }
  return document.slice(0, start + CONSTRAINTS_START.length) + inner + document.slice(end);
}

export interface AgentsCreateInput extends InternalCreateInput {
  constraints?: readonly string[];
}
export interface AgentsUpdateInput extends AgentsCreateInput {}
export interface AgentsContent {
  readonly constraints: readonly string[];
  readonly localChildren: readonly Readonly<NodeReference>[];
  readonly descendantChildren: readonly Readonly<NodeReference>[];
}

export class AgentsNode extends InternalNode<AgentsCreateInput, AgentsUpdateInput> {
  override readonly type = "agents";
  #constraints: string[] = [];
  #dropCompose = false;
  #syntax = new InternalSyntax("");
  #hrefs = new Map<string, string>();

  constructor(file: string) {
    super(file);
  }

  get content(): AgentsContent {
    return {
      constraints: [...this.#constraints],
      localChildren: this.localChildren,
      descendantChildren: this.descendantChildren,
    };
  }
  get constraints(): readonly string[] {
    return [...this.#constraints];
  }

  /** Refresh official seed blocks for initialized scope material types. */
  refreshConstraintSeeds(initializedTypes: readonly string[]): boolean {
    const previous = this.body;
    const next = refreshConstraintSection(previous, initializedTypes);
    if (next === previous) return false;
    this.body = next;
    return true;
  }

  /** Drop a legacy Compose block. The entry now lives on `.edges/compose/README.md`. */
  clearComposeSection(): this {
    this.#dropCompose = true;
    this.parse(stripComposeBlock(this.serialize()));
    return this;
  }

  protected override parseBody(markdown: string): void {
    const entries =
      markdown.includes("<!-- edges-entries-local:") ||
      markdown.includes("<!-- edges-entries-descendants:");
    const layer =
      markdown.includes("<!-- edges:start -->") ||
      markdown.includes("<!-- edges-constraints:") ||
      markdown.includes("<!-- edges-local:") ||
      markdown.includes("<!-- edges-descendants:");
    const syntax = new InternalSyntax(
      markdown,
      (href) => {
        const id = resolveEntryHref(this.path, href, entries && !layer);
        return !!id && identifyNodeType(id) !== undefined;
      },
      entries && !layer ? "entries" : "agents",
    );
    const parsed = syntax.content();
    const hrefs = new Map<string, string>();
    const references = (entries: readonly SyntaxReference[]): NodeReference[] =>
      entries.flatMap((entry) => {
        const id = resolveEntryHref(this.path, entry.target);
        if (!id) return [];
        hrefs.set(id, entry.target);
        return [{
          id,
          ...(entry.label === undefined ? {} : { name: entry.label }),
          ...(entry.description === undefined ? {} : { description: entry.description }),
        }];
      });
    const previous = {
      constraints: this.#constraints,
      syntax: this.#syntax,
      hrefs: this.#hrefs,
    };
    this.#constraints = [...parsed.constraints];
    this.#syntax = syntax;
    this.#hrefs = hrefs;
    try {
      this.replace(references(parsed.localChildren), references(parsed.descendantChildren));
    } catch (error) {
      this.#constraints = previous.constraints;
      this.#syntax = previous.syntax;
      this.#hrefs = previous.hrefs;
      throw error;
    }
  }
  #links(items: readonly NodeReference[]): SyntaxReference[] {
    return items.map((ref) => ({
      target:
        this.#hrefs.get(ref.id) ??
        relative(dirname(this.path), ref.id).split("/").map((part) => encodeURIComponent(part)).join("/"),
      ...(ref.name === undefined ? {} : { label: ref.name }),
      ...(ref.description === undefined ? {} : { description: ref.description }),
    }));
  }
  #document(): SyntaxContent {
    return {
      constraints: this.#constraints,
      localChildren: this.#links(this.locals),
      descendantChildren: this.#links(this.descendants),
      ...(this.#dropCompose ? { compose: [] } : {}),
    };
  }
  protected override serializeBody(): string {
    return this.#syntax.serialize(this.#document());
  }
  protected override sync(): void {
    for (const reference of [...this.locals, ...this.descendants]) {
      const childType = identifyNodeType(reference.id);
      const superIndex = childType === "readme"
        && basename(reference.id) === "README.md"
        && dirname(reference.id) === dirname(this.path);
      if (childType === undefined || (childType === "readme" && !isHarnessMaterial(reference.id) && !superIndex))
        throw new Error(`${this.path}: child must identify a directory entry: ${reference.id}`);
    }
    if (this.#constraints.some((value) => typeof value !== "string"))
      throw new Error(`${this.path}: constraints must be strings.`);
    this.serializeBody();
  }
  #edit(apply: () => void): void {
    const constraints = this.#constraints;
    apply();
    try {
      this.sync();
    } catch (error) {
      this.#constraints = constraints;
      throw error;
    }
  }
  override validate(): void {
    super.validate();
  }
  protected override applyInput(input: AgentsCreateInput): void {
    if (
      input.body !== undefined &&
      (input.constraints !== undefined || input.localChildren !== undefined || input.descendantChildren !== undefined)
    )
      throw new Error(`${this.path}: body conflicts with structured sections.`);
    this.#edit(() => {
      if (input.constraints !== undefined) this.#constraints = [...input.constraints];
      super.applyInput(input);
    });
  }
  setConstraints(items: readonly string[]): this {
    this.#edit(() => { this.#constraints = [...items]; });
    return this;
  }
}
