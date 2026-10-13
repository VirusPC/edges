# Agent 记忆检索 Dropout（retrieve-dropout）减过偏

来源：与 Agent Memory 专家 2026-09-16 讨论；peng cheng 要求一并记入 idea 文档。  
看板任务：`knowledge/tasks/_default/backlog/2026-09-16--记忆查询Dropout随机屏蔽.md`

## Idea 核心

有时担心当前会话被过去记忆影响过深、偏向过大。类比 Dropout：Agent 查询/召回记忆时，随机屏蔽一部分**软记忆**，可能让回答更好、不那么锁死在旧路径上。

这是可测假设，不是已定生产方案。

## 机制变体（讨论过）

- **Retrieve dropout**：对 top-k 随机丢掉一部分，或对分数加噪声再取 top-k
- **Type / 路径 dropout**：随机屏蔽某类记忆（旧 episodic、某项目等）
- **时间 dropout**：随机削弱太老或太新
- **更稳变体**：
  - 按冲突度 drop
  - 按连续命中次数提高 drop（反马太）
  - **双通道**：硬约束永不 drop（`AGENTS.md` / 安全 / 权限）+ 软回忆可 drop

## 边界

- 硬约束不可 dropout
- 事实题若唯一证据被 drop，会增方差；需可调度（难事实题少 drop）
- 可测假设：同一写入下，确定性 top-k vs retrieve-dropout；看偏见/冲突题是否更好、事实题掉多少

## 近亲论文（非完全同一设定，供 related work）

- Memory Dropout（arXiv:1911.08522）：MANN 训练期对冗余记忆采样+老化，名字最像
- Stochastic RAG（arXiv:2405.02816）：Gumbel-top-k 随机采样文档，非死板 top-k
- 经典 RAG：多文档边缘化
- MMR / DPP 等多样性检索：减近重复
- Strategic forgetting / SF-AMS 一类：效用遗忘（有策略，非随机）
- 评测 empty / random / placebo memory 对照
- **易混**：Bayesian RAG + MC Dropout（dropout 在 embedding，不是丢记忆条目）

## 缺口

公开工作少见「Agent 长期记忆 + 推理时随机屏蔽软记忆、硬约束除外、专打过偏」这一完整设定——可写成可测 idea。

## 下一步（未指派）

- 先 grill 作用点：只在 ask/recall 上 drop，还是写入前也 drop；按条 / type / 相似度层
- 定随机策略：drop rate、可复现种子、必留关键条目
- 与 Observation / Evaluation 交叉：要能对比「全量记忆 vs dropout」，否则只剩体感
- 非目标：不替代记忆清理/过期；不默认当生产必开项
