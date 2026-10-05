import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "../src/App.tsx";
import type { ReviewPayload } from "../src/types.ts";

const payload: ReviewPayload = {
  groups: [
    { id: "default", title: "Default", description: "" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    {
      stem: "2026-09-21--alpha",
      current: "default",
      suggested: "cli",
      title: "Alpha title",
      description: "short",
      status: "todo",
      priority: "low",
      doc: {
        name: "alpha-name",
        description: "doc-desc",
        metadata: {
          "edges-tasks-status": "in_progress",
          "edges-task-priority": "high",
          "edges-task-assignee": "Ada",
          "edges-updated-at": "2026-09-21T00:00:00.000Z",
        },
        body: "# Heading\n\n- item\n\nBody mentions Vite",
      },
    },
    {
      stem: "2026-09-13--demo",
      current: "default",
      suggested: "default",
      title: "Classify me",
      description: "no doc",
    },
  ],
};

it("lays out filters, columns, design A, and the markdown pane", async () => {
  const user = userEvent.setup();
  render(<App initialPayload={payload} />);
  const shell = document.querySelector("[data-review-shell=edges]");
  expect(shell).not.toBeNull();
  expect(shell?.firstElementChild?.getAttribute("data-review-toolbar")).toBe("edges");
  expect(shell?.querySelector("[data-review-nav=edges]")?.textContent).toBe("Edges");
  expect(document.querySelector("[data-status-column=in_progress]")?.textContent).toContain("2026-09-21--alpha");
  expect(document.querySelector("[data-status-column=__unspecified]")?.textContent).toContain("2026-09-13--demo");
  expect(document.querySelector("[data-project-id=all]")?.getAttribute("data-droppable")).toBe("0");
  const cli = document.querySelector("[data-project-id=cli]");
  expect(cli?.className).toContain("opacity-60");
  await user.type(document.querySelector("[data-filter=q]") as HTMLElement, "vite");
  expect(screen.queryByText("2026-09-13--demo")).toBeNull();
  expect(screen.getByText("2026-09-21--alpha")).toBeTruthy();
  await user.click(cli as Element);
  expect(cli?.getAttribute("data-filter")).toBe("on");
  expect(cli?.className).toContain("border-[#5b9fd4]");
  expect(cli?.className).not.toContain("opacity-60");
  await user.click(screen.getByText("2026-09-21--alpha"));
  expect(document.querySelector("[data-markdown-pane] h1")?.textContent).toBe("Heading");
  expect(document.querySelector("[data-markdown-pane] li")?.textContent).toBe("item");
  expect(window.location.hash.startsWith("#?")).toBe(true);
  expect(window.location.hash).toContain("stem=");
  expect(document.querySelector("[data-status-column] [data-droppable]")).toBeNull();
});

it("keeps filters on the right, shows a project description, and drags column widths", () => {
  render(<App initialPayload={payload} />);
  const filters = document.querySelector("[data-filter=q]")?.parentElement;
  expect(filters?.className).toContain("ml-auto");
  expect(filters?.className).toContain("justify-end");
  expect(filters?.lastElementChild).toBe(document.querySelector("[data-action=copy-json]"));
  expect(document.querySelector("[data-project-id=cli]")?.textContent).toContain("edges CLI");

  const columns = document.querySelector("[data-review-columns=edges]") as HTMLElement;
  expect(columns.style.gridTemplateColumns.startsWith("240px")).toBe(true);
  fireEvent.pointerDown(document.querySelector("[data-panel-resize=left]") as Element, { clientX: 240, pointerId: 1 });
  fireEvent.pointerMove(window, { clientX: 300, pointerId: 1 });
  fireEvent.pointerUp(window, { clientX: 300, pointerId: 1 });
  expect(columns.style.gridTemplateColumns.startsWith("300px")).toBe(true);

  fireEvent.pointerDown(document.querySelector("[data-panel-resize=right]") as Element, { clientX: 1000, pointerId: 2 });
  fireEvent.pointerMove(window, { clientX: 940, pointerId: 2 });
  fireEvent.pointerUp(window, { clientX: 940, pointerId: 2 });
  expect(columns.style.gridTemplateColumns.endsWith("280px")).toBe(true);
});
