import { existsSync } from "node:fs";
import { relative } from "node:path";
import {
  isScope,
  readText,
  rejectLegacy,
  resolveRoot,
  resolveTarget,
  typeIndexPath,
  writeAtomic,
} from "./paths.js";
import { ensureLayerTypeGitignore } from "./types.js";
import {
  AUDIT_FIELDS,
  ORIGIN_FIELDS,
  agentContext,
  gitIdentity,
} from "./provenance.js";
import { syncTargetAgents } from "./agents.js";
import {
  buildEntryFields,
  entryName,
  entryOutputName,
  refreshIndex,
  renderEntry,
  resolveMemoryPath,
} from "./entries.js";
import { logicalFields, strictFrontmatterData } from "./documents.js";
export interface RememberMemoryOptions {
  targetDir: string;
  type: string;
  slug: string;
  title?: string;
  description?: string;
  content: string;
  originSessionId?: string;
  agentClient?: string;
  username?: string;
  email?: string;
  env?: NodeJS.ProcessEnv;
}
export function rememberMemory(options: RememberMemoryOptions) {
  const target = resolveTarget(options.targetDir);
  rejectLegacy(target);
  if (!isScope(target)) throw new Error("目标目录尚未初始化，请先执行 init");
  const file = resolveMemoryPath(target, options.type, options.slug),
    exists = existsSync(file),
    previousSource = exists ? readText(file) : undefined,
    existing =
      previousSource === undefined
        ? {}
        : logicalFields(strictFrontmatterData(previousSource)),
    detected = { ...agentContext(options.env), ...gitIdentity(target) },
    name = entryName(file, options.type, target);
  const fields = buildEntryFields(
    name,
    options.type,
    options.title,
    options.description,
    existing,
    detected,
    {
      originSessionId: options.originSessionId,
      agentClient: options.agentClient,
      username: options.username,
      email: options.email,
    },
    target,
  );
  const rendered = renderEntry(
    fields,
    options.content,
    entryOutputName(options.type, target),
    previousSource,
  );
  ensureLayerTypeGitignore(target, options.type, [file]);
  writeAtomic(file, rendered);
  refreshIndex(target, options.type);
  const agentsAction = syncTargetAgents(target, resolveRoot(target));
  return {
    operation: "remember",
    targetDir: target,
    type: options.type,
    name,
    title: fields.title || name,
    path: relative(target, file),
    index: relative(target, typeIndexPath(target, options.type)),
    action: exists ? "updated" : "created",
    agentsAction,
    provenance: Object.fromEntries(
      [...ORIGIN_FIELDS, ...AUDIT_FIELDS]
        .filter((k) => fields[k])
        .map((k) => [k, fields[k]]),
    ),
  };
}
