# Edges

Edges 是一个以知识资产为核心、由 Agent 接口和可迁移 harness 支撑的个人认知系统，用来在时间维度上积累可复用的判断优势。

## Language

**Edges**：
以长期认知复利为目标的个人认知系统整体。
_避免使用_：Agent 工具箱、skill 合集

**知识资产（Knowledge Asset）**：
以未来产生决策收益为目的，被投入认知资本持续管理的材料或判断；Note 和专项承载在研资产，Edge 是能够反复部署的核心收益资产。
_避免使用_：内容、文档

**Edge**：
已经提炼出理由与适用边界、可检验且能相对原有判断或替代方案改善未来决策的可复用判断；是否经过现实验证不影响其身份，其价值也可能随环境变化而衰减。
_避免使用_：完整笔记、高质量内容、已验证结论

**认知资本（Cognitive Capital）**：
个人可投入知识生产与使用的稀缺时间、注意力和推理能力。
_避免使用_：信息、知识数量、货币资本

**知识投资（Knowledge Investment）**：
将认知资本有选择地投入知识的研究、提炼、部署与演化，以获得长期决策收益的过程。
_避免使用_：收集资料、整理文件、金融投资

**Agent Memory**：
让 Agent 跨任务保留并按需取回临时上下文、运营知识和长期认知资产的分层记忆能力；Memory 是资产管理基础设施，不等同于资产本身。
_避免使用_：单一目录、全部上下文、知识资产

**项目记忆（Project Memory）**：
服务于项目维护的有作用域运营记忆，保存无法从项目当前状态直接推导的约束、纠正、决策、资料指针和可复用流程。
_避免使用_：长期知识库、会话流水账、代码事实副本

**Memory Type（项目记忆）**：
项目记忆中一条记忆归入哪份类型入口的分类；每一类型在该层有一份类型入口，与该类型的条目同处。类型集合由 LAYOUT 实现与本层登记决定，不是 PROTOCOL 闭集枚举。
_避免使用_：把 type 写成全局 JSON 注册表键、把看板 `knowledge/tasks` 状态夹直接叫 Memory Type、把每条 Task 升成 Memory Type（Q18=B，另卡）、把类型入口与层入口当成同一种 AGENTS.md

**层入口 AGENTS.md**：
某一记忆层目录上的项目记忆入口，承载本层硬约束、本层类型入口清单与下层记忆索引。
_避免使用_：类型入口 AGENTS.md、把类型目录里的 AGENTS.md 当成层入口、Task Project AGENTS.md（若指项目记忆层入口）

**类型入口 AGENTS.md**：
某一 Memory Type 在该层的记忆入口，只含该类型引言与条目清单，与该类型条目同处；契约不同于层入口。
_避免使用_：层入口 AGENTS.md、记忆层根上另立一套入口文件名、把类型入口写成全局注册表、Task Project AGENTS.md

**用户记忆（User Memory）**：
项目记忆的一种 Memory Type，保存绑定到某一仓库路径、且不宜公开的个人材料（个人偏好而非项目共享约定、凭据与密钥，以及其他不得公开的上下文）；权威副本在该仓库工作树内，但不进入版本历史。它不是独立于项目记忆的全局层，也不把私有仓当作真源。
_避免使用_：独立全局 vault、edges-private 当真源、机器级单一记忆库、项目共享约定

**可扩展 Memory Type**：
在指定记忆目录通过 skill（如 `$project-memory-add-type`）登记新的 Memory Type（name / description / 可选特权 metadata），与内置种子类型同构（类型入口 + 同处条目 + 层入口一行）、可被 remember / ask / doctor 发现；官方 init 种子不因示例类型膨胀。扩展面仍只在 LAYOUT，不另开类型注册表。
_避免使用_：单独 JSON/YAML 总配置平面、把示例 type 写进默认种子、把加 type 写成改 PROTOCOL

**评测冒烟（Evaluation Smoke）**：
以复现公开基准上「写入→检索→作答→打分」链路并产出可复查记录为目的的试跑；不构成项目记忆或 Agent Memory 有效性证据。
_避免使用_：记忆评测通过、benchmark 证明有效、把冒烟分数当成项目记忆增益

**公开基准证明（Benchmark Proof）**：
在构念匹配的公开基准上，用同底座、同 harness，以及空记忆/安慰剂/随机等对照，论证记忆机制带来可归因增益的评测。
_避免使用_：评测冒烟跑通、单次无对照的榜分数

