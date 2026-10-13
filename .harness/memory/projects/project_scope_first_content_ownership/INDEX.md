---
name: project_scope_first_content_ownership
description: 递归目录与 harness 的现行决定及理由；模型与公开目录已采用，历史讨论保留但不替代现行 spec，私有材料逐克隆审阅。
metadata:
  edges-title: 递归目录采用统一节点模型与自身维护空间
  edges-type: project
  edges-agent-client: codex
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T05:44:51+08:00'
---
## 2026-10-05 现行结论：目录节点模型已收敛

用户确认目录为统一内容单元，物理目录决定唯一父归属，索引承担本层／下层发现；harness 是独立维护关系，遍历组成不自动进入下一层 harness。

**Why:** 让内容与附件共享生命周期，同时防止检索维护内容时无限进入它自身的维护系统。普通跨目录引用不得改变所有权，局部记忆不得因通用递归而上收根层。

**How to apply:** 现行合同见[目录节点模型](../../../../docs/superpowers/specs/2026-10-05-directory-node-model.md)及[迁移指南](../../../../docs/recursive-layout-migration.md)。模型与 CLI 已接入、公开目录采用已完成；旧日志仅检查存在性并拒绝目录转换，不读取其私有快照。本轮不处理真实私有材料、不建设 extensions/memory，也不把 Agent Teams 或自动 RSI 宣称为已交付。

## 历史讨论记录（以下“尚未实现／待讨论”仅指当时）


## 2026-10-05 用户确认：Project Memory 执行层统一 TypeScript

**2026-10-05 现行状态：**节点类与 `NodeService` 已接入正常 Task、Memory、Note 操作；有可读 `AGENTS.md` 的目录可被 CLI 选择为节点，不再有独立责任资格门槛，且发现节点不自动 Init。入口保持三部分，43 条公开局部记忆已按当前字节恢复到原所有者：`extensions` 16、`project-memory-init` 17、`shared-extensions` 1、`knowledge/notes` 1、原 Tasks 8 归 `.harness/tasks`。其他克隆的私有纠正仍按可信本机 journal 显式审阅。下方带日期的“待实现”与旧目录判断是当时记录，不应替代此状态；详情见 [ADR 0024](../../../../docs/adr/0024-scope-first-content-ownership.md) 与 [纠正计划](../../../../docs/superpowers/plans/2026-10-05-recursive-node-ownership-correction.md)。

用户确认把原 Python 执行能力迁入 `edges memory`，Skill 保留推理、内容规范与人审流程，模板仍由 init Skill 提供并随 CLI 构建分发。记忆读写、索引、显式迁移及私有归档共享 CLI 的 TypeScript 实现与基础 Markdown/YAML codec。

**Why:** 避免 Python 脚本与 CLI 各维护一套执行行为，也避免 Skill 安装路径成为运行时依赖。

**How to apply:** 下文早期记录里的“Python 尚未接入 / Python 迁入 CLI 待完成”仅描述当时状态，已由本次迁移取代。新领域类模型、统一节点识别、43 条局部记忆归属修复仍独立推进；不得将执行语言统一视为这些工作已经完成。`conversation-to-tasks` 已调用 CLI；本次不改写 conversation-to-notes 的写作和发布流程。验证见 [TypeScript 迁移计划](../../../../docs/superpowers/plans/2026-10-04-project-memory-typescript.md)。

## 2026-10-04 用户确认：统一递归节点模型

用户否定将“下层作用域”与“工作与模块入口”解释为两套节点类别，并明确选择统一节点模型。后续架构修订以统一递归节点为基础，不以“具有独立目标、决策和验证责任”作为额外的节点资格门槛。

**Why:** 用户最初要求的是以 Project Memory 为基础的通用递归组织；一个对象能作为上层内容，同时拥有自己的维护空间。“作用域”与“模块”描述的维度不同，不能把二者作为互斥的入口类别；也不能以必须拥有完整任务、记忆和约束来认定节点。

**How to apply:** 修订入口、协议和工具识别规则时优先遵循这次纠正。具体节点识别及与各内容契约的衔接仍待设计，AGENTS 章节沿用下文已确认的三部分；不要把未讨论的具体规则当成已确认结论。以下记录保留 2026-10-03 的设计与已实现状态，其中独立作用域门槛及相应入口分类已被本次用户纠正，不能继续作为当前设计依据；实现尚未按本次纠正修改。

## 2026-10-04 用户确认：沿用 Project Memory 原有三块骨架

