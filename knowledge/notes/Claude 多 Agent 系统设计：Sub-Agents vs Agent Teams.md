# Claude 多 Agent 系统设计：Sub-Agents vs Agent Teams

很多人一旦觉得任务复杂，就本能地想上多 Agent。

这几乎总是错误的起点。

真正应该问的不是：

> 是否需要多个 Agent？

而是：

> 这个任务本质上需要 **什么类型的协同机制（coordination）**？

这个答案会直接决定系统架构。

Claude 当前提供两种本质不同的多 Agent 范式：

- **Sub-agents：通过隔离实现并行**
- **Agent teams：通过通信实现协同**

它们表面相似，但解决的是完全不同的问题空间。

---

## Sub-Agents：通过隔离实现并行

Sub-agent 本质是一个 **短生命周期的专用认知 worker**，  
运行在独立 context window 中。

最好的心智模型是：

> 研究负责人 + 分工研究员

主 Agent 提出问题  
子 Agent 深度探索  
最终只返回 **压缩后的结论信号**

### 核心特性

- 独立 system prompt（定义专长）
- 限制工具访问范围
- 完全隔离的上下文记忆
- 单一明确任务
- 仅返回最终总结，不返回推理过程

Sub-agent 的真正价值不是并行速度，  
而是：

> **认知压缩（cognitive compression）**

它能避免 exploratory reasoning 污染主 Agent 的上下文。

### 强约束（这是 feature 不是 bug）

- 子 Agent 不能再 spawn agent  
- 子 Agent 之间不能通信  
- 所有信息流必须经过 parent  

这种结构带来的好处是：

> 系统可预测、可 debug、可控制复杂度

### 适用场景

当任务具有以下特征时：

- 可完全独立拆分  
- 探索空间巨大  
- 主任务只需要摘要结果  
- 中间推理属于噪声  

典型例子：

- 代码库搜索分析  
- 多路径市场调研  
- 技术方案探索  
- RAG 检索多样性扩展  

Sub-agents 本质是：

> **fire-and-forget 认知计算单元**

---

## Agent Teams：通过通信实现协同

Agent team 是 **长生命周期的协作系统**。

更接近一个真实的软件团队。

系统结构包含：

- Team lead：负责规划与综合决策
- Teammates：独立 context 的并行执行者
- Shared task graph：任务依赖与状态管理

Agent 会：

- 持续积累上下文
- 在执行过程中互相通信
- 动态调整任务假设
- 实时暴露 blocker

这意味着：

> 一个线程的发现可以立即改变另一个线程的执行路径

### 适用场景

需要持续协同演化的任务，例如：

- feature delivery pipeline
- 产品设计迭代
- 复杂系统 debugging
- 多阶段规格谈判

Agent teams 优化的不是吞吐量，而是：

> **不确定环境下的认知对齐能力**

---

## 核心区别（最重要）

Sub-agents 优化的是：

> **清晰边界下的并行吞吐**

Agent teams 优化的是：

> **动态变化中的协同一致性**

可以类比为：

- Sub-agents ≈ MapReduce  
- Agent teams ≈ 敏捷团队  

选错范式，会产生隐藏的系统延迟与推理质量衰减。

---

## 多 Agent 设计的第一性原则

大多数失败架构的根源是：

> 按角色拆分，而不是按上下文拆分

常见错误模式：

- planner → implementer → tester  
- 信息在每次 handoff 中衰减  
- 隐式设计假设丢失  

正确方法是：

> 按 **context overlap surface** 拆分

如果两个子任务：

- 需要共享深层设计状态  
→ 应该属于同一个 Agent  

例如：

> 实现 feature 的 Agent 通常也应该编写测试

否则会产生：

- 架构假设不一致  
- API 语义误解  
- 调试成本指数级上升  

只有当：

- 接口足够清晰  
- 信息损耗可接受  
- 推理状态可模块化  

并行化才真正产生价值。

---

## 五种稳定的 Agent 编排模式

现实生产系统几乎都由以下原语组合而成：

1. Prompt chaining  
   顺序推理流水线

2. Routing  
   根据任务复杂度调度模型或专家 Agent

3. Parallelization  
   独立任务分区或投票生成

4. Orchestrator-worker  
   中央规划 + worker 执行（最主流模式）

5. Evaluator-optimizer  
   生成-评估-迭代闭环

多 Agent 架构的本质不是创造新模式，  
而是：

> **在正确边界上组合这些模式**

---

## 什么情况下多 Agent 才值得做

只有在以下三种情况下，多 Agent 才真正产生 ROI：

### 1️⃣ 上下文保护

子任务会产生大量与主目标无关的信息。

### 2️⃣ 真正的并行搜索

独立路径探索可以提升最终解质量。

### 3️⃣ 专业化压力

单 Agent：

- tool surface 过大  
- system prompt 冲突  
- cognitive load 过高  

---

## 什么时候不应该使用多 Agent

- Agent 需要频繁同步状态  
- 依赖关系比执行成本更高  
- 单 Agent prompt engineering 已可达到目标质量  

特别是代码生成场景：

> 多 Agent 并行写代码  
> 会隐式形成不同架构假设  

最终 merge 成本极高。

更合理方式是：

- Sub-agent 做分析  
- 主 Agent 统一实现  

---

## 常见失败模式

### 1️⃣ 任务定义模糊

→ Agent 重复劳动  
→ 系统 token 成本爆炸  

### 2️⃣ 验证标准模糊

→ Agent “误判完成”  
→ 质量幻觉  

### 3️⃣ 模型成本无控制

→ 系统不可规模化  

成熟系统会：

- 定义严格 deliverable schema  
- 设置可量化 completion criteria  
- 建立模型分层调度策略  

---

## 唯一真正重要的设计原则

> 围绕 **context boundary** 设计系统  
而不是围绕组织结构或角色幻想。

正确路径是：

1. 从单 Agent 开始  
2. 持续施压直到推理质量下降  
3. 找到真实认知瓶颈  
4. 在该位置引入隔离 / 持久 / 并行  

系统复杂度应该：

> 只在消除真实瓶颈时增加

否则只是认知幻觉工程。