import { realPath } from './paths.js';
import { loadMemoryDocument, saveMemoryDocument } from './node-documents.js';
import { escapeIndexText, encodeIndexPath } from "../../models/memory/index-rendering.js";
import * as fs from "node:fs";
import { basename, dirname, join, parse } from "node:path";
import { ENTRIES_START, ENTRIES_END, indexFiles, upsertBlock, } from "./blocks.js";
import { assertScopePath, isExternalType, isFile, listTypeFiles, readText, relativeLink, typeContentDir, typeIndexPath, writeAtomic, } from "./paths.js";
import { discoverLayerTypes, ensureLayerTypeGitignore, indexFileName, layerTypeSpecs, layerWritableTypes, rejectUnwritableType, typeIndexTemplateName, } from "./types.js";
import { ENTRY_LINE_TEMPLATE, ENTRY_OUTPUT_PATTERN, fillPlaceholders, readIndexTemplate, readTemplate, renderLine, } from "./templates.js";
import { frontmatterData, logicalFields, FLAT_COMPAT_KEYS, preserveEntryMetadata, } from "../../models/memory/documents.js";
import { ORIGIN_FIELDS, AUDIT_FIELDS, nowTimestamp } from "./provenance.js";
export const SKILL_OUTPUT_NAME = "SKILL.md";
export const AGENT_SKILL_FORMAT_TYPES = new Set(["managed", "referenced"]);
export const memoryEntryTypes = (target?: string) => target
    ? layerWritableTypes(target)
    : Object.keys(indexFiles()).filter((n) => !isExternalType(n));
export const isSkillFormat = (target: string, name: string) => AGENT_SKILL_FORMAT_TYPES.has(name) ||
    layerTypeSpecs(target).some((s) => s.name === name && s.format === "skills");
export const entryOutputName = (name: string, target?: string) => (target ? isSkillFormat(target, name) : AGENT_SKILL_FORMAT_TYPES.has(name))
    ? SKILL_OUTPUT_NAME
    : ENTRY_OUTPUT_PATTERN;
export const entryName = (file: string, name: string, target?: string) => (entryOutputName(name, target) === SKILL_OUTPUT_NAME || basename(file) === 'index.md')
    ? basename(dirname(file))
    : parse(file).name;
