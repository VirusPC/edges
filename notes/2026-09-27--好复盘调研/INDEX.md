# 怎么样才是一个好的复盘？

> 落库说明：由「周复盘」助手调研落库。  
> 调研日期：2026-09-27（Asia/Shanghai）  
> 对象用户：peng cheng  
> 方法说明：优先对照官方文档、原著/原作者公开文章、军队教范、公司官方公开材料；二手博客仅作线索，不作主张依据。查不到的来源一律标注「未核到来源」。

---

## 1. 问题与范围

「复盘」在中文职场里被用得很宽：有人指周会/年会后的总结，有人指业务项目复盘，有人指敏捷 retrospective，有人指个人知识工作的 weekly review。本报告要回答的不是「哪本畅销书的清单最好」，而是：

1. 各主要流派在**可核对的一手材料**里，究竟要求复盘做什么；
2. 跨流派是否存在**可检验**的共性标准（而不是鸡汤句）；
3. 常见失败模式是什么；
4. 若落地到「代码/知识库仓库的周复盘」（汇总一周 commits / PR / 看板变化 + 启发建议），一份好的输出应长什么样。

**范围边界**

| 纳入 | 不纳入 / 降级处理 |
|------|-------------------|
| 美军 AAR 官方教范要点 | 各类「复盘 N 条」自媒体清单（除非指向一手出处） |
| Agile Manifesto、Scrum Guide、Derby & Larsen 原著框架、Atlassian 官方 retro 页 | 未核到来源的「阿里/华润官方复盘手册」宣称 |
| 联想体系公开表述（联想之星/中国企业家网等可核文章） | 编造页码或未打开过的链接 |
| GTD / Tiago Forte 原作者或官方 checklist | 对用户仓库做任何改动或 git push |

**业务复盘 vs 会议复盘（本报告用语）**

- **业务/项目复盘**：以一次目标驱动的行动为对象（战役训练、Sprint、产品项目、战略周期），对照「当初目标 → 实际结果 → 原因 → 下次怎么改」。
- **会议/活动复盘**：以一次组织过程本身为对象（年会会务、发布会、大型评审），优化流程、节点、体验与执行细节；产出常是「明年可改进点」。
- **个人/知识工作周复盘**：以个人系统（inbox、日历、任务、笔记）为对象，把混乱重置为可行动状态；不一定做深度根因分析。

三者目的不同，好坏标准有交集，但**不能用同一套模板硬套**。

---

## 2. 各流派要点（带引用）

### 2.1 美军 After Action Review (AAR)

**一手来源（已核）**

1. U.S. Army Combined Arms Center–Training / TMD，《The Leader’s Guide to After-Action Reviews (AAR)》，December 2013（支持 ADP 7-0 / ADRP 7-0；NWCG 镜像 PDF 可公开读取）：  
   `https://fs-prod-nwcg.s3.us-gov-west-1.amazonaws.com/s3fs-public/2023-06/army-leaders-guide-to-aar.pdf`
2. Army Publishing Directorate 记录：TC 25-20 *A Leader’s Guide to After Action Reviews*（1993-09-30）状态为 **INACTIVE**（已废止/停用）：  
   `https://armypubs.army.mil/productmaps/pubform/details.aspx?pub_id=71643`
3. 现行增补教范：TC 7-0.1 *After Action Reviews*（Training Management Directorate 发布说明，2025-02-20，army.mil）：  
   `https://www.army.mil/article/283214/tmd_publishes_training_circular_to_augment_fm_and_adp_7_0`  
   正式文本入口：Army Publishing Directorate / ATN（`https://atn.army.mil`）。本调研未能在无登录环境下完整抽取 TC 7-0.1 全文；下列可操作要点以 **2013 Leader’s Guide** + army.mil 官方摘要为准。

**定义与目的**

- AAR 是对组织表现的**引导式分析**，在训练/行动中或结束后进行，目标是**改善未来表现**（Leader’s Guide 引 ADRP 7-0）。
- 它是**专业讨论**，让参与者**自己发现**发生了什么，并形成改进策略——而不是领导单方面「批判会」（critique）。

**讨论四段（核心议程）**

