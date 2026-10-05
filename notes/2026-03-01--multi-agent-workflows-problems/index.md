# 多 Agent 系统的问题与反思

> 本文综合了两篇关于多 Agent 系统的深度内容：
> - GitHub Blog: [Multi-agent workflows often fail. Here's how to engineer ones that don't.](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/)
> - Indigo Talk EP43: [一个 Agent 可能比十个更好用](https://www.indigox.me/indigo-talk-ep43/) (嘉宾: 李霄霄教授，UBC TEA Lab)

---

## 一、GitHub Blog：为什么多 Agent workflow 会失败

### 核心观点

大多数多 Agent workflow 失败的原因不是模型能力不足，而是**缺少结构设计**。

### 失败场景

- Agent A 刚开了一个 issue，Agent B 就把它关了
- Agent 提交了改动，但不知道下游检查会失败
- Agents 在处理相关任务时做出关于状态、顺序、验证的隐式假设

### 三个工程模式让 Agent 系统更可靠

#### 1. 自然语言混乱 → Typed Schemas 让其可靠

**问题**: Agents 交换混乱的自然语言或不一致的 JSON，字段名变化、数据类型不匹配

**解决**: 
```typescript
type UserProfile = {
  id: number;
  email: string;
  plan: "free" | "pro" | "enterprise";
};
```

- 机器可检查的数据
- 无效消息快速失败
- 调试从"看日志猜"变成"这个 payload 违反了 schema X"

#### 2. 模糊意图破坏 Agents → Action Schemas 明确意图

**问题**: "分析这个 issue 并帮团队采取行动"听起来清晰，但不同 Agent 可能关闭、分配、升级或什么都不做

**解决**:
```typescript
const ActionSchema = z.discriminatedUnion("type", [
  { type: "request-more-info", missing: string[] },
  { type: "assign", assignee: string },
  { type: "close-as-duplicate", duplicateOf: number },
  { type: "no-action" }
]);
```

- 定义允许的确切动作集合
- Agents 必须返回一个有效动作
- 其他情况验证失败，重试或升级

#### 3. 松散接口造成错误 → MCP 提供结构

**解决**: Model Context Protocol (MCP) 作为执行层

```json
{
  "name": "create_issue",
  "input_schema": { ... },
  "output_schema": { ... }
}
```

- 为每个工具和资源定义显式的输入输出 schema
- 调用前验证，防止坏状态进入生产系统
- Agents 不能发明字段、省略必需输入

**核心转变**: 把 Agents 当作代码，而不是聊天界面

---

## 二、Indigo Talk：一个 Agent 可能比十个更好用

### 嘉宾背景

李霄霄教授，UBC Trusted and Efficient AI (TEA) Lab 负责人，研究背景横跨耶鲁、普林斯顿、Vector Institute，从神经科学转向 AI 系统研究。

### Agent 的定义演进

**1995 年教科书定义** (Peter Norvig & Stuart Russell):
> Agent 是一个可以感知环境、根据环境自主决策、以最大化目标的系统

**Anthropic 的现代区分**:
- **Workflow**: 大模型和工具在既定路线下进行交互
- **Agent**: 具备自主 Planning 和进化的能力，不仅能使用工具，甚至能创造工具

**核心**: 真正让 Agent 成为 Agent 的是**自主规划能力**

### 人类认知局限与 AI 的平行困境

#### 人类认知的限制

1. **工作记忆容量有限** - 大脑一次只能处理有限信息
2. **注意力有限** - Hick's Law: 选项越多，反应时间和错误率急剧上升
3. **技能容量有限** - 同时掌握过多技能会导致性能下降

#### AI 的类似瓶颈

李霄霄教授的研究发现：
> 当给 AI Agent 配备越来越多 Skill 时，性能在 **20-30 个 Skill** 时达到最佳；再往上加，性能饱和甚至下降

**原因**: 上下文窗口就是 AI 的「工作记忆」，当 Context 变得非常长时，AI 也会 Lost in the Middle

### 单 Agent vs 多 Agent：效率之争

#### 研究发现

论文: [When Single-Agent with Skills Replace Multi-Agent Systems and When They Fail](https://arxiv.org/abs/2601.04748)

**单 Agent + 多技能 优于 多 Agent 协作的场景**:
- 可以串行处理的任务
- 沟通成本成为瓶颈时
- 错误累积风险高时（串联架构中一个错误会传导到下游）

**类比**: 一个人既会切菜又会炒菜，做一道菜可能比两个人流水线配合更快——单人操作时上下文连续，可以灵活优化工作流

#### 多 Agent 仍然必要的场景

1. **需要角色分离的任务**
   - 示例: Anthropic 的 Agent Team 演示（16 个 Agent 合作完成 C 编译器）
   - 写代码和审核代码必须是不同的人（不能既当裁判又当选手）
   - 单个 Agent 的记忆空间无法隔离生产者和审核者角色

2. **可有效并行分片的任务**
   - Claude Code 会自动判断何时启动 Sub Agent
   - 动态决定分包 vs 自己做，像出色的人类调度指挥

### AI 的组织形态：不必模仿人类

#### 当前问题

多 Agent 架构过度模仿人类组织层级，但：
- 人类组织是冗余和低效的（需要休息、有情绪、有自尊心）
- AI 不需要这些层级

#### 未来可能的形态：Swarm Learning

**类比**: 鸟群和蚁群
- 鸟群没有 Leader，单只鸟智能有限，但群体形成高效组织
- 蚂蚁没有指挥官，但简单的职能分工 + 涌现默契 = 集体智能

**展望**: 未来多 Agent 系统可能不需要中央调度员，而是通过去中心化协作机制自发形成高效组织

### AI 失败容忍与安全设计

不同场景容忍度天差地别：
- **医疗/法律**: 需要极高准确性
- **一般任务**: 可以有更高容错

**关键机制**: 
- **Confidence Score（置信度评分）**
- 低置信度内容高亮提示
- 强制人工审查机制（如医疗 AI 高亮可能错误的关键词并链接到文献）

### 外骨骼隐喻：当 AI 让大脑「萎缩」

#### 问题

Anthropic 研究显示：长期使用 Claude Code 的开发者，编程能力出现退化

#### 隐喻

外骨骼让你轻松举重，但肌肉会萎缩。同理：
- 过度依赖 AI 会让大脑产生惰性
- 技能型工作被 AI 取代，但「意义感」和「目标感」无法被 AI 给予

#### 教育转型

**从**: 教技能（工业化时代延续至今）
**转向**: 教意义和目标感

**核心**: 当 AI 可以即拿即用提供 Skill 时，人必须能够自己形成目标

---

## 综合启示

### 1. 结构 > 能力

- GitHub: Typed schemas、action schemas、MCP 让系统可靠
- Indigo Talk: 单 Agent 在结构合适时比多 Agent 更高效

### 2. 沟通成本是核心瓶颈

- 多 Agent 之间的每次沟通都有信息损失
- 上下文连续性是效率的关键

### 3. 不要盲目堆叠 Agents 或 Skills

- 20-30 个 Skills 是甜点，超过后性能下降
- 多 Agent 仅在角色分离或并行分片必要时使用

### 4. 当前架构可能过度拟合人类组织

- AI 可能有完全不同的原生协作方式（Swarm Learning）
- 去中心化、无 Leader 可能是更优解

### 5. 过度依赖的代价

- 长期使用 AI 会导致认知能力退化
- 需要在「使用 AI 提效」和「保持核心能力」之间找到平衡

---

## 实践建议

| 场景 | 建议 |
|------|------|
| 串行任务 | 优先单 Agent + Skills |
| 需要角色隔离 | 使用多 Agent |
| 可并行分片 | 使用多 Agent + 动态调度 |
| 数据交换 | 使用 Typed Schemas |
| 动作定义 | 使用 Action Schemas 约束 |
| 工具调用 | 使用 MCP 强制执行 |
| 高风险领域 | 加入 Confidence Score 和高亮机制 |
| 日常使用 | 保持一定手动操作，避免认知萎缩 |