**评测报告（Evaluation Report）**：
一次评测运行的可复现记录（含命令、底座、子集、分数与时间），落在 Edges 评测工作区中的报告落点，用于日后对照，不是知识资产本身。
_避免使用_：Edge、研究笔记里的口头分数、任务描述里的声称结果

**知识库 Observation 系统**：
面向知识库运行时的 traces / logs / dashboard 产品语义：看到检索、读写、代理使用过程与异常。
_避免使用_：自托管 Langfuse、自部署 Langfuse（若指 Observation 产品）、Evaluation（打分裁判）、仓内 `observation/` 运营笔记目录（若指同一产品）

**自托管 Langfuse**：
自运维的 Langfuse 实例，用作 LLM/Agent 可观测后端候选。看板卡名是「自部署 Langfuse」。
_避免使用_：知识库 Observation 系统、Observation 产品、Langfuse Cloud（若指 v1 部署目标）、云 VPS（若指 v1 宿主）、Windows 日常桌面（若指 v1 正常运行路径）、公网 HTTPS / 反代（若指 v1 访问）、把 `.env` 或密钥提交进本仓、HA 或定时机外备份（若指 v1 数据面已具备）、一次接上全部 Grok / edges Agent（若指本卡 v1 验收）

**知识管理 Agent（Knowledge Management Agent）**：
在人设定的目标、授权与风险边界内，承担研究、提炼、检索、部署和反馈处理的主动知识资产管理者。
_避免使用_：被动文件工具、自主决策者、无人监督的基金经理

**决策收益（Decision Return）**：
知识调用相对原有判断或替代方案带来的可观察改善，包括判断质量、行动效果、决策速度、认知成本和外部反馈的变化。
_避免使用_：文档数量、内容产量、必然可货币化的回报

**认知复利（Cognitive Compounding）**：
知识复用产生的收益与使用反馈被重新投入知识闭环，使未来研究成本下降、判断质量提高的累积效应。
_避免使用_：文件积累、信息囤积、一次性收益

**Edge 组合（Edge Portfolio）**：
由多个相互补充、交叉检验并服务于不同决策的 Edge 构成的认知资产组合。
_避免使用_：目录分类、知识总量、需要固定配置比例的金融组合

**知识流动性（Knowledge Liquidity）**：
知识资产能够被快速、可靠并带着必要上下文检索和部署到决策中的程度。
_避免使用_：搜索结果数量、正式评分、知识质量

**认知风险（Cognitive Risk）**：
Edge 因证据不足、超出适用边界、环境变化或新证据反驳而降低决策质量的可能性。
_避免使用_：任何不确定性、金融风险指标、单纯缺少资料

**Note**：
不要求预先形成目标或结论的轻量知识捕获，可作为 Edge 的原材料。
_避免使用_：专项、Edge、任意 Markdown 文件

**复盘四栏**：
整理对话 Note 时使用的四段结构（背景→过程→所学→行动指南），灵感来自 After Action Review，但不是官方 AAR 模板本身。
_避免使用_：Facts–Insights–Actions、主要结论/认知更新旧三分法、官方 AAR 模板（若指本结构）

**背景（对话整理）**：
复盘四栏的第一栏：这次对话为何发生、意图与议题。
_避免使用_：讨论主题（若指本栏）

**过程（对话整理）**：
复盘四栏的第二栏：对话中实际发生的事实，评价尽量少。
_避免使用_：主要结论、Facts（若指本栏）、所学的同义改写

**所学**：
复盘四栏的第三栏：可带走再用的判断，不是过程的复述。
_避免使用_：认知更新、Insights、过程栏的复述

**行动指南（对话整理）**：
复盘四栏的第四栏：带触发条件与具体做法的行动说明。
_避免使用_：裸待办清单、Actions（若指本栏）

**对话三角色（笔记 / 记忆 / 任务）：**
同一段对话可以分出三类产物，不要揉成一张：`conversation-to-notes` 记「这次澄清了什么」（复盘四栏）；`project-memory-remember` 记「以后还该记住什么」（结论 → 为何 → 做法）；`conversation-to-tasks` 记「谁下一步做什么、怎样算完」（背景 → 目标 → 完成标准；动作可选；背景须写出产生任务的对话过程，完成标准给循环验收）。三个整理技能都只成文；写入笔记仓、记忆树或任务看板，各自是另一步。
_避免使用_：把任务写成记忆结论；把复盘笔记写成看板待办；在整理技能里直接调用命令行写盘；正文栏名中英混写；动作可选却拿它顶替完成标准；背景只有出处标签、没有对话过程

