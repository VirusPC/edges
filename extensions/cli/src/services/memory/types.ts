import * as fs from "node:fs";
import { join, dirname } from "node:path";
import { assertPrivateIgnored } from "./ignore.js";
import { parseDocument } from "../../utils/node-tree/codec/document.js";
import {
  LOCAL_START,
  LOCAL_END,
  TYPE_META_START,
  TYPE_META_END,
  ENTRIES_START,
  blockPattern,
  buildLocalBlock,
  escapeRegExp,
  indexFiles,
} from "./blocks.js";
import {
  AGENTS_FILE_NAME,
  assertScopePath,
  ancestors,
  isDirectory,
  isFile,
  moduleForType,
  readText,
  typeFromDirName,
  typeIndexRelpath,
  writeAtomic,
} from "./paths.js";
import { ENTRY_LINE_TEMPLATE, renderLine } from "./templates.js";
export const MEMORY_TYPE_NAMES = [
  "user",
  "feedback",
  "project",
  "reference",
] as const;
export const SKILL_TYPE_NAMES = ["managed", "referenced"] as const;
export const SEED_TYPE_NAMES: readonly string[] = [
  ...MEMORY_TYPE_NAMES,
  ...SKILL_TYPE_NAMES,
];
export interface TypeSpec {
  name: string;
  indexFile: string;
  description: string;
  writable: boolean;
  gitignore: boolean;
  format: "ordinary" | "skills";
  module: "memory" | "skills";
}
export const TYPE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
export const seedIndexFiles = indexFiles;
export const typeIndexTemplateName = (name: string) =>
  `${name.toUpperCase()}.md`;
export const indexFileName = (name: string, module?: "memory" | "skills") =>
  typeIndexRelpath(name, module);
export function validateTypeName(value: string): string {
  const name = value.trim();
  if (SEED_TYPE_NAMES.includes(name.toLowerCase()))
    throw new Error(`不能用 add-type 登记官方种子类型: ${name.toLowerCase()}`);
  if (!TYPE_NAME_PATTERN.test(name))
    throw new Error(
      "--name 必须是小写 snake_case，例如 docs 或 my_type，不能用 kebab-case",
    );
  return name;
}
/** Type comments contain YAML, parsed by the same safe document codec as entries. */
export function parseTypeMeta(text: string): TypeSpec | undefined {
  const block = text.match(blockPattern(TYPE_META_START, TYPE_META_END))?.[0];
  if (!block) return;
  const fields =
    parseDocument(
      `---\n${block.slice(TYPE_META_START.length, -TYPE_META_END.length).trim()}\n---\n`,
    ).metadata ?? {};
  const name = fields.name;
  if (typeof name !== "string" || !TYPE_NAME_PATTERN.test(name))
    throw new Error("Invalid type metadata name");
  if (!SEED_TYPE_NAMES.includes(name)) {
    const missing = ["gitignore", "writable"].filter((k) => !(k in fields));
    if (missing.length)
      throw new Error(
        `Missing custom type privilege metadata; restore original permissions: ${missing.join(", ")}`,
      );
  }
  const module = fields.module ?? moduleForType(name);
  if (module !== "memory" && module !== "skills")
    throw new Error("Invalid type module");
  for (const key of ["writable", "gitignore"])
    if (key in fields && typeof fields[key] !== "boolean")
      throw new Error(`Invalid type flag: ${key}`);
  const format = fields.format ?? "ordinary";
  if (format !== "ordinary" && format !== "skills")
    throw new Error("Invalid type format");
  return {
    name,
    indexFile: indexFileName(name, module),
    description: String(fields.description ?? ""),
    writable: (fields.writable ?? true) as boolean,
    gitignore: (fields.gitignore ?? false) as boolean,
    format,
    module,
  };
}
export function seedDescription(name: string): string {
  return (
    buildLocalBlock().match(
      new RegExp(`\\]\\(${escapeRegExp(indexFileName(name))}\\) — (.*)`),
    )?.[1] ?? name
  );
}
export function seedSpec(name: string): TypeSpec {
  const module = moduleForType(name);
  return {
    name,
    indexFile: indexFileName(name),
    description: seedDescription(name),
    writable: name !== "referenced",
    gitignore: name === "user",
    format: module === "skills" ? "skills" : "ordinary",
    module,
  };
}
export function layerTypeSpecs(target: string): TypeSpec[] {
  const candidates = new Map<
    string,
    { module: "memory" | "skills"; dirname: string }
  >();
  const agents = join(target, AGENTS_FILE_NAME);
  if (isFile(agents)) {
    const block = readText(agents).match(
      blockPattern(LOCAL_START, LOCAL_END),
    )?.[0];
    if (block)
      for (const m of block.matchAll(
        /\]\((\.harness\/(memory|skills)\/([^/\s)]+)\/AGENTS\.md)\)/g,
      ))
        candidates.set(m[1]!, {
          module: m[2] as "memory" | "skills",
          dirname: m[3]!,
        });
  }
  for (const module of ["memory", "skills"] as const) {
    const container = assertScopePath(join(target, ".harness", module), target);
    if (isDirectory(container))
      for (const child of fs.readdirSync(container).sort()) {
        const file = join(container, child, AGENTS_FILE_NAME);
        assertScopePath(file, target);
        if (isFile(file) && readText(file).includes(ENTRIES_START))
          candidates.set(`.harness/${module}/${child}/AGENTS.md`, {
            module,
            dirname: child,
          });
      }
  }
  const result = new Map<string, TypeSpec>();
  for (const [rel, { module, dirname }] of candidates) {
    const file = assertScopePath(join(target, rel), target);
    const parsed = isFile(file) ? parseTypeMeta(readText(file)) : undefined;
    const name = parsed?.name ?? typeFromDirName(dirname);
    if (!parsed && !SEED_TYPE_NAMES.includes(name))
      throw new Error(
        `Missing custom type index/metadata; restore original permissions: ${rel}`,
      );
    if (parsed && parsed.module !== module)
      throw new Error(`Type module disagrees with path: ${rel}`);
    if (SEED_TYPE_NAMES.includes(name) && rel !== indexFileName(name))
      throw new Error(`Official type path conflict: ${name}`);
    if (result.has(name) && result.get(name)!.indexFile !== rel)
      throw new Error(`Duplicate type identity: ${name}`);
    const spec = { ...(parsed ?? seedSpec(name)), indexFile: rel, module };
    if (name === "user" && !spec.gitignore)
      throw new Error("user must remain private (gitignore: true)");
    if (name === "managed" && (!spec.writable || spec.format !== "skills"))
      throw new Error("managed must remain writable skills");
    if (name === "referenced" && (spec.writable || spec.format !== "skills"))
      throw new Error("referenced must remain index-only skills");
    result.set(name, spec);
  }
  const order = (name: string) =>
    SEED_TYPE_NAMES.includes(name)
      ? SEED_TYPE_NAMES.indexOf(name)
      : SEED_TYPE_NAMES.length;
  return [...result.values()].sort((a, b) => order(a.name) - order(b.name));
}
export const discoverLayerTypes = (target: string): Record<string, string> =>
  Object.fromEntries(layerTypeSpecs(target).map((s) => [s.name, s.indexFile]));
