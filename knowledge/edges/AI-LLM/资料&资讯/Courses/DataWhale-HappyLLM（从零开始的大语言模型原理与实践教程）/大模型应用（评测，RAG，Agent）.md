# 大模型应用（评测，RAG，Agent）

- [LLM的评测](#llm%E7%9A%84%E8%AF%84%E6%B5%8B)
- [RAG](#rag)
- [Agent](#agent)

---

## LLM的评测
## RAG
<font style="color:rgb(52, 73, 94);">RAG通过在语言模型生成答案之前，先从广泛的文档数据库中检索相关信息，然后利用这些信息来引导生成过程，从而极大地提升了内容的准确性和相关性。RAG有效地缓解了幻觉问题，提高了知识更新的速度，并增强了内容生成的可追溯性，使得大型语言模型在实际应用中变得更加实用和可信。</font>

<font style="color:rgb(52, 73, 94);">幻觉，时效，可信</font>



<font style="color:rgb(52, 73, 94);">RAG的基本结构有哪些呢？</font>

+ <font style="color:rgb(52, 73, 94);">向量化模块：用来将文档片段向量化。</font>
+ <font style="color:rgb(52, 73, 94);">文档加载和切分模块：用来加载文档并切分成文档片段。</font>
+ <font style="color:rgb(52, 73, 94);">数据库：存放文档片段及其对应的向量表示。</font>
+ <font style="color:rgb(52, 73, 94);">检索模块：根据 Query（问题）检索相关的文档片段。</font>
+ <font style="color:rgb(52, 73, 94);">大模型模块：根据检索到的文档回答用户的问题。</font>

<font style="color:rgb(52, 73, 94);"></font>

<font style="color:rgb(52, 73, 94);">接下来，让我们梳理一下RAG的流程是什么样的呢？</font>

+ **<font style="color:rgb(44, 62, 80);">索引</font>**<font style="color:rgb(52, 73, 94);">：将文档库分割成较短的片段，并通过编码器构建向量索引。</font>
+ **<font style="color:rgb(44, 62, 80);">检索</font>**<font style="color:rgb(52, 73, 94);">：根据问题和片段的相似度检索相关文档片段。</font>
+ **<font style="color:rgb(44, 62, 80);">生成</font>**<font style="color:rgb(52, 73, 94);">：以检索到的上下文为条件，生成问题的回答。</font>

```python
RAG_PROMPT_TEMPLATE="""
使用以上下文来回答用户的问题。如果你不知道答案，就说你不知道。总是使用中文回答。
问题: {question}
可参考的上下文：
···
{context}
···
如果给定的上下文无法让你做出回答，请回答数据库中没有这个内容，你不知道。
有用的回答:
"""
```

  
  


## Agent
<font style="color:rgb(52, 73, 94);">简单来说，大模型Agent是一个以LLM为核心“大脑”，并赋予其自主规划、记忆和使用工具能力的系统。 它不再仅仅是被动地响应用户的提示（Prompt），而是能够：</font>

1. <font style="color:rgb(52, 73, 94);">理解目标（Goal Understanding）： 接收一个相对复杂或高层次的目标（例如，“帮我规划一个周末去北京的旅游行程并预订机票酒店”）。</font>
2. <font style="color:rgb(52, 73, 94);">自主规划（Planning）： 将大目标分解成一系列可执行的小步骤（例如，“搜索北京景点”、“查询天气”、“比较机票价格”、“查找合适的酒店”、“调用预订API”等）。</font>
3. <font style="color:rgb(52, 73, 94);">记忆（Memory）： 拥有短期记忆（记住当前任务的上下文）和长期记忆（从过去的交互或外部知识库中学习和检索信息）。</font>
4. <font style="color:rgb(52, 73, 94);">工具使用（Tool Use）： 调用外部API、插件或代码执行环境来获取信息（如搜索引擎、数据库）、执行操作（如发送邮件、预订服务）或进行计算。</font>
5. <font style="color:rgb(52, 73, 94);">反思与迭代（Reflection & Iteration）： （在更高级的Agent中）能够评估自己的行为和结果，从中学习并调整后续计划。</font>

<font style="color:rgb(52, 73, 94);"></font>

<font style="color:rgb(52, 73, 94);">虽然LLM Agent的概念还在快速发展中，但根据其设计理念和能力侧重，我们可以大致将其分为几类：</font>

<font style="color:rgb(52, 73, 94);">任务导向型Agent（Task-Oriented Agents）：</font>

+ <font style="color:rgb(52, 73, 94);">特点： 专注于完成特定领域的、定义明确的任务，例如客户服务、代码生成、数据分析等。</font>
+ <font style="color:rgb(52, 73, 94);">工作方式： 通常有预设的流程和可调用的特定工具集。LLM主要负责理解用户意图、填充任务槽位、生成回应或调用合适- 的工具。</font>
+ <font style="color:rgb(52, 73, 94);">例子： 专门用于预订餐厅的聊天机器人、辅助编程的代码助手（如GitHub Copilot在某些高级功能上体现了Agent特性）。</font>

<font style="color:rgb(52, 73, 94);">规划与推理型Agent（Planning & Reasoning Agents）：</font>

+ <font style="color:rgb(52, 73, 94);">特点： 强调自主分解复杂任务、制定多步计划，并根据环境反馈进行调整的能力。它们通常需要更强的推理能力。</font>
+ <font style="color:rgb(52, 73, 94);">工作方式： 常采用特定的思维框架，如ReAct (Reason+Act)，让模型先进行“思考”（Reasoning）分析当前情况和所需行动，然后执行“行动”（Action）调用工具，再根据工具返回结果进行下一轮思考。Chain-of-Thought (CoT) 等提示工程技术也是其推理的基础。</font>
+ <font style="color:rgb(52, 73, 94);">例子： 需要整合网络搜索、计算器、数据库查询等多种工具来回答复杂问题的研究型Agent，或者能够自主完成“写一篇关于XX主题的报告，并配上相关数据图表”这类任务的Agent。</font>

<font style="color:rgb(52, 73, 94);">多Agent系统（Multi-Agent Systems）：</font>

+ <font style="color:rgb(52, 73, 94);">特点： 由多个具有不同角色或能力的Agent协同工作，共同完成一个更宏大的目标。</font>
+ <font style="color:rgb(52, 73, 94);">工作方式： Agent之间可以进行通信、协作、辩论甚至竞争。例如，一个Agent负责规划，一个负责执行，一个负责审查。</font>
+ <font style="color:rgb(52, 73, 94);">例子： 模拟软件开发团队（产品经理Agent、程序员Agent、测试员Agent）来自动生成和测试代码；模拟一个公司组织结构来完成商业策划。AutoGen、ChatDev等框架支持这类系统的构建。</font>

<font style="color:rgb(52, 73, 94);">探索与学习型Agent（Exploration & Learning Agents）：</font>

+ <font style="color:rgb(52, 73, 94);">特点： 这类Agent不仅执行任务，还能在与环境的交互中主动学习新知识、新技能或优化自身策略，类似于强化学习中的Agent概念。</font>
+ <font style="color:rgb(52, 73, 94);">工作方式： 可能包含更复杂的记忆和反思机制，能够根据成功或失败的经验调整未来的规划和行动。</font>
+ <font style="color:rgb(52, 73, 94);">例子： 能在未知软件环境中自主探索学习如何操作的Agent，或者在玩游戏时不断提升策略的Agent。</font>



> 更新: 2025-08-01 02:34:54  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gbbkd9a58bg9ir5r>