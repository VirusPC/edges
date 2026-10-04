import { isScope } from '../scope.js';
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { discoverLayerTypes } from "./types.js";
export const AGENTS_FILE_NAME = "AGENTS.md";
export const MEMORY_DIR_NAME = ".harness/memory";
export function readText(file: string): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    fs.readFileSync(file),
  );
}
export function isFile(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch (e) {
    if (["ENOENT", "ENOTDIR"].includes((e as NodeJS.ErrnoException).code ?? ""))
      return false;
    throw e;
  }
}
export function isDirectory(file: string): boolean {
  try {
    return fs.statSync(file).isDirectory();
  } catch (e) {
    if (["ENOENT", "ENOTDIR"].includes((e as NodeJS.ErrnoException).code ?? ""))
      return false;
    throw e;
  }
}
export function isSymlink(file: string): boolean {
  try {
    return fs.lstatSync(file).isSymbolicLink();
  } catch (e) {
    if (["ENOENT", "ENOTDIR"].includes((e as NodeJS.ErrnoException).code ?? ""))
      return false;
    throw e;
  }
}
export function within(file: string, owner: string): boolean {
  const rel = path.relative(owner, file);
  return (
    !rel ||
    (!rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel))
  );
}
/** Resolve missing leaves while still following existing symbolic ancestors. */
export function realPath(file: string): string {
  const absolute = path.resolve(file);
  try {
    return fs.realpathSync(absolute);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  if (isSymlink(absolute))
    return realPath(
      path.resolve(path.dirname(absolute), fs.readlinkSync(absolute)),
    );
  const parent = path.dirname(absolute);
  return parent === absolute
    ? absolute
    : path.join(realPath(parent), path.basename(absolute));
}
export function assertOwned(file: string, owner: string): string {
  if (!within(file, owner))
    throw new Error(`Path is outside selected owner: ${file}`);
  if (!within(realPath(file), realPath(owner)))
    throw new Error(`Path resolves outside selected owner: ${file}`);
  return file;
}
export function assertScopePath(file: string, target: string): string {
  assertOwned(file, target);
  for (let current = file; current !== target; current = path.dirname(current))
    if (isSymlink(current))
      throw new Error(`Managed path contains a symbolic link: ${current}`);
  return file;
}
export function rejectLegacy(target: string): void {
  if (
    fs.existsSync(path.join(target, ".memory")) ||
    (isFile(path.join(target, AGENTS_FILE_NAME)) &&
      readText(path.join(target, AGENTS_FILE_NAME)).includes("](.memory/"))
  )
    throw new Error(
      "migration-required: run project-memory-migrate before using this legacy layer",
    );
}
export function writeAtomic(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(
    path.dirname(file),
    `.memory-${randomUUID()}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, content, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}
export function resolveTarget(raw: string): string {
  const target = realPath(
    raw.startsWith("~/") ? path.join(homedir(), raw.slice(2)) : raw,
  );
  if (!isDirectory(target))
    throw new Error(`目标目录不存在或不是目录: ${target}`);
  return target;
}
export function ancestors(start: string): string[] {
  const result = [start];
  while (path.dirname(start) !== start) {
    start = path.dirname(start);
    result.push(start);
  }
  return result;
}
export { isScope } from '../scope.js';
export function resolveRoot(target: string, rawRoot?: string): string {
  if (rawRoot) {
    const root = resolveTarget(rawRoot);
    if (!within(target, root))
      throw new Error(`root-dir 必须是 target-dir 的祖先目录: ${root}`);
    for (const parent of ancestors(target)) {
      if (parent === root) break;
      if (fs.existsSync(path.join(parent, ".git")))
        throw new Error("root-dir cannot cross another Git root or submodule");
    }
    return root;
  }
  return (
    ancestors(target).find((p) => fs.existsSync(path.join(p, ".git"))) ??
    ancestors(target).find(isScope) ??
    target
  );
}
export const memoryDir = (target: string) => path.join(target, MEMORY_DIR_NAME);
export const moduleForType = (name: string): "memory" | "skills" =>
  ["managed", "referenced"].includes(name) ? "skills" : "memory";
export const typeDirName = (name: string) =>
  ["managed", "referenced"].includes(name) || name.endsWith("s")
    ? name
    : `${name}s`;
export const typeFromDirName = (name: string) =>
  (
    ({
      users: "user",
      feedbacks: "feedback",
      projects: "project",
      references: "reference",
    }) as Record<string, string>
  )[name] ?? name;
export const typeIndexRelpath = (name: string, module = moduleForType(name)) =>
  `.harness/${module}/${typeDirName(name)}/AGENTS.md`;
export const typeIndexPath = (target: string, name: string) =>
  path.join(target, discoverLayerTypes(target)[name] ?? typeIndexRelpath(name));
export const isExternalType = (name: string) => name === "referenced";
export const typeContentDir = (target: string, name: string) =>
  isExternalType(name)
    ? path.join(target, ".agents/skills")
    : path.dirname(typeIndexPath(target, name));
export const relativeOrName = (file: string, root: string) =>
  within(file, root) ? path.relative(root, file) || "." : path.basename(file);
export const relativeLink = (file: string, base: string) =>
  path.relative(base, file).split(path.sep).join("/");
export function listTypeFiles(
  target: string,
  name: string,
  pattern = "*.md",
): string[] {
  const directory = typeContentDir(target, name),
    external = isExternalType(name);
  if (!external) assertScopePath(directory, target);
  if (!fs.existsSync(directory))
    throw new Error(`source-scan-error: missing source ${directory}`);
  if (!isDirectory(directory))
    throw new Error(`source-scan-error: not a directory ${directory}`);
  const paths: string[] = [],
    seen = new Set<string>();
  for (const item of fs.readdirSync(directory).sort()) {
    const child = path.join(directory, item);
    if (isSymlink(child) && !fs.existsSync(child))
      throw new Error(`source-scan-error: broken link ${child}`);
    let candidate: string;
    if (pattern === "*/SKILL.md") {
      if (!isDirectory(child)) continue;
      candidate = path.join(child, "SKILL.md");
      if (!fs.existsSync(candidate)) {
        if (isSymlink(candidate))
          throw new Error(`source-scan-error: broken link ${candidate}`);
        continue;
      }
    } else {
      const matches =
        pattern === "*.md"
          ? item.endsWith(".md")
          : item.startsWith(`${name}_`) && item.endsWith(".md");
      if (!matches || !isFile(child)) continue;
      candidate = child;
    }
    if (!external) assertOwned(candidate, directory);
    readText(candidate);
    const real = realPath(candidate);
    if (!seen.has(real)) {
      seen.add(real);
      paths.push(candidate);
    }
  }
  return paths;
}
