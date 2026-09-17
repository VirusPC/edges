---
name: project_classify_review_pointer_drag_only
description: 改 classify 建议复查页或给人改归属表时：右侧任务按住拖到左侧分组才赋值；点左侧只筛选；不要 HTML5 DnD，用 pointer + elementFromPoint。
metadata:
  edges-title: classify 复查页只允许拖拽改归属
  edges-type: project
  edges-origin-session-id: bc-166f9b74-a941-5f26-9b20-4ae6a329a47c
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T07:38:05+00:00"
---

classify 建议复查只允许把右侧任务按住拖到左侧 project 分组改归属；点击分组（不拖）只做筛选，不当赋值。不要用 HTML5 drag-and-drop。

**Why:**
peng cheng 于 2026-09-17 要求 drag-only UX。嵌入式预览里 HTML5 `drop` 经常不触发；pointer capture 下 `elementFromPoint` 还会一直返回被抓住的卡片。复查页是给人改 `project-tasks-classify` 建议表的，点选赋值会和筛选抢手势。

**How to apply:**
- 复查页在 `tools/classify-review/classify-suggestions.html`（单文件，无构建）。
- 用自定义 pointerdown/move/up：先 release capture、藏 ghost，再 `elementFromPoint`；命中 capturer 时走 `elementsFromPoint` 或分组几何。
- `pointerup` 才赋值；`pointercancel` 只清拖拽状态，不 `moveTo`。
- `pointerup` 坐标为 (0,0) 时用最后一次 move；从 `<input>` 开始的拖拽忽略。
- 成功投放后立刻改 pill / 左侧计数 / toast（`stem　from → to`），并挡住残留 click，避免离开「全部」。
- 不要在卡片上放 keep/move 控件，导出时按 `suggested === current` 推导。
- 验证：`tools/classify-review/verify-drag.mjs`（puppeteer-core + 系统 Chrome；可设 `CHROME_PATH`）。
