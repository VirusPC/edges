---
name: project_grill_system_entry_q9b_q10_q11
description: >-
  续节点模型 grill：Q9b 根 README 增 entries 指向 tasks 等；Q11=A 虚拟入口先术语后另卡；Q10
  任意目录可有系统入口、用户自行 init，并开 project harness init skill 待办。Q12 叶子入口名仍待答。
metadata:
  edges-title: grill：README entries、任意目录 init、虚拟入口另卡
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:21:08+00:00'
---

节点模型 grill 续（2026-10-06，用户所述）：

**Q9b：** 个人根 / 虚拟系统入口往下看 Edges 时，在 Edges **根目录 `README.md` 增加组成登记（entries）区块**，指向根下 `tasks/` 等系统一入口；不在虚拟层扁平挂 Task 叶子。真实仓内系统入口仍是根 `AGENTS.md`；README entries 是给人看的目录说明与可遍历组成的交汇（用户所述，待实现）。

**Q11′=A：** 虚拟系统入口先留在模型与术语；个人任务查询另卡。当前 `edges tasks` 仍从真实 scope / `AGENTS.md` 走。

**Q10：** 任意目录都可以有真实系统入口 `AGENTS.md`，由用户决定重点维护哪些目录，并自行调用 init 初始化——不是模型按路径白名单限制。配套待办：把现有 project-memory-init 演进或补一刀为 **project harness init** skill（用户要求记 todo；实现未做）。

**Q12：** 仍待答——内容叶子入口文件名（见当轮说明）。

**Why:** grill 用户回答。

**How to apply：** 改根 README / 个人任务 / init skill 时读本条与 `project_virtual_system_entry_personal_root`、`project_recursive_system_two_entry`。Q10 答出后，更新 `feedback_harness_markers_not_task_project_indexes`：Task Project 可以有系统入口当且仅当用户对其 init。未实现前不要假装 README 已有 entries 或 init 已改名。
