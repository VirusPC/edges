---
name: project_conversation_notes_plain_rich_human_review
description: 写或改写 knowledge/notes 对话复盘笔记：Markdown 标题分层；主题行动指南=背景/核心问题/可执行步骤/验收标准；细节=若则小章节；过程带时间线；白话无黑话；行动类优先行动指南。
metadata:
  edges-title: 对话复盘笔记：Markdown分层、主题/细节行动指南、验收标准、过程时间线
  edges-type: project
  edges-origin-session-id: local-it-asset-2026-09-27
  edges-agent-client: grok-bot
  edges-username: IT资产管理
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-27T09:06:41+08:00"
---

`knowledge/notes` 里的对话复盘笔记要写给人审阅，并按 `extensions/skills/conversation-to-notes` **2.2.0**（CONTEXT + ADR 0001–0006）执行。用户所述（2026-09-20 文风；2026-09-27 结构定稿）。

**Why:**
方括号四栏填满、主题层绑死主机名、行动指南只有散点若则、没有验收标准时，笔记既不能当任务执行，也不能泛化复用。黑话和小标题口头禅会让人读不懂。

**How to apply:**
- 用 Markdown `##` / `###` / `####` 分层；不要用【背景】等方括号栏名当正式结构。
- 白话完整句；禁止自创黑话、口头禅小标题、未解释的自创缩写；真实产品名可保留。
- **过程**按时间线写，小节标题带具体时刻或时间段。
- **所学**：学习类写知识点总结；行动类内容优先进行动指南，所学从简。
- **主题行动指南**（可泛化）：背景 → 核心问题 → 核心解决方案（编号步骤）→ **验收标准**（以后当真任务执行时的完成判定清单）。
- **细节与其他**：每个点 `#### 若…`，正文「则…」；复杂用列表；主机名/路径/网段只在这一层。
- 多主题可总览 + 主题篇，补充说明互链。
- 权限表、概念对照等密参考放补充说明。
- 初稿太干时按「给人读懂」重写，不要停在「记完结构」。
- 改 conversation-to-notes 或新写/改写对话 Note 时，以本条与 skill 2.2.0 / CONTEXT / ADR 为准。
