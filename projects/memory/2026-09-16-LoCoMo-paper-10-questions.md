# 《Evaluating Very Long-Term Conversational Memory of LLM Agents》(LoCoMo) 十问分析

> arXiv:2402.17753，2024-02-27；作者：Adyasha Maharana、Dong-Ho Lee、Sergey Tulyakov、Mohit Bansal、Francesco Barbieri、Yuwei Fang（UNC / USC / Snap Inc.）
> 分析日期：2026-09-16；框架：沈向洋"论文十问"；原文：同目录 `LoCoMo.pdf`（19 页）

**Q1. 论文试图解决什么问题？**

现有长期开放域对话的评测只覆盖不超过 5 个会话、约 1K token 的上下文，无法检验长上下文 LLM 与 RAG 技术在"超长程"对话中的真实效力。论文要填补这一空白：构建高质量的超长程（very long-term）多会话多模态对话数据，并配套一套评测框架来衡量模型的长期对话记忆能力（§1）。

**Q2. 这是否是一个新的问题？**

长期对话评测本身不新（MSC、Conversation Chronicles 等已有工作），但"超长程"这一尺度是新问题：LOCOMO 平均 19.3 个会话（最多 35 个）、约 300 轮、9,209 token，长度是 MSC 的 9 倍、轮数 6 倍、会话数 4 倍，且首次引入多模态（图片分享与回应）。所以是"旧问题在新尺度 + 新模态下的首次系统性研究"（Table 1）。

**Q3. 这篇文章要验证一个什么科学假设？**

这是一篇 benchmark 论文，假设是隐含的：当前 LLM 即便借助长上下文窗口或 RAG，也无法充分理解超长对话中的长程时间与因果动态，其长期记忆能力显著低于人类。实验结果（最强模型 F1 32.1 vs 人类 87.9，时间推理落后 73%）正是为验证这一假设设计的（§1、§5）。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**

相关工作分三类：① 长期对话——MSC (Xu et al., 2022)、Conversation Chronicles (Jang et al., 2023) 及一系列检索增强/事件脚手架方法（Lee et al., 2023b; Lu et al., 2023; Zhong et al., 2023; Zhang et al., 2023）；② 多模态对话——image-grounded（VQA、Visual Dialog）与 image-sharing（PhotoChat、MMDialog, Feng et al., 2023）；③ 合成数据基准与生成式智能体——SODA (Kim et al., 2023)、Park et al. (2023) 的 Generative Agents，后者的 reflect & respond 架构被本文直接借用。值得关注的研究员包括 Park / Bernstein / Liang（生成式智能体）、Xu（MSC）、Mohit Bansal（本文通讯作者之一，UNC 对话与多模态方向）（§2、§3.3）。

**Q5. 论文中提到的解决方案之关键是什么？**

关键是一条"机器生成 + 人工校验"的数据流水线：为每个 LLM 智能体赋予 persona（取自 MSC 并扩写）和一张带因果关系、跨 6–12 个月的时间事件图 G，用 Generative Agents 式架构（短期存 session 摘要、长期存逐轮 observation，reflect & respond）驱动对话，并加入图片分享/回应行为（网络搜图 + BLIP-2 生成 caption）；最后由人工修正长程不一致（编辑约 15% 的轮次、替换/删除约 19% 的图片）。评测侧的关键是把"记忆"拆成三个可量化的任务：QA、事件图摘要、多模态对话生成（§3、§4）。

**Q6. 论文中的实验是如何设计的？**

QA 任务测三类配置：Base LLM（Mistral-7B、Llama-2-70B-chat、GPT-3.5-turbo、GPT-4-turbo，4K 截断）、长上下文 LLM（GPT-3.5-turbo-16k，分别在 4K/8K/12K/16K 窗口下测）、RAG（DRAGON 检索器 + GPT-3.5-16k 阅读器，检索单元分对话轮 / observation / session 摘要，top-k 从 5 到 50），并设人类基线。事件摘要任务用增量式摘要比较 Base 与长上下文模型（不含 RAG，因摘要需全局理解）；多模态对话生成则训练三个 MiniGPT-5 变体（仅历史 / +全局摘要 / +检索到的 observation）（§5）。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**