**专项工作区（Initiative Workspace）**：
围绕一个明确目标持续组织材料、状态和产出的有边界工作空间；可直接产生需要提炼为 Edge 的经验。
_避免使用_：长笔记、主题分类、知识资产

**项目工作区（Project Workspace）**：
以解决问题或交付产出为目标的专项工作区。
_避免使用_：教学工作区、专题笔记

**Edges 扩展（Edges Extension）**：
因 Agent 或外部系统需要接入、操作 Edges 而存在的可复用能力。
_避免使用_：共享扩展、通用 Agent 工具

**能力面（Capability Surface）**：
Agent 与人发现并调用 Edges 扩展能力的入口集合；本仓定为 CLI、Skill 与 MCP 三者。
_避免使用_：仓根 `bin/`、把 npm `package.json` 的 `bin` 字段当成单独一层、仅 CLI+Skill（漏掉 MCP）

**CLI**：
以 `edges` 为名的命令行界面（含 `note`、`tasks`、`artifacts` 等子命令）；人和有 shell 的 Agent 共用同一套命令与契约。
_避免使用_：仓根脚本、`edges-note`、把 CLI 定义为「bin entry」

**Skill（调用说明）**：
教 Agent 何时、如何调用能力面的说明性能力包：有 shell 则调 CLI，无 shell 则调作为对等能力面入口的 MCP；不承载 git 或入库实现。
_避免使用_：实现脚本目录、仓根 `bin/` 封装、业务逻辑真源

**MCP（Edges）**：
在无 shell 宿主上暴露 Edges 扩展能力的机器入口；与 CLI、Skill 同属能力面，调用同一套领域契约而非另一套产品。
_避免使用_：唯一入口、替代 CLI、直连仓根脚本（已否决）

**共享 Agent Harness（Shared Agent Harness）**：
不依赖 Edges 仍有价值，并可跨机器、跨 Agent 客户端使用的个人 Agent 能力。
_避免使用_：Edges 扩展、连接器

**教学工作区（Teaching Workspace）**：
以学习进展和能力获得为目标的专项工作区。
_避免使用_：笔记、Edge、项目工作区、教学站点（若指公网入口）

**教学站点（/teaching/）**：
与教学工作区对应的公网持久入口，固定路径 `/teaching/`，与其它 edges 衍生站同一阿里云 ECS 路径心智。
_避免使用_：教学工作区（若指公网入口）、Artifacts 预览服务、`/tasks/` 持久看板站

**Post**：
从知识资产或专项成果编辑而来的对外发布物；它是知识资产部署后的输出，把知识闭环接入读者与公共讨论，但不替代其来源知识。
_避免使用_：最终形态的 Edge、内部知识真源

**知识调用（Knowledge Invocation）**：
在新问题中检索并部署 Edge，使其影响判断或行动，并用产生的决策收益继续检验原判断。
_避免使用_：阅读、发布、归档

**知识出口（Knowledge Outlet）**：
让活跃知识跨越当前系统边界、被更多人或外部系统消费的闭环扩展点，包括对外发布和机器可读的检索接口。
_避免使用_：终点、Archive、知识目录、备份

**知识闭环（Knowledge Loop）**：
研究线索经认知资本投入形成 Edge，Edge 被调用后产生决策收益，使用结果、外部反馈和新洞察再投入知识生产的循环；它可以通过知识出口连接更多参与者，形成更大的嵌套循环。
_避免使用_：笔记入库、单向发布、Archive

**受控自进化（Controlled Self-Evolution）**：
知识闭环的反馈持续改善知识资产以及 Agent 的记忆、检索、工具和工作流，但重要变更仍由人判断和采纳的演化方式。
_避免使用_：无人监督的自治、自动更新、Recursive Self-Improvement

**递归自我改进（Recursive Self-Improvement）**：
系统不仅产生改进，还能改进其发现问题、评价结果和实施改进的机制。
_避免使用_：普通反馈闭环、知识更新、未展开的 RSI

**Archive**：
暂存从活跃知识空间移除、但仍需保留来源和恢复可能性的材料；它是退出机制，不是知识出口。
_避免使用_：知识出口、历史知识库、失效 Edge 专区

