# NL 任务依赖抽取深化报告（论文十问 + 项目卡 + 关键点对比）

## 元信息

| 项 | 内容 |
| --- | --- |
| **日期** | 2026-09-14 |
| **委托来源** | peng cheng / 任务记录员 |
| **上一轮笔记** | `（上一轮短笔记未单独入库，见本报告 §0）` |
| **方法说明** | 论文统一采用 **paper-10-questions**（Q1–Q10）；开源与平台采用 **项目卡**；关键点对比在草稿基础上用十问发现扩写。本报告只合并既有 partials，不发明论文正文未出现的结论。 |
| **输入 partials** | 调研过程 partials（未入库） |

---

## 0. 执行摘要（1页内）

从自然语言任务描述自动抽取依赖（blocked-by / depends-on）并构建任务图，**有成熟学术与工程对照物**，但按三条成熟度不同的线分化，没有一条可直接当作自家 TaskGraph 的即插即用库。

1. **软件工程 issue 链接预测（高相关）**  
   JIRA 上 BERT 多类型链接（Block / Depend / Relate…）已有可复现实验（LYNX，宏 F1≈0.64）；工业侧 OpenReq 式插件强调「缺依赖要提示」与人可拒的辅助。GitHub 原生 `blocked_by` 是**存边平台**，不是 NL 抽取器；公开「NL→GH blocked_by」基准仍薄。

2. **复杂任务 → 子任务依赖 DAG（高相关，偏生活/规划）**  
   NAACL’21 端到端图归纳 + MSComplexTasks、TaskLAMA（分解强、**成对时序依赖仍弱**）、proScript 偏序脚本、教学视频 transcript 无监督任务图等，提供「NL→节点+边」与评测资源，领域多非软件看板。

3. **LLM 直接输出带依赖的分解图 + 拓扑调度（中高相关）**  
   DART-LLM、RDD、Lattice 等把「子任务 + 前置边 → DAG → ready/claim」做成可运行环；与「消息队列推 ready 给 Agent」范式同构，但领域多为机器人/符号推理或 GitHub coding backlog，且 Lattice **刻意无人闸全自动**。

**最贴合的开源对照物是 Lattice**（读 GH issues → LLM 抽 blocking 边 → DAG → MCP `list_ready_work` / `claim_next_issue`）。学术「能抽依赖」证据优先看 NAACL’21、TaskLAMA、Typed Links/REJ；需求级 LLM 依赖见 LEREDD；层次可证明分解见 ChatHTN（贴合度较低）。

**仍需自研**：保存时「推荐相关 + **人确认**依赖」闭环；非 GH 通用 NL todo；跨看板/Agent 队列契约（租约、失败回边、跨类型路由）；以及 TaskLAMA/LYNX 共同点明的 **pairwise / Block-Depend 质量**缺口——必须置信度、证据引用或人确认，不可盲目全自动写边。

---

## 1. 问题与场景锚点（TaskGraph）

| 锚点 | 含义（本文只调研，不实现） |
| --- | --- |
| **落盘推荐 + 人确认** | 看板保存任务时，系统推荐相关任务与候选依赖边，**人确认后**再写入 TaskGraph |
| **非 GH todo** | 不限于 GitHub issue；任意看板卡片 / 通用 NL 待办正文均可抽依赖 |
| **就绪队列推 Agent** | TaskGraph 上无前置阻塞的节点进入 ready 队列，由消息队列推给 Agents 领取执行 |

与「离线学术预测」「全自动无人闸」「仅平台存边」的对照，贯穿 §3–§4。

---

## 2. 核心论文十问分析

以下按推荐阅读序：TaskLAMA → NAACL’21 Decompose → proScript → 2206 typed links → 2102 industrial deps → 2302 transcript graph → DART-LLM → RDD → LEREDD/2602 → ChatHTN。各节保留完整 Q1–Q10。

---

### 《TaskLAMA: Probing the Complex Task Understanding of Language Models》十问分析