1. **Review what was supposed to occur**（本应发生什么）：对照指挥官意图、训练目标、任务标准（T&EO）。
2. **Establish what happened**（实际发生了什么）：尽可能收集多视角（各层级、友军/OPFOR 等），建立共同事实图景。
3. **Determine what was right or wrong**（对与错 / 强弱项）：相对意图与绩效标准，而不是相对某人好恶。
4. **Determine how the task should be done differently next time**（下次怎么做不同）：参与者自决改进方案，并明确**谁负责落实**；可衔接再训练、修订 SOP。

**可检验特征（教范反复强调）**

- 基于**标准**（task standards / T&EO），观察要具体。
- **不是 critique**：不问「谁背锅」，气氛上允许坦诚；必要时点**职位**而非点名羞辱。
- 全员或关键参与者讨论；引导员多用**开放式问题**，少用是/非题。
- 可 formal / informal；训练中即可做 informal AAR，并把结论立刻用于下一轮迭代。
- **Follow-up 是第四步**：再训练、改 SOP、把 lessons 反馈进后续训练计划——不做跟进等于白开。

---

### 2.2 Agile retrospective

#### 2.2.1 Agile Manifesto（原则第 12 条）

一手来源：`https://agilemanifesto.org/principles.html`（2001）

> At regular intervals, the team reflects on how to become more effective, then tunes and adjusts its behavior accordingly.

要点：**定期反思 → 调整行为**。价值在「变行为」，不在「开了会」。

#### 2.2.2 Scrum Guide 2020 — Sprint Retrospective

一手来源：Ken Schwaber & Jeff Sutherland，《The 2020 Scrum Guide》，`https://scrumguides.org/scrum-guide.html`（PDF：`https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-US.pdf`）

- **目的**：plan ways to increase **quality and effectiveness**。
- **检查范围**：individuals, interactions, processes, tools, Definition of Done；并探索把团队带偏的 **assumptions** 及其来源。
- **讨论内容**：什么做得好、遇到什么问题、问题如何被（或未被）解决。
- **输出**：识别最有帮助的变更；**影响最大的改进应尽快处理**，甚至可放入下一 Sprint Backlog。
- **时间盒**：一个月 Sprint 最长 3 小时；更短 Sprint 通常更短。
- 与 Scrum 三大支柱一致：**Transparency → Inspection → Adaptation**；「只检查不适应」被明确视为无意义。

> 注：2017 版曾要求至少一条改进进入下一 Sprint Backlog；2020 版改为「可放入」，把决定权交回团队（Scrum.org 等二次解读对此有说明；规则本文以 2020 Guide 原文为准）。

#### 2.2.3 Derby & Larsen — *Agile Retrospectives*

一手来源（框架与章节结构）：

- Esther Derby & Diana Larsen，*Agile Retrospectives: Making Good Teams Great*（Pragmatic Bookshelf，第 1 版 2006）。
- 第 2 版：*Agile Retrospectives, Second Edition*（Derby, Larsen, Horowitz；Pragmatic Bookshelf，2024 首印）：  
  `https://pragprog.com/titles/dlret2/agile-retrospectives-second-edition/`  
  公开 Introduction 摘录确认五阶段仍为核心：`https://media.pragprog.com/titles/dlret2/intro.pdf`

**五阶段（可检验流程）**

1. **Set the Stage** — 聚焦、参与规则、心理安全。
2. **Gather Data** — 客观数据 + 主观感受，建立共享事实。
3. **Generate Insights** — 模式、根因、假设，而不只罗列现象。
4. **Decide What to Do** — 少量可执行的实验/改进行动。
5. **Close the Retrospective** — 收束、感谢、对本次会议本身的反馈。

第 2 版额外强调：跟进变革（Catalyzing and Sustaining Change）、远程/混合、把议题抬升到团队控制圈之外、克服「反正也不变」的幻灭循环——说明作者认为**坏复盘的主因常是无跟进与不安全**，而非缺模板。

#### 2.2.4 Atlassian 官方表述

一手来源：`https://www.atlassian.com/agile/scrum/retrospectives`

