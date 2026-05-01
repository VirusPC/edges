这篇文章介绍了 5 种常见多智能体（multi‑agent）协同模式、各自适用场景与演进路径，核心建议是：**从能满足需求的最简单模式开始，用实际瓶颈来驱动演化**。[claude](https://claude.com/blog/multi-agent-coordination-patterns)

## 五种模式一览

|场景关键词|推荐模式|核心特征|
|---|---|---|
|质量极其重要、有明确评估标准|Generator‑Verifier|生成 + 审核循环，直到通过或到达上限。[claude](https://claude.com/blog/multi-agent-coordination-patterns)|
|任务可清晰拆分、子任务边界清楚|Orchestrator‑Subagent|有「组长」负责任务规划与结果汇总。[claude](https://claude.com/blog/multi-agent-coordination-patterns)|
|并行、大量、长期独立子任务|Agent Teams|多个长期存活的 worker 逐步积累上下文。[claude](https://claude.com/blog/multi-agent-coordination-patterns)|
|事件驱动、Agent 生态持续扩展|Message Bus|发布/订阅消息总线，路由事件给合适 agent。[claude](https://claude.com/blog/multi-agent-coordination-patterns)|
|多 Agent 需要实时共享发现、协同研究|Shared State|公共存储作为「共享工作台」，无中心协调器。[claude](https://claude.com/blog/multi-agent-coordination-patterns)|

## 各模式要点

1. Generator‑Verifier（生成‑校验）
    
    - 流程：生成器产出初稿 → 校验器按显式标准打回或通过 → 迭代至收敛或达到轮数上限。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 适合：代码生成+测试、事实核查、合规审查、评分打分等「错一次成本很高但可定义规则」的场景。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 风险：若校验标准模糊，只会形成「质量错觉」；还可能在反馈‑修正循环里振荡不收敛。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        ![[Pasted image 20260501214603.png]]
1. Orchestrator‑Subagent（编排‑子 Agent）
    
    - 流程：一个主 orchestrator 负责拆解任务、分配给专长子 agent，再汇总结果，例如代码评审系统由不同子 agent 分别查安全、测试覆盖、风格等。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 适合：流水线结构清晰、各检查/子任务相对独立的场景，如 PR code review。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 局限：信息需通过 orchestrator 中转，易成瓶颈和信息损失；若没并行执行，还会变成昂贵但不够快的串行流程。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        ![[Pasted image 20260501214609.png]]
1. Agent Teams（Agent 团队）
    
    - 特点：coordinator 只负责分配任务和收集结果，多个长期存活的 worker 持续处理来自队列的任务，保留跨任务的上下文和领域知识。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 适合：大规模并行且彼此基本独立的任务，如大规模代码迁移，每个服务由一个 teammate 长时间负责迁移与修复。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 难点：如果任务之间有隐含依赖，worker 彼此不感知会产出冲突结果；资源共享时还需处理写冲突和任务完成检测。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    - ![[Pasted image 20260501214623.png]]

2. Message Bus（消息总线）
    
    - 流程：Agent 只做发布/订阅，Router 根据主题或语义把事件分发给订阅者，例如安全运营中由 triage agent 分类告警，再路由给不同调查 agent 和响应 agent。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 适合：事件驱动的复杂流水线，告警类型、Agent 类型都在持续演化，需要随时插拔新能力。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 问题：链路可观测性差、调试困难；路由错误常表现为「静默失败」而非明显崩溃。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        ![[Pasted image 20260501214549.png]]
3. Shared State（共享状态）
    
    - 流程：所有 Agent 直接读写共享数据库/文档，由初始化写入问题或数据，再以时间/收敛阈值/专门「终止 Agent」等方式决定结束。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 适合：多 Agent 做协同研究、需要频繁相互引用彼此发现的场景，例如文献、行业报告、专利、新闻多源联合研究。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        
    - 风险：易出现重复劳动和「反应性循环」(Agent 之间不断相互触发写入，消耗大量 Token 不收敛)，需要明确终止条件与行为约束。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
        ![[Pasted image 20260501214554.png]]

## 模式之间如何选择与演进

文章从三个维度给了选择建议：[claude](https://claude.com/blog/multi-agent-coordination-patterns)

- Orchestrator‑Subagent vs Agent Teams：看子任务是否需要跨多轮保留上下文；短平快用 orchestrator，长期演进用 teams。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    
- Orchestrator‑Subagent vs Message Bus：看流程是否可预先编排；固定流程用 orchestrator，结构高度依赖事件/告警类型时用 bus。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    
- Agent Teams vs Shared State：看 Agent 是否需要消费彼此中间结果；只汇总最终结果用 teams，需要实时协作则用 shared state。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    
- Message Bus vs Shared State：看是事件流水线还是累积知识库；要消除中心单点时更偏向 shared state。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    

## 实战落地建议

- 多数团队可以先从 Orchestrator‑Subagent 起步，因为覆盖面广、协调复杂度低，再根据真实瓶颈逐步引入 Teams、Bus 或 Shared State 等混合架构。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    
- 生产系统往往是混搭：例如整体用 orchestrator 跑流程，在某个强协作子任务里用 shared state，或用 message bus 做事件路由、由 team‑style worker 处理各事件类型。[claude](https://claude.com/blog/multi-agent-coordination-patterns)
    

如果你说说你当前在做的 agent 系统是偏「工具链编排」还是「知识协同」，我可以帮你把文中的模式直接映射成一份架构建议图。