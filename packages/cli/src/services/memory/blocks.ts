import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { readTemplate } from "./templates.js";
import { typeFromDirName } from "./paths.js";
import {
  OUTER_START,
  OUTER_END,
  IMPORTANT_START,
  IMPORTANT_END,
  LOCAL_START,
  LOCAL_END,
  CHILDREN_START,
  CHILDREN_END,
  TYPE_META_START,
  TYPE_META_END,
  INNER_BLOCK_ORDER,
  INDEX_ENTRY_PATTERN,
} from '../../domain/config/sections.js';
import {
  escapeRegExp,
  blockPattern,
  appendBlock,
  insertInnerBlock,
  upsertBlock,
  hasConstraintsMarker,
} from '../../domain/models/node/document.js';
export * from '../../domain/config/sections.js';
export * from '../../domain/models/node/document.js';
export const GIT_ROOT_CONSTRAINT_MARKER = "<!-- git-root-constraint -->";

/** Drop the template directive. Keep its following bullet only for a git-root entry. */
function applyGitRootConstraint(text: string, include: boolean): string {
  const directive = `${GIT_ROOT_CONSTRAINT_MARKER}\n`;
  const bullet = new RegExp(
    `${escapeRegExp(directive)}- [^\\n]*\\n`,
  );
  if (!bullet.test(text))
    throw new Error("AGENTS template missing git-root constraint");
  return include ? text.replace(directive, "") : text.replace(bullet, "");
}

export function gitRootConstraintText(): string {
  const match = readTemplate(ENTRY_NAMES.internal).match(
    new RegExp(`${escapeRegExp(GIT_ROOT_CONSTRAINT_MARKER)}\\n- (.*)\\n`),
  );
  if (!match?.[1]) throw new Error("AGENTS template missing git-root constraint");
  return match[1];
}

export function loadAgentsTemplate(options?: {
  gitRootConstraint?: boolean;
}): string {
  const text = readTemplate(ENTRY_NAMES.internal);
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
  return applyGitRootConstraint(text, options?.gitRootConstraint === true);
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
        /\]\((\.edges\/(?:memory|skills)\/([^/]+)\/(?:README|AGENTS)\.md)\)/g,
      ),
    ].map((m) => [typeFromDirName(m[2]!), m[1]!]),
  );
}
export function buildImportantBlock(gitRootConstraint = false): string {
  const block = loadAgentsTemplate({ gitRootConstraint }).match(
    blockPattern(IMPORTANT_START, IMPORTANT_END),
  )?.[0];
  if (!block) throw new Error(`Missing template block: ${IMPORTANT_START}`);
  return block;
}
export const buildLocalBlock = () => extractBlock(LOCAL_START, LOCAL_END);
export const buildChildrenBlock = (entries: string) =>
  extractBlock(CHILDREN_START, CHILDREN_END).replace(
    "{index_entries}",
    () => entries,
  );
export const ensureImportantBlock = (
  document: string,
  gitRootConstraint = false,
) =>
  hasConstraintsMarker(document)
    ? document
    : insertInnerBlock(
        document,
        IMPORTANT_START,
        buildImportantBlock(gitRootConstraint),
      );
export function renderAgentsDocument(
  title: string,
  local: string,
  children: string,
  gitRootConstraint = false,
): string {
  return (
    loadAgentsTemplate({ gitRootConstraint })
      .replace("{title}", () => title)
      .replace(blockPattern(LOCAL_START, LOCAL_END), () => local)
      .replace(blockPattern(CHILDREN_START, CHILDREN_END), () => children)
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}