每个 AGENTS.md 节点沿用 Project Memory 的三部分：本层重要约束（现有章节名为“本层硬约束”）、本层记忆、下层记忆索引，分别承载本层规则、本层材料和递归下层入口。用户进一步确认，tasks 等新增内容暂时注册在这三部分内，不另增入口章节；README 的“递归树结构”须直接讲清这项约定。

**Why:** 此次目标是基于 Project Memory 扩展统一递归节点与 harness。此前提出额外五个章节、随后压成“规则＋索引”，均未承接原有模型，用户未接受。新增能力应先复用原有入口骨架。

**How to apply:** tasks 等新增内容的规则和入口按职责、归属纳入三部分；下层索引仍可跨物理目录层级。入口登记不等于把 Task 正文改成普通记忆条目，也不改变局部记忆归属。三部分之外不另造通用章节；具体登记格式和工具适配尚待落实，本次仅更新设计文档。

## 2026-10-04 用户纠正：子节点记忆保留原归属

用户指出把子目录 .memory 汇总到仓库顶层是不正确的。统一递归节点模型应保留各节点自己的局部记忆；从 .memory 升级到 .harness 是本节点内部布局转换，不能因此将子节点材料上收根节点。

**Why:** 共享实现由根层维护，不意味着源码目录、模块或内容目录的局部上下文也必须集中存储。跨层复用与发现通过引用实现，不应以撤除局部节点、合并记忆来替代递归。

**How to apply:** 后续修订应按原节点归属恢复局部记忆和入口；节点目录整体搬迁时，记忆随节点搬迁，类型按已确认的 memory/skills 布局转换。停止沿用先前清单中依据“不是独立责任主体”把 extensions、shared-extensions、knowledge/notes、knowledge/tasks、extensions/skills/project-memory-init 的局部记忆并入根层的判断。对原节点被拆分等无法直接一一映射的情况，需单独明确归属，不能再次默认并入根或随意复制。这次只记录纠正，尚未搬回文件；先前清单的43条根层合并与相关索引处理仍待修订。

## 2026-10-04 用户确认：CLI 与公共节点逻辑解耦

作用域、节点关系及树结构递归需要从 CLI 命令和各业务模块中解耦，作为可复用的公共能力。

**Why:** 递归节点模型服务整个系统，不应由 CLI 或 Tasks 独占定义，也不应让不同入口各自实现一套节点语义。

**How to apply:** 公共能力、CLI 适配和业务操作保持边界；公共层不依赖业务错误类型，逻辑下层引用与物理目录遍历分开表达。本次已抽取公共节点能力并接回 CLI，见[实施计划](../../../../docs/superpowers/plans/2026-10-04-node-tree-cli-decoupling.md)。CLI 暂保留原有识别策略和 Tasks 物理清查，以便独立验证解耦；统一节点策略切换、Python 接入及局部记忆恢复继续按整体方案推进，不将本次抽取视为整套目录重构完成。

## 2026-10-04 历史实现：领域模型、编解码与文件适配分离（后续改为实例方法）

节点的领域模型、Markdown 解析与序列化、文件系统读写分别承担职责。用户在 CLI 公共能力抽取后进一步要求落实这项解耦。

**Why:** 把原文、AST、路径和业务内容混成一种结构，会让非 CLI 调用方继续依赖特定格式和存储；三部分节点模型应当能够独立消费和修改。

**How to apply:** 模型只表达本层重要约束、本层记忆、下层记忆索引及引用关系。格式转换不解析物理路径、不读写文件；文件适配处理位置与保存，组合层再接回 CLI。序列化保留未修改原文和未知扩展，无法保留时明确拒绝；文件保存校验原文与文件身份，不静默覆盖其他编辑。本次实现与验证见[模型与 codec 解耦计划](../../../../docs/superpowers/plans/2026-10-04-node-model-codec-separation.md)，不据此宣告整仓目录迁移或 Python 接入完成。

## 2026-10-04 用户确认：可选 YAML 头是公共 Markdown 能力

Task、Memory、AGENTS.md 底层都是可能带 YAML frontmatter 的 Markdown。公共模型提供可选 metadata 字段，AGENTS.md 进一步约定三部分章节、HTML 注释标记与索引关系；现用 project-memory 标记是 HTML 注释，不是 XML 标签。

**Why:** 多类文档需要相同格式处理，但字段含义与正文约定不同。把 YAML 解析写回放在公共层，可以避免每个业务各写简化解析器。

