# 评测冒烟不是公开基准证明

LoCoMo 便宜、官方链路现成，容易被拿来当作「记忆有效」的证据。项目记忆是文件系统作用域的运营记忆，保存无法从仓库当前状态直接推导的约束与决策；LoCoMo 测的是长程对话事实召回。构念不匹配。2026-09-15/16 grill-with-docs 确认：本轮 LoCoMo 只做评测冒烟，不得引用为对项目记忆的公开基准证明。

**Status:** accepted（grill 确认于 2026-09-15/16）

## Decision

- **本轮 LoCoMo = 评测冒烟。** 目的是复现公开基准上「写入→检索→作答→打分」并留下可复查的评测报告；不论证项目记忆或 Agent Memory 有效。
- **SUT 是上游 LoCoMo harness**（首选 [VirusPC/locomo](https://github.com/VirusPC/locomo) submodule → `task_eval/evaluate_qa.py` → 官方 `task_eval/evaluation.py` F1；仓内 `evaluation/cases/locomo-smoke` 是历史 hand-port），不是把项目记忆接到 LoCoMo 当记忆后端。
- **分数不得引用为公开基准证明。** 尤其不得写成项目记忆增益、记忆评测通过、或 benchmark 证明有效。
- **真正的公开基准证明**仍走构念匹配的公开基准（例如 SWE-ContextBench），同底座、同 harness，并带空记忆 / 安慰剂 / 随机等对照。另有独立 Task 负责，不是本轮冒烟的范围。

## Consequences

- 冒烟产物是评测报告，落在 Edges 评测工作区中的报告落点；不是既有 Edge，也不是知识资产。
- [`knowledge/tasks/_default/backlog/2026-09-11--找公开benchmark证明memory有效性.md`](../../knowledge/tasks/_default/backlog/2026-09-11--找公开benchmark证明memory有效性.md) 继续拥有公开基准证明；本轮不提前用 LoCoMo 分数交差。
- [`knowledge/tasks/_default/done/2026-09-16--LoCoMo评测流水线冒烟.md`](../../knowledge/tasks/_default/done/2026-09-16--LoCoMo评测流水线冒烟.md) 已用 hand-port 跑通链路（PR #70）。新跑优先 [`evaluation/run_locomo_official.py`](../../evaluation/run_locomo_official.py)（submodule 官方 F1）。
- [`knowledge/tasks/_default/in_progress/2026-09-16--LoCoMo-fork薄封装与edges-submodule.md`](../../knowledge/tasks/_default/in_progress/2026-09-16--LoCoMo-fork薄封装与edges-submodule.md) 把官方入口接到 edges。
- 把项目记忆接入 LoCoMo 当记忆后端，不在本轮冒烟范围内。四臂探索仍 paused。

## Considered Options

- 把 LoCoMo 分数写成项目记忆 / Agent Memory 有效性证据：否决；构念不匹配（对话事实召回 ≠ 文件系统运营记忆）。
- 本轮就把项目记忆接到 LoCoMo 当后端再比分：否决；超出冒烟，也仍不是构念匹配的证明。
- 本轮同时做 SWE-ContextBench 等带对照的公开基准证明：否决；证明另开 Task。

## Out of scope

- 把项目记忆接入 LoCoMo
- 在构念匹配基准上做带对照的公开基准证明
- 官方 RAG 单档对照（另开 follow-up Task）
