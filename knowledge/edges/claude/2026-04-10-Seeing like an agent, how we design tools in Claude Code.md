这篇博客主要讲 Anthropic 在构建 Claude Code 代理时，如何从“模型的视角”来设计和演进工具：不是先想功能，而是观察模型实际如何使用工具，再不断迭代。[claude](https://claude.com/blog/seeing-like-an-agent)

## 核心观点

- 代理完全通过工具调用行动，因此“设计什么工具、什么时候用、什么时候删”是搭建 agent harness 最难也最重要的部分。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 设计工具要“适配模型能力”，就像解一道难题时你给人纸笔、计算器还是电脑，取决于这个人会用什么。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 想做好这件事，需要学会“像代理一样看问题”：观察输出、实验和迭代，而不是一次性设计完工具集。[claude](https://claude.com/blog/seeing-like-an-agent)
    

## AskUserQuestion：提问工具的演进

文章先以“提问/澄清问题”能力为例，展示一个工具从想法到成型的过程。[claude](https://claude.com/blog/seeing-like-an-agent)

- 尝试 1：在 ExitPlanTool 里加问题数组，结果让 Claude 混淆：既要给计划又要提问，计划和回答冲突时逻辑变复杂，于是放弃。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 尝试 2：改输出格式，让 Claude 用特定 markdown 结构输出问题和选项，但模型经常破坏格式或额外发挥，不够稳定。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 尝试 3：单独做 AskUserQuestion 工具，Claude 在“计划模式”里可以随时调用，UI 以 modal 弹出问题并阻塞 loop，直到用户回答，再继续执行。[claude](https://claude.com/blog/seeing-like-an-agent)
    

最终的 AskUserQuestion 工具有几个好处：[claude](https://claude.com/blog/seeing-like-an-agent)

- 结构化输出稳定，可给用户多个选项。
    
- 能在 Agent SDK、skills 中自由组合调用。
    
- Claude“乐于调用”这个工具——再好的工具，如果模型不愿/不会用，也没有价值。[claude](https://claude.com/blog/seeing-like-an-agent)
    

## Todo → Task：工具要跟着能力升级

随着模型能力提升，早期有用的工具会变成束缚，因此需要不断“下线/替换”。[claude](https://claude.com/blog/seeing-like-an-agent)

- 初版 Claude Code 用 TodoWrite 工具维护 todo 列表，再每 5 轮用 system reminder 提醒目标，以避免模型“忘事”。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 模型变强后，todo 反而限制了 Claude：它会“过度服从”已有列表，不愿动态调整，且多子代理协作时代，todo 很难做共享状态。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 因此团队用 Task 工具取代 Todo：任务可以有依赖、能在子代理间共享更新，也能被修改和删除，更像一个多 agent 协作的任务系统，而不是只给单一模型当“备忘录”。[claude](https://claude.com/blog/seeing-like-an-agent)
    

作者强调：随着模型变强，你原来“防止它迷路”的工具，可能会成为它探索和协作的瓶颈，要定期重审工具集，并尽量使用能力相近的一小撮模型以简化设计。[claude](https://claude.com/blog/seeing-like-an-agent)

## 搜索 & Progressive Disclosure：让代理自己找上下文

文章认为，最关键的一类工具，是让 Claude 能“自己找到上下文”的工具。[claude](https://claude.com/blog/seeing-like-an-agent)

- 内部最初版本用的是传统 RAG：先把代码库向量化索引，然后每轮请求检索片段塞给 Claude。[claude](https://claude.com/blog/seeing-like-an-agent)
    
    - 优点：快且强。缺点：需要复杂索引/部署，且“上下文是给模型的，不是模型自己找的”。[claude](https://claude.com/blog/seeing-like-an-agent)
        
- 团队后来给 Claude 一个 Grep 工具，让它自己在代码库中搜索和阅读文件，逐步构建自己的上下文。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 随着能力提升，Claude 已经可以通过“嵌套搜索多层文件”精确找到需要的上下文。[claude](https://claude.com/blog/seeing-like-an-agent)
    

在此基础上，他们在 Agent Skills 中系统化了“渐进披露（progressive disclosure）”的概念：[claude](https://claude.com/blog/seeing-like-an-agent)

- skill 文件本身可阅读，skill 再引用其他文件，模型递归加载需要的内容。
    
- 常见模式：用 skill 教 Claude 如何调用某个 API 或查询数据库，从而通过一层层指引扩大能力，而不用硬加新工具。[claude](https://claude.com/blog/seeing-like-an-agent)
    

## Claude Code Guide：用子代理替代新工具

团队希望减少工具数量，因此新增能力时，优先考虑 progressive disclosure 和子代理，而不是再加一个工具。[claude](https://claude.com/blog/seeing-like-an-agent)

- 他们发现 Claude 不够了解“Claude Code 自己”，比如：如何加 MCP、slash command 做什么等。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 如果把所有说明塞进系统 prompt，会导致上下文膨胀，干扰写代码这个主职。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 方案 1：给它文档链接，让它需要时自己 load + search。但 Claude 会把大量文档直接拉进当前上下文，只为回答一个简单问题，效率很低。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 最终方案：构建 Claude Code Guide 子代理。主代理在遇到关于 Claude Code 的问题时调用它，由 Guide 代理在自己的上下文里做文档检索和抽取，只返回精简答案，主代理上下文保持干净。[claude](https://claude.com/blog/seeing-like-an-agent)
    

这个方案让“动作空间扩展”发生在子代理层，而不是再增加一个顶层工具，虽然不完美（有时还是会混淆“自己”和“Guide”），但实践上更可控。[claude](https://claude.com/blog/seeing-like-an-agent)

## 结尾观点：像代理一样看世界

作者最后强调：工具设计既是工程也是“手艺活”，高度依赖具体模型、任务与环境，没有一套万能模板。[claude](https://claude.com/blog/seeing-like-an-agent)

- 多实验、多读输出、多尝试；
    
- 经常质疑“现在这套工具是否仍然适配当前模型能力”；
    
- 尝试从代理视角出发思考决策负担和信息流，而不是从人类抽象 API 视角设计工具集。[claude](https://claude.com/blog/seeing-like-an-agent)
    

你现在在自己做 agents / tools 的时候，最困扰你的是“加什么工具”，还是“让模型稳定地用好现有工具”？

# Claude “乐于调用” AskUserQuestion？

Claude “乐于调用” AskUserQuestion，本质上是因为这个工具在它的决策空间里“好用、好理解、好反馈”，既减轻思考负担，又带来稳定、可预测的好结果。[claude](https://claude.com/blog/seeing-like-an-agent)

## 文中直接给出的原因

- AskUserQuestion 是一个**独立工具**，调用语义非常单一：“我现在需要向用户发一个结构化问题”。相比在 ExitPlanTool 里顺带提问，认知负担更低。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 工具输出是结构化 schema（问题 + 选项），UI 又会弹 modal 阻塞 agent loop，Claude 可以明显感知“我调用之后会发生什么”，因果关系清晰。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 每次调用基本都会带来“高质量人类反馈”：用户会选项/作答，之后任务更容易完成，Claude 在 RL/指令微调分布里就更容易学到“调用它 → 效用高”。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 文中直接说：“Most importantly, Claude seemed to like calling this tool and we found its outputs worked well. After all, even the best designed tool doesn’t work if Claude doesn’t understand how to call it.”——也就是：
    
    - 调用方式容易学
        
    - 调用后结果好用
        
    - 所以在推理时就自然更频繁选择它。[claude](https://claude.com/blog/seeing-like-an-agent)
        

## 从“模型视角”看这件事

站在模型视角，AskUserQuestion 满足了几个让工具“被偏好使用”的条件：[claude](https://claude.com/blog/seeing-like-an-agent)

- 触发条件简单：只要 Claude 觉得“信息不够/需要澄清”，就可以考虑这个工具，不用纠结各种细粒度分支逻辑。
    
- 模型不需要自己设计复杂 UI / Markdown 格式，避免了第二版方案里那种“有时破坏结构”的失败路径，调用成功率高，减少负面梯度信号。[claude](https://claude.com/blog/seeing-like-an-agent)
    
- 工具本身是通用能力（elicitation），在大量任务中都会用到，这意味着训练/在线行为数据里会频繁出现“调用 AskUserQuestion → 任务更顺利”的轨迹，自然形成偏好。
    

从 agent-harness 设计角度，可以抽象成一条经验：

- 一个工具会被“乐于调用”，通常要同时满足：语义单一、输出稳定、调用后有明显效用提升、且训练数据中有足够多“调用成功”的示例。AskUserQuestion 恰好都满足了。[claude](https://claude.com/blog/seeing-like-an-agent)
    

如果你在自己做 agent 工具集，是否有哪个工具你感觉“明明很有用，但模型就是很少用”？我可以帮你一起从 schema、触发条件和反馈路径角度排查一下。