**How to apply:** 文档 codec 只处理可选 YAML 头和不透明正文；节点 codec 与 Task 适配层分别解释各自语义。无头部保持可用，不强制添加 description 等字段。公共模型 metadata 表示整个头部，不与 Task 头部里的同名嵌套字段混为一谈。已实现公共能力并接回 Tasks；Python Memory 尚未接入，Task Project 无头部规则仍由领域校验器执行。用户确认直接采用 gray-matter 默认解析和序列化，不自定义格式行为。此前精确保留字段尾换行、日期字符串、注释和样式等是额外目标，不继续作为需求；文档不符合约定时修正文档，不扩展解析器兼容。见[可选 frontmatter 实施](../../../../docs/superpowers/plans/2026-10-04-optional-frontmatter.md)。

## 2026-10-04 用户修正：工具放 CLI utils，统一 TypeScript

公共节点与文档能力直接放在 extensions/cli/src/utils/node-tree，不必单独创建 package；使用 TypeScript，不用 JavaScript + JSDoc 代替。frontmatter 只直接使用 gray-matter 默认 parse/stringify，不额外直连 js-yaml，不维护自定义 YAML engine、schema 或 AST 编辑。

**Why:** 模型、格式与存储的解耦是模块边界，不等于必须增加包、workspace 依赖和预构建流程；复用成熟库可避免自制语法解析器。

**How to apply:** 保留 model、codec、filesystem、repository 与遍历接口，通过 CLI 内相对导入复用，随 CLI 编译、通过现有 tsx 运行源码。保留可选 metadata/body 与 type、树关系接口；文档封装只映射库返回值，日期、别名、分隔符、空头部和换行采用库默认行为。仅拒绝非 YAML 语言声明以避免执行文档代码。Task 等领域保留自身字段校验，需要字符串的日期在文档中加引号。AGENTS 正文的章节编辑规则仍适用。已删除独立包及其构建依赖，测试并入 CLI。这里的 utils 位置不改变作用域归属或节点模型语义，也不代表 Python Memory 已接入。

## 2026-10-04 用户确认：document-model 支持可选树关系

MarkdownDocument 增加可选 id、parent、children；用户确认父子关系使用文档引用，不直接嵌套子文档对象。引用包含 target 和可选 label。

**Why:** 通用 Markdown 文档也可以参与递归组织，引用支持跨物理目录层级与按需加载，不要求普通文档先成为 AGENTS 节点。

**How to apply:** 这些字段由调用方组树时提供；children 省略表示未指定，空数组表示没有子文档。逻辑父节点不按目录祖先推断。通用文档 codec 只读写 metadata/body，不自动把树关系写入 YAML；头部已有同名字段仍作为普通 metadata 保留。AGENTS 的三部分章节与文件适配继续在各自层实现，不为此新增第四部分。

## 2026-10-04 用户要求：文档 type 区分处理方式

document-model 增加可选 type，内置 base、agents、memory、task；各类型可以使用不同的 parse、serialize。DocumentCodec 泛型允许不同的解析结果模型，公共 YAML/Markdown 处理复用底层库。

**Why:** 共享文档基础格式不代表正文规范与处理方式相同；AGENTS 的章节模型、Task 的字段投影不能都塞进基础格式规则。

**How to apply:** 由调用方显式选择 codec，省略 type 表示未标记；未选专用处理时使用 base，不根据 YAML 分类字段自动猜测。AGENTS codec 复用 NodeModel 解析与写回；Task codec 留在 Tasks 领域模块并接入原有字段读写；Memory 暂时复用基础格式，不据此宣称 Python Memory 已接入。type 不自动写入 YAML，与 metadata.edges-type 的 project、feedback 等内容分类不同；专用格式可实现自己的 DocumentCodec，无需独立包或全局注册框架。

## 2026-10-04 用户确认：节点模型共同归组与实例解析

采用具有操作方法的节点领域模型：BaseNode 为 InternalNode、TaskNode、MemoryNode 提供共同能力，公共 NodeService 协调节点关系。模型统一放在 models，services 负责完整增删改查（create、get/list、update、destroy）及文档、归属索引同步，不设置顶层 codecs。model 的领域操作只修改内存状态，不执行文件读写；service 的 get/list 读取文档并调用实例 parse，作用域遍历由 service 内部辅助函数组织。解析辅助代码需要拆分时留在对应模型内。

**Why:** 用户指出此前纯数据与外部工具函数的组织不符合预期；继承应能扩展实例行为，职责分离不应机械变成顶层目录分离。

