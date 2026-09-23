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
