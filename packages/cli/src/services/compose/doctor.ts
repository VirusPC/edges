import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { isInsideComposedCheckout } from "../../domain/config/exclude.js";
import { AgentsNode } from "../../domain/models/index.js";
import {
  composeReadmePath,
  rebaseComposeHref,
  type ComposeLink,
} from "../../domain/models/compose/compose-readme-node.js";
import { InternalSyntax } from "../../domain/models/node/document.js";
import { openNodeSession } from "../node/scope-session.js";
import { ensureComposeEntry } from "./service.js";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

const DOCS_DETAIL = "mentions --with-composed; left unchanged";

export type ComposeDoctorKind =
  | "move-block"
  | "rewrite-href"
  | "index-link"
  | "clear-agents"
  | "docs";

export interface ComposeDoctorChange {
  kind: ComposeDoctorKind;
  path: string;
  detail?: string;
}

export interface ComposeDoctorResult {
  changes: ComposeDoctorChange[];
  warnings: string[];
}

interface PlannedLink {
  link: ComposeLink;
  href: string;
}

/**
 * One-shot migration of a Compose block from `AGENTS.md` into
 * `.harness/compose/README.md`. Dry-run unless `apply` is true.
 * Daily edits stay on `compose add` / `list` / `update`.
 */
export async function doctorCompose(
  env: NodeJS.ProcessEnv,
  apply: boolean,
): Promise<ComposeDoctorResult> {
  const session = openNodeSession(env);
  const agentsFile = path.join(session.scope, ENTRY_NAMES.internal);
  if (!existsSync(agentsFile)) throw new Error(`Missing scope entry: ${agentsFile}. Add AGENTS.md.`);
  const composeFile = composeReadmePath(session.scope);
  const source = readFileSync(agentsFile, "utf8");
  const markers = /<!-- project-harness-compose:start -->/.test(source);
  const links = markers
    ? (new InternalSyntax(source, () => true).content().compose ?? [])
    : [];
  const planned: PlannedLink[] = links.map((link) => ({
    link: { target: link.target, label: link.label, description: link.description },
    href: rebaseComposeHref(agentsFile, composeFile, link.target),
  }));
  const docs = collectDocHits(session.scope);
  const needsBlock = markers;
  const needsIndex = needsBlock && !indexLinksCompose(session.scope);
  const changes: ComposeDoctorChange[] = [];
  if (planned.length > 0) {
    changes.push({
      kind: "move-block",
      path: agentsFile,
      detail: `${planned.length} entr${planned.length === 1 ? "y" : "ies"}`,
    });
  }
  for (const item of planned) {
    if (item.href !== item.link.target) {
      changes.push({
        kind: "rewrite-href",
        path: composeFile,
        detail: `${item.link.target} -> ${item.href}`,
      });
    }
  }
  if (needsIndex) {
    changes.push({
      kind: "index-link",
      path: path.join(session.scope, ".harness", "README.md"),
      detail: "link compose/README.md from .harness/README.md",
    });
  }
  if (markers) changes.push({ kind: "clear-agents", path: agentsFile });
  for (const file of docs) changes.push({ kind: "docs", path: file, detail: DOCS_DETAIL });

  const warnings: string[] = [];
  if (!apply || changes.length === 0) return { changes, warnings };

  if (needsBlock) {
    const node = await ensureComposeEntry(session.scope, session.service);
    const kept = node.links();
    const names = new Set(node.entries().map((entry) => entry.name));
    const incoming: ComposeLink[] = [];
    for (const item of planned) {
      const name = item.link.label?.trim() ?? "";
      if (!name) throw new Error(`${agentsFile}: compose entry name is required`);
      if (names.has(name)) {
        warnings.push(
          `warning: compose entry ${name} is already on .harness/compose/README.md; left that line and dropped the AGENTS.md line\n`,
        );
        continue;
      }
      names.add(name);
      incoming.push({
        target: item.href,
        label: name,
        ...(item.link.description === undefined ? {} : { description: item.link.description }),
      });
    }
    if (incoming.length > 0) {
      node.loadLinks([...kept, ...incoming]);
      await session.service.update(node, {});
    }
    const agents = await session.service.get(agentsFile, AgentsNode);
    if (!agents) throw new Error(`Missing scope entry: ${agentsFile}. Add AGENTS.md.`);
    agents.clearComposeSection();
    await session.service.update(agents, {});
  }
  return { changes, warnings };
}

function indexLinksCompose(scopeDir: string): boolean {
  const readme = path.join(scopeDir, ".harness", "README.md");
  const compose = composeReadmePath(scopeDir);
  if (!existsSync(readme) || !existsSync(compose)) return false;
  return readFileSync(readme, "utf8").includes("compose/README.md");
}

/** Installed skills and historical docs keep the old flag as prose. */
function skipDocTree(parent: string, name: string): boolean {
  if (name === "skills" && path.basename(parent) === ".agents") return true;
  if (name === "adr" && path.basename(parent) === "docs") return true;
  return false;
}

function isHistoricalDoc(scopeDir: string, file: string): boolean {
  if (/^changelog\.md$/i.test(path.basename(file))) return true;
  const parts = path.relative(scopeDir, file).split(path.sep);
  for (let i = 0; i < parts.length - 1; i++) {
    const here = parts[i];
    const next = parts[i + 1];
    if (here === ".agents" && next === "skills") return true;
    if (here === "docs" && next === "adr") return true;
  }
  return false;
}

function collectDocHits(scopeDir: string): string[] {
  const hits: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || skipDocTree(dir, entry.name) || isInsideComposedCheckout(abs)) continue;
        walk(abs);
        continue;
      }
      if (!entry.isFile() || isInsideComposedCheckout(abs)) continue;
      if (!entry.name.endsWith(".md") && !entry.name.endsWith(".test.ts")) continue;
      if (isHistoricalDoc(scopeDir, abs)) continue;
      if (readFileSync(abs, "utf8").includes("--with-composed")) hits.push(abs);
    }
  };
  walk(scopeDir);
  return hits.sort((a, b) => a.localeCompare(b));
}
