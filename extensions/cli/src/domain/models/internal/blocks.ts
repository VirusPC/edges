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
