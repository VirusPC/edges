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

test("shipped review-page template uses design A selected/unselected/drag-over styles", async () => {
  const template = await loadReviewPageTemplate((abs) => readFile(abs, "utf8"));
  const css = template.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  assert.ok(css, "review-page template missing style block");

  const rule = (selector: string) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`))?.[1] ?? "";
  };

  const group = rule(".group");
  const selected = rule(".group.is-filter");
  const over = rule(".group.is-over");
  const hover = rule(".group:hover");

  const opacity = Number(group.match(/opacity:\s*([0-9.]+)/)?.[1]);
  assert.ok(
    opacity >= 0.55 && opacity <= 0.7,
    `unselected .group opacity ${opacity} should be ~0.55–0.7`,
  );
  assert.match(hover, /opacity:\s*1/);

  assert.match(selected, /border-style:\s*solid/);
  assert.match(selected, /border-color:\s*var\(--accent\)/);
  assert.match(selected, /background:[^;]*(?:--accent|#5b9fd4)/);
  assert.match(selected, /opacity:\s*1/);

  assert.match(over, /outline:/);
  assert.match(over, /outline-offset:/);
  assert.match(over, /opacity:\s*1/);
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

test("parseReviewPageInput keeps a thin doc and allows a missing doc", () => {
  const withDoc = parseReviewPageInput({
    groups: sample.groups,
    items: [{
      ...sample.items[0],
      status: "todo",
      priority: "low",
      doc: {
        name: "demo",
        description: "demo task",
        metadata: { "edges-task-assignee": "Ada", "extra-key": "kept" },
        body: "",
      },
    }],
  });
  assert.equal(withDoc.items[0]?.doc?.body, "");
  assert.equal(withDoc.items[0]?.doc?.metadata["extra-key"], "kept");
  assert.equal(withDoc.items[0]?.status, "todo");
  assert.equal(withDoc.items[0]?.priority, "low");

  const withoutDoc = parseReviewPageInput(sample);
  assert.equal(withoutDoc.items[0]?.doc, undefined);
});

test("parseReviewPageInput rejects a doc that is missing body", () => {
  assert.throws(
    () =>
      parseReviewPageInput({
        groups: sample.groups,
        items: [{
          ...sample.items[0],
          doc: { name: "demo", description: "d", metadata: {} },
        }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /review-page doc requires name, description, and body strings/);
      return true;
    },
  );
});