**How to apply:** parse(markdown): this 与 serialize(): string 均为实例方法；Base 负责通用文档流程，子类通过 parseBody/serializeBody 扩展正文处理，构造函数不调用虚方法。Internal 的 children 包含所有直属节点，但从 AGENTS 原有三部分的归属索引派生，不独立存储第二份可修改数组；普通交叉引用与归属区分。parent 与 children 由 BaseNode 提供，允许缺省；parent 为组树上下文，Task/Memory 字段从 metadata 解释，均避免重复真源。继续遵守 TypeScript、无需独立 package、gray-matter 默认 YAML 行为及不合规范修文档原则。见[节点领域模型设计](../../../../docs/superpowers/specs/2026-10-04-node-domain-model-design.md)；本文记录设计确认，不表示代码重构已完成。

## 先前设计与实施记录

递归目录按作用域归属内容，并为有独立维护需求的作用域建立自身维护空间；本地维护材料默认集中存放，固定入口、遵循工具路径约定的材料与共享能力实现可位于该目录之外，通过入口与索引接入。

**Why:** 用户确认项目专属的 notes、tasks、edges 等应归项目工作区，根级内容留在根作用域，使人和 Agent 能在一个作用域内接手完整上下文；跨域看板和检索负责汇总，跨域复用通过引用连接。用户进一步确认现有 Tasks 混淆了借助 Edges 完成学习、研究和交付的任务，与建设、修复和维护 Edges 自身的任务。因此需要区分领域工作与自身维护的归属，同时保持公共能力跨作用域复用。

**How to apply:**

以[整体设计](../../../../docs/superpowers/specs/2026-10-03-recursive-scope-layout-design.md)及[实施计划与验证证据](../../../../docs/superpowers/plans/2026-10-03-recursive-scope-layout.md)区分长期决策、当前实现和交付状态。2026-10-03 已在隔离工作树验证新布局运行时、选择式初始化、managed/referenced 类型、一键通用迁移与 Edges 实例迁移；当前新建作用域须显式选择模块/类型，未采用项不预建，旧布局只由独立迁移器读取。AGENTS 组织统一发现，规范正文按职责保持单一真源。Tasks 的 domain/maintenance 归属及显式 scope 已实现；Task Skill/MCP 通用 CRUD、Python 运行时迁入 CLI、任意外部来源接入不因此完成。

已升级公开树不代表其他克隆的本地私有内容已迁移。每个实例仍需运行迁移器，明确已撤除模块作用域的所有权并处理冲突；评测与教学两处已采用 referenced 类型的来源缺失仍有诊断，不制造来源清空诊断。整体评审、Task 完成状态与 PR 交付以实施计划后续证据为准，不由本条提前宣告。

以下保留 **2026-10-03 实施前的设计讨论与用户决策原文**。其中“当前”“尚未实现”“尚未迁移”等是当时状态，已实现部分以上述现状与计划证据为准；任意外部内容目录接入等明确未完成能力仍保留其边界。

