import { homedir } from "node:os";
import path from "node:path";
import { ReadmeNode } from "../readme/readme-node.js";
import type { ChildGroup, NodeReference } from "../../core/types.js";
import { validateChild } from "../../core/relations.js";
import { COMPOSED_CHECKOUT_ROOT, ENTRY_NAMES } from "../../config/layout.js";
import { InternalSyntax } from "../node/document.js";

const REMOTE = /(?:^|\s)remote:\s*(\S+)/;

export interface ComposeEntry {
  directory: string;
  id: string;
  href: string;
  name: string;
  description?: string;
  remote?: string;
}

export interface ComposeCheckout {
  name: string;
  directory: string;
  /** Authored link target, relative to `.harness/compose/` for new entries. */
  href: string;
  remote?: string;
}

export interface ComposeChildInput {
  name: string;
  directory?: string;
  href?: string;
  description?: string;
  remote?: string;
}

export interface ComposeLink {
  target: string;
  label?: string;
  description?: string;
}

interface ComposeItem {
  directory: string;
  href: string;
  name: string;
  description?: string;
  remote?: string;
  authored?: string;
}

export const COMPOSE_INDEX_NAME = "组合";
export const COMPOSE_INDEX_DESCRIPTION = "被组合的 harness 仓库。";

export function composeReadmePath(scopeDir: string): string {
  return path.join(scopeDir, COMPOSED_CHECKOUT_ROOT, ENTRY_NAMES.readme);
}

export function composeReadmeSeed(): string {
  // The title must not be the section heading "组合": a matching heading outside
  // the markers opens the section, and the markers then open it again.
  return `# 被组合的 harness 仓库

<!-- project-harness-compose:start -->
## 组合

<!-- project-harness-compose:end -->
`;
}

/** Remove a Compose block, including its markers. */
export function stripComposeBlock(source: string): string {
  const stripped = source.replace(
    /\r?\n?<!-- project-harness-compose:start -->[\s\S]*?<!-- project-harness-compose:end -->\r?\n?/g,
    "\n",
  );
  return stripped.replace(/\n{3,}/g, "\n\n");
}

function readComposeSuffix(suffix: string | undefined): { description?: string; remote?: string } {
  if (!suffix) return {};
  const match = REMOTE.exec(suffix);
  if (!match || match[1] === undefined) return { description: suffix };
  const remote = match[1];
  const text = `${suffix.slice(0, match.index)} ${suffix.slice(match.index + match[0].length)}`
    .replace(/\s+/g, " ")
    .trim();
  return { remote, ...(text ? { description: text } : {}) };
}

function sameComposeSuffix(authored: string, description?: string, remote?: string): boolean {
  const parsed = readComposeSuffix(authored);
  return parsed.description === description && parsed.remote === remote;
}

function writeComposeSuffix(description?: string, remote?: string): string | undefined {
  const text = description?.trim();
  const url = remote?.trim();
  if (text && url) return `${text} remote: ${url}`;
  if (url) return `remote: ${url}`;
  return text || undefined;
}

/**
 * True for an authored href written before Compose moved to in-repo git submodules:
 * an absolute path or a `~/...` path. Such entries still read, with a migration warning.
 */
export function isLegacyComposeHref(href: string): boolean {
  const value = href.trim();
  return value === "~" || value.startsWith("~/") || path.isAbsolute(value);
}

/** Normalize a user-given relative path to a POSIX href; reject absolute and `~` paths. */
export function relativeComposeHref(ownerLabel: string, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error(`${ownerLabel}: compose entry path is empty`);
  if (isLegacyComposeHref(trimmed) || path.win32.isAbsolute(trimmed))
    throw new Error(
      `${ownerLabel}: compose path must be relative to the scope directory (got ${trimmed}). ` +
        `Absolute and ~ paths are no longer written; omit --path to use ${COMPOSED_CHECKOUT_ROOT}/<name>.`,
    );
  const href = path.posix.normalize(trimmed.replace(/\\/g, "/")).replace(/\/+$/, "");
  if (!href || href === ".") throw new Error(`${ownerLabel}: compose entry cannot target its own directory`);
  return href;
}

function expandHome(href: string): string {
  if (href === "~") return homedir();
  if (href.startsWith("~/")) return path.join(homedir(), href.slice(2));
  return href;
}

function resolveAgainst(ownerFile: string, href: string): string {
  const value = expandHome(href.trim());
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("#") || value.startsWith("//"))
    throw new Error(`${ownerFile}: compose entry must be a local directory: ${href}`);
  const pathname = value.split(/[?#]/, 1)[0] ?? "";
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    throw new Error(`${ownerFile}: invalid encoded compose path ${href}`);
  }
  if (!decoded) throw new Error(`${ownerFile}: compose entry path is empty`);
  return path.resolve(path.dirname(ownerFile), decoded);
}

