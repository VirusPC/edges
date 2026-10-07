---
name: project_git_memory_management
description: 概括 Edges 核心思想时：Git 管理还包括跟踪与忽略规则，例如 user memory 通过 gitignore 不随 Git 提交与共享；不能只解释成版本历史、分支和回滚。
metadata:
  edges-title: Git 管理记忆的版本与共享范围
  edges-type: project
  edges-agent-client: codex
  edges-username: Codex
  edges-email: noreply@openai.com
  edges-updated-at: "2026-10-01T16:56:01+08:00"
---

Git 是 Edges 记忆管理机制的一部分：版本跟踪、忽略规则与协作流程共同表达哪些记忆纳入共享版本，哪些不随 Git 提交与共享。

**Why:** 2026-10-01 用户提出“Git 为核心的记忆管理方式”，并以 user memory 通过 gitignore 实现为例，纠正了只从版本、分支、审阅和回滚解释 Git 的窄化。这里的设计意图包括记忆的管理边界，不能只概括成变更历史管理。

**How to apply:**

- 概括核心思想时，用“基于 Git 管理记忆的版本与共享范围”，同时说明跟踪与忽略规则的作用。
- user memory 仍属于本层记忆；通过 `.gitignore` 使本地 user memory 默认不被纳入 Git 提交与共享，不改变其在逻辑记忆树中的归属。这个例子用于说明管理方式，不把所有记忆都视为必须提交的共享内容。
- 区分版本跟踪选择、记忆的逻辑作用域和文件访问权限；`.gitignore` 表达的是 Git 忽略规则，不把它写成加密或访问控制机制。
