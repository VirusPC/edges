---
name: reference_description_must_include_key_urls
description: 写/改 .memory/references 时，description 与 INDEX 摘要必须带可点击的关键 URL
metadata:
  edges-type: task
  edges-title: reference memory 的 description 应带关键链接
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-13T11:01:00+08:00"
---

写或改 `.memory/references/*` 时，`description`（以及 INDEX 摘要行）必须包含可点击的关键 URL，不能只有「对照某某」而无链接。

**Why:**
设计 `edges tasks` 时对照 Multica CLI，Coding Agent 专家落了 `.memory/references/reference_multica_cli_tasks_reference.md`（PR #45）。链接只在正文 Links 区，`description` / `REFERENCE.md` 索引摘要只有「对照 Multica…」纯文字，索引里点不开源。peng cheng 反馈不太爱写链接，要求记待办调整 reference 的 description 约定，并把这段背景一起记下。对方已在改 #45：把关键 URL 写进 description；另要一条可执行约定：以后凡 reference，description（及索引行）必须含关键 URL。reference 的用途就是「外部资料去哪找」；摘要行是别人判断要不要打开的唯一依据。

**How to apply:**
- 新建/更新 reference：`description` 里带上关键链接（官方文档、论文、仓库、对照页）。
- INDEX（`.memory/REFERENCE.md`）摘要行同步带链接，不要只写「对照某某」。
- 可顺带扫一轮现有 references，缺链接的补上。
- 细聊时也可把这条收进 project-memory-remember 对 reference type 的约定。