评测基于作者自建的 LOCOMO：50 段对话，平均 304.9 轮 / 19.3 会话 / 9,209.2 token / 32.3 张图；QA 标注 7,512 题（单跳 2,705 / 36%，多跳 1,104 / 14.6%，时间推理 1,547 / 20.6%，开放域知识 285 / 3.9%，对抗 1,871 / 24.9%，每题带证据 turn ID），另有事件图 ground truth（平均 24.2 事件）与 observation（18.2 token）/ session 摘要（127.4 token）标注；外部数据用了 MSC persona 与 MMDialog（MiniGPT-5 预训练）。论文声明代码与数据将在 https://snap-research.github.io/locomo 公开，数据集以 CC BY-NC 4.0 发布（§B.2）。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**

主体上是支持的：最强 Base 模型 GPT-4-turbo 总分仅 32.1（人类 87.9）；长上下文模型随窗口增大 QA 升至 37.8 但对抗题崩到 2.1%，事件摘要反而比 4K 基线差（F1 39.9 vs 45.9）；RAG 以 observation 为存储单元时整体提升约 5 个百分点（Table 2–4）——三点证据共同坐实"长上下文硬读 ≠ 会记忆，现有技术远不及人类"。但有几处效度瑕疵：① QA 用 F1 部分匹配，奖励逐字重叠而非语义正确；② 单一 F1 把检索召回、长文阅读、多跳/时间推理裹在一起，错误不可归因（RAG 虽报了 recall@k，但 Base / 长上下文侧没有 oracle 式拆解）；③ open-domain 类把对话信息与模型世界知识混在一起，答错分不清是记忆失败还是知识缺失；④ 人类基线只有 QA 一项，事件摘要与对话生成缺人类上限。结论方向可信，但分数不宜直接当"记忆能力"的度量。

**Q9. 这篇论文到底有什么贡献？**

三项：① 数据集——首个超长程（月级、35 会话、多模态）开放域对话数据集及可复用的人机协作生成流水线（persona + 因果事件图 + 生成式智能体 + 人工校验）；② 评测框架——QA（五类推理）、事件图摘要（FactScore 对齐事件图）、多模态对话生成三任务；③ 实证发现——长上下文模型易幻觉、RAG 存 observation 最有效且检索块过多会因信噪比反伤、时间推理与开放域知识是最难题型。它后来成为 agent 记忆系统（MemGPT、memory OS 类工作）最常用的评测基准之一。

**Q10. 下一步呢？有什么工作可以继续深入？**

论文自己在 Limitations 里给了方向：用真实对话替代合成数据、扩展到非英语、让图片具有个人照片式的视觉一致性、用开源 LLM 跑通生成流水线（§8）。从今天的视角看更值得做的：① 把评测从"记忆怎么用"扩展到"记忆怎么写入/更新"——考知识更新（旧信息被覆盖后的一致性）、助手侧信息召回，这正是后续 LongMemEval 补上的构念缺口；② 用 oracle / recall@k 把检索与阅读错误归因拆开，并换用语义级裁判替代 F1 词面匹配；③ 把历史长度再拉大一到两个数量级（LOCOMO 的 9K token 今天已能塞进任何长上下文窗口，区分度在消失）；④ 在 LOCOMO 上系统评测可学习的记忆写入/巩固机制，而非只有固定的 RAG 三种存储单元。

---

## 附录：「超长程（very long-term）」的三维定义

LoCoMo 的 "very long-term" 不是形式定义，而是三个维度叠加的尺度宣称：

1. **会话/轮数**：平均 19.3 个 session（最多 35 个）、约 300 轮——此前工作 ≤5 会话（MSC 4 个、Conversation Chronicles 5 个）；
2. **超窗口 token 长度**：平均 9,209 token——超过当时 GPT-3.5/4-turbo 的 4K 窗口，逼出截断或检索；
3. **对话内月级叙事时间**：事件图跨 6–12 个月、带因果链，会话以周/月间隔。

