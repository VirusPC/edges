
# 2026-04-08–Claude-Code-Prompt-Caching工程实践深度解析

-----

【讨论主题】

围绕 Claude Code 系统提示词中的 `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` 标记展开，深入探讨了 Anthropic Prompt Caching 机制的原理、API 用法、计费模型、缓存作用域，以及 Claude Code 团队围绕缓存命中率所做的一系列工程设计决策。核心议题：为什么 Prompt Caching 是 agent 产品的生命线，以及如何围绕缓存约束设计整个 harness 架构。

-----

【主要结论】

1. **`__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` 的作用**：Claude Code 系统提示词中的缓存分割标记，告诉 harness 代码在此处插入 `cache_control` 显式断点，将 prompt 分为静态段（跨用户共享缓存）和动态段（per-session 缓存）。
2. **Prompt Caching ≠ KV Cache**：KV Cache 解决单次请求内的计算复用；Prompt Caching 是 Anthropic API 层的跨请求服务端缓存，基于前缀逐字节匹配（密码学哈希），需要通过 `cache_control` 显式或自动标记断点。
3. Prompt Caching 缓存的是 prefill 阶段生成的 KV Cache（注意力层中间状态），而非模型输出——命中后跳过输入序列的前向传播计算，直接进入自回归 decode 阶段生成新的输出。​​​​​​​​​​​​​​​​
4. **Claude Code 的四层缓存结构**（来自 Thariq 一手文章）：
- 静态 system prompt + Tools → 全局缓存
- CLAUDE.md → 项目级缓存
- Session context → 会话级缓存
- 对话消息 → 不缓存
1. **缓存命中同时降低延迟**：Anthropic 官方称 Prompt Caching 可降低最高 85% 的延迟。原因是缓存命中时跳过 prefill 阶段（将所有 input token 做前向传播生成 KV Cache 的过程），直接进入 decode 阶段。对 Claude Code 这种数万至十几万 token 上下文的场景，prefill 占总响应时间的大头，缓存命中带来的加速非常显著。这也是缓存命中率直接影响 rate limit 宽裕程度的原因——省下来的算力可以服务更多请求。
2. **计费模型**：
- 缓存写入：基础 input 价格 × 1.25（5分钟 TTL）或 × 2（1小时 TTL）
- 缓存读取：基础 input 价格 × 0.1
- 最低 token 门槛：如 Claude Sonnet 要求至少 1024 token 才能缓存
1. **API 两种使用方式**：
- **自动缓存**：请求顶层加 `cache_control`，断点自动放在最后一个可缓存 block，随对话增长自动前移。适合单用户多轮对话。
- **显式断点**：在具体 content block 上标记 `cache_control`，可设置多个断点实现分层缓存。适合多用户共享场景。
1. **缓存作用域**：Lance Martin 文章明确说哈希 scoped to workspace。Claude Code 用户是否共享同一 workspace/org 未有官方确认，但从工程合理性推断，静态段应全局共享。
2. **缓存匹配机制**：从断点位置向前最多搜索 20 个 block 寻找已有缓存命中。一个字符差异即产生不同哈希导致 miss。

-----

【认知更新】

1. **缓存命中率 = 生产指标**：Claude Code 团队和 Manus 团队都把缓存命中率视为 agent 产品最重要的单一指标，Claude Code 对其设置告警，命中率低了报 SEV。这不是优化项，而是生存线。
2. **“不做就亏钱”的 boundary 设计**：如果不用 `DYNAMIC_BOUNDARY` 隔离动态内容，每次请求前缀都因 CLAUDE.md/git status 变化而 miss，反而比不缓存多付 25% 写入费。
3. **不省钱的场景**（基于计费规则推导）：
- 单轮对话：写入 1.25x 无后续读取，纯亏 25%
- 用户响应间隔超过 TTL（5分钟）：每轮都是写入无命中
- 短 prompt 低于最低 token 门槛：开了等于没开
- 前缀含动态内容（时间戳、随机 ID）：永远 miss，纯亏
1. **中途换模型比继续用贵模型更贵**：100k token 对话中，切到 Haiku 需要重建整个缓存，成本高于继续用 Opus。正确做法是 subagent handoff。
2. **一切设计围绕缓存不变性**：
- Plan Mode 不换 tool set，而是把 EnterPlanMode/ExitPlanMode 做成 tool
- Tool Search 用 `defer_loading` stub 而不是移除 tool
- 信息更新用 `<system-reminder>` 写在 user message 里而不是改 system prompt
- Compaction 复用父对话完整前缀，只在末尾追加压缩指令
1. **编辑历史会打破缓存**：修改对话历史中间内容，从修改点开始后续全部 miss。这是 compaction 必须精心设计的根本原因。

-----

【行动指南】

1. **课程内容**：将 Thariq 和 Lance Martin 这两篇文章作为 harness engineering 模块的一手引用材料，含金量远高于第三方分析。
2. **知识资产平台设计参考**：HOT tier 的不变内容可借鉴 Prompt Caching 的分层缓存思路——变化频率不同的内容分段处理，最大化复用。
3. **验证缓存共享范围的方法**：全新 Claude Code session 首次请求时检查 response 中 `cache_read_input_tokens` vs `cache_creation_input_tokens`，若静态段直接是 read 则说明跨用户共享。
4. **Agent SDK 构建时的缓存策略**：
- 静态指令用显式断点 + 1h TTL
- 动态内容用显式断点 + 5min TTL
- 对话历史用自动缓存
- 两者可混用
1. **避免缓存失效的 checklist**：
- 不在 system prompt 中放时间戳或动态值
- Tool 定义顺序必须确定性
- 不中途增删 tool 或换模型
- 信息更新走 message 而非改 prompt
- Compaction 复用父对话完整前缀

-----

【补充说明】

- Thariq 文章中提到的 techtwitter 那篇说”静态段 1 小时 TTL、动态段 5 分钟 TTL”，未找到官方确认，建议作为参考而非定论。
- Anthropic API 目前只支持两档 TTL（5 分钟 / 1 小时），不支持自定义时间。
- Claude Code 的 Prompt Caching 是 harness 代码自动处理的，用户侧无配置项。
- Compaction 功能已被 Anthropic 内建到 API 中，第三方 agent 可直接使用而不必重新实现。

-----

【相关链接】

- Thariq（Claude Code 团队）关于 Prompt Caching 工程实践：https://x.com/trq212/status/2024574133011673516
- Lance Martin 关于 Prompt Caching 机制科普与 auto-caching 发布（文中第二篇文章，未提供独立 URL）
- Anthropic 官方 Prompt Caching 文档：https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Piebald-AI Claude Code 系统提示词仓库：https://github.com/Piebald-AI/claude-code-system-prompts
- Claude Code 源码深度分析（Haseeb Qureshi）：https://gist.github.com/Haseeb-Qureshi/d0dc36844c19d26303ce09b42e7188c1
- Victor Dibia 的 Inside Claude Code 分析：https://newsletter.victordibia.com/p/inside-claude-code
- Anthropic Prompt Caching Cookbook：https://github.com/anthropics/anthropic-cookbook/blob/main/misc/prompt_caching.ipynb