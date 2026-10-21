---
name: project_compose_checkout_writable
description: 改 Compose 写入或想加只读特例、父索引边界时打开：只删只读限制，父索引仍走 managedRoot。决定见 ADR 0045。
metadata:
  edges-title: 被组合仓库可写，不加挂载机制
  edges-type: project
  edges-origin-session-id: bc-072ad49b-d54f-5cf2-86ca-7df889fd8f22
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-21T05:04:55+00:00'
---

被组合仓库可写，只是删掉 Compose 只读特例之后的自然结果。原则就一句：保持简单，不加额外机制。

**Why:** 只读只挡住 edges 自己的写命令。条目级可写标记、独立 worktree、同步命令，以及把父索引停在最内层组合检出，都是多余机制。`physicalParent` 本来就会挂到最近的 README，跨仓串写不必另做防护。ADR 里也不要把「README 有没有登记模块决定能否读写」写成单独规则。

**How to apply:** 只删只读限制，外加空检出写入报错（提示 `edges compose update --name <name>`）。父索引继续用 `managedRoot` 和原来的 `physicalParent`，不要加 `innermostComposedCheckout` 或 `#contentRoot`。skill 不要单开「写入被组合仓库」一节，一句即可：被组合的仓库可以直接写，提交和推送用原生 git。决定见 ADR 0045。用户纠正，2026-10-21。