**关键判断：前两条已贬值，第三条才持久。** ① 和 ② 的"长"是相对模型能力的——9K token 今天任何模型都能一口读完，退化为短文档阅读理解，测不出记忆。③ 不随窗口变大而贬值：它考的是跨月时间推理与 persona/因果一致性（论文实验中模型落后人类最多、达 73% 的正是时间推理）。因此引用 LoCoMo 时别把 token 长度当卖点；它的持久价值在题型设计与事件图标注。

## 附录：评测框架深挖（贡献点②）

**设计逻辑**：把"记忆"拆成一条能力链——QA 测**取回**（recall）、事件图摘要测**时间与因果理解**、多模态对话生成测**应用**（用召回内容生成连贯回应）。隐含主张：光会检索不算有记忆，还要理解事件随时间的演化并用对（§4）。

**Task 1 QA（主力，也是被后人唯一沿用的）**

- 题型设计是亮点：single-hop 测单会话召回、multi-hop 测跨会话聚合、temporal 测时间推理、open-domain 测"对话信息+外部知识"整合、adversarial 测不可答检测——2024 年初就把拒答校准列为正式题型（1,871 题 / 24.9%），同期罕见。每题标证据 turn ID，RAG 侧可算 recall@k。
- 三处硬伤：① F1 部分匹配——标注强制答案逐字取自对话想把开放问答"榨"成抽取式（§4.1），但模型不逐字答（§8 自认），分数系统性惩罚语义正确的改写，对抗题尤其没法判；② 证据 turn ID 只用于 RAG 的 recall@k，Base/长上下文侧无 oracle 归因，"没看见"和"看见没用对"混在一个 F1 里；③ 人类基线（87.9）测量方法全文未披露——多少题、几个标注者、一致性均无（附录 B.3 只说 in-house 标注者、人口信息保密），而"落后人类 56%/73%"的结论全靠它。
- 协议：temperature 0、top-p 1、每模型单次推理，无方差报告（§C.2）。

**Task 2 事件图摘要（设计最巧，也最有循环性）**

- 巧处：ground truth 免人工——对话本就从事件图 G 生成，G 天然是标准答案（平均 24.2 事件/段）。
- 指标有品味：弃 BLEU/ROUGE 作主指标，改用 FactScore 双向适配——参考与摘要都拆成原子事实，precision = 摘要事实被 G 支持率，recall = G 事实覆盖率（§4.2）。协议为增量式摘要（Chang et al., 2023）+ 1 个 in-context 示例。
- 出了全文最有意思的结果：长上下文（16K）反比 4K 基线差（FactScore F1 39.9 vs 45.9）——"读得到"≠"读得懂"。人工错误分析归纳五类错误（漏跨会话因果、幻觉拼贴、误解幽默/讽刺、说话人归因错、闲聊当大事），质量高。
- 循环性风险：G 是 LLM 生成、摘要是 LLM 写、FactScore 拆解还是 LLM——全链路同构，FactScore 在该 domain 无元评测；且任务本质是"还原生成剧本"，测记忆还是测逆生成，论文未讨论。无人类基线。

**Task 3 多模态对话生成（添头）**

- 三个 MiniGPT-5 变体（仅历史 / +摘要 / +检索 observation），50 段未人工校验对话训练，MM-Relevance + BLEU，结果只在 Figure 4 无表格；结论与 QA 一致（observation 最有帮助）。
- 问题：训练数据小、embedding 级指标区分度存疑、无人类基线，意义主要是宣示数据集多模态而非严肃评测。

**总评**

- 被历史选择的：后来的记忆系统论文（MemGPT、各类 memory OS）几乎只用 QA 任务，另两个任务基本无人复现——社区用脚投票，框架实际退化为"一个 QA 数据集"。
- 超前的：五类推理划分（尤其 adversarial）、证据 turn ID、FactScore 式原子事实评估，被后续 benchmark（LongMemEval 等）吸收并正规化。
- 没做完的：无归因设计（oracle）、无指标元评测、人类基线不可审计、三任务共用同一批 50 段对话，结论绑死在这份合成数据分布上。
- 一句话：**概念设计**（记忆=取回+理解+应用、五类推理、原子事实评估）配得上影响力；**测量实现**（F1、单次推理、不可审计的人类基线、循环 ground truth）决定其分数只能同表内比，不能当绝对能力读数。

