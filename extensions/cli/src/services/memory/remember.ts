import { MemoryNode, SkillNode } from '../../models/index.js';
import { memoryNodes } from './node-documents.js';
import { existsSync } from "node:fs";
import { relative } from "node:path";
import { isScope, rejectLegacy, resolveRoot, resolveTarget, typeIndexPath, } from "./paths.js";
import { ensureLayerTypeGitignore } from "./types.js";
import { AUDIT_FIELDS, ORIGIN_FIELDS, agentContext, gitIdentity, } from "./provenance.js";
import { syncTargetAgents } from "./agents.js";
import { buildEntryFields, entryName, entryOutputName, refreshIndex, renderEntry, resolveMemoryPath, } from "./entries.js";
import { logicalFields, strictFrontmatterData } from "../../models/memory/documents.js";
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
export async function rememberMemory(options: RememberMemoryOptions) {
    const target = resolveTarget(options.targetDir);
    rejectLegacy(target);
    if (!isScope(target))
        throw new Error("目标目录尚未初始化，请先执行 init");
    const file = resolveMemoryPath(target, options.type, options.slug);
    const exists = existsSync(file), service = memoryNodes(target);
    const Model = entryOutputName(options.type, target) === 'SKILL.md' ? SkillNode : MemoryNode;
    const node = exists ? await service.get<MemoryNode | SkillNode>(file, Model) : new Model(file);
    if (!node) throw new Error(`Missing memory entry: ${file}`);
    // Derive edits from the same snapshot that NodeService will validate on save.
    const previousSource = exists ? node.serialize() : undefined;
    const existing = previousSource === undefined ? {} : logicalFields(strictFrontmatterData(previousSource));
    const detected = { ...agentContext(options.env), ...gitIdentity(target) };
    const name = entryName(file, options.type, target);
    const fields = buildEntryFields(name, options.type, options.title, options.description, existing, detected, {
        originSessionId: options.originSessionId,
        agentClient: options.agentClient,
        username: options.username,
        email: options.email,
    }, target);
    const rendered = renderEntry(fields, options.content, entryOutputName(options.type, target), previousSource);
    ensureLayerTypeGitignore(target, options.type, [file]);
    node.parse(rendered);
    node.description = fields.description;
    if (node instanceof MemoryNode)
        node.memoryType = options.type;
    else
        node.name = name;
    if (exists)
        await service.update(node);
    else
        await service.create(node);
    await refreshIndex(target, options.type);
    const agentsAction = await syncTargetAgents(target, resolveRoot(target));
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
        provenance: Object.fromEntries([...ORIGIN_FIELDS, ...AUDIT_FIELDS]
            .filter((k) => fields[k])
            .map((k) => [k, fields[k]])),
    };
}
