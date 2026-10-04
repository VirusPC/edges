import { join, dirname, relative } from "node:path";
import { assertPrivateIgnored } from "./ignore.js";
import {
  AGENTS_FILE_NAME,
  assertScopePath,
  isFile,
  isScope,
  readText,
  rejectLegacy,
  resolveTarget,
  writeAtomic,
} from "./paths.js";
import { readIndexTemplate } from "./templates.js";
import {
  ensureTypeGitignore,
  findGitRoot,
  indexFileName,
  layerTypeSpecs,
  typeIndexTemplateName,
  upsertLocalTypeLine,
  validateTypeName,
} from "./types.js";
import { refreshIndex } from "./entries.js";
export interface AddMemoryTypeOptions {
  targetDir: string;
  name: string;
  description: string;
  module?: "memory" | "skills";
  gitignore?: boolean;
  indexOnly?: boolean;
  skillsFormat?: boolean;
  externalContentDir?: unknown;
}
export function addMemoryType(options: AddMemoryTypeOptions) {
  if (options.externalContentDir !== undefined)
    throw new Error(
      "external content root is stubbed this round; only official referenced may use an external content source",
    );
  const target = resolveTarget(options.targetDir);
  rejectLegacy(target);
  const module = options.module ?? "memory";
  if (!["memory", "skills"].includes(module))
    throw new Error("module must be memory or skills");
  const name = validateTypeName(options.name),
    description = (options.description ?? "").trim().replace(/\s+/g, " ");
  if (!description) throw new Error("add-type 必须提供 --description");
  if (!isScope(target)) throw new Error("目标目录尚未初始化，请先执行 init");
  const indexName = indexFileName(name, module),
    file = assertScopePath(join(target, indexName), target),
    existing = layerTypeSpecs(target),
    adopted = existing.find((s) => s.name === name);
  if (adopted && adopted.indexFile !== indexName)
    throw new Error("Type already belongs to another module");
  const conflict = existing.find(
    (s) => s.indexFile === indexName && s.name !== name,
  );
  if (conflict)
    throw new Error(
      `Type path already belongs to ${conflict.name}: ${indexName}`,
    );
  const gitignore = adopted?.gitignore ?? options.gitignore ?? false,
    writable = adopted?.writable ?? !options.indexOnly,
    format = adopted?.format ?? (options.skillsFormat ? "skills" : "ordinary"),
    root = findGitRoot(target);
  if (gitignore && root) ensureTypeGitignore(root, name, module, indexName);
  if (gitignore) assertPrivateIgnored(root ?? target, [file], [dirname(file)]);
  const existed = isFile(file);
  if (!existed)
    writeAtomic(
      file,
      readIndexTemplate(typeIndexTemplateName(name), name, description, {
        module,
        gitignore: String(gitignore),
        writable: String(writable),
        format,
      }),
    );
  refreshIndex(target, name);
  const agents = assertScopePath(join(target, AGENTS_FILE_NAME), target),
    before = readText(agents),
    after = upsertLocalTypeLine(before, indexName, description);
  if (before !== after) writeAtomic(agents, after);
  const gitignoreAction = gitignore
    ? root
      ? ensureTypeGitignore(root, name, module, indexName)
      : "skipped-no-git"
    : null;
  return {
    operation: "add-type",
    targetDir: target,
    type: name,
    module,
    index: indexName,
    contentDir: relative(target, dirname(file)),
    agentsAction: before === after ? "preserved" : "updated",
    action: existed ? "preserved" : "created",
    gitignoreAction,
    flags: { gitignore, writable, format, gitignoreAction },
  };
}
