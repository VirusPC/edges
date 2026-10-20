---
name: feedback_review_shell_dividers_resize_width
description: 改审阅壳三栏分隔线或拖放时打开：两条竖线只调整左右栏宽度，不搬任务、不改状态。项目拖放仍只在左栏。2026-09-24 peng cheng 澄清。
metadata:
  edges-title: 审阅壳竖线只拖宽度
  edges-type: feedback
  edges-origin-session-id: bc-b815a65b-3fba-50c2-a670-35e2a2012052
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-24T01:42:07+00:00"
---

审阅壳三栏之间的两条竖线只用来拖宽度，不搬任务，也不改状态。

**Why:**
2026-09-24 peng cheng 先要求这两条竖线能拖，随后说明「拖拽是为了调整宽度」。项目拖放仍只发生在左栏，状态列保持只读。把竖线当成又一条拖放通道会和 ADR 0022 的交互契约打架。

**How to apply:**
左线改项目栏宽度，右线改正文栏宽度，中间看板占剩余空间。不要把分隔线做成项目或状态的 drop target。刷新后可以回到默认宽度。用户所述，已在 2026-09-24 的壳上验证。
