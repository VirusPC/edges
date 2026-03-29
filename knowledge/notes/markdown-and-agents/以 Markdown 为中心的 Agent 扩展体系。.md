<<<<<<< main
# 以 Markdown 为中心的 Agent 扩展体系。

在软件工程的演进历程中，人工智能（AI）工具的定位已经发生了根本性的认识论转变。早期的AI辅助工具仅仅提供缺乏上下文的单行代码补全，而现代AI系统已经进化为能够自主执行复杂、多步骤开发工作流的多Agent（智能体）系统。在这一范式转移的核心，出现了一个出人意料的技术标准：Markdown。这种最初为格式化纯文本而设计的轻量级标记语言，现已被重新定义为一种声明式的配置层——一个可编程的接口，用于控制大型语言模型（LLM）Agent的行为、记忆、技能以及编排参数。

本报告深入考察了现代AI编码Agent的架构范式，特别聚焦于它们如何通过Markdown扩展自身能力。通过对GitHub Copilot、Cursor、Claude Code、OpenCode和OpenClaw的独立深度调研，本分析揭示了”配置即约定”（基于Markdown的系统）与非”配置即约定”的确定性编排框架（如LangChain、CrewAI、AutoGen）之间的架构分歧。证据表明，将纯文本视为可执行的Agent状态，有效解决了AI上下文窗口限制、系统性记忆缺失以及多Agent协调等关键挑战，从而彻底改变了软件开发的轨迹。

## Markdown驱动的Agent架构：从静态规则到认知系统的演进

现代AI Agent不再依赖于单一的不可见系统提示词，而是全面转向了基于Markdown文件的配置生态。这一转变并非仅仅出于审美或格式的偏好，它代表了机器智能与传统软件工程环境接口方式的底层重构。Markdown文件已经超越了静态文档的角色，演变为Agent认知架构中的动态组件——同一个文件往往同时承担着行为规则、项目记忆和多Agent协调接口的多重角色。

回顾过去几年，这套配置系统经历了一条从静态规则到动态记忆、再到多Agent协同和长周期任务管理的清晰演进脉络。在每一个关键转折点，记忆、协调与技能这三条能力线索始终交织推进、互为因果。

### 1. 2023年至2024年：单体静态规则文件的起源与配置碎片化

随着AI编码助手能力的提升，开发者开始探索用纯文本向AI注入项目级上下文。早在 2023 年，开源工具如 Aider 就开始使用 CONVENTIONS.md 来规范代码风格。随后在 2024 年，Cursor 普及了项目根目录下的全局 `.cursorrules` 文件。这导致了早期的配置碎片化，开发者被迫在不同工具的规则文件中维护高度重复的内容。

在这一阶段，AI Agent的记忆系统主要依赖于向量数据库（如Chroma或Pinecone的RAG架构）或知识图谱。尽管向量数据库提供了低延迟的语义检索和理论上无限的可扩展性，但它们在多Agent编码环境中暴露出了严重的系统性缺陷。向量记忆容易遭受”语义漂移”（Semantic Drift）的影响，导致细微的架构约束在嵌入向量转换中丢失；同时，它们创造了一个”黑盒”，使得开发者无法轻易审计或纠正Agent的错误假设。这些缺陷为后续”记忆即文档”的范式转变埋下了伏笔。

### 2. 2025年1月：Cursor Rules (.mdc) 与”智能按需加载”的突破

随着单体 `.cursorrules` 文件变得臃肿并严重消耗 Token，Cursor 在 2025年1月 发布的 v0.45 版本中，正式引入了 `.cursor/rules/*.mdc` 格式进行模块化管理。这一阶段的核心突破是利用 YAML 前言（Frontmatter）进行精确触发。Agent 能够通过读取前言中的描述（Description），自主推理并决定在当前对话中是否需要调取该规则（Apply Intelligently），为后续动态技能系统的发展奠定了底层逻辑。同月，GitHub Copilot 宣布了对 `.github/copilot-instructions.md` 的公开预览支持。

### 3. 2025年2月：自定义命令（Commands）的 Markdown 化首创

