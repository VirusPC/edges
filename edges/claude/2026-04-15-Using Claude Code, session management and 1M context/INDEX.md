这篇文章核心在讲：在 Claude Code 里，**怎么用 1M 上下文 + 各种 session 管理手段，把模型“用聪明”，而不是一味长会话导致越用越蠢**。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)

---

## 文章在解决什么问题

- 1M context 虽然很大，但会带来性能下降和“context rot”（上下文越长，注意力被稀释，模型越来越迷糊）。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 实际开发中大家 session 用法差异很大（长会话、疯狂新会话、乱 compact），导致效果不稳定、成本也不可控。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 文章要解决的是：**开发者在 Claude Code 里，如何在“保持必要上下文”和“避免上下文腐烂”之间做决策。**[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

---

## 文章提供的解决思路

## 核心概念

- Context window：模型一次能“看见”的所有内容，包括系统提示、对话历史、工具调用和读到的文件等；Claude Code 给到 1M token。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- Context rot：上下文越大，噪音越多、旧信息干扰决策，模型表现变差。尤其在自动 compact 触发点，模型往往是“最不聪明”的时候。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- Compaction：接近窗口上限时，把当前任务总结成一段更短的描述，作为新上下文继续工作；也可以手动触发 `/compact`。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

## 每一步你都有 5 种选择

在 Claude Code 里，每轮对话后，其实是一个“分叉点”：[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)

- Continue：继续在当前 session 聊，适合“同一个任务、现有上下文都还重要”的场景。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- `/rewind`：回到之前的某条消息从那里重来，后面的历史会被截断，适合“保留文件读取等有用步骤，丢掉错误尝试”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- `/clear`：开始一个新 session，并手动写一段简短的任务摘要/约束，适合“真正的新任务”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- `/compact`：自动总结当前会话，把历史替换成一段 summary；你可以通过指令引导 summary 的侧重点。示例：`/compact focus on the auth refactor, drop the test debugging`。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- Subagents：起一个“子代理”在独立上下文里做很多中间步骤，只把最终结论带回主会话，适合“中间过程很多但以后不会再用”的工作。比如跑大范围 code search、验证、写文档。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

---

## 关键使用建议（文章里的经验法则）

## 什么时候新开 session

- 经验法则：**新任务 = 新 session**。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 1M context 让你可以在一个 session 里完成大任务（例如从零搭一个全栈 app），但长时间累积仍然会 context rot。此时，应考虑 `/clear` 新起一个，自己写一小段“任务简述 + 关键文件 + 已排除方案”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 如果是“同一代码上的衍生任务”（如刚写完功能，现在写文档），可以考虑保留 session，让 Claude 复用刚读过的文件，避免重新读取增加成本。这里可以用 `/compact` 清理无用调试历史。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

## 修错时，用 rewind 比“纠正一句话”更好

- 场景：Claude 读了五个文件，尝试一种方案失败。很多人会直接说“那个不行，试试方案 X”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 更好的方式是：`/rewind` 回到“刚读完文件但还没尝试方案”的那条消息，并基于你学到的东西重写提示，例如“不要用方案 A，因为 foo 模块没暴露那个接口，直接用方案 B”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 也可以在 rewind 时让 Claude “summarize from here”，生成一个“未来的自己写给过去自己的交接说明”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

## `/compact` vs `/clear`

- `/compact`：模型自动总结全部对话和文件，替换成 summary，**低成本 + 自动整理**，但有信息丢失风险，特别是模型不理解你下一步要干什么时。可以通过指令限定“只保留 auth 重构相关，丢掉测试 debug”等。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- `/clear`：你手动抽取重点，重新写任务 brief，再开干，**费一点人力，但保留的是你认定的关键信息**，context 噪音最小。适合真的“换任务”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

## 什么时候 compact 特别容易翻车

- 当自动 compact 发生时，如果之前是一大段调试过程，而你下一句突然说“现在修一下 bar.ts 里的另一个 warning”，那个 warning 可能已经在 summary 里被丢掉了。因为模型在总结时以为“那个不是重点”。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 而且由于 context rot，窗口快满的时候恰好是模型“最难判断什么重要”的时候。1M context 给你的空间是：**提前、主动 `/compact` 并明确告诉它你接下来要做什么，让 summary 带着“未来方向感”。**[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

## Subagent 的最佳使用场景

- 一句话判断：**这次工具/操作的输出，我以后会复用原始过程吗，还是只要结论？**[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 如果只要结论，比如：
    
    - “起个子 agent 按这个 spec 验证当前结果是否满足。”
        
    - “起个子 agent 去读另一个 codebase 的 auth 流程，然后总结 + 在当前项目里实现同样的设计。”
        
    - “起个子 agent 根据我的 git diff 写这次改动的文档。”  
        这类都适合放到 subagent 的独立 context 里，主会话只接收最后 summary。这样主 session 不被大量中间工具输出污染。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
        

---

## 与最新 AI 进展的关联

- 1M context、subagent、自动 compaction 本质上是在利用**大上下文 + 工具调用 + 多 agent 编排**，这是今年主流 AI IDE / agent 系统共同方向：通过结构化上下文管理，把“long-horizon coding tasks”做得更稳定。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 大上下文解决了“读不完仓库”的问题，但 context rot、成本爆炸又变成新瓶颈，所以业界开始强调 prompt caching、chunking、compaction 和多 agent workflow，这篇文章是其中“session 管理”的一块拼图。相关博文（如 prompt caching 是一切）也在强化这一点。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    
- 对你做 agent infra 来说，这些经验完全可以抽象成：**策略层（何时新任务/compact/rewind/起子 agent） + 系统层（自动化这些策略）**，和当前各家在做的“multi-agent orchestration + memory/trace 管理”方向高度一致。[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
    

---

## 对你作为 agent infra 工程师的行动建议

## Infra 视角（平台 / runtime / orchestrator）

- 把这 5 个操作抽象成策略 API：
    
    - `continue`, `rewind(from_event_id)`, `clear(with_handoff_summary)`, `compact(options)`, `spawn_subagent(scope)`，在内部统一成“上下文图 / 会话树”的操作，而不是简单线性对话。
        
- 在 trace 里记录“上下文分叉点”和 compact/rewind 的决策，这样可以做：
    
    - 自动推荐：根据历史成功任务，学出什么时候用户更倾向 rewind vs clear。
        
    - cost/quality 仪表盘：统计不同策略下的 token 消耗与成功率，给 IDE / agent 控制台反馈。
        
- 做自动化 heuristics：
    
    - 当上下文超过一定长度、且近期 debug 步骤占比很高时，提示用户 `/compact` 或“建议起子 agent 处理后续搜索/验证”。
        
    - 当用户连续纠正同一方向错误时，自动建议 “rewind 到某个更早状态再试”。
        
- 把 subagent 做成一级“工作单元”：
    
    - 明确输入：scope（文件集、spec、允许调用的工具）
        
    - 明确输出：结构化 report + patch/PR + 可选 logs 链接  
        让主 agent 的上下文只接 summary 和结果引用。
        

## 业务开发视角（日常用 Claude Code 写业务）

可以直接按这张“心智决策表”自我规范：

|场景|建议操作|心智模型|
|---|---|---|
|同一功能还在推进，历史都有用|Continue|不要浪费，保持大上下文|
|Claude 跑偏了但文件读取等仍有价值|`/rewind` 到读完文件后|保留“感知世界”的步骤，丢掉“错误思考”|
|中途 debug 探索很多、上下文很脏|`/compact` 并指定保留重点|自动整理历史，压缩噪音|
|真正换一个需求/任务|`/clear` 手写一小段 brief 再开新会话|完整重启，避免旧上下文干扰新任务|
|需要大量搜索 / 验证 / 写文档，只要结论|明说“用 subagent 做这件事”|把噪音留在子 context，只拿结果|

[claude](https://claude.com/blog/using-claude-code-session-management-and-1m-context)

你现在最常遇到的是“长 session 越用越乱，或者总觉得模型记不住重点”的情况吗？