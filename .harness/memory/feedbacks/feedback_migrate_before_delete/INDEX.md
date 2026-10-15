---
name: feedback_migrate_before_delete
description: 精简或拆分笔记、清单时：被删的条目先查在别处有没有归宿，没有就先迁过去再删，不直接删除。
metadata:
  edges-title: 精简内容前先把要删的迁到合适去处
  edges-type: feedback
  edges-agent-client: grok-bot
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-15T05:12:34+08:00'
---

精简、拆分或重构内容时，要删掉的条目先确认它在别处有没有合适的归宿；没有就先迁过去，再从原处删。不要直接删。

**Why:**

2026-10-14 精简「调研 Agent 能力时优先关注的产品与团队」清单（PR #240）时，助手把个人博客和整个播客章节直接移除，理由是「交给资讯 skill 去跟」，但并没有检查资讯 skill 里有没有这些内容。用户追问「不能直接删吧，是不是要补充到资讯的 skill 上」。核对后发现博客都已在 skill 里，播客却完全没有，15 档播客差点丢失，后来补成 `weekly-ai-blogs-digest` 的「参考播客列表」。

**How to apply:**

- 删除前列出被删条目，逐条在目标去处（另一份笔记、skill、记忆）里查有没有。
- 缺的先补到去处，并在同一个 PR 或相邻 PR 里一起提交。
- 回复用户时写明哪些已在别处、哪些是新迁过去的、哪些确实丢弃。
