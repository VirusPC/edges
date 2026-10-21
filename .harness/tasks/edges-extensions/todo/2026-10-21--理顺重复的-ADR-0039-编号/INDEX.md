---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-21T01:27:34.122Z'
  edges-title: 理顺重复的 ADR 0039 编号
  edges-tasks-status: todo
  edges-task-priority: none
  edges-task-assignee: 全栈开发专家
name: 理顺重复的 ADR 0039 编号
description: 理顺重复的 ADR 0039 编号
---
**背景：**
补 Compose submodule 卡进展时发现框架仓 docs/adr/ 里有两份文件都编成 0039：一份是 Compose worktree/同步（0039-compose-worktree-and-sync.md），一份是 pi 客户端沙箱读范围（现为 0044-pi-client-sandbox-read-scope.md）。用户同意开卡把编号理顺。
- 现状：同一编号两份 ADR，引用会歧义
- 非目标：不改 ADR 正文结论，只理顺编号与引用
- 关联：Compose 底层改用 git submodule 卡的遗留；ADR 0039 worktree 部分待重新评估

**目标：**
框架仓里每个 ADR 编号唯一；所有指向这两份文件的链接与索引都改到正确编号。

**前提：**
- 先定哪一份保留 0039、哪一份改成下一可用编号（或两份都重编，以 grill 为准）
- 改编号后同步更新 CHANGELOG、README、其它 ADR/文档/代码注释里的引用

细节 grill 后补
