import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import App from "../src/App.tsx"
import type { ReviewPayload } from "../src/types.ts"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete (window as { matchMedia?: unknown }).matchMedia
})

const payload: ReviewPayload = {
  groups: [
    { id: "default", title: "Default", description: "" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    {
      stem: "2026-09-21--alpha",
      current: "default",
      suggested: "default",
      title: "Alpha title",
      status: "todo",
      doc: {
        name: "alpha-name",
        description: "doc-desc",
        metadata: { "edges-tasks-status": "todo" },
        body: "# Heading\n\nBody text",
      },
    },
  ],
}

function useViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  })
  window.matchMedia = (query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query)
    const max = /max-width:\s*(\d+)px/.exec(query)
    let matches = true
    if (min) matches = width >= Number(min[1])
    if (max) matches = width <= Number(max[1])
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList
  }
}

it("moves a card to another project from the card menu and copies that change", async () => {
  const user = userEvent.setup()
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  })
  render(<App initialPayload={payload} />)

  const card = document.querySelector("[data-stem='2026-09-21--alpha']")
  await user.click(card?.querySelector("[aria-label='卡片菜单']") as Element)
  await user.click(screen.getByRole("menuitem", { name: "移到项目…" }))
  await user.click(screen.getByRole("menuitem", { name: "CLI" }))

  expect(card?.querySelector("[data-project-tag]")?.textContent).toBe("CLI")
  expect(
    document.querySelector("[data-status-column=todo] [data-droppable]")
  ).toBeNull()
  await user.click(screen.getByRole("button", { name: "复制导出 JSON" }))
  expect(writeText).toHaveBeenCalledWith(
    JSON.stringify(
      [
        {
          stem: "2026-09-21--alpha",
          current: "default",
          suggested: "cli",
          action: "move",
          note: "",
        },
      ],
      null,
      2
    )
  )
})

it("stacks the filter, board, and detail on a narrow viewport and scrolls between them", async () => {
  useViewport(390)
  const scrollIntoView = vi.fn()
  HTMLElement.prototype.scrollIntoView = scrollIntoView
  const user = userEvent.setup()
  render(<App initialPayload={payload} />)

  const projects = document.querySelector("[data-review-projects]")
  const board = document.querySelector("[data-status-board]")
  const detail = document.querySelector("[data-markdown-pane]")
  expect(projects).not.toBeNull()
  expect(board).not.toBeNull()
  expect(detail).not.toBeNull()
  expect(
    projects!.compareDocumentPosition(board!) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  expect(
    board!.compareDocumentPosition(detail!) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  expect(detail).toHaveProperty("hidden", true)
  expect(screen.queryByRole("button", { name: "回到看板" })).toBeNull()
  expect(document.querySelector("[data-review-shell]")?.className).toContain(
    "overflow-x-hidden"
  )
  expect(board?.className).toContain("max-w-full")
  expect(document.querySelector("[data-status-columns]")?.className).toContain(
    "flex-col"
  )
  expect(document.querySelector("[data-status-columns]")?.className).not.toContain(
    "overflow-x-auto"
  )

  await user.click(screen.getByText("Alpha title"))
  expect(detail).toHaveProperty("hidden", false)
  expect(detail?.className).toContain("fixed")
  expect(detail?.className).toContain("top-12")
  expect(detail?.className).not.toContain("sticky")
  expect(document.querySelector("[data-markdown-pane] h1")?.textContent).toBe(
    "Heading"
  )
  expect(scrollIntoView).not.toHaveBeenCalled()
  expect(window.location.hash).toContain("stem=")

  const stem = window.location.hash
  await user.click(screen.getByRole("button", { name: "回到看板" }))
  expect(window.location.hash).toBe(stem)
  expect(detail).toHaveProperty("hidden", true)
  expect(document.querySelector("[data-stem='2026-09-21--alpha']")?.getAttribute("data-selected")).toBe(
    "on"
  )
})

it("keeps the desktop three-column shell and hides the narrow back control", () => {
  useViewport(1024)
  render(<App initialPayload={payload} />)
  const columns = document.querySelector(
    "[data-review-columns=edges]"
  ) as HTMLElement
  expect(columns.style.gridTemplateColumns.startsWith("240px")).toBe(true)
  expect(columns.style.gridTemplateColumns.endsWith("220px")).toBe(true)
  expect(document.querySelector("[data-panel-resize=left]")).not.toBeNull()
  expect(document.querySelector("[data-panel-resize=right]")).not.toBeNull()
  expect(document.querySelector("[data-markdown-pane]")).toHaveProperty(
    "hidden",
    false
  )
  expect(screen.queryByRole("button", { name: "回到看板" })).toBeNull()
  expect(
    document
      .querySelector("[data-project-id=cli]")
      ?.getAttribute("data-droppable")
  ).toBe("1")
})
