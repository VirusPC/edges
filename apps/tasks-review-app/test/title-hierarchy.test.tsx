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
  const projectTitle = screen.getByText("项目").className
  const projectRow =
    document.querySelector("[data-project-id=cli]")?.className ?? ""
  const columnTitle =
    document.querySelector("[data-status-column=todo] h2")?.className ?? ""
  const cardTitle =
    document.querySelector("[data-stem='2026-09-21--alpha'] span")?.className ??
    ""
  await user.click(screen.getByText("Alpha title"))
  const detailTitle =
    document.querySelector("[data-markdown-pane] header p")?.className ?? ""
  const detailBody =
    document.querySelector("[data-markdown-pane] .markdown-body")?.className ??
    ""
  return {
    projectTitle,
    projectRow,
    columnTitle,
    cardTitle,
    detailTitle,
    detailBody,
  }
}

it("keeps section titles larger and heavier than list and body text on both widths", async () => {
  useViewport(1280)
  const desktop = await titleClasses()
  cleanup()
  useViewport(390)
  const narrow = await titleClasses()

  expect(narrow.projectTitle).toBe(desktop.projectTitle)
  expect(narrow.columnTitle).toBe(desktop.columnTitle)
  expect(narrow.detailTitle).toBe(desktop.detailTitle)

  expectTitleBeatsBody(desktop.projectTitle, desktop.projectRow)
  expectTitleBeatsBody(desktop.columnTitle, desktop.cardTitle)
  expectTitleBeatsBody(desktop.detailTitle, desktop.detailBody)
})
