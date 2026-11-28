---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-28T04:05:28.161Z'
  edges-title: Compose 不把个人记忆绑进项目
  edges-tasks-status: backlog
  edges-task-priority: high
name: compose_不把个人记忆绑进项目
description: Compose 常常是个人行为，不该把个人大脑以 git submodule 写进共享项目。要重新设计组合方式，让项目不绑定个人记忆。
---
**背景：**
你提出：Compose 很多时候都是个人行为，不应该直接把 git submodule 写进项目。以把个人大脑接入项目为例，如果每个人都这样接入，项目仓库会挂满各人的大脑，功能和隐私都不合理。关键点是：项目不应该绑定个人记忆。随后你要求先记一张高优任务卡，并说明这涉及整合模块设计。
- 现状：按 ADR 0042，`edges compose add --remote` 会在当前仓库里执行 `git submodule add`，并把 `.gitmodules` 和 Compose 登记一并提交。文档里的常用例子，也包括把个人大脑加进当前目录。
- 已有约束：ADR 0053 已把「把个人大脑 Compose 进某个代码项目」降为可选旁路，主路径是跨客户端复用同一份大脑；你的个人工作区也是在工作区根挂大脑，而不是写进某个共享项目的 Compose。
- 预期收益：共享项目不再因为个人组合而堆积或泄露个人记忆，功能边界也更清楚。
- 非目标：本卡不做 Compose 卸载命令（已有独立卡）；不把大脑主路径改回「Compose 进项目」。
- 关联：ADR 0034、0042、0053；任务卡「Compose：补卸载能力」「个人大脑跨客户端与工作空间接入指南」。

**目标：**
完成 Compose 的整合模块设计，使个人性质的组合（尤其是个人大脑）不再以 git submodule 写进项目仓库，项目本身不绑定个人记忆。

完成标准待 grill-with-docs 补。
