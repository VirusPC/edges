# Prompt Caching（提示词缓存）

> 一句话摘要：模型厂商会缓存请求的**稳定前缀**，命中后这部分输入按低价计费、延迟更低；Agent 要做的就是让前缀稳定、在 TTL 内复用它，并在长 tool call 期间必要时用"cache warm"续命。

资料核对时间：2026-10-13。下文数字都摘自所链接的官方文档；文档里查不到的标"未核实"。厂商经常调价、换模型，引用前请回原文复核。

## 核心概念

- **前缀匹配**：缓存按"从开头到某个位置"的完整前缀做哈希，前缀里任何一处改动，该位置及之后的缓存全部失效。
- **断点（breakpoint）**：标出"缓存写到这里为止"的位置。Anthropic 用 `cache_control` 显式标注或自动放置；OpenAI GPT-5.6+ 支持显式/隐式断点；Gemini 隐式缓存和 DeepSeek 都是自动的。
- **TTL 与刷新**：缓存条目有存活时间；Anthropic 和 OpenAI 的文档都说明命中会刷新 TTL，而且刷新不另收写入费。
- **计价三档**：普通输入、缓存写入（部分厂商加价）、缓存读取（大幅折扣）。
- **最小长度**：前缀太短就不缓存，并且**不报错**，只能从 usage 字段看出没有命中。

## 各家对比

| 项目 | Anthropic | OpenAI | Gemini | DeepSeek |
|---|---|---|---|---|
| 开启方式 | 请求顶层 `cache_control`（自动），或在内容块上放显式断点，最多 4 个[^a1] | 默认自动；GPT-5.6+ 可用 `prompt_cache_options.mode: explicit` + `prompt_cache_breakpoint`，单次请求最多 4 次缓存写入[^o1] | 2.5 及更新模型默认开启隐式缓存；显式缓存（Beta）需要先创建 cache 对象[^g1][^g2] | 默认开启磁盘缓存[^d1] |
| TTL | 默认 5 分钟，可选 1 小时（`"ttl": "1h"`）；命中刷新且不另收费[^a1] | GPT-5.6+：`ttl` 只支持 `30m`（距上次写入/复用 30 分钟内可用）。更早的模型用 `prompt_cache_retention`：`in_memory` 一般闲置 5–10 分钟、最长 1 小时；`24h` 最长 24 小时。复用会刷新寿命且不另收写入费[^o1] | 显式缓存 TTL 默认 1 小时，没有上下限；隐式缓存的 TTL 未核实[^g2] | 不用后自动清除，"通常几小时到几天"[^d1] |
| 写入价 | 5 分钟档 1.25× 基础输入价，1 小时档 2×[^a1] | GPT-5.6+ 为 1.25×；更早的模型不收写入附加费[^o1] | 显式缓存另按缓存 token 数 × TTL 时长收存储费，具体单价未核实[^g2] | 未核实 |
| 读取价 | 0.1× 基础输入价；个别模型更低（文档脚注写有 0.05×、0.025×）[^a1] | GPT-5.6+ 为 0.1×（GPT-6.1 Sol 为 0.05×）；更早的模型按各自的 cached-input 价格；官方称最高可省 95%[^o1] | 显式缓存"减价计费"，具体倍率未核实；隐式缓存命中"自动让利"但不保证一定省钱[^g2] | 未核实（见定价页） |
| 最小 token | 按模型分 512 / 1,024 / 2,048 / 4,096 不等，例如 Haiku 4.5 为 4,096[^a1] | GPT-5.6+ 为 1,024 个可见输入 token；更早的模型随请求设置变化[^o1] | 2.5 Flash/Pro 为 2,048；3.x 系列列出的是 4,096[^g1] | 未核实 |
| 观测字段 | `cache_creation_input_tokens` / `cache_read_input_tokens` / `input_tokens`（只算最后一个断点之后的部分）[^a1] | `cached_tokens`（老模型向下取整到 128 的倍数）[^o1] | `usage_metadata`（cached content token 计数）[^g2] | `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens`[^d1] |
| 特殊点 | 每个断点最多向前回看 20 个块；失效层级为 tools → system → messages[^a1] | 单台机器超过约 15 请求/分钟会溢出路由；`prompt_cache_key` 在 GPT-5.6 之前的模型上用于优化路由，在 5.6+ 上用于分开统计缓存[^o1] | Interactions API 只支持隐式缓存[^g1] | 前缀要**完全匹配**某个已持久化的前缀单元；构建缓存需要几秒[^d1] |

## Agent 实践要点

1. **前缀稳定**：顺序按 tools → system → 长期上下文 → 对话排列。别在 system 里放当前时间、随机 ID、请求序号；这类每次都变的内容放到最后一个断点之后。Anthropic 文档专门把"断点放在每次都变的块上"列为常见错误[^a1]。
2. **工具定义一变，全部失效**：Anthropic 下修改工具名、描述或参数会让整个缓存失效；改 `tool_choice`、thinking 参数、effort、图片有无会让 messages 层失效[^a1]。OpenAI 下 `model`、`tools`、`parallel_tool_calls`、`reasoning.effort` 等都会影响前缀[^o1]。所以工具列表要固定排序，不要按轮次动态增删；MCP 工具变动也会导致失效。
3. **长 tool call 会超过 TTL**：5 分钟 TTL 下，一次跑测试或编译超过 5 分钟，下一轮就要按写入价重新算整段前缀。解法有三种：
   - 改用更长的 TTL（Anthropic 1h，写入价 2×）；
   - **cache warm**：在 TTL 到期前把同一个请求用 `max_tokens=1` 重放一次，只付一次缓存读加 1 个输出 token 的钱，命中顺带刷新 TTL（见下面的 pi 案例）；
   - 长任务改成异步执行，先返回、再轮询。
