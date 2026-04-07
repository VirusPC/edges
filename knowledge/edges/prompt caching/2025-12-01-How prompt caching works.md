这篇文章主要讲「为什么以及如何利用提示缓存（prompt caching），以及 vLLM 的 paged attention / prefix caching 在底层是怎么做到的」。[1]

## 提示缓存是什么，有什么用

- 提示缓存指复用「相同提示前缀」已经算好的 KV 张量，跳过重复计算，从而让响应更快、便宜（输入 token 费用可便宜到约十分之一）。[1]
- 典型高收益场景是代码助手、长文档问答等：前缀很长、输出相对短，prefill:decode 比例高，用缓存能大幅节省时间和成本。[1]

## 如何设计提示以多打中缓存

文章先给了一些实用工程建议来提高缓存命中率。[1]

- 让前缀尽量**稳定**：系统提示、工具定义中不要夹用户特有或经常变动的信息，以便不同用户共用同一个前缀缓存。[1]
- 上下文**只追加不改写**：不要中途删改 messages 中间的内容，否则会打断前缀链；宁愿上下文变长，也保留统一前缀。作者甚至停止只删工具输出的做法。[1]
- 工具输出等结构化内容要**确定性序列化**，比如 `json.dumps(..., sort_keys=True)`，避免同样语义但不同 key 顺序导致不同字符串，从而产生不同 cache key。[1]
- 不要频繁动态改动工具定义；因为工具定义通常紧挨系统提示，变动会让后面所有内容的前缀失效。[1]
- OpenAI 有 `prompt_cache_key`（路由提示，不是断点），Anthropic 通过 `cache_control` 显式划分「从哪里开始缓存、回看多少块」。[1]

## 推理基本流程：prefill / decode / KV cache

- LLM 推理分为两阶段：prefill（处理整段输入，算出第一 token）和 decode（一次生成一个新 token）。[1]
- prefill 是计算密集型（矩阵乘法多，FLOPs-bound），decode 是内存带宽受限（每步只算一个 token，但要把整个 KV cache 从显存读出来）。[1]
- KV 缓存的核心：prefill 阶段算好的每个 token 的 K/V 存在 GPU 内存里，decode 时只对「新 token」再算 K/V，旧 token 直接从缓存读，不再反复重算整句。这样 decode 每步只付 O(1) 的追加成本。[1]

## 传统 KV 缓存的内存问题

- 朴素做法是每个请求给一大块连续显存，当序列变长时，KV cache 随 token 数线性增长，很快吃满显存，一个 7B 模型、1K token 上下文、100 并发就可能要到几十 GB 只存 KV。[1]
- 这会带来经典的**内部碎片**（按最大长度预分配，实际没用完的空间浪费）和**外部碎片**（请求结束留下很多小洞，新来的大块请求找不到连续空间）。[1]
- 同一系统提示在不同请求中会被重复存很多份 KV，无法共享，浪费内存且生成结束后就丢弃，无法跨请求复用。[1]

## vLLM 的 paged attention：把 KV 当“分页内存”

- vLLM 借鉴操作系统的分页思想：启动时预分配一堆固定大小的 **block**（比如每块 16 个 token 的 KV 空间），放在 free 队列里，用「块表」来映射逻辑位置到物理显存块，不再要求每个请求连续。[1]
- 每个块有 `block_id`、引用计数 `ref_cnt` 和内容哈希 `block_hash`，多个请求可以共享同一块，被共享时 `ref_cnt` 递增，全部结束才回收并按 LRU 淘汰。[1]
- 逻辑上先按 token 位置划分块（如 50 token → 4 块），然后再决定映射到哪个物理块，这让不同请求的块可以任意散布在显存。[1]

## 块哈希与前缀缓存

- vLLM 为每个块计算**链式哈希**：`hash(block_n) = sha256(parent_hash, 当前块 token IDs, 额外参数)`，其中 `parent_hash` 是前一块的哈希。这样 block_n 的哈希隐含了从 block_0 到 block_n 的整个历史。[1]
- 这样一来，如果某个请求的 block_2 哈希命中缓存，就保证 block_0、block_1 的内容也完全相同，可以一次确定「最长前缀」。[1]
- 所有块哈希映射到 `BlockHashToBlockMap` 这个字典里，O(1) 查到是否已有对应物理块可复用，还支持通过 cache_salt 做租户隔离。[1]
- scheduler 在做 prefill 前会按顺序遍历块哈希，调用 `find_longest_cache_hit`，一路命中直到第一块 miss，命中的这段就是可复用前缀；prefill 只对「后面没命中」的块真正算 KV。前面的块只是把块表指向已有显存，不再重复计算。[1]

## 结论与心智模型修正

- 作者一开始以为缓存是“按对话/请求”来的，后来意识到实际上是**按内容**的：只要 token 序列前缀完全一致，就能跨用户、跨请求共享 KV 块。系统提示这样的静态前缀是关键资产。[1]
- 也因此，哪怕只微小改动前缀（系统提示、工具定义、JSON key 顺序等），都会打断哈希链，让后续块全失效，缓存收益立刻下降。理解这一点有助于在应用层做更好的上下文工程和成本优化。[1]

来源
[1] How prompt caching works - Paged Attention and Automatic Prefix Caching plus practical tips | sankalp's blog https://sankalp.bearblog.dev/how-prompt-caching-works/
