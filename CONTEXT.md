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
项目记忆中一条记忆归入哪份入口的分类；对应一层入口文件 + 内容目录（及条目前缀约定）。类型集合由 LAYOUT 实现与本层登记决定，不是 PROTOCOL 闭集枚举。
_避免使用_：把 type 写成全局 JSON 注册表键、把看板 `knowledge/tasks` 状态夹直接叫 Memory Type

**用户记忆（User Memory）**：
项目记忆的一种 Memory Type，保存绑定到某一仓库路径、且不宜公开的个人材料（个人偏好而非项目共享约定、凭据与密钥，以及其他不得公开的上下文）；权威副本在该仓库工作树内，但不进入版本历史。它不是独立于项目记忆的全局层，也不把私有仓当作真源。
_避免使用_：独立全局 vault、edges-private 当真源、机器级单一记忆库、项目共享约定

**可扩展 Memory Type**：
在指定记忆目录通过 skill（如 `$project-memory-add-type`）登记新的 Memory Type（name / description / 可选特权 metadata），与内置种子类型同构、可被 remember / ask / doctor 发现；官方 init 种子不因示例类型膨胀。
_避免使用_：单独 JSON/YAML 总配置平面、把示例 type 写进默认种子

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
以 `edges` 为名的命令行界面（含 `note`、`tasks` 等子命令）；人和有 shell 的 Agent 共用同一套命令与契约。
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
_避免使用_：笔记、Edge、项目工作区

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
跨 Agent 接力的工作项（idea 捕获后经细聊与开发直至收口）；先按 Task Project 分到 knowledge/tasks/<project-slug>/，再按 edges-tasks-status 分夹；需求先后用 edges-task-priority，不改状态夹。
_避免使用_：todo（若指工作项本身）、普通勾选清单、Multica 式可抢单队列条目、`tasks` Memory Type（若指看板工作项）

**Task Project（edges）**：
看板内对 Task 的分组单位（对齐 Multica Project 概念，本轮不做完整 parent/stage）；目录为 `knowledge/tasks/<project-slug>/`，未分组用保留名 `_default`。
_避免使用_：把 edges-tasks-status 当 project、用任意深层目录当 project、根下直接放 status 夹（迁移后）、项目工作区（若指看板分组）

**edges-task-project**：
frontmatter `metadata.edges-task-project`，与目录 project-slug 双写；`_default` 对应 `default` 或不写字段。
_避免使用_：只改 frontmatter 不改路径、或只改路径不同步 frontmatter

**edges-tasks-status**：
Task（Issue 层）的唯一状态字段，取值为 backlog | todo | in_progress | in_review | done | blocked | cancelled；状态夹位于所属 Task Project 目录内，与 Task Project、edges-task-priority 正交，不表达谁先做或属于哪个分组。
_避免使用_：裸 status 字段名、Run 层状态、open/discussing/building 旧枚举、把状态夹当成 Task Project

**edges-task-priority**：
Task Issue 层的需求优先级，枚举 `urgent | high | medium | low | none`，写在 frontmatter `metadata.edges-task-priority`；与 edges-tasks-status、Task Project 正交，不决定状态夹或 project 目录。缺省或旧文件无字段时视为 `none`。
_避免使用_：用文件夹或文件名编码优先级、把 P0/P1 事故等级直接当看板 priority、改 priority 时搬状态夹

**edges tasks（CLI）**：
以 `edges tasks` 为入口的 Task 看板命令面，覆盖 Issue 层 list/get/create/update/status，以及 Run 层只读的 runs / run-messages。create/update 用 `--priority`，list 可用 `--sort priority`；`status` 不带优先级，且只在同一 Task Project 内改状态。后续跨 project 用 `update --project`（或等价入口），不靠 status。
_避免使用_：手搓 git 改看板、仓根 bin、自造 `log` 动词顶替 runs/run-messages、用 status 跨 project 搬家

**Task Run（edges）**：
对应 Multica Run 的一次执行尝试；仓内落在 Task 同目录 sidecar `.{stem}.log.md` 中带稳定 `run-id` 的记录，由 `edges tasks runs` / `run-messages` 只读查看。
_避免使用_：把 Run 状态写成 Issue 的 edges-tasks-status、用行号当长期主键

**Task Run Log**：
某个 Task 的 Run 落盘载体：同目录、同 stem 的点文件 sidecar（`.{stem}.log.md`），由记录方只追加带稳定 `run-id` 的执行记录，不写入 Task 正文。本轮 `edges tasks` CLI 只经 `runs` / `run-messages` 读取。
_避免使用_：正文内【执行记录】表、把 Run 嵌进 frontmatter、自造 `log` 动词顶替 runs/run-messages

**backlog（Task）**：
tasks 层内「已进入任务系统但未排期」的筛选池；也是 agent 衍生提案的默认入口。人侧存量从旧 todos 迁入时默认落此态。
_避免使用_：knowledge/todos 系统外池、Draft