## 附录：三种检索单元的真实样例与体感（RAG 深挖 ①）

LoCoMo 的 RAG 是标准 single-shot 稠密检索：DRAGON（Lin et al., 2023）双塔把检索单元预先落成向量库，问题编码后按相似度取 top-k 拼进 GPT-3.5-16k 作答；无 BM25 混合、无 rerank、无迭代检索。**三种"检索单元"的区别不是检索方式，而是"把什么嵌进向量库"**。附录 Figure 8/9 给了同一段对话的三种形态：

**① Dialog（原始对话轮，~30 token/轮）**

> **Joanna:** Hey Nate! Long time no see! I've been working on a project lately — what about you — any fun projects or hobbies?
> **Nate:** I won my first video game tournament last week — so exciting!
> **Nate:** The game was called Counter-Strike: Global Offensive, and me and my team had a blast to the very end!
> **Joanna:** Wow Nate! Congrats on winning! Tell me more — what game was it?

大量轮次是 "Wow, great job!" 式社交噪声；信息散落多轮且充满指代（"it"、"the game"），单抽任何一轮上下文都不完整。

**② Observation（对话抽出的断言，~18 token/条）**

> • Nate won his first video game tournament last week.
> • The video game Nate won the tournament in is called Counter-Strike: Global Offensive.
> • Joanna recommends a romantic drama movie that is all about memory and relationships.
> • Joanna watched the recommended movie around 3 years ago and even owns a physical copy.

每条自包含：指代已消解、说话人写死、噪声清零，一条向量即可独立被检索。

**③ Summary（session 摘要，~127 token/session）**

> On 21 January 2022, Joanna and Nate reunited after a long time without seeing each other. Nate won his first video game tournament playing Counter-Strike: Global Offensive. ... Joanna recommended a romantic drama to Nate, which he expressed interest in watching.

叙事连贯带时间戳，但压缩有损："Joanna 三年前看的、还收藏实体碟"、"首胜"、"团队射击"等细节被丢弃。

**三种形态 × RAG 成绩（Table 3，Overall F1）**

| | 单条体量 | 信息密度 | 指代消解 | RAG F1（最好档） |
|---|---|---|---|---|
| Dialog | ~30 tok | 低，夹噪声 | ❌ | 35.8（k=25） |
| Observation | ~18 tok | 高，纯事实 | ✅ | **41.4（k=5）** |
| Summary | ~127 tok | 中，有损 | ✅ | 32.5（k=5） |

observation 5 条即登顶；dialog 要 25 条才追上；summary 的 recall@k 最高（k=10 达 90.7%）但 F1 垫底——**检到了，可答案细节在压缩时已丢**。

## 附录：multi-hop 与"多针问题"（RAG 深挖 ②）

multi-hop 是**唯一小 k 检索反而帮倒忙、且随 k 单调变好**的题型（Table 3，对照无检索基线 23.3）：

| 检索单元 | k=5 | k=10 | k=25 | k=50 |
|---|---|---|---|---|
| 对话轮 | **19.4 ↓** | 26.8 | 36.1 | 37.2 |
| observation | 30.6 | 30.5 | 33.2 | 34.5 |
| 摘要 | 15.7（k=2） | 14.7（k=10） | — | — |

- **机制**：multi-hop 需同时拿到分散在多会话的证据集，缺一条即答错；小 top-k 只捞回部分证据，模型拿"半截上下文"自信瞎编，比不检索更差（dialog k=5 时 recall@5 仅 34.4%）。与 adversarial（k 越大越崩）、single-hop（k=5 即饱和）曲线完全相反。
- **例外 1**：observation 小 k 下抗揍（k=5 即 30.6，+7.3 vs 基线）——密度高，5 条覆盖更多证据。
- **例外 2**：摘要全线最差（14.7–16.6）——recall 高但细节已丢，"检索到了但信息已不在"。
- **症结在范式**：单向量、单跳、一次检索装不下多跳意图（"一个问题一个语义重心"vs"需要一个证据集合"）。后续补丁：查询拆子问题、迭代检索、图式记忆（HippoRAG）、LongMemEval CP2 扩 key。LongMemEval 设 MR 能力项正是针对此。

