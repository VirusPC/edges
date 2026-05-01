## 文章核心总结

这是Anthropic团队关于**如何为AI Agent设计工具**的实践经验分享,发表于2026年4月10日。文章核心理念是"像Agent一样思考"(Seeing like an agent),强调工具设计必须匹配模型能力,并随着模型进化而调整。[claude](https://claude.com/blog/seeing-like-an-agent)

## 要解决的核心问题

文章解决的是**Agent工具设计的根本困境**:给Agent提供单一通用工具(如bash)还是数十个专用工具?作者提出的答案是:工具应该"适配模型自身能力"。就像解数学题,纸笔、计算器、编程能力分别适合不同技能水平的人,Agent工具也需要根据模型能力精心设计。[claude](https://claude.com/blog/seeing-like-an-agent)

## 关键设计要点与实践

## 1. AskUserQuestion工具的三次迭代

- **失败尝试1**: 在ExitPlanTool中加入问题数组参数,但造成混淆(计划与问题冲突)[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **失败尝试2**: 用特殊markdown格式输出问题,但模型无法稳定遵循格式[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **成功方案**: 独立的AskUserQuestion工具,在plan模式触发弹窗阻塞agent循环,直到用户回答[claude](https://claude.com/blog/seeing-like-an-agent)
    

## 2. 从Todo到Task的演进

- **早期**: TodoWrite工具帮助模型保持专注,每5轮插入系统提醒[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **问题**: Opus 4.5等新模型发现Todo列表限制了灵活性,且无法支持subagent协同[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **升级**: Task工具支持依赖关系、跨subagent共享更新、动态修改删除[claude](https://claude.com/blog/seeing-like-an-agent)
    

## 3. 渐进式信息披露(Progressive Disclosure)

- **传统RAG**: 预索引向量数据库,主动塞给Claude上下文,但环境适配脆弱[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **Grep工具**: 让Claude自主搜索代码库构建上下文[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **Agent Skills**: 通过递归读取skill文件实现分层搜索,甚至添加API/数据库查询能力[claude](https://claude.com/blog/seeing-like-an-agent)
    
- **Claude Code Guide子agent**: 避免在主agent系统提示中塞入大量文档,而是按需调用专门的文档搜索子agent,保持主context清洁[claude](https://claude.com/blog/seeing-like-an-agent)
    

## 设计原则

1. **工具数量克制**: Claude Code目前约20个工具,新增工具门槛很高,因为每个工具都会增加模型决策负担[claude](https://claude.com/blog/seeing-like-an-agent)
    
2. **持续验证**: 随着模型能力提升,曾经有用的工具可能变成限制,需要不断重新审视[claude](https://claude.com/blog/seeing-like-an-agent)
    
3. **观察驱动**: 仔细阅读模型输出、频繁实验、理解模型如何"看待"工具[claude](https://claude.com/blog/seeing-like-an-agent)
    

## 与最新AI进展的关联

## 1. **工具调用能力的代际差异**

文章反映了从早期LLM到Opus 4.5的能力跃迁。你作为后端开发者可能注意到,这与当前主流模型(如GPT-4、Claude 3.5 Sonnet)向更强推理能力演进的趋势一致——模型不再需要"保姆式"的Todo提醒,转而能自主管理复杂任务依赖关系。[claude](https://claude.com/blog/seeing-like-an-agent)

## 2. **从RAG到Agent Search的范式转变**

传统RAG是"喂食式"检索,而文章展示的Grep+Skills是"狩猎式"主动搜索。这与2024-2026年AI领域从单轮检索增强转向多跳推理(multi-hop reasoning)、工具链组合(tool chaining)的趋势完全吻合。结合你在AI agent和prompt engineering的经验,这意味着你构建的agent-memory系统也应该考虑让agent自主决定查询时机和范围。[claude](https://claude.com/blog/seeing-like-an-agent)

## 3. **Subagent架构的实践验证**

文章中Task工具支持subagent协同、Claude Code Guide作为专门子agent,印证了当前AI系统正从单体agent向分层、专业化agent网络演进。这与你在NestJS微服务架构中的实践类似——单体到分布式、通用到专业化。[claude](https://claude.com/blog/seeing-like-an-agent)

## 4. **Prompt Caching的战术应用**

文章提到ExitPlanTool的设计与prompt caching相关,并链接了专门文章。这是2025-2026年成本优化的关键技术,尤其对你使用的Claude Code这类长context agent至关重要——缓存系统提示和技能定义可大幅降低token开销。[claude](https://claude.com/blog/seeing-like-an-agent)

## 对你的实践启示

1. **自定义Claude Code Skills设计**: 参考渐进式披露原则,你的skill文件应该支持分层引用,而非一次性加载所有上下文[claude](https://claude.com/blog/seeing-like-an-agent)
    
2. **Agent Memory系统优化**: 考虑让agent通过工具调用主动查询memory,而非每次请求都注入全部记忆(类似RAG→Grep的转变)
    
3. **API工具设计**: 为你的NestJS后端设计agent调用的API时,应该提供细粒度工具(如单独的查询、创建、更新端点)而非大而全的接口,匹配模型的决策能力[claude](https://claude.com/blog/seeing-like-an-agent)
    
4. **版本迭代策略**: 正如TodoWrite→Task的演进,你的agent工具也应该随着模型更新(如从Claude 3.5→Opus 4.5)重新评估设计[claude](https://claude.com/blog/seeing-like-an-agent)