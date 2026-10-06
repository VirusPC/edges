# 5. Patterns for Highly Atomnonous Agents

- [总结](#%E6%80%BB%E7%BB%93)
- [Planning workflows](#planning-workflows)
- [Creating and executing LLM plans](#creating-and-executing-llm-plans)
- [Planing with code execution](#planing-with-code-execution)
- [Multi-agent workflows](#multi-agent-workflows)
- [Communication patterns for multi-agent systems](#communication-patterns-for-multi-agent-systems)
- [Conclusion](#conclusion)

---

## 总结
## Planning workflows
重点讲如何让LLM自主决定执行步骤与调用工具顺序，而不是预先硬编码流程。



核心思想：不给定固定流程，先让LLM输出分步计划，再逐步执行；每步结合上下文（工具说明、用户请求）与上一步输出。



<font style="color:rgb(38, 38, 38);">工作流：</font>

1. <font style="color:rgb(38, 38, 38);">向LLM提供工具清单与描述。</font>
2. <font style="color:rgb(38, 38, 38);">要求LLM产出“逐步计划”（明确每步要做什么、用哪个工具）。</font>
3. <font style="color:rgb(38, 38, 38);">串行执行：把“第N步指令+前一步结果+上下文”交给LLM执行，直到产出最终答复。</font>



优点：无需预先硬编码工具调用顺序，面对不同请求可自适应规划。



挑战：在高代理性代码系统中已有效；在其他领域采用度增长中。挑战是运行时计划难以完全预知与控制。

## Creating and executing LLM plans
## Planing with code execution
## Multi-agent workflows
## Communication patterns for multi-agent systems
## Conclusion


> 更新: 2025-11-12 02:11:24  
> 原文: <https://www.yuque.com/viruspc/el3mi0/oumhkp7nif5khhei>