- Retro 是定期反思：什么有效、什么无效、如何正向改变。
- 成功条件：支持性氛围、**清晰 action items**、以及**跟进执行**。
- 基本做法：列出好坏 → 团队排序优先级 → 讨论改进前 1–2 项 → 产出有 owner / due date 的行动计划 → **严格执行**（「每期重复同一障碍最令人沮丧」）。
- 格式可变（Start/Stop/Continue、More/Less、Glad/Sad/Mad 等），但**时机、参与者、产出落地**应尽量稳定。

---

### 2.3 中文语境「复盘」

#### 2.3.1 联想 / 柳传志体系（可核公开材料）

一手/准一手来源：

- 周自强、郭志强，《柳传志口中的「复盘」：联想重要方法论》，中国企业家网转载于新浪教育，2013-06-18：  
  `http://edu.sina.com.cn/bschool/2013-06-18/1555384988.shtml`  
  （作者来自联想之星语境；文中描述《联想复盘方法论》作为联想之星课程，并向海外团队推广——属联想体系公开传播材料，**不是**对外发布的完整官方 PDF 手册全文。）

**要点摘要（据上文）**

- 词源：围棋复盘；柳传志约在 **2001** 联想投资成立时正式提出「复盘」一词；**2006** 联想文化梳理中，方法论成为核心价值观组成部分，复盘为重要方法论之一。
- **四步法**：  
  1. 回顾目标（当初目的/期望是什么）  
  2. 评估结果（对照目标的亮点与不足）  
  3. 分析原因（成败关键原因，主观+客观）  
  4. 总结经验（体会/规律 + 行动：新举措 / 继续 / 叫停）
- **五个态度**：开放心态、坦诚表达、实事求是、反思自我、集思广益。
- 与「普通总结」的区别：不是「先射箭再画靶」；而是**回到初始目的**，追问目标—结果差异的根因（目标驱动型学习）。
- 操作提醒（文中「注意点」）：分清目的与目标；目标尽量可量化；亮点与不足同等重要；成功多列客观因素、精选真优势；失败多从自身挖；规律勿刻舟求剑。
- 文化红线：**对事不对人**；不是批斗会；一把手先以身作则复盘自己，再推广。

柳传志原话（文中引述，可核该篇）：学习能力是「打一次仗，经常地『复盘』，把怎么打的边界条件都弄清楚」。

#### 2.3.2 邱昭良《复盘+》（联想实践的系统化著述）

一手作者材料：

- 邱昭良，《复盘+：把经验转化为能力（第3版）》，机械工业出版社，2018-09，ISBN 9787111605768（豆瓣书目：`https://book.douban.com/subject/20485545/`）。
- 作者公开文章：《远离「伪复盘」，把复盘做到位》，CKO 学习型组织网，2025-02-21：  
  `https://www.cko.com.cn/fp_1/2.html`

**定位说明**：邱昭良曾任联想控股董事长业务助理、万达学院副院长——其书是**作者系统化著述**，大量引用联想/美军 AAR 等，**不宜等同于「联想官方手册」**，但是中文「复盘」方法论最常被引用的一手作者文本之一。

**与好复盘直接相关的主张（作者文）**

- 本质：从自身实践学习；必须靠**后续行动与实践检验**；目的是提升未来行动能力与绩效。
- 「U 型学习」：由表及里（根因）+ 由此及彼（举一反三成规则）+ 付诸改进。
- **六类伪复盘**：工作总结/述职考评；纯解决问题会；蜻蜓点水回顾；空想推演；走形式；批斗会。
- 团队复盘强调「三阶九步」（准备—会议引导—后续推进）与引导能力；提出「复盘 25 个坑」等（细节以书为准；本报告不臆造页码）。

#### 2.3.3 万达 / 王健林相关公开表述

已核官方/准官方材料：

- 万达企业文化中心，《万达工作法 · 年会》，万达电子书站：  
  `https://vbook.wanda.cn/index.php?s=%2Fnews%2Fdetail%2Fid%2F31.html`

**可核事实**

- 王健林半年会/年会有约 **100 分钟**工作报告，据该文称其会前闭关约两周手写打磨、脱稿演讲——这更接近**业务/战略工作报告与动员**，文中**未**将其命名为「复盘方法论」四步法。
- 文末明确写道：年会结束后，**人力资源部门会及时对年会的组织、细节等做一个复盘**；通过复盘每年找到明年可改进点（例：增加同声传译）。  
  → 这是典型的 **会议/活动复盘**（优化组织过程），与联想式业务复盘四步法不是同一文档体系。

