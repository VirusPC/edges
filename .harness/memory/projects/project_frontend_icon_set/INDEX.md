---
name: project_frontend_icon_set
description: 改审阅壳或后续前端图标时打开：默认 Lucide（按需、可调 size/color/stroke）。同一产品不混搭。tasks-review 折叠用 ChevronDown/ChevronRight，筛选关闭用 X，不要可见文字收起/展开/关闭。正文在 knowledge/notes/2026-09-25--前端图标选型.md。
metadata:
  edges-title: 前端图标默认 Lucide
  edges-type: project
  edges-origin-session-id: bc-60f6d192-c6ab-59f5-b255-32f3cb049480
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T00:53:40+00:00"
---

前端图标默认用 Lucide（React / TS 的 lucide-react，按需引入，可调 size、color、stroke）。同一产品固定一套风格，不因为用了聚合库就混搭。

**Why:** peng cheng 与设计同学在 2026-09-25 锁定。Tailwind 味很重时可以整套改用 Heroicons；需要品牌图标或多套风格再考虑 Font Awesome（有一部分付费）。搜图标用 Iconify，设计师自定义整理导出用 IcoMoon。tasks-review 的折叠和筛选关闭已经是 Lucide，再引一套会和现有 Chevron、X 不一致。

**How to apply:**
- 新的 React / TS 界面默认 lucide-react。换库是整套换，不要在 Lucide 旁边再装 Heroicons 或 Font Awesome。
- tasks-review：大章节和状态小节的折叠用 ChevronDown（展开）和 ChevronRight（收起）；筛选抽屉关闭用 X。不要可见文字「收起」「展开」「关闭」。aria-label 可以用中文。打开入口「筛选」仍是文字。
- 正文在 knowledge/notes/2026-09-25--前端图标选型.md。这是选型，不是某一屏的布局说明。
