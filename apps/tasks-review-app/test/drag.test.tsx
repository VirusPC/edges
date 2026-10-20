import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "../src/App.tsx";
import { exportReviewRows, projectIdFromDrop } from "../src/export.ts";
import type { ReviewPayload } from "../src/types.ts";

afterEach(() => {
  cleanup();
});

const payload: ReviewPayload = {
  groups: [
    { id: "default", title: "Default", description: "" },
    { id: "cli", title: "CLI", description: "" },
  ],
  items: [{
    stem: "2026-09-21--alpha",
    current: "default",
    suggested: "default",
    title: "Alpha",
    status: "todo",
    note: "",
  }],
};

it("accepts only project drop ids", () => {
  expect(projectIdFromDrop("todo")).toBeUndefined();
  expect(projectIdFromDrop("project:cli")).toBe("cli");
  expect(projectIdFromDrop("__unspecified")).toBeUndefined();
  expect(projectIdFromDrop(undefined)).toBeUndefined();
});

it("marks project rows as droppable and status columns as not", () => {
  render(<App initialPayload={payload} />);
  expect(document.querySelector("[data-project-id=cli]")?.getAttribute("data-droppable-id")).toBe("project:cli");
  expect(document.querySelector("[data-status-column=todo] [data-droppable-id]")).toBeNull();
  expect(document.querySelector("[data-project-id=all]")?.getAttribute("data-droppable")).toBe("0");
});

it("copies export JSON without status", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(<App initialPayload={payload} />);
  await user.click(screen.getByRole("button", { name: "复制导出 JSON" }));
  expect(writeText).toHaveBeenCalledWith(JSON.stringify(exportReviewRows(payload.items), null, 2));
});

it('selects duplicate stored stems by source identity and exports real project slugs', async () => {
  const user = userEvent.setup();
  let copied = '';
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied = text; } } });
  const source = { scope: '.', purpose: 'domain' as const };
  const other = { scope: '.', purpose: 'maintenance' as const };
  const aggregate: ReviewPayload = {
    groups: [{ id: 'domain-default', project: 'default', source, title: 'Domain' }, { id: 'maintenance-cli', project: 'cli', source: other, title: 'Maintenance' }],
    items: [
      { id: 'domain-item', stem: 'same', source, project: 'default', current: 'domain-default', suggested: 'domain-default', title: 'Domain task', doc: { name: 'same', description: '', metadata: {}, body: '# Domain detail' } },
      { id: 'maintenance-item', stem: 'same', source: other, project: 'cli', current: 'maintenance-cli', suggested: 'maintenance-cli', title: 'Maintenance task', doc: { name: 'same', description: '', metadata: {}, body: '# Maintenance detail' } },
    ],
  };
  render(<App initialPayload={aggregate} />);
  await user.click(document.querySelector('[data-card-body="maintenance-item"]')!);
  expect(document.querySelector('[data-markdown-pane] h1')?.textContent).toBe('Maintenance detail');
  expect(window.location.hash).toContain('stem=maintenance-item');
  await user.click(document.querySelector('[data-card-body="domain-item"]')!);
  expect(document.querySelector('[data-markdown-pane] h1')?.textContent).toBe('Domain detail');
  await user.click(screen.getByRole('button', { name: '复制导出 JSON' }));
  expect(JSON.parse(copied)).toEqual([
    { stem: 'same', source, current: 'default', suggested: 'default', action: 'keep', note: '' },
    { stem: 'same', source: other, current: 'cli', suggested: 'cli', action: 'keep', note: '' },
  ]);
});
