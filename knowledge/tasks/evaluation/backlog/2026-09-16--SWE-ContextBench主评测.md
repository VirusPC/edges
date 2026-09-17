---
name: swe_contextbench_main_eval
description: SWE-ContextBench 主评测（公开基准证明）；与 LoCoMo 冒烟分开，构念匹配的主证据任务
metadata:
  edges-type: task
  edges-title: SWE-ContextBench 主评测（公开基准主证据）
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:12.901Z"
  edges-task-project: evaluation
---

跑 SWE-ContextBench 作为 filesystem / project-memory **主证据**评测（公开基准、构念匹配），与 LoCoMo 冒烟完全分开。

**Why:**
Agent Memory 专家与 peng cheng 已定：主证据仍是 SWE-ContextBench；LoCoMo 只用来先跑通评测管道，**不**证明 project-memory。`找公开 benchmark 证明 memory 有效性` 是选标尺；本条是把已选主标尺 **SWE-ContextBench** 做成可执行主评测任务。

**How to apply:**
- 与 LoCoMo 冒烟拆开排期与交付；可互链但不共享「证明有效」结论。
- 相关：`knowledge/tasks/_default/backlog/2026-09-11--找公开benchmark证明memory有效性.md`（选标尺）；`2026-09-16--LoCoMo评测流水线冒烟.md`（管道冒烟，非本条证据）。
- 明确构念匹配：测的是上下文/记忆检索对软件工程任务的帮助，不是对话式 LoCoMo QA 分数。
- **非目标：** 不把 LoCoMo 当 project-memory 证明；不把本条缩成 LoCoMo 冒烟的附属项。
- 派发时默认先 grill-with-docs。