**未核到来源**

- 未找到王健林本人公开发表、可核对的「万达复盘四步法 / 真复盘制度化」完整方法论原文（二手转述较多，本报告不采信为官方方法）。

#### 2.3.4 阿里 / 华润

| 线索 | 核实结果 |
|------|----------|
| 阿里「业务复盘方法论」通用公开手册 | **未核到来源**（大量二手文章互相转载，缺乏可定位的阿里集团官方方法论正文） |
| 阿里云卓越架构 / 故障管理中的「故障复盘」 | 存在官方帮助文档入口，例如 `https://help.aliyun.com/zh/document_detail/2536143.html`（云上全流程闭环的故障管理）；本调研抓取超时，**未能完整核验文内条款**。可作为「工程故障复盘」线索，不宜据此概括「阿里集团复盘文化」。 |
| 华润「复盘方法论」 | **未核到来源**。公开二手材料更多谈华润**行动学习**；与「复盘」有实践重叠，但本报告未找到华润集团可核对的「复盘」官方教范全文。 |

**区分建议（中文语境）**

- **业务复盘**：联想四步法、项目/经营复盘——目标—结果—根因—规律/行动。
- **会议复盘**：万达年会会务复盘——流程节点、体验、执行细节的改进清单。
- **故障/事故复盘**（工程）：时间线、根因、可验证改进项、监控与 SOP 更新（行业实践；阿里云文档待完整核验）。
- 勿把「周例会改名叫复盘」当作真复盘（邱昭良对「伪复盘」的批评与此直接相关）。

---

### 2.4 个人 / 知识工作周复盘

#### 2.4.1 GTD Weekly Review（David Allen）

一手来源：

- 官方 checklist PDF：`https://gettingthingsdone.com/wp-content/uploads/2014/10/Weekly_Review_Checklist.pdf`（© David Allen Company）
- 官方播客页复述步骤：`https://gettingthingsdone.com/2018/08/episode-43-the-power-of-the-gtd-weekly-review/`  
  Allen 称 Weekly Review 为使 GTD 坚持下去的 **critical success factor** / “Master Key”（Forte 文中亦引述 Allen 书中表述）。

**三阶段结构（checklist）**

1. **Get Clear**：收拢散落材料；清空收件箱；清空大脑（写下未捕获事项）。
2. **Get Current**：回顾行动清单、过往/未来日历、Waiting For、项目与结果清单、相关检查表——确保每个项目至少有一个下一步行动。
3. **Get Creative**：回顾 Someday/Maybe；允许新的大胆想法进入系统。

这是**系统维护型复盘**：目标是「心如止水」的可信外部系统，而非深度业务根因分析。

#### 2.4.2 Tiago Forte / BASB — Weekly Review

一手来源：

- Tiago Forte，《The Weekly Review is an Operating System》，Forte Labs，2017-05-26（更新 2021-05-06）：  
  `https://fortelabs.com/blog/the-weekly-review-is-an-operating-system/`
- 作者后续公开的简化清单（LinkedIn / BASB 社区视频描述，2017 文已含其个人 checklist 逻辑）：邮件 → 日历（约 −2/+4 周）→ 物理/数字桌面 → 笔记归档（PARA）→ 澄清并选择本周/今日任务。

**要点**

- 把 Weekly Review 视为**操作系统**：用固定节奏把混乱重置为清晰。
- 强调可在 **15–30 分钟**内完成的、适配个人的清单（反对完美主义式超长仪式）。
- 与 GTD 同源：先清空与澄清，再选优先级；PARA 主要用于笔记归档层。

---

## 3. 好复盘的可检验标准（条目化，挂钩来源）

下列标准尽量写成「旁观者能检查是否做到」，并标注主要出处。

1. **有明确对象与时间窗**  
   复盘的是哪一次行动/哪个 Sprint/哪一周仓库变化，起止清楚。  
   ← AAR「during/after event」；Scrum「last Sprint」；联想「回顾目标」前提。

