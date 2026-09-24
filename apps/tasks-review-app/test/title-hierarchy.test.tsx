import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import App from "../src/App.tsx"
import type { ReviewPayload } from "../src/types.ts"

afterEach(() => {
  cleanup()
  window.location.hash = ""
  vi.unstubAllGlobals()
  delete (window as { matchMedia?: unknown }).matchMedia
})

const payload: ReviewPayload = {
  groups: [{ id: "cli", title: "CLI", description: "edges CLI" }],
  items: [
    {
      stem: "2026-09-21--alpha",
      current: "cli",
      suggested: "cli",
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
    const matches = width < 768
    return {
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    }
  }
}

function prominence(className: string): { px: number; weight: number } {
  const fixed = className.match(/text-\[(\d+)px\]/)
  const px = fixed
    ? Number(fixed[1])
    : className.includes("text-xl")
      ? 20
      : className.includes("text-lg")
        ? 18
      : className.includes("text-base")
        ? 16
        : className.includes("text-sm")
          ? 14
          : className.includes("text-xs")
            ? 12
            : 0
  const weight = className.includes("font-semibold")
    ? 600
    : className.includes("font-medium")
      ? 500
      : 400
  return { px, weight }
}

function expectTitleBeatsBody(titleClass: string, bodyClass: string) {
  const title = prominence(titleClass)
  const body = prominence(bodyClass)
  expect(title.px).toBeGreaterThan(body.px)
  expect(title.weight).toBeGreaterThan(body.weight)
}

async function titleClasses() {
  window.location.hash = ""
  HTMLElement.prototype.scrollIntoView = () => {}
  const user = userEvent.setup()
  render(<App initialPayload={payload} />)
  const edgesTitle =
    document.querySelector("[data-review-nav] span")?.className ?? ""
  const projectTitle =
    document.querySelector("[data-section-title=projects]")?.className ?? ""
  const projectRow =
    document.querySelector("[data-project-id=cli]")?.className ?? ""
  const tasksTitle =
    document.querySelector("[data-section-title=tasks]")?.className ?? ""
  const columnTitle =
    document.querySelector("[data-status-column=todo] h2")?.className ?? ""
  const cardTitle =
    document.querySelector("[data-stem='2026-09-21--alpha'] span")?.className ??
    ""
  await user.click(screen.getByText("Alpha title"))
  const detailsTitle =
    document.querySelector("[data-section-title=details]")?.className ?? ""
  const detailTitle =
    document.querySelector("[data-markdown-pane] header p")?.className ?? ""
  const detailBody =
    document.querySelector("[data-markdown-pane] .markdown-body")?.className ??
    ""
  return {
    edgesTitle,
    projectTitle,
    projectRow,
    tasksTitle,
    columnTitle,
    cardTitle,
    detailsTitle,
    detailTitle,
    detailBody,
  }
}

function expectChapterStrip(className: string) {
  expect(className).toContain("text-lg")
  expect(className).toContain("font-semibold")
  expect(className).toContain("bg-[#1a2332]")
  expect(className).toContain("border-b")
  expect(className).toContain("border-[#334155]")
}

it("keeps section titles larger and heavier than list and body text on both widths", async () => {
  useViewport(1280)
  const desktop = await titleClasses()
  cleanup()
  useViewport(390)
  const narrow = await titleClasses()

  expect(screen.getAllByText("Projects").length).toBeGreaterThan(0)
  expect(screen.getAllByText("Tasks").length).toBeGreaterThan(0)
  expect(screen.getAllByText("Details").length).toBeGreaterThan(0)
  expect(narrow.edgesTitle).toBe(desktop.edgesTitle)
  expect(narrow.projectTitle).toBe(desktop.projectTitle)
  expect(narrow.tasksTitle).toBe(desktop.tasksTitle)
  expect(narrow.detailsTitle).toBe(desktop.detailsTitle)

  const edges = prominence(desktop.edgesTitle)
  const chapter = prominence(desktop.projectTitle)
  expect(edges.px).toBeGreaterThan(chapter.px)
  expect(edges.weight).toBeGreaterThanOrEqual(chapter.weight)
  expectTitleBeatsBody(desktop.projectTitle, desktop.projectRow)
  expectTitleBeatsBody(desktop.tasksTitle, desktop.cardTitle)
  expectTitleBeatsBody(desktop.detailsTitle, desktop.detailBody)
  expectTitleBeatsBody(desktop.columnTitle, desktop.cardTitle)
  expectTitleBeatsBody(desktop.detailTitle, desktop.detailBody)
  expectChapterStrip(desktop.projectTitle)
  expectChapterStrip(desktop.tasksTitle)
  expectChapterStrip(desktop.detailsTitle)
})
