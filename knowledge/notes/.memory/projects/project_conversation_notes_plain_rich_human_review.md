---
name: project_conversation_notes_plain_rich_human_review
description: 写 knowledge/notes：背景→主题→过程→结果→所学→行动指南；主题=一段+难点列表；取舍补充不压缩；做法默认带可选项，无比较可不硬编。
metadata:
  edges-title: 对话笔记：主题难点、过程结果、取舍补充、行动指南
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: IT资产管理
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-27T10:14:08+08:00"
---

`knowledge/notes` 对话笔记按 `conversation-to-notes` **2.3.1**（CONTEXT + ADR 0001–0008）执行：同时做记录与复盘；章节 `背景 → 主题 → 过程 → 结果 → 所学 → 行动指南 → 补充说明`；标题不加括号。

**Why:**
缺主题与结果时，读者扫不到议题/难点和结局；把取舍「收成」进所学会压缩过程。写做法时默认应有可选项与弃因，但无比较空间时硬凑会显得绝对。

**How to apply:**
- `主题`：一段话点题 + 难点列表。
- `过程`：时间线；真实取舍原样保留，不压缩。
- `结果`：做成了什么 / 还剩什么。
- `所学`与`行动指南`：补充取舍；写做什么时默认带可选项与不做原因，无比较空间可省略或写「当时未比较其它方案」。
- 行动指南仍分主题层与细节若则；主题层可泛化。
- 与 `conversation-to-tasks` 1.2.0 主题行动指南同序对应。
- 改 skill 或新写笔记以 2.3.1 / CONTEXT / ADR 为准。
