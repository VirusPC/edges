
https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2

> 这些优化最终需要在完整任务中体现价值，而不只是让单次查询看起来更快。为此，我们在代码仓库问答 **SWE-QA-Bench** 和深度研究问答 **BrowseComp-Plus** 上进行了配对 A/B 评测。

这个理由solid吗？


**方向上是 solid 的：它们确实覆盖了 zg 声称解决的两类核心 workload——代码库中的跨文件定位，以及大语料中的多文档证据整合。**但若用这两个 benchmark 支撑“完整任务里普遍更有效”的产品结论，证据还不够完整，尤其 BrowseComp-Plus 的 98.67% 到 99.00% 增益很接近 ceiling。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]

## 为什么选得合理

zg 的价值主张不只是提升某次检索的 recall/latency，而是降低 Agent 完整任务中的搜索轮次、无关文件读取和 context token，同时不损伤答案质量。配对 A/B 且固定 Agent、模型、Prompt、环境和任务限制，并只给实验组增加预建索引、MCP 工具与使用指引，这个设计能够直接观测 tool calls、input tokens、wall-clock 与任务质量的联动变化。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]

- **SWE-QA-Bench**：20 个真实仓库问答任务，要求跨文件定位实现并多步推理，和“symbol/section chunk + semantic/BM25/rg + MCP”的代码检索链路高度匹配。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]
- **BrowseComp-Plus**：80 个固定大规模语料的深度研究问题，要求检索并整合多篇文档证据，能验证其方法并非只适用于 source code，也能覆盖文档/知识库情境。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]
- 两者共同覆盖“**代码 + 非代码**”和“**局部定位 + 多证据综合**”，因而用作第一轮 end-to-end 任务评测，比单测 MRR、Recall@k 或 query latency 更符合其叙事。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]

## 不够 solid 的地方

|问题|为什么会削弱论证|建议补强|
|---|---|---|
|**Benchmark 与能力强耦合**|zg 的主要增量是本地静态语料检索、结构化 chunk、混合召回和 grep 验证；这两个任务天然奖励 retrieval/context efficiency，但不能外推到修 bug、改代码、运行测试等软件工程闭环。 [[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]|增加 SWE-bench Verified / Multilingual、Repo-level bug fixing，报告 resolve rate 与执行成本|
|**样本量偏小**|20 个 SWE-QA 任务很容易受任务难度、随机采样及 Agent run variance 影响。 [[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]|全量或分层抽样，多随机 seed，提供 paired bootstrap CI、显著性检验和逐题结果|
|**BrowseComp 已接近满分**|98.67% 到 99.00% 只相差约 0.33 个百分点，质量提升的解释空间很小；重点其实是 token/call/time 的节省。 [[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]|展示 exact correct 数、置信区间、失败题变化，并用更难或更低基线的语料任务验证质量收益|
|**把工具和 policy 一起测了**|实验组不只加 zg MCP，还加入“使用指引”；提升可能来自 prompt/tool-routing policy，而非检索器或 chunk/index 本身。 [[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]|做消融：仅 MCP、MCP + 指引、dense-only、BM25-only、hybrid、hybrid + rg、不同 chunk 策略|
|**预建索引被排除**|对一次性问答不公平；只有在同一 workspace/语料有足够复用次数时，索引成本才可摊薄。文章虽明确说明这一点，但没有给出 break-even。 [[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]|报告 index latency、CPU/RAM/disk、embedding 成本、增量更新时间和 `N` 次查询后的总成本曲线|
|**Baseline 可能偏弱**|“Agent 标准工具”具体有哪些、是否已有 `rg`/file search、其 tool descriptions 如何写，会显著决定对比强度。 [[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]|给出完整 prompt、tools、版本、模型参数、每题轨迹、可复现实验脚本与原始日志|

## 更严谨的表述

我会认可它支持下面这句话：

> **在这两个固定语料、使用该 Agent 配置和工具策略的端到端问答任务中，zg 能显著降低上下文与搜索操作开销，且没有观察到任务质量下降。**[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]

但目前还不足以直接推出：

> **zg 的检索架构在一般 Agent 工作流中稳定提高质量。**

尤其第一句和第二句之间差了三层证据：**可重复性**（multi-seed/CI）、**归因性**（retriever vs tool guidance vs baseline）和**外部有效性**（真实编码修改、不同 repo/语言/模型/规模与冷启动成本）。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]

## 我会怎样补评测

最低成本且最有说服力的一组是：

- 在两个现有 benchmark 上跑 `baseline / zg-only / zg + usage guide`，每个任务至少 3–5 个 seed。
- 对 zg 做 `dense / BM25 / hybrid-RRF / hybrid-RRF+rg` 逐层消融。
- 对 chunk 做 `fixed-window / Markdown heading / symbol-aware` 对照，才能证明“结构提取”而非仅模型 embedding 带来的贡献。
- 在固定查询次数 `N` 下报告端到端成本：
    
    ```
    T_{\text{total}} = T_{\text{index}} + \sum_{i=1}^{N} T_{\text{task},i}
    ```
    
    同时报 token、API embedding 费用、磁盘、峰值内存和增量索引耗时。
    
- 补一个真正的 **agentic SWE** benchmark：任务必须编辑仓库、执行测试并以测试/patch 是否通过作为主指标；问答分数只能作为辅助指标。

所以，**“为何选这两个 benchmark”的产品逻辑是顺的；“用这两个 benchmark 已充分证明架构价值”的科研逻辑则只能算中等偏弱。**它们很适合做首版的 showcase/工程评测，不够单独承担强泛化或强因果结论。[[mp.weixin.qq](https://mp.weixin.qq.com/s/Kqi13mAjN_Rh3EvN8TjWHg?app_version=3.30.302.5&app_sdk_id=31120131160&app_publish_channel=Sdk&os_version=26.4.1&app_lang=zh-cn&os_name=Mac&c_district=0&app_instance_id=2)]