- 目录设计和迁移按 [ADR 0024](../../../../docs/adr/0024-scope-first-content-ownership.md) 推进。保留内容类型语义，区分 Task Project 看板分组与实际项目工作区，不把已有分组直接视为完整作用域。
- 对有独立维护需求的作用域，设立自身维护空间，承载该作用域的系统二职责；按需建立，不为每个普通目录预建一套。Task 管理等能力可供领域工作与维护工作共用，不能把 Task、Skill 或 Memory 类型整体定义为系统二。
- 自身维护目录采用 .harness；用户于 2026-10-03 确认将此前候选名 .edges 改为 .harness，以职责命名，降低对产品名的绑定，模块划分、入口规则和共享实现位置保持。自身维护空间适用于个人、Agent、团队等主体；目录名称不把系统二角色与 Agent Harness 机制等同。目录是默认物理落点，系统二职责也可通过索引组织原位工具材料；尚未执行迁移。
- Q2.2 已确认，Q8 补充工具产物的路径例外：本作用域自有的维护状态、材料和配置默认集中存放；根 `AGENTS.md` 等固定入口及已有有效 Skill/工具路径约定的材料可留在原位，通过索引接入，共享实现通过引用接入，不在每层复制。共享实现可由 Edges 仓库提供；“外部”不等于必须在另一个仓库。实现真源、安装分发位置和本次操作目标分别识别，共享代码不自动共享任务或记忆。
- 用户澄清即使采用各作用域就近维护、上层协调的方案，现有整套 edges CLI 仍归根作用域拥有和维护，其维护任务与知识归根维护空间；各子作用域使用它产生的领域内容仍就近归属。extensions/cli 是源码位置，不自动成为独立责任作用域；不能仅按源码目录为 extensions 建立独立维护空间。用户确认 Q10：extensions、shared-extensions、apps、scripts 保留源码真源位置，维护任务和知识先按实际职责归根维护空间；已有局部记忆逐项判断，不机械整包合并。确有独立管理目标、决策和验证需求时才细分责任作用域，不自动把整仓改成纯实现仓或迁出个人内容，也不把目标归属写成当前已实现任意子作用域操作。目录框架、维护空间分组与类型入口已确认；旧内容逐项归属、实际子作用域边界、工具引用适配及迁移清单在实施阶段细化；兼容边界按 Q12/Q13 已确定为新版仅支持新布局、旧项目一次性迁移。以已确认的整体设计为目录依据，不从局部示意推导额外规范。
- 展示本次目录重构的整体方案时，须覆盖现有业务目录与支撑目录，并给出旧新归属对应；用户指出仅列 tasks、notes、projects、extensions 的示意遗漏了 teaching、evaluation 等，无法用于审查整仓结构。局部示意须明确标注，完整候选应同时交代 observation、apps、docs、scripts、内容支撑目录及固定宿主入口的去向；候选落点不能写成已确认迁移。
- 用户纠正候选结构继续把 Tasks 放在 knowledge 下的问题：根作用域的领域工作项应直接归顶层 tasks，维护任务归对应维护空间的 tasks，子作用域任务仍就近归属。知识容器不能继续充当所有业务对象的兜底；根看板聚合不意味着把全部任务真源集中到根。用户随后确认 Q4：projects、teaching 也提升为顶层工作区集合，与 tasks、knowledge 并列；项目工作区与教学工作区继续保留不同目标和业务语义，内部按需组织知识、任务和自身维护。当前确认的是目标布局，具体迁移及发布、调用适配尚未实施。
- 用户于 2026-10-03 纠正 observation 使用 README 作为目标入口的设计：目标入口应为 .harness/observation/AGENTS.md，由所属作用域 AGENTS 直接引用。AGENTS 是人和 Agent 的统一组织与发现入口；README 为可选说明，不是核心发现链必经节点或全仓唯一真理源。Tasks/Evaluation/Observation 用各自模块 AGENTS，Memory/Skills 仍直达 type，不补容器总入口；同名入口不自动形成独立作用域。实施时同步撤换根入口的 README 唯一真理源旧约定，保留并接入原有有效规范，硬约束直接写所属层 AGENTS；不因入口统一就把全部正文集中到入口。当前仅修订目标设计。
- 用户确认 Q6：统一各模块的入口、归属与发现方式，保留各模块自己的内容契约；Task 保留任务状态与 Run 记录，Evaluation 保留用例与报告，不将全部内容强制改造成统一 Memory 条目。用户随后确认 Q5.1：自身维护空间保留独立的维护知识分组，承载供接手、判断和改进使用的上下文、决策、纠正和资料指针；原始任务状态、观测和评测证据留在各自模块，可复用结论引用其来源。整体目录方案已确认以 memory 为分组名，内部类型按需选择；技能发现入口按后续合并方案处理，不据此整包照搬旧 .memory。目录深度不直接决定作用域或检索跳数，实际适配另行设计。
- 用户确认 Q7：现有 .memory/skills 的可执行方法正文从维护知识分组独立，作为能力模块组织。可执行方法是人或 Agent 能照着做的步骤与流程，不要求代码；维护知识保留采用方法的理由、背景和边界，并引用技能正文。共享技能保留共享真源，本作用域方法可本地维护，不复制共享正文，也不把所有 Skill 类型固定为系统二。用户随后提出 skills 与 agent_skills 共用 AGENTS.md，并进一步纠正：像 memory 一样继续往下分 type。skills 是容器，下层类型继续开放；撤回“统一成一个官方 skills 类型”的解释。用户进一步明确当前可保留对应原 skills、agent_skills 的两种 type，每类各有 AGENTS.md，最外层作用域入口直接引用两份类型入口；本方案按此保留两类职责及正文维护边界，类型标识后续已确认改名为 managed/referenced，不另设技能总入口，类型仍可扩展。入口合并不扩大 Project Memory 的正文写入权限，也不等于自动安装；尚未实现。
- 用户指出 ADR、CONTEXT.md 与部分 docs 文档由其他 Skill 生成，其路径受那些 Skill 的约定约束。已核对 domain-modeling 的 CONTEXT.md/docs/adr 约定，以及 brainstorming/writing-plans 的 docs/superpowers/specs、plans 默认值（后两者允许用户覆盖）。设计时同时核对生成、读取、发现与引用，不因内容承担维护职责就直接搬入 .harness，也不把整个 docs 一概视为同一种职责。用户已确认 Q8：保留约定真源，通过所属作用域的层入口与类型入口等索引接入，正文只存一份，不另造同内容摘要。.harness 是默认维护目录，系统二职责可跨出该目录；当前保留 CONTEXT.md、docs/adr、docs/superpowers 的位置。路径约定可以演进，确需迁移时同时适配生成、读取、发现和引用，具体索引实现仍待设计。
- 用户强调当前通用目录有限，许多内容由具体作用域扩展出来；目录设计必须区分跨作用域通用约定与本作用域特有目录，不能将 Edges 根的完整布局当成通用模板。适用范围与系统一/系统二职责分别判断，特有维护模块也可位于自身维护空间。通用不等于每层必建，可复用模块按需采用；局部扩展经实践和架构复盘确认共性后再提炼通用规范。用户确认通用默认推荐模块为 memory、skills、tasks，供按需选择，未采用项不预建目录；Edges 根实例另采用 evaluation、observation，共五项。推荐集合保持开放，不把当前实例扩展提升为每层默认模板。用户已确认 Q9：evaluation、observation 分别迁入根 .harness/evaluation、.harness/observation，作为当前 Edges 实例采用的维护模块，不成为各层必建目录；评测执行器、用例、测试、报告、submodule 等须整体适配，保留忽略规则与证据边界；当前 observation 只有说明和占位，不据此部署后端。公共实现维护归属已按 Q10 确认。
- 用户确认延续 Project Memory 的扩展机制，区分通用规则、按需扩展和作用域的具体目录实例；沿用 ADR 0006，不另起全局类型注册表。Memory Type 通过本层 LAYOUT 登记，种子不是闭集；复用入口、索引与稀疏递归，补齐异构模块的统一发现并保留各自格式。已核对类型扩展已实现，但任意外部内容目录接入仍是预留接口，只有 agent_skills 的外部映射已实现；不能以注册同名 Type 代替 Task/Evaluation 接入。模块采用与内部类型选择分别说明，不能将两层推荐混为一谈：选用模块后按自身契约组织，Memory/Skills 再选择各自类型，任务看板的初始化不交给 Project Memory。当前 init 仍创建六类种子；用户确认 Q11 的目标行为是启用 memory 后初始化时提供少量推荐类型及用途，让用户选择，再按选择建立类型目录与入口，不默认创建整套分类。自定义类型继续沿用本层登记机制。默认推荐清单为上下文与决策(project)、纠正与反馈(feedback)、参考资料(reference)、本地私有记忆(user)，展示名不冻结目录名；统一技能入口按 Q7 独立于维护知识组织，ADR 原位单一真源及用户记忆含索引的 gitignore 边界继续保留。选择式初始化尚未实现。
- 用户确认 Q12：本仓迁移同步升级 CLI、Skill、脚本及生成/读取/引用链路，新目录是唯一真源，公开命令尽量保持。Q13 用户明确不支持新工具继续运行旧布局，要求提供一键迁移 Skill（暂建议 project-memory-migrate）；旧布局解析仅留在迁移器，不进入常规命令兼容或双写。通用迁移保留原作用域、来源权限、技能附属文件和私有材料；技能按确认的容器/type 映射转换，自定义类型身份保留，重建索引与忽略规则，预检冲突并验证完整性，支持安全重复运行；迁移保留已有模块与内容，不以新建时的模块或类型推荐清单补齐、重置旧结构。Edges 任务分流、工作区上移和评测观测搬迁另按实例计划执行，不写死进通用 Skill。迁移 Skill 尚未实现。
- 完整目录映射、入口与索引、选择式初始化和一次性迁移 Skill 的交付要求汇总在[整体设计](../../../../docs/superpowers/specs/2026-10-03-recursive-scope-layout-design.md)。用户已整体确认目标目录及两类技能入口；尚未实现新布局或迁移 Skill。实施前按该文档核对完整映射和保护边界。
- 技能容器内以 managed、referenced 承接原 skills、agent_skills 两类职责，并保留开放扩展：各 type 内按实际真源去重别名，同名不同源并列；安装链接指向本地方法时两类索引可引用同一正文，不因跨类型去重而删掉一类入口；本地写入需校验真实路径，原位接入正文仅索引。迁移时安装入口路径及外部真源保留，只有指向本次已迁本地正文的链接可按清单更新目标；不沿外部安装目录链接扩大写入。目录组织已获整体确认，工具与逐项迁移细节仍须在实施阶段落实，不能当成当前工具已具备的行为。
- 用户纠正了将模块容器等同于单一类型的设计：skills 应像 memory 一样继续向下分 type；不要为了共用发现入口而消除类型扩展点。用户进一步重申支持跨文件系统层级的 AGENTS.md 直接引用：物理目录深度与入口引用跳数分开判断。用户进一步澄清不保留总入口也行，并明确两种原有 type 各有 AGENTS.md、最外层直接引用；本方案不另建 skills/AGENTS.md。目录归类无需逐层中转，不应再把物理目录层数变成必经导航要求。普通维护记忆保留类型入口，额外引用不改写实际作用域关系、正文真源、写权限及适用约束。
- 用户指出 skills/agent_skills 的 type 命名无法体现本质区别，旧名不应当作最终新命名。结构仍为一个技能容器、两种 type、各自 AGENTS.md、最外层直接引用。用户已确认 managed（受管技能，PM 维护正文）/referenced（引用技能，PM 仅维护索引）；对应 .harness/skills/managed/AGENTS.md 与 .harness/skills/referenced/AGENTS.md，由作用域入口跨目录层级直达，不另设技能总入口。此命名是目标设计，当前运行时尚未升级；不要按人/Agent、是否本仓或是否安装错误划分。
- 用户于 2026-10-03 在完整目标目录、最外层跨目录引用各 type 及按需递归的子作用域示意展示后确认整体目录方案。后续以整体设计为实施依据，不重复打开已确定的容器、类型命名及入口层级问题；逐项任务/局部记忆归属、工具升级及迁移仍须按实施计划落实，不把目录确认写成已迁移、已验证或已合并。

