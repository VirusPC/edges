---
name: project_conversation_notes_plain_rich_human_review
description: 写或改写 knowledge/notes 对话复盘笔记、给人审阅时：白话完整句、例子与上下文够人独立读懂；所学=对错判断勿复述过程；行动指南=若则+步骤；密表进补充说明。
metadata:
  edges-title: 对话复盘笔记写给人审阅：白话完整句、例子够、栏不塌
  edges-type: project
  edges-origin-session-id: bc-f5da740e-df8b-5619-93ca-b9ddaf10f963
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T03:47:24+00:00"
---

`knowledge/notes` 里的对话复盘笔记（复盘四栏）要写给人审阅：白话完整句、例子和上下文写够，没看过原对话的人也能读懂。用户所述（2026-09-20）。

**Why:**
只把四栏标题填满、用电报体碎片交差，人审时对不上当时的判断，也没法脱离原聊天独立理解。把【所学】写成按钮步骤或【过程】换皮、把【行动指南】写成裸待办，笔记就不能复用。权限表、概念对照、开源清单这类密资料塞进四栏，会把该栏压成资料堆，读不下去。

**How to apply:**
- 用白话中文写完整句子，不要电报体碎片。
- 例子和上下文写够：关键判断要带当时在比什么、为什么这么判，让读者不必翻原对话。
- 【所学】只写对/错理解及其原因，不要写按钮步骤，也不要把【过程】再抄一遍或换个说法。
- 【行动指南】写成「若…则…」：触发条件 + 具体步骤。
- 权限表、概念对照、开源清单等密参考放【补充说明】，让四栏保持可读。
- 初稿太干时按「给人读懂」重写，不要停在「记完四栏」。
- 根层 `project_conversation_notes_fupan_four_columns` 管的是四栏结构（勿复活 FIA、勿批量改旧笔记）；本条管的是给人审阅时的文风与各栏写法。改 conversation-to-notes 或新写/改写对话 Note 时两条一起看。