/** Directory of the checkout, and the child id (`<checkout>/README.md`). A href that already names README.md is not extended. */
export function composeEntryLocation(ownerFile: string, href: string): { directory: string; id: string } {
  const resolved = path.normalize(resolveAgainst(ownerFile, href));
  const isReadme = path.basename(resolved) === ENTRY_NAMES.readme;
  const id = isReadme ? resolved : path.normalize(path.join(resolved, ENTRY_NAMES.readme));
  const directory = isReadme ? path.dirname(resolved) : resolved;
  return { directory, id };
}

/**
 * `--path` is a checkout directory relative to the scope. The href stored in
 * `compose/README.md` is that checkout's README, relative to `.harness/compose/`.
 */
export function hrefForScopeCheckout(composeFile: string, scopeDir: string, raw: string): string {
  const relative = relativeComposeHref(scopeDir, raw);
  const checkout = path.resolve(scopeDir, relative);
  if (path.resolve(checkout) === path.resolve(scopeDir))
    throw new Error(`${scopeDir}: compose entry cannot target its own directory`);
  const child = path.join(checkout, ENTRY_NAMES.readme);
  const href = path.relative(path.dirname(composeFile), child).split(path.sep).join("/");
  if (!href || href === ENTRY_NAMES.readme)
    throw new Error(`${composeFile}: compose entry cannot target its own directory`);
  return href;
}

/** Rewrite an href authored next to `fromFile` so it is relative to `compose/README.md`. Legacy hrefs stay as written. */
export function rebaseComposeHref(fromFile: string, composeFile: string, href: string): string {
  if (isLegacyComposeHref(href)) return href;
  const { id } = composeEntryLocation(fromFile, href);
  const rel = path.relative(path.dirname(composeFile), id).split(path.sep).join("/");
  if (!rel) throw new Error(`${fromFile}: compose entry cannot target its own directory`);
  return rel;
}

function singleDirectoryName(name: string): boolean {
  return name !== "." && name !== ".." && !name.includes("/") && !name.includes("\\");
}

/**
 * Real module entry for Compose: `<scope>/.harness/compose/README.md`.
 * Subclasses ReadmeNode. The compose block is the child list; each child id is
 * the composed repository's `README.md`. Children are a read-only mount and are
 * not descended into (no recursive Compose).
 */
export class ComposeReadmeNode extends ReadmeNode {
  #items: ComposeItem[] = [];
  #syntax = new InternalSyntax("");

  override childTraversal(): "leaf" {
    return "leaf";
  }

  override mountsReadOnly(): boolean {
    return true;
  }

  entries(): ComposeEntry[] {
    return this.#items.map((item) => this.#entry(item));
  }

  override get localChildren(): readonly Readonly<NodeReference>[] {
    return this.#childRefs();
  }
  override get descendantChildren(): readonly Readonly<NodeReference>[] {
    return [];
  }
  override get children(): readonly Readonly<NodeReference>[] {
    return this.#childRefs();
  }

  override addChild(input: ComposeChildInput | ChildGroup, reference?: NodeReference): this {
    if (typeof input === "string") {
      if (!reference) throw new Error(`${this.path}: compose entry takes { name, directory?, description?, remote?, href? }`);
      throw new Error(`${this.path}: compose entry takes { name, directory?, description?, remote?, href? }`);
    }
    const name = input.name.trim();
    if (!name) throw new Error(`${this.path}: compose entry name is required`);
    const located = this.#locate(name, input.href ?? input.directory);
    const description = input.description?.trim() || undefined;
    const remote = input.remote?.trim() || undefined;
    const next = this.#items.filter((item) => item.name !== name);
    next.push({ ...located, name, description, remote });
    this.#commit(next);
    return this;
  }