## 2026-10-04 用户确认：节点携带文件路径

BaseNode 包含必填 path，service 使用节点自带的位置执行 create/update/destroy；尚未加载节点时通过路径 get/list。用户要求将此方向更新进 spec。

**Why:** section 只说明 AGENTS 的索引区块，不能定位真实文件；把路径和节点分开传给每次写操作也容易出现目标不一致。

**How to apply:** 本层简写依据当前 scope 已登记布局解析，下层新节点或引用显式指定目标路径，已有引用按记录的路径读取。节点文件位置和 AGENTS 引用表达的逻辑归属分别建模，不能通过 dirname 自动推出 parent。parse/serialize 处理内容，不改变 path 或自动将其写入 YAML。构造类型、路径解析与 service 调用示例见[节点领域模型设计](../../../../docs/superpowers/specs/2026-10-04-node-domain-model-design.md)；这是已更新的设计，运行时代码尚未按此重构。

## 2026-10-04 用户最终确认：BaseNode 提供可选树关系

parent 与 children 都定义在 BaseNode，允许没有关系值；所有子类继承。此决定替代此前将两者仅放到 InternalNode 的方案。

**Why:** 用户明确树结构是系统核心，应作为节点的共同能力；独立文档或叶节点通过关系缺省表达，不需要排除在树模型之外。

