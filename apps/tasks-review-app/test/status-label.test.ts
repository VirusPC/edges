import { expect, it } from "vitest"
import { statusLabel } from "../src/display.ts"

it("maps every board status to Chinese and never returns snake_case", () => {
  expect(statusLabel("backlog")).toBe("待办")
  expect(statusLabel("todo")).toBe("待处理")
  expect(statusLabel("in_progress")).toBe("进行中")
  expect(statusLabel("in_review")).toBe("评审中")
  expect(statusLabel("done")).toBe("已完成")
  expect(statusLabel("blocked")).toBe("已阻塞")
  expect(statusLabel("cancelled")).toBe("已取消")
  expect(statusLabel("")).toBe("未标注")
  expect(statusLabel("__unspecified")).toBe("未标注")
  expect(statusLabel("needs_triage")).toBe("其他状态")
  for (const label of [
    statusLabel("backlog"),
    statusLabel("in_progress"),
    statusLabel("needs_triage"),
  ]) {
    expect(label).not.toMatch(/[a-z]+_[a-z]+/)
  }
})