**Task**：
跨 Agent 接力的工作项（idea 捕获后经细聊与开发直至收口）；分组属 Task Project，再按 edges-tasks-status 分夹；需求先后用 edges-task-priority，不改状态夹。
_避免使用_：todo（若指工作项本身）、普通勾选清单、Multica 式可抢单队列条目、`tasks` Memory Type（若指看板工作项）

**Task stem（edges）**：
Task 文件去掉 `.md` 的文件名，是 `edges tasks` 的查找键；不是展示标题，也不等于 frontmatter / 文档 `name`（三者常碰巧相同）。
_避免使用_：title、name、把展示名当 CLI 查找键

**Task Project（edges）**：
看板内对 Task 的分组单位（对齐 Multica Project 概念，本轮不做完整 parent/stage）；约定目录为 `knowledge/tasks/<project-slug>/`，未分组用保留名 `_default`。每个已存在的 project 带标题与描述，是用户已设的分类质心；索引与 per-project AGENTS.md 只在元数据层，看板 markdown 仍是 Task 真源。
_避免使用_：把 edges-tasks-status 当 project、用任意深层目录当 project、根下直接放 status 夹（迁移后）、项目工作区（若指看板分组）、把 Task Project 当 Memory Type、把未确认的候选当成已有 project

**Task Project 索引**：
`knowledge/tasks/AGENTS.md` 里、project-memory 受管标记之外的 Task Projects 节；由 CLI 维护各 project 的标题与描述指针，只做索引/描述层（Q18=A），不把每条 Task 升成 Memory Type。
_避免使用_：手改该节、把它当 Memory Type 入口、把看板文件当记忆条目

**Task Project AGENTS.md**：
每个 Task Project 目录（含 `_default`）内的轻量 `AGENTS.md`，写标题与描述（可选指针）；不是对该目录做完整 `project-memory-init`。
_避免使用_：每 project 一套完整项目记忆、把 Task 文件登记为 Memory Type

**Task Project 候选（edges）**：
proposeTypes 输出的一行：建议 slug、描述，以及支撑该类型的 `_default` Task stem 列表（文件名去 `.md`，不是 title）。人确认并 `project create` 之前还不是 Task Project。
_避免使用_：已落盘的 Task Project、自动当成质心、Memory Type

**Task Doc（edges）**：
一份 Task 的文档：`name`、`description`、`metadata`，以及 Markdown 正文 `body`。字段约定独立于某一页；CLI 的 frontmatter 与看板条目嵌入的文档对齐同一形状。
_避免使用_：自造轻量配置、看板专用的另一套文档、预编译 HTML 正文、Task stem、edges-title（若指 `name`）

**Task Project 审阅页（edges）**：
classifyTasks、proposeTypes、本地 `edges tasks project review-page` 与 `/tasks/` 共用的那一份审阅壳：由 CLI 渲出的 HTML，载荷仍是通用 groups+items。组是已有 Task Project 还是 proposeTypes 候选由调用方 Skill 解释；审阅页本身不是 Task Project，也不是分类算法，也不负责托管。页仍只渲染。
_避免使用_：把它当 Task Project、当分类算法、`--mode`、把它当 Artifacts 预览服务、让 review-page 负责发布、把它当成 `/tasks/` 站点本身、status station、按用途再拆一壳

**审阅壳（Review Shell）**：
Task Project 审阅页这一份交互界面。仓库只留下源码和构建管线：源码在仓根 `apps/tasks-review-app/`（包名 `tasks-review-app`，与 CLI 分开，`apps/` 可再放别的预构建壳），产物在 `extensions/clis/src/tasks/project/assets/review-page/`（`index.html`、`review.js`、`review.css`）且不入库，由 `build:tasks-review-app`、prepack、CI 或 ECS 部署链生成。Vite 把产物写进 CLI 那份目录；`review-page.ts` 只读产物，不读 `apps/` 源码。写出的页把预构建 JS/CSS 内联成一份 HTML，数据是页内 JSON script `#edges-review-payload`。导航是 hash 或 hash 上的 query，同一份产物用于 `file://`、Artifacts 与 `/tasks/`。左栏是 Task Project：点选既是筛选也是拖放落点，拖到左栏只改 project。中栏是按 edges-tasks-status 分的列，只展示状态。右栏展示所点条目的 Task Doc 正文。顶栏筛全文、edges-task-priority、edges-task-assignee 与 edges-tasks-status。
_避免使用_：三套页面、status station、本轮在中栏改状态、把语义检索算进这份壳、用另一套看板产品充当 Task 的领域模型、在用户机器上现编这份壳、把预构建产物提交进 git、默认用 zip+base64 装载荷、path history、靠服务器 rewrite 的 react-router

