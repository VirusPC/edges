import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  defaultReviewPageTemplatePath,
  loadReviewPageTemplate,
  parseReviewPageInput,
  renderReviewPageHtml,
  resolveReviewPageOutPath,
  writeReviewPage,
} from "../../../src/tasks/utils/review-page.js";
import { TasksError } from "../../../src/tasks/utils/types.js";

const sample = {
  groups: [
    { id: "default", title: "Default", description: "ungrouped" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    {
      stem: "2026-09-13--demo",
      current: "default",
      suggested: "cli",
      title: "Demo",
      description: "demo task",
      note: "",
    },
  ],
};

test("parseReviewPageInput accepts valid payload", () => {
  const parsed = parseReviewPageInput(sample);
  assert.equal(parsed.groups.length, 2);
  assert.equal(parsed.items[0]?.stem, "2026-09-13--demo");
});

test("parseReviewPageInput rejects unknown suggested group", () => {
  assert.throws(
    () =>
      parseReviewPageInput({
        ...sample,
        items: [{ ...sample.items[0], suggested: "missing" }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /review-page item 2026-09-13--demo suggested group not found: missing/);
      return true;
    },
  );
});

test("parseReviewPageInput rejects duplicate stems", () => {
  assert.throws(
    () =>
      parseReviewPageInput({
        groups: sample.groups,
        items: [sample.items[0], { ...sample.items[0] }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /duplicate review-page item stem: 2026-09-13--demo/);
      return true;
    },
  );
});

test("renderReviewPageHtml embeds payload JSON and escape-safe stem", () => {
  const template = `<!doctype html><html><body>
<script type="application/json" id="edges-review-payload">{}</script>
</body></html>`;
  const html = renderReviewPageHtml(sample as never, template);
  assert.match(html, /id="edges-review-payload"/);
  assert.match(html, /2026-09-13--demo/);
  assert.doesNotMatch(html, /id="edges-review-payload">\{\}<\/script>/);
});

test("resolveReviewPageOutPath uses --out or tmp default", () => {
  assert.equal(resolveReviewPageOutPath("/tmp/out.html", 1, "/tmp"), path.resolve("/tmp/out.html"));
  assert.equal(
    resolveReviewPageOutPath(undefined, 1710000000000, "/tmp"),
    path.join("/tmp", "edges-review-page-1710000000000.html"),
  );
});

test("renderReviewPageHtml rejects a template without the payload script", () => {
  assert.throws(
    () => renderReviewPageHtml(sample as never, "<html></html>"),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /review-page template missing edges-review-payload script/);
      return true;
    },
  );
});

test("defaultReviewPageTemplatePath and loadReviewPageTemplate read the shipped shell", async () => {
  const templatePath = defaultReviewPageTemplatePath();
  assert.match(templatePath, /project[/\\]assets[/\\]review-page\.html$/);
  const template = await loadReviewPageTemplate((abs) => readFile(abs, "utf8"));
  const html = renderReviewPageHtml(sample as never, template);
  assert.match(html, /id="edges-review-payload"/);
  assert.match(html, /2026-09-13--demo/);
  assert.match(html, /复制导出 JSON/);
  assert.doesNotMatch(html, /id="edges-review-payload">\{\}<\/script>/);
});

test("shipped review-page template filters by left-group click and keeps drag-assign", async () => {
  const template = await loadReviewPageTemplate((abs) => readFile(abs, "utf8"));
  assert.match(template, /filterId/);
  assert.match(template, /全部/);
  assert.match(template, /data-droppable/);
  assert.match(template, /is-filter/);
  assert.match(template, /点左侧分组筛选/);
  assert.match(template, /pointerdown/);
  assert.match(template, /stem: it\.stem/);
  assert.match(template, /action: it\.suggested === it\.current \? "keep" : "move"/);
});

test("writeReviewPage writes utf8 html", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-"));
  try {
    const target = path.join(dir, "out.html");
    await writeReviewPage(target, "<html>ok</html>", writeFile);
    assert.equal(await readFile(target, "utf8"), "<html>ok</html>");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
