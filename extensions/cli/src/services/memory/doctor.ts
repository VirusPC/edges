import { loadMemoryDocument, saveMemoryDocument } from './node-documents.js';
import * as fs from "node:fs";
import { join, dirname, relative } from "node:path";
import { IMPORTANT_START, LOCAL_START, LOCAL_END, blockPattern, insertInnerBlock, } from "./blocks.js";
import { AGENTS_FILE_NAME, assertScopePath, isScope, isSymlink, listTypeFiles, readText, realPath, rejectLegacy, relativeOrName, resolveRoot, resolveTarget, writeAtomic, } from "./paths.js";
import { layerTypeSpecs, selectedLocalBlock } from "./types.js";
import { classifyAgentsSource, classifyAgentsFile, dropIndexEntries, findIndexAnchor, readIndexEntries, syncIndexEntry, syncTargetAgents, registeredIndexAnchors, ownershipTarget, } from "./agents.js";
import { expectedIndexDocument, isSkillFormat, parseFrontmatter, refreshIndex, } from "./entries.js";
export interface MemoryFinding {
    code: string;
    issue: string;
    path: string;
    detail: string;
    owner?: string;
    type?: string;
    entry?: string;
    description?: string;
}
const safeScope = (owner: string): boolean => {
    try {
        return isScope(owner);
    }
    catch {
        return false;
    }
};
export function* walkOwners(root: string): Generator<string> {
    function* walk(owner: string): Generator<string> {
        if (owner === root ||
            safeScope(owner) ||
            fs.existsSync(join(owner, ".memory")) ||
            ["memory", "skills"].some((m) => fs.existsSync(join(owner, ".harness", m))))
            yield owner;
        for (const entry of fs
            .readdirSync(owner, { withFileTypes: true })
            .sort((a, b) => a.name.localeCompare(b.name))) {
            if (!entry.isDirectory() ||
                entry.isSymbolicLink() ||
                (entry.name.startsWith(".") && entry.name !== ".harness") ||
                entry.name === "node_modules")
                continue;
            const child = join(owner, entry.name);
            if (!fs.existsSync(join(child, ".git")))
                yield* walk(child);
        }
    }
    yield* walk(root);
}
export const discoverMemoryDirs = (root: string) => [...walkOwners(root)].filter(safeScope);
export const finding = (code: string, file: string, root: string, detail: string, extra: Partial<MemoryFinding> = {}): MemoryFinding => ({
    code,
    issue: code,
    path: relativeOrName(file, root),
    detail,
    ...extra,
});
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
export function collectFindings(root: string): MemoryFinding[] {
    const findings: MemoryFinding[] = [], owners = [...walkOwners(root)], scopes = new Set(owners.filter(safeScope));
    for (const owner of owners) {
        try {
            rejectLegacy(owner);
        }
        catch (error) {
            const code = errorText(error).includes("migration-required")
                ? "migration-required"
                : "unsafe-layout";
            findings.push(finding(code, owner, root, errorText(error)));
            continue;
        }
        let specs;
        try {
            specs = layerTypeSpecs(owner);
            assertScopePath(join(owner, AGENTS_FILE_NAME), owner);
        }
        catch (error) {
            findings.push(finding("unsafe-layout", owner, root, errorText(error)));
            continue;
        }
        if (!specs.length)
            continue;
        const agents = join(owner, AGENTS_FILE_NAME), state = classifyAgentsFile(agents);
        if (state !== "managed")
            findings.push(finding(state === "foreign" ? "foreign-agents" : "missing-agents", agents, root, "Attach managed blocks preserving manual text"));
        else {
            const text = readText(agents);
            if (!text.includes(IMPORTANT_START))
                findings.push(finding("missing-important", agents, root, "Missing constraints block"));
            const block = text.match(blockPattern(LOCAL_START, LOCAL_END))?.[0];
            if (!block)
                findings.push(finding("outdated-local", agents, root, "Missing type list"));
            else
                for (const spec of specs)
                    if (!block.includes(`](${spec.indexFile})`))
                        findings.push(finding("unregistered-type", join(owner, spec.indexFile), root, "Type is missing from scope list", { owner: relativeOrName(owner, root) }));
        }
        for (const spec of specs) {
            const index = join(owner, spec.indexFile);
            if (!fs.existsSync(index)) {
                findings.push(finding("missing-index", index, root, "Adopted type index is missing", { owner: relativeOrName(owner, root), type: spec.name }));
                continue;
            }
            let expected;
            try {
                expected = expectedIndexDocument(owner, spec.name);
                for (const entry of listTypeFiles(owner, spec.name, isSkillFormat(owner, spec.name) ? "*/SKILL.md" : `${spec.name}_*.md`))
                    if (!parseFrontmatter(entry).description)
                        findings.push(finding("invalid-entry", entry, root, "Missing closed frontmatter or description; source left unchanged"));
            }
            catch (error) {
                findings.push(finding("source-scan-error", index, root, errorText(error)));
                continue;
            }
            if (readText(index) !== expected)
                findings.push(finding("stale-index", index, root, "Rebuild entries from current source", { owner: relativeOrName(owner, root), type: spec.name }));
        }
        if (scopes.has(owner)) {
            const seen = new Set<string>();
            for (const [rel, description] of readIndexEntries(agents)) {
                if (seen.has(rel)) {
                    findings.push(finding("duplicate", agents, root, rel, {
                        entry: rel,
                        description,
                    }));
                    continue;
                }
                seen.add(rel);
                const target = ownershipTarget(owner, rel), child = target ? dirname(target) : '';
                if (!child || !safeScope(child) || isSymlink(child))
                    findings.push(finding("dead-entry", agents, root, rel, { entry: rel }));

            }
        }
    }
    for (const owner of [...scopes].sort()) {
        if (owner === root) continue;
        try {
            if (layerTypeSpecs(owner).length && !registeredIndexAnchors(owner, root).length)
                findings.push(finding("unregistered", owner, root, "Register adopted Memory under an entry"));
        } catch { /* unsafe-layout was reported above */ }
    }
    return findings;
}
export async function applyFindings(root: string, findings: MemoryFinding[]): Promise<string[]> {
    const repaired: string[] = [], blocked = new Set(findings
        .filter((f) => ["migration-required", "unsafe-layout"].includes(f.code))
        .map((f) => join(root, f.path)));
    for (const owner of walkOwners(root)) {
        if (blocked.has(owner))
            continue;
        try {
            const specs = layerTypeSpecs(owner);
            if (!specs.length)
                continue;
            const file = assertScopePath(join(owner, AGENTS_FILE_NAME), owner);
            const document = await loadMemoryDocument(owner, file);
            if (classifyAgentsSource(document.existed ? document.node.serialize() : undefined) === 'foreign') {
                await saveMemoryDocument(document, insertInnerBlock(document.node.serialize(), LOCAL_START, selectedLocalBlock(specs)));
            }
            const action = await syncTargetAgents(owner, root);
            if (action !== "preserved")
                repaired.push(`${action}-agents: ${relativeOrName(owner, root)}`);
            for (const spec of specs)
                try {
                    const action = await refreshIndex(owner, spec.name);
                    if (action !== "preserved")
                        repaired.push(`${action}-index: ${spec.indexFile}`);
                }
                catch {
                    /* Keep old index on failed scan. */
                }
        }
        catch {
            /* Unsafe owners remain reported by the second scan. */
        }
    }
    const registrations = new Map<string, { anchor: string; description?: string }>();
    for (const item of findings)
        if (["dead-entry", "misplaced", "duplicate"].includes(item.code) &&
            item.entry) {
            const file = join(root, item.path);
            if (blocked.has(dirname(file)))
                continue;
            assertScopePath(file, dirname(file));
            if (["misplaced", "duplicate"].includes(item.code))
                registrations.set(dirname(join(dirname(file), item.entry)), { anchor: dirname(file), description: item.description });
            if (await dropIndexEntries(file, new Set([item.entry])))
                repaired.push(`removed-entry: ${item.entry}`);
        }
    for (const item of findings.filter(f => f.code === 'unregistered')) {
        const owner = join(root, item.path);
        if (!registeredIndexAnchors(owner, root).length)
            registrations.set(owner, { anchor: findIndexAnchor(owner, root) });
    }
    for (const [owner, { anchor, description }] of registrations) {
        if (owner === root || blocked.has(owner) || blocked.has(anchor)) continue;
        const [action, entry] = await syncIndexEntry(anchor, owner, description);
        if (!["preserved", "not-applicable", "needs-doctor"].includes(action)) repaired.push(`registered: ${entry}`);
    }
    return repaired;
}
export interface DoctorMemoryOptions {
    targetDir: string;
    rootDir?: string;
    apply?: boolean;
}
export async function doctorMemory(options: DoctorMemoryOptions) {
    const root = resolveRoot(resolveTarget(options.targetDir), options.rootDir), applied = options.apply ?? false, findings = collectFindings(root), repaired = applied ? await applyFindings(root, findings) : [], remaining = applied ? collectFindings(root) : findings;
    return {
        operation: "doctor",
        rootDir: root,
        applied,
        memoryDirs: discoverMemoryDirs(root).map((p) => relativeOrName(p, root)),
        findings,
        repaired,
        remaining,
    };
}
