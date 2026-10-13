# RLHF VS RLVR

结论先行：RLHF 是“人教 AI 怎么像人”，RLVR 是“规则教 AI 怎么对”。前者偏主观对齐，后者偏客观约束。现实系统里，顶级模型几乎一定是两者混合用，而不是二选一。

⸻

先把名字拆开：  
    •	RLHF（Reinforcement Learning from Human Feedback）  
从“人类反馈”里学奖励函数  
    •	RLVR（Reinforcement Learning with Verifiable Rewards）  
用“可验证规则”当奖励函数

本质区别在：奖励信号从哪来，靠谱不靠谱，贵不贵，能不能规模化。

⸻

一、Why：它们解决的不是同一个问题

RLHF 解决什么？

解决的是：

“模型输出，像不像一个靠谱的人？”

比如：  
    •	这个回答有没有礼貌？  
    •	有没有帮助？  
    •	有没有胡说八道？  
    •	会不会冒犯？

这些东西：

❌ 没有公式  
❌ 没有标准答案  
✅ 只能靠人判断

所以必须找人来打分。

⸻

RLVR 解决什么？

解决的是：

“模型输出，对不对？”

比如：  
    •	数学题结果对吗？  
    •	代码能跑吗？  
    •	SQL 查询有没有报错？  
    •	证明是否成立？

这些东西：

✅ 能自动验证  
✅ 可写脚本判定  
✅ 不需要人盯着看

所以可以规模化刷。

⸻

一句话：

RLHF = 审美 + 价值观 + 体验  
RLVR = 正确性 + 可计算性 + 工程约束

⸻

二、How：机制层面的核心差异

1️⃣ RLHF 的机制

流程通常是：

人类标注 → 训练 Reward Model → PPO 强化学习

关键点：  
    1.	人类看多个回答  
    2.	排序 / 打分  
    3.	训练一个“奖励模型”  
    4.	用 RL 逼模型迎合奖励模型

问题在于：

👉 Reward Model ≈ 人类偏好的“近似函数”

它本身是有噪声、有偏见、有漂移的。

所以 RLHF 很容易出现：  
    •	讨好型回答  
    •	废话变多  
    •	模糊安全话术  
    •	“像人但不一定对”

俗称：alignment tax。

⸻

2️⃣ RLVR 的机制

流程是：

生成 → 自动验证 → 给分 → RL 优化

关键点：

奖励不是学出来的，是算出来的。

例如：

if answer == ground_truth:  
    reward = 1  
else:  
    reward = 0

或者：

run code && exit_code == 0 → reward=1

优势：  
    •	无主观偏差  
    •	极稳定  
    •	可无限 scale

代价：  
    •	只能覆盖“可形式化问题”  
    •	很多现实任务没法验证

⸻

三、Trade-off：谁更值？谁更危险？

RLHF 的代价

维度	结果  
成本	极高（人工）  
扩展性	极差  
稳定性	中等偏低  
偏差风险	高  
对齐能力	强

最大风险：

👉 奖励模型被“骗”。

模型学会：

“怎样让人类觉得我很好，而不是我真的很好。”

⸻

RLVR 的代价

维度	结果  
成本	极低  
扩展性	极强  
稳定性	极高  
覆盖面	窄  
泛化性	有风险

最大风险：

👉 Reward hacking。

模型钻规则漏洞，比如：  
    •	输出 hack 解  
    •	针对测试器优化  
    •	投机取巧

不是“理解”，而是“刷分”。

⸻

四、现实工业界怎么用？（重要）

没有人只用一个。

现实路线是：

标准三段式（主流范式）

SFT → RLVR → RLHF

含义：

1️⃣ SFT：学基本能力  
2️⃣ RLVR：练硬实力（数学 / 代码 / 推理）  
3️⃣ RLHF：做人类对齐

为什么顺序这样？

因为：  
    •	先练准度  
    •	再练礼貌  
    •	避免废话污染能力

⸻

新趋势：RLVR 权重越来越高

近两年趋势非常明显：

👉 能自动验的，全走 RLVR。

原因很现实：  
    •	RLHF 太贵  
    •	太慢  
    •	太不可控

现在重点强化：  
    •	Math  
    •	Reasoning  
    •	Coding  
    •	Tool use  
    •	Agent planning

基本靠 RLVR 撑起来。

⸻

五、对你这种工程导向选手的意义（重点）

站在“长期复利 + AI 工程化”的视角：

1️⃣ RLHF ≈ 产品对齐层

你该关注：  
    •	Prompt 设计  
    •	Safety guard  
    •	UX 对齐  
    •	输出风格控制

本质是产品问题。

⸻

2️⃣ RLVR ≈ 能力护城河层（更值钱）

你该重点研究的是：  
    •	自动评测系统  
    •	Test harness  
    •	Judge LLM  
    •	Eval pipeline  
    •	Reward DSL

这才是：

👉 AI 工程壁垒核心。

谁掌控 RLVR infra，谁掌控模型进化速度。

⸻

现实例子：

如果你能做：  
    •	自动验证 Agent 是否完成任务  
    •	自动给代码打分  
    •	自动跑回归测试  
    •	自动评估工具调用质量

你就在搭自己的“私有 RLVR 系统”。

这是 Edges 体系里最有复利价值的模块。

⸻

六、最小可行实践（MVP）

如果你想自己玩：

RLHF MVP（不推荐重投入）  
    •	用 GPT-4 / Claude 当 judge  
    •	模拟人工偏好  
    •	排序输出

成本高，收益低。

⸻

RLVR MVP（强烈推荐）

做一个最小系统：

Prompt → LLM → Task → Verifier → Score → Log

例如：  
    •	代码：pytest  
    •	SQL：query runner  
    •	文本：regex / rules  
    •	Agent：step checker

用日志喂回去优化 prompt / router。

这已经是简化版 RLVR。

⸻

七、停止条件 / 反指标

什么时候别搞？

别搞 RLHF 如果：  
    •	没预算  
    •	没标注团队  
    •	没评审规范

= 浪费钱。

⸻

别搞 RLVR 如果：  
    •	没 verifier  
    •	验证规则不稳定  
    •	容易被钻漏洞

= 自欺欺人。

⸻

最后一层抽象（给你留的认知锚点）

RLHF 和 RLVR 的分野，其实是：

人类社会 vs 数学物理

RLHF：文化系统  
RLVR：形式系统

文明靠前者稳定，技术靠后者爆发。

真正强的 AI 系统，一定是：

👉 用 RLVR 打地基，用 RLHF 做外观。

如果你愿意，下一步我可以帮你把这个映射到：  
    •	Agent 系统  
    •	AI Coding 流水线  
    •	团队级 Eval 基建

直接落到你现在的体系里。



> 更新: 2026-02-07 23:15:52  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gkuzzgiayiapgapy>