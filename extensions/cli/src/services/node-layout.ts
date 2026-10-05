import {
  InternalSyntax,
  type SyntaxReference,
} from "../models/internal-syntax.js";
import { resolveEntryHref } from "../models/layout.js";
/** Filesystem facts and source-preserving relocation; no domain resources. */
import * as fs from "node:fs";
import path from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { Nodes } from "mdast";
import {
  BaseNode,
  InternalNode,
  LeafNode,
  TaskNode,
  MemoryNode,
  NoteNode,
  SkillNode,
} from "../models/index.js";
import {
  identifyNodeType,
  resolveHref,
  type DirectoryContract,
} from "../models/layout.js";
import { parseDocument } from "../utils/markdown/document.js";
import { checkPath } from "./node-files.js";
export type Model<T extends BaseNode = BaseNode> = new (file: string) => T;
export function within(file: string, root: string): boolean {
  return file === root || file.startsWith(root + path.sep);
}
export function coLocated(entry: string): boolean {
  return (
    path.basename(entry) === "AGENTS.md" &&
    ["SKILL.md", "index.md"].some((name) =>
      fs.existsSync(path.join(path.dirname(entry), name)),
    )
  );
}
export function physicalParent(
  entry: string,
  root: string,
  exists: (entry: string) => boolean = fs.existsSync,
): string | undefined {
  let dir = path.dirname(path.dirname(entry));
  // The .harness directory is a maintenance relation, never composition of its host.
  if (path.basename(path.dirname(entry)) === ".harness")
    dir = path.dirname(dir);
  while (within(dir, root)) {
    const candidate = path.join(dir, "AGENTS.md");
    if (exists(candidate)) return candidate;
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  return undefined;
}
export function indexContract(
  node: BaseNode,
): (DirectoryContract & { writable: boolean }) | undefined {
  if (!(node instanceof InternalNode)) return undefined;
  const match = node.body.match(
    /<!-- project-memory-type:start -->([\s\S]*?)<!-- project-memory-type:end -->/,
  );
  if (!match) return undefined;
  const fields =
    parseDocument(`---\n${match[1]!.trim()}\n---\n`).metadata ?? {};
  if (fields.writable !== undefined && typeof fields.writable !== "boolean")
    throw new Error(`Invalid type-index writable flag: ${node.path}`);
  return {
    ...fields,
    writable: fields.name !== "referenced" && fields.writable !== false,
  } as DirectoryContract & { writable: boolean };
}
export function modelAt(
  file: string,
  contract?: DirectoryContract,
  models?: Readonly<Record<string, Model>>,
): Model | undefined {
  const type = identifyNodeType(file, contract);
  if (!type) return undefined;
  const model =
    models?.[type] ??
    (
      {
        internal: InternalNode,
        leaf: LeafNode,
        skill: SkillNode,
        task: TaskNode,
        memory: MemoryNode,
        note: NoteNode,
      } as Record<string, Model>
    )[type];
  if (!model)
    throw new Error(`No registered node constructor for ${type}: ${file}`);
  return model;
}
/** Only used inside an explicitly selected lifecycle unit, never for list discovery. */
export function directoryEntries(root: string): string[] {
  const result: string[] = [];
  function visit(dir: string) {
    for (const name of fs.readdirSync(dir)) {
      const file = path.join(dir, name),
        stat = fs.lstatSync(file);
      if (stat.isSymbolicLink())
        throw new Error(`Node directory contains symbolic link: ${file}`);
      if (stat.isDirectory()) {
        if (![".git", "node_modules", ".agents"].includes(name)) visit(file);
      } else if (stat.isFile() && identifyNodeType(file)) result.push(file);
      else if (!stat.isFile())
        throw new Error(`Unsupported node directory entry: ${file}`);
    }
  }
  checkPath(root);
  visit(root);
  return result;
}
/** Rewrite Markdown destinations only, retaining source layout, titles and URL suffixes. */
export function rewriteLinks(
  source: string,
  oldEntry: string,
  newEntry: string,
  relocate: (target: string) => string,
): string {
  const changes: { start: number; end: number; value: string }[] = [];
  function visit(node: Nodes) {
    if (
      (node.type === "link" ||
        node.type === "image" ||
        node.type === "definition") &&
      node.position
    ) {
      const start = node.position.start.offset!,
        end = node.position.end.offset!;
      const text = source.slice(start, end);
      // Parsed child bounds already account for code spans, escapes and nested markup.
      // Images expose alt text rather than children, so parse their equivalent link label.
      let labelEnd: number;
      if (node.type === "link") {
        labelEnd =
          (node.children.at(-1)?.position?.end.offset ?? start + 1) - start;
      } else if (node.type === "image") {
        const paragraph = fromMarkdown(text.slice(1)).children[0];
        const link =
          paragraph?.type === "paragraph" ? paragraph.children[0] : undefined;
        if (link?.type !== "link") return;
        labelEnd = (link.children.at(-1)?.position?.end.offset ?? 1) + 1;
      } else {
        // Definition labels are not parsed as inline Markdown; escaped brackets stay literal.
        labelEnd = 1;
        while (labelEnd < text.length) {
          if (text[labelEnd] === "\\") {
            labelEnd += 2;
            continue;
          }
          if (text[labelEnd] === "]") break;
          labelEnd++;
        }
      }
      const delimiter = node.type === "definition" ? "]:" : "](";
      const marker = text.indexOf(delimiter, labelEnd);
      if (marker < 0) return;
      const opening = marker + 2;
      let a = opening;
      while (/\s/.test(text[a] ?? "") && a < text.length) a++;
      let b = a;
      if (text[a] === "<") {
        a++;
        b = text.indexOf(">", a);
      } else {
        let depth = 0;
        while (b < text.length) {
          const c = text[b]!;
          if (c === "\\") {
            b += 2;
            continue;
          }
          if (c === "(") depth++;
          if (c === ")") {
            if (!depth) break;
            depth--;
          }
          if (/\s/.test(c) && !depth) break;
          b++;
        }
      }
      if (b < a) return;
      const href = text.slice(a, b);
      let target: string | undefined;
      try {
        target = resolveHref(oldEntry, href.replace(/\\([\\()])/g, "$1"));
      } catch {
        return;
      }
      if (!target) return;
      const moved = relocate(target);
      if (moved === target && oldEntry === newEntry) return;
      const suffix = href.match(/[?#][\s\S]*$/)?.[0] ?? "";
      const relative =
        path
          .relative(path.dirname(newEntry), moved)
          .split(path.sep)
          .map((part) => encodeURIComponent(part))
          .join("/") || ".";
      changes.push({
        start: start + a,
        end: start + b,
        value: relative + suffix,
      });
    }
    if ("children" in node)
      for (const child of node.children) visit(child as Nodes);
  }
  visit(fromMarkdown(source));
  for (const edit of changes.sort((a, b) => b.start - a.start))
    source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
  return source;
}

/** Source syntax fields stay outside the domain's NodeReference projection. */
export function referenceSuffix(
  node: InternalNode,
  id: string,
): string | undefined {
  const content = new InternalSyntax(
    node.body,
    (href) => resolveEntryHref(node.path, href) !== undefined,
  ).content();
  const reference = [
    ...content.localChildren,
    ...content.descendantChildren,
  ].find((ref) => resolveEntryHref(node.path, ref.target) === id);
  return reference
    ? (reference.target.match(/[?#][\s\S]*$/)?.[0] ?? "")
    : undefined;
}
export function setReferenceSuffix(
  node: InternalNode,
  id: string,
  suffix: string,
): void {
  if (referenceSuffix(node, id) === suffix) return;
  const syntax = new InternalSyntax(
    node.body,
    (href) => resolveEntryHref(node.path, href) !== undefined,
  );
  const content = syntax.content();
  const patch = (refs: readonly SyntaxReference[]) =>
    refs.map((ref) =>
      resolveEntryHref(node.path, ref.target) === id
        ? { ...ref, target: ref.target.split(/[?#]/, 1)[0]! + suffix }
        : ref,
    );
  node.body = syntax.serialize({
    ...content,
    localChildren: patch(content.localChildren),
    descendantChildren: patch(content.descendantChildren),
  });
}
/** Transfer syntax when an index registration moves to a different parent. */
export function carryReferenceSuffix(
  from: InternalNode,
  to: InternalNode,
  oldId: string,
  newId: string,
): void {
  const suffix = referenceSuffix(from, oldId);
  if (suffix !== undefined) setReferenceSuffix(to, newId, suffix);
}