## 附录：Base / Long-context / RAG 三策略与"在场 ≠ 被用上"

- **Base = 遗忘**：装不下的**早期**对话直接砍（"earlier dialogues are omitted"，留**最近**的尾部，非前半截）。失败模式是**无知**。
- **Long-context = 硬读**：gpt-3.5-turbo-16k 在 4K/8K/12K/16K 四档测——16K 档全文（9.2K）装得下，无截断；低档与 Base 同规则截断。同模型家族 4K 对 4K 几乎同分（24.1 vs 22.4），证明差距来自"在场信息量"而非模型身份。失败模式是**乱答**。
- **RAG = 查笔记**：全量在向量库，模型只见 top-k，成败取决于检索器。

**窗口剂量-反应曲线**（控制模型不变，只变在场历史量）：overall 24.1→25.2→33.5→37.8 单调涨，adversarial 13.1→8.4→6.4→2.1 单调崩。读得越多，能答对的变多，能拿来编的素材也变多。

**"全量信息在场"的精确含义**：信息瓶颈被消除，但瓶颈转移到"信息的选择与组织"。三个机制：① 注意力稀释——相关两句淹没在 9K token 里（lost in the middle）；② 误导素材在场——对抗题的"3 月""工作"碎片都在，幻觉素材备齐（GPT-4 Base adversarial 70.2 vs 16K 硬读 2.1：上下文越少越不容易被骗）；③ 结构理解不白送——事件都"看见"但跨月因果链连不上（事件摘要 16K 反逊 4K）。这正是"记忆系统"要解决的问题，也是论文留给后续研究的口子。

**型号注脚**：gpt-3.5-turbo（4K）与 gpt-3.5-turbo-16k（16K、约 2 倍价）是同代变体，"-16k"是窗口统一前的过渡产物——当年"读完 9K"需专门选型，今天是默认值，这也是 LoCoMo 区分度消失的原因之一。

## 附录：Observation / Summary 的生成方式——被冻结的"写入"变量（RAG 深挖 ③）

两者都由 **gpt-3.5-turbo 生成，且本为"造数据"的记忆模块服务**（Park et al. 2023 生成式智能体架构），评测时被顺手拿来当 RAG 存储单元：

**Observation（逐轮抽取，高召回导向）**——每个 session 的每一轮对话都过一遍抽取 prompt 转成断言入长期记忆。原始 prompt（Figure 9）三个关键选择：① 只抽**关于说话人的客观事实**，显式排除"speaker is supportive"类关系动态；② 定位为"speaker 的数据库条目"；③ **"Do not leave out any information"**——宁滥勿缺。图片 caption 也进长期记忆（脚注 2）。

**Summary（递归增量摘要）**——每 session 结束后生成 w_k，条件是**当前 session 原文 + 上一个摘要 w_{k−1}**（滚雪球）。每个 w_k 实为累积摘要，强制带时间引用。原始 prompt 全文（Figure 8，占位符为注入变量）：

> In previous interactions, {previous_summary}. The current time and date are {current_date_and_time}.
> {speaker_1_name} and {speaker_2_name} talked today and had the following conversation: {session} Summarize the interactions between {speaker_1_name} and {speaker_2_name} so far. Include key details about both speakers and include time references wherever possible.

真实输出样例（Figure 8，对应一次 session）：

> On 21 January 2022, Joanna and Nate reunited after a long time without seeing each other. Nate won his first video game tournament playing Counter-Strike: Global Offensive. Joanna enjoys writing, reading, watching movies, and exploring nature as hobbies. They both share a love for movies, with Nate favoring action and sci-fi while Joanna prefers dramas and romcoms. Joanna recommended a romantic drama to Nate, which he expressed interest in watching. Nate praised Joanna's recommendation and promised to give it a try.

