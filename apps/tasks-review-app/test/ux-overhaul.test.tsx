import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { act } from "react"
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
  groups: [
    { id: "default", title: "Default", description: "" },
    { id: "edges-tasks", title: "Edges Tasks", description: "看板" },
  ],
  items: [
    {
      stem: "2026-09-09--harness-playbook",
      current: "default",
      suggested: "default",
      title: "待读 Harness Playbook",
      status: "backlog",
      doc: {
        name: "backlog-card",
        description: "",
        metadata: { "edges-tasks-status": "backlog" },
        body: "# Backlog body\n\nlong enough to scroll",
      },
    },
    {
      stem: "2026-09-16--default-tasks",
      current: "edges-tasks",
      suggested: "edges-tasks",
      title: "整理 default project tasks",
      status: "in_progress",
      doc: {
        name: "progress-card",
        description: "",
        metadata: { "edges-tasks-status": "in_progress" },
        body: "doing",
      },
    },
    {
      stem: "2026-09-21--artifacts-preview",
      current: "default",
      suggested: "default",
      title: "Artifacts 预览服务部署",
      status: "done",
      doc: {
        name: "done-card",
        description: "",
        metadata: { "edges-tasks-status": "done" },
        body: "shipped",
      },
    },
    {
      stem: "2026-09-01--dropped-trial",
      current: "default",
      suggested: "default",
      title: "已取消的试验",
      status: "cancelled",
      doc: {
        name: "cancelled-card",
        description: "",
        metadata: { "edges-tasks-status": "cancelled" },
        body: "nope",
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

function boardText(): string {
  return document.querySelector("[data-status-board]")?.textContent ?? ""
}

it("shows English status names and hides raw snake_case on the board", () => {
  useViewport(1024)
  render(<App initialPayload={payload} />)
  expect(screen.getByRole("heading", { name: /Backlog/ })).toBeTruthy()
  expect(screen.getByRole("heading", { name: /In Progress/ })).toBeTruthy()
  expect(screen.getByRole("heading", { name: /Done/ })).toBeTruthy()
  expect(screen.getByRole("heading", { name: /Cancelled/ })).toBeTruthy()
  expect(boardText()).not.toMatch(/in_progress|backlog|cancelled/)
  expect(document.querySelector("[data-status-column=done]")).not.toBeNull()
  expect(document.querySelector("[data-status-column=todo]")).toBeNull()
  const columns = document.querySelector("[data-status-columns]")
  expect(columns?.getAttribute("data-status-stack")).toBe("spaced")
  expect(columns?.className).toContain("gap-3")
  for (const toggle of document.querySelectorAll(
    "[data-status-column] [data-section-toggle]"
  )) {
    fireEvent.click(toggle)
  }
  expect(columns?.getAttribute("data-status-stack")).toBe("spaced")
  expect(columns?.className).toContain("gap-3")
  expect(columns?.className).not.toContain("gap-0")
})

it("uses one project select on a narrow viewport and stacks only non-empty statuses", () => {
  useViewport(390)
  render(<App initialPayload={payload} />)
  const select = document.querySelector("[data-project-select]")
  expect(select?.textContent).toContain("全部 · 4")
  expect(document.querySelector("[data-project-id=edges-tasks]")).toBeNull()
  expect(
    document.querySelector("[data-section-title=tasks] span")?.textContent
  ).toBe("Tasks")
  const columns = document.querySelector("[data-status-columns]")
  expect(columns?.className).toContain("flex-col")
  expect(columns?.className).not.toContain("overflow-x-auto")
  const section = document.querySelector("[data-status-column=backlog]")
  expect(section?.className).toContain("w-full")
  expect(section?.className).not.toContain("w-72")
  expect(document.querySelector("[data-status-column=todo]")).toBeNull()
})

it("opens narrow filters in a sheet and restores the board when the sheet closes", async () => {
  useViewport(390)
  const user = userEvent.setup()
  render(<App initialPayload={payload} />)
  const toolbar = document.querySelector("[data-review-toolbar]")
  expect(toolbar?.querySelector("[data-filter=q]")).toBeNull()
  expect(toolbar?.textContent).not.toContain("复制导出 JSON")
  await user.click(screen.getByRole("button", { name: "筛选" }))
  const sheet = document.querySelector("[data-filter-sheet]")
  expect(sheet?.querySelector("[data-filter=q]")).not.toBeNull()
  expect(sheet?.querySelector("[data-filter=priority]")).not.toBeNull()
  expect(sheet?.querySelector("[data-filter=assignee]")).not.toBeNull()
  expect(sheet?.querySelector("[data-filter=status]")).not.toBeNull()
  expect(sheet?.querySelector("[data-action=copy-json]")).not.toBeNull()
  const close = sheet?.querySelector("[data-slot=sheet-close]")
  expect(close?.textContent?.trim()).toBe("")
  expect(close?.textContent).not.toContain("关闭")
  expect(close?.querySelector("svg")).not.toBeNull()
  expect(screen.queryByRole("button", { name: "关闭" })).toBeNull()
  expect(document.querySelector("[data-action=open-filters]")?.textContent).toContain(
    "筛选"
  )
  await user.click(screen.getByRole("button", { name: "关闭筛选" }))
  expect(document.querySelector("[data-filter-sheet]")).toBeNull()
  expect(
    document.querySelector("[data-review-toolbar] [data-filter=q]")
  ).toBeNull()
  expect(screen.getByRole("button", { name: "筛选" })).toBeTruthy()
  expect(document.querySelector("[data-section-title=tasks]")).not.toBeNull()
})

it("sticks one section header at a time and keeps the selection on back", async () => {
  useViewport(390)
  const user = userEvent.setup()
  render(<App initialPayload={payload} />)
  const pane = document.querySelector("[data-markdown-pane]")
  expect(pane?.getAttribute("data-detail-panel")).toBeNull()
  expect(pane?.className).not.toContain("fixed")
  expect(pane?.parentElement).not.toBe(document.body)
  for (const section of ["projects", "tasks", "details"]) {
    const header = document.querySelector(`[data-section-title=${section}]`)
    expect(header?.className).toContain("sticky")
    expect(header?.className).toContain("top-0")
    const toggle = header?.querySelector("[data-section-toggle]")
    expect(toggle?.textContent).toBe("")
    expect(toggle?.querySelector("svg")).not.toBeNull()
    expect(toggle?.getAttribute("aria-expanded")).toBe("true")
  }
  const details = document.querySelector("[data-section-title=details]")
  const back = details?.querySelector("[data-section-back]")
  const toggle = details?.querySelector("[data-section-toggle]")
  expect(back?.textContent).toBe("回到看板")
  expect(
    back &&
      toggle &&
      back.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy()
  expect(
    document.querySelector("[data-section-title=projects] [data-section-back]")
  ).toBeNull()
  expect(
    document.querySelector("[data-section-title=tasks] [data-section-back]")
  ).toBeNull()

  await user.click(document.querySelector("[data-section-toggle=projects]") as Element)
  expect(
    document.querySelector("[data-section-title=projects]")?.getAttribute(
      "data-section-collapsed"
    )
  ).toBe("on")
  expect(document.querySelector("[data-project-select]")).toBeNull()
  await user.click(document.querySelector("[data-section-toggle=projects]") as Element)
  expect(document.querySelector("[data-project-select]")).not.toBeNull()

  const backlog = document.querySelector("[data-status-column=backlog]")
  const statusHeader = backlog?.querySelector("h2")
  expect(statusHeader?.className).toContain("sticky")
  expect(statusHeader?.className).toContain("top-12")
  const statusToggle = statusHeader?.querySelector("[data-section-toggle]")
  expect(statusToggle?.textContent).toBe("")
  expect(statusToggle?.querySelector("svg")).not.toBeNull()
  expect(backlog?.querySelector("[data-stem]")).not.toBeNull()
  await user.click(statusToggle as Element)
  expect(backlog?.querySelector("[data-stem]")).toBeNull()
  expect(statusHeader?.getAttribute("data-section-collapsed")).toBe("on")
  await user.click(statusToggle as Element)
  expect(backlog?.querySelector("[data-stem]")).not.toBeNull()

  const columns = document.querySelector("[data-status-columns]")
  expect(columns?.getAttribute("data-status-stack")).toBe("spaced")
  expect(columns?.className).toContain("gap-4")
  const statusToggles = [
    ...document.querySelectorAll("[data-status-column] [data-section-toggle]"),
  ]
  expect(statusToggles.length).toBeGreaterThan(1)
  for (const toggle of statusToggles) {
    await user.click(toggle)
  }
  expect(columns?.getAttribute("data-status-stack")).toBe("tight")
  expect(columns?.className).toContain("gap-0")
  expect(columns?.className).not.toContain("gap-4")
  expect(document.querySelector("[data-project-select]")).not.toBeNull()
  expect(
    document.querySelector("[data-section-title=projects] span")?.textContent
  ).toBe("Projects")
  await user.click(statusToggles[0]!)
  expect(columns?.getAttribute("data-status-stack")).toBe("spaced")
  expect(columns?.className).toContain("gap-4")
  for (const toggle of statusToggles.slice(1)) {
    await user.click(toggle)
  }

  await user.click(screen.getByText("待读 Harness Playbook"))
  const stem = window.location.hash
  await user.click(screen.getByRole("button", { name: "回到看板" }))
  expect(window.location.hash).toBe(stem)
  expect(window.location.hash).toContain("stem=")
  expect(pane).toHaveProperty("hidden", false)
  expect(
    document
      .querySelector("[data-stem='2026-09-09--harness-playbook']")
      ?.getAttribute("data-selected")
  ).toBe("on")
})

it("de-emphasizes the card stem until hover on desktop and expand on narrow", async () => {
  useViewport(1024)
  const { unmount } = render(<App initialPayload={payload} />)
  const desktopStem = document.querySelector("[data-card-stem]")
  expect(desktopStem?.className).toContain("hidden")
  expect(desktopStem?.className).toContain("md:group-hover:block")
  expect(screen.queryByRole("button", { name: "标识" })).toBeNull()
  unmount()

  useViewport(390)
  render(<App initialPayload={payload} />)
  const stem = document.querySelector(
    "[data-card-stem='2026-09-09--harness-playbook']"
  )
  expect(stem?.className).toContain("hidden")
  vi.useFakeTimers()
  fireEvent.pointerDown(
    document.querySelector(
      "[data-card-body='2026-09-09--harness-playbook']"
    ) as Element
  )
  await act(async () => {
    vi.advanceTimersByTime(500)
  })
  expect(
    document.querySelector("[data-card-stem='2026-09-09--harness-playbook']")
      ?.className
  ).not.toContain("hidden")
  vi.useRealTimers()
  await userEvent.click(screen.getAllByRole("button", { name: "收起标识" })[0]!)
  expect(
    document.querySelector("[data-card-stem='2026-09-09--harness-playbook']")
      ?.className
  ).toContain("hidden")
  await userEvent.click(screen.getAllByRole("button", { name: "标识" })[0]!)
  expect(
    document.querySelector("[data-card-stem='2026-09-09--harness-playbook']")
      ?.className
  ).not.toContain("hidden")
})

it("merges desktop chrome into one toolbar and keeps the center column wider than details", () => {
  useViewport(1280)
  render(<App initialPayload={payload} />)
  const shell = document.querySelector("[data-review-shell]")
  const toolbar = document.querySelector("[data-review-toolbar=edges]")
  expect(toolbar).toBe(shell?.firstElementChild)
  expect(shell?.querySelectorAll("[data-review-toolbar]").length).toBe(1)
  expect(toolbar?.querySelector("[data-review-nav]")?.textContent).toBe("Edges")
  expect(toolbar?.querySelector("[data-filter=q]")).not.toBeNull()
  expect(toolbar?.querySelector("[data-action=copy-json]")).not.toBeNull()
  expect(screen.queryByRole("button", { name: "筛选" })).toBeNull()
  const columns = document.querySelector(
    "[data-review-columns=edges]"
  ) as HTMLElement
  expect(columns.style.gridTemplateColumns).toBe(
    "240px 8px minmax(280px,1fr) 8px 220px"
  )
  const centerAt768 = 768 - 240 - 16 - 220
  expect(centerAt768).toBeGreaterThan(220)
  expect(220).toBeLessThanOrEqual(280)

  columns.getBoundingClientRect = () =>
    ({
      width: 768,
      height: 800,
      top: 0,
      left: 0,
      right: 768,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON() {
        return {}
      },
    }) as DOMRect
  fireEvent.pointerDown(
    document.querySelector("[data-panel-resize=right]") as Element,
    {
      clientX: 400,
      pointerId: 3,
    }
  )
  fireEvent.pointerMove(window, { clientX: 0, pointerId: 3 })
  fireEvent.pointerUp(window, { clientX: 0, pointerId: 3 })
  const right = Number.parseInt(
    columns.style.gridTemplateColumns.split(" ").at(-1) ?? "0",
    10
  )
  expect(right).toBeGreaterThan(0)
  expect(768 - 240 - 16 - right).toBeGreaterThanOrEqual(280)
})