2. **先对齐「本应如何」再谈「实际如何」**  
   有目标、意图、标准或 Definition of Done，而不是事后重新画靶。  
   ← AAR 四段之 1–2；联想四步之「回顾目标→评估结果」；Scrum 对 DoD / assumptions 的检查。

3. **事实先于评价；多源数据，可核对**  
   时间线、产物、指标、多方视角先摆齐，再下判断。  
   ← AAR「establish what happened」+ 多视角；Derby「Gather Data」；Atlassian「memorialize feedback」。

4. **对照标准，而非对照情绪或权力**  
   强弱项相对任务标准/目标/DoD；点职位与系统，避免羞辱式点名。  
   ← AAR「standards-based」「not a critique」；联想「对事不对人」；Scrum 价值观 Openness / Respect / Courage。

5. **成功与失败都学；亮点不可省略**  
   ← AAR「always weaknesses to improve and strengths to sustain」；联想注意点「亮点与不足同样重要」；邱昭良批评「只盯失败的解决问题会」。

6. **从现象推进到原因（含假设与边界条件）**  
   至少回答：为何发生？哪些假设错了？边界条件是什么？  
   ← 联想「分析原因」；Scrum「assumptions… origins explored」；Derby「Generate Insights」；AAR 的 why/right-wrong 讨论。

7. **产出可执行的改变，且数量克制**  
   有明确行动/实验、负责人、时间或验收方式；宁少勿多。  
   ← Scrum「most impactful… as soon as possible」；Atlassian「owner + due date」；Derby「Decide What to Do」；AAR「who is responsible」。

8. **有闭环跟进（Follow-up）**  
   下次复盘先核对上次行动是否落地；该再训练/改 SOP/改 DoD/改流程的要改。  
   ← AAR Step 4 Follow-up；Scrum Adaptation 支柱；Atlassian「be disciplined about executing」；Derby 第 2 版专章 Catalyzing Change；邱昭良「后续推进」。

9. **节奏固定，时长有边界**  
   ← Manifesto「regular intervals」；Scrum timebox；GTD/Forte 的 weekly cadence；AAR 建议排进训练计划而非临时起意。

10. **心理安全与参与质量可观察**  
    允许异议；引导而非审讯；领导不抢麦定调。  
    ← AAR 反 critique；联想五态度；Derby Set the Stage / psychological safety；Scrum Respect & Openness。

11. **名实相符：目的是学习与改进，不是考评或批斗**  
    ← 邱昭良「伪复盘」六类；联想「不是秋后算账」；AAR「does not evaluate success or failure」作为盖棺结论。

12. **（个人系统型）外部系统重新可信**  
    Inbox/日历/项目清单回到「每项有下一步」的状态。  
    ← GTD Get Clear / Get Current；Forte Weekly Review as OS。

---

## 4. 常见失败模式

| 失败模式 | 表现 | 主要对照来源 |
|----------|------|----------------|
| 批判会 / 批斗会 | 追责、羞辱、报喜不报忧 | AAR 明确反对 critique；联想/邱昭良 |
| 伪复盘：周会改名 | 无目标对照、无根因、无行动 | 邱昭良 |
| 先射箭再画靶 | 用结果反推「当初就想这样」 | 联想之星文 |
| 只有吐槽没有 Decide | Glad/Sad 列很长，下周照旧 | Scrum Adaptation；Atlassian；Derby |
| 行动项过多且无主 | 清单漂亮，无人认领 | Atlassian；AAR responsibility |
| 无 Follow-up | 每期重复同一障碍 | Atlassian；AAR Step 4；Derby |
| 只盯失败 | 错过可复制的成功机制 | 邱昭良；联想「亮点同等重要」 |
| 规律刻舟求剑 | 把一时一地经验升格为永恒法则 | 联想注意点 |
| 一把手不自盘却强推 | 形式主义文化 | 联想之星文；邱昭良三引擎 |
| 时长失控 / 完美主义周复盘 | 个人 weekly review 巨长导致放弃 | Forte「design a key that matches」；GTD 强调可持续习惯 |
| 数据黑箱 | 无 commits/指标/时间线，纯印象流 | AAR / Derby Gather Data |
| 远程复盘变成填表 | 无对话、无安全、无决策 | Derby 第 2 版远程章所针对的问题 |