**Authors:** Quan Yuan*, Mehran Kazemi*, Xin Xu*, Isaac Noble, Vaiva Imbrasaite, Deepak Ramachandran (* equal contribution)  
**Venue/Year:** arXiv 2023; AAAI 2024  
**Links:** [abs](https://arxiv.org/abs/2308.15299) · [pdf](https://arxiv.org/pdf/2308.15299.pdf)  
**Saved PDF:** `（本机调研缓存路径已省略）`

**Q1. 论文试图解决什么问题？**  
论文研究 Structured Complex Task Decomposition（SCTD）：给定复杂真实世界任务（及可选上下文），自动生成 Task Graph——节点为完成任务所需步骤，有向边表示步骤间的时序依赖（DAG）。目标是探测大语言模型（LLM）中可提取的 SCTD 知识与推理能力，并公平评估其在步骤分解与两两时序依赖预测上的表现。该问题对辅助规划工具与常识推理系统具有重要意义。

**Q2. 这是否是一个新的问题？**  
不完全是新问题。经典与现代文献已从众包（Kokkalis et al. 2013）、搜索查询共现/层次聚类（Awadallah et al. 2014; Mehrotra and Yilmaz 2017）、网页摘要（Zhang et al. 2021）等路径研究 SCTD。论文指出已有数据集（如 MSComplexTasks、proScript）存在质量或任务复杂度不足等问题。相对新颖之处在于：把 SCTD 作为 LLM knowledge probing（xLAMA 风格）问题，并针对复杂多步骤真实任务构建高质探针与更稳健的图评估指标。

**Q3. 这篇文章要验证一个什么科学假设？**  
核心假设是：LLM 内含大量可用于 SCTD 的知识，能将复杂任务分解为高质量步骤序列，并在一定程度上利用上下文调整步骤；同时，LLM 对步骤间两两时序依赖的预测能力可能弱于其生成有序步骤序列的能力。进一步假设：利用 SCTD 结构的专用方法（多序列合并、Sample & Filter、soft-prompt tuning 等）可显著提升现成 LLM 的分解表现。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
论文将相关工作归为四类：（1）众包 SCTD（Kokkalis et al.；Zhou et al. 2022b / WikiHow 层次树）；（2）查询驱动 SCTD（Awadallah、Mehrotra & Yilmaz、Zhang et al. 2015）；（3）摘要驱动 SCTD（Zhang et al. 2021，Learning to Decompose）；（4）LLM 知识探测与脚本/规划（Petroni LAMA；Huang et al. 机器人动作规划；Sakaguchi et al. proScript；Madaan et al.；Brahman et al. PlaSma）。领域内值得关注的研究者包括：Ryen White / Ahmed Hassan Awadallah（复杂搜索任务）、Yi Zhang / Sujay Jauhar / Dan Roth（任务分解图）、Keisuke Sakaguchi / Yejin Choi（脚本生成）、Nathanael Chambers（叙事链与脚本）、以及 LLM prompting/规划相关的 Wei、Zhou 等。

**Q5. 论文中提到的解决方案之关键是什么？**  
步骤生成方面：以 PaLM 62B 的 In-Context Learning（ICL）为基础，再叠加 Multiple Sequences（多温度采样后去重合并）、Sample & Filter（训练打分器选最优序列）、Soft-Prompt Tuning，以及它们的组合。依赖边方面：将 LLM 线性顺序、ICL/ICL+CoT 两两判定、SPT 分类、以及 LLM Scoring（打乱顺序后按 LM 分数聚合）等转为 DAG（有环则弱化为可并行）。关键评估创新是用 Hungarian / Relaxed Hungarian 一对一（或一对二）匹配替代易被重复步骤刷高的 one-to-many 精确率/召回，并设计 In-Degree、Out-Degree、Step Proximity 边指标。

**Q6. 论文中的实验是如何设计的？**  
构建 TaskLAMA：1612 个复杂任务（来自 MSComplexTasks 与商业搜索引擎 “How To” 查询），人工标注假设/上下文、步骤与时序依赖（共 12118 步、11105 边）；按文本相似聚类后划分 train/val/test（965/169/478）以降低概念泄漏。对比启发式/查询基线（Repeat Task、Repeat Sim、Co-occur、Hierarchical）与多种 LLM 变体；另设有/无上下文对照；依赖实验在金标准节点与生成节点上分别评估。模型为 PaLM 62B（单次运行，成本限制）。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
定量评估主要使用作者构建的 TaskLAMA（任务图探针）。节点指标含 Rouge1/2/L（F1/F2）与 Hungarian / Relaxed Hungarian F1/F2；边指标含 In/Out-Degree 与 Step Proximity（Rouge），金标准图上另报 pairwise 准确率。论文给出完整数据集下载链接：`https://storage.googleapis.com/gresearch/tasklama/tasklama.zip`。训练/推理代码与模型权重是否开源，论文未提及。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
大体支持。ICL 相对最佳非 LLM 基线在不同指标上有约 15%–280% 相对提升，SPT/S&F 等再带来约 7%–37% 提升，且提供上下文在所有指标上更好，支持“LLM 擅长分解且可感知上下文”。依赖侧：金标准上 SPT 准确率 78.6% 远超 ICL（约 47–50%），但生成图上线性顺序已很强，两两预测仍不理想，支持“序列好、pairwise 依赖弱”的假设。局限包括：单次运行、仅 PaLM 62B、指标仍依赖句向量相似度而非蕴含，且任务粒度单一。

**Q9. 这篇论文到底有什么贡献？**  
（1）发布面向复杂真实任务的高质量 SCTD 探针 TaskLAMA；（2）提出更稳健的节点匹配指标与可复用的边评估指标；（3）系统比较非 LLM 基线与多种 LLM 分解/依赖方法；（4）实证表明 LLM 步骤分解强、两两时序依赖理解仍不足，并给出改进路径。整体把“任务图理解”纳入 LLM probing 议程。

**Q10. 下一步呢？有什么工作可以继续深入？**  
论文 Limitations 与 Conclusion 已指出：条件化任务图（步骤随中间结果分支）、多粒度生成与评估、用蕴含替代相似度做匹配、联合一次性生成节点与边、递归/Least-to-Most 式分解、以及改进 pairwise 时序依赖理解。也可扩展到更多模型家族、人机交互生产力评测，并与脚本生成（proScript）或网页综合分解（Zhang et al. 2021）方法融合。

---

### 《Learning to Decompose and Organize Complex Tasks》十问分析

**Authors:** Yi Zhang, Sujay Kumar Jauhar, Julia Kiseleva, Ryen W. White, Dan Roth  
**Venue/Year:** NAACL 2021 (Human Language Technologies)  
**Links:** [Anthology](https://aclanthology.org/2021.naacl-main.217/) · [PDF](https://aclanthology.org/2021.naacl-main.217.pdf)  
**Saved PDF:** `（本机调研缓存路径已省略）`

**Q1. 论文试图解决什么问题？**  
论文面向数字任务管理中用户被复杂任务压垮、产生行动瘫痪的问题，旨在自动将复杂任务分解并组织为带时序依赖的子任务图（dependency graph / complex task graph）。系统从网页上多篇异构 “how-to” 非结构化文本中诱导：节点为子任务，有向边为子任务间的时序依赖，从而生成可执行计划以降低认知负荷。

**Q2. 这是否是一个新的问题？**  
相对新颖。微生产力文献（Cheng et al. 2015; Teevan et al. 2016）已论证拆解复杂任务有益，但少有可扩展的自动化拆解与结构化方案。Hassan Awadallah et al. (2014) 研究复杂搜索任务理解，主要基于搜索日志做后续查询推荐，而非从网页非结构化文本端到端生成子任务依赖图。作者称这是首次尝试从非结构化文本自动、可扩展地分解并组织复杂任务。

**Q3. 这篇文章要验证一个什么科学假设？**  
假设复杂任务分解可建模为从图文网页集合中诱导图的问题；且子任务文本片段应满足 relevance（与复杂任务相关）、abstraction（概括文章展开内容）、consensus（跨多源出现更重要）。进一步假设：在 SOTA 文本生成器（BART）中注入多源编码、相关性感知交叉注意力与聚类编码，能显著提升子任务生成与依赖边预测质量。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
相关工作可归为：（1）任务管理与智能助手应用（Bellotti、White、Hassan Awadallah、Mukherjee 等：提醒、时长估计、完成检测、邮件待办抽取）；（2）微生产力与人工拆解效益（Kirsh；Cheng；Teevan）；（3）复杂搜索任务（Hassan Awadallah et al. 2014）；（4）多文档摘要 / 事件时间线 / 复杂问答等可受益的相邻任务。值得关注的研究者包括：Ryen W. White、Ahmed Hassan Awadallah（微软任务与搜索）、Jaime Teevan（微任务）、Dan Roth / Yi Zhang（结构化理解）、以及 WikiHow 摘要数据相关的 Koupaee & Wang。

**Q5. 论文中提到的解决方案之关键是什么？**  
端到端两阶段图诱导：（1）子任务节点生成——扩展 BART 为多源编码器（MSBART），加入 relevance-aware cross-attention（用句/文相对 “how to t” 查询的相关性调制注意力）与 cluster encoding（KMeans 聚类后类位置编码注入共识）；（2）依赖边推断——将子任务对的中间表示拼接后加线性层做二分类，同样可利用聚类编码。输入通过搜索 “how to {task}” 取 top-k 网页。完整模型记为 MSBART-F。

**Q6. 论文中的实验是如何设计的？**  
构建两类数据：WKH-R（WikiHow 扩展：用文章引用网页作多源，标题为复杂任务、小节标题为子任务；7832 任务，3916/1566/2350 划分）与 CTD / MSComplexTasks（众包标注 430 个复杂任务的子任务与依赖，215/86/129）。RQ1 评子任务生成：对比 T5、BART、MSBART、MSBART-R/C/F，指标 Rouge-1/2/L 与配对 BERTScore。RQ2 评依赖推断：对比 BART、MSBART、MSBART-F，报告准确率。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
定量数据集为 WKH-R 与 CTD（MSComplexTasks）。论文声明 MSComplexTasks 向研究社区免费发布：`https://github.com/microsoft/MSComplexTasks`；并给出资源页 `http://cogcomp.org/page/publication_view/939`。代码/模型实现细节是否完整开源，除数据集链接外论文未进一步明确列出训练代码仓库。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
支持较强。多源相对单源持续提升；relevance 与 consensus 各自再提升；MSBART-F 在几乎所有 Rouge/BERTScore 组合上最优（WKH-R 的 Rouge-1 为少数例外）。依赖准确率上 MSBART-F 达约 0.779，优于对比变体，回应 RQ2。批判点：CTD 仅 430 例较小；边预测用简单二分类而非结构化解码；依赖评估以准确率为主、未充分报告类别不平衡；且假设输入已是复杂任务，未做复杂/简单判别。

**Q9. 这篇论文到底有什么贡献？**  
（1）将复杂任务分解与组织形式化为从非结构化网页文本诱导依赖图的端到端问题；（2）发布含子任务与时序依赖的新数据集 MSComplexTasks，并构建无需额外人工标注的 WKH-R 多源设定；（3）提出注入 relevance / abstraction / consensus 的多源 BART 扩展，在子任务生成与依赖预测上显著优于 SOTA 生成基线；（4）对智能任务管理与相关 NLP 任务具有可扩展应用意义。

**Q10. 下一步呢？有什么工作可以继续深入？**  
作者提出：自动区分复杂与简单任务以支持递归分解；大幅扩充 CTD；对生成子任务做人评（连贯性与效用）；在真实用户场景中评测对生产力的影响。此外可改进边预测为结构化/全局推理、显式处理可选路径与条件依赖，并与后续 LLM 直接生成任务图方法对比。

---

### 《proScript: Partially Ordered Scripts Generation via Pre-trained Language Models》十问分析

**Authors:** Keisuke Sakaguchi, Chandra Bhagavatula, Ronan Le Bras, Niket Tandon, Peter Clark, Yejin Choi  
**Venue/Year:** EMNLP Findings 2021 (arXiv:2104.08251, April 2021)  
**Links:** [abs](https://arxiv.org/abs/2104.08251) · [pdf](https://arxiv.org/pdf/2104.08251.pdf)  
**Saved PDF:** `（本机调研缓存路径已省略）`

**Q1. 论文试图解决什么问题？**  
论文关注经典 Scripts（Schank & Abelson）：刻画日常场景中原型事件序列的结构化常识，有助于叙事理解、消歧与补全未陈述信息，但历史上难以编写或从文本抽取。目标是证明预训练语言模型经微调后，能针对广泛日常场景（如 bake a cake）生成不同粒度、允许偏序的高质量脚本（DAG），并定义可评估的边预测与整图生成任务以克服以往脚本收集瓶颈。

**Q2. 这是否是一个新的问题？**  
脚本知识本身不新，但“用生成式预训练 LM 直接生成偏序脚本图”在论文表述中为首次成功演示。先前路线包括叙事链诱导（Chambers & Jurafsky 等，多新闻域、事件抽象、narrative cloze 评测不足）与 paraphrased ESDs 众包（Regneri DeScript 仅约 40 脚本；Modi et al. 规模仍小）。故事生成相关但目标不同（需意外情节与心理描写，而非核心事件偏序）。相对新颖的是大规模偏序脚本数据 + 边预测/整图生成双任务 + DOT 序列化生成。

**Q3. 这篇文章要验证一个什么科学假设？**  
假设预训练 LM（尤其 T5）可被适配为：（i）在给定场景与无序事件时预测有效偏序边；（ii）仅给定场景时同时生成事件节点与偏序边。并假设端到端、利用全事件上下文的生成式结构预测优于两两分类再拼图；同时当前系统仍显著低于人类水平，脚本知识评测应针对整图而非 cloze。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
论文归为三类：（1）Script as narrative chain（Chambers & Jurafsky；Jans；Modi & Titov；Pichotta & Mooney；Rudinger；Granroth-Wilding & Clark；Weber 等）；（2）Script as paraphrase sets / 众包 ESD（Regneri；Modi；Wanzare DeScript）；（3）故事生成（Kiddon；Peng；Rashkin PlotMachines 等）。相邻还有 COMET 常识图谱、VirtualHome 家居任务等。值得关注：Nathanael Chambers、Manfred Pinkal / Ashutosh Modi / Michaela Regneri（脚本资源）、Yejin Choi / Peter Clark / Keisuke Sakaguchi（AI2 常识与脚本）、以及 Schank & Abelson（理论源头）。

**Q5. 论文中提到的解决方案之关键是什么？**  
数据：从 ROCStories、DeScript、VirtualHome 收集场景，众包 5–7 个核心事件（含时长）并标偏序 DAG，经双人排序一致性过滤（F1≥65），迭代取相邻事件作更细粒度场景，得到 proScript（6414 脚本）。任务：edge prediction 与 script generation。模型：边预测用 pairwise 分类基线（RoBERTa/T5）与端到端 proScriptedge-pred（T5 生成 DOT）；整图生成 proScriptgen（T5 生成事件+边 DOT），另有 WikiHow 序列迁移（transfer）与 gen→edge-pred 的 pipeline。评测用边 F1、Graph Edit Distance 与成对人工偏好。

**Q6. 论文中的实验是如何设计的？**  
数据划分 train/dev/test = 3252/1085/2077；test 含 in-domain（ROCStories）与 out-of-domain（DeScript、VirtualHome）。边预测对比 random、Pairwise（RoBERTa/T5）、不同数据量/规模的 T5 edge-pred，以及人类；并按 DAG 最大度分析难度。生成任务用 T5-11B 的 gen / transfer / pipe，在 500 个脚本上由众包修订后算平均 GED（及各类编辑操作计数），另对 150 对做三人多数投票的两两偏好比较；并做错误类型人工分析。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
定量评估使用作者众包的 proScript（6414 偏序脚本；约 31 万事件对；平均每场景 5.45 事件）。边预测报告 Precision/Recall/F1；生成报告 Graph Edit Distance 与 pairwise human judgment。附录给出超参、硬件与训练时长等可复现细节。论文正文/附录未提供公开代码或数据下载链接（论文未提及开源仓库）。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
支持：proScriptedge-pred（T5-11B-all）边预测 test F1=75.71，超过 pairwise T5（67.64），但仍低于人类（89.28）；生成 GED 约 4.97 vs 人类 2.98，说明 LM 可生成合理脚本但未达人类。高阶 DAG、OOD 更难，符合预期。transfer/pipeline 未稳定超过直接 gen，弱化了“WikiHow 迁移/两段式必更好”的隐含期望，但强化了“端到端已较强、主要瓶颈在边/排序”的结论。局限：DOT 线性化、排除替代事件、参与者/论元未建模、GED 成本均匀等。

**Q9. 这篇论文到底有什么贡献？**  
（1）发布远大于先前众包脚本库的偏序脚本数据集 proScript（含事件时长标注）；（2）定义互补的边预测与整图生成任务及整图向评估协议；（3）首次展示生成式预训练 LM 可成功用于偏序脚本生成（DOT + T5），并给出强基线与人类差距分析；（4）为故事生成、阅读理解、时间推理与高层规划等下游提供脚本知识资源与方向。

**Q10. 下一步呢？有什么工作可以继续深入？**  
缩小与人类在边预测与 GED 上的差距；显式建模参与者/论元与替代路径；利用已标注时长连接时间推理；改进偏序结构解码（而非纯 DOT 生成）；更强的跨域泛化；以及将脚本知识接入叙事理解、规划与对话系统。后续工作也可探索更大 LLM、工具增强或与任务管理场景（复杂待办分解）结合。

---

### 《Automated Detection of Typed Links in Issue Trackers》十问分析

**Authors:** Clara Marie Lüders, Tim Pietz, Walid Maalej (Universität Hamburg)  
**Venue/Year:** IEEE International Requirements Engineering Conference (RE) 2022; DOI: [10.1109/RE54965.2022.00010](https://doi.org/10.1109/RE54965.2022.00010)  
**arXiv:** [https://arxiv.org/abs/2206.07182](https://arxiv.org/abs/2206.07182) · PDF: `（本机调研缓存路径已省略）`  
**Journal expansion (related):** Clara Marie Lüders, Tim Pietz, Walid Maalej — *On understanding and predicting issue links*, *Requirements Engineering* (Springer), 2023 ([doi:10.1007/s00766-023-00406-x](https://doi.org/10.1007/s00766-023-00406-x)) — expands to 16 JIRA repos, reports binary link-existence F1≈0.95；以下十问以 RE 2022 会议论文为主。  
**Code:** https://github.com/RegenKordel/LYNX-TypedLinkDetection

**Q1. 论文试图解决什么问题？**  
Issue tracker（尤其是 JIRA）中，利益相关方用多种类型的链接（Relate、Block、Duplicate、Epic、Subtask 等）连接 issue，以支持导航、发布规划与知识结构。随着仓库规模增长，人工判断「两 issue 是否应链接、链接类型为何」变得困难且易错。本文要解决的是：能否仅用 issue 的标题与描述，自动预测一对 issue 之间是否存在链接及其具体类型（typed link prediction）。

**Q2. 这是否是一个新的问题？**  
不完全新，但是较新的组合。Duplicate 检测已有大量工作；Block、Requires/Refines、GitHub 链接模式等也有研究。作者指出：多数先前工作**孤立地**研究单一链接类型；对 JIRA 上**多种用户自定义链接类型的多类预测**，以及跨多仓库系统比较，当时仍较少。Nicholson 等在 Apache 子集上做过 typed link 标签恢复，但规模与模型选择不同。本文强调在 15 个异构 JIRA 仓库上端到端多类型预测。

**Q3. 这篇文章要验证一个什么科学假设？**  
隐含假设主要包括：（1）仅凭标题+描述的文本，现代 transformer（尤其 BERT）足以在多类设定下有效预测链接类型；（2）性能差异可由仓库属性（如 link coverage）与链接类型属性（文本长度、类型占比、文本相似度等）解释；（3）模型并非仅学文本相似度——否则 Epic/Subtask（文本相似度低）不应表现优异。对应 RQ1（预测效果）与 RQ2（性能差异原因）。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
论文将相关工作归为：（1）**敏捷/需求管理中的依赖与过载**（Fucci et al.、Franch et al.）；（2）**可追溯性（traceability）与 BERT**（Lin et al.）；（3）**Duplicate 检测**（Deshmukh、He、Rocha 等，多用 Lazar 的 Bugzilla 数据）；（4）**其他链接类型与链接用法**（Thompson 的工作分解关系、Li 的 GitHub 链接模式、Tomova 的链接类型用法、Cheng 的 Block、Deshpande 的 Requires/Refines）；（5）**typed link 预测**（作者先前 Beyond duplicates；Nicholson & Guo 的 Apache 链接标签研究）。值得关注的方向人物/团队包括：Walid Maalej / Lüders（issue mining）、Jin L.C. Guo / Nicholson（issue link labels）、Jane Cleland-Huang 等（BERT 可追溯性）、各类 duplicate bug report 研究者。

**Q5. 论文中提到的解决方案之关键是什么？**  
对每个仓库：将两 issue 的 title+description 拼接为 BERT（bert-base-uncased）输入，截断至 192 tokens（longest-first），用 [CLS] + dense 分类头预测链接类型（含随机采样的 non-link 类，数量取其他类均值）。训练 AdamW、5e-5、最多 30 epoch，按验证集 F1 选模型。初步对比中 BERT 优于 DistilBERT、Single/Dual-Channel（FastText/Word2Vec）及 TF-IDF+RF/SVM 基线。聚焦常见类型（Relate、Duplicate、Subtask、Depend、Epic、Clone、Incorporate、Cause、Block）；忽略方向；排除多类型多链、私有 issue、Mindville（样本过少）。

**Q6. 论文中的实验是如何设计的？**  
数据来自 Montgomery 等发布的公开 JIRA 仓库集（原 16 个，分析中排除 Mindville）。每仓库 80/20 分层划分，训练内再取 20% 验证（64/16/20）。主指标为**宏平均 F1**（并报加权 F1、按类型 F1、混淆矩阵）。RQ1：跨仓库比较 BERT 与基线；RQ2：Pearson 相关分析仓库属性（coverage、assignee-issue ratio 等）与链接对属性（余弦相似度、文本长度等）对 F1 的影响，并做混淆分析。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
数据集：15 个公开 JIRA 仓库（Apache、Hyperledger、IntelDAOS、JFrog、Jira、JiraEcosystem、MariaDB、Mojang、MongoDB、Qt、RedHat、Sakai、SecondLife、Sonatype、Spring），合计约 268 万 issues、88 万 links（Table I）。代码与分析脚本开源：https://github.com/RegenKordel/LYNX-TypedLinkDetection。底层数据引用 Montgomery, Lüders, Maalej 的 public JIRA repositories 数据集（MSR 2022）。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
大体支持，但有边界。平均宏 F1=0.64、加权 F1=0.73，远高于 RF/SVM 基线（约 0.27），Epic≈0.97、Subtask≈0.89、Non-link 多数仓库表现好，支持「BERT+标题描述可行」。文本长度与 F1 显著负相关（约 −0.70）、Epic/Subtask 低相似度却高 F1，支持「不只学相似度」。Relate 常被混淆、Cause 最弱、小样本类型差，说明数据质量/异构性限制性能；coverage 与 F1 强相关但多数其他相关不显著（n=15 统计力有限）。随机 non-link 构造与忽略链接方向可能影响外部效度。期刊扩展中「仅存在性」F1≈0.95 进一步说明类型判别难于存在性判别。

**Q9. 这篇论文到底有什么贡献？**  
（1）在 15 个真实异构 JIRA 仓库上，系统评估端到端多类型链接预测，给出可复现 BERT 基线与开源代码；（2）按链接类型与仓库揭示性能格局（层次型链接易、Relate/Cause 难）及混淆模式；（3）用相关分析连接 coverage、assignee 负荷、文本长度等与预测效果，讨论实践部署策略（先存在性再分型、类别分组、top-k）。对需求工程与 issue mining 社区，把问题从「找 duplicate」推到「多类型链接」。

**Q10. 下一步呢？有什么工作可以继续深入？**  
论文已指出：提升 issue/link 质量；按项目或项目簇而非整仓训练以降低异构性；两阶段（存在性→类型）或排除 Relate 噪声；用户研究理解链接类型选择动机；扩展到 Bugzilla/GitHub；处理 orphan/loner；追踪时间演化。可继续深入：跨仓库迁移/多任务学习、利用评论与结构化字段（需防标签泄漏）、方向性与多标签、与发布规划/一致性检查工具链（如 OpenReq / 同批工业依赖管理论文）结合、以及期刊版对 16 仓与存在性任务的更细分析。

---

### 《Improved management of issue dependencies in issue trackers of large collaborative projects》十问分析

**Authors:** Mikko Raatikainen, Quim Motger, Clara Marie Lüders, Xavier Franch, Lalli Myllyaho, Elina Kettunen, Jordi Marco, Juha Tiihonen, Mikko Halonen, Tomi Männistö（University of Helsinki；UPC；Universität Hamburg；The Qt Company）  
**Venue/Year:** *IEEE Transactions on Software Engineering* (TSE), 2022（稿面 DOI: 10.1109/TSE.2022.321216；arXiv v2: 2022-11-15）  
**arXiv:** [https://arxiv.org/abs/2102.08485](https://arxiv.org/abs/2102.08485) · PDF: `（本机调研缓存路径已省略）`  
**Artifact notes:** Jira plugin + microservices（OpenReq 生态）；访谈问题等材料见文中 GitHub 链接

**Q1. 论文试图解决什么问题？**  
大型协作项目中，issue tracker（以 The Qt Company 的 Jira 为例，近二十年、10 万+ issues）天然以**单个 issue 生命周期**为中心，而对 issue 之间构成的**依赖网络**缺乏整体视图与智能支持。用户难以浏览大网络、常漏报依赖与 duplicate、发布版本与优先级在依赖约束下不一致。目标是：设计并实现可落地的依赖管理增强方案，改善依赖网络的理解、补全与一致性。

**Q2. 这是否是一个新的问题？**  
问题本身不新——依赖管理、duplicate 检测、发布规划在 RE/SE 中长期存在。新颖之处在于：在**真实超大规模工业/开源混合 Jira**上，用 Design Science 把「依赖作为一等公民的 issue graph + 可扩展检测 + 一致性诊断 + 插件化系统」做成一体化、可部署制品，并强调实用可扩展性与数据固有不完备性，而非仅证明某算法在小样本上的 F1。

**Q3. 这篇文章要验证一个什么科学假设？**  
作为 Design Science，核心知识主张是：将 issues 与 dependencies 分离建模为 issue graph，并辅以（相对简单但互补的）引用检测、TF-IDF duplicate 检测、上下文排序、以及基于约束的一致性检查/诊断，**能够在大型真实 Jira 中以可接受性能提供对用户有价值的依赖管理支持**。对应 RQ1（痛点）→ RQ2（应加何特征）→ RQ3（如何集成才有用）。假设还包括：不必追求完全自动决策，而应提供可解释、可拒绝的辅助。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
背景与相关工作归类为：（1）issue tracker 特征比较（Karre et al.）与开源上下文挑战（Bertram、Baysal、Heck & Zaidman）；（2）需求互依与发布规划综述（Dahlstedt & Persson、Svahnberg、Ameller、Ruhe & Saliu）；（3）可追溯/依赖 IR 映射（Borg et al.）；（4）duplicate 检测理论与插件（Ellmann、Find Duplicates 等）；（5）配置/诊断理论（Reiter、Felfernig FastDiag）；（6）可视化插件（swarmOS Analyzer、Vivid Trace）。利益相关人物/团队：Xavier Franch / OpenReq 项目、Tomi Männistö、Walid Maalej 圈（含 Lüders）、发布规划与需求依赖社区。

**Q5. 论文中提到的解决方案之关键是什么？**  
（1）**Issue graph**：issues 为节点、类型化有向（成对双向）依赖为边；以焦点 issue 为中心定义 p-depth 子图。（2）**缺失依赖检测**：ReferenceDetection——在标题/描述/评论中用正则找 `PROJECT-123` 式引用；（3）**DuplicateDetection**——预处理 + TF-IDF + 余弦相似度，过滤阈值，再聚类用传递性压缩提案；（4）**Contextualization**——合并提案、过滤已存在/已拒绝、按图距离与属性因子重打分排序；（5）**一致性检查与诊断**——对 parent-child / requires 等规则检查发布与优先级，不一致时用 FastDiag + Choco 求解器给出 issue 或依赖侧诊断。（6）**架构**：Jira 插件 Fisutankki + 集成服务 Milla + 检测/模型微服务（Nikke、ORSI、Mulperi、KeljuCaaS 等），数据投影与批处理分离以保证安全与性能。

**Q6. 论文中的实验是如何设计的？**  
Design Science 迭代：访谈提炼痛点 → 目标与技术 → 制品实现 → 验证+确认。验证（Qt 公开快照 2019-11-29，约 119,920 issues、29,582 依赖）：图拓扑统计；检测器在 QT/DS1/DS2 上的提案量，以及 CV 集（约 2936 对）10 折交叉验证的 accuracy/precision/recall/F；一致性在单依赖与各深度 p-graph 上统计，诊断设 5 秒时限；性能测批处理与查询时延。确认：5 名未参与设计的 TQC Jira 用户（发布经理、架构师、产品经理、开发者）半结构化访谈与现场演示。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
主数据：TQC Jira 公开项目快照（Qt Framework、Creator、3D Studio 等，Table 3）；另有 Duplicate set #1/#2、Cross-validation set、Deps 子集、Large/Sizeable issue graphs、Update 小项目。论文声明访谈材料等在 GitHub（文中 ESE-UH 链接）；系统为研究原型，文末称**尚未在 TQC 生产环境长期运维**。完整可复现工业部署包是否开源，论文未给出单一完整公开仓库声明——部分 OpenReq 组件有公开痕迹，但「全文算法+Qt 私有部分」需谨慎视为未完整开源。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
功能与性能证据较强：引用检测精确率约 100%、召回约 53%、F≈70%；duplicate 检测 Acc≈92%、F≈91%（CV）；并集可覆盖大量潜在依赖；查询多数 <5s；用户访谈肯定图可视化（深度 2–4 最有用）、duplicate 提案与一致性检查的价值。但：CV 主要针对 duplicate 标签，引用检测并非专为 duplicate 设计；提案量大意味假阳性需靠上下文过滤；深度≥4 诊断常超时；仅 5 人访谈且非长期日常嵌入；单案例（TQC）外部效度有限。整体支持「实用辅助可行」，不支持「可完全自动、全网一致」。

**Q9. 这篇论文到底有什么贡献？**  
（1）系统刻画大型协作 Jira 中依赖管理的四类痛点；（2）提出依赖一等公民的 issue graph 形式化及 p-depth 上下文；（3）给出可扩展的检测+诊断技术栈与微服务/插件参考架构；（4）在真实 10 万+ issue 规模上做功能、性能与用户验证，强调 holism（多简单技术+上下文）优于单复杂算法。对工业 RE 工具化有直接参考价值。

**Q10. 下一步呢？有什么工作可以继续深入？**  
论文展望：更高效的诊断算法与替代诊断；冗余依赖等其他分析；拒绝决策的上下文修订；检测可解释性；与仪表盘深度集成；在更小/更大/更不成熟组织验证；改进可视化（层级、发布视角）。可深入：用 BERT typed-link 替换/增强 TF-IDF（需解决延迟与训练数据）；跨项目版本号语义对齐；主动学习降低假阳性；生产级运维与纵向现场实验。

---

### 《Unsupervised Task Graph Generation from Instructional Video Transcripts》十问分析

**Authors:** Lajanugen Logeswaran, Sungryull Sohn, Yunseok Jang（实习于 LG AI Research）, Moontae Lee, Honglak Lee（LG AI Research；University of Michigan）  
**Venue/Year:** arXiv preprint（v1 2023-02；v2 2023-05-02）；论文正文未标明已录用会议/期刊  
**arXiv:** [https://arxiv.org/abs/2302.09173](https://arxiv.org/abs/2302.09173) · PDF: `（本机调研缓存路径已省略）`  
**Code:** 论文正文未提供开源仓库链接（未提及）  
**Anthology:** [Findings ACL 2023](https://aclanthology.org/2023.findings-acl.210/)

**Q1. 论文试图解决什么问题？**  
真实任务由多个关键步骤及前置依赖构成（如 CPR 前先检查安全）。网上信息多为嘈杂、非结构化的教学视频 ASR 转录。本文要在**无监督**设定下，从同一任务的多段转录文本中：（i）识别关键步骤（key steps）；（ii）生成表示前置条件关系的有向**任务图（task graph）**（可含 AND 节点）。

**Q2. 这是否是一个新的问题？**  
脚本理解（script understanding）、流程/偏序脚本生成、从教学视频学步骤等已有传统。本文相对新颖的设定是：以**多份嘈杂 ASR 转录**为输入，用指令微调 LLM 做信息抽取，再经聚类、重标注、排序与 ILP 图推断，**零样本/无监督**生成任务图，并与监督微调的 Proscript 等对比。不同于仅生成线性步骤序列或依赖人工标注脚本微调。

**Q3. 这篇文章要验证一个什么科学假设？**  
假设：预训练指令模型 + 多转录聚合足以鲁棒提取关键步骤与顺序统计；结合序列重叠合并近义簇、LM 似然排序过滤、以及既有 ILP 前置条件推断，可生成比「直接 ASR/动词短语标注」及监督 Proscript 更准确的任务图。多转录中「y 常跟在 x 后 ⇒ x 可能是 y 的前置」是统计归纳假设。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
归类：（1）经典脚本/事件链（Schank & Abelson、Chambers & Jurafsky、Regneri、Modi & Titov、Pichotta & Mooney）；（2）现代脚本/流程生成（Lyu、Sancheti、Sun、Pal、Sakaguchi 的 proScript）；（3）具身/子目标规划（Logeswaran、Huang）；（4）教学视频步骤发现（Alayrac、Elhamifar ProceL、Zhukov CrossTask、Shen）；（5）子任务图/ILP（Sohn et al. ICLR’20；Jang et al. 2023 multimodal subtask graph）。关注研究者：Honglak Lee 组、Sakaguchi（proScript）、Elhamifar（程序学习）、Alayrac/Laptev/Sivic（教学视频）。

**Q5. 论文中提到的解决方案之关键是什么？**  
五段流水线（Figure 2）：（1）InstructGPT Davinci 将每段转录总结为短步骤列表；（2）MiniLMv2 句向量，余弦≥0.9 最大团聚类（簇>5），再用**序列重叠**合并同义步骤簇得 key steps；（3）贪心重标注（Algorithm 1）把摘要步骤映射为 key step 序列；（4）用 GPT2-XL 的 log p(h|prompt) 排序，保留 top 75%；（5）用 Sohn/Jang 的 ILP 从序列学前置条件（DNF/AND-OR 图）。全程不使用数据集的 key step / 序列标注进行训练。

**Q6. 论文中的实验是如何设计的？**  
数据：ProceL 与 CrossTask 各 5 个任务（API 成本限制），每任务 60 个视频转录，转录平均约 565 tokens；任务平均关键步骤约 13（ProceL）与 7（CrossTask）。设定一：已知 ground-truth K，评估流水线（跳过聚类）的图预测 accuracy（相对 Jang et al. 2023 人工图）；设定二：全流水线自动发现 K，做定性图对比。基线：Proscript；ASR / ASR-VP / ASR-GPT 标注再构图；+Rank；以及用 GT 序列构图的上界。另有附录消融。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
定量：ProceL（Elhamifar & Naing, ICCV 2019）与 CrossTask（Zhukov et al., CVPR 2019）；图标注参考 Jang et al. 2023。指标为图预测 Accuracy（预测与 GT 前置在 eligibility 上的一致率）。**代码：论文未提及开源**；依赖 OpenAI InstructGPT API 与开源 GPT2-XL / SentenceTransformers。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
在「已知 key steps」设定下支持较强：完整方法 ProceL 平均 Acc 72.1、CrossTask 68.4，超过 Proscript（53.9 / 64.6）及无 GPT/无排序变体；接近 GT 序列构图上界（83.8 / 75.7）。GPT 摘要与 ranking 的增益在表中清晰。但：仅 10 个任务；全自动发现 key steps 主要靠定性（粒度有时过粗/过细，如 PBJ 合并涂果酱步骤、错误强加花生酱→果酱顺序）；API 成本限制规模；GT 标注本身有噪声（尤其 CrossTask）。对「完全无监督端到端图质量」的量化支持弱于「已知 K」设定。

**Q9. 这篇论文到底有什么贡献？**  
（1）提出面向教学视频转录的无监督任务图生成流水线，组合 LLM 摘要、聚类、重标注、LM 排序与 ILP；（2）展示在 ProceL/CrossTask 子集上优于监督 Proscript 与若干无监督变体；（3）提供排序/过滤机制与组件消融思路。连接「脚本理解」与「视频步骤发现」，强调多描述聚合。

**Q10. 下一步呢？有什么工作可以继续深入？**  
作者自述：用开源大模型降低 API 成本；加强摘要与聚类等组件间互反馈。可继续：全自动设定的自动图匹配指标与更大规模任务；多模态（视觉+ASR）；改进独立步骤的偏序（避免虚假全序）；与具身 agent 规划闭环评测；更稳健的同义步骤合并；公开可复现代码与本地 LLM 配方。

---

### 《DART-LLM: Dependency-Aware Multi-Robot Task Decomposition and Execution using Large Language Models》十问分析

**Authors:** Yongdong Wang, Runze Xiao, Jun Younes Louhi Kasahara, Ryosuke Yajima, Keiji Nagatani, Atsushi Yamashita, Hajime Asama  
**Venue/Year:** arXiv:2411.09022v2 (2025-03-04); comments note first submitted to an IEEE conference on 2024-09-15 (venue acceptance not stated in PDF)  
**Links:** [abs](https://arxiv.org/abs/2411.09022) · [pdf](https://arxiv.org/pdf/2411.09022.pdf) · [project](https://wyd0817.github.io/project-dart-llm/)  
**Saved PDF:** `（本机调研缓存路径已省略）`

**Q1. 论文试图解决什么问题？**  
多机器人场景下，如何把自然语言高层指令分解为可协调执行的子任务，并显式处理子任务依赖，同时支持移动机器人端到端实时执行。作者指出既有 LLM 机器人工作多集中于单机器人；多机器人方面如 RoCo 面向固定机械臂、SMART-LLM 未显式建模复杂依赖且需手动执行生成的 Python，因而缺乏“依赖感知 + 实时执行”的一体方案。

**Q2. 这是否是一个新的问题？**  
不完全是新问题——多机器人任务规划与 LLM 驱动机器人规划均有先例（SayCan、Inner Monologue、RoCo、SMART-LLM 等）。相对新颖的组合是：用 DAG 显式建模子任务依赖，面向移动施工机器人做端到端实时执行（QA-LLM 分解 → Breakdown → Actuation + VLM 感知），并配套带严格执行顺序约束的施工场景基准。

**Q3. 这篇文章要验证一个什么科学假设？**  
核心假设是：显式用 DAG 表示子任务依赖，能显著提升 LLM（尤其是小模型）在复杂多机器人任务上的分解与执行成功率，并优于仅依赖模型内禀推理、不显式建模依赖的方法（如 SMART-LLM）。其次假设：结构化 JSON 指令格式可改善响应时间可靠性（RTR），使较小模型在资源受限平台上仍具部署价值。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
表 I 将相关工作分为：序列/决策式机器人策略（Decision Transformer、Gato）、语言落地与规划（SayCan、Inner Monologue）、VLA/代码策略（RT-1/2、PaLM-E、Code as Policies、VoxPoser）、以及多机器人 LLM 协作（RoCo、SMART-LLM）。值得关注者包括：Ahn/Brohan（SayCan、RT）、Huang/Liang（Inner Monologue、Code as Policies、VoxPoser）、Zhao et al.（RoCo）、Kannan et al.（SMART-LLM），以及施工协作机器人方向的 Nagatani/Asama 等。

**Q5. 论文中提到的解决方案之关键是什么？**  
DART-LLM 四模块流水线：（1）QA-LLM 将指令 I 与环境 E 分解为带依赖的子任务集合，输出结构化 JSON 并构成 DAG \(G=(T,D)\)；（2）Breakdown Function Parser/Handler 解析函数名、参数与依赖，并按技能库 \(\Delta\) 做机器人分配；（3）Actuation 通过 ROS Navigation 与机器人原子技能（挖掘、装载等）异步执行，仅当依赖满足时调度；（4）VLM（CLIP 等）周期更新物体地图。关键是显式依赖边 + 结构化输出，而非直接生成可执行 Python。

**Q6. 论文中的实验是如何设计的？**  
构建 102 条高层施工指令基准（L1=47 单机、L2=33 多机有序协作、L3=22 严格相互依赖；测试集未见，few-shot 仅作提示）。对比 DART-LLM 接多种底座（Llama-3.1-8B、GPT-3.5/4o、Claude-3.5-Haiku、DeepSeek-r1-671B）与 SMART-LLM（Llama3.1 / DeepSeek-r1）。指标：SR、IPA、DSR、SGSR、RTR。另做 L3 上“有/无 DAG 依赖”消融，并在真机（Yanmar C30R ×2 + Hitachi ZX120）部署 L2-T1-001。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
定量数据集为作者自建的 102 指令施工机器人基准（三复杂度），项目页 `project-dart-llm` 提供数据与视频。代码：摘要与项目页声明开源（`https://wyd0817.github.io/project-dart-llm/`）；社区亦有分解模块仓库可对照。论文未给出独立数据集 DOI，但明确可从项目网站获取。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
大体支持。L1 上各方 SR/IPA/DSR/SGSR 均为 1.00，差异主要在 RTR（DART+Llama3.1 达 0.96）。L2/L3 上 DART 显著优于 SMART-LLM（如 L3：DeepSeek-r1 的 SR 0.94 vs SMART 0.65；Llama3.1 的 SR 0.84 vs 0.24）。消融显示去掉 DAG 后所有模型 SR 下降，小模型跌幅最大（Llama3.1 约 0.84→0.45），支持“显式依赖补偿弱推理”。批判点：基准规模与领域偏窄（施工双机+单挖机）、SMART-LLM 复现细节有限、RTR 定义偏工程、真机展示偏定性。

**Q9. 这篇论文到底有什么贡献？**  
（1）提出 DAG 依赖感知的多机器人任务分解机制；（2）给出含 QA-LLM、Breakdown、Actuation、VLM 的端到端实时执行框架；（3）发布 102 指令三难度施工基准；（4）实证显式依赖与结构化 JSON 可提升成功率并改善小模型可部署性。整体把“依赖感知分解”接到可运行的多移动机器人系统。

**Q10. 下一步呢？有什么工作可以继续深入？**  
作者提出：扩展到更大机器人团队；优化模型规模与性能折中以适应多样化部署。可继续的方向包括：更通用非施工任务与公开可比基准、失败恢复与在线重规划、与符号验证器结合保证依赖安全、以及更严格的 SMART-LLM 等基线对照与统计显著性分析。

---

### 《Recursive Decomposition with Dependencies for Generic Divide-and-Conquer Reasoning》十问分析

**Authors:** Sergio Hernández-Gutiérrez, Minttu Alakuijala, Alexander V. Nikitin, Pekka Marttinen (Aalto University)  
**Venue/Year:** NeurIPS 2024 Workshop on System-2 Reasoning at Scale (arXiv:2505.02576, 2025-05-05)  
**Links:** [abs](https://arxiv.org/abs/2505.02576) · [pdf](https://arxiv.org/pdf/2505.02576.pdf)  
**Saved PDF:** `（本机调研缓存路径已省略）`

**Q1. 论文试图解决什么问题？**  
LLM 在复杂推理上仍难扩展：CoT/LtM 等多为单链、难并行，分解时常要求任务专用示例或预定义策略，且生成 token 随难度近似二次增长、性能随复杂度快速衰减。RDD 旨在提供可扩展的分治框架：递归分解、支持子任务依赖（形成 DAG）、更少监督，并在计算匹配设定下提升准确率与效率。

**Q2. 这是否是一个新的问题？**  
“用分解提升 LLM 推理”并非新问题（CoT、LtM、ToT、DecomP、GoT、Zhang et al. 2024 树状递归分解等）。论文声称的缺口是：既要支持子任务间依赖（非仅完全可分分解），又要在无任务专用指导时仍可泛化，并改善时间/上下文开销。相对新颖的是把依赖建模嵌入递归分治，使结构由树扩展为 DAG，并强调任务无关的 split/solve/merge。

**Q3. 这篇文章要验证一个什么科学假设？**  
文中明确四条假设：（H1）计算匹配下 RDD 在复杂推理上优于 SOTA；（H2）无任务专用数据时递归分解仍能增强推理；（H3）相对逐步提示，RDD 缩短求解时间；（H4）降低每次生成平均 token、减轻上下文压力。另在方法论中假设存在难度转移点 \(n^*\)：超过该点后 \(\phi_{\mathrm{RDD}}\ge\phi_u\)。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
§4 归为三类：（1）推理图表达力——链状（CoT、LtM、Plan-and-Solve、PAL、Parsel 等）、树状采样（ToT）、树状递归但无依赖（Zhang et al. 2024）、用户指定 DAG（GoT）、工具隐式 DAG（DecomP）；（2）通用适用性与示范需求；（3）并行解码（Skeleton-of-Thought）。值得关注：Wei / Wang / Zhou（CoT、SC、LtM）、Yao（ToT）、Khot（DecomP）、Besta（GoT）、Ning（SoT）等。

**Q5. 论文中提到的解决方案之关键是什么？**  
三步递归：Decompose（产出子问题或声明 unit）、Unit-solve（直接/CoT/LtM/工具）、Merge（合并子解直至根）。模型为子问题赋 ID（如 P-1），并可用 `{P-1}` 交叉引用，从而形成依赖边与 DAG；调度器按依赖拓扑执行，独立子问题可并行。合并提示含纠错语句以支持 error recovery。整体仅靠 in-context 元任务，不要求每类问题的用户定制图结构。

**Q6. 论文中的实验是如何设计的？**  
底座：指令微调 Llama 3 70B。基线：CoT+SC、LtM+SC（SC 用模型投票，含贪心+温度采样）。任务：（1）字母拼接（可独立分解）；（2）长度反转（需依赖）。各 6 档难度，每档 100 例，exact match。设定：任务专用 5-shot，以及排除目标类的 generic few-shot（分解 7–8 shot）。并做误差分解（\(\phi_d,\phi_u,\phi_m,\phi_{\mathrm{RDD}}\)）、资源/时间与上下文 token 统计（App. E）。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
评估使用作者构造的 letter concatenation 与 length reversal 合成基准（各六难度），非外部标准数据集名。指标为 exact match，辅以时间与 token 统计。论文未提供公开代码或数据仓库链接；附录给出提示与资源统计。代码是否开源：论文未提及。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
对高难度区间支持较强：任务专用与 generic 设定下，超过转移点后 RDD 相对 CoT/LtM+SC 准确率更高，并报告更低墙钟时间与更短平均上下文。误差分析显示合并可恢复部分子解错误。批判点：仅两类合成符号任务、单模型家族；“计算匹配”依赖 SC 多样本，与真实部署预算未必等价；低难度区间 CoT 仍可更优（作者 Limitations 已承认）；自然学科难分解问题未覆盖。

**Q9. 这篇论文到底有什么贡献？**  
（1）提出支持依赖的递归分治方法 RDD；（2）在有/无任务专用示范两种设定下实证有效；（3）分别在可独立分解与需依赖建模的任务上评估；（4）分析误差来源、纠错与时空效率，并刻画性能转移点。为通用智能系统接入分治推理提供了低集成门槛的提示框架。

**Q10. 下一步呢？有什么工作可以继续深入？**  
作者建议：改进 unit-problem 分类器、量化并行实现加速、改进分解策略。还可扩展到数学/代码/多跳 QA 等真实基准、与工具调用更深结合、系统研究依赖标注错误率，以及在更小/开源模型上的可迁移性。

---

### 《Automating the Detection of Requirement Dependencies Using Large Language Models》十问分析

**Authors:** Ikram Darif, Feifei Niu, Manel Abdellatif, Lionel C. Briand, Ramesh S, Arun Adiththan (uOttawa / ÉTS / Lero / General Motors)  
**Venue/Year:** arXiv:2602.22456v2 (2026-08-14); cs.SE（PDF 未标明已录用会议/期刊名）  
**Links:** [abs](https://arxiv.org/abs/2602.22456) · [pdf](https://arxiv.org/pdf/2602.22456.pdf)  
**Saved PDF:** `（本机调研缓存路径已省略）`  
**Status:** Available (PDF fetched successfully). 文中方法简称 **LEREDD**。

**Q1. 论文试图解决什么问题？**  
软件需求之间存在多种依赖（Requires、Implements、Conflicts、Details、Is similar 等），识别它们对变更影响分析、一致性与测试至关重要，但 NL 需求规模大、歧义多、人工检测昂贵且易漏。现有检索/本体/ML 方法各有局限；LLM 在 RE 中已用于抽取与分类，但在需求依赖检测上仍欠探索。论文提出 LEREDD，自动对 NL 需求对判定依赖类型（或无依赖）。

**Q2. 这是否是一个新的问题？**  
需求依赖检测本身不新（OpenReq-DD、TF-IDF+LSA、细调 BERT、CiRA 因果检测、ALICE 矛盾检测等）。相对新颖之处是：系统研究 few-shot ICL + RAG 于多类型直接依赖检测，覆盖五种类型与 No dependency，并同时评估 intra-system 与 inter-system 示例迁移，同时贡献新标注语料。作者称其为“首次将 few-shot 与 RAG 用于需求依赖检测”的探索。

**Q3. 这篇文章要验证一个什么科学假设？**  
通过五条 RQ 体现：SOTA LLM 零样本可做依赖检测且模型间有差异；存在可优化的 few-shot/RAG 配置；高级提示相对零样本可提升性能；在同系统与跨系统设定下，LEREDD（GPT-5.4 + 动态示例 ± RAG）优于 TF-IDF&LSA 与细调 BERT，尤其对少数类具体依赖类型与占多数的 No dependency 过滤有价值。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
§II 四类：（1）信息检索（Sarwosri、Ogawa、Li、Samer TF-IDF+LSA、Guan）；（2）知识/图/本体（Priyadi、Asyrofi、Guo、Schlutter、OpenReq-DD、Deshpande）；（3）ML/DL（Gräßler BERT、Fischbach CiRA、Deshpande、Atas、Guan 主动学习）；（4）LLM（Gärtner ALICE、Almoqren、Niu TVR 追溯）。值得关注：Franch/Motger（依赖分类与 OpenReq）、Deshpande/Ruhe（数据驱动依赖）、Vogelsang/Fischbach（因果）、Briand（工业 RE 实证）等。

**Q5. 论文中提到的解决方案之关键是什么？**  
LEREDD：对目标需求对用 SBERT 嵌入 + 欧氏距离 + 平均聚合，为每类依赖（含 No dependency）动态检索 top-6 相似示例（ICL）；跨系统时再用 RAG 从 SRS 取 6 个约 1000 字符块作领域上下文；GPT-5.4 输出 Dependency_Type、Rationale、Confidence（0–5），并可对低置信度重标为 No_dependency。同系统时发现仅 few-shot 已够、RAG 无额外收益；跨系统时 RAG 有帮助。

**Q6. 论文中的实验是如何设计的？**  
数据：密歇根州立大学 RE 课程工业合作 SRS——ADB、TJA、APA 三系统，人工标注 813 对（κ=0.43 后共识）；ADB 100 对做配置试点，其余与 TJA/APA 顶相似 200 对用于评测。RQ1 零样本比较 GPT-5.4、Llama 3.1、Gemma 12B、Mistral-nemo。RQ2 网格搜索 few-shot/RAG 超参。RQ3–5 比较提示策略，并在 intra/inter 设定下对比 TF-IDF&LSA（Samer et al.）与细调 BERT（Gräßler 配置扩展）。报告 Accuracy/P/R/F1，温度 0.2，多次运行。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
定量数据为作者标注的 813 需求对（ADB/TJA/APA；No dependency 约 72%+，Requires 最常见依赖类）。论文声明 annotated corpus 与 replication package（源码、配置、数据）将在发表后提供；正文未给出已公开的 GitHub/Zenodo URL。因此：数据集承诺开源，但截至该 PDF 版本“将于发表后可用”。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
支持方向明确：零样本 GPT-5.4 平均 F1≈0.78 优于开源模型，但对稀有类型仍弱（具体类型平均 F1≈0.29）；最优 few-shot（SBERT+Euclidean+avg+6-shot+阈值重标）显著提升；相对两基线，文称 Requires 等类型有大幅相对 F1 增益（intra 约 131%/35%，inter 约 67%/280%），No dependency 平均 F1≈93%，跨系统整体 F1 仅降约 2.27%。批判点：汽车领域三份学生/课程 SRS、类别严重不平衡、κ 仅中等、基线未含其他 LLM 依赖方法、GPT-5.4 版本可复现性依赖专有 API、replication 尚未挂出。

**Q9. 这篇论文到底有什么贡献？**  
（1）提出 LEREDD（动态 ICL ± RAG）自动检测多类型 NL 需求依赖；（2）系统消融 LLM 选择与提示/检索配置；（3）在 intra/inter-system 上相对 IR 与 BERT 基线展示优势，尤其利好 No dependency 过滤与少数依赖类；（4）贡献 813 对标注语料以缓解公开数据稀缺。连接工业合作方（GM）动机与 RE 实践。

**Q10. 下一步呢？有什么工作可以继续深入？**  
作者列出：在真实工业数据集上评估泛化；扩展到间接/隐式依赖；研究预测依赖如何支撑需求演化中的影响分析；并评估更多专有 LLM。还可改进低资源类型、公开即时 replication、与 ALICE/追溯类 LLM 方法直接对比，以及将依赖图接入变更管理系统。

---

### 《ChatHTN: Interleaving Approximate (LLM) and Symbolic HTN Planning》十问分析

**Authors:** Héctor Muñoz-Avila (American University), David W. Aha (NRL), Paola Rizzo (Interagens s.r.l.)  
**Venue/Year:** 2nd International Conference on Neuro-symbolic Systems (NeuS) 2025; PMLR 288:1–13, 2025  
**Links:** [abs](https://arxiv.org/abs/2505.11814) · [pdf](https://arxiv.org/pdf/2505.11814.pdf)  
**Saved PDF:** `（本机调研缓存路径已省略）`

**Q1. 论文试图解决什么问题？**  
HTN 规划强在层次分解与可解释性，但要求知识库对每种可分解情形都有完整 method，面临知识工程瓶颈；LLM（如 ChatGPT）擅长生成似然计划近似，却不能保证 sound，甚至可能对无解问题“编造”解。ChatHTN 试图交错二者：符号 HTN 负责主体分解与正确性，遇缺失 method 时查询 LLM 补局部分解，并仍保证最终计划满足任务语义。

**Q2. 这是否是一个新的问题？**  
HTN、LLM 规划局限、以及神经符号规划结合均有大量先例。相对新颖的是：在标准 HTN（类 SHOP/PyHop）循环中，仅在 method 缺失时调用 ChatGPT 生成到原语任务的分解，并通过 verifier tasks 证明 sound；目标是放宽“必须事先完备知识库”，同时避免纯 LLM 规划的不可靠性。与 teleoreactive 用一阶规划填洞再学习 method 的思路相近但用 LLM 近似填洞。

**Q3. 这篇文章要验证一个什么科学假设？**  
假设：即使 LLM 分解是近似且非确定的，只要在每次分解后插入检查任务效应的 verifier primitive，ChatHTN 产生的任何非空计划都 sound（任务效应被满足）；且在 method 部分缺失甚至全无时，仍常能靠 LLM 补全求出解，而在真正无解时不会输出错误“成功”计划。经验部分旨在演示该理论性质而非比拼覆盖率 SOTA。

**Q4. 有哪些相关研究？如何归类？谁是这一课题在领域内值得关注的研究员？**  
§7 归为：HTN 学习（Zhuo、Langley、Hogg、teleoreactive Li et al.）；LLM 与规划（Valmeekam 等证明 LLM 不能可靠生成/验证计划）；LLM 生成层次结构 + 时序逻辑执行（Luo et al.）；层次规划中 LLM 用法综述（Puerta-Merino et al.）；NL 问题落地到层次任务（Ding et al.）。值得关注：Nau（SHOP）、Muñoz-Avila/Hogg（HTN 学习与语义）、Valmeekam/Kambhampati（LLM 规划批判）、Aha（神经符号/认知架构应用）等。

**Q5. 论文中提到的解决方案之关键是什么？**  
算法基于 PyHop 式 chatSeekPlan：有适用 method 则按 HTN 分解；否则 ChatGPTQuery（提供任务语义、状态、部分知识库）生成原语任务序列。关键正确性机制：为每个复合任务定义 verifier——无效应、前置条件=该任务效应的原语；无论 method 或 LLM 分解，均在子任务后插入 verifier，不满足则回溯失败。另跟踪 (state, task) 防 LLM 引入的无限环。任务带 (preconditions, effects) 语义以便提示 LLM。

**Q6. 论文中的实验是如何设计的？**  
三领域：物流运输、家用机器人、搜救无人机。统一协议：Full Domain；Unsolvable（删条件）；逐 method 移除；逐任务去全部 method；No Model（去全部 method）。每测最多 5 次机会（ChatGPT 非确定性，默认 temperature=1）。记录是否求解及 ChatGPTQuery 调用次数。重点验证：有解时可找到 plan；无解时返回失败；LLM 乱给分解会被 verifier 拦住。

**Q7. 用于定量评估的数据集是什么？代码有没有开源？**  
非大型基准数据集，而是作者构造的三个 HTN 领域与原型问题；结果以 Table 2 的成功/失败与调用次数呈现。代码与领域开源：`https://github.com/hhhhmmmmm02/ChatHTN`（基于 PyHop）。使用 gpt-4-turbo，文中称每领域调参+全测试约 $30。

**Q8. 论文中的实验及结果有没有很好地支持需要验证的科学假设？**  
对 soundness 的经验支持充分：Full Domain 无需调用即成功；Unsolvable 均失败（尽管 LLM 仍可能提议任务序列）；method 缺失时多数最终能解，调用次数随缺失程度上升。批判点：评测是演示性小样例而非大规模覆盖率/最优性基准；成功依赖多次重试；未与纯 LLM 规划器或学习 HTN 方法做系统对比；不完备性（与 SHOP 一样）仍在；成本与提示敏感限制更复杂域。

**Q9. 这篇论文到底有什么贡献？**  
（1）提出交错符号 HTN 与 LLM 近似分解的 ChatHTN；（2）用 verifier tasks 给出 soundness 论证与实现；（3）开源实现并在三领域演示知识库不完备时仍可可靠规划；（4）缓解 HTN 知识工程瓶颈，同时回应 LLM 规划不可靠问题。属神经符号规划的清晰、可证明正确性的实例。

**Q10. 下一步呢？有什么工作可以继续深入？**  
作者建议：测试数十层更深层次与非经典规划文献领域；允许 ChatGPTQuery 返回复合+原语混合分解；从重复查询中学习新 HTN method 以减少调用。还可降低温度/多候选验证以减重试、扩展到带资源与时间约束的任务网络，并与 LLM 任务引出（用户 NL→复合任务选择）结合。

---

## 3. 开源与平台项目卡

> 星数等状态仅记录调研时页面/API 可见值；API description 与 README 冲突时以 README/docs 为准。

### 3.1 Lattice

- **名称与链接**: [J-o-n-a-t-h-a-n-M-u-e-l-l-e-r/lattice](https://github.com/J-o-n-a-t-h-a-n-M-u-e-l-l-e-r/lattice) · 推理管线 [docs/02-inference-pipeline.md](https://github.com/J-o-n-a-t-h-a-n-M-u-e-l-l-e-r/lattice/blob/main/docs/02-inference-pipeline.md) · MCP [docs/04-mcp-surface.md](https://github.com/J-o-n-a-t-h-a-n-M-u-e-l-l-e-r/lattice/blob/main/docs/04-mcp-surface.md)
- **目标**: 从 GitHub backlog **推断隐藏的 blocking 依赖图**，持久化为 DAG/并行波次，经 REST + **MCP** 把「下一步 / 可并行 / claim」交给 coding agents。架构承诺：**GitHub 只读不写**（issues / 已有 `blocked_by` / sub-issues 为数据源，图存自家 store）。
- **机制**:
  - **L0 摄入**: GraphQL 拉 issue（title/body/labels/milestone/sub-issues/cross-ref）+ REST `blocked_by`；body 截断喂 LLM，全文留作证据校验。
  - **L1 given 边**: 原生 `blocked_by`（conf=1.0）与 sub-issue 层次（conf≈0.99，调度用、不写入 `blocked_by`）；**刻意不做** prose regex「depends on #N」。
  - **L2 聚类**（默认关）: 大窗口下一 call；可选按 milestone/label/路径重叠分簇。
  - **L3 LLM 抽边**: OpenRouter `stealth/ox-alpha` + forced tool-call `emit_edges`；类型 `hard_blocker` / `data_contract` / `shared_artifact` / `ordering_preference`；强制 verbatim `evidence` quote + confidence；先验「多数对无边」。
  - **L4–L6**: ID/证据/密度帽校验 → 多证据合并打分 → 阈值决定是否 *blocking*（默认 ≥0.80）→ 破环（砍最低权边，given 不动）。
  - **L7 持久化**: 全图入 DB；**不回写 GitHub**。调度经 MCP：`list_ready_work` / `claim_next_issue`（租约）/ `report_progress` / `report_dependency` / `explain_dependency` / `plan_for_issue` 等。
- **输入输出**: **入** 公开/已授权 GitHub repo 的 issues + 已有依赖边；**出** store 内 DAG（边带 type/confidence/evidence/source）+ 波次/关键路径；REST `/api/graph`；MCP ready/claim；`artifacts/graph.json` + `schedule.json`。
- **与论文线关系**: **LLM decompose+schedule** 工程落地（对已有 issue 节点抽边而非从目标生成子任务）+ 消费平台 **SE typed-link 边模型**（读 GH `blocked_by`）+ 弱相关 **NL→DAG**（工程必要性依赖 vs 生活时序 DAG）。
- **对自家场景贴合度**: **很高**——ready 队列 + agent claim/lease/`report_dependency` 与「推 Agent」同构；证据 quote / 置信度阈值可支撑推荐 UX。**缺口**: README 明确 **无人闸全自动**（「没有 human gate downstream」），与「保存时推荐 + 人确认边」相反；强绑定 GitHub issue，非通用 NL todo；图不进 GH UI。
- **局限/状态**: ★0（API）；MIT；**Microsoft Hackathon 2026** 原型；自称 E2E 可跑（自有 54-issue backlog 演示），Scheduled Action / DEMO_MODE / 部署「Not built yet」。注意：GitHub API `description` 仍写「writes … with human in the loop」，与 README/docs「never writes / unsupervised」不一致——以 README/docs 为准。

### 3.2 MSComplexTasks

- **名称与链接**: [microsoft/MSComplexTasks](https://github.com/microsoft/MSComplexTasks)
- **目标**: NAACL’21 *Learning to Decompose and Organize Complex Tasks* 配套公开数据集：复杂任务 → 子任务列表 +（可选）**子任务依赖边**。
- **机制**: **数据仓库，非在线抽取器**。标注图：当 `subtask_order_matters=Yes` 时提供 `subtask_dependencies` 有向边（`parent` → `child`）。论文侧是端到端分解 + 学习推断依赖；本仓只交付标注。
- **输入输出**: **入** how-to / 微生产力类复杂任务名（语料来自网页子任务源 URL）；**出** `task_subtask_data.json` 每行：`id`, `task`, `subtasks[{id,name,source}]`, `subtask_order_matters`, 可选 `subtask_dependencies[{parent,child}]`。
- **与论文线关系**: 典型 **NL→DAG** 监督资源；支撑「分解 + 依赖边」图归纳评测，非 SE typed-link。
- **贴合度**: **中高（数据/评测）**——`subtask_dependencies` 可训/评 pairwise 依赖；领域是生活/数字任务 how-to，**不是**软件看板 issue。无推荐 UX、无 ready 队列、无 Agent 契约。
- **局限/状态**: ★18；MIT；**archived**（API）；纯数据集，无运行时服务。

### 3.3 LYNX-TypedLinkDetection

- **名称与链接**: [RegenKordel/LYNX-TypedLinkDetection](https://github.com/RegenKordel/LYNX-TypedLinkDetection) · Zenodo JIRA 数据 DOI 见 README · 对应论文 arXiv:2206.07182 / REJ 扩写
- **目标**: 复现/迁移 **issue tracker 上 typed link 自动检测**（Block / Depend / Epic / Duplicate / Relates…）：数据管线 + BERT/CNN 训练评测，可在自有 issue 对上跑。
- **机制**: 从 MongoDB JIRA dump 抽 issues + links → 清洗 → 构造 **non-links** 负例；**成对分类** `tld.models.bert`（bert-base-uncased 等）或 SCCNN/DCCNN；输入为 issue 对标题/描述文本 → 预测 link type（或 link vs non-link / Top-k）。无图调度：产出是类型标签，不建 ready 队列。
- **输入输出**: **入** `issue.csv` + `link.csv`（或官方 JIRA Zenodo）；**出** 训练结果/metrics；自有数据上可得到「边是否存在 + 类型」。
- **与论文线关系**: 核心 **SE typed-link** 监督基线；与 NL→DAG / Agent 调度正交。
- **贴合度**: **高（监督「有无 Block/Depend」）**——最直接可借的成对分类与负采样思路；适合「推荐候选边」的打分模型。**缺口**: JIRA 主战场非 GH；无「人确认落盘」产品层；无 Agent ready 推送；需自备 CSV/DB。
- **局限/状态**: ★0；MIT；学术复现包（Docker Compose + Jupyter + Mongo）；推荐 ≥24GB 内存；最后活跃约 2023。

### 3.4 OpenReqEU/dependency-detection（OpenReq-DD）

- **名称与链接**: [OpenReqEU/dependency-detection](https://github.com/OpenReqEU/dependency-detection) · Swagger（README 指向 api.openreq.eu）
- **目标**: EU H2020 OpenReq 的 **需求工程**服务：从 NL **requirements** 文本中，基于领域本体 + NLP，抽取需求间依赖关系。
- **机制**: （1）预处理：SBD（OpenNLP）+ 14 条 noisy cleaning；（2）句法：tokenize / PoS（NLP4J）/ dependency parse → 模式匹配关键字 → n-grams；（3）语义：lemmatization + DKPro Similarity / WordNet；（4）**本体概念聚类**把需求个体填入 ontology classes；（5）**Dependency Extraction**: 对本体中已声明有依赖关系的 class 对，展开其实例 → 需求对依赖。传统 NLP/ML，**非 LLM**；无拓扑调度。
- **输入输出**: **入** NL 需求列表 + 领域 ontology（及 WordNet ESA、GloVe 等外部资源）；**出** REST 返回检测到的需求依赖；本体填充后的个体。
- **与论文线关系**: 经典 **RE 依赖检测**（偏 Requires/本体关系），介于 typed-link 与纯 NL→DAG 之间；方法代际早于 LLM 线。与 2102 工业依赖管理、LEREDD 同属需求/issue 依赖谱系。
- **贴合度**: **中（管线参考）**——「NL 文本 → 依赖」可借鉴分句/相似度/阈值；目标是 **需求文档** 非执行级看板卡 / 非 Agent 队列。本体绑定强，迁移成本高。
- **局限/状态**: ★4；**EPL-2.0**；Java/Maven；外部资源链接年代久，维护偏停（push 约 2021）；非 LLM Agent 栈。

### 3.5 DART_LLM_Task_Decomposer_Module

- **名称与链接**: [wyd0817/DART_LLM_Task_Decomposer_Module](https://github.com/wyd0817/DART_LLM_Task_Decomposer_Module) · 论文 DART-LLM arXiv:2411.09022 · 相关 Docker [DART_LLM_Docker](https://github.com/wyd0817/DART_LLM_Docker)
- **目标**: DART-LLM 的 **QA-LLM 分解模块**：NL 指令 → **带显式 dependencies 的结构化子任务序列**，供多机器人依赖感知执行。
- **机制**: 多后端 LLM（OpenAI / Claude / LLaMA 等）+ `prompts/` 模板；一次（或流水）生成 JSON：子任务名 + `dependencies[]`；本模块侧重 **分解与依赖列表**，并行调度/执行在更大 DART 系统中。
- **输入输出**: **入** 自然语言指令（机器人/多机任务语境）；**出** JSON，形如 `instruction_function: { name, dependencies: [...] }` + `object_keywords` 等；Gradio `main.py` 演示。
- **与论文线关系**: 标准 **LLM decompose+schedule** 族；输出形态可直接对照「子任务节点 + 前置边 → DAG」。DART 消融已证显式 DAG 对小模型成功率关键。
- **贴合度**: **中**——可抄 **JSON 依赖字段 / 提示结构**；领域是多机器人而非看板；无「已有任务库上推荐边 + 人确认」；无 GH/通用 todo 持久化；调度契约需对接自家队列。
- **局限/状态**: ★11；README 未标 license（API `license: null`）；模块体量小（~16KB）；依赖外部 API keys。

### 3.6 GitHub Issue Dependencies API

- **名称与链接**: [REST: Issue dependencies](https://docs.github.com/en/rest/issues/issue-dependencies) · UI 文档另见 creating-issue-dependencies
- **目标**: 平台能力：**读写** issue 的 `blocked_by` / `blocking` 关系——**存边与查边，不是从 NL 推断边**。
- **机制**: 无抽取。REST：`GET .../dependencies/blocked_by` · `POST .../dependencies/blocked_by` body `{ issue_id }` · `DELETE .../dependencies/blocked_by/{issue_id}` · `GET .../dependencies/blocking`。Issue 对象可含 `issue_dependencies_summary`。调度/ready 需调用方自建。
- **输入输出**: **入** owner/repo/issue_number +（写）blocking issue 的 **numeric id**；**出** Issue 对象数组或创建 后的 Issue；summary 计数字段。
- **与论文线关系**: **SE typed-link 的平台边模型**（二值 blocked 关系，非多类型 JIRA link）；是 Lattice 的 given 边来源与自家 TaskGraph 持久化对照物。
- **贴合度**: **中（持久化/互通）**——若产品落在 GH，可作权威边存储；**不是** NL 抽取器。非 GH 看板需自建等价 schema。与「人确认后落盘」天然契合（POST 即人工写边）。
- **局限/状态**: 平台 GA 能力（约 2025）；需 auth；写接口有 secondary rate limit；无推理、无推荐、无 Agent 队列。

### 3.7 TaskLAMA 数据 / Spico197/TaskLAMA

- **名称与链接**:
  - 官方数据（CC-BY 4.0）: `https://storage.googleapis.com/gresearch/tasklama/tasklama.zip`
  - 非官方仓: [Spico197/TaskLAMA](https://github.com/Spico197/TaskLAMA) · HF 镜像 [Spico/TaskLAMA](https://huggingface.co/datasets/Spico/TaskLAMA)
  - 论文: [arXiv:2308.15299](https://arxiv.org/abs/2308.15299) / AAAI 2024
- **目标**: 探测 LLM 对复杂现实任务的理解：把任务拆成带 **时序依赖边的 DAG（SCTD）**；官方发布标注数据；Spico 仓为非官方实现 + 数据统计/镜像。
- **机制**: 数据侧提供 line-order 与 **DAG-order** 步骤图；论文结论要点——LLM **分解尚可，成对时序依赖仍弱**。Spico README：实现 **under construction**，勿认真采信其跑分。
- **输入输出**: **入** 复杂任务描述（± assumption）；**出** 步骤节点 + 时序/DAG 边；Spico 统计测试集约 478 tasks（341 line-order / 137 DAG-order）。
- **与论文线关系**: 旗舰 **NL→DAG** 基准；对 LLM decompose+schedule 给「依赖边难」的实证预警。
- **贴合度**: **中高（评测预警）**——应用来测自家成对依赖模型/提示，避免高估全自动；语料偏日常生活，非 SE issue。无产品 UX、无 Agent 队列。Spico 仓不可当生产实现。
- **局限/状态**: Spico ★4 · Apache-2.0；官方数据 CC-BY 4.0；非官方实现明确 WIP。

### 3.8 刻意排除（易混淆）

| 名称 | 为何排除 |
| --- | --- |
| DepsRAG / CKG 等 | 包依赖 KG / **代码** import-call 图，不是 NL 任务依赖 |

---

## 4. 关键点与对比

本节在项目草稿基础上，结合 §2 十问发现扩写，作为独立对照章，直接服务 TaskGraph 设计讨论。

### 4.1 三条线怎么分

| 线 | 核心问题 | 代表论文 | 代表项目/平台 | 对自家 TaskGraph 的硬贡献 |
| --- | --- | --- | --- | --- |
| **A. SE typed-link** | 两份 issue/需求文本之间有没有、是何种链接（Block/Depend/…） | 2206 LYNX；2102 工业依赖管理；LEREDD（需求级） | LYNX；GH Issue Dependencies API；Lattice 读 given `blocked_by`；OpenReq-DD | 「有没有 Block/Depend」监督基线 + 边持久化模型；2102 强调**可解释、可拒绝的辅助**（与人闸同向） |
| **B. NL→DAG** | 从目标/howto/脚本/转录生成**子任务节点 + 时序/前置边** | TaskLAMA；NAACL’21；proScript；2302 transcript | MSComplexTasks；TaskLAMA 数据 | 图形态、pairwise 评测与「依赖边难」预警；非软件看板领域 |
| **C. LLM decompose+schedule** | LLM 输出带依赖的分解，再拓扑/并行执行或 claim ready | DART-LLM；RDD；ChatHTN（层次+验证） | Lattice（对**已有**节点抽边 + MCP）；DART 模块 | ready / claim / 拓扑执行与 Agent 队列同构；显式 DAG 对成功率有实证增益（DART 消融） |

三条线**可叠加**而非互斥：例如 Lattice = C 的调度壳 + A 的 given 边 + 弱 B 的 NL 推断；自家方案更可能是「A 的成对打分推荐 + B/C 的图与调度契约 + **人闸落盘**」。

### 4.2 方法 / 数据 / 监督信号 / 输出图形态对照表

| 维度 | SE typed-link | NL→DAG | LLM decompose+schedule |
| --- | --- | --- | --- |
| **方法** | 监督成对分类（LYNX BERT/CNN）；IR+插件（2102 TF-IDF/引用）；本体+传统 NLP（OpenReq）；few-shot ICL±RAG（LEREDD） | 多源生成+边二分类（NAACL’21 MSBART）；ICL/SPT/Scoring（TaskLAMA）；T5 DOT 生成（proScript）；LLM 摘要+聚类+ILP（2302） | 结构化 JSON + 显式 DAG（DART）；子问题 ID 交叉引用→DAG 调度（RDD）；符号 HTN + LLM 填洞 + verifier（ChatHTN）；LLM tool-call 抽边 + 阈值/破环（Lattice） |
| **数据** | JIRA typed links（~268 万 issues / 88 万 links）；Qt 工业快照；汽车 SRS 813 对（LEREDD）；GH backlog 现场 | TaskLAMA 1612 任务；MSComplexTasks/CTD 430；proScript 6414；ProceL/CrossTask 转录 | DART 102 施工指令；RDD 合成字母/反转；ChatHTN 三小领域；Lattice 自有 54-issue 演示 |
| **监督信号** | 人工 link 类型；non-link 负例（LYNX）；人可拒提案（2102）；LLM Confidence+Rationale（LEREDD）；人写 `blocked_by`（GH） | 众包/人工 DAG 边；双人一致性过滤（proScript）；无监督时用顺序共现统计（2302） | LLM self-report + evidence quote（Lattice）；技能库/依赖满足门控（DART）；合并纠错（RDD）；verifier 任务效应（ChatHTN） |
| **图形态** | 多类型有向边（JIRA）；二值 `blocked_by`（GH）；需求 Requires/Conflicts 等（LEREDD） | 时序/偏序 DAG；可含 AND-OR（2302）；line-order vs DAG-order（TaskLAMA） | 子任务名 + `dependencies[]` JSON；带 soft `ordering_preference` 的工程 DAG（Lattice）；推理 DAG（RDD）；层次任务网络（ChatHTN） |
| **典型指标** | 宏 F1≈0.64（类型）；存在性 F1≈0.95（期刊扩写）；duplicate F≈0.91（2102 CV） | 边 Acc≈0.78（NAACL’21）；TaskLAMA 金标 SPT Acc 78.6% vs ICL ~50%；proScript 边 F1 75.7 vs 人类 89.3 | DART L3 SR 提升（去 DAG 则大跌）；RDD 高难度 exact match；ChatHTN 以 soundness 演示为主 |

**跨线共性（十问汇合）**：

1. **存在性/序列易，类型/pairwise 难**：LYNX 期刊「仅存在性」远易过类型；TaskLAMA「序列好、两两依赖弱」；proScript 端到端边预测仍低于人类。  
2. **人闸与可拒绝辅助有工业先例**：2102 Design Science 明确「不必完全自动」；与自家「推荐+确认」同向，与 Lattice 无人闸相反。  
3. **显式依赖结构有执行收益**：DART 消融证明去掉 DAG 后小模型成功率腰斩级下跌；RDD 用交叉引用把树扩成可调度 DAG。  
4. **领域迁移不可忽视**：how-to / 婚礼 / 施工机器人 / 汽车 SRS ≠ 软件看板「schema 未合入则前端不可写」；工程必要性依赖需要领域提示（如 Lattice 的 hard_blocker / data_contract）或代码/PR 信号。

### 4.3 对自家 TaskGraph 的可用性与缺口

相对三大场景锚点：

| 锚点需求 | 最接近 | 仍缺（自研） |
| --- | --- | --- |
| **落盘推荐 + 人确认边** | GH API 写边（POST=人工权威落盘）；2102「可解释、可拒绝」产品主张；Lattice 的 evidence/置信度可做推荐素材；LYNX/LEREDD 成对打分可做候选排序 | Lattice **刻意无人闸**；多数学术系统离线/全自动，无「保存时询问」产品闭环；推荐打扰度与置信度阈值需产品设计 |
| **非 GH 通用 NL todo** | MS/TaskLAMA/OpenReq/LEREDD 文本侧；NAACL’21 网页 howto 管线 | 无即插即用「任意看板正文→边」库；OpenReq 绑本体；GH/JIRA 监督不直接迁移到通用卡片 |
| **ready 队列 → Agent** | Lattice MCP claim/lease/report；DART 依赖满足后异步执行；RDD 拓扑调度 | 租约/失败回边/部分完成解锁/跨 Agent 类型路由少见端到端可抄；GH API 本身无调度；ChatHTN 是规划 soundness 而非看板队列 |

**额外缺口（上一轮 Gaps + 十问强化）**：

1. **成对依赖精度鸿沟**：TaskLAMA 明示 LLM 弱于 pairwise temporal dependency；LYNX 显示 Block/Depend 难度依赖该类型在仓库内是否常用；proScript 人类边 F1 仍显著高于 LM。→ **必须**置信度阈值、证据引用、或人确认，不可默认全自动写边。  
2. **GitHub「NL→blocked_by」公开基准稀缺**：监督强在 JIRA；GH 侧是平台 API + Lattice 原型，缺大规模公开排行榜。  
3. **输出契约分裂**：学术多时序 DAG / 需求类型边；工程看板要 blocking + ready；Agent 要 claim/lease。需自建统一 TaskGraph schema，并映射三类输出。  
4. **验证层可选但有价值**：ChatHTN 的 verifier、Lattice 的证据校验、2102 的一致性诊断，均可启发「推荐边 → 轻量校验 → 人确认」中间层，但都不是现成产品。

### 4.4 明确：先读什么、可借鉴什么、不要照搬什么

#### 先读（建议顺序）

1. **Lattice** README + `02-inference-pipeline` + `04-mcp-surface` —— 产品同构对照（推断图 + ready/claim）。  
2. **LYNX** README + arXiv:2206.07182 —— 监督 typed-link 怎么做、类型难度与部署策略（先存在性再分型）。  
3. **GitHub issue-dependencies docs** —— 边模型与「人确认后写边」路径。  
4. **TaskLAMA** abs/数据说明 —— 依赖难的预警与评测资源。  
5. **MSComplexTasks** schema —— 依赖边 JSON 形状。  
6. **NAACL’21** —— 端到端「节点生成 + 边推断」流水线范式。  
7. **DART-LLM / RDD** —— 显式依赖对执行/推理的收益与调度同构（讲 DAG 与队列，不讲看板）。  
8. **2102 工业依赖管理** —— 「可拒绝辅助」与 issue graph 一等公民（人闸叙事）。  
9. （可选）proScript / 2302 / LEREDD / ChatHTN —— 偏序脚本、无监督构图、需求级 LLM、可证明层次分解。

#### 可借鉴

| 来源 | 可借什么 |
| --- | --- |
| **Lattice** | evidence quote；密度帽；blocking 阈值 vs 弱边展示；破环（given 边不可被模型推翻）；ready/claim/lease；`report_dependency` 反馈环 |
| **LYNX** | issue 对特征；non-link 负例；多类型标签；BERT 复现入口；「先存在性再分型」部署策略 |
| **2102** | 依赖一等公民图；提案排序与已拒绝过滤；可解释/可拒绝的产品原则 |
| **DART 模块** | 子任务 JSON + `dependencies[]` 提示/schema；显式 DAG 对小模型的补偿 |
| **RDD** | 子任务 ID + 交叉引用形成依赖；拓扑并行调度；合并阶段纠错 |
| **OpenReq-DD / LEREDD** | 分句清洗与相似度阈值的「廉价候选边」前置过滤；动态 few-shot + 置信度重标 No-dep |
| **GH API** | 人确认后的权威落盘；与自建 TaskGraph 的双向同步契约 |
| **MS / TaskLAMA / proScript** | 评测集、DAG 标注字段、边/整图评估协议（Hungarian、GED、pairwise Acc） |
| **ChatHTN** | 「LLM 近似 + 符号/规则验证」夹心层思路（验证器拦假阳性），非 HTN 全栈 |

#### 不要照搬

- Lattice 的 **全自动无确认写调度**（与自家人闸冲突）；其「不回写 GH」若自家要平台可见边则相反。  
- 把 TaskLAMA / MS / proScript **生活 how-to 指标**直接当 SE blocked-by 上限。  
- OpenReq **整本体栈**当通用 todo 依赖器。  
- DART **机器人分解提示**不改写就用于软件工程必要性依赖（缺 hard_blocker / data_contract 先验）。  
- Spico197/TaskLAMA **未完成实现**的数值结果。  
- 混淆包依赖/代码调用图（DepsRAG 等）与 NL 任务依赖。  
- 把 ChatHTN 当成看板依赖推荐器（它解决的是 HTN 知识工程与 soundness，不是 issue 对链接）。  
- 假设「LLM 一次生成整图」已解决 pairwise：TaskLAMA / proScript / LYNX 均表明边/类型仍是瓶颈。

### 4.5 设计讨论用的一句话建议

> **产品形态对照 Lattice（但加回人闸）+ 监督/候选边打分对照 LYNX/LEREDD + 持久化对照 GH API（或自建等价 schema）+ 用 TaskLAMA/MS 测 pairwise 勿高估全自动 + 用 DART/RDD 借鉴 ready/拓扑契约，勿照搬机器人/合成推理领域提示。**

---

## 5. 附录

### 5.1 PDF 本地路径

| 论文 | 本地 PDF |
| --- | --- |
| TaskLAMA | `（本机调研缓存路径已省略）` |
| Learning to Decompose and Organize (NAACL’21) | `（本机调研缓存路径已省略）` |
| proScript | `（本机调研缓存路径已省略）` |
| Automated Detection of Typed Links (2206.07182) | `（本机调研缓存路径已省略）` |
| Improved management of issue dependencies (2102.08485) | `（本机调研缓存路径已省略）` |
| Unsupervised Task Graph from Transcripts (2302.09173) | `（本机调研缓存路径已省略）` |
| DART-LLM (2411.09022) | `（本机调研缓存路径已省略）` |
| RDD (2505.02576) | `（本机调研缓存路径已省略）` |
| LEREDD / Requirement Dependencies (2602.22456) | `（本机调研缓存路径已省略）` |
| ChatHTN (2505.11814) | `（本机调研缓存路径已省略）` |

### 5.2 上一轮清单索引

上一轮短调研：`（上一轮短笔记未单独入库，见本报告 §0）`

| 类别 | 条目（上一轮表内） |
| --- | --- |
| 论文 | TaskLAMA · NAACL’21 Decompose · 2206 Typed Links / REJ · 2102 Industrial deps · 2302 Transcript graph · proScript · DART-LLM · RDD · 2602 LEREDD · ChatHTN |
| 开源/平台 | Lattice · LYNX · MSComplexTasks · OpenReq-DD · DART 模块 · TaskLAMA 数据/Spico · GH Issue Dependencies API |
| 排除 | DepsRAG / CKG（非 NL 任务依赖） |
| Partials | `_partials/2026-09-14--papers-batch-a.md` · `...-b.md` · `...-c.md` · `...-projects-and-contrast-draft.md` |

### 5.3 一手链接速查

- https://arxiv.org/abs/2308.15299 · https://doi.org/10.1609/aaai.v38i17.29918  
- https://aclanthology.org/2021.naacl-main.217/ · https://github.com/microsoft/MSComplexTasks  
- https://arxiv.org/abs/2206.07182 · https://link.springer.com/article/10.1007/s00766-023-00406-x · https://github.com/RegenKordel/LYNX-TypedLinkDetection  
- https://arxiv.org/abs/2102.08485  
- https://arxiv.org/abs/2302.09173 · https://aclanthology.org/2023.findings-acl.210/  
- https://arxiv.org/abs/2104.08251 · https://aclanthology.org/2021.findings-emnlp.184/  
- https://arxiv.org/abs/2411.09022 · https://github.com/wyd0817/DART_LLM_Task_Decomposer_Module  
- https://arxiv.org/abs/2505.02576  
- https://arxiv.org/abs/2602.22456  
- https://arxiv.org/abs/2505.11814 · https://github.com/hhhhmmmmm02/ChatHTN  
- https://github.com/J-o-n-a-t-h-a-n-M-u-e-l-l-e-r/lattice  
- https://github.com/OpenReqEU/dependency-detection  
- https://docs.github.com/en/rest/issues/issue-dependencies  
- https://storage.googleapis.com/gresearch/tasklama/tasklama.zip · https://github.com/Spico197/TaskLAMA  

---

*本深化报告由上一轮短调研 + papers batch A/B/C + 项目卡与对比草稿合并定稿；未 edges-publish、未向用户发消息。*
