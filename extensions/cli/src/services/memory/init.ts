import { loadMemoryDocument, saveMemoryDocument } from './node-documents.js';
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { assertPrivateIgnored } from "./ignore.js";
import { loadAgentsTemplate } from "./blocks.js";
import { AGENTS_FILE_NAME, assertScopePath, memoryDir, rejectLegacy, resolveRoot, resolveTarget, writeAtomic, } from "./paths.js";
import { readIndexTemplate } from "./templates.js";
import { MEMORY_TYPE_NAMES, SKILL_TYPE_NAMES, ensureTypeGitignore, findGitRoot, layerTypeSpecs, seedSpec, typeIndexTemplateName, } from "./types.js";
import { findIndexAnchor, rehomeIndexEntries, syncIndexEntry, syncTargetAgents, } from "./agents.js";
import { refreshIndex } from "./entries.js";
export interface InitMemoryOptions {
    targetDir: string;
    rootDir?: string;
    description?: string;
    memoryTypes?: readonly string[];
    skillTypes?: readonly string[];
}
export async function initMemory(options: InitMemoryOptions) {
    const target = resolveTarget(options.targetDir), root = resolveRoot(target, options.rootDir);
    rejectLegacy(target);
    if (target !== root) {
        rejectLegacy(root);
        assertScopePath(join(root, AGENTS_FILE_NAME), root);
    }
    loadAgentsTemplate();
    const specs = new Map(layerTypeSpecs(target).map((s) => [s.name, s]));
    if (!specs.size &&
        options.memoryTypes === undefined &&
        options.skillTypes === undefined)
        return {
            operation: "init",
            targetDir: target,
            selectionRequired: true,
            recommendations: {
                modules: ["memory", "skills", "tasks"],
                memoryTypes: [...MEMORY_TYPE_NAMES],
                skillTypes: [...SKILL_TYPE_NAMES],
            },
        };
    for (const [module, selected, allowed] of [
        ["memory", options.memoryTypes, MEMORY_TYPE_NAMES],
        ["skills", options.skillTypes, SKILL_TYPE_NAMES],
    ] as const)
        for (const name of selected ?? []) {
            if (!(allowed as readonly string[]).includes(name))
                throw new Error(`Unknown ${module} type: ${name}; register custom types with add-type`);
            if (!specs.has(name))
                specs.set(name, seedSpec(name));
        }
    if (!specs.size)
        throw new Error("Select at least one memory or skill type");
    assertScopePath(join(target, AGENTS_FILE_NAME), target);
    for (const spec of specs.values())
        assertScopePath(join(target, spec.indexFile), target);
    const created: string[] = [], preserved: string[] = [], diagnostics: {
        code: string;
        type: string;
        message: string;
    }[] = [];
    for (const spec of specs.values()) {
        const gitRoot = findGitRoot(target);
        if (spec.gitignore && gitRoot)
            ensureTypeGitignore(gitRoot, spec.name, spec.module, spec.indexFile);
        const file = join(target, spec.indexFile);
        if (spec.gitignore)
            assertPrivateIgnored(gitRoot ?? target, [file], [dirname(file)]);
        const document = await loadMemoryDocument(target, file);
        if (document.existed)
            preserved.push(spec.indexFile);
        else {
            await saveMemoryDocument(document, readIndexTemplate(typeIndexTemplateName(spec.name), spec.name, spec.description, {
                module: spec.module,
                format: spec.format,
                writable: String(spec.writable),
                gitignore: String(spec.gitignore),
            }));
            created.push(spec.indexFile);
        }
    }
    for (const name of specs.keys())
        try {
            await refreshIndex(target, name);
        }
        catch (error) {
            diagnostics.push({
                code: "source-scan-error",
                type: name,
                message: String(error instanceof Error ? error.message : error),
            });
        }
    const agentsAction = await syncTargetAgents(target, root);
    if (target !== root)
        await syncTargetAgents(root, root);
    const anchor = findIndexAnchor(target, root), rehomed = target !== root
        ? await rehomeIndexEntries(target, anchor, root) : { inherited: [], detached: [] }, [indexAction, indexEntry, indexDescription] = await syncIndexEntry(anchor, target, options.description);
    return {
        operation: "init",
        targetDir: target,
        memoryDir: memoryDir(target),
        agentsMd: join(target, AGENTS_FILE_NAME),
        agentsAction,
        rootDir: root,
        rootAgentsMd: join(root, AGENTS_FILE_NAME),
        indexAnchor: anchor,
        indexAction,
        indexEntry,
        indexDescription,
        inheritedEntries: rehomed.inherited,
        detachedEntries: rehomed.detached,
        created,
        preserved,
        selectionRequired: false,
        complete: !diagnostics.length,
        diagnostics,
    };
}
