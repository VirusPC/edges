import { isWithinPath, findAncestor } from "../../utils/filesystem.js";
import { WRITE_LOCK_NAME } from "./node-lock.js";
import { InternalSyntax, type SyntaxReference } from "../../domain/models/internal/syntax.js";
import { resolveEntryHref } from "../../domain/models/layout.js";
/** Filesystem facts and source-preserving relocation; no domain resources. */
import * as fs from "node:fs";
import path from "node:path";
import { fromMarkdown, type Handle } from "mdast-util-from-markdown";
import type { Nodes } from "mdast";
import {
  BaseNode,
  InternalNode,
  LeafNode,
  TaskNode,
  MemoryNode,
  NoteNode,
  SkillNode,
} from "../../domain/models/index.js";
import {
  identifyNodeType,
  resolveHref,
  type DirectoryContract,
} from "../../domain/models/layout.js";
import { parseDocument } from "../../utils/markdown/document.js";
import { checkPath, readEntry } from "./node-files.js";
export type Model<T extends BaseNode = BaseNode> = new (file: string) => T;
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
  if (!isWithinPath(dir, root)) return undefined;
  const parent = findAncestor(dir, directory => exists(path.join(directory, "AGENTS.md")), directory => directory === root);
  return parent ? path.join(parent, "AGENTS.md") : undefined;
}
/** Runtime and import classification use exactly the same physical owner. */
export function physicalParentNode(
  entry: string,
  root: string,
): InternalNode | undefined {
  const parent = physicalParent(entry, root);
  const document = parent ? readEntry(parent) : undefined;
  return document
    ? new InternalNode(document.path).parse(document.source)
    : undefined;
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
      if (name === WRITE_LOCK_NAME) continue;
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
  const destinations = new WeakMap<Nodes, { start: number; end: number }>();
  // Observe container tokens that have no built-in compiler handler. Retain the
  // parser's actual ranges without replacing its destination decoding handlers.
  const captureDestination: Handle = function (token) {
    const owner = this.stack.at(-1);
    if (
      !owner ||
      (owner.type !== "link" &&
        owner.type !== "image" &&
        owner.type !== "definition")
    )
      return;
    let start = token.start.offset,
      end = token.end.offset;
    if (source[start] === "<") {
      start++;
      end--;
    }
    destinations.set(owner, { start, end });
  };
  const tree = fromMarkdown(source, {
    mdastExtensions: [
      {
        enter: {
          resourceDestination: captureDestination,
          definitionDestination: captureDestination,
        },
      },
    ],
  });
  function visit(node: Nodes) {
    if (
      (node.type === "link" ||
        node.type === "image" ||
        node.type === "definition") &&
      node.position
    ) {
      const span = destinations.get(node);
      if (!span) return;
      const href = source.slice(span.start, span.end);
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
        start: span.start,
        end: span.end,
        value: relative + suffix,
      });
    }
    if ("children" in node)
      for (const child of node.children) visit(child as Nodes);
  }
  visit(tree);
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
