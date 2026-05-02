这篇文章详细介绍了Claude Code中的subagents（子代理）功能及其使用场景 。[claude](https://claude.com/blog/subagents-in-claude-code)

## 什么是Subagent

Subagent是一个独立的Claude实例,拥有自己的上下文窗口 。它可以独立完成任务,读取文件、探索代码或进行修改,完成后只将相关结果返回给主对话 。多个subagent可以并行运行,每个都可以有不同的权限设置 。[claude](https://claude.com/blog/subagents-in-claude-code)

## 何时使用Subagent

文章列出了五种适合使用subagent的场景:[claude](https://claude.com/blog/subagents-in-claude-code)

- 避免污染主 agent上下文
- **研究密集型任务**: 当需要阅读大量文件来理解代码时,subagent可以返回总结而不是将几十个文件内容塞入对话
    
- 性能和效率
- **多个独立任务**: 修复多个文件的错误或更新多个组件时,并行subagent可以同时工作,更快完成

- 避免污染子agent 上下文。
- **需要全新视角**: 当需要无偏见的代码审查时,subagent提供一个干净的起点,不继承主对话的假设和盲点
    
- **提交前验证**: 在最终确定更改之前,独立的subagent可以验证实现是否过拟合测试或遗漏边缘情况

- 不分主 Agent、子 Agent，串行的多阶段工作。
- **流水线工作流**: 当任务有明确的阶段划分(设计→实现→测试)时,每个阶段都能获得专注的注意力
    

## 如何调用Subagent

文章介绍了四种调用方式:[claude](https://claude.com/blog/subagents-in-claude-code)

1. **对话式调用**: 直接在对话中要求Claude使用subagent,如"Use a subagent to explore how authentication works"
    
2. **自定义Subagent**: 在`.claude/agents/`目录下创建Markdown文件定义专用subagent,Claude会自动匹配任务并委托
    
3. **CLAUDE.md指令**: 定义何时应该使用subagent的规则,确保团队成员和会话间的一致行为
    
4. **Skills**: 为复杂的多步骤工作流创建可重用接口,存储在`.claude/skills/`目录
    
5. **Hooks**: 在特定生命周期点自动执行的shell命令或LLM提示,实现完全自动化
    

## 何时不应使用Subagent

文章也明确指出了不适合使用subagent的场景:[claude](https://claude.com/blog/subagents-in-claude-code)

- 顺序依赖的工作(每一步都需要前一步的完整输出)
    
- 同一文件的编辑(并行编辑会导致冲突)
    
- 小型任务(委托的开销大于收益)
    
- 过多的专用代理(会降低自动委托的可靠性)
    
- 需要subagent之间互相协调的工作(此时应使用agent teams)
    

文章建议从对话式提示开始,逐步识别重复模式后再构建自动化,让subagent委托变得轻松 。[claude](https://claude.com/blog/subagents-in-claude-code)