**`/tasks/` 持久看板站**：
固定公网路径 `/tasks/` 上的持久入口，始终反映 main 看板；部署链从看板生成分组列表，经薄映射喂给同一审阅壳。页内文档来自分组条目嵌入的 Task Doc。不是新的 status station 产品，也不是 Artifacts 短 TTL 预览。
_避免使用_：status station、Artifacts 预览服务、把它当 Task Project 审阅页命令本身、本轮按 project 拆 URL 树、本地 HTML 视图、教学站点、浏览器去读仓内 `.md`、本轮把页上拖拽写回 git

**分组列表 schema（edges.tasks.grouped）**：
`edges tasks list --group-by project` 产出的松耦合分组契约（`edges.tasks.grouped/v1`）：`groups[]` 与 `items[]` 组成的看板快照，不按审阅页命名、也不专属于 review-page。条目可带可选字段，尤其是对齐 Task Doc 的 `doc`；审阅页经薄映射使用同一对象。
_避免使用_：review-page 输入 schema、把它叫 review-page JSON、把扁平 list 当成分组契约、平行的看板顶层 schema

**doc（看板条目）**：
分组列表 `items[]` 上可选嵌入的 Task Doc（`name`、`description`、`metadata`、`body`）。审阅页只读页内 JSON 里的这份文档。
_避免使用_：另开看板顶层 schema、浏览器读取磁盘 `.md`、生成器里的预编译 HTML 正文

**审阅导出行（edges）**：
Task Project 审阅页导出 JSON 的一行：`stem`、`current`、`suggested`、`action`，可选 `note`。查找键是 Task stem，不是 title 或 `name`。
_避免使用_：用 title 或 name 当查找键、把展示字段当 apply 键

**classifyTasks（edges）**：
独立工作流 Skill（约定路径 `extensions/skills/project-tasks-classify/`，展示名 classifyTasks）：以用户已设、带描述的 Task Project 为质心，对整板做归属建议（LLM / agent 判断，不要求 embedding），经 Task Project 审阅页给人改组（无 GUI 时 Markdown 建议表回退），人贴回审阅导出行后再经现有 CLI 落地。新类型由 proposeTypes 另议，本 skill 不自动建 project。
_避免使用_：通用 edges-tasks Skill+MCP CRUD、自动批量建 project、Embedding NCC、K-means 命名、要求 embedding / 向量分类、只整理 `_default`、公开 `edges tasks classify`、把审阅页当成分类器

**proposeTypes（edges）**：
独立工作流 Skill（约定路径 `extensions/skills/project-tasks-propose-types/`，展示名 proposeTypes）：从 `_default` Task 与已有 Task Project 质心提议新的 Task Project 候选，复用同一 Task Project 审阅页给人确认（无 GUI 时候选表回退），本身不落地为 Task Project。
_避免使用_：并进 classifyTasks、自动建 project、Embedding NCC、K-means 命名、公开 `edges tasks propose`、为 proposeTypes 另开 `--mode`

**edges-task-project**：
frontmatter `metadata.edges-task-project`，与目录 project-slug 双写；`_default` 对应 `default` 或不写字段。
_避免使用_：只改 frontmatter 不改路径、或只改路径不同步 frontmatter

**edges-tasks-status**：
Task（Issue 层）的唯一状态字段，取值为 backlog | todo | in_progress | in_review | done | blocked | cancelled；与 Task Project、edges-task-priority 正交，不表达谁先做或属于哪个分组。迁移后状态夹落在所属 Task Project 目录内。
_避免使用_：裸 status 字段名、Run 层状态、open/discussing/building 旧枚举、把状态夹当成 Task Project

**edges-task-priority**：
Task Issue 层的需求优先级，枚举 `urgent | high | medium | low | none`，写在 frontmatter `metadata.edges-task-priority`；与 edges-tasks-status、Task Project 正交，不决定状态夹或 project 目录。缺省或旧文件无字段时视为 `none`。
_避免使用_：用文件夹或文件名编码优先级、把 P0/P1 事故等级直接当看板 priority、改 priority 时搬状态夹