**How to apply:** BaseNode 的 parent 与 children 均可为 undefined；InternalNode 覆盖 children 读取，从 AGENTS 归属索引派生集合，不另存第二份可修改数组。公共 NodeService 对任意节点的 attach/reparent/detach 都协调索引、parent 与保存，不再只为 InternalNode 维护反向关系。路径定位与逻辑归属分开，树关系不自动写入 YAML。已更新 spec，此为后续重构目标，代码尚未实施。

## 2026-10-04 用户确认：children 区分本层与下层，默认只读取本层

children 的引用携带 kind，区分 local（本层记忆）与 descendant（下层记忆索引）。用户明确：给定目录作用域时只需要 local 部分，不默认展开下层作用域。

**Why:** 这一区分决定上下文读取的范围；如果混为一类，会把下层项目的内容带入本层，也无法在加载前截断无关范围。

**How to apply:** BaseNode.children 使用可选的 NodeReference 集合，children 引用须带 kind，分类属于引用关系，不属于节点 type 或文件路径。InternalNode 根据索引所在章节派生 kind，不另存重复真源。service 的作用域查询默认沿 local 索引链，包含多层本层类型入口；仅显式 includeDescendants 才沿 descendant 跨作用域。过滤发生在目标文件加载之前，但解析、序列化保留两类索引及本层约束，不能把不加载下层内容误做删除下层引用。此为 spec 已确认的目标行为，当前运行时尚未实施。

## 2026-10-04 用户确认：引用与索引条目统一为 NodeReference

将 ChildReference 与 NodeIndexEntry 都合并到 NodeReference，parent、children、普通引用与章节索引共用一种结构，不保留 reference 包装层。

**Why:** 用户连续指出子引用类型和索引包装类型增加复杂度，希望引用及其展示信息集中表达，同时保留 local/descendant 对作用域读取的区分。

