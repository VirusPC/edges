import { expect, it } from "vitest"
import { statusLabel } from "../src/display.ts"

it("maps every board status to English title case and never returns snake_case", () => {
  expect(statusLabel("backlog")).toBe("Backlog")
  expect(statusLabel("todo")).toBe("Todo")
  expect(statusLabel("in_progress")).toBe("In Progress")
  expect(statusLabel("in_review")).toBe("In Review")
  expect(statusLabel("done")).toBe("Done")
  expect(statusLabel("blocked")).toBe("Blocked")
  expect(statusLabel("cancelled")).toBe("Cancelled")
  expect(statusLabel("")).toBe("Unspecified")
  expect(statusLabel("__unspecified")).toBe("Unspecified")
  expect(statusLabel("needs_triage")).toBe("Other")
  for (const label of [
    statusLabel("backlog"),
    statusLabel("in_progress"),
    statusLabel("needs_triage"),
  ]) {
    expect(label).not.toMatch(/[a-z]+_[a-z]+/)
  }
})