---

## 5. 落到「仓库周复盘」的建议  
（面向代码/知识库如 VirusPC/edges：汇总一周 commits / PR / 看板变化 + 启发建议）

仓库周复盘同时具备三种血统：**AAR 的标准对照**、**Sprint Retro 的改进闭环**、**GTD/Forte 的系统重置**。它通常不是团队共创会议全文，而更像「观察者写给维护者的周报型复盘」——因此更要自律，避免写成罪责清单或鸡汤。

### 5.1 好的仓库周复盘应长什么样

建议固定结构（可直接给周复盘助手当输出骨架）：

1. **范围卡**  
   - 仓库/分支、时间窗（如周一 00:00–周日 23:59，标注时区 Asia/Shanghai）  
   - 数据来源：commits、PR（开/合/审）、Issues/看板状态变化、CI 失败若可及  
   - 本周「本应推进」的目标（若有里程碑/看板 Sprint/用户口述目标；没有则诚实写「本周无显式目标，仅做事实扫描」）

2. **事实层（Gather Data / what happened）**  
   - 量化：commit 数、PR 合并数、新增/关闭 issue、热点目录、主要作者  
   - 时间线：3–7 个关键节点（大 PR、事故、方向转折、文档落地）  
   - 看板：进行中老化、反复横跳、完成定义是否含糊  
   - **只陈述可核对事实**，把评价留到下一节

3. **对照层（what was supposed to happen）**  
   - 若有明确目标：完成了什么 / 没完成什么 / 意外收获  
   - 若无：标注「目标真空」本身就是发现（联想：目的不清则复盘价值受限）

4. **洞见层（Generate Insights）——克制、可证伪**  
   - 模式：如「文档 PR 多但缺索引」「同域反复修补」「审查等待过长」  
   - 假设：用「可能因为…」表述，并写需要什么证据才能确认  
   - 区分：个人节奏问题 vs 仓库结构/流程问题 vs 外部依赖

5. **行动层（Decide + Follow-up）——少而硬**  
   - **最多 1–3 条**下周期可验证行动（例：给某目录补 README；合并或关闭某老化 PR；为重复故障加回归测试）  
   - 每条含：建议动作、为何、如何算完成、建议负责人（人或角色）  
   - **回溯上期行动**：完成 / 未完成 / 阻塞原因（AAR Follow-up / Atlassian 纪律）

6. **启发建议（给助手的增值部分）**  
   - 从本周事实抽出「可迁移规则」时必须保守（联想：总结规律要小心）  
   - 格式建议：`观察 → 假设 → 若为真则下步实验 → 如何证伪`  
   - 明确区分：**仓库卫生**（GTD 式清空）vs **能力/架构学习**（业务复盘式）

7. **语气与伦理**  
   - 对事不对人；点路径、PR、角色，不写人格审判  
   - 亮点与风险并列（可持续的提交习惯、清晰的 commit message 等也要记）  
   - 结尾一句话：本周对「有效性」的单一最重要结论（Scrum：increase effectiveness）

### 5.2 仓库周复盘应避免什么

- **Avoid：commit 流水账无结论**（只有 Get Clear，没有 Insights/Decide）  
- **Avoid：事后诸葛亮式战略演讲**（脱离本周数据）  
- **Avoid：十条以上「建议」**（等于没有优先级）  
- **Avoid：把 CI 红、债务、风格喜好混成一锅道德指责**  
- **Avoid：编造用户没说过的「本周目标」来画靶**  
- **Avoid：用复盘替代代码审查或事故报告**（严重故障应走专门事故复盘，含时间线与验证项）  
- **Avoid：从不核对上周行动**（制造「伪进步」）  
- **Avoid：泄露密钥、token、私密 URL**；复盘文本默认可被转发  
- **Avoid：改用户仓库或 git push**（除非用户另任务授权；本调研任务明确禁止）

### 5.3 一页「助手验收清单」（可打勾）

- [ ] 时间窗与仓库范围写清  
- [ ] 事实与评价分节  
- [ ] 有对照目标或显式声明「无目标」  
- [ ] 洞见带假设，而非假装全知  
- [ ] ≤3 条可验证行动，含完成定义  
- [ ] 回顾了上期行动状态  
- [ ] 有至少一条亮点/应保持项  
- [ ] 无人身攻击、无秘密材料、无臆造链接  

