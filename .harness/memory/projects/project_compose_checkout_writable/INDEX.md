---
name: project_compose_checkout_writable
description: 改 Compose 写入或想加只读特例、空检出报错、父索引边界时打开：只删只读限制。决定见 ADR 0045。
metadata:
  edges-title: 被组合仓库可写，不加挂载机制
  edges-type: project
  edges-origin-session-id: bc-072ad49b-d54f-5cf2-86ca-7df889fd8f22
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-21T05:17:12+00:00'
---

被组合仓库可写，只是删掉 Compose 只读特例之后的自然结果。原则就一句：保持简单，不加额外机制。

**Why:** 只读只挡住 edges 自己的写命令。条目级可写标记、独立 worktree、同步命令、父索引停在最内层组合检出，以及空检出单独的写入报错，都是多余机制。`physicalParent` 本来就会挂到最近的 README。空目录上的冲突由 `git submodule update` 自己表现，不必再拦一次写入。

**How to apply:** 只删只读限制。不要加 `uninitializedComposeWriteError`，也不要加 `innermostComposedCheckout` 或 `#contentRoot`。父索引继续用 `managedRoot`。skill 不要单开「写入被组合仓库」一节，一句即可：被组合的仓库可以直接写，提交和推送用原生 git。读侧「未初始化」警告保持原样。决定见 ADR 0045。用户纠正，2026-10-21。
