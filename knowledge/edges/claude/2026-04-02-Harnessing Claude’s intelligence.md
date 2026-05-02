这篇文章介绍了在 Claude 能力快速演进的背景下，如何设计 **agent harness** 和应用架构，既利用模型越来越强的智能，又兼顾延迟和成本。[claude](https://claude.com/blog/harnessing-claudes-intelligence)

## 文章主旨

核心观点是：不要把 Claude 当成固定能力的“黑盒 API”，而是当成会不断变强的通用智能，用通用工具（bash、文本编辑器、代码执行等）让它自己编排工具、管理上下文和记忆；与此同时，agent harness 需要持续“减法”，去掉已经变成负担的规则和结构，并在 UX、安全、观测性上设置少量关键边界。[claude](https://claude.com/blog/harnessing-claudes-intelligence)

## 模式一：用好 Claude 已经熟悉的工具。模型擅长做什么?

- 建议优先使用 Claude 已经非常熟练的通用工具（如 bash 工具和 text editor 工具），很多高级能力（Agent Skills、programmatic tool calling、memory tool）其实都是在这些基础上组合出来的。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    
- SWE-bench Verified 的表现演进说明：仅靠 bash + 文本编辑器这类通用工具，模型就能不断提高复杂任务上的表现，说明“用模型熟悉的通用工具+让模型自己组合”比为每个任务设计专用工具更可持续。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    

## 模式二：问“我可以停止做什么？”模型可以多做点什么？

这一部分强调把过去写死在 harness 里的逻辑逐步交还给 Claude 自己决策。[claude](https://claude.com/blog/harnessing-claudes-intelligence)

- 让 Claude 自己编排工具：之前是人精心设计工具编排。传统做法是每次工具结果都回流到上下文，让模型读完再决定下一步，这既贵又慢；如果给 Claude 一个代码执行环境（bash 或 REPL），它可以自己写代码来调用工具、过滤结果，只把必要的输出回写到上下文，从而减少 token 开销并加速推理。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    
- 让 Claude 自己管理上下文：之前是人给它拼接上下文。不要在 system prompt 里堆积一堆 task-specific 规则，而是用 skills 的 YAML frontmatter 提供轻量描述，当需要时再让 Claude 通过读文件工具渐进式加载；同时用 context editing 移除过时内容，用 subagents 在需要时 fork 新上下文。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    
- 让 Claude 自己持久化上下文：之前是人给它选择记忆和做记忆的持久化。。除了传统的外部检索系统，文中强调 compaction 和 memory folder 两种模式，让 Claude 自己决定“记什么”和“怎么记”。实验表明新一代模型在相同记忆预算下能显著提升长程任务表现，例如在 BrowseComp/BrowseComp-Plus 上随着版本迭代，利用 compaction/memory folder 的表现大幅提升。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    

## 模式三：谨慎设置能力边界和操作边界模型。不应该做什么？

主要是考虑成本、用户体验还有安全性。在给 Claude 搭建 agent/harness 时，要通过「缓存策略 + 工具设计 + 安全/UX 约束」来给模型划定清晰的能力边界和操作边界，而不是把一切都“放飞”。

- 成本侧，用缓存友好的上下文结构：Messages API 是无状态的，每次都要把系统提示、工具描述、历史等重新打包，所以需要通过 prompt caching 和 breakpoints 把稳定部分缓存起来；为此建议将“静态在前、动态在后”，用追加消息而不是编辑，避免频繁切换模型，并通过 tool search 等机制在不破坏缓存的前提下发现工具。[claude](https://claude.com/blog/harnessing-claudes-intelligence) 
- 静态在前，动态在后。随着对话轮数的增加，不断将这个边界向后推移。推移的时候注意前面的 TOOLS 和 MESSAGES 保持不变。TOOLS 如果想变就改概率，MESSAGES 如果想变，那就在后面新加内容，比如说 System Reminder。除了提示词之外，还要注意模型不要随便切换，切换也会破坏提示词缓存。
    
- 用户体验侧，用“声明式工具”表达关键动作：把安全敏感、难以回滚或需要向用户展示的动作从通用 bash 命令提升为 typed tools，这样 harness 可以按动作类型做权限控制、用户确认、审计和观测（日志、trace、replay），同时为用户交互提供更好的 UI（例如弹窗、多选）。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    
- 安全侧，工具边界需要动态再评估：随着模型对命令的理解和安全性判断变强（比如 Claude Code auto-mode 中二次审查 bash 命令的模式），有些过去必须拆成专用工具的场景可以重新交还给通用工具；但对高风险动作，专用工具仍然有价值。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    

## 展望与整体思路

- 文章最后强调：模型能力每一次“跳档”都可能让之前的补丁式逻辑（例如为了缓解“上下文焦虑”添加的强制 context reset）变成新的瓶颈，这些逻辑需要定期“减重”和重构，否则会从帮助模型变成限制模型的“bitter lesson”。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    
- 推荐的心智模型是：少做前置假设，多给 Claude 通用而安全的操作空间，让它自己学习如何 orchestrate；同时在安全、成本、UX 和观测上用少数“声明式工具 + 缓存策略”提供硬边界和可观测性。[claude](https://claude.com/blog/harnessing-claudes-intelligence)
    

如果你打算在自己的 agent 框架里落地这些思路，我可以帮你结合现有架构一起改造一版“最小可行 harness 设计”，顺带考虑你现在常用的工具和 memory 方案。