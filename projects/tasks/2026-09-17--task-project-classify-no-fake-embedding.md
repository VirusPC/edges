# Task Project 分类：不做「LLM prompt 假 embedding」，真 Embedding 调研结论

来源：与 Coding Agent 专家讨论（2026-09-17）。产品决定已拍：撤回 PR #78 的 NCC 文案改造；embedding 通道另开 backlog 后续再做。

## 结论

1. **任务归属是文本分类，不是无标签聚类。** 已设 Task Project 相当于类质心；更贴切的算法名是 **NCC（Nearest Centroid Classifier）**，不是 K-means。但真 NCC 需要真向量。
2. **流行可落地栈：** `sentence-transformers`（如 MiniLM）+ cosine / `sklearn.NearestCentroid`。不定长文本 OK，CPU 可跑；主要成本是首次模型下载与 PyTorch 磁盘占用。
3. **Chat LLM 无法靠提示词生成可用 embedding。** 「让模型输出一串数字当向量」不是 embedding。强 LLM 场景应二选一：**直接归类**（prompt 分类），或接 **Embeddings API / 本地 embedding 模型**。
4. **产品决定：** 撤回 PR #78 的「NCC」文案改造（避免名实不符）；embedding 能力另开通道后续做（本地 sentence-transformers 或云端 Embeddings API），不与当前软分类实现缠死。

## Why

- 已有 Project 时，问题是「新 task 归哪个已有类」，质心来自已设 Project，不是再发明 k 个簇中心 → NCC 语义对、K-means 语义偏。
- 没有真向量却叫 NCC / embedding，会误导后续实现与评测，也会把「假向量」写进协议文案。
- Prompt 假 embedding：空间不稳定、不可比、不可缓存成索引；看起来像接了向量层，实际仍是每次 LLM 抽风。
- 真 embedding 有明确工程账：模型体积、冷启动、是否上云费用与可复现；值得单独 backlog，而不是塞进 PR 文案。

## How to apply

- **现在：** Task Project 分类继续用约定好的软路径（agent / skill 按 description 判归属等）；文档与 PR **不要**宣称已做 NCC / embedding。
- **PR #78：** 撤回其中把算法说成 NCC、却未接真向量的文案改造。
- **后续 Embedding 接入（另卡）：** 在「仓内/CLI 可用 embedding」就绪前，不把 classify 硬沉进 `edges tasks` CLI 做成空壳。候选实现：
  - 本地：`sentence-transformers`（MiniLM 级）+ cosine / NearestCentroid；接受首次下载与 PyTorch 体积。
  - 云端：Embeddings API；账费用、密钥、可复现与离线场景。
- **有真向量之后：** 再谈 NCC 命名与 CLI classify；可与交互式主题聚类（真距离 / 多轮）交叉，但仍是增强项，不替代人确认主题。

## 交叉链接

- backlog（需 embedding 前置）：`knowledge/tasks/_default/backlog/2026-09-17--classify沉到edges-tasks-CLI.md`
- backlog（真 embedding + K-means 探讨补记）：`knowledge/tasks/_default/backlog/2026-09-15--交互式主题聚类参考K-means.md`
- ADR：`docs/adr/0010-classify-tasks-and-task-project-metadata.md`；分组形状见 ADR 0009
- backlog（Embedding 接入）：`knowledge/tasks/_default/backlog/2026-09-17--Task-Project分类接入真正Embedding.md`

## 非目标

- 不在本笔记指定唯一供应商或模型名定案。
- 不把「直接 LLM 归类」伪装成向量检索。