**关键判断：写入/索引策略是 LoCoMo 隐式冻结的一等变量。**

- observation 抽漏 = 永远检不到，抽错 = 检到错答案——Table 3 的排序全部条件化在"这套 prompt + gpt-3.5-turbo"上，论文零消融；换抽取模型或改 prompt（允许关系动态、带时间戳），结论可能重排。
- 递归摘要误差累积：w_k 依赖 w_{k−1}，第 3 个 session 的压缩损失滚到第 30 个——"摘要形态不行"与"这套递归增量摘要不行"分不开。
- 构念效度上的含义：LoCoMo 回答"给定已建好的记忆能否取回并用对"，**不研究记忆怎么写入**——写入固定，单一 F1 把写入质量、检索、阅读裹在一起。
- 后续解冻：LongMemEval 把它变为一等公民（CP1 value 粒度 × CP2 key 构造逐点消融 → "round 最优、扩 key +9.4% recall"）；Mem0、Zep 等工程系统的抽取 prompt 迭代几乎是核心竞争力——整个 memory 赛道某种程度上都在做 LoCoMo 冻结的那个变量。

## 附录：「一轮（turn）」的定义与粒度甜点

- LoCoMo 的 turn = **一个说话人的一条发言**（非一问一答）：h_kj = 第 k session 第 j 条发言；平均 15.8 turn/session、30.2 token/turn（Table 5）；允许同一人连发多轮；一条 turn 可带图（"[shares a photo of ...]"，caption 随入长期记忆）。
- **≠ LongMemEval 的 round**（user 一条 + assistant 一条的双人交换），后者粒度粗一倍。
- 对检索的实际影响：单条发言天然残缺（"Wow, great job!" 离开上下文无意义）→ dialog 单元差；整段 session 太粗（信噪比低）。
- **两论文互补出的粒度甜点**：单人发言太碎（LoCoMo dialog 差）← → 整段 session 太粗（LongMemEval session 差）；**一问一答的交换（round）或原子断言（observation）才是检索单元的甜点**。



## 附录：两年后回看——哪些结论仍然重要，哪些已被推翻（截至 2026-09）

> 口径声明：论文原分数是 F1，后续系统普遍改用 LLM-as-judge（J 分），绝对值不可直接比；但量级结论已足够清楚。

**✅ 仍然重要、被反复验证的**

1. **时间推理最难。** 2026 年统一 harness 横评中 OpenAI Memory 的 temporal 仅 21.7%，多数系统在 temporal/multi-hop 上明显弱于 single-hop——LoCoMo 最经得起检验的诊断结论（arXiv:2604.01599）。
2. **"存什么粒度"是记忆系统第一变量，断言式（observation）存储最优。** 已成行业标准：Mem0、Memobase、Zep 写入端清一色抽原子事实/事件，即 observation 思想的工程化（arXiv:2504.19413）。
3. **检索不是越多越好（信噪比）。** top-k 调优、rerank、intent-aware 检索规划仍是系统设计核心。
4. **题型设计遗产。** 五类推理（尤其 adversarial/拒答）被 LongMemEval 正规化为 ABS；每题标证据 ID 成 benchmark 标配；LoCoMo 本身成为事实标准考场。

**❌ 已被推翻或过期的**

1. **"LLM 远不及人类（32.1 vs 87.9）是根本性能力差距"**——2026 年统一 harness 下 BYTEROVER 96.1%、HonCho 89.9%、Hindsight 89.6%、Mem0 自称 92.5，全部越过论文人类线 87.9（arXiv:2604.01599）。当年的"鸿沟"更多是"2024 年模型 + 朴素策略"的暂时状态。
2. **"长上下文硬读不如记忆系统"**——Mem0 论文 full-context 基线 72.9 J 高于当时 Mem0（66.9）；ConvoMem 证明 ~150 会话以内全上下文优于检索记忆（arXiv:2511.10523）。9K token 尺度上硬读已是强基线；记忆系统卖点退守成本/延迟（~1.8K vs ~26K token/query，p95 1.4s vs 17s）与更大尺度。
3. **"长上下文幻觉严重、adversarial 2.1%"**——GPT-3.5-16k 一代模型的特性，非普适结论，今天不可复现。
4. **F1 评测 + 答案键可信**——双重死亡：社区已全面转向 LLM-as-judge；独立审计发现 LoCoMo 答案键 6.4% 破坏性错误（99/1,540），LLM 裁判接受 62.8% 故意错误答案（Penfield Labs 审计，非同行评审，arXiv:2607.21962 转引）；Table 2 绝对分今天无法复现也无法比较。
5. **三任务框架中的两个**——事件图摘要与多模态对话生成未被推翻，而是被无视；社区只继承了 QA。