**edges-task-assignee**：
Task 的指派，写在 frontmatter `metadata.edges-task-assignee`；与 edges-tasks-status、edges-task-priority、Task Project 正交。
_避免使用_：用状态夹或 Task Project 表达谁负责、在看板条目上再造一份与 Task Doc 平行的必填指派字段

**edges tasks（CLI）**：
以 `edges tasks` 为入口的 Task 看板命令面：Issue 层 list/get/create/update/status；Run 层只读 runs / run-messages。create/update 用 `--priority`，list 可用 `--sort priority`；`list --group-by project` 产出分组列表 schema（`edges.tasks.grouped/v1`，不绑 review-page），条目可嵌入可选的 Task Doc（`doc`）；`status` 不带优先级，只在同一 Task Project 内搬家；跨 project 用 `update --project`。`project list|get|create|update` 读写 Task Project 元数据；`project review-page` 只读不入库的预构建审阅壳，把 JS/CSS 内联成单份 HTML，把 groups+items 写成 `#edges-review-payload` 的 JSON script，不算分类、不落地、不托管，运行时不现编，页只读载荷里的 `doc`，导航用 hash 或 hash 上的 query。`/tasks/` 持久看板站是部署链消费者，不新开看板动词。
_避免使用_：手搓 git 改看板、仓根 bin、自造 `log` 动词顶替 runs/run-messages、用 status 跨 project 搬家、公开 `classify` / `propose` / `apply-review` 动词（本轮）、把 review-page 扩成 Artifacts 预览服务或 `/tasks/` 托管、把分组 schema 命名成 review-page 专属、为看板另开顶层 schema、让浏览器读仓内 `.md`、在用户机器上现编审阅壳、把预构建产物提交进 git、默认用 zip+base64 装载荷、path history、靠服务器 rewrite 的 react-router

**Artifacts 预览服务**：
稳定的短生命周期托管 + 真浏览器可开 URL，用来打开需要人交互的 Agent HTML；聊天内嵌预览是绕开的不可靠路径。与 `/tasks/` 持久看板站硬边界：后者是固定路径、无 TTL、始终反映 main。
_避免使用_：长期站点/博客、Astro、site-and-content、本地 HTML 视图、聊天 HTML 预览、审阅结果回传 Agent 客户端（若指同一件事）、`/tasks/` 持久看板站、教学站点

**Artifact（edges）**：
一次短生命周期托管的静态包（通常是交互 HTML）；不是知识资产，也不是对外 Post。
_避免使用_：Post、知识资产、长期站点页面、聊天附件预览、`/tasks/` 持久看板站

**edges artifacts（CLI）**：
`edges artifacts` 命令面：薄 `init`/token 与 `publish`/`rm`。`edges tasks project review-page` 仍只渲染，不发布。
_避免使用_：把 review-page 扩成托管、手搓上传绕过 CLI

**聊天 HTML 预览**：
Agent 客户端把 HTML 嵌进聊天窗口的预览（如 Grok Bot HTML preview）。
_避免使用_：Artifacts 预览服务、系统浏览器打开的托管 URL、把它当交互闸门

**本地 HTML 视图**：
对着仓内数据文件的持久本机/仓内查看层（数据与视图分离），不是一次性渲出的人闸，也不是对外可达的短生命周期托管，也不是公网 `/tasks/` 持久看板站。
_避免使用_：Artifacts 预览服务、云临时托管、Task Project 审阅页的临时 HTML、`/tasks/` 持久看板站

**Task Run（edges）**：
对应 Multica Run 的一次执行尝试；仓内落在 Task 同目录 sidecar `.{stem}.log.md` 中带稳定 `run-id` 的记录，由 `edges tasks runs` / `run-messages` 只读查看。
_避免使用_：把 Run 状态写成 Issue 的 edges-tasks-status、用行号当长期主键

**Task Run Log**：
某个 Task 的 Run 落盘载体：同目录、同 stem 的点文件 sidecar（`.{stem}.log.md`），由记录方只追加带稳定 `run-id` 的执行记录，不写入 Task 正文。本轮 `edges tasks` CLI 只经 `runs` / `run-messages` 读取。
_避免使用_：正文内【执行记录】表、把 Run 嵌进 frontmatter、自造 `log` 动词顶替 runs/run-messages

**backlog（Task）**：
tasks 层内「已进入任务系统但未排期」的筛选池；也是 agent 衍生提案的默认入口。人侧存量从旧 todos 迁入时默认落此态。
_避免使用_：knowledge/todos 系统外池、Draft
