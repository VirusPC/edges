import { readTemplate } from "./templates.js";
import { typeFromDirName } from "./paths.js";
const marker = (name: string, edge: string) =>
  `<!-- project-memory${name ? `-${name}` : ""}:${edge} -->`;
export const OUTER_START = marker("", "start"),
  OUTER_END = marker("", "end");
export const IMPORTANT_START = marker("important", "start"),
  IMPORTANT_END = marker("important", "end");
export const LOCAL_START = marker("local", "start"),
  LOCAL_END = marker("local", "end");
export const CHILDREN_START = marker("children", "start"),
  CHILDREN_END = marker("children", "end");
export const AUTO_START = marker("auto", "start"),
  AUTO_END = marker("auto", "end");
export const ENTRIES_START = marker("entries", "start"),
  ENTRIES_END = marker("entries", "end");
export const TYPE_META_START = marker("type", "start"),
  TYPE_META_END = marker("type", "end");
export const INNER_BLOCK_ORDER = [IMPORTANT_START, LOCAL_START, CHILDREN_START];
export const INDEX_ENTRY_PATTERN = /^- \[[^\]]*\]\(([^)]+)\)(?: — (.*))?$/gm;
export const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const blockPattern = (start: string, end: string) =>
  new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
export function loadAgentsTemplate(): string {
  const text = readTemplate("AGENTS.md");
  let position = -1;
  for (const marker of [
    OUTER_START,
    IMPORTANT_START,
    IMPORTANT_END,
    LOCAL_START,
    LOCAL_END,
    CHILDREN_START,
    CHILDREN_END,
    OUTER_END,
  ]) {
    const index = text.indexOf(marker);
    if (
      index < 0 ||
      index <= position ||
      text.indexOf(marker, index + 1) !== -1
    )
      throw new Error(`Invalid AGENTS template marker: ${marker}`);
    position = index;
  }
  return text;
}
export function extractBlock(start: string, end: string): string {
  const block = loadAgentsTemplate().match(blockPattern(start, end))?.[0];
  if (!block) throw new Error(`Missing template block: ${start}`);
  return block;
}
export function indexFiles(): Record<string, string> {
  return Object.fromEntries(
    [
      ...extractBlock(LOCAL_START, LOCAL_END).matchAll(
        /\]\((\.harness\/(?:memory|skills)\/([^/]+)\/AGENTS\.md)\)/g,
      ),
    ].map((m) => [typeFromDirName(m[2]!), m[1]!]),
  );
}
export const appendBlock = (text: string, block: string) =>
  text +
  (text.endsWith("\n\n") ? "" : text.endsWith("\n") ? "\n" : "\n\n") +
  block;
export function insertInnerBlock(
  document: string,
  start: string,
  block: string,
): string {
  if (!document.includes(OUTER_START))
    document = appendBlock(document, `${OUTER_START}\n${OUTER_END}`);
  const anchor =
    INNER_BLOCK_ORDER.slice(INNER_BLOCK_ORDER.indexOf(start) + 1).find((m) =>
      document.includes(m),
    ) ?? OUTER_END;
  const position = document.indexOf(anchor);
  if (position < 0)
    throw new Error("Missing project-memory outer closing marker");
  return `${document.slice(0, position).trimEnd()}\n\n${block}\n${document.slice(position)}`;
}
export function upsertBlock(
  document: string,
  start: string,
  end: string,
  block: string,
): string {
  const pattern = blockPattern(start, end);
  return pattern.test(document)
    ? document.replace(pattern, () => block)
    : INNER_BLOCK_ORDER.includes(start)
      ? insertInnerBlock(document, start, block)
      : `${appendBlock(document, block)}\n`;
}
export const buildImportantBlock = () =>
  extractBlock(IMPORTANT_START, IMPORTANT_END);
export const buildLocalBlock = () => extractBlock(LOCAL_START, LOCAL_END);
export const buildChildrenBlock = (entries: string) =>
  extractBlock(CHILDREN_START, CHILDREN_END).replace(
    "{index_entries}",
    () => entries,
  );
export const ensureImportantBlock = (document: string) =>
  blockPattern(IMPORTANT_START, IMPORTANT_END).test(document)
    ? document
    : insertInnerBlock(document, IMPORTANT_START, buildImportantBlock());
export function renderAgentsDocument(
  title: string,
  local: string,
  children: string,
): string {
  return (
    loadAgentsTemplate()
      .replace("{title}", () => title)
      .replace(blockPattern(LOCAL_START, LOCAL_END), () => local)
      .replace(blockPattern(CHILDREN_START, CHILDREN_END), () => children)
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}
