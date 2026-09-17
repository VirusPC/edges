---
name: organize_default_project_tasks_skill
description: Skill：整理 _default 下的 tasks——归入已有 project、新建 project、或继续留在 _default
metadata:
  edges-type: task
  edges-title: 整理 _default project tasks 的 skill
  edges-tasks-status: in_progress
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-task-pr: "https://github.com/VirusPC/edges/pull/76"
  edges-task-assignee: Coding Agent 专家
  edges-task-assignee-id: ac913463-5bf6-4c16-adc0-900c61a8692d
  edges-updated-at: "2026-09-17T10:35:00+08:00"
---

做一条 skill：专门整理 **`_default` project** 下的 tasks。对每条（或一批）判断三选一：

1. 归入某个**已有** project；
2. **生成新** project 再迁入；
3. **继续放在** `_default`。

**Why:**
ADR 0009（PR #69）已落地 Project 目录 + `_default` 迁移；存量与新记条目仍大量堆在 `_default`。缺一条「整理」skill 时，只会越堆越平，分组能力用不上。peng cheng 要的是 **判归属的工作流 skill**，不是再改一次目录约定。

**How to apply:**
- 输入：`_default` 下 task 列表（可筛选状态）；已有 project 名/描述作候选。
- 输出：对人确认的建议（归入 / 新建 / 留 `_default`）+ 确认后调用 `edges tasks` CLI 做迁移（不手搓路径）。
- 新建 project 的命名、入口元信息与 ADR 0009 / CLI 约定对齐；人确认后再落，不自动狂建。
- **交叉但不合并：**
  - 已 done：`task 进一步分组`（目录层，ADR 0009）——本条是整理动作。
  - backlog：`交互式主题聚类`——主题 UX；本条是 project 归属 triage。
  - backlog：`edges tasks 的 Skill + MCP 封装`——通用 CRUD 封装；本条是其上的整理流程 skill。
  - backlog：`conversation-to-task`——创建入口；本条是创建后的归仓。
- 已指派 Coding Agent 专家；**先 grill-with-docs**（CONTEXT/ADR），过关再实现 skill；迁移走 `edges tasks` CLI，不手搓路径。
