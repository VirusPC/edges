

https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory

# 内容总结
这篇白皮书《Context Engineering: Sessions & Memory》由 Kimberly Milam 和 Antonio Gulli 撰写（2025年11月），系统介绍了构建有状态 AI 智能体的核心技术框架。以下是主要内容总结：

---

## 一、Context Engineering（上下文工程）

**核心概念**：LLM 本质上是无状态的，每次 API 调用只能感知当前上下文窗口内的信息。Context Engineering 就是动态组装和管理这个上下文窗口的过程，是 Prompt Engineering 的进化版——它不只关注静态指令，而是动态构建包含用户历史、外部数据、工具输出等的完整上下文。

上下文的组成要素分三类：
- **引导推理的上下文**：系统指令、工具定义、少样本示例
- **事实与证据数据**：长期记忆、外部知识（RAG）、工具输出、子智能体输出
- **即时对话信息**：对话历史、临时状态/草稿、用户当前提问

---

## 二、Sessions（会话）

**会话**是单次对话的容器，包含两个核心要素：
- **Events（事件）**：用户输入、智能体回复、工具调用、工具输出等的时序记录
- **State（状态）**：临时结构化数据，如购物车内容

**多智能体系统中的会话管理**有两种模式：
- **共享统一历史**：所有智能体共写同一个会话日志，适合紧密协作场景
- **独立私有历史**：每个智能体维护自己的历史，通过 Agent-as-a-Tool 或 A2A 协议通信

**生产环境注意事项**：安全隔离（ACL 权限控制、PII 脱敏）、数据生命周期管理（TTL 策略）、性能优化（减少传输数据量）。

---

## 三、长上下文管理策略

随着对话增长，面临上下文窗口限制、API 成本上升、延迟增加、"上下文腐化"等问题。常见的压缩策略包括：

| 策略 | 说明 |
|------|------|
| 保留最近 N 轮 | 滑动窗口，丢弃旧内容 |
| 基于 Token 截断 | 从最新消息向前计数，超出则截断 |
| 递归摘要 | 用 LLM 对旧对话生成摘要，替代原始内容 |

触发压缩的时机：基于数量阈值、基于时间（用户不活跃）、基于事件（任务完成）。

---

## 四、Memory（记忆）

**记忆**是从对话或数据源中提取的持久化信息快照，跨会话保存，为智能体提供连续、个性化的体验。

**记忆的核心价值**：个性化服务、上下文窗口管理、数据洞察挖掘、智能体自我改进。

**记忆的分类维度**：

- **信息类型**：陈述性记忆（"知道什么"，如用户偏好）vs. 程序性记忆（"知道怎么做"，如工具调用流程）
- **组织模式**：集合（多条独立记忆）、结构化用户档案（类似联系人卡片）、滚动摘要（单一持续更新的文档）
- **存储架构**：向量数据库（语义相似度检索）、知识图谱（关系推理）、混合方案
- **创建机制**：显式记忆（用户主动要求记住）vs. 隐式记忆（智能体从对话中自动提取）
- **作用范围**：用户级（跨会话个性化）、会话级（单次会话压缩）、应用级（全局共享上下文）

---

## 五、RAG vs. Memory 的本质区别

| 维度 | RAG | Memory |
|------|-----|--------|
| 目标 | 注入外部事实知识 | 构建个性化、有状态体验 |
| 数据来源 | 静态知识库 | 用户对话历史 |
| 隔离级别 | 共享（全局只读） | 高度隔离（按用户） |
| 比喻 | 图书馆研究员 | 私人助理的笔记本 |

> **核心结论**：RAG 让智能体成为世界知识专家，Memory 让智能体成为用户专家，两者缺一不可。

---

**总体而言**，这篇白皮书为开发者提供了构建有状态 AI 智能体的完整理论框架和实践指南，从会话管理到长期记忆，涵盖了架构设计、生产部署、安全隐私等各个层面。

# 重点记录
- **定义**
	- **Context Engineering**: The process of dynamically assembling and managing information within an LLM's context window to enable stateful, intelligent agents.
	- **Sessions**: The container for an entire conversation with an agent, holding the chronological history of the dialogue and the agent's working memory.
	- **Memory**: The mechanism for long-term persistence, capturing and consolidating key information across multiple sessions to provide a continuous and personalized experience for LLM agents.
