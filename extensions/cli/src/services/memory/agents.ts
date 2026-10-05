export { ownershipTarget } from './paths.js';
import { InternalNode } from '../../models/internal-node.js';
import { discoverScopes } from '../scope.js';
import { loadMemoryDocument, saveMemoryDocument, type MemoryDocument } from './node-documents.js';
import { join, dirname, basename, relative } from "node:path";
import { AUTO_START, CHILDREN_START, CHILDREN_END, IMPORTANT_START, LOCAL_START, LOCAL_END, OUTER_START, INDEX_ENTRY_PATTERN, blockPattern, buildChildrenBlock, ensureImportantBlock, escapeRegExp, insertInnerBlock, renderAgentsDocument, upsertBlock, } from "./blocks.js";
import { AGENTS_FILE_NAME, ancestors, assertScopePath, isFile, isScope, readText, realPath, ownershipTarget, within, writeAtomic, } from "./paths.js";
import { ENTRY_LINE_TEMPLATE, renderLine } from "./templates.js";
import { layerTypeSpecs, selectedLocalBlock, upsertLocalTypeLine, } from "./types.js";
export function classifyAgentsSource(source: string | undefined): "missing" | "managed" | "foreign" {
    if (source === undefined) return 'missing';
    return [OUTER_START, IMPORTANT_START, LOCAL_START, CHILDREN_START, AUTO_START].some(marker => source.includes(marker)) ? 'managed' : 'foreign';
}
export function classifyAgentsFile(file: string): "missing" | "managed" | "foreign" {
    return classifyAgentsSource(isFile(file) ? readText(file) : undefined);
}
async function syncLoadedAgents(document: MemoryDocument, directory: string, local: string, children: string): Promise<string> {
    const existing = document.existed ? document.node.serialize() : undefined;
    const state = classifyAgentsSource(existing);
    if (state === 'foreign') return 'needs-doctor';
    if (existing === undefined) {
        await saveMemoryDocument(document, renderAgentsDocument(basename(directory), local, children));
        return 'created';
    }
    let updated = ensureImportantBlock(existing);
    if (local) updated = upsertBlock(updated, LOCAL_START, LOCAL_END, local);
    if (children) updated = upsertBlock(updated, CHILDREN_START, CHILDREN_END, children);
    if (updated === existing) return 'preserved';
    await saveMemoryDocument(document, updated);
    return 'updated';
}
export async function syncAgentsBlocks(directory: string, local = "", children = ""): Promise<string> {
    const document = await loadMemoryDocument(directory, join(directory, AGENTS_FILE_NAME));
    return syncLoadedAgents(document, directory, local, children);
}
export async function syncTargetAgents(target: string, _root: string): Promise<string> {
    const document = await loadMemoryDocument(target, join(target, AGENTS_FILE_NAME));
    const specs = layerTypeSpecs(target);
    let local = document.node.serialize().match(blockPattern(LOCAL_START, LOCAL_END))?.[0] ?? selectedLocalBlock([]);
    for (const spec of specs) local = upsertLocalTypeLine(local, spec.indexFile, spec.description || spec.name);
    return syncLoadedAgents(document, target, local, '');
}
export const normalizeIndexDescription = (target: string, description?: string) => description?.trim().replace(/\s+/g, " ") ||
    `${basename(target)} 目录的项目记忆与规范入口。`;
export function mergeIndexEntry(document: string, relativeAgents: string, entry: string, descriptionGiven: boolean): [
    string,
    boolean
] {
    const pattern = blockPattern(CHILDREN_START, CHILDREN_END), block = document.match(pattern)?.[0];
    if (!block)
        return [
            insertInnerBlock(document, CHILDREN_START, buildChildrenBlock(entry)),
            true,
        ];
    const entryPattern = new RegExp(`^- \\[[^\\]]*\\]\\(${escapeRegExp(relativeAgents)}\\)(?: — .*)?$`, "m");
    if (entryPattern.test(block) && !descriptionGiven)
        return [document, false];
    const updated = entryPattern.test(block)
        ? block.replace(entryPattern, () => entry)
        : block.replace(CHILDREN_END, () => `${entry}\n${CHILDREN_END}`);
    return updated === block
        ? [document, false]
        : [document.replace(pattern, () => updated), true];
}
export const ancestorsUpTo = (start: string, root: string) => within(start, root)
    ? ancestors(start).filter((p) => within(p, root))
    : [start];
export function readOwnershipEntries(file: string) {
    return isFile(file) ? new InternalNode(file).parse(readText(file)).children : [];
}
export function readIndexEntries(file: string): [string, string][] {
    return (isFile(file) ? new InternalNode(file).parse(readText(file)).descendantChildren : [])
        .filter(entry => entry.id.endsWith('AGENTS.md'))
        .map(entry => [relative(dirname(file), entry.id), entry.description ?? '']);
}
export function registeredIndexAnchors(target: string, root: string): string[] {
    return discoverScopes(root).filter(owner => readOwnershipEntries(join(owner, AGENTS_FILE_NAME))
        .some(entry => realPath(entry.id) === realPath(join(target, AGENTS_FILE_NAME))));
}
async function dropLoadedIndexEntries(document: MemoryDocument, relatives: Set<string>): Promise<boolean> {
    if (!(document.node instanceof InternalNode)) throw new Error('Expected an AGENTS node');
    const before = document.node.serialize();
    for (const reference of document.node.descendantChildren) if (relatives.has(relative(document.node.directoryPath, reference.id))) document.node.removeChild(reference.id);
    const after = document.node.serialize();
    if (after === before) return false;
    await saveMemoryDocument(document, after);
    return true;
}

export async function dropIndexEntries(file: string, relatives: Set<string>): Promise<boolean> {
    const document = await loadMemoryDocument(dirname(file), file);
    return dropLoadedIndexEntries(document, relatives);
}
export function findIndexAnchor(target: string, root: string): string {
    if (target === root)
        return root;
    const registered = registeredIndexAnchors(target, root);
    if (registered.length) return registered[0]!;
    for (const candidate of ancestors(dirname(target))) {
        if (candidate === root)
            break;
        if (isScope(candidate))
            return candidate;
    }
    return root;
}
export async function syncIndexEntry(anchor: string, target: string, description?: string): Promise<[
    string,
    string | null,
    string | null
]> {
    if (anchor === target)
        return ["not-applicable", null, null];
    const file = assertScopePath(join(anchor, AGENTS_FILE_NAME), anchor), rel = join(relative(anchor, target), AGENTS_FILE_NAME), normalized = normalizeIndexDescription(target, description);
    const document = await loadMemoryDocument(anchor, file);
    const existing = document.existed ? document.node.serialize() : undefined;
    const state = classifyAgentsSource(existing);
    if (!(document.node instanceof InternalNode)) throw new Error('Expected an AGENTS node');
    const registered = document.node.children.find(entry => realPath(entry.id) === realPath(join(target, AGENTS_FILE_NAME)));
    if (registered) {
        if (description === undefined || registered.description === normalized) return ["preserved", relative(anchor, registered.id), null];
        document.node.updateChild(registered.id, { description: normalized });
        await saveMemoryDocument(document, document.node.serialize());
        return ["updated", relative(anchor, registered.id), normalized];
    }
    if (state === "foreign") {
        document.node.addChild('descendant', { id: join(anchor, rel), description: normalized });
        await saveMemoryDocument(document, document.node.serialize());
        return ["updated", rel, normalized];
    }
    const entry = renderLine(ENTRY_LINE_TEMPLATE, {
        title: rel,
        path: rel,
        description: normalized,
    });
    if (state === "missing") {
        await saveMemoryDocument(document, renderAgentsDocument(basename(anchor), selectedLocalBlock(layerTypeSpecs(anchor)), buildChildrenBlock(entry)));
        return ["created", rel, normalized];
    }
    const [updated, changed] = mergeIndexEntry(existing!, rel, entry, description !== undefined);
    if (updated === existing)
        return ["preserved", rel, changed ? normalized : null];
    await saveMemoryDocument(document, updated);
    return ["updated", rel, changed ? normalized : null];
}