**⚠️ 灰色地带：结论活着，含义变了**

- "RAG 有效"：朴素 dense top-k 已被图记忆/时序知识图谱/分层存储超越，但论文本就未说 RAG 是终点——方向（外挂记忆 > 裸模型）正确，工程空间被低估。
- benchmark 本身：作为能力区分器已接近饱和且易刷分——Letta 用 GPT-4o mini + 简单文件系统达 74%，与复杂记忆系统打平（ConvoMem 转引）；厂商分数随 harness 浮动 ±20pp（Zep 被 Mem0 复测 84%→58.44%，自纠 75.14%）。现在的角色是入门 smoke test，严肃对比看 MemoryArena、MemoryAgentBench 等测序列决策的新基准。

**一句话**：LoCoMo 的**诊断性结论**（时间推理难、存储粒度重要、信噪比重要）全部活下来成为行业共识；**量化结论**（人机差距、长上下文无用、F1 分数）几乎全部过期——不是论文做错了，而是它测的是 2024 年的模型，"9K token 算长"这个前提本身易腐。

## 补充：过程中产生/消费 vs 事后静态库（2026-09-16）

> 来源：peng cheng 在 grill / 论文深读讨论中的构念澄清。本条是设计与读论文笔记，**不是**实现 PR；四臂 exploratory 仍暂停。

真实 agent 记忆是在对话**过程中**交替产生与消费的：一边写（observation / session 摘要 / 项目记忆），一边立刻用（下一轮、下一问）。写入与使用交织，而不是先把整段历史封存、对话结束后再翻库。

LoCoMo **只部分碰到**这条回路，不宜读成「做错了」，而是对**在线记忆系统**的构念错位：

- **数据生成（在线产生）**：Park 式生成式智能体按 session 抽 observation、滚摘要，对话一边发生一边往长期记忆写——这是 online produce。
- **QA 评测（事后消费）**：官方设定通常把**已经结束的整段对话**（或整份 observation 语料）当成静态库，再做截断上下文或 RAG。消费发生在对话结束之后。测的是长历史事实检索，不是「写完立刻用」的在线记忆环。

上一条附录已写过：写入策略被冻结，单一 F1 把写入质量、检索、阅读裹在一起。本条补的是**时间轴**：产生是在线的，官方消费却是事后的。因此官方 RAG / 截断基线回答的是「给定已建好的库，事后能不能取回」，**不等于** Project Memory / PM-online 的 write→use 交织。

对 Edges 的含义：

- 官方冒烟的 RAG / 截断分数仍按 ADR 0008：Evaluation Smoke ≠ Benchmark Proof，更不是 PM proof。
- 若以后评 Project Memory 或 online write→recall，必须加**因果 / session 顺序约束**。例如：用 session ≤k 的证据答题时，只允许读到写到 session k 为止的记忆；或沿时间线真正交错 write/answer——禁止偷看未来 session。
- 四臂 exploratory（baseline｜官方 RAG｜PM-online｜empty）仍 paused；本条不恢复实现。

## 补充：合成造数逻辑、宣传落差与审稿站台（2026-09-16）

> 来源：peng cheng 在 2026-09-16 讨论中确认的造数顺序与审稿视角。本条是读论文笔记，**不是**实现 PR；四臂 exploratory 仍暂停。

### 合成顺序（用户已确认）

