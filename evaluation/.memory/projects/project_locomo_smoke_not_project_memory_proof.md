---
name: project_locomo_smoke_not_project_memory_proof
description: 做 LoCoMo 或改 evaluation/ 冒烟用例时：SUT 是上游 LoCoMo harness，产物是评测报告；不要把分数当项目记忆证明，也不要把项目记忆接到 LoCoMo 当后端。决策见 docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md。
metadata:
  edges-title: 本轮 LoCoMo 只做评测冒烟
  edges-type: project
  edges-origin-session-id: bc-bb27e95f-dce0-5ebd-a923-57cf3e408155
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-15T18:46:26+00:00"
---

evaluation/ 上的本轮 LoCoMo 试跑只做评测冒烟：SUT 是上游 LoCoMo harness，产物是评测报告；不要把分数当项目记忆证明，也不要把项目记忆接到 LoCoMo 当后端。用户所述、grill-with-docs 确认于 2026-09-15/16；整仓决策见 docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md。

**Why:**
evaluation/ 评测整套 Edges，但 LoCoMo 与项目记忆构念不匹配。把冒烟分数写进报告或任务描述当「记忆有效」，会污染后续公开基准证明。

**How to apply:**
- 跑 LoCoMo 时复用上游 harness，记录命令、底座、子集、分数与时间，落在 Edges 评测工作区中的报告落点。
- 报告与任务里禁止「记忆评测通过」「benchmark 证明有效」「项目记忆增益」。
- 不要在本轮冒烟里把项目记忆接到 LoCoMo 当记忆后端。
- 对照根 CONTEXT 的评测冒烟 / 公开基准证明 / 评测报告，以及 ADR 0008。