export const layerWritableTypes = (target: string) =>
  layerTypeSpecs(target)
    .filter((s) => s.writable)
    .map((s) => s.name);
export function rejectUnwritableType(target: string, name: string): string {
  return layerTypeSpecs(target).some((s) => s.name === name && !s.writable)
    ? `--type ${name} 只索引，不能 remember`
    : `--type 未在该层登记为可写类型: ${name}。已登记可写类型: ${layerWritableTypes(target).join(", ") || "(none)"}`;
}
export function gitignorePatterns(
  name: string,
  module = moduleForType(name),
  indexFile = indexFileName(name, module),
): string[] {
  const directory = dirname(indexFile);
  return [`${directory}/`, `**/${directory}/`];
}
export const findGitRoot = (start: string) =>
  ancestors(start).find((p) => fs.existsSync(join(p, ".git")));
export function ensureTypeGitignore(
  root: string,
  name: string,
  module = moduleForType(name),
  indexFile?: string,
): string {
  if (!fs.existsSync(join(root, ".git"))) return "skipped-no-git";
  const file = assertScopePath(join(root, ".gitignore"), root);
  const before = fs.existsSync(file) ? readText(file) : "";
  const missing = gitignorePatterns(name, module, indexFile).filter(
    (p) => !before.split(/\r?\n/).includes(p),
  );
  if (!missing.length) return "preserved";
  writeAtomic(
    file,
    `${before.trimEnd()}\n\n# Private harness type ${name}\n${missing.join("\n")}\n`,
  );
  return "updated";
}
export function ensureLayerTypeGitignore(
  target: string,
  name: string,
  destinations: readonly string[] = [],
): void {
  const spec = layerTypeSpecs(target).find((s) => s.name === name),
    root = findGitRoot(target);
  if (spec?.gitignore && root) {
    ensureTypeGitignore(root, name, spec.module, spec.indexFile);
    const files = [join(target, spec.indexFile), ...destinations];
    // Ignored parent directories also cover writeAtomic's private temporary files.
    assertPrivateIgnored(root, files, files.map(dirname));
  }
}
export function upsertLocalTypeLine(
  document: string,
  indexFile: string,
  description: string,
): string {
  const block = document.match(blockPattern(LOCAL_START, LOCAL_END))?.[0];
  if (!block) throw new Error("AGENTS.md 缺少本层记忆区块，请先 init");
  if (
    new RegExp(
      `^- \\[[^\\]]*\\]\\(${escapeRegExp(indexFile)}\\)(?: — .*)?$`,
      "m",
    ).test(block)
  )
    return document;
  const line = renderLine(ENTRY_LINE_TEMPLATE, {
    title: indexFile,
    path: indexFile,
    description,
  });
  return document.replace(blockPattern(LOCAL_START, LOCAL_END), () =>
    block.replace(LOCAL_END, () => `${line}\n${LOCAL_END}`),
  );
}
export function selectedLocalBlock(specs: TypeSpec[]): string {
  let block = buildLocalBlock().replace(
    /^- \[.*\]\(\.harness\/.*\).*\n?/gm,
    "",
  );
  for (const spec of specs)
    block = upsertLocalTypeLine(
      block,
      spec.indexFile,
      spec.description || spec.name,
    );
  return block;
}