---

## 6. 资料表

| 主题 | 文献 / 机构 | 年份 | URL 或定位 | 核实状态 |
|------|-------------|------|------------|----------|
| AAR Leader’s Guide | U.S. Army CAC-T / TMD | 2013-12 | https://fs-prod-nwcg.s3.us-gov-west-1.amazonaws.com/s3fs-public/2023-06/army-leaders-guide-to-aar.pdf | 已读 PDF |
| TC 25-20 状态 | Army Publishing Directorate | 1993（INACTIVE） | https://armypubs.army.mil/productmaps/pubform/details.aspx?pub_id=71643 | 已核记录页 |
| TC 7-0.1 发布说明 | army.mil / TMD | 2025-02-20 | https://www.army.mil/article/283214/tmd_publishes_training_circular_to_augment_fm_and_adp_7_0 | 已读摘要；全文未完整抓取 |
| Agile Manifesto 原则 | agilemanifesto.org | 2001 | https://agilemanifesto.org/principles.html | 已核 |
| Scrum Guide | Schwaber & Sutherland | 2020-11 | https://scrumguides.org/scrum-guide.html | 已核 |
| Agile Retrospectives 2e | Derby, Larsen, Horowitz / Pragmatic | 2024 | https://pragprog.com/titles/dlret2/agile-retrospectives-second-edition/ ；intro https://media.pragprog.com/titles/dlret2/intro.pdf | 已核目录与 intro |
| Atlassian Retrospectives | Atlassian | 页面现存（抓取于调研日） | https://www.atlassian.com/agile/scrum/retrospectives | 已核 |
| 联想复盘公开文 | 周自强、郭志强 / 中国企业家网→新浪 | 2013-06-18 | http://edu.sina.com.cn/bschool/2013-06-18/1555384988.shtml | 已核 |
| 复盘+ 第3版 | 邱昭良 / 机械工业出版社 | 2018-09 | ISBN 9787111605768；豆瓣 https://book.douban.com/subject/20485545/ | 书目已核；未逐页核对页码 |
| 伪复盘 | 邱昭良 / cko.com.cn | 2025-02-21 | https://www.cko.com.cn/fp_1/2.html | 已核 |
| 万达年会工作法 | 万达企业文化中心 | （站内文，含年会复盘句） | https://vbook.wanda.cn/index.php?s=%2Fnews%2Fdetail%2Fid%2F31.html | 已核 |
| 王健林「复盘方法论」专文 | — | — | — | **未核到来源** |
| 阿里集团复盘官方方法论 | — | — | — | **未核到来源** |
| 阿里云故障管理文档 | 阿里云帮助中心 | — | https://help.aliyun.com/zh/document_detail/2536143.html | 入口存在；正文抓取超时，**细节未核验** |
| 华润复盘官方教范 | — | — | — | **未核到来源** |
| GTD Weekly Review Checklist | David Allen Company | checklist © 标注 1990–2006 | https://gettingthingsdone.com/wp-content/uploads/2014/10/Weekly_Review_Checklist.pdf | 已核 |
| GTD Weekly Review 播客页 | gettingthingsdone.com | 2018-08-15 | https://gettingthingsdone.com/2018/08/episode-43-the-power-of-the-gtd-weekly-review/ | 已核 |
| Forte Weekly Review | Tiago Forte / Forte Labs | 2017（2021 更新） | https://fortelabs.com/blog/the-weekly-review-is-an-operating-system/ | 已核 |

---

## 7. 综合结论（给口述用的压缩版）

跨美军 AAR、Scrum/Derby Retro、联想复盘与 GTD/Forte 周回顾，**好复盘的最小公分母**是：

> **在固定节奏下，用可核对事实对照事先目标与标准，在安全氛围中找出可迁移的原因，并留下少量有主人的改进行动，且下一周期必须验收这些行动。**

做不到「对照、根因、行动、验收」四件里的任意一件，就很容易掉进周会改名、批斗会或流水账——也就是各家一手材料里反复警告的那种「看起来开了会、其实什么也没变」。
