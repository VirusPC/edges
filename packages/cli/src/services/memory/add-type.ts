import { materialHarnessRoot, type MaterialOptions } from "../../domain/config/edges-materials.js";
import { AgentsNode } from "../../domain/models/agents/agents-node.js";
import { memoryNodes, prepareMemoryWrite } from './service.js';
import { NodeService } from '../node/node-service.js';
import { parseDocument } from '../../utils/markdown/document.js';
import { join, dirname, relative } from "node:path";
import { assertPrivateIgnored } from "./ignore.js";
import { AGENTS_FILE_NAME, assertScopePath, isFile, isScope, readText, rejectLegacy, resolveTarget, } from "./paths.js";
import { readIndexTemplate } from "./templates.js";
import { ensureTypeGitignore, findGitRoot, indexFileName, layerTypeSpecs, typeIndexTemplateName, validateTypeName, } from "./types.js";
import { ensureScopeReadme, ensureScopeReadmePointer, linkScopeReadme } from "../init/service.js";
import { refreshIndex, typeIndexNode } from "./entries.js";
export interface AddMemoryTypeOptions extends MaterialOptions {
    targetDir: string;
    name: string;
    description: string;
    module?: "memory" | "skills";
    gitignore?: boolean;
    indexOnly?: boolean;
    skillsFormat?: boolean;
    externalContentDir?: unknown;
}
export async function addMemoryType(options: AddMemoryTypeOptions) {
    if (options.externalContentDir !== undefined)
        throw new Error("external content root is stubbed this round; only official referenced may use an external content source");
    const target = resolveTarget(options.targetDir);
    rejectLegacy(target);
    const module = options.module ?? "memory";
    if (!["memory", "skills"].includes(module))
        throw new Error("module must be memory or skills");
    const name = validateTypeName(options.name), description = (options.description ?? "").trim().replace(/\s+/g, " ");
    if (!description)
        throw new Error("add-type 必须提供 --description");
    if (!isScope(target))
        throw new Error("目标目录尚未初始化，请先执行 init");
    const existing = layerTypeSpecs(target, options), adopted = existing.find((s) => s.name === name);
    if (adopted && adopted.module !== module)
        throw new Error("Type already belongs to another module");
    const indexName = adopted?.indexFile ?? relative(target, join(materialHarnessRoot(target, options), indexFileName(name, module).slice(".edges/".length))), file = assertScopePath(join(target, indexName), target);
    const conflict = existing.find((s) => s.indexFile === indexName && s.name !== name);
    if (conflict)
        throw new Error(`Type path already belongs to ${conflict.name}: ${indexName}`);
    const gitignore = adopted?.gitignore ?? options.gitignore ?? false, writable = adopted?.writable ?? !options.indexOnly, format = adopted?.format ?? (options.skillsFormat ? "skills" : "ordinary"), root = findGitRoot(target);
    if (gitignore && root)
        ensureTypeGitignore(root, name, module, relative(root, file));
    if (gitignore)
        assertPrivateIgnored(root ?? target, [file], [dirname(file)]);
    const service = memoryNodes(target, options);
    await ensureScopeReadme(target, service, options);
    const entryPath = prepareMemoryWrite(target, file, options);
    const node = await service.get(entryPath);
    const existed = !!node;
    if (!existed)
        await service.create(typeIndexNode(entryPath), parseDocument(readIndexTemplate(typeIndexTemplateName(name), name, description, {
            module,
            gitignore: String(gitignore),
            writable: String(writable),
            format,
        })), { indexGroup: "local" });
    if (existed || options.project)
        await linkScopeReadme(target, { id: file, name: indexName, description }, service, options);
    await refreshIndex(target, name, service, options);
    let agentsAction = "not-applicable";
    if (!options.project) {
        const agents = assertScopePath(join(target, AGENTS_FILE_NAME), target);
        const before = (await service.get(prepareMemoryWrite(target, agents), AgentsNode))!.body;
        await ensureScopeReadmePointer(target, service, options);
        const after = (await service.get(prepareMemoryWrite(target, agents), AgentsNode))!.body;
        agentsAction = before === after ? "preserved" : "updated";
    }
    const gitignoreAction = gitignore
        ? root
            ? ensureTypeGitignore(root, name, module, relative(root, file))
            : "skipped-no-git"
        : null;
    return {
        operation: "add-type",
        targetDir: target,
        type: name,
        module,
        index: indexName,
        contentDir: relative(target, dirname(file)),
        agentsAction,
        action: existed ? "preserved" : "created",
        gitignoreAction,
        flags: { gitignore, writable, format, gitignoreAction },
    };
}
