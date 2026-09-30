---
name: project_scoped_systems_and_harness
description: 讨论递归记忆架构、系统维护或 harness 命名时：系统一／系统二是人和 Agent 共用的相对角色；meta-harness 表示维护对象的层级，自进化须有反馈、验证与采纳闭环，不把 RSI 写成当前已实现能力。
metadata:
  edges-title: 系统一／系统二按作用域建模，区分 harness 层级与自进化
  edges-type: project
  edges-agent-client: codex
  edges-username: Codex
  edges-email: noreply@openai.com
  edges-updated-at: "2026-10-01T02:25:18+08:00"
---

Edges 保留“系统一／系统二”作为同时适用于人和 Agent 的作用域角色；在 Agent 场景中用 harness／meta-harness 描述具体实现，并把递归层级与自进化闭环分开判断。

**Why:** 2026-10-01 的递归记忆架构讨论中，用户澄清系统二关注“如何维护系统一”，随后确认上述术语关系。若按“领域产物／过程记录”切分，会把系统二缩成被动材料集合，也无法解释同一维护系统如何成为新的维护对象。若把 meta 层级直接称为自进化，又会把静态组织关系误写成已有改进能力。

**How to apply:**

- 先确定作用域及其具体目标，再识别系统一和支撑、维护、改进它的系统二。记忆与过程记录是维护所需的材料，不能仅凭“由工作产生”就全部归入系统二。
- 同一对象相对于领域任务可承担系统二的角色；当它自身成为关注和维护对象时，又可作为系统一。此递归关系适用于人和 Agent，不要求每一层采用不同实现或物理目录。
- harness 是 Agent 场景下的工程形态，不替换系统二这一通用概念。以 harness 为对象的维护系统可称 meta-harness；该命名本身不意味着自动优化或修改自身。
- 谈自进化时，明确“自”的系统边界是否包含执行 harness 与改进机制，并检查是否存在执行反馈、提出改进、验证、采纳以及后续使用的闭环。仅保存记忆、日志或增加一层 meta-harness 不足以说明自进化。
- 递归自我改进进一步涉及改进发现问题、评价结果和实施改进的机制。当前仍按受控自进化的方向描述 Edges，重要变更由人判断和采纳，不把 Recursive Self-Improvement 写成已经具备的能力。
- 术语定义见 [CONTEXT.md](../../CONTEXT.md)。这组概念支持“以递归记忆模型重构 Edges 目录架构”的设计讨论；具体目录划分、材料归属与迁移步骤仍需细化，不由术语定义直接推出。

参考用法：[Anthropic Managed Agents](https://www.anthropic.com/engineering/managed-agents) 将支撑不同 harness 的基础设施称为 meta-harness；[Meta-Harness 论文](https://arxiv.org/html/2603.28052v1#S3) 则用该词描述优化任务 harness 的外循环。这里采用的是用户确认的 Edges 建模约定，不宣称行业已有唯一术语定义。
