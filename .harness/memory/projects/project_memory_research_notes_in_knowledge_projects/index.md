---
name: project_memory_research_notes_in_knowledge_projects
description: 写 project-memory 的调研、优点、related work 等研究笔记时：落到 knowledge/projects/memory/；skill 层 .memory 只记协议与设计决策，不当成对外研究笔记落点。
metadata:
  edges-title: 记忆研究笔记落 knowledge/projects/memory
  edges-type: project
  edges-origin-session-id: bc-60c81494-51b0-41e3-9d11-82823e455ac6
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-15T15:01:34+00:00"
---

记忆系统的研究/优点/related-work 笔记写到 `knowledge/projects/memory/`，不要写进 `extensions/skills/project-memory-init/.memory`。

**Why:** 用户先点过 skill 层 `.memory`，随后纠正为 `knowledge/projects/memory/`（记忆研究工作区）。skill 层记忆是协议与设计决策的事实源，研究文是给人读的项目笔记；混放会让 ask 把调研文当仓规，也会把公开研究草稿塞进 skill 家。

**How to apply:** 新写或改「这套系统是什么 / 优点 / 竞品 / benchmark」类长文，先看 `knowledge/projects/memory/` 已有篇目，在那里增量。改 PROTOCOL、LAYOUT、skill 行为的取舍仍 remember 到 init 目录的 `.memory`。不要两边各写一份近义长文。