  override removeChild(id: string): this {
    const next = this.#items.filter((item) => this.#entry(item).id !== id);
    if (next.length === this.#items.length)
      throw new Error(`${this.path}: compose entry not found: ${id}`);
    this.#commit(next);
    return this;
  }

  override updateChild(id: string, patch: { name?: string; description?: string; remote?: string }): this {
    const index = this.#items.findIndex((item) => this.#entry(item).id === id);
    const current = index < 0 ? undefined : this.#items[index];
    if (!current) throw new Error(`${this.path}: compose entry not found: ${id}`);
    const name = patch.name === undefined ? current.name : patch.name.trim();
    if (!name) throw new Error(`${this.path}: compose entry name is required`);
    const description = patch.description === undefined ? current.description : patch.description.trim() || undefined;
    const remote = patch.remote === undefined ? current.remote : patch.remote.trim() || undefined;
    const next = this.#items.map((item, at) => at === index ? { ...item, name, description, remote, authored: undefined } : item);
    this.#commit(next);
    return this;
  }

  checkout(name: string): ComposeCheckout {
    const item = this.#items.find((entry) => entry.name === name);
    if (!item) throw new Error(`${this.path}: compose entry not found: ${name}`);
    return {
      name: item.name,
      directory: item.directory,
      href: item.href,
      ...(item.remote === undefined ? {} : { remote: item.remote }),
    };
  }

  loadLinks(entries: readonly ComposeLink[]): void {
    const next = entries.map((entry) => this.#fromLink(entry));
    this.#commit(next);
  }

  links(): ComposeLink[] {
    return this.#items.map((item) => {
      const unchanged = item.authored !== undefined && sameComposeSuffix(item.authored, item.description, item.remote);
      const description = unchanged ? item.authored : writeComposeSuffix(item.description, item.remote);
      return {
        target: item.href,
        label: item.name,
        ...(description === undefined ? {} : { description }),
      };
    });
  }

  protected override parseBody(markdown: string): void {
    const syntax = new InternalSyntax(markdown, () => true);
    const next = (syntax.content().compose ?? []).map((entry) => this.#fromLink({
      target: entry.target,
      label: entry.label,
      description: entry.description,
    }));
    this.#validate(next);
    this.#items = next;
    this.#syntax = syntax;
    this.replace(this.#childRefs(), []);
  }

  protected override serializeBody(): string {
    return this.#syntax.serialize({
      constraints: [],
      localChildren: [],
      descendantChildren: [],
      compose: this.links(),
    });
  }

  override validate(): void {
    this.#validate(this.#items);
    super.validate();
  }

  #entry(item: ComposeItem): ComposeEntry {
    const { id } = composeEntryLocation(this.path, item.href);
    return {
      directory: item.directory,
      id,
      href: item.href,
      name: item.name,
      ...(item.description === undefined ? {} : { description: item.description }),
      ...(item.remote === undefined ? {} : { remote: item.remote }),
    };
  }

  #childRefs(): NodeReference[] {
    return this.#items.map((item) => {
      const entry = this.#entry(item);
      return {
        id: entry.id,
        name: entry.name,
        ...(entry.description === undefined ? {} : { description: entry.description }),
      };
    });
  }

  #commit(next: ComposeItem[]): void {
    this.#validate(next);
    const previous = this.#items;
    this.#items = next;
    try {
      this.replace(this.#childRefs(), []);
    } catch (error) {
      this.#items = previous;
      throw error;
    }
  }

  #locate(name: string, raw: string | undefined): { directory: string; href: string } {
    if (raw === undefined) {
      if (!singleDirectoryName(name))
        throw new Error(`${this.path}: compose entry name must be a single directory name: ${name}`);
      const href = `${name}/${ENTRY_NAMES.readme}`;
      return { href, directory: composeEntryLocation(this.path, href).directory };
    }
    const href = isLegacyComposeHref(raw) ? raw : relativeComposeHref(this.path, raw);
    return { href, directory: composeEntryLocation(this.path, href).directory };
  }

  #fromLink(entry: ComposeLink): ComposeItem {
    const name = entry.label?.trim() ?? "";
    if (!name) throw new Error(`${this.path}: compose entry name is required`);
    const href = entry.target;
    const fields = readComposeSuffix(entry.description);
    const { directory } = composeEntryLocation(this.path, href);
    return {
      directory,
      href,
      name,
      authored: entry.description,
      ...fields,
    };
  }

  #validate(items: readonly ComposeItem[]): void {
    const names = new Set<string>();
    const directories = new Set<string>();
    for (const item of items) {
      if (!item.name.trim()) throw new Error(`${this.path}: compose entry name is required`);
      const { directory, id } = composeEntryLocation(this.path, item.href);
      if (path.resolve(directory) === path.resolve(path.dirname(this.path)) || path.resolve(id) === path.resolve(this.path))
        throw new Error(`${this.path}: compose entry cannot target its own directory`);
      validateChild({ id });
      if (names.has(item.name)) throw new Error(`${this.path}: compose entry already registered: ${item.name}`);
      if (directories.has(directory))
        throw new Error(`${this.path}: compose directory already registered: ${directory}`);
      names.add(item.name);
      directories.add(directory);
    }
  }
}