**How to apply:** NodeReference 包含 target、可选 label、description 和 kind。description 是当前索引条目的说明，不自动同步目标文档的同名 metadata。parent 或普通引用可省略 kind，children 中必须有 kind，由模型和树操作校验。InternalNode 从索引章节派生 kind，不重复存储分类；addChild(reference) 按 reference.kind 写入对应章节，不额外传 kind 参数。章节索引和 children 均直接使用 NodeReference 集合。作用域默认仅沿 local 的规则不变；已更新 spec，未修改运行时。

## 2026-10-04 用户确认：可变内存模型与引用更新

普通内容字段允许属性赋值，通过 setter 校验并更新模型；metadata、索引和树关系保留专门操作方法。InternalNode 增加 updateChild(reference)，用于更新已有索引引用。

**Why:** 用户确认简洁的内存修改方式，同时需要保证索引章节、引用分类和多节点归属保持一致。索引引用的更新与目标节点内容的更新是两个操作。

**How to apply:** Task 的 title/status/assignee/priority、Memory 的 memoryType/description 及 BaseNode.body 使用 setter，不重复保留对应 setX 方法。body setter 走正文扩展点，不修改 path 或 metadata。metadata 用 setMetadata/removeMetadata，约束用 setConstraints；集合和引用 getter 不泄漏内部可变对象。updateChild 按 target 替换已有引用，可选字段省略时清除，kind 必填且决定所属章节，未找到时报错；不隐式新增或修改目标文档。path/type/id 对外只读，跨节点关系由公共 NodeService 协调，保存显式调用 service.update。已更新 spec，运行时尚未实施。

## 2026-10-04 用户确认：移除 NodeTree，由公共 NodeService 组织遍历

不单独定义 NodeTree。公共 NodeService 负责 CRUD、引用加载、作用域查询及跨节点归属协调；节点保留自身内容、引用和领域操作。用户要求同步更新 spec 并补全 service 接口。

**Why:** children 保存的是文档引用，递归需要加载目标；service 已承担作用域读取和跨文档流程，额外的树对象与遍历入口造成职责重叠。

**How to apply:** 对外提供 get/list；list 默认只沿 local，显式 includeDescendants 才跨下层。内部 traverse 辅助函数负责顺序、去重与环检测，由 service 提供加载能力，不让模型读文件，也不新增公开 walk/traverse 或树容器。NodeService 另提供 create/update/destroy 与 attach/detach/reparent；归属操作使用显式父节点，协调索引、parent 和保存，reparent 不移动文件。get 可显式传模型构造器，未传时使用 BaseNode；公共路径参数已解析为绝对路径。完整签名与读写、缺失目标行为以 spec 为准；这是后续重构设计，运行时尚未实施。

## 2026-10-04 补齐 NoteNode 与 SkillNode

用户指出节点模型清单遗漏 Note 和 Skill，设计补齐 NoteNode 与 SkillNode，与 InternalNode、TaskNode、MemoryNode 并列继承 BaseNode。

**Why:** 知识笔记、项目记忆、可执行方法具有不同领域职责，即使共用 Markdown/frontmatter 也不应全部归入 MemoryNode；当前已有 Note 入库和 Skill 文档契约可作为依据。

**How to apply:** NoteNode.title 按现有 Note 一级标题读写 body，不另造标题 YAML 字段或强制统一笔记章节；SkillNode.name/description 读取现有 frontmatter，body 承载方法说明。managed/referenced 保留为维护职责，由 service 遵守来源写权限，不拆成 Skill 子类。技能附属文件与安装、Note 的 Git/PR 流程继续由相应服务或工作流负责，不搬入模型。公共 NodeService 可显式使用这两种构造器，文档 CRUD 不代表技能目录安装管理。此为已补齐的设计，运行时尚未迁移。

## 2026-10-04 用户纠正：Skill 按标准 Agent Skills 的完整目录定义

Skill 是至少包含 SKILL.md 的目录，可以包含 scripts、references、assets 及其他文件或目录。用户强调直接采用标准定义，不能把 Skill 概念缩成单份 Markdown 文档。

**Why:** 仅建模入口文档不足以覆盖技能资源及整个技能的复制、移动、删除；当前 SkillNode 说明把完整目录问题推给既有流程，未充分表达技能边界。

**How to apply:** 以 [Agent Skills Specification](https://agentskills.io/specification) 为格式依据；三类常见附属目录都是可选约定，不是封闭清单。入口内容与附属资源支持按需读取，不能为适配 BaseNode 将脚本、图片等强制视为 Markdown 子节点。NodeReference.children 的逻辑归属与目录资源清单分开。SkillNode 的入口路径、目录属性及目录级 service 接口需要据此修订；具体 TypeScript 映射仍在讨论，不将已确认的标准定义等同于接口已定稿或实现已完成。
