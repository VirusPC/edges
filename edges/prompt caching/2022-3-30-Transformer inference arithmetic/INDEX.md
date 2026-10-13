这篇是 kipply (Carol Chen) 2022年的经典文章，用纯第一性原理推算（无实验、无复杂数学）来解释 Transformer 推理延迟的各个组成部分。核心内容：
KV Cache：自回归采样时缓存 k/v 向量避免重复计算，每 token 存储 2 × 2 × n_layers × n_heads × d_head 字节。没有 KV Cache 采样是 O(n²)，有了之后线性。但小 batch 下可能 memory bound，此时 KV Cache 省不了时间反而占显存。
显存容量：52B 模型权重 104GB，至少 3 张 A100-40GB，剩余空间决定 KV Cache 能装多少 token / batch。容量直接限制可用 batch size。
张量并行：按 attention head 切分权重到多卡，每层需 4 次 all-reduce 通信，通信量 4 × (N-1)/N × d_model 字节/层。比 pipeline parallel 利用率高但通信开销更大。
延迟公式：
	∙	小 batch（memory bound）：2P / (N × A_bw) + 通信延迟
	∙	大 batch（flops bound）：2BP / (N × A_f) + 通信吞吐
A100 上 flops/bandwidth 比值 ≈ 208，即 batch < 208 时 memory bound，≥ 208 时 compute bound。
Flops 计算：逐层拆解 qkv 投影 + 输出投影 + FFN，总计 ≈ 12 × n_layers × d_model² flops/token，与 2P 吻合（误差 <2%）。softmax/layernorm 等是 O(d_model) 级别可忽略。
中间激活开销：softmax、dropout 等操作是 memory bound 的，在小模型（336M）中占 43% 时间，但随 d_model 增大迅速变小（52B 模型约 5%）。
实测对比：用 FasterTransformer 跑 13B 模型，单卡推算 16.8ms vs 实测 22ms（76%），差距来自显存带宽未满跑（~90%）、中间激活（~2ms）、kernel 启动等。理论模型作为下界非常实用。
一句话总结：推理延迟 = 权重搬运时间（memory bound）或矩阵乘法时间（compute bound），取决于 batch size 与硬件 flops/bandwidth 比值，再加通信和中间激活的小额开销。


基于这篇文章，针对你的课程和平台工作：
直接可用于课程内容（LLM基础课补充）
	1.	把 flops/bandwidth 比值（A100 ≈ 208）作为核心教学锚点——一个数字解释”为什么小 batch 推理慢、大 batch 才高效”
	2.	用文中的 52B 模型算例做课堂练习：给定模型参数量 + 硬件规格 → 学生自己推算单 token 延迟、最大 batch size、所需卡数
	3.	KV Cache 的”省 flops 但吃显存”权衡适合作为 Lesson 1 推理成本章节的定量补充，替代目前可能偏定性的描述
平台/工程决策参考
	4.	选型公式化：任何推理部署先算三个数——权重占显存比例、KV Cache 可用空间、目标 batch 下是 memory bound 还是 compute bound，再决定卡数和是否用 KV Cache
	5.	张量并行 vs Pipeline 并行：文章明确给出判断标准——通信量 4 × n_layers × d_model / N vs 计算时间，当 d_model/chip > 1024 时张量并行通信不是瓶颈；写成 Skills 里的决策树
	6.	加卡的收益边界：通信延迟最终会超过计算节省，可以用文中公式预判”加到几张卡边际收益归零”
转化为知识资产的具体动作
	7.	把文中的延迟公式（小 batch / 大 batch 两个）抽成一个 推理延迟估算 Skill，输入模型参数 + 硬件规格 + batch size，输出预估延迟和瓶颈类型
	8.	文末 12 道练习题质量很高，可以直接改编为课程作业或面试题库的一部分​​​​​​​​​​​​​​​​

https://open.substack.com/pub/kipply/p/transformer-inference-arithmetic?r=2wfg81&utm_medium=ios 