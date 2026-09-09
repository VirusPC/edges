---
name: feedback_conversation_to_notes_fia_zh_labels
description: 改 conversation-to-notes 章节中文名时：Facts=事实、Insights=洞察、Actions=行动；不要用主要结论、认知更新、行动指南。
metadata:
  edges-title: conversation-to-notes 中文 FIA 标题用事实/洞察/行动
  edges-type: feedback
  edges-origin-session-id: bc-e65ddb79-57b5-495f-953a-8a3d64c4a3a8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-09T14:31:21+00:00"
---

conversation-to-notes 的中文 FIA 章节标题必须与英文模型对齐：Facts=`事实`，Insights=`洞察`，Actions=`行动`。

**Why:** 旧标签「主要结论 / 认知更新 / 行动指南」和 FIA 三词不对齐，笔记结构会漂移；用户已明确只改中文标签、保留英文 FIA。

**How to apply:** 改 `extensions/skills/conversation-to-notes/SKILL.md` 的 description、Instructions、Output Format 时用 `【事实】` / `【洞察】` / `【行动】`。括号提示用「客观事实与共识」「洞察与 Edge 雏形」「决策与后续动作」。不要把这套改名扩散到已有笔记或 `summarize-ai-article-ultra`，除非用户点名。
