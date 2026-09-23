import path from "node:path";
import { fileURLToPath } from "node:url";
import { TasksError } from "./types.js";
import type { TaskDoc } from "./task-doc.js";

export type ReviewPageGroup = {
  id: string;
  title: string;
  description?: string;
};

export type ReviewPageItem = {
  stem: string;
  current: string;
  suggested: string;
  title?: string;
  description?: string;
  note?: string;
  status?: string;
  priority?: string;
  doc?: TaskDoc;
};

export type ReviewPageInput = {
  groups: ReviewPageGroup[];
  items: ReviewPageItem[];
};

export type ReviewPageWriteFile = (
  file: string,
  data: string,
  encoding: BufferEncoding,
) => Promise<unknown>;

const PAYLOAD_SCRIPT_RE =
  /<script\s+type="application\/json"\s+id="edges-review-payload">[\s\S]*?<\/script>/;

const INVALID_INPUT = "review-page input must be a JSON object with groups[] and items[]";
const INVALID_GROUPS = "review-page groups must be a non-empty array";
const INVALID_GROUP_ID = "review-page group id must be a non-empty string";
const INVALID_GROUP_TITLE = "invalid review-page group title (expected 1–120 characters, no newlines)";
const INVALID_ITEMS = "review-page items must be an array";
const INVALID_ITEM_STEM = "review-page item stem must be a non-empty string";
const MISSING_PAYLOAD_SCRIPT = "review-page template missing edges-review-payload script";

function fail(message: string): never {
  throw new TasksError("VALIDATION_ERROR", message);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGroup(raw: unknown, seenIds: Set<string>): ReviewPageGroup {
  if (!isPlainObject(raw) || typeof raw.id !== "string" || raw.id.trim() === "") {
    fail(INVALID_GROUP_ID);
  }
  const id = raw.id.trim();
  if (seenIds.has(id)) {
    fail(`duplicate review-page group id: ${id}`);
  }
  seenIds.add(id);

  if (typeof raw.title !== "string") {
    fail(INVALID_GROUP_TITLE);
  }
  const title = raw.title.trim();
  if (title.length < 1 || title.length > 120 || /[\r\n]/.test(title)) {
    fail(INVALID_GROUP_TITLE);
  }

  const description = typeof raw.description === "string" ? raw.description : "";
  return { id, title, description };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseItem(raw: unknown, groupIds: Set<string>, seenStems: Set<string>): ReviewPageItem {
  if (!isPlainObject(raw) || typeof raw.stem !== "string" || raw.stem.trim() === "") {
    fail(INVALID_ITEM_STEM);
  }
  const stem = raw.stem.trim();
  if (seenStems.has(stem)) {
    fail(`duplicate review-page item stem: ${stem}`);
  }
  seenStems.add(stem);

  const current = typeof raw.current === "string" ? raw.current.trim() : "";
  const suggested = typeof raw.suggested === "string" ? raw.suggested.trim() : "";
  if (!groupIds.has(current)) {
    fail(`review-page item ${stem} current group not found: ${current}`);
  }
  if (!groupIds.has(suggested)) {
    fail(`review-page item ${stem} suggested group not found: ${suggested}`);
  }

  const item: ReviewPageItem = { stem, current, suggested };
  const title = optionalString(raw.title);
  const description = optionalString(raw.description);
  const note = optionalString(raw.note);
  if (title !== undefined) {
    item.title = title;
  }
  if (description !== undefined) {
    item.description = description;
  }
  if (note !== undefined) {
    item.note = note;
  }
  const status = optionalString(raw.status);
  const priority = optionalString(raw.priority);
  if (status !== undefined) {
    item.status = status;
  }
  if (priority !== undefined) {
    item.priority = priority;
  }
  if ("doc" in raw && raw.doc !== undefined) {
    item.doc = parseReviewDoc(raw.doc);
  }
  return item;
}

function parseReviewDoc(raw: unknown): TaskDoc {
  if (!isPlainObject(raw)) {
    fail("review-page doc must be an object");
  }
  if (typeof raw.name !== "string" || typeof raw.description !== "string" || typeof raw.body !== "string") {
    fail("review-page doc requires name, description, and body strings");
  }
  if (!isPlainObject(raw.metadata)) {
    fail("review-page doc.metadata must be an object");
  }
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw.metadata)) {
    if (typeof value !== "string") {
      fail(`review-page doc.metadata.${key} must be a string`);
    }
    metadata[key] = value;
  }
  return { name: raw.name, description: raw.description, metadata, body: raw.body };
}

export function parseReviewPageInput(raw: unknown): ReviewPageInput {
  if (!isPlainObject(raw) || !("groups" in raw) || !("items" in raw)) {
    fail(INVALID_INPUT);
  }
  if (!Array.isArray(raw.groups) || raw.groups.length < 1) {
    fail(INVALID_GROUPS);
  }
  if (!Array.isArray(raw.items)) {
    fail(INVALID_ITEMS);
  }

  const seenIds = new Set<string>();
  const groups = raw.groups.map((group) => parseGroup(group, seenIds));
  const seenStems = new Set<string>();
  const items = raw.items.map((item) => parseItem(item, seenIds, seenStems));
  return { groups, items };
}

export function defaultReviewPageTemplatePath(): string {
  return fileURLToPath(new URL("../project/assets/review-page.html", import.meta.url));
}

export async function loadReviewPageTemplate(
  readFile: (abs: string) => Promise<string>,
  templatePath?: string,
): Promise<string> {
  return readFile(templatePath ?? defaultReviewPageTemplatePath());
}

export function renderReviewPageHtml(input: ReviewPageInput, templateHtml: string): string {
  if (!PAYLOAD_SCRIPT_RE.test(templateHtml)) {
    fail(MISSING_PAYLOAD_SCRIPT);
  }
  const payload = JSON.stringify({ groups: input.groups, items: input.items }).replaceAll(
    "<",
    "\\u003c",
  );
  return templateHtml.replace(
    PAYLOAD_SCRIPT_RE,
    `<script type="application/json" id="edges-review-payload">${payload}</script>`,
  );
}

export function resolveReviewPageOutPath(
  outFlag: string | undefined,
  nowMs: number,
  tmpDir: string,
): string {
  if (outFlag !== undefined && outFlag !== "") {
    return path.resolve(outFlag);
  }
  return path.join(tmpDir, `edges-review-page-${nowMs}.html`);
}

export async function writeReviewPage(
  absPath: string,
  html: string,
  writeFile: ReviewPageWriteFile,
): Promise<void> {
  await writeFile(absPath, html, "utf8");
}
