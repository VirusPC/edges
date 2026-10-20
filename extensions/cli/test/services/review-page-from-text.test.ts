import test from "node:test";
import assert from "node:assert/strict";
import { TasksError } from "../../src/domain/models/tasks/types.js";
import { renderReviewPageFromText } from "../../src/services/tasks/review-page.js";

const TEMPLATE = `<!doctype html><html><head><link rel="stylesheet" href="review.css"></head><body><script type="module" src="review.js"></script><script type="application/json" id="edges-review-payload"></script></body></html>`;

function readAsset(abs: string): Promise<string> {
  if (abs.endsWith("index.html")) return Promise.resolve(TEMPLATE);
  if (abs.endsWith("review.js")) return Promise.resolve("console.log(1)");
  if (abs.endsWith("review.css")) return Promise.resolve("body{}");
  return Promise.reject(new Error(`missing ${abs}`));
}

const input = JSON.stringify({
  groups: [{ id: "default", title: "Default" }],
  items: [{ stem: "demo", current: "default", suggested: "default" }],
});

test("renderReviewPageFromText parses, renders, and writes without a CLI context", async () => {
  let written = "";
  const rendered = await renderReviewPageFromText(input, "/tmp/review.html", {
    readFile: readAsset,
    writeFile: async (_file, data) => {
      written = data;
    },
    nowMs: 1,
    tmpDir: "/tmp",
    assetDir: "/assets",
  });
  assert.equal(rendered.path, "/tmp/review.html");
  assert.equal(rendered.groupCount, 1);
  assert.equal(rendered.itemCount, 1);
  assert.match(written, /edges-review-payload/);
  assert.match(written, /"stem":"demo"/);
});

test("renderReviewPageFromText rejects invalid JSON", async () => {
  await assert.rejects(
    () =>
      renderReviewPageFromText("not-json", undefined, {
        readFile: readAsset,
        writeFile: async () => undefined,
        nowMs: 1,
        tmpDir: "/tmp",
      }),
    (error: unknown) =>
      error instanceof TasksError && error.errorCode === "VALIDATION_ERROR",
  );
});