export const parseFrontmatter = (file: string): Record<string, string> => logicalFields(frontmatterData(readText(file)));
export const topLevelFrontmatterKeys = (file: string) => new Set(Object.keys(frontmatterData(readText(file))));
export const hasLegacyFlatFrontmatter = (file: string) => FLAT_COMPAT_KEYS.some((k) => topLevelFrontmatterKeys(file).has(k));
export const yamlScalar = (value: string) => JSON.stringify(value.split(/\s+/).join(" ").trim());
export function renderEntry(fields: Record<string, string>, content: string, outputName = ENTRY_OUTPUT_PATTERN, previousSource?: string): string {
    if (!content.trim())
        throw new Error("content 不能为空");
    const template = readTemplate(outputName), declared = new Set([...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
    const undeclared = Object.keys(fields).filter((k) => fields[k] && !declared.has(k));
    if (undeclared.length)
        throw new Error(`${outputName} 缺少占位符，字段会丢失: ${undeclared.join(", ")}`);
    const values = Object.fromEntries(Object.entries(fields)
        .filter(([, v]) => v)
        .map(([k, v]) => [k, yamlScalar(v)]));
    values.content = content.trim();
    return preserveEntryMetadata(fillPlaceholders(template, values).trimEnd() + "\n", previousSource);
}
export function resolveMemoryPath(target: string, name: string, slug?: string, format?: "file" | "directory"): string {
    if (format !== undefined && format !== "file" && format !== "directory") throw new Error("Invalid entry format");
    if (!memoryEntryTypes(target).includes(name))
        throw new Error(rejectUnwritableType(target, name));
    const normalized = (slug ?? "").trim().toLowerCase(), directory = typeContentDir(target, name);
    if (isSkillFormat(target, name)) {
        if (format === "file") throw new Error("Skill requires directory format");
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) ||
            normalized.length > 64)
            throw new Error(`--slug 在 ${name} 里是技能目录名，必须是 kebab-case 且不超过 64 字符`);
        return assertScopePath(join(directory, normalized, SKILL_OUTPUT_NAME), target);
    }
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(normalized))
        throw new Error("--slug 必须是小写 snake_case，例如 reuse_existing_constants");
    if (Object.keys(discoverLayerTypes(target)).some((n) => normalized.startsWith(`${n}_`)))
        throw new Error("--slug 不要带类型前缀，脚本会按 --type 自动加上");
    const flat = assertScopePath(join(directory, `${name}_${normalized}.md`), target);
    const owned = assertScopePath(join(directory, `${name}_${normalized}`, 'index.md'), target);
    if (fs.existsSync(flat) && fs.existsSync(owned)) throw new Error('Ambiguous file and directory memory entries');
    if (fs.existsSync(flat) || fs.existsSync(owned)) {
        const existingFormat = fs.existsSync(owned) ? 'directory' : 'file';
        if (format && format !== existingFormat) throw new Error('Existing memory layout differs; implicit conversion is not supported');
        return existingFormat === 'directory' ? owned : flat;
    }
    return format === 'directory' ? owned : flat;
}
export function buildEntryFields(name: string, type: string, title: string | undefined, description: string | undefined, existing: Record<string, string>, detected: Record<string, string>, overrides: Record<string, string | undefined>, target?: string): Record<string, string> {
    const skill = target
        ? isSkillFormat(target, type)
        : AGENT_SKILL_FORMAT_TYPES.has(type), resolvedTitle = (title || existing.title || "").trim(), resolvedDescription = (description || existing.description || "").trim();
    if (!resolvedTitle && !skill)
        throw new Error("新建记忆必须提供 --title");
    if (!resolvedDescription)
        throw new Error("新建记忆必须提供 --description");
    const fields: Record<string, string> = {
        name,
        title: resolvedTitle,
        description: resolvedDescription,
    };
    if (!skill)
        fields.type = type;
    for (const key of ORIGIN_FIELDS) {
        const value = overrides[key] || existing[key] || detected[key];
        if (value)
            fields[key] = value;
    }
    for (const key of AUDIT_FIELDS) {
        const value = overrides[key] || detected[key] || existing[key];
        if (value)
            fields[key] = value;
    }
    fields.updatedAt = nowTimestamp();
    return fields;
}
export function buildEntryIndex(target: string, name: string): string {
    const base = dirname(typeIndexPath(target, name));
    const files = listTypeFiles(target, name, isSkillFormat(target, name) ? "*/SKILL.md" : `${name}_*.md`);
    const entries = files.map((file) => {
        const fields = parseFrontmatter(file);
        return renderLine(ENTRY_LINE_TEMPLATE, {
            title: escapeIndexText(fields.title || fields.name || entryName(file, name, target)),
            path: encodeIndexPath(relativeLink(isExternalType(name) ? file : realPath(file), base)),
            description: escapeIndexText(fields.description || "缺少 description，请补齐 frontmatter。"),
        });
    });
    return [
        ENTRIES_START,
        entries.join("\n") || "- 暂无条目。",
        ENTRIES_END,
    ].join("\n");
}
export function expectedIndexDocument(target: string, name: string, source?: string): string {
    const file = assertScopePath(join(target, discoverLayerTypes(target)[name] ?? indexFileName(name)), target);
    const existing = source ?? (isFile(file)
        ? readText(file)
        : readIndexTemplate(typeIndexTemplateName(name), name, name));
    return (upsertBlock(existing, ENTRIES_START, ENTRIES_END, buildEntryIndex(target, name)).trimEnd() + "\n");
}
export async function refreshIndex(target: string, name: string): Promise<string> {
    target = realPath(target);
    const file = assertScopePath(join(target, discoverLayerTypes(target)[name] ?? indexFileName(name)), target);
    ensureLayerTypeGitignore(target, name);
    if (name in discoverLayerTypes(target) && !isExternalType(name))
        fs.mkdirSync(dirname(file), { recursive: true });
    const document = await loadMemoryDocument(target, file);
    const existed = document.existed, before = document.node.serialize();
    const source = existed ? before : readIndexTemplate(typeIndexTemplateName(name), name, name);
    const after = expectedIndexDocument(target, name, source);
    if (!existed || before !== after) {
        await saveMemoryDocument(document, after);
        return existed ? "updated" : "created";
    }
    return "preserved";
}
