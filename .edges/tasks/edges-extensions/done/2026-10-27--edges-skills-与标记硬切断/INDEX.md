---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-27T09:06:32.916Z'
  edges-title: edges-* skills 与标记硬切断
  edges-tasks-status: done
  edges-task-priority: none
  edges-task-assignee: 全栈开发专家
name: edges-* skills 与标记硬切断
description: 随包 skill/标记硬切断只认 edges-*；删除 doctor/reshape；改名 skill 版本从 0.1.0 起重。按已落地结果补记看板。
---
**背景：**
随包 skill / harness 标记仍夹杂 project-*，与 `.edges` 命名不一致。本次未经事先开卡，按 grill→plan→实现直接落地；现补记看板。
- 关联：plan https://edges.viruspc.tech/artifacts/41e6ec0a-56e5-4ed4-8f64-6c7c352e5c33/

**目标：**
硬切断只认 edges-*；删除 project-memory-doctor / reshape；改名后的 skill 版本从 0.1.0 起重。

**完成标准：**
- [x] 硬切断只认 edges-*
- [x] doctor/reshape 删除
- [x] 改名 skill 版本从 0.1.0 起重

## 进展
- 2026-10-27：框架 VirusPC/edges #76 合入（08cfc499）+#77 发版 → npm `@viruspc/edges@0.4.0`（f3d8e23b）。
- 公开脑 VirusPC/edges-brain-viruspc #400 已合（4cc603a）。
- workspace VirusPC/edges-workspace-viruspc #12 已合（6b827755）：pins 到 0.4.0 + 脑 #400。
- 15 个 `skill/<新名>@0.1.0` annotated tag 打在 08cfc499；旧 tag 保留。
- 进行中（非本卡阻塞）：workspace 仓内 `.agents/skills` / skills-lock 旧名清理。