4. **子代理 / 并行请求**：要共享缓存，子代理的 tools 和 system 前缀必须和主代理逐字节一致，否则就是另一份缓存。并行发出的同前缀请求，在第一个写完之前，后面的可能都按未命中计费（未核实各家具体行为）。OpenAI 下高并发同前缀请求可以用稳定的 `prompt_cache_key` 帮助路由[^o1]。Anthropic 下一轮里多个并行 `tool_use` / `tool_result` 在回看窗口里各只算一个位置[^a1]。
5. **观测命中率**：每次请求都记录 usage。命中率 ≈ 缓存读 /（缓存读 + 缓存写 + 未缓存输入）。Anthropic 的总输入 = `cache_read_input_tokens + cache_creation_input_tokens + input_tokens`[^a1]。如果连续几轮都是大额 `cache_creation`，基本说明前缀不稳定，或者两轮间隔超过了 TTL。

## 案例：pi 的 cache warmer

源码：earendil-works/pi，commit `67996ab`，[`cache-warmer.ts`](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts)。

- **何时触发**：每次会话请求发出时，[`sdk.ts` L420-L429](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/sdk.ts#L420-L429) 调用 `cacheWarmer.start(...)`；只有会话自己的请求才会触发，compaction 和摘要请求不算。`start` 会替换掉上一个 run（[L204-L243](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L204-L243)），所以始终只给最近一次请求续命。agent 一轮跑完时，[`agent-session.ts` L1079](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/agent-session.ts#L1079) 调用 `onAgentSettled()`。
- **模式**：`off` / `streaming` / `idle`，默认 `streaming`（[settings-defaults.ts L60](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/settings-defaults.ts#L60)）。`streaming` 只在 agent 运行期间预热（这正好覆盖"tool call 太久"的场景），一轮跑完就停；`idle` 在空闲时继续预热，但最多 30 分钟（[L245-L257](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L245-L257)）。运行期间的预热最多持续 1 小时（[L15-L18](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L15-L18)）。
- **TTL 余量怎么定**：TTL 取自模型配置里的 `promptCache[short|long]`（[L39-L46](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L39-L46)）；在 `min(TTL×90%, TTL−10s)` 时刷新，TTL ≤ 10s 时不预热（[L28-L32](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L28-L32)）。以 5 分钟 TTL 为例，第 270 秒刷新。另外留出一半余量当截止线：定时器因为休眠或事件循环阻塞迟到太久就放弃，因为那时再发多半是全价写入（[L284-L298](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L284-L298)、[L357-L361](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L357-L361)）。
- **发什么请求**：原样重放同一个 model、context、options，只覆盖 `maxTokens: 1`、`maxRetries: 0`，并且可以中止（[L330-L339](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L330-L339)）。用量记成一条 `cache_warm` usage 条目。对话上下文一变（`isCurrent()` 为假）就停（[L363-L369](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L363-L369)）。Anthropic 基于预算的 thinking 会从 `max_tokens` 推出 `budget_tokens`，改了 `max_tokens` 就会改缓存键，所以这类请求判定为不可重放、不预热（[L48-L58](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L48-L58)）。
- **成本权衡**（[L378-L400](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L378-L400)）：`warmCost` = 按缓存读价算整段 prompt + 1 个输出 token；`missCost` = 写入价（模型没有写入价就用输入价）− 读取价；`expectedSavings = p × missCost − warmCost`。运行期间 p = 1，空闲时 p = 0.15（作者自称来自自家统计，[L21-L26](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L21-L26)）。预期节省 ≥ $0.05 才发（[L19-L20](https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts#L19-L20)）；扩展可以通过 `cache_warming_decision` 事件推翻这个决定。
- **启示**：prompt 越长、写入相对读取越贵（Anthropic 是 1.25× 对 0.1×），预热越划算。小 prompt 或空闲会话的预期节省为负，就不应该预热。

## 参考链接

[^a1]: Anthropic Prompt caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
[^o1]: OpenAI Prompt caching: https://developers.openai.com/api/docs/guides/prompt-caching
[^g1]: Gemini Caching（隐式）: https://ai.google.dev/gemini-api/docs/caching
[^g2]: Gemini Context caching（显式，generateContent）: https://ai.google.dev/gemini-api/docs/generate-content/caching
[^d1]: DeepSeek Context Caching: https://api-docs.deepseek.com/guides/kv_cache

- pi 源码（commit 67996ab）：https://github.com/earendil-works/pi/blob/67996ab75c2818847423549807eda888db218c1c/packages/coding-agent/src/core/cache-warmer.ts
