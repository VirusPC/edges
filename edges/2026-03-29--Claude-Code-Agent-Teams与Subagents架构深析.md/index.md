
文件名：
2026-03-29--Claude-Code-Agent-Teams与Subagents架构深析.md

【讨论主题】
围绕 Claude Code 的多 Agent 架构展开的技术深挖，重点对比 Agent Teams 与 Subagents 两种模式在启用方式、通信机制、消息结构、工具调用、上下文继承等维度的本质差异。

【主要结论】
启用与定义
	∙	Agent Teams 通过在 settings.json 的 env 节点添加 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1" 开启，需 v2.1.32+，默认关闭
	∙	Agent 定义文件统一放在 .claude/agents/*.md，使用 YAML frontmatter（name、description、tools、model、skills）
	∙	两种模式共用同一套 Markdown 定义机制，开关决定运行时架构，不决定定义方式
	∙	Agent Teams 本质上是即兴创建的：没有 agent 定义文件也能运行，Markdown 文件是可选的角色模板，不是 spawn 的前提条件. Agent Teams 不依赖预定义文件，但支持使用
通信架构
	∙	Subagents：Hub-and-Spoke（轮辐模式）——所有通信经过主 Agent 中转，Subagent 之间完全隔离，只能向主 Agent 汇报结果. 子 Agent 不持有 Agent tool 不能再产生新的子 Agent 
	∙	Agent Teams：Mesh（网状通信）——Teammate 之间可直接互发消息，无需经过 Lead 中转，Lead 也可单独给某个 Teammate 发消息或广播
消息结构（Subagents）
	∙	输入：子 Agent context 从全新状态启动，唯一输入通道是 Agent tool 的 prompt 字符串；自动加载 CLAUDE.md 和 tool 定义；Skills 默认不继承，需在定义里显式声明
	∙	输出：父 Agent 收到子 Agent 最后一条消息原文（verbatim）作为 tool result；父 Agent 在生成响应时可能对其摘要化，不是系统强制行为
	∙	子 Agent 不继承：父 Agent 对话历史、父 Agent system prompt、未声明的 Skills
工具调用
	∙	Subagents 使用 Agent tool（v2.1.63 前叫 Task tool，两个名字需同时兼容）
	∙	Agent Teams 使用专属工具集：TeamCreate、TaskCreate、TaskUpdate、Teammate、SendMessage，底层每个 teammate 是独立的 claude CLI 进程
	∙	Agent Teams 的 peer-to-peer 消息传递本质是文件系统实现：~/.claude/teams/{team-name}/inboxes/{agent-name}.json
上下文继承（Agent Teams）
	∙	Teammate 自动加载：CLAUDE.md、MCP servers、Skills（注意：与 Subagents 不同，Agent Teams 的 Teammate 默认会加载 Skills）
	∙	Teammate 不继承：Lead 的对话历史，每个 Teammate 只能看到 spawn 时传入的 prompt
摘要化时机
	∙	层面一：子 Agent 返回原文给父 Agent，父 Agent 自主决定是否摘要（模型推理决策，非系统强制）
	∙	层面二：父 Agent 自身 context 达到 ~95% 时触发 compaction，历史 tool result 可能被压缩丢失
	∙	子 Agent 各自管理自己的 context，互不协调

| 字段            | Subagent 模式        | Agent Teams 模式     |
| ------------- | ------------------ | ------------------ |
| `skills:`     | ✅ 正常加载             | ❌ 静默忽略（Bug #29441） |
| `tools:`      | ✅ 正常限制             | ❌ 静默忽略（Bug #30703） |
| `hooks:`      | ✅ 正常执行             | ❌ 静默忽略 bug         |
| Markdown body | ✅ 作为 system prompt | ❌ 静默忽略 bug         |
| `model:`      | ✅                  | ✅ 唯一生效的字段          |
对于即兴创建的子 agent 并不会说加载项目里的 skills。

【认知更新】
“开关只是架构切换，不是功能切换”
同一批 Markdown 定义的 agent，开关关闭 → subagent 模式（hub-and-spoke）；开关开启 → agent teams 模式（mesh）。定义层不变，运行时架构变。这比”两种不同功能”的理解更准确。
Agent Teams 是完全即兴的声明式系统
没有 agent schema，没有定义文件也能运行。那些 Markdown 示例只是你粘贴给 Claude Code 的 prompt。与其说”定义 agent”，不如说”描述角色”——Anthropic 把功能下沉到了模型层。
Subagents 的信息有损是结构性的，不是偶发的
Explore agent 返回的是有损摘要，主 Agent 无法感知子 Agent 的中间推理过程。如果需要主 Agent 对细节做深度推理，有时直接让它读文件比用 subagent 更好（attention 机制能让所有 context 互相关联）。
Agent Teams 的 peer-to-peer 通信是文件系统模拟的
听起来高级的”直接消息传递”，底层是 JSON inbox 文件轮询，不是内存级实时通信。这对理解其延迟特性和 session 稳定性问题有直接帮助。
工具命名的历史断层
Task tool → Agent tool（v2.1.63 改名），但 system:init 和 permission_denials 里仍用旧名。社区文章里出现 Task tool 的描述基本都是改名前写的，指同一个东西。做工具调用检测时需兼容两个名字。

【行动指南】
设计 Agent 定义文件时
	∙	Skills 字段必须显式声明，否则子 Agent 空载启动（即使父 Agent session 已加载相关 Skills）
	∙	Agent Teams 的 Teammate 默认自动加载 Skills；Subagents 默认不加载 Skills，需在定义里显式声明——两种模式行为不同，设计时注意区分
	∙	任务独立、只需汇报结果 → Subagents（成本低，结构简单）
	∙	需要 Teammate 互相验证、共享发现、实时协调 → Agent Teams（成本 3-4x，但有真正协作）
	∙	顺序依赖任务、同文件多 Agent 编辑 → 两者都不适合，用单 session
保留子 Agent 输出原文
若不想让父 Agent 摘要子 Agent 的输出，在主 query() 的 systemPrompt 里明确注明”保留子 Agent 的完整输出”
工具兼容性处理
检测子 Agent 被调用时，同时检查 block.name === "Agent" 和 block.name === "Task" 两个值
CLAUDE.md 对 Agent Teams 的影响
CLAUDE.md 是所有 Teammate 启动时自动加载的共享上下文，模块边界、验证命令、角色定义写在这里，可以显著减少每个 Teammate 重复探索 codebase 的 token 消耗

【补充说明】
	∙	Agent Teams 已知限制：session 恢复（resumption）、任务协调、shutdown 行为有 bug，属于实验性功能
	∙	Teammate 生命周期：空闲一段时间后会自动关闭（gray out），Lead 会自动关掉长时间 idle 的 Teammate
	∙	Delegate Mode（Shift+Tab）：限制 Lead 只能做协调，不能自己写代码；4+ Teammate 的团队建议开启
	∙	当前限制：一个 session 只能有一个团队，Teammate 不能 spawn 自己的子团队，防止无限递归
	∙	task 文件存储路径：~/.claude/tasks/{team-name}/，使用文件锁（flock）防止多个 Teammate 同时抢同一个任务
	∙	Subagents 可以被 resume：通过捕获 session_id 和 agent_id，第二次 query 时传入 resume: sessionId 可继续上次的子 Agent 会话

【相关链接】
	∙	官方 Agent Teams 文档：https://code.claude.com/docs/en/agent-teams
	∙	官方 Subagents 文档：https://code.claude.com/docs/en/sub-agents
	∙	SDK Subagents 文档：https://platform.claude.com/docs/en/agent-sdk/subagents
	∙	Agent Teams 逆向工程分析（源码级）：https://dev.to/nwyin/reverse-engineering-claude-code-agent-teams-architecture-and-protocol-o49
	∙	Agent Teams 完整指南（ClaudeFast）：https://claudefa.st/blog/guide/agents/agent-teams
	∙	Agent Teams 高级控制：https://claudefa.st/blog/guide/agents/agent-teams-controls
	∙	Addy Osmani 的 Agent Teams 实践：https://addyosmani.com/blog/claude-code-agent-teams/
	∙	TeammateTool 和 Task system 完整参考：https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea​​​​​​​​​​​​​​​​