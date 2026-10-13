---
name: swe_contextbench_main_eval
description: 实际接入 Edges 的记忆写入与跨会话使用流程，在同一 Agent、模型与任务下对比启用和禁用记忆，评测项目本身的效果与成本。
metadata:
  edges-type: task
  edges-title: SWE-ContextBench 主评测：验证 Edges 项目记忆闭环
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: '2026-10-10T18:04:53.288Z'
  edges-task-project: evaluation
---

**背景：**
本轮讨论从如何设计 evaluation 目标和参考研究出发，先在仓库里跑了 MemoryBench 的小规模试验。随后确认：MemoryBench 的无记忆 / BM25 两组以及已有 LoCoMo QA 冒烟，验证的是基准运行与打分链路，没有接入 Edges 的项目记忆流程，因此不能回答这个项目本身是否改善 Agent 的表现。用户要求把真正评测项目本身记录为任务。

此前已选 SWE-ContextBench 作为项目记忆主评测，本次将上述缺口补入这条任务，保留原有主评测方向，不另建同义任务。MemoryBench 本次只跑了 NFCats 的 10 条训练记录和 10 道测试题，两组均分均为 4.5/5；这些结果只作为管道冒烟背景，不作为 Edges 有效性的证据。

- 预期价值：用可重复的对照实验判断 Edges 记忆是否改善任务完成、约束遵守及成本，允许得到无增益或负面结果。
- 非目标：不把官方基线的分数当成 Edges 的成绩，不把本任务缩成再跑一次官方评测，也不自动恢复 LoCoMo 四臂探索。
- 关联：[公开 benchmark 选型](../2026-09-11--找公开benchmark证明memory有效性/INDEX.md)、[知识库 Evaluation 系统](../2026-09-13--知识库Evaluation系统/INDEX.md)、[冒烟与基准证明的边界](../../../../../docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md)。

**目标：**
以 Edges 项目记忆流程作为被评系统，将“交互或反馈 → 沉淀记忆 → 新会话发现并读取 → 应用到任务”接入主评测。在相同底座模型、Agent、测试任务和资源约束下，比较启用与禁用 Edges 记忆的表现，形成有可核对证据、明确适用范围的结论。

**动作：**
- 执行前先 grill-with-docs，确认 SWE-ContextBench 的任务与要测能力是否匹配，确定测试集、指标、样本规模和预算；保留原有主评测与 LoCoMo 冒烟分开的边界。
- 让评测 Agent 实际走 Edges 的记忆沉淀、AGENTS.md 索引发现、检索和应用流程；以新的测试会话检验跨会话使用，不用简单全文索引代替被评系统。
- 在同一套实验条件下运行启用 / 禁用 Edges 记忆的对照，记录记忆读写、逐题任务结果及 token、耗时，分析成功和失败样例。

**完成标准：**
- [ ] 有可复跑的主评测入口，运行记录能核对 Edges 记忆确实被写入，并在新的测试会话中被发现和读取。
- [ ] 对相同模型、Agent 和测试任务完成启用 / 禁用 Edges 记忆的对照，保留逐题结果与成本记录。
- [ ] 报告明确区分官方基线冒烟和 Edges 本身的评测，说明效果、失败情形与证据局限；不以分数必须提高作为任务完成条件。