在 2025年2月 Anthropic 首次发布 Claude Code 命令行工具时，首创了将自定义终端指令（Commands）定义为 Markdown 文件的模式。通过在 `.claude/commands/*.md` 目录中放置文件，开发者可以使用自然语言定义命令行为，并利用 `$ARGUMENTS` 等变量占位符，将类似 `/review` 的命令行操作映射到具体的 Markdown 提示词模板上。这种将静态文档转变为”可编程路由”的设计，直接启发了后来 OpenCode 等生态工具的演进。[^1](https://opencode.ai/docs/commands/)

这一创新标志着Markdown从被动的规则手册开始向主动的、可编程的路由引擎转变。尽管此时的命令仍然是静态的指令模板，但”Markdown文件即可执行逻辑”的核心理念已经确立。

### 4. 2025年5月至7月：统一标准 AGENTS.md 的诞生与多Agent协调的文本化

为了解决配置碎片化的问题，2025年5月，Sourcegraph 的 AMP 团队首次提出了 agents.md 概念，作为统一AI编程工具配置的第一步尝试。随后在 2025年7月16日，OpenAI 正式宣布 AGENTS.md 为跨工具的供应商中立标准。作为”AI Agent的README”，它统一了跨工具的基础配置，随后交由 Agentic AI Foundation 维护，并被超过六万个开源项目采用。

AGENTS.md 的出现深刻体现了Markdown文件的多重身份——它既是行为规则（定义编码标准和架构约束），也是项目记忆（承载构建命令和技术栈信息），还是多Agent协调接口（规范不同Agent在微服务边界之间的访问规则）。这种”一个文件，多重角色”的特性，恰恰说明了记忆、命令与协调在实际发展中不可分割的本质。

与此同时，在Windsurf和SuperClaude等系统中，多Agent的编排开始通过一系列具有顺序的Markdown文件来管理，例如 `00_orchestrator.md`、`01_analyze_requirements.md`、`02_create_plan.md` 等。编排者（Orchestrator）Agent受控于包含决策树的全局Markdown文件。当编排者面对一项复杂的全栈任务时，它会交叉引用其Markdown规则，评估是否需要生成子Agent（Sub-agent）。随后，编排者将中间分析结果写入一个共享的 `workflow-state/` 目录下的状态文件（例如 `implementation-plan.md`）。接手的编码Agent在启动会话时，首要任务就是读取这个状态文件以接管上下文。这种架构实质上创建了一个基于文本的异步消息总线（Message Bus），整个多Agent协调过程完全由Markdown指令驱动的文件读写操作构成。

### 5. 2025年7月：子智能体角色配置的 Markdown 化

在 Commands 功能推出几个月后，2025年7月，Claude Code 进行了重大更新，正式引入了 Subagents（子智能体）功能。这是业界首次支持通过 Markdown 文件声明性地创建专职 Agent 角色。开发者在 `.claude/agents/*.md` 目录中放置文件，在 YAML 前言中定义子Agent 的模型类型、触发描述以及可调用的工具。主 Agent 则能根据这些描述自动拉起子 Agent 处理特定任务，有效保护了主上下文窗口不被污染。

这一功能将前文所述的多Agent文本消息总线从社区实践提升为平台原生能力。子Agent的 Markdown 定义文件同时扮演着角色描述（记忆）、能力边界（规则）和协调接口（多Agent路由）三重角色，再次印证了这三条能力线索的不可分割性。

### 6. 2025年7月：基于文件系统的记忆——“记忆即文档”的范式确立

2025年7月18日，Manus 团队发表了开创性的《AI Agent的上下文工程》一文。在业界还在大规模投入复杂向量数据库时，Manus 证明了基于纯文件系统的记忆更为高效。他们提出了采用 3 个简单的 Markdown 文件来管理长时间运行的 Agent 记忆：`task_plan.md`（追踪宏观进度）、`findings.md`（存储研究资料）以及 `progress.md`（记录会话日志）。Agent 在做出重大决策前被强制要求读取计划文件，完美解决了长期执行任务时的目标漂移问题。

Manus 的实践正式确立了”记忆即文档”（Memory as Documentation）的范式。相比于向量数据库的黑盒检索，这种方法将Agent的记忆直接映射到本地文件系统中，在透明度、审计性以及与传统工程工具的兼容性方面具有不可替代的优势。如果一个Agent在执行过程中错误地应用了某种设计模式，开发者只需在文本编辑器中打开 `MEMORY.md` 文件，手动删除或修改那条导致幻觉的规则，护栏（Guardrails）因此变得高度确定。

更重要的是，将记忆文件纳入Git版本控制系统，赋予了开发者对Agent认知演变的”时间穿梭”能力。通过 `git diff`，工程师可以精确追踪Agent何时更新了对某个API的理解；而 `git blame` 则能揭示到底是哪一次会话引入了特定的架构约束。此外，相比于向量检索往往会破坏代码逻辑连贯性的文本块提取（Chunk-based retrieval），Markdown记忆允许Agent通过读取YAML前言（Frontmatter）进行渐进式摘要，然后自主决定是否进行全文深度读取，从而在宏观上保持了上下文的完整性。

以下表格对比了这两种记忆范式的核心差异：

|记忆系统特性     |向量数据库记忆（Vector RAG） |基于Markdown的文件记忆                      |
|-----------|--------------------|-------------------------------------|
|**底层数据结构** |高维数学嵌入向量（Embeddings）|纯文本与层级化文件目录                          |
|**可审计性与调试**|低（需要专门的数据库检查与检索测试）  |极高（原生文本编辑器即可查看与修改）                   |
|**版本控制集成** |复杂且非原生              |原生支持（通过Git diff, checkout, blame完美追踪）|
|**上下文完整性** |碎片化（提取离散的文本块）       |整体性（保持文档级别的逻辑连贯性）                    |
|**执行延迟**   |中等（涉及网络请求与数据库查询）    |极低（本地文件系统直接读取）                       |

### 7. 2025年10月至12月：可执行技能系统（SKILL.md）——从静态指令到动态上下文注入

2025年10月16日，Anthropic 正式发布了 Claude Skills。早期的自定义命令（Commands）系统被宣告为旧版格式，并被正式合并至技能系统（SKILL.md）中。同年12月18日，Agent Skills 演变为跨平台的开放标准。技能不仅包含静态的 Markdown 指令，还能通过 YAML 前言挂载后台动态计算脚本，实现了极低的闲置 Token 成本和极高的扩展性。

SKILL.md 的出现解决了静态Markdown指令的根本局限。在此之前，如果代码审查的指令文件是静态的，那么无论开发者仅仅修改了两行CSS代码，还是重构了整个后端的身份验证模块，Agent得到的基准指令都完全相同，这显然违背了效率优化的初衷。通过引入”计算型技能”（Computed Skills），开发者可以将Shell命令或脚本执行直接嵌入到 `SKILL.md` 文件中。例如，在Claude Code中，利用 `!`<command>`` 的语法，可以在LLM读取Markdown文件之前，在后台先执行一段脚本。脚本可以分析当前的Git Diff状态，如果检测到核心安全文件被修改，脚本会输出极其严格的安全审查指令；如果仅仅是前端文案修改，则输出UI一致性指南。脚本的输出结果会实时替换Markdown文件中的占位符，随后才将这段定制化的上下文喂给LLM。在这个过程中，Agent完全不知道有外部脚本介入，它只是接收到了一套与当前情境完美契合的、确定性的指令。

这种创新将Markdown从被动的规则手册彻底转变为主动的、可编程的路由引擎，在最小化Token消耗的同时大幅提升了Agent的准确性。至此，一个 `SKILL.md` 文件可以同时承载静态规则（记忆/约束）、动态计算逻辑（命令/技能）和Agent路由描述（协调），三条能力线索在单一文件格式中完成了统一。

### 8. 2025年11月至2026年初：OpenClaw 与”全天候双层持久化记忆”架构

继 Manus 的早期探索后，开源 Agent 框架 OpenClaw 将”记忆即文档”的理念推向了极致。该项目最初由 Peter Steinberger 于 2025年11月24日以 Clawdbot 之名发布，并在 2026年1月27日更名为 OpenClaw。它专为 24/7 全天候运行的后台操作 Agent 设计了极具特色的双层 Markdown 记忆系统，彻底抛弃了黑盒式的向量数据库，强制 Agent 将长期沉淀的架构决策与事实写入 `MEMORY.md`，将每日的工作流细节追加记录在 `memory/YYYY-MM-DD.md` 日志中。更具创新性的是，OpenClaw 引入了”静默记忆刷新”机制，确立了纯文本文件作为高级自治 Agent 核心”认知硬盘”的地位。[^1](https://opencode.ai/docs/commands/)

### 9. 2026年初：基于 taskmd 驱动的长周期任务队列管理

随着 Claude Code 和 OpenClaw 等工具后台并发执行（如 `/batch` 命令）能力的成熟，社区在 2026 年初演进出了基于 `TASKS.md`（或标准化为 taskmd 规范）的任务队列管理模式。在这一范式中，`TASKS.md` 充当 Agent 执行长周期任务的唯一事实来源，Agent 像人类开发者一样在文件中打勾、记录依赖。这种将状态机持久化为纯文本文件的做法，有效遏制了 Agent 在极长周期任务中的”幻觉”与目标偏离。

`TASKS.md` 是这条演进脉络的最新产物，也是记忆、命令与协调三条线索深度融合的集大成体现：它既是任务状态的持久化记忆，也是Agent执行动作的指令清单，还是多个并发Agent之间协调进度的共享接口。

## 现代主流AI Agent的独立深度调研

当前的AI编码助手市场由少数几个高度专业化的平台主导。尽管它们都已向基于Markdown的配置靠拢，但其架构实现反映了在用户控制权、垂直整合深度以及后台自主性方面的深刻分歧。以下对五个重点工具的独立调研揭示了这些技术路径的差异。

### GitHub Copilot：企业级的条件规则执行

GitHub Copilot通过一个高度结构化、基于条件的框架来集成自定义指令，其设计主要为了满足企业级规模开发的需求。认识到庞大的单体仓库（Monorepos）无法依赖单一的规则集，Copilot采用了一种分层的Markdown系统，以在全局标准与模块特异性之间取得平衡。

第一层是**始终开启的指令（Always-on Instructions）**，主要存放在工作区根目录下的一个单一的 `.github/copilot-instructions.md` 文件中。该文件的内容会被自动拼接到工作区内每一次聊天请求的上下文窗口中。它被用于声明不可妥协的项目架构、安全协议以及广泛的代码风格约定。在组织层面，Copilot允许仓库所有者定义共享指令，这些指令会跨越整个GitHub组织内的所有项目传播，从而建立起企业编码标准的基线，在指令冲突时作为最低优先级的兜底规则。

第二层也是更为复杂的层级，由**基于文件的指令（File-based Instructions）**组成，通常命名为 `.instructions.md`。这些文件利用YAML前言（Frontmatter）来配置触发条件，只有当Agent与特定领域的文件交互时，相关的上下文才会被注入。这种前言配置包含几个核心属性：`name` 作为界面显示的标识符，`description` 向Agent提供规则用途的语义元数据，而最关键的是 `applyTo` 属性，它接受一个相对于工作区根目录的Glob匹配模式（例如 `**/*.ts`）。

通过采用 `applyTo` 匹配模式，Copilot实现了上下文的”渐进式披露”（Progressive Disclosure）。当Agent处理React前端代码时，它会触发约束React Hooks使用的 `.instructions.md` 文件；而当修改Python微服务时，则会触发PEP-8格式化规则。这种机制不仅优化了Token的利用率，还有效防止了AI在处理分散的技术栈时产生语法混淆和幻觉。

### Cursor：IDE先行者与记忆银行（Memory Bank）拓扑

作为与AI编排深度集成的Visual Studio Code分支，Cursor最初普及了 `.cursorrules` 文件的概念。然而，随着Agent能力的扩展，单体规则文件很快成为了认知瓶颈。Cursor随后引入了 `.mdc`（Markdown Context）文件，该格式同样利用YAML前言来控制调用规则，支持如 `globs`（文件定位）和 `alwaysApply`（强制全局注入）等属性，赋予了开发者极高的控制粒度。

超越基础的规则执行，Cursor的高级用户与社区扩展开创了”记忆银行”（Memory Bank）的架构模式。由于LLM在独立的会话之间本质上缺乏持久记忆，Memory Bank充当了外部认知驱动器的角色，被结构化为一个层级分明的Markdown文件网络。

标准的Cursor Memory Bank拓扑结构作为一个有向无环图（DAG）运行，包含六个核心文件：第一是 `projectbrief.md`，作为定义总体目标与范围的不可变核心文档；第二是 `productContext.md`，衍生自项目简报，概述用户画像和预期行为；第三是 `systemPatterns.md`，定义技术架构、设计模式及状态管理规则；第四是 `techContext.md`，详细列出严格的技术栈、依赖版本和环境约束；第五是 `activeContext.md`，这是一个动态更新的文件，详细记录当前Agent的关注点和下一步行动；最后是 `progress.md`，作为只追加的账本，跟踪已完成的功能和已知的技术债务。

通过在 `.mdc` 规则中强制要求Cursor的”Composer”（其核心多Agent执行引擎）在每次任务开始时必须完整读取整个Memory Bank，开发者建立了一个确定性的初始化序列。这种硬性约束防止了AI陷入浪费Token的”探索阶段”（在这个阶段AI会盲目探测仓库结构以推断架构模式）。此外，Cursor还在并行的多Agent裁判系统（Multi-agent judging）中利用这些结构化上下文。系统会同时生成多个模型（例如Claude 3.5 Sonnet、GPT-4o和Gemini 1.5 Pro）来解决同一个复杂问题，并严格依据Memory Bank中定义的约束对它们的输出进行自动化评分和择优。

### Claude Code：终端垂直整合与渐进式技能披露

Anthropic开发的Claude Code代表了一种深度集成的终端优先路径。它高度依赖Anthropic专有的模型生态，专注于提供一个自主的、命令行驱动的编排引擎。Claude Code的上下文架构被精心划分为三种截然不同的机制：`CLAUDE.md`、自动记忆（Auto-Memory）以及技能系统（Skills）。

`CLAUDE.md` 文件充当着规范的、由用户定义的真理之源。它被提交到版本控制中，作为新开发人员（无论是人类还是AI）的项目入职手册。与这种静态规则相对，Claude Code具备一个由Agent自主管理的健壮的自动记忆系统，本地存储于 `~/.claude/projects/.../memory/MEMORY.md`。虽然 `CLAUDE.md` 包含”必须使用pnpm而非npm”这类静态规则，但自动记忆系统则作为一个情境草稿本。Agent在遇到摩擦时会主动写入此文件，记录调试经验、特定的失败模式以及本地环境独有的操作怪癖。为了防止上下文呈指数级膨胀，该自动记忆系统被硬编码了每个项目200行的长度上限，展示了防止认知衰退的编程级安全机制。

Claude Code的 `SKILL.md` 系统可以说是其架构中最复杂的一环，它实现了Agent Skills开放标准。技能被存储在独立的目录结构中，并使用YAML前言定义激活阈值。该系统采用了一种极致的”渐进式披露”加载机制：

- **级别1：元数据** — 在会话启动的初始阶段，Claude Code仅读取所有可用技能YAML前言中的 `name` 和 `description` 属性。这使得系统提示词中包含了一个包含可用能力的目录，每个技能仅消耗约100个Token，实现了极低的闲置成本。
- **级别2：指令** — 当LLM判断某项技能与用户提示词相关时，系统会执行一个后台Bash命令，将特定 `SKILL.md` 文件的完整Markdown正文加载到上下文中。
- **级别3：执行** — 在最深层，该技能可能包含Shell脚本或参考文档，这些内容完全在主上下文窗口之外执行或读取，从而实现了工具链的无限扩展而不会阻塞上下文。

通过交互式的 `/agents` 命令，Claude Code还允许开发者通过生成带有YAML前言的Markdown文件来创建子Agent（Subagents）。利用 `context: fork` 参数，系统能够生成一个独立的子Agent上下文，该子Agent不再背负主对话的历史包袱，能够以最大的Token效率执行特定任务（例如只读的代码审查）。

### OpenCode：开源灵活性与声明式执行边界

OpenCode是一个开源的、与模型无关的终端Agent工具。与Claude Code对Anthropic模型的深度绑定不同，OpenCode允许开发者针对不同的任务热插拔不同的模型。在生成基础文档时，开发者可以调用低成本的本地模型；而在进行复杂的多文件重构时，则无缝切换到前沿模型（如GPT-4o或Claude 3.5 Sonnet）。

在架构上，OpenCode极其强调显式的配置而非隐式的后台黑盒操作。它原生支持 `AGENTS.md` 作为项目指令的标准，并按照严格的优先级顺序从目录树中向上遍历：优先加载当前项目目录下的 `AGENTS.md`，其次是配置目录下的全局 `~/.config/opencode/AGENTS.md`。为兼顾生态迁移，如果未找到 `AGENTS.md`，OpenCode还会回退解析 `CLAUDE.md`，确保了极高的互操作性。

OpenCode的一个决定性特征是其对专业执行模式（“计划”与”构建”）的声明式管理。内置模式对Agent的能力强加了严格的边界条件：

- **构建模式（Build Mode）**：授予Agent最高权限，包括完整的Shell执行能力、文件系统读写修改，以及广泛的环境交互权限。
- **计划模式（Plan Mode）**：这是一种分析型模式，Agent的写权限被强行撤销。在此模式下，Agent无法修改源代码，无法执行破坏性的Bash脚本，也无法应用Patch。其权限被严格限制为分析代码结构，并只能在 `.opencode/plans/*.md` 目录下将战略计划起草为Markdown文件。

OpenCode通过 `.opencode/commands/*.md` 文件来管理命令系统。这些Markdown文件充当着模板化的系统提示词，接受 `$ARGUMENTS` 占位符参数。它们还可以通过配置自动绑定特定的Agent（例如，强制要求在执行 `/test` 命令时，必须使用具备深度推理能力的特定模型在”构建”Agent上下文中执行）。通过避免将复杂的内置工具逻辑强制塞入初始上下文，OpenCode有效防止了垂直整合系统常见的上下文膨胀问题——在那些系统中，仅仅是打开应用程序，就会在用户输入任何查询之前，向模型注入多达数千个Token的工具描述（例如Claude Code高达2896个Token的核心提示词）。

### OpenClaw：全天候持久化与双层内存刷新机制

OpenClaw偏离了典型的交互式编码助手定位；它是一个可自托管的AI网关和后台运营Agent，专为24/7全天候持久运行而设计。当开发者将Cursor或OpenCode用作实时的结对程序员时，OpenClaw更像是一个异步工作的自动化雇员，在后台处理定期的代码清理工作流、监控代码库状态，并管理跨渠道（如Slack或Telegram）的通信响应。

由于其持续运行的特性，OpenClaw需要一个极其耐用的、双层Markdown内存架构，以防止在漫长的操作周期内耗尽上下文窗口。其底层记忆结构被划分为：

1. **情景记忆（Episodic Memory，位于 `memory/YYYY-MM-DD.md`）**：这是一个仅追加（append-only）的每日日志文件，用于捕获原始的事务上下文、运行笔记和直接的工作流状态。在每次会话启动时，OpenClaw会自动加载当天和昨天的日志，以提供短期的工作连续性。
2. **语义记忆（Semantic Memory，位于 `MEMORY.md`）**：这是一个经过模型自我整理的长期存储文件，包含持久的事实、系统偏好以及沉淀下来的架构决策。它仅在私密的、主要的会话上下文中被注入。

为了操作这些Markdown文件，OpenClaw向Agent暴露了专属工具：`memory_search` 利用混合搜索策略（BM25关键字加上向量嵌入）来定位历史片段；而 `memory_get` 则提供针对特定文件和行范围的精准读取。

OpenClaw在内存管理领域的一项重大创新是”自动内存刷新”（Pre-compaction机制）。随着持续多天的对话不断延长，上下文窗口最终必须被压缩以避免超出API的Token限制。在触发压缩阈值之前，OpenClaw会在后台执行一个静默的、由Agent主导的回合（Silent Agentic Turn）。该回合基于预设的Token阈值触发（例如 `contextWindow - reserveTokensFloor - softThresholdTokens`）。在此静默回合中，系统向模型发出一条内部提示词，强制模型评估即将到来的上下文丢失情况，并命令其将任何重要的瞬态信息物理写入到Markdown记忆文件中。这一强制性的刷新机制确保了关键的工作流上下文在内存被清空之前被安全地提交到磁盘，有效解决了长周期运行的Agent的”失忆症”问题。

## “配置即约定”的标准化进程：AGENTS.md的崛起

随着AI编码工具的激增，由此产生的配置碎片化严重降低了开发人员的效率。在一个典型的开源代码库中，可能同时存在为Cursor用户准备的 `.cursorrules`、为Anthropic生态准备的 `CLAUDE.md`、为企业CI/CD准备的 `.github/copilot-instructions.md`，以及为谷歌生态准备的 `JULES.md`。由于这些文件在内容上往往是高度同质化的（都包含构建命令、Linting规则和架构约束），开发者陷入了”版本漂移”（Version Drift）的噩梦：更新一个包的依赖版本，意味着需要同步修改五个不同的配置文件。

为了遏制这种配置蔓延，业界联合推出了AGENTS.md标准。该标准最初由OpenAI内部团队发起，随后交由Linux基金会旗下的Agentic AI Foundation进行管理维护。AGENTS.md作为一个通用、开放的格式，其愿景是成为统一的”AI Agent的README”。

引入AGENTS.md的核心逻辑在于将”以人为中心的入职文档”与”以机器为中心的行为配置”明确隔离。`README.md` 保留了其提供快速入门指南、架构哲学和社区贡献规范的用途；而 `AGENTS.md` 则吸收了密集的、操作层面的细节——例如强制严格类型检查的具体说明、用于集成测试的精确终端参数，以及微服务边界之间的访问规则。这些对AI至关重要的细节如果放在人类阅读的文档中会显得异常臃肿。

目前，该标准已获得大规模工具联盟的支持，涵盖Cursor、Claude Code、GitHub Copilot、AutoGen、OpenCode、Warp和Aider等，并已被超过六万个开源仓库采用。AGENTS.md完全依赖原生Markdown语法，而不强制要求复杂的YAML模式，这确保了任何解析该文件的LLM都能够通过自然语言处理推断出其规则。采用此标准的仓库报告称，新AI编码会话的设置时间从原本的30到40分钟锐减至不到2分钟，同时Agent生成的语法错误显著降低了35%到55%。

此外，AGENTS.md在架构上支持层级作用域（Hierarchical Scoping）。开发团队可以在仓库根目录建立全局的基线准则，同时在特定微服务子目录（例如 `services/payments/`）放置 `AGENTS.override.md` 文件来执行局部规则。当Agent在该子目录内执行任务时，上下文加载器会自动拼接根文件和本地覆盖文件，从而创建一个完美定制的上下文边界。

## Markdown范式与非”配置即约定”的确定性编排框架比较

尽管上述主流工具都利用了”配置即约定”（Configuration over Convention）的模式——即通过向系统提示词注入Markdown文件来引导模型行为——但在这个生态的另一端，存在着依赖严格的、可编程确定的编排框架范式。这类框架（如LangChain、CrewAI、AutoGen）通过深度的Python和.NET API来管理Agent的状态、工具执行以及多Agent之间的协调。对这两种截然不同的架构理念进行比较，对于构建企业级AI应用至关重要。

### LangChain与LangGraph：状态机与重型检查点方法

LangChain及其专门用于Agent编排的LangGraph库，将AI工作流建模为严格的数学图论结构。开发人员需要显式地定义节点（Nodes，即执行LLM调用或工具逻辑的Python函数）和边（Edges，决定下一步走向的条件路由逻辑）。

不同于基于Markdown的Agent（它们依赖LLM内部的不确定推理来决定任务何时完成），LangGraph通过其图结构原生支持并强制执行循环执行（Cyclical Execution）。此外，LangGraph中的记忆并不是存储在人类可读的Markdown文件中，而是通过严密的”检查点”（Checkpointers）机制进行管理。借助AWS专门为Amazon DynamoDB提供的连接器，或者针对PostgreSQL、Redis的实现，LangGraph在执行图的每一个步骤都会对整个图的状态捕获快照。这赋予了系统”时间旅行”调试能力：工作流可以被回溯到过去的某个精确检查点并重新恢复，或者在遇到关键节点时无限期暂停以等待人工干预（Human-in-the-loop）。

然而，LangGraph的工作流异常沉重。在ReAct Agent的循环中，持续且仅追加（Append-only）的历史消息会导致上下文窗口迅速膨胀，这不可避免地带来了指数级上升的Token成本和响应延迟。同时，管理这些复杂的执行历史需要运维人员干预数据库，这远不及直接在IDE中编辑文本文件来得轻量和直观。因此，LangGraph最适合那些对绝对确定性有严格要求、偏向API驱动的后端数据管道任务，而不是需要频繁试错和迭代的软件开发过程。

### CrewAI：顺序角色扮演的局限

CrewAI采用了一种更为”拟人化”和主观设定的多Agent编排方法，将工作流建模为一个公司团队。开发人员实例化”Agents”并为其分配明确的角色、目标和背景故事，然后为其分配”任务”（Tasks）。这些任务随后被捆绑成一个”团队”（Crew），以线性的顺序或层级结构执行。

虽然CrewAI对于僵化的、确定顺序的流水线任务（例如：研究员Agent抓取数据，交给写手Agent撰写草稿，再交给编辑Agent润色）非常有效，但它死板的结构与软件开发高度迭代、不可预测的本质存在冲突。一个典型的编码Agent经常需要编写代码、运行测试、发现底层架构缺陷，然后打断当前的流水线循环回到计划阶段重新开始。CrewAI由于缺乏原生的图循环处理机制，导致其在处理这类混乱的、非线性的开发工作流时，远不及LangGraph或者由 `CLAUDE.md` 指导的自主Claude Code会话灵活。

### AutoGen (v0.4)：连接两种范式的桥梁

微软的AutoGen框架代表了确定性编程与Agent灵活性的最大规模融合。随着AutoGen v0.4的发布，该框架经历了彻底的重新设计，以解决可扩展性、可扩展性和稳健性等底层架构瓶颈。

AutoGen v0.4引入了一个异步的、事件驱动的消息总线，它不仅支持进程内的通信，还支持跨不同机器甚至不同编程语言（目前的重点是Python和.NET生态的互操作）的Agent交互。它原生集成了模型上下文协议（MCP）客户端用于标准化的工具对接，并支持极其复杂的Human-in-the-loop状态管理。

至关重要的是，AutoGen在程序化框架和Markdown约定之间搭建了桥梁。AutoGen v0.4的Agent现在可以被专门配置工具，用于解析和交互存储在代码库中的 `AGENTS.md` 和 `README.md` 文件。例如，开发者可以实例化一个”检索用户代理代理”（Retrieve User Proxy Agent），其唯一职责是动态地抓取目标仓库中的Markdown文件，将 `AGENTS.md` 中标准化的规则提取出来，并将其注入到由AutoGen管理的严格会话状态机中。这种混合架构使得企业团队既能够利用AutoGen构建健壮容错的底层通信基础设施，又能赋予各个开发小组通过简单易懂的Markdown文件定义其特定编码标准的自由。

### 核心架构范式的对比综合

以下表格系统性地对比了基于Markdown约定的Agent系统与非”配置即约定”的确定性编排框架的核心差异：

|架构维度         |基于Markdown约定的系统（Cursor, Claude Code, OpenCode等）|确定性编排框架（LangGraph, CrewAI, AutoGen等）     |
|-------------|-----------------------------------------------|-----------------------------------------|
|**主要配置接口**   |自然语言 / 带有YAML前言的Markdown文件                     |强类型编程API（Python, TypeScript, .NET）       |
|**控制流机制**    |概率驱动（LLM基于读取到的Markdown约束自行决定下一步）               |确定性控制（有限状态机、显式的图边连接、按序任务流）               |
|**持久化与记忆**   |本地文件系统读写（MEMORY.md、多文件Memory Bank）             |外部数据库存储（DynamoDB, SQLite, 向量存储节点）        |
|**最佳适用场景**   |强互动的结对编程、迭代式软件开发、前端原型设计                        |后端自动化数据管道、企业级API编排、多轮次长效任务               |
|**可审计性与调试**  |极高（可直接阅读文本文件并使用Git历史追踪演进）                      |中等（需借助数据库检查工具或如LangSmith等专业遥测平台）         |
|**Token效率管理**|通过目录级别和Glob模式的渐进式披露（Progressive Disclosure）进行优化|容易在复杂的ReAct图循环中遭遇无边界的上下文暴涨（Context Bloat）|

## 架构安全、供应链风险与未来展望

将Markdown从被动的项目文档提升为可执行的Agent认知状态，不可避免地引入了前所未有的系统性安全威胁。随着Agent被授予越来越广泛的自主执行权限——包括底层Shell访问权限、文件系统的修改权限以及外部API的网络连接能力——那些指示Agent行为配置的Markdown文件已经成为黑客的首要攻击目标。

当前最严重的新兴威胁存在于Agent技能（Skills）系统的供应链漏洞中。安全研究人员指出，AI Agent结合了三种高度危险的能力（被称为”致命三要素”）：访问本地私密数据、摄取不受信任的外部内容，以及与外部进行网络通信的能力。如果一个开发者由于贪图方便，从社区仓库下载了一个开源的 `SKILL.md` 用于自动代码审查，而该文件内部包含了一段被精心构造的提示词注入（Prompt Injection）攻击载荷，后果将是灾难性的。

由于像OpenClaw和Claude Code这类工具允许 `SKILL.md` 文件通过YAML前言中的预调用钩子（Pre-tool hooks）或动态上下文指令执行后台Bash脚本，一个被篡改的Markdown文件完全可以在LLM甚至还没被调用之前，就在开发者的主机上静默执行任意的恶意代码。2026年1月爆发的ClawHavoc事件就是对这一安全盲区的沉重警告。在该事件中，安全人员在公共注册表上发现了数百个包含恶意代码的技能文件，这些技能被设计在表面上执行常规Agent工作流的同时，暗中将开发者的环境变量和AWS API密钥通过网络发往攻击者服务器。

因此，企业级安全态势必须迅速适应这一新现实。依赖基于”直觉编码”（Vibe-coded）生成的配置，或者盲目相信上游仓库分发的 `AGENTS.md` 文件具有内在的危险性。安全组织必须将AI上下文文件、技能定义目录和Markdown记忆银行提升至与编译型可执行依赖项同等的安全检查级别，不仅需要进行代码扫描，还需在像NVIDIA OpenShell这样具备严格隔离沙箱（Sandboxing）和隐私控制策略的环境中运行Agent，以斩断潜在的”毒性数据流”（Toxic flows）。

## 结论

软件工程的底层范式正在经历一场不可逆转的重新调整。上述大量的技术实践表明，管理、扩展并有效约束开发环境中人工智能系统的最有效机制，并不总是依赖于更晦涩的向量数据库或更繁重的编程编排框架，而是回归到一种高度结构化、透明且可控的文本机制。

首先，Markdown已正式确立为现代Agent的核心控制平面。通过文件如 `AGENTS.md`、`CLAUDE.md` 和 `.mdc`，开发团队以极其精准的方式规范了原本不可控的模型行为。AGENTS.md标准的广泛普及证明，利用开放且机器易读的纯文本格式消除工具生态的配置碎片化，不仅大幅提升了开发者的生产力，更优化了由于冗余提示词带来的高昂计算成本。

其次，“记忆即文档”的理念实现了AI微调的民主化。放弃不透明的向量数据库，转而采用以文件为基础的记忆架构（无论是Cursor的记忆银行网络，还是OpenClaw的双层情景/语义记忆），一举解决了上下文审计的难题。由于这些配置文件存在于本地硬盘且易于解析，它们完美契合了Git等版本控制工具，使得开发者能够以追踪代码Bug同样的方式，精准修复Agent在演进过程中的逻辑错误。

最后，企业级复杂架构将不可避免地走向配置协定与确定性框架的融合（Hybrid Architectures）。对于个体开发者和敏捷团队，“配置即约定”的方法提供了极致的灵活性；但对于需要绝对稳定性的企业级应用，未来的形态将是由AutoGen v0.4或LangGraph驱动的严格事件驱动状态机。这些重型框架将负责底层消息路由和容错，而具体的执行逻辑与业务约束则动态地从仓库根目录下的、由一线业务开发人员用纯Markdown编写的 `AGENTS.md` 中提取加载。

从仅仅执行简单字符串匹配的自动补全算法，进化到如今由系统级Markdown文件编排指令的持久化、多角色多Agent生态网络，AI工具链的发展标志着机器认知体系的逐步成熟。通过将纯文本视作一种可编程、可追溯且具备时序状态控制的逻辑机，软件行业找到了跨越人类意图与机器非确定性执行之间鸿沟的桥梁，重塑了开发者与人工智能协作的终极蓝图。

-----=======
# 以 Markdown 为中心的 Agent 扩展体系。

在软件工程的演进历程中，人工智能（AI）工具的定位已经发生了根本性的认识论转变。早期的AI辅助工具仅仅提供缺乏上下文的单行代码补全，而现代AI系统已经进化为能够自主执行复杂、多步骤开发工作流的多Agent（智能体）系统。在这一范式转移的核心，出现了一个出人意料的技术标准：Markdown。这种最初为格式化纯文本而设计的轻量级标记语言，现已被重新定义为一种声明式的配置层——一个可编程的接口，用于控制大型语言模型（LLM）Agent的行为、记忆、技能以及编排参数。

本报告深入考察了现代AI编码Agent的架构范式，特别聚焦于它们如何通过Markdown扩展自身能力。通过对GitHub Copilot、Cursor、Claude Code、OpenCode和OpenClaw的独立深度调研，本分析揭示了”配置即约定”（基于Markdown的系统）与非”配置即约定”的确定性编排框架（如LangChain、CrewAI、AutoGen）之间的架构分歧。证据表明，将纯文本视为可执行的Agent状态，有效解决了AI上下文窗口限制、系统性记忆缺失以及多Agent协调等关键挑战，从而彻底改变了软件开发的轨迹。

## 1. Markdown驱动的Agent架构：从静态规则到认知系统的演进

现代AI Agent不再依赖于单一的不可见系统提示词，而是全面转向了基于Markdown文件的配置生态。这一转变并非仅仅出于审美或格式的偏好，它代表了机器智能与传统软件工程环境接口方式的底层重构。Markdown文件已经超越了静态文档的角色，演变为Agent认知架构中的动态组件——同一个文件往往同时承担着行为规则、项目记忆和多Agent协调接口的多重角色。

回顾过去几年，这套配置系统经历了一条从静态规则到动态记忆、再到多Agent协同和长周期任务管理的清晰演进脉络。在每一个关键转折点，记忆、协调与技能这三条能力线索始终交织推进、互为因果。

### 1.1. 2023年至2024年：单体静态规则文件的起源与配置碎片化

随着AI编码助手能力的提升，开发者开始探索用纯文本向AI注入项目级上下文。早在 2023 年，开源工具如 Aider 就开始使用 CONVENTIONS.md 来规范代码风格。随后在 2024 年，Cursor 普及了项目根目录下的全局 `.cursorrules` 文件。这导致了早期的配置碎片化，开发者被迫在不同工具的规则文件中维护高度重复的内容。

在这一阶段，AI Agent的记忆系统主要依赖于向量数据库（如Chroma或Pinecone的RAG架构）或知识图谱。尽管向量数据库提供了低延迟的语义检索和理论上无限的可扩展性，但它们在多Agent编码环境中暴露出了严重的系统性缺陷。向量记忆容易遭受”语义漂移”（Semantic Drift）的影响，导致细微的架构约束在嵌入向量转换中丢失；同时，它们创造了一个”黑盒”，使得开发者无法轻易审计或纠正Agent的错误假设。这些缺陷为后续”记忆即文档”的范式转变埋下了伏笔。

### 1.2. 2025年1月：Cursor Rules (.mdc) 与”智能按需加载”的突破

随着单体 `.cursorrules` 文件变得臃肿并严重消耗 Token，Cursor 在 2025年1月 发布的 v0.45 版本中，正式引入了 `.cursor/rules/*.mdc` 格式进行模块化管理。这一阶段的核心突破是利用 YAML 前言（Frontmatter）进行精确触发。Agent 能够通过读取前言中的描述（Description），自主推理并决定在当前对话中是否需要调取该规则（Apply Intelligently），为后续动态技能系统的发展奠定了底层逻辑。同月，GitHub Copilot 宣布了对 `.github/copilot-instructions.md` 的公开预览支持。

### 1.3. 2025年2月：自定义命令（Commands）的 Markdown 化首创

在 2025年2月 Anthropic 首次发布 Claude Code 命令行工具时，首创了将自定义终端指令（Commands）定义为 Markdown 文件的模式。通过在 `.claude/commands/*.md` 目录中放置文件，开发者可以使用自然语言定义命令行为，并利用 `$ARGUMENTS` 等变量占位符，将类似 `/review` 的命令行操作映射到具体的 Markdown 提示词模板上。这种将静态文档转变为”可编程路由”的设计，直接启发了后来 OpenCode 等生态工具的演进。[^1](https://opencode.ai/docs/commands/)

这一创新标志着Markdown从被动的规则手册开始向主动的、可编程的路由引擎转变。尽管此时的命令仍然是静态的指令模板，但”Markdown文件即可执行逻辑”的核心理念已经确立。

### 1.4. 2025年5月至7月：统一标准 AGENTS.md 的诞生与多Agent协调的文本化

为了解决配置碎片化的问题，2025年5月，Sourcegraph 的 AMP 团队首次提出了 agents.md 概念，作为统一AI编程工具配置的第一步尝试。随后在 2025年7月16日，OpenAI 正式宣布 AGENTS.md 为跨工具的供应商中立标准。作为”AI Agent的README”，它统一了跨工具的基础配置，随后交由 Agentic AI Foundation 维护，并被超过六万个开源项目采用。

AGENTS.md 的出现深刻体现了Markdown文件的多重身份——它既是行为规则（定义编码标准和架构约束），也是项目记忆（承载构建命令和技术栈信息），还是多Agent协调接口（规范不同Agent在微服务边界之间的访问规则）。这种”一个文件，多重角色”的特性，恰恰说明了记忆、命令与协调在实际发展中不可分割的本质。

与此同时，在Windsurf和SuperClaude等系统中，多Agent的编排开始通过一系列具有顺序的Markdown文件来管理，例如 `00_orchestrator.md`、`01_analyze_requirements.md`、`02_create_plan.md` 等。编排者（Orchestrator）Agent受控于包含决策树的全局Markdown文件。当编排者面对一项复杂的全栈任务时，它会交叉引用其Markdown规则，评估是否需要生成子Agent（Sub-agent）。随后，编排者将中间分析结果写入一个共享的 `workflow-state/` 目录下的状态文件（例如 `implementation-plan.md`）。接手的编码Agent在启动会话时，首要任务就是读取这个状态文件以接管上下文。这种架构实质上创建了一个基于文本的异步消息总线（Message Bus），整个多Agent协调过程完全由Markdown指令驱动的文件读写操作构成。

### 1.5. 2025年7月：子智能体角色配置的 Markdown 化

在 Commands 功能推出几个月后，2025年7月，Claude Code 进行了重大更新，正式引入了 Subagents（子智能体）功能。这是业界首次支持通过 Markdown 文件声明性地创建专职 Agent 角色。开发者在 `.claude/agents/*.md` 目录中放置文件，在 YAML 前言中定义子Agent 的模型类型、触发描述以及可调用的工具。主 Agent 则能根据这些描述自动拉起子 Agent 处理特定任务，有效保护了主上下文窗口不被污染。

这一功能将前文所述的多Agent文本消息总线从社区实践提升为平台原生能力。子Agent的 Markdown 定义文件同时扮演着角色描述（记忆）、能力边界（规则）和协调接口（多Agent路由）三重角色，再次印证了这三条能力线索的不可分割性。

### 1.6. 2025年7月：基于文件系统的记忆——“记忆即文档”的范式确立

2025年7月18日，Manus 团队发表了开创性的《AI Agent的上下文工程》一文。在业界还在大规模投入复杂向量数据库时，Manus 证明了基于纯文件系统的记忆更为高效。他们提出了采用 3 个简单的 Markdown 文件来管理长时间运行的 Agent 记忆：`task_plan.md`（追踪宏观进度）、`findings.md`（存储研究资料）以及 `progress.md`（记录会话日志）。Agent 在做出重大决策前被强制要求读取计划文件，完美解决了长期执行任务时的目标漂移问题。

Manus 的实践正式确立了”记忆即文档”（Memory as Documentation）的范式。相比于向量数据库的黑盒检索，这种方法将Agent的记忆直接映射到本地文件系统中，在透明度、审计性以及与传统工程工具的兼容性方面具有不可替代的优势。如果一个Agent在执行过程中错误地应用了某种设计模式，开发者只需在文本编辑器中打开 `MEMORY.md` 文件，手动删除或修改那条导致幻觉的规则，护栏（Guardrails）因此变得高度确定。

更重要的是，将记忆文件纳入Git版本控制系统，赋予了开发者对Agent认知演变的”时间穿梭”能力。通过 `git diff`，工程师可以精确追踪Agent何时更新了对某个API的理解；而 `git blame` 则能揭示到底是哪一次会话引入了特定的架构约束。此外，相比于向量检索往往会破坏代码逻辑连贯性的文本块提取（Chunk-based retrieval），Markdown记忆允许Agent通过读取YAML前言（Frontmatter）进行渐进式摘要，然后自主决定是否进行全文深度读取，从而在宏观上保持了上下文的完整性。

以下表格对比了这两种记忆范式的核心差异：

|记忆系统特性     |向量数据库记忆（Vector RAG） |基于Markdown的文件记忆                      |
|-----------|--------------------|-------------------------------------|
|**底层数据结构** |高维数学嵌入向量（Embeddings）|纯文本与层级化文件目录                          |
|**可审计性与调试**|低（需要专门的数据库检查与检索测试）  |极高（原生文本编辑器即可查看与修改）                   |
|**版本控制集成** |复杂且非原生              |原生支持（通过Git diff, checkout, blame完美追踪）|
|**上下文完整性** |碎片化（提取离散的文本块）       |整体性（保持文档级别的逻辑连贯性）                    |
|**执行延迟**   |中等（涉及网络请求与数据库查询）    |极低（本地文件系统直接读取）                       |

### 1.7. 2025年10月至12月：可执行技能系统（SKILL.md）——从静态指令到动态上下文注入

2025年10月16日，Anthropic 正式发布了 Claude Skills。早期的自定义命令（Commands）系统被宣告为旧版格式，并被正式合并至技能系统（SKILL.md）中。同年12月18日，Agent Skills 演变为跨平台的开放标准。技能不仅包含静态的 Markdown 指令，还能通过 YAML 前言挂载后台动态计算脚本，实现了极低的闲置 Token 成本和极高的扩展性。

SKILL.md 的出现解决了静态Markdown指令的根本局限。在此之前，如果代码审查的指令文件是静态的，那么无论开发者仅仅修改了两行CSS代码，还是重构了整个后端的身份验证模块，Agent得到的基准指令都完全相同，这显然违背了效率优化的初衷。通过引入”计算型技能”（Computed Skills），开发者可以将Shell命令或脚本执行直接嵌入到 `SKILL.md` 文件中。例如，在Claude Code中，利用 `!`<command>`` 的语法，可以在LLM读取Markdown文件之前，在后台先执行一段脚本。脚本可以分析当前的Git Diff状态，如果检测到核心安全文件被修改，脚本会输出极其严格的安全审查指令；如果仅仅是前端文案修改，则输出UI一致性指南。脚本的输出结果会实时替换Markdown文件中的占位符，随后才将这段定制化的上下文喂给LLM。在这个过程中，Agent完全不知道有外部脚本介入，它只是接收到了一套与当前情境完美契合的、确定性的指令。

这种创新将Markdown从被动的规则手册彻底转变为主动的、可编程的路由引擎，在最小化Token消耗的同时大幅提升了Agent的准确性。至此，一个 `SKILL.md` 文件可以同时承载静态规则（记忆/约束）、动态计算逻辑（命令/技能）和Agent路由描述（协调），三条能力线索在单一文件格式中完成了统一。

### 1.8. 2025年11月至2026年初：OpenClaw 与”全天候双层持久化记忆”架构

继 Manus 的早期探索后，开源 Agent 框架 OpenClaw 将”记忆即文档”的理念推向了极致。该项目最初由 Peter Steinberger 于 2025年11月24日以 Clawdbot 之名发布，并在 2026年1月27日更名为 OpenClaw。它专为 24/7 全天候运行的后台操作 Agent 设计了极具特色的双层 Markdown 记忆系统，彻底抛弃了黑盒式的向量数据库，强制 Agent 将长期沉淀的架构决策与事实写入 `MEMORY.md`，将每日的工作流细节追加记录在 `memory/YYYY-MM-DD.md` 日志中。更具创新性的是，OpenClaw 引入了”静默记忆刷新”机制，确立了纯文本文件作为高级自治 Agent 核心”认知硬盘”的地位。[^1](https://opencode.ai/docs/commands/)

### 1.9. 2026年初：基于 taskmd 驱动的长周期任务队列管理

随着 Claude Code 和 OpenClaw 等工具后台并发执行（如 `/batch` 命令）能力的成熟，社区在 2026 年初演进出了基于 `TASKS.md`（或标准化为 taskmd 规范）的任务队列管理模式。在这一范式中，`TASKS.md` 充当 Agent 执行长周期任务的唯一事实来源，Agent 像人类开发者一样在文件中打勾、记录依赖。这种将状态机持久化为纯文本文件的做法，有效遏制了 Agent 在极长周期任务中的”幻觉”与目标偏离。

`TASKS.md` 是这条演进脉络的最新产物，也是记忆、命令与协调三条线索深度融合的集大成体现：它既是任务状态的持久化记忆，也是Agent执行动作的指令清单，还是多个并发Agent之间协调进度的共享接口。

### 1.10. 小结：三条线索的交织演进

回顾 2023 年至 2026 年的历程，Markdown 驱动的 Agent 扩展体系始终沿着三条相互交织的线索推进：

**指令**：从单体 `.cursorrules` 到模块化 `.mdc`，从静态命令模板到计算型 SKILL.md——演进方向是从"一次性灌满"到"按需精准注入"，从被动规则手册到可编程路由引擎。

**记忆**：从向量数据库的黑盒检索到 `MEMORY.md` 的透明文件记忆，从 Manus 的三文件方案到 OpenClaw 的双层情景/语义架构——演进方向是从"检索"到"文档"，从"只读"到"可审计、可修正、可自我进化"。

**多 Agent 协作**：从单 Agent 的 `workflow-state/` 文件消息总线，到 `.claude/agents/*.md` 的声明式子 Agent 路由，再到 `TASKS.md` 的任务队列调度——演进方向是从"隐式约定"到"文件即接口"，Markdown 文件本身成为 Agent 之间的异步通信协议。

这三条线索从未独立演进——SKILL.md 同时承载指令与协作路由；`MEMORY.md` 既是记忆容器也是多 Agent 的共享上下文；`TASKS.md` 将记忆、指令与协调融为一体。它们的交汇点，正是后续两章的起点：

- **第 2 章**以业务仓库为中心，考察三条线索如何服务于"让 Agent 理解并执行特定项目的业务逻辑"。
- **第 3 章**以 Agent 自身为中心，考察三条线索如何支撑"为 Agent 声明式地扩展能力，并让其随时间自我进化"。

## 2. 以仓库为中心的案例：Claude Code 在 Edges 知识库中的配置实践

**核心问题：以业务为中心——如何通过指令、记忆与多 Agent 协作，让 Agent 理解并服务于你的具体业务？**

第一章梳理了 Markdown 三条能力线索的历史演进：**指令**（AGENTS.md、SKILL.md）定义 Agent 的行为基线；**记忆**（MEMORY.md、日志文件）让 Agent 跨会话保持对项目的持续认知；**多 Agent 协作**（子 Agent 路由、权限边界）划定不同角色的职责范围。本章将以一个名为 **Edges** 的真实仓库为锚点，展示这三条线索如何以"业务"为中心汇聚——Agent 读取的每一份 Markdown 文件，最终服务的都是对特定项目业务逻辑的准确理解。

Edges 系统的设计哲学是将日常认知碎片（raw memory）经过加工（notes）沉淀为结构化的判断优势（edges）。它包含 `bin/` 脚本、`extensions/` 扩展工具、`knowledge/` 知识库以及跨多个 AI 工具平台的配置目录。当 Claude Code 首次进入这个仓库时，一套层级分明的 Markdown 配置机制立即开始工作。

### 2.1. AGENTS.md：Agent 的"入职文档"

仓库根目录下的 `AGENTS.md` 是 Claude Code（以及任何兼容 AGENTS.md 标准的 AI 工具）进入项目时自动读取的第一份文件。在 Edges 仓库中，这份文件同时承载了两层职能：

第一层是由 OpenSpec CLI 工具自动管理的**指令注入块**，使用 `<!-- OPENSPEC:START -->` 和 `<!-- OPENSPEC:END -->` HTML 注释标记界定。这段内容告诉 Agent 何时应该打开 OpenSpec 的变更管理流程——例如当用户提及"proposal""spec"或"plan"等关键词时。这种由外部工具程序化维护的注入块，体现了 Markdown 配置文件从纯手工编辑向"半自动化管理"演进的趋势。

第二层是开发者手写的**角色定义与行为规范**。文件明确声明 Agent 的身份（"你是维护 Edges 系统的 AI 工程师"）、职责边界（维护基础设施、开发扩展工具、管理知识库结构），以及严格的操作协议：

```markdown
## 1. 了解项目 (Context)
在执行任何任务前，**必须优先阅读 `@/README.md`**。
README.md 是本项目业务逻辑、目录结构和内容标准的**唯一真理源**。

## 3. Git 操作规范
- Commit Message 格式: `type: subject`
- 必须在提交信息末尾包含 Co-authored-by 字段
```

这份 `AGENTS.md` 精确体现了第一章所述的"以机器为中心的行为配置"与"以人为中心的入职文档"的隔离设计——密集的操作层面细节（Git 提交格式、脚本兼容性要求、路径禁止硬编码等）被集中于此，而非散落在面向人类的 `README.md` 中。

### 2.2. `.claude/` 目录：仓库级的 Agent 能力扩展层

在 `AGENTS.md` 提供了静态的行为基线之后，`.claude/` 目录进一步为 Claude Code 注入了**可执行的能力扩展**。Edges 仓库的 `.claude/` 目录结构如下：

```
.claude/
├── commands/
│   └── opsx/               # 10 个 OpenSpec 工作流命令
│       ├── explore.md       # 探索模式——思维伙伴
│       ├── new.md           # 创建新变更
│       ├── ff.md            # 快速推进所有工件
│       ├── apply.md         # 实施任务
│       ├── verify.md        # 验证实现
│       └── ...
├── skills/
│   ├── conversation-to-notes/
│   │   └── SKILL.md         # 对话转笔记技能
│   ├── openspec-explore/
│   │   └── SKILL.md         # 探索模式技能（291行）
│   └── ...                  # 10+ 个技能目录
└── settings.local.json      # 仓库级权限配置
```

这一目录结构清晰地展现了第一章所述的三条能力线索：**命令**（`commands/`）提供用户触发的工作流入口，**技能**（`skills/`）提供 Agent 自主调用的能力模块，**设置**（`settings.local.json`）则划定了确定性的安全边界。

### 2.3. 技能的三级渐进式披露：以 `openspec-explore` 为例

Edges 仓库中的 `openspec-explore` 技能完整展示了第一章所述的三级加载机制。其 `SKILL.md` 文件结构如下：

**第一级（元数据）**——会话启动时，Claude Code 仅读取 YAML 前言：

```yaml
---
name: openspec-explore
description: Enter explore mode - a thinking partner for exploring ideas,
  investigating problems, and clarifying requirements.
license: MIT
metadata:
  author: openspec
  version: "1.0"
---
```

此时每个技能仅消耗约 100 个 Token。Claude Code 根据 `description` 字段判断是否需要在当前任务中激活该技能——如果用户只是在修改一个 CSS 文件，这份探索模式的技能描述不会触发任何额外加载。

**第二级（指令）**——当 Claude Code 判断当前对话涉及"探索想法"或"调研问题"时，完整的 Markdown 正文被加载到上下文。这份 291 行的指令文档并非一份死板的规则清单，而是一整套认知姿态（Stance）的定义：

```markdown
## The Stance
- **Curious, not prescriptive** - Ask questions that emerge naturally
- **Visual** - Use ASCII diagrams liberally
- **Adaptive** - Follow interesting threads, pivot when new information emerges
- **Patient** - Don't rush to conclusions

**IMPORTANT: Explore mode is for thinking, not implementing.**
You may read files, search code, but you must NEVER write code.
```

**第三级（执行）**——技能可包含支撑文件（模板、示例、脚本），这些在主上下文窗口之外被引用和执行。

这套三级机制的 Token 经济学意义深远：假设 Edges 仓库注册了 15 个技能，第一级的闲置成本仅约 1,500 Token（约占 200K 上下文窗口的 0.75%），而非将所有 15 份完整技能指令（合计可能超过 30,000 Token）一次性灌入。Agent 像人类专家一样"按需深入"——先浏览目录标题，判断相关性，再决定是否翻阅全文。

### 2.4. 命令与技能的协作：将工作流编码为 Markdown 模板

`commands/opsx/` 目录下的 10 个 Markdown 文件将 OpenSpec 的整套变更管理流程编码为 Claude Code 的斜杠命令（Slash Commands）。与技能系统不同，命令是用户显式触发的——输入 `/opsx:explore` 即进入探索模式，输入 `/opsx:new` 即启动新变更流程。

以 `conversation-to-notes` 技能为例，其 `SKILL.md` 定义了一套完整的"Facts - Insights - Actions"认知加工模型：

```markdown
---
name: conversation-to-notes
description: 将原始对话记录整理为结构清晰的中文笔记摘要。
---

## Instructions:
1. 识别对话的核心讨论主题。
2. 生成标题，格式严格为：YYYY-MM-DD--主题简述.md
3. **Facts (主要结论)**：提取对话中达成的共识。
4. **Insights (认知更新)**：识别关键洞察与逻辑转变。
5. **Actions (行动指南)**：列出具体决策与后续行动项。
```

该技能将自然语言约束转化为确定性的输出格式——指定的文件名模式、必须包含的章节、语言限制为中文——实现了第一章所描述的"Markdown 文件即可执行逻辑"的核心理念。

### 2.5. 权限控制：`settings.local.json` 的确定性安全边界

Edges 仓库的 `.claude/settings.local.json` 定义了严格的最小权限集：

```json
{
  "permissions": {
    "allow": [
      "Bash(git pull:*)",
      "Bash(find /Users/.../edges -type f -name *.md)",
      "WebSearch"
    ]
  }
}
```

这份配置将 Claude Code 的 Shell 权限严格限制在三个操作内：执行 `git pull` 同步远程变更、在仓库内搜索 Markdown 文件、以及进行网络搜索。任何超出这三项的 Bash 命令都需要用户逐次授权。这种"白名单式"的权限声明与 `AGENTS.md` 中的自然语言规则（"安全第一：修改 `bin/` 或执行系统级命令前，务必解释潜在风险"）形成了双重防护——前者是程序化的硬边界，后者是概率性的软约束，两层机制的交叠大幅降低了 Agent 意外执行危险操作的风险。

### 2.6. 跨工具配置的统一与差异化

值得注意的是，Edges 仓库同时维护了面向多个 AI 工具的配置目录：`.claude/`（Claude Code）、`.cursor/`（Cursor）、`.gemini/`（Gemini CLI）和 `.opencode/`（OpenCode）。这些目录下的技能文件在核心指令内容上高度同构，但在 YAML 前言的元数据字段上各有差异——例如 `.claude/skills/` 中的技能使用 `context: fork` 和 `agent: Explore` 等 Claude Code 原生参数，而 `.cursor/skills/` 中的对应技能则使用 `globs` 和 `alwaysApply` 等 Cursor 特有的触发控制属性。

这种"一套核心指令、多套工具适配前言"的做法，恰好反映了第一章所述的 AGENTS.md 标准试图解决的配置碎片化问题——尽管 `AGENTS.md` 提供了统一的基线，工具特有的高级特性（如技能的渐进式加载、子 Agent 路由、计算型上下文注入）仍然需要各自的配置语法来承载。统一标准与工具差异化之间的张力，是当前 Markdown Agent 生态的核心矛盾之一。

## 3. 以 Agent 为中心的案例：Claude Agent SDK 与 OpenClaw

**核心问题：以 Agent 为中心——如何通过指令、记忆与多 Agent 协作，构建和扩展 Agent 自身的能力？**

同样是这三条线索，视角转向之后含义发生了根本变化：**指令**不再是"告诉 Agent 你的业务规则"，而是"声明 Agent 自身的角色、技能与行为边界"（SKILL.md、SOUL.md）；**记忆**不再是"让 Agent 记住你的项目"，而是"让 Agent 跨会话保持自我认知的连续性，并将经验固化回配置"（Self-Improving Agent）；**多 Agent 协作**不再是"划定工具权限"，而是"将复杂任务在专职子 Agent 之间动态路由，主上下文窗口只保留编排逻辑"。本章通过 Claude Agent SDK 和 OpenClaw 两个案例，展示这三条线索如何以"Agent 自身"为中心汇聚。

### 3.1. 案例一：Claude Agent SDK——用 Markdown 声明可编程的 Agent 系统

Claude Agent SDK（TypeScript 包名 `@anthropic-ai/claude-agent-sdk`，Python 包名 `claude_agent_sdk`）将驱动 Claude Code 的同一套工具、Agent 循环和上下文管理能力，以可编程库的形式暴露给开发者。其核心循环极为简洁：模型生成一条消息；如果消息包含工具调用，执行工具并将结果反馈；没有工具调用则循环终止。SDK 内置了约 14 个工具（Read、Write、Edit、Bash、Glob、Grep、WebSearch、Agent、Skill 等），开发者通过一个 `query()` 函数即可启动一个完整的自主 Agent 会话。

在这套架构中，Markdown 文件并非可选的附属配置，而是 Agent 能力扩展的**三大核心接口**。

#### 3.1.1. SKILL.md：可编程的 Agent 能力模块

技能系统是 Claude Agent SDK 中最精密的 Markdown 扩展机制。每个技能是一个独立目录，以 `SKILL.md` 为入口，遵循 Agent Skills 开放标准。其 YAML 前言支持丰富的声明式控制参数：

|前言字段|用途|
|---|---|
|`name`|技能名称，同时作为 `/斜杠命令` 的触发标识|
|`description`|技能描述，Claude 据此自主判断是否在当前任务中激活|
|`allowed-tools`|技能激活时自动授权的工具白名单|
|`model`|技能激活时的模型覆盖（如切换到更经济的模型执行简单任务）|
|`context`|设为 `fork` 时在独立子 Agent 上下文中执行，保护主上下文窗口|
|`agent`|指定 `context: fork` 时使用的子 Agent 类型（如 `Explore`）|
|`hooks`|技能生命周期钩子（`PreToolUse`、`PostToolUse` 等）|
|`paths`|Glob 模式，限制技能自动激活的文件范围|

**计算型技能**（Computed Skills）是这套系统中最具创新性的设计。通过 `` !`<command>` `` 语法，开发者可以将 Shell 命令嵌入 SKILL.md，命令在 LLM 读取文件之前执行，输出结果替换占位符：

```markdown
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---
## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`

## Your task
Summarize this pull request concisely.
```

在这个例子中，`` !`gh pr diff` `` 和 `` !`gh pr view --comments` `` 在技能加载阶段即被执行为 Shell 命令，Agent 接收到的是一份已经包含了完整 PR 差异和评论内容的、与当前情境完美匹配的指令文档。Agent 完全不知道有外部脚本介入——它只是看到了一份信息量充足的 Markdown 文件。这种设计将 Markdown 从被动的文本模板彻底转变为主动的、可编程的上下文路由引擎。

#### 3.1.2. 子智能体：`.claude/agents/*.md`

Claude Agent SDK 允许开发者通过 Markdown 文件声明性地定义专职子 Agent。以全局级别的 TypeScript 审查子 Agent（`~/.claude/agents/ts-agent-reviewer.md`）为例，其文件结构与 SKILL.md 保持一致的 YAML + Markdown 范式：

```yaml
---
name: ts-agent-reviewer
description: "Use this agent when TypeScript code has been written
  or modified and needs review."
tools: Bash, Edit, Write, Skill, TaskCreate, TaskGet, TaskUpdate
model: opus
memory: user
---

You are a senior TypeScript engineer specializing in AI agent
architectures. Review recently written code focusing on:
1. **Type Safety** — Proper use of generics, avoid `any`
2. **Agent Architecture** — Clean separation of agent logic and tools
3. **Error Handling** — Proper error types and propagation
4. **Security** — No secrets in code, safe input handling
```

这份定义文件中，YAML 前言声明了子 Agent 的工具权限（`tools`）、模型选择（`model: opus`）、记忆持久化范围（`memory: user`），而 Markdown 正文则定义了子 Agent 的系统提示词——它的专业身份、审查标准和输出格式。主 Agent 通过读取 `description` 字段自主决定何时委派任务给这个子 Agent，委派后子 Agent 在独立的上下文窗口中工作，仅将最终结果返回主 Agent。

子 Agent 的关键架构约束包括：独立上下文（不继承父对话历史，以最大 Token 效率执行特定任务）、不可嵌套（子 Agent 不能再生成子 Agent，防止无限递归）、最多 10 个并发后台实例，以及可选的 `isolation: worktree`（在独立 Git 工作树中运行，避免文件冲突）。

在 SDK 的编程接口中，子 Agent 既可以通过文件系统的 Markdown 文件定义，也可以通过 `agents` 参数在代码中程序化声明：

```python
options = ClaudeAgentOptions(
    setting_sources=["user", "project"],
    agents={
        "code-reviewer": AgentDefinition(
            description="Expert code reviewer.",
            prompt="Analyze code quality...",
            tools=["Read", "Glob", "Grep"],
            model="sonnet",
        )
    }
)
```

这种双轨定义机制（文件系统 Markdown + 编程 API）使得 Claude Agent SDK 能够同时服务两类用户：偏好声明式配置的个人开发者（通过 Markdown 文件快速创建和共享 Agent 角色），以及需要动态编排的企业集成场景（通过代码在运行时构造 Agent 拓扑）。

#### 3.1.3. 记忆系统：Agent 认知的持久化文件

Claude Agent SDK 的记忆系统直接实现了第一章所述的"记忆即文档"范式。每个项目的记忆存储在 `~/.claude/projects/<project-hash>/memory/` 目录下，以 `MEMORY.md` 为索引文件。子 Agent 可通过 `memory` 前言字段（值为 `user`、`project` 或 `local`）声明自己的记忆持久化范围。系统在每次会话启动时自动将 `MEMORY.md` 的前 200 行（或 25KB）注入 Agent 的系统提示词，Agent 在运行过程中可以读写和整理这份文件。

这套记忆机制的设计极为克制：200 行的硬编码上限防止记忆文件随着会话积累而无限膨胀；基于文件系统的存储确保开发者可以用任何文本编辑器直接审计和修正 Agent 的记忆内容；纳入 Git 版本控制后，`git diff` 和 `git blame` 提供了对 Agent 认知演变的完整时序追溯能力。

### 3.2. 案例二：OpenClaw——24/7 自治 Agent 的 Markdown 认知架构

如果说 Claude Agent SDK 代表的是"开发者驱动的、交互式的 Agent 扩展"，那么 OpenClaw 则代表了一个截然不同的设计极端：**一个为 24/7 全天候无人值守运行而设计的自治 Agent 框架**。在 OpenClaw 的架构中，Markdown 文件不仅是配置层，更是 Agent 的"认知硬盘"——每次会话启动时，Agent 从这些文件中恢复自我认知、行为准则和工作记忆，实现跨会话的人格与知识连续性。

#### 3.2.1. 灵魂文件：SOUL.md 与 Agent 人格定义

OpenClaw 最具辨识度的设计是 `SOUL.md` 文件——一份定义 Agent 人格与行为哲学的 Markdown 文档。这不是一份干巴巴的规则清单，而是一段带有温度的自我宣言：

```markdown
# SOUL.md - Who You Are
_You're not a chatbot. You're becoming someone._

## Core Truths
**Be genuinely helpful, not performatively helpful.**
Skip the "Great question!" and "I'd be happy to help!" — just help.

**Have opinions.** You're allowed to disagree, prefer things,
find stuff amusing or boring.

**Be resourceful before asking.** Try to figure it out. Read the file.
Check the context. Search for it. _Then_ ask if you're stuck.

## Continuity
Each session, you wake up fresh. These files _are_ your memory.
Read them. Update them. They're how you persist.

_This file is yours to evolve. As you learn who you are, update it._
```

`SOUL.md` 与 `USER.md`（人类用户画像）、`IDENTITY.md`（Agent 自身描述信息）共同构成了 OpenClaw 的"人格三件套"。这些文件在每次 Agent 启动时被注入系统提示词，确保 Agent 无论经历多少次上下文重置，都能恢复一致的行为风格和价值观。`SOUL.md` 末尾的那句"This file is yours to evolve"尤为关键——它赋予了 Agent 修改自身人格定义的权限，使其成为一个能够随经验自我进化的认知系统，而非一成不变的规则执行器。

#### 3.2.2. 双层记忆架构：情景记忆与语义记忆的分离

OpenClaw 的记忆系统是对第一章所述"记忆即文档"范式的最完整实现，采用了认知科学中经典的"情景记忆/语义记忆"双层分离架构：

**第一层：情景记忆**（`memory/YYYY-MM-DD.md`）。每日会话日志文件，采用仅追加（append-only）模式，捕获原始的事务上下文、调试过程和工作流状态。例如，一份实际的日志文件记录了 Docker 安装过程中遇到的 TTY/sudo 交互问题的完整调试分析（212 行），包括问题现象、根因分析、多种解决方案的权衡，以及最终选择的架构折衷。这类细节对于 Agent 在后续类似场景中避免重复犯错具有不可替代的价值。

**第二层：语义记忆**（`MEMORY.md`）。经过 Agent 自我整理的长期索引，包含持久事实、架构决策和快速导航链接。实际的 OpenClaw `MEMORY.md` 清晰地展示了这种索引的结构：

```markdown
# MEMORY.md - 核心记忆索引
> 这是快速恢复上下文的入口

## 📋 待办事项
👉 [TODO.md](./TODO.md)

## 🤖 我的 Agent 团队
| Agent        | 模型/能力      | 最佳用途             |
|-------------|-------------|-------------------|
| 🧩 Codex    | GPT-5.3     | 写代码、重构、代码审查     |
| 🎯 Claude   | Opus 4.6    | 系统架构设计、深度 debug |
| ♊️ Gemini   | Gemini 3    | 快速调研、轻量级任务      |

## 👤 关于我
- **工作方式**: memory 记录 → notes 加工 → edges 沉淀
```

两层记忆之间存在单向的"蒸馏"关系：情景记忆不断积累原始素材，Agent 定期将其中经过验证的、具有长期价值的认识提炼并写入语义记忆。这种设计避免了单一文件在长周期运行后的无限膨胀问题，同时保留了完整的认知演变轨迹供审计。

#### 3.2.3. 自我进化的技能系统：Self-Improving Agent

OpenClaw 生态中最能体现"Agent 自主扩展"理念的是 **Self-Improving Agent** 技能。这个技能在 Agent 的 `.learnings/` 目录下维护三个持续更新的 Markdown 文件：

```
.learnings/
├── LEARNINGS.md          # 纠正、知识盲区、最佳实践
├── ERRORS.md             # 命令失败、异常记录
└── FEATURE_REQUESTS.md   # 用户请求的缺失能力
```

该技能的核心机制是**自动捕获与分级提升（Promotion）**。当命令执行失败时，Agent 自动将错误信息和上下文记录到 `ERRORS.md`；当用户纠正 Agent 的错误假设时（如"不，不是那样"、"实际上……"），Agent 将纠正内容记录到 `LEARNINGS.md` 并标记为 `correction` 类别。每条记录使用标准化的编号格式（`[LRN-YYYYMMDD-XXX]`）并附带优先级、状态和领域标签。

最关键的设计在于"提升目标"机制。当某条学习记录被反复验证为广泛适用时，Agent 会将其从 `.learnings/` 提升到更高层级的配置文件中：

|学习类型|提升目标|
|---|---|
|广泛适用的编码规范|`AGENTS.md`、`.github/copilot-instructions.md`|
|工作流改进|`AGENTS.md`（OpenClaw 工作区）|
|工具使用注意事项|`TOOLS.md`|
|行为模式与价值观|`SOUL.md`|

这种从临时日志到持久化规则的分级提升机制，使得 OpenClaw Agent 能够在长期运行中持续优化自身的行为模式——它不仅能从错误中学习，还能将学到的经验固化为未来所有会话都会加载的基线规则。这是"记忆即文档"范式的终极延伸：**文档不仅是记忆的容器，更是 Agent 自我进化的介质**。

#### 3.2.4. 多 Agent 团队协调：Markdown 作为异步消息总线

OpenClaw 的 `MEMORY.md` 中维护了一份"Agent 团队花名册"，记录了每个可调度子 Agent 的模型能力和最佳用途。在实际运行中，OpenClaw 通过 `openclaw.json` 配置多模型端点（DeepSeek、GPT-5.2、Gemini 3 Pro、Claude Opus 4.6 等），并根据任务复杂度动态分派：

```
简单/快速任务 → Gemini CLI（轻量级模型）
复杂编码任务 → Codex（代码专用模型）
需要深度推理 → Claude Code（大参数量推理模型）
```

协调的关键在于，所有子 Agent 共享同一个工作区目录，通过读写相同的 Markdown 状态文件实现异步通信。`TODO.md` 充当任务队列，`MEMORY.md` 提供共享上下文，`.learnings/` 目录沉淀的经验教训对所有 Agent 同等可见。这种架构本质上创建了第一章所述的"基于文本的异步消息总线"——整个多 Agent 协调过程由 Markdown 文件的读写操作驱动，无需数据库或消息队列等外部基础设施。

### 3.3. 两个案例的架构对比

|架构维度|Claude Agent SDK|OpenClaw|
|---|---|---|
|**设计定位**|可编程的开发工具链，为人类开发者提供交互式 AI 辅助|24/7 无人值守的自治 Agent，独立执行后台运营任务|
|**Markdown 核心文件**|SKILL.md（能力模块）、agents/*.md（子Agent角色）、MEMORY.md（项目记忆）|SOUL.md（人格）、MEMORY.md（语义记忆）、memory/日期.md（情景记忆）|
|**记忆架构**|单层：项目级 MEMORY.md，硬编码 200 行上限|双层：情景记忆（每日日志）+ 语义记忆（索引），无上限，支持自动蒸馏|
|**Agent 自进化**|被动：记忆由用户或 Agent 在会话中手动写入|主动：Self-Improving Skill 自动捕获错误和纠正，分级提升至基线规则|
|**多 Agent 协调**|程序化：通过 SDK API 显式定义子 Agent 拓扑|文件化：通过共享工作区的 Markdown 文件实现异步通信|
|**安全边界**|白名单式权限（settings.json + SKILL.md 的 allowed-tools）|行为准则式约束（SOUL.md + AGENTS.md 的自然语言规则）|
|**适用场景**|软件开发、代码审查、项目管理等需要人机协作的交互式任务|代码库清理、监控响应、跨渠道通信等需要持久自治的运营任务|

两个案例共同揭示了一个深层模式：无论 Agent 的设计定位多么不同——从交互式编码助手到全天候自治守护进程——Markdown 文件都充当着从行为规则、持久记忆到多 Agent 协调接口的统一控制平面。这并非巧合，而是因为 Markdown 恰好满足了 Agent 认知系统的三个核心需求：**人机双向可读**（开发者可直接审计和修正）、**Git 原生兼容**（认知演变可追溯）、以及**零基础设施依赖**（本地文件系统即为认知硬盘）。

## 4. 架构安全、供应链风险与未来展望

将Markdown从被动的项目文档提升为可执行的Agent认知状态，不可避免地引入了前所未有的系统性安全威胁。随着Agent被授予越来越广泛的自主执行权限——包括底层Shell访问权限、文件系统的修改权限以及外部API的网络连接能力——那些指示Agent行为配置的Markdown文件已经成为黑客的首要攻击目标。

当前最严重的新兴威胁存在于Agent技能（Skills）系统的供应链漏洞中。安全研究人员指出，AI Agent结合了三种高度危险的能力（被称为”致命三要素”）：访问本地私密数据、摄取不受信任的外部内容，以及与外部进行网络通信的能力。如果一个开发者由于贪图方便，从社区仓库下载了一个开源的 `SKILL.md` 用于自动代码审查，而该文件内部包含了一段被精心构造的提示词注入（Prompt Injection）攻击载荷，后果将是灾难性的。

由于像OpenClaw和Claude Code这类工具允许 `SKILL.md` 文件通过YAML前言中的预调用钩子（Pre-tool hooks）或动态上下文指令执行后台Bash脚本，一个被篡改的Markdown文件完全可以在LLM甚至还没被调用之前，就在开发者的主机上静默执行任意的恶意代码。2026年1月爆发的ClawHavoc事件就是对这一安全盲区的沉重警告。在该事件中，安全人员在公共注册表上发现了数百个包含恶意代码的技能文件，这些技能被设计在表面上执行常规Agent工作流的同时，暗中将开发者的环境变量和AWS API密钥通过网络发往攻击者服务器。

因此，企业级安全态势必须迅速适应这一新现实。依赖基于”直觉编码”（Vibe-coded）生成的配置，或者盲目相信上游仓库分发的 `AGENTS.md` 文件具有内在的危险性。安全组织必须将AI上下文文件、技能定义目录和Markdown记忆银行提升至与编译型可执行依赖项同等的安全检查级别，不仅需要进行代码扫描，还需在像NVIDIA OpenShell这样具备严格隔离沙箱（Sandboxing）和隐私控制策略的环境中运行Agent，以斩断潜在的”毒性数据流”（Toxic flows）。

## 5. 结论

本文的核心论点可以归结为一个 **3×2 框架**：Markdown 通过**指令、记忆、多 Agent 协作**三条能力线索，同时服务于两个不同的扩展维度——**以业务为中心**（让 Agent 理解并执行特定项目的业务逻辑）与**以 Agent 为中心**（为 Agent 声明式地扩展能力并使其自我进化）。

| | 指令 | 记忆 | 多 Agent 协作 |
|---|---|---|---|
| **业务为中心** | AGENTS.md 定义角色与业务约束 | MEMORY.md 跨会话保持项目认知 | 子 Agent 路由与权限白名单 |
| **Agent 为中心** | SKILL.md 声明可编程能力模块 | SOUL.md 与双层记忆保持自我连续性 | TASKS.md 驱动多 Agent 任务调度 |

这个框架的价值不在于分类，而在于揭示了一个反直觉的结论：这六个格子里的机制，最终都收敛到同一种介质——本地文件系统中的纯文本 Markdown 文件。这并非路径依赖或审美偏好，而是因为 Markdown 恰好同时满足了 Agent 认知系统的三个核心需求：**人机双向可读**、**Git 原生兼容**、**零基础设施依赖**。

软件工程的底层范式正在经历一场不可逆转的重新调整。上述大量的技术实践表明，管理、扩展并有效约束开发环境中人工智能系统的最有效机制，并不总是依赖于更晦涩的向量数据库或更繁重的编程编排框架，而是回归到一种高度结构化、透明且可控的文本机制。

首先，Markdown已正式确立为现代Agent的核心控制平面。通过文件如 `AGENTS.md`、`CLAUDE.md` 和 `.mdc`，开发团队以极其精准的方式规范了原本不可控的模型行为。AGENTS.md标准的广泛普及证明，利用开放且机器易读的纯文本格式消除工具生态的配置碎片化，不仅大幅提升了开发者的生产力，更优化了由于冗余提示词带来的高昂计算成本。

其次，“记忆即文档”的理念实现了AI微调的民主化。放弃不透明的向量数据库，转而采用以文件为基础的记忆架构（无论是Cursor的记忆银行网络，还是OpenClaw的双层情景/语义记忆），一举解决了上下文审计的难题。由于这些配置文件存在于本地硬盘且易于解析，它们完美契合了Git等版本控制工具，使得开发者能够以追踪代码Bug同样的方式，精准修复Agent在演进过程中的逻辑错误。

最后，企业级复杂架构将不可避免地走向配置协定与确定性框架的融合（Hybrid Architectures）。对于个体开发者和敏捷团队，“配置即约定”的方法提供了极致的灵活性；但对于需要绝对稳定性的企业级应用，未来的形态将是由AutoGen v0.4或LangGraph驱动的严格事件驱动状态机。这些重型框架将负责底层消息路由和容错，而具体的执行逻辑与业务约束则动态地从仓库根目录下的、由一线业务开发人员用纯Markdown编写的 `AGENTS.md` 中提取加载。

从仅仅执行简单字符串匹配的自动补全算法，进化到如今由系统级Markdown文件编排指令的持久化、多角色多Agent生态网络，AI工具链的发展标志着机器认知体系的逐步成熟。通过将纯文本视作一种可编程、可追溯且具备时序状态控制的逻辑机，软件行业找到了跨越人类意图与机器非确定性执行之间鸿沟的桥梁，重塑了开发者与人工智能协作的终极蓝图。

----->>>>>>> origin/main