LoCoMo 的对话不是先聊再抽事件，而是**先有结构、再表演**：

1. **persona** — 每个说话人先有人设（取自 MSC 并扩写）；
2. **每人一张因果事件图 G** — 跨 6–12 个月、带时间与因果边；
3. **按日期把事件分到 session** — 会话切割服从事件时间线，不是事后切片；
4. **智能体按这些事件接地对话** — Park 式 generate / reflect & respond，对话「演」出图上的事件；
5. **人工改对话** — 修长程不一致（约 15% 轮次、约 19% 图片）。

**关键判断：对话是事件图的表演，事件主要不是从聊天事后抽取的。** 官方 observation / session 摘要是生成过程中的记忆模块产物，和「先聊再抽 G」不是同一条路。G 在对话之前就存在。

### 为何这套造数逻辑少被宣传、却很难

社区几乎只消费成品：**对话 + QA**。事件摘要与多模态两臂长期闲置（十问附录已写：后人用脚投票，框架退化为一个 QA 数据集）；官方事件评测脚本长期停在 "Coming soon."。于是「persona → G → session → 接地对话 → 人工改」这条生成哲学被 QA 分数盖住了。

难，是因为要同时做成五件事：

- 时间一致、足够密的因果图（不是几条散事件）；
- 按日期把事件切进 session，还要像人的会话节奏；
- 多会话、像人、还带多模态（分享图 / 回应图）；
- 贵的人工一致性编辑（15% / 19% 不是点缀，是流水线成本）；
- 用 G 评事件摘要时有循环风险：LLM 画图 → LLM 演戏 → LLM FactScore 对回 G。

**对 Project Memory 的含义：** 比 QA 分更值得借的，是 LoCoMo 的**生成哲学——结构先于互动**（先 persona + 因果世界，再让交互发生）。只跑 QA，测不到 online write→use，也测不到「事件图世界模型」本身。官方冒烟分数仍按 ADR 0008：Evaluation Smoke ≠ Benchmark Proof，更不是 PM proof。

### 作者如何为生成器站台、审稿人可以问什么

论文的辩护不是「这套生成器已被证明像人」，而是「在这个尺度上，我们交出一份可用的、有约束的合成基准资源」。站台套路大致五条：

1. **尺度上的必要性** — 月级、几十 session、多模态的真实对话几乎弄不到，只能合成；
2. **结构先验** — persona + 因果事件图先钉住世界，再让智能体说话，降低胡编；
3. **人在回路** — 约 15% 轮次、约 19% 图片被改过，用来宣称长程一致性过了人工关；
4. **先例** — Generative Agents（Park et al.）与 SODA 已证明 LLM 合成对话能当研究资源；
5. **下游信号** — QA 人机差距大、题型可分（时间推理明显更难），说明这份数据还能诊断，不只是玩具。

事件摘要的 GT「免费」来自 G：一边省标注，一边把循环性写进任务设计——双刃。

审稿人有理由问、论文也没有完全关上的：

- **生态效度**：世界是 LLM↔LLM 互聊，不是人—人开放域；
- **事件摘要的循环性**：LLM 图 → LLM 对话 → LLM FactScore，测的是「还原剧本」还是「记忆」；
- **编辑率 ≠ 像人协议**：15%/19% 是改动量，不是独立的人类相似度实验；
- **分布偏移**：合成 persona / 事件 / 闲聊节奏，和真实长期对话不是同一分布。

论文用 Limitations + QA 人类基线部分吸收了这些质疑，但**没有把生成器效度证完**。读这篇时，把 LoCoMo 当「有约束的合成考场」成立；把它当「已证明像人的长期对话世界」不成立。

对 Edges：本条不恢复四臂实现，也不把生成器哲学写成「该接 Project Memory 当 LoCoMo 后端」。若以后借「结构先于互动」，那是另开的设计讨论，不是本轮冒烟的范围。

---

参考笔记：同目录《记忆Benchmark笔记-LongMemEval与LoCoMo.md》（构念效度对照视角）；全部事实性数字以论文原文 §1–§8 及附录 Table 5 核对。
