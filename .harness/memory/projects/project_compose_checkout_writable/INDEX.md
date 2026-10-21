---
name: project_compose_checkout_writable
description: 改 Compose 写入、只读挂载或想加 write/readonly 字段时打开：被组合仓库直接写子模块工作区，不另加机制。决定见 ADR 0045。
metadata:
  edges-title: 被组合仓库可写，不加挂载机制
  edges-type: project
  edges-origin-session-id: bc-072ad49b-d54f-5cf2-86ca-7df889fd8f22
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-21T04:56:23+00:00'
---

被组合仓库可写，只是删掉 Compose 只读特例之后的自然结果。原则就一句：保持简单，不加额外机制。

**Why:** 只读只挡住 edges 自己的写命令，子模块工作区本身是普通 git 工作区。条目级可写标记、独立 worktree、同步命令都是额外机制。ADR 里不要把「README 有没有登记模块决定能否读写」写成单独的规则或原则，那太复杂。

**How to apply:** 改 Compose 写入、只读挂载，或想给 compose 条目加 write/readonly 字段时：不要加挂载分类、可写标记、权限层、独立 worktree、同步命令，也不要在 Compose 契约里加字段。写入直接落在 `.harness/compose/<name>`（或相对 `--path` 的检出）工作区；CLI 只改文件，不 commit、不 push。作用域、父索引和规则停在被组合仓库自己的检出里。Compose 仍不递归。空目录写入失败并提示 `edges compose update --name <name>`。缺失节点或引用跳过。决定见 ADR 0045。用户所述，并由 CLI 测试验证。
