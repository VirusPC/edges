#!/usr/bin/env node
/**
 * Browser verification for classify-suggestions.html.
 *
 * What a break looks like:
 * - Dragging a card onto a left group does not change the 归属 pill
 * - Left badge counts stay stale after a successful drop
 * - A drop also changes the filter (click-assign / click-after-drop)
 * - Press-hold that starts on the note <input> still reassigns
 *
 * Run (system Chrome + puppeteer-core):
 *   npm install --prefix /tmp/classify-review-verify puppeteer-core
 *   NODE_PATH=/tmp/classify-review-verify/node_modules node tools/classify-review/verify-drag.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, "classify-suggestions.html");
const STEM = "2026-09-08--runa-memory-ask调用结果统计";
const FROM = "project-memory";
const TO = "evaluation";

function requirePuppeteer() {
  const require = createRequire(import.meta.url);
  const search = [
    process.env.NODE_PATH,
    "/tmp/classify-review-verify/node_modules",
    path.join(__dirname, "node_modules"),
    path.join(process.cwd(), "node_modules"),
  ].filter(Boolean);
  for (const dir of search) {
    try {
      return require(path.join(dir, "puppeteer-core"));
    } catch (_) {}
  }
  try {
    return require("puppeteer-core");
  } catch (_) {
    throw new Error(
      "puppeteer-core not found. Install with: npm install --prefix /tmp/classify-review-verify puppeteer-core"
    );
  }
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Chrome not found. Set CHROME_PATH to a browser binary.");
}

function serveHtml() {
  const html = fs.readFileSync(HTML_PATH);
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(html);
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

async function drag(page, fromSel, toSel) {
  const from = await page.$(fromSel);
  const to = await page.$(toSel);
  if (!from || !to) throw new Error(`missing ${fromSel} or ${toSel}`);
  await from.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await to.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error("missing bounding box");
  await page.mouse.move(a.x + a.width / 2, a.y + 8);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await page.mouse.up();
}

async function badgeCount(page, projectId) {
  return page.$eval(`.group[data-id="${projectId}"] .badge`, (el) =>
    Number(el.textContent)
  );
}

async function pillFor(page, stem) {
  return page.$eval(`.card[data-stem="${stem}"] .pill`, (el) => el.textContent.trim());
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const puppeteer = requirePuppeteer();
  const { server, url } = await serveHtml();
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1280,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const failures = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(`.card[data-stem="${STEM}"]`);

    const fromBefore = await badgeCount(page, FROM);
    const toBefore = await badgeCount(page, TO);
    const pillBefore = await pillFor(page, STEM);
    assert(pillBefore === FROM, `expected initial pill ${FROM}, got ${pillBefore}`);

    // 1) Click a group without dragging — filter only, no assign.
    await page.click(`.group[data-id="${TO}"]`);
    const titleAfterClick = await page.$eval("#mainTitle", (el) => el.textContent);
    assert(titleAfterClick.includes("Evaluation"), `click should filter, got ${titleAfterClick}`);
    const stemStillVisible = await page.$(`.card[data-stem="${STEM}"]`);
    assert(
      !stemStillVisible,
      "click-without-drag must not assign the dragged-from card into the filter"
    );
    const filteredPills = await page.$$eval(".card .pill", (els) =>
      els.map((el) => el.textContent.trim())
    );
    assert(
      filteredPills.length > 0 && filteredPills.every((p) => p === TO),
      `evaluation filter should only show ${TO} pills, got ${filteredPills.join(",")}`
    );
    await page.click(`.group[data-id="all"]`);
    const titleAll = await page.$eval("#mainTitle", (el) => el.textContent);
    assert(titleAll === "全部任务", `return to all, got ${titleAll}`);
    const pillAfterFilterRoundtrip = await pillFor(page, STEM);
    assert(
      pillAfterFilterRoundtrip === FROM,
      `filter click must not assign; pill ${pillAfterFilterRoundtrip}`
    );

    // 2) Drag that starts on <input> must not assign.
    const noteBox = await page.$eval(
      `.card[data-stem="${STEM}"] input[data-note-for]`,
      (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }
    );
    const evalBox = await page.$eval(`.group[data-id="${TO}"]`, (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.move(noteBox.x, noteBox.y);
    await page.mouse.down();
    await page.mouse.move(evalBox.x, evalBox.y, { steps: 16 });
    await page.mouse.up();
    const pillAfterInputDrag = await pillFor(page, STEM);
    assert(
      pillAfterInputDrag === FROM,
      `drag from input must not assign; pill ${pillAfterInputDrag}`
    );

    // 3) Press-hold the card and drop on the target group.
    await drag(page, `.card[data-stem="${STEM}"]`, `.group[data-id="${TO}"]`);
    await page.waitForFunction(
      (stem, want) => {
        const pill = document.querySelector(`.card[data-stem="${stem}"] .pill`);
        return pill && pill.textContent.trim() === want;
      },
      { timeout: 2000 },
      STEM,
      TO
    ).catch(() => {
      throw new Error("pill did not update after drop (timeout 2s)");
    });

    const pillAfter = await pillFor(page, STEM);
    const fromAfter = await badgeCount(page, FROM);
    const toAfter = await badgeCount(page, TO);
    const titleAfterDrop = await page.$eval("#mainTitle", (el) => el.textContent);
    const toast = await page.$eval("#toast", (el) => el.textContent);

    assert(pillAfter === TO, `pill should be ${TO} immediately, got ${pillAfter}`);
    assert(fromAfter === fromBefore - 1, `${FROM} badge ${fromBefore} → ${fromAfter}`);
    assert(toAfter === toBefore + 1, `${TO} badge ${toBefore} → ${toAfter}`);
    assert(titleAfterDrop === "全部任务", `filter should stay 全部, got ${titleAfterDrop}`);
    assert(
      toast.includes(STEM) && toast.includes(FROM) && toast.includes(TO),
      `toast should be stem　from → to, got ${toast}`
    );
    assert(toast.includes("→") || toast.includes("->"), `toast missing arrow: ${toast}`);

    // 4) Export derives action; no move/keep controls in the card row.
    const hasActionControl = await page.$(".card select, .card .action");
    assert(!hasActionControl, "cards must not expose move/keep controls");
    const exported = await page.evaluate(() => {
      const row = rows.find((r) => r.stem === "2026-09-08--runa-memory-ask调用结果统计");
      return { suggested: row.suggested, action: row.action };
    });
    assert(exported.suggested === TO, `export row suggested ${exported.suggested}`);
    assert(exported.action === "move", `export action should be move, got ${exported.action}`);

    const md = await page.evaluate(() => toExportMd());
    assert(md.includes(`| ${STEM} | default | ${TO} | move |`), `md missing moved row:\n${md}`);

    // 5) Embedded-webview: elementFromPoint returns the captured card.
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(`.card[data-stem="${STEM}"]`);
    await page.evaluate(() => {
      const orig = document.elementFromPoint.bind(document);
      document.elementFromPoint = function (x, y) {
        const captured = document.querySelector(".card.dragging-source");
        if (captured) return captured;
        return orig(x, y);
      };
    });
    const stem2 = "2026-09-09--CLI与MCP需加鉴权";
    const from2 = "edges-cli-platform";
    const to2 = "observation";
    await drag(page, `.card[data-stem="${stem2}"]`, `.group[data-id="${to2}"]`);
    const pillCapture = await pillFor(page, stem2);
    assert(
      pillCapture === to2,
      `drop must work when elementFromPoint returns the captured card; pill ${pillCapture} (want ${to2}, was ${from2})`
    );
    const titleAfterCaptureDrop = await page.$eval("#mainTitle", (el) => el.textContent);
    assert(titleAfterCaptureDrop === "全部任务", "capture-drop must stay on 全部");

    // 6) pointerup at 0,0 after move over a group (some webviews zero the up coords).
    const stem3 = "2026-09-10--posts用Astro搭博客与CI";
    const to3 = "evaluation";
    await page.evaluate(
      (stem, toId) => {
        const card = document.querySelector(`.card[data-stem="${stem}"]`);
        const group = document.querySelector(`.group[data-id="${toId}"]`);
        const cr = card.getBoundingClientRect();
        const gr = group.getBoundingClientRect();
        const down = { bubbles: true, pointerId: 7, pointerType: "mouse", button: 0, buttons: 1 };
        card.dispatchEvent(
          new PointerEvent("pointerdown", { ...down, clientX: cr.x + 12, clientY: cr.y + 6 })
        );
        window.dispatchEvent(
          new PointerEvent("pointermove", {
            ...down,
            clientX: gr.x + gr.width / 2,
            clientY: gr.y + gr.height / 2,
          })
        );
        window.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            pointerId: 7,
            pointerType: "mouse",
            button: 0,
            buttons: 0,
            clientX: 0,
            clientY: 0,
          })
        );
      },
      stem3,
      to3
    );
    const pillZeroUp = await pillFor(page, stem3);
    assert(
      pillZeroUp === to3,
      `pointerup at 0,0 must use last move point; pill ${pillZeroUp} want ${to3}`
    );

    // 7) Synthesized click on the drop target after pointerup must not change filter.
    await new Promise((r) => setTimeout(r, 500));
    await page.click(`.group[data-id="all"]`);
    const stem4 = "2026-09-13--conversation-to-task-skill调用CLI";
    await drag(page, `.card[data-stem="${stem4}"]`, `.group[data-id="observation"]`);
    await page.waitForFunction(
      (stem) => {
        const pill = document.querySelector(`.card[data-stem="${stem}"] .pill`);
        return pill && pill.textContent.trim() === "observation";
      },
      { timeout: 2000 },
      stem4
    );
    await page.evaluate(() => {
      document.querySelector('.group[data-id="observation"]').click();
    });
    const titleAfterSynthClick = await page.$eval("#mainTitle", (el) => el.textContent);
    assert(
      titleAfterSynthClick === "全部任务",
      `post-drop click on the group must not steal filter, got ${titleAfterSynthClick}`
    );

    // 8) pointercancel must abort, not assign (last move may be over a group).
    const stem5 = "2026-09-09--memory需要assets资源目录";
    const pillBeforeCancel = await pillFor(page, stem5);
    await page.evaluate((stem) => {
      const card = document.querySelector(`.card[data-stem="${stem}"]`);
      const group = document.querySelector('.group[data-id="evaluation"]');
      const cr = card.getBoundingClientRect();
      const gr = group.getBoundingClientRect();
      const base = { bubbles: true, pointerId: 9, pointerType: "mouse", button: 0, buttons: 1 };
      card.dispatchEvent(
        new PointerEvent("pointerdown", { ...base, clientX: cr.x + 12, clientY: cr.y + 6 })
      );
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          ...base,
          clientX: gr.x + gr.width / 2,
          clientY: gr.y + gr.height / 2,
        })
      );
      window.dispatchEvent(
        new PointerEvent("pointercancel", {
          bubbles: true,
          pointerId: 9,
          pointerType: "mouse",
          button: 0,
          buttons: 0,
        })
      );
    }, stem5);
    const pillAfterCancel = await pillFor(page, stem5);
    assert(
      pillAfterCancel === pillBeforeCancel,
      `pointercancel must not assign; pill ${pillAfterCancel} (was ${pillBeforeCancel})`
    );

    console.log("OK: drag-assign, filter-only click, input-ignore, toast, export, webview hit-test");
  } catch (err) {
    failures.push(err);
    const shot = path.join("/tmp", "classify-review-verify-drag-failure.png");
    try {
      await page.screenshot({ path: shot, fullPage: true });
      console.error("wrote", shot);
    } catch (_) {}
    console.error(err);
  } finally {
    await browser.close();
    server.close();
  }

  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
