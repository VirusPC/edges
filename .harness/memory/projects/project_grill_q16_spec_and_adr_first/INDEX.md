---
name: project_grill_q16_spec_and_adr_first
description: 改递归系统二入口、entries 标记或 INDEX 迁移前：先完成设计 spec 与 ADR 并经人审，再 writing-plans；本步不写生产代码。
metadata:
  edges-title: 节点模型落地前先写 spec 与 ADR
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:38:23+00:00'
---

节点模型 grill（2026-10-06）Q16=A：在写实现计划或改 codec 之前，先写设计 spec 与 ADR，经人审再进入 writing-plans / 落地。

范围包括：递归系统二入口、README `project-entries-*`、AGENTS 标题「系统维护信息」、同目录双文件遍历分工、INDEX.md 迁移（含 posts）、virtual 系统入口术语、project harness init 待办边界。不在本步写生产代码。

**Why:** 用户选 A（spec+ADR first）；变更触及遍历核心规则与多文件入口合同，硬反转成本高。

**How to apply:** 交付 `docs/superpowers/specs/2026-10-06-recursive-system-two-entries-design.md` 与 ADR 0029（修订 ADR 0024）；用户批准 spec 前不要开实施计划或改 layout/codec。
