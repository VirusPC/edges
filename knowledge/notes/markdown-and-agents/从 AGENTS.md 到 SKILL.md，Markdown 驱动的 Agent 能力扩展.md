
# 从 AGENTS.md 到 SKILL.md，Markdown 驱动的 Agent 能力扩展

```mermaid
graph LR A["单体规则<br/>AGENTS.md"] --> B["模块化规则&技能<br/>Rules按需加载"] --> C["自定义命令<br/>Commands可执行"] --> D["记忆<br/>Memory跨会话"] --> E["多Agent<br/>Agents协作"] --> F["SKILL.md<br/>统一Rules&Commands&Agents"]
```

大语言模型（LLM）本质上是一个无状态的函数：给定输入，生成输出，然后彻底遗忘。它没有持久记忆，不感知运行环境，不知道自己昨天做过什么。要让这样一个"失忆的天才"变成真正可用的AI Agent，就必须在模型之外构建一整套外部骨架（Harness）——为它注入项目上下文、持久化知识经验、感知工作环境、协调多Agent协作完成复杂任务。这套骨架的设计，正是的 Harness Engineering 所要解决的核心命题。<https://blog.langchain.com/the-anatomy-of-an-agent-harness/>。

构建Harness的方式有许多——代码编排框架（如LangChain、CrewAI）、向量数据库、知识图谱，不一而足。在过去两年的AI编码实践中，Markdown的形式悄然占据了主流。这种最初为格式化纯文本设计的轻量标记语言，正在被重新定义为Harness的声明式配置层——用来注入上下文、承载记忆、定义技能、编排协作。

## 2023年至2024年：单体规则文件的起源

2023年，当开发者第一次尝试让AI理解自己的项目时，他们面临一个最朴素的问题：**AI什么都不知道。** 它不知道团队的命名规范，不知道页面的颜色主题。每次对话都像和一个失忆的新同事从零开始。

最直觉的解决方案，就是写一个文件告诉AI”我们的项目是怎样的”。

2023年，开源工具 [Aider](https://aider.chat/docs/usage/conventions.html) 率先使用 `CONVENTIONS.md` 来规范代码风格，开发者可以在其中写下”使用4空格缩进”、”函数命名用camelCase”之类的规则。2024年，[Cursor](https://cursor.com/docs/context/rules) 将这一思路普及——项目根目录下放一个 `.cursorrules` 文件，AI在每次对话时自动加载。同月，GitHub Copilot 也跟进了类似的 [`.github/copilot-instructions.md`](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)。

以下是 [OpenAI Codex 官方文档](https://developers.openai.com/codex/guides/agents-md)中展示的 `AGENTS.md` 示例，体现了单文件承载多类信息的典型用法：

```markdown
# AGENTS.md

## Repository expectations

- Run `npm run lint` before opening a pull request.
- Document public utilities in `docs/` when you change behavior.
```



这些方案确实有效：AI终于能记住你的技术栈和编码偏好了。但两个问题很快浮出水面。

**第一，单文件膨胀。** 当开发者把编码规范、架构说明、API约定、部署流程全塞进同一个文件时，这个文件迅速膨胀到数千行。每次对话都要全量加载，Token消耗惊人，而其中大部分内容与当前任务毫无关系。此外，无关的上下文也会严重影响模型的注意力。

**第二，配置碎片化。** 团队同时使用Cursor、Copilot和Aider时，需要在 `.cursorrules`、`copilot-instructions.md`、`CONVENTIONS.md` 中维护高度重复的内容。每次更新规则都要同步三份文件，遗漏在所难免。

碎片化的痛点最终催生了标准化运动。2025年5月，Sourcegraph 的 [AMP 团队](https://ampcode.com/manual)率先在其产品中使用 `AGENT.md`（单数形式）作为项目指导文件。随后，[OpenAI 正式宣布](https://developers.openai.com/codex/guides/agents-md) `AGENTS.md`（复数形式）为跨工具的供应商中立标准。作为"AI Agent的README"，它在2025年12月被交由 [Agentic AI Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) 维护，并迅速被[超过六万个开源项目采用](https://openai.com/index/agentic-ai-foundation/)。`AGENTS.md` 的巧妙之处在于它的多重身份：同一个文件既是行为规则（定义编码标准和架构约束），也是项目记忆（承载构建命令和技术栈信息），还是多Agent协调接口（规范不同Agent在微服务边界之间的访问规则）。这种"一个文件，多重角色"的特性，使得跨工具配置第一次有了统一的事实来源。

但是。虽然AGENTS.md已经被大部分Agent所接受，仍有小部分没有支持，例如 Claude Code 和部分公司自研 Agent。落地前建议先拉一张团队常用工具的兼容性矩阵。
![[Pasted image 20260403153618.png]]
![[Pasted image 20260403153648.png]]
> **行动指南：** 在项目根目录创建 `AGENTS.md`（或对应工具的规则文件），写入技术栈、命名规范、目录结构和构建命令。先从一个文件开始，让AI了解你的项目基本情况。许多工具也提供了/init命令来直接根据项目内容和你的需求描述生成合适的AGENTS.md


## 2025年1月：模块化规则与按需加载

但无论是单体文件还是统一标准，单文件膨胀的问题始终存在。当项目的规则越写越多，全量加载的成本也越来越高。单体文件的膨胀问题催生了第一次架构升级。

2025年1月，Cursor 在 [v0.45 版本](https://forum.cursor.com/t/using-the-project-rules-in-0-45-2/44447)中引入了 `.cursor/rules/*.mdc` 格式，将原本的巨型单文件拆分为多个独立的规则模块。这次升级的关键突破在于 YAML 前言（Frontmatter）机制：每个 `.mdc` 文件的头部可以声明触发条件和描述信息，Agent 通过读取这些元数据自主判断当前对话是否需要加载该规则（Apply Intelligently）。例如，一条关于数据库迁移的规则只在开发者操作数据库相关文件时才被注入，处理前端样式时则完全忽略。

这一设计将指令加载从”全量灌入”升级为”按需注入”，大幅降低了无关 Token 的消耗。同月，GitHub Copilot 也[宣布](https://github.blog/changelog/2025-01-21-custom-repository-instructions-are-now-available-for-copilot-on-github-com-public-preview/)了对 `.github/copilot-instructions.md` 的公开预览支持，模块化配置成为行业共识。

在去年10月份，公司内几个自研 Agent 也陆续对 Rules 提供了支持，沉淀了一批日常 Rules 和大促活动期间的专项 Rules。

TODO: 此处应有表格。

在Cursor标准上，参考业界同行的实践经验，我们通过设置 分层架构、规则模版、 软性的编写建议，并把经验沉淀到了Rules转化Commands（类似现在的skill-creator）来帮助大家理解和贡献Rules。



## 2025年2月：自定义命令——“Markdown不只能被读，还能被执行”

2025年2月，随着 Anthropic [发布 Claude 3.7 Sonnet 模型](https://www.anthropic.com/news/claude-3-7-sonnet) 和 Claude Code，开发者开始系统性地把高频工作流写成 Markdown 驱动的斜杠命令。其核心思路是：把 `/review`、`/refactor`、`/fix-issue` 这类重复操作沉淀为文本模板，再通过参数占位符把运行时输入注入进去。后来，Claude Code 官方又进一步把 custom commands 并入了今天的 Skills 体系，因此现在的官方文档主要展示的是“命令与技能合流”后的写法，而不是早期独立的 commands 形态。



###  CLI Agent 场景的爆发

这类能力最先在 CLI Agent 场景里长出来，并不偶然。终端本来就是开发者处理重复劳动的地方：运行测试、查看 diff、读 issue、批量改文件、调用 `gh` 或 `git` 命令，这些动作本来就天然具有“**可参数化、可重复、可封装**”的特征。对聊天式产品来说，很多操作还只是“让模型说该怎么做”；但对 CLI Agent 来说，用户真正需要的是“把这一套动作下次还原出来”。一旦进入终端，Markdown 模板就不再只是解释性的文档，而更像一个可复用的操作脚本外壳。

![[Pasted image 20260403151132.png]]

从工程视角看，CLI 还有三个天然优势。第一，输入输出边界很清楚，`/review foo.ts` 这样的调用形式天然适合把 `$ARGUMENTS` 注入模板。第二，工具环境是现成的，命令模板可以直接围绕 `git diff`、测试命令、Issue 编号、文件路径展开，不必先把上下文重新翻译成 UI 操作。第三，CLI 用户往往本来就在追求“把一次有效操作固化成下次可重复调用的入口”，所以 Markdown 命令模板在这里很容易被接受，也很容易沉淀成团队习惯。

### 自定义命令：把高频动作模板化

以下是 RN 大仓初始化 Rules 的一个 Command，支撑了日常和大促活动期间大量「在线文档 & 代码 → Rules 规范」的转化工作。

```markdown

# init-app-rules

希望创建一个新的 Cursor Rules 文件，来提供一些特殊的提示词上下文，辅助AI出码。请严格按以下5个步骤创建 Rules 文件：

1. **变量提取**。用户**至少**会给出Rules的工作目录`{{app_dir}}`和描述`{{description}}`。通过这两个变量，可以进一步推断出`{{class_name}}`规则所属分类、`{{rule_name}}`规则名两个变量。优先采用用户指定的内容。

    1. 如果没有给出`{{app_dir}}`和`{{description}}`，向用户提问，要求用户提供相关信息。
    2. `{{class_name}}`有两个可选值，分别为`workflows`和`basics`。含义参考`/rules/ai.mdc`。如果用户没有设置，则放到`modules`里。
    3. `{{rule_name}}`为用户输入，如果用户没有输入，则自动生成。

2. **文件复制**。请将`.cursor/commands/_rules_template.template.mdc`文件，复制到`{{app_dir}}/.cursor/rules/{{class_name}}/{{rule_name}}.mdc`。

    1. 规则触发时机：如果 `{{class_name}}`为`basics`，那么需要将`alwaysApply`字段设置为`true`。如果 `{{class_name}}`为`modules`或`workflow`，那么需要将`alwaysApply`字段设置为`false`。
    2. 规则描述：如果用户提供了`description`, 那么将规则描述`description`字段设置为用户提供的值。否则，提示用户设置。
    3. 规则内容： 将规则的大标题，改为`{{rule_name}}`。

3. **内容填充**。根据四个变量，**参考仓库代码或给定文档**，填写 template 文件内容。
   
    1. 内容要求：专业、精简、通用，不要有废话。
    2. 不要和`modules`下的内容存在重复。如有必要，优先引用`modules`下的模块，不要重复造轮子。

4. **description填充**
    1. 参考`./summary-description.md`，完善文件中的 description 字段

5. **模块拆分**。考虑复用问题。秉持“组合”、“ECS架构”的思想，尽可能地拆内容到`modules`里，然后通过路径引用。

6. **内容检查**。检查：
    1. 格式要求。要求符合 Cursor Rules 的格式要求
    2. 字数要求。不要超出**200行**。如果必须超出，请**一定**拆分modules。
    3. 不要设置角色身份。
    4. **单一职责**。不要和其他rules重复
    5. **不要废话**。忽略太通用的规则，专注业务逻辑复杂的地方。
    6. **步骤明确**

```


命令模板的真正价值也不只是省一次 prompt，而是把团队反复验证过的动作路径固定下来，让 Agent 在下一次遇到类似任务时，直接沿着这条路径执行，而不是重新即兴发挥。

这一理念迅速扩散。[OpenCode](https://opencode.ai/docs/commands/) 跟进了兼容的命令格式，说明“用 Markdown 封装可重复工作流”很快就从 Claude Code 走向了更广泛的 CLI Agent 生态。到这一步，Markdown 已经不只是规则文件，而开始扮演终端里“轻量工作流 DSL”的角色。

### 从单个命令到规格驱动开发（SDD）

命令模板擅长封装一次动作，但一个真实的开发需求往往不是一次动作能完成的。`/review` 只管审查、`/fix-issue` 只管修复——当任务变成”先澄清规格、再拆分子任务、再逐步实现、最后验收归档”时，单个命令模板只能覆盖其中一步。真正缺失的不是更多命令，而是一条把多个命令和中间产物串联起来的流程。

规格驱动开发（Spec-Driven Development, SDD）正是沿着这个方向走的。它的核心思路是：用一组 Markdown 文档（规格、计划、任务清单）作为开发过程的持续状态载体，再用一组命令作为推动这些文档流转的固定入口。

[GitHub 官方的 SpecKit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) 和 YC W26 的 [OpenSpec](https://openspec.dev/) 是这个方向的两个代表。以 OpenSpec 为例，一轮完整的开发流程大致如下：先用 `/new` 命令生成变更提案（`proposal.md`），再用 `/continue` 逐步推进到规格文档（`spec.md`）和任务清单（`tasks.md`），接着用 `/apply` 按任务逐条实现代码，最后用 `/archive` 归档整轮工作。每一步的输入是上一步产出的 Markdown 工件，每一步的输出又成为下一步的输入——命令不再是孤立的动作，而是工件流水线上的工位。

命令模板解决的是”把一次动作沉淀下来”，SDD 进一步解决的是”把整条开发链路沉淀下来”。到这一步，Markdown 已经从命令入口演变成了 Agent 推进工程任务时的主工作面。


> **行动指南：** 将团队高频操作（代码审查、重构、测试生成）抽象为 Markdown 模板工作流。若使用 Claude Code，可优先采用今天官方支持的 `SKILL.md` 形式，把需要人工显式触发的工作流设为 `disable-model-invocation: true`，保留 `/review`、`/refactor`、`/fix-issue` 这类稳定入口。

## 2025年7月：记忆即文档——“让Agent像人一样做笔记”

到这里，Agent 已经有了按需加载的指令和可复用的命令模板。但一个更根本的问题始终悬而未决：**Agent 没有记忆。** 一个Agent花了30分钟理解了项目的认证架构，但下次会话这些理解全部丢失。业界此前的主流方案是向量数据库（如Chroma、Pinecone的RAG架构），通过语义嵌入存储和检索历史信息。但向量记忆在编码场景中暴露出严重缺陷：语义漂移导致精确的架构约束在嵌入转换中丢失，黑盒检索让开发者无法审计Agent到底”记住了什么”，分块策略成了一种trick，更无法手动修正错误的假设。

2025年7月18日，Manus 团队发表了开创性的[《AI Agent的上下文工程》](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)一文，明确提出”将文件系统用作上下文”（Use the File System as Context）的设计原则：把文件系统视为无限容量、可持久化的外部记忆。其中最关键的实践是 `todo.md` 机制——Manus 在执行复杂任务时创建一个 `todo.md` 文件，每完成一步就更新并打勾。这个看似简单的操作背后是精心设计的注意力操控：典型的 Manus 任务需要约50次工具调用，如此长的执行链极易导致目标漂移和遗忘。通过不断将待办事项重写到上下文末尾，Agent 的全局计划始终处于模型的近期注意力范围内，有效避免了”中间遗忘”（lost-in-the-middle）问题。

这一实践正式确立了”记忆即文档”（Memory as Documentation）的范式。相比向量数据库，文件记忆的优势是碾压性的：开发者用文本编辑器就能查看和修改Agent的记忆；将记忆文件纳入Git后，`git diff` 可以追踪Agent何时更新了对某个API的理解，`git blame` 能揭示哪次会话引入了特定的架构约束；Markdown的层级结构天然保持了上下文的逻辑连贯性，而非向量检索那样返回碎片化的文本块。

许多coding agent也从RAG代码仓库过度到了文件系统，从向量化索引+召回过渡到了文件系统+grep。

以下表格对比了这两种记忆范式的核心差异：

| 记忆系统特性 | 向量数据库记忆（Vector RAG） | 基于Markdown的文件记忆 |
|---|---|---|
| **底层数据结构** | 高维数学嵌入向量（Embeddings） | 纯文本与层级化文件目录 |
| **可审计性与调试** | 低（需要专门的数据库检查与检索测试） | 极高（原生文本编辑器即可查看与修改） |
| **版本控制集成** | 复杂且非原生 | 原生支持（通过Git diff, checkout, blame完美追踪） |
| **上下文完整性** | 碎片化（提取离散的文本块） | 整体性（保持文档级别的逻辑连贯性） |
| **执行延迟** | 中等（涉及网络请求与数据库查询） | 极低（本地文件系统直接读取） |

Manus的文件记忆方案解决了”有没有记忆”的问题，但它的设计仍面向单次任务的会话记忆。当Agent需要全天候连续运行——比如持续监控代码仓库、自动处理Issue、执行定期维护——单层记忆很快不堪重负：重要的架构决策被淹没在琐碎的日常日志中，Agent在第100次会话时已经无法高效检索第3次会话中做出的关键决策。围绕这一挑战，OpenClaw、Claude Code 和 Codex 分别给出了不同深度的解答。

### OpenClaw：双层记忆与混合检索

开源框架 [OpenClaw](https://docs.openclaw.ai/concepts/memory) 给出了一个很完整的文件记忆方案：**双层记忆架构**。

```
~/.openclaw/workspace/
├── MEMORY.md              # 长期记忆：事实、偏好、决策
└── memory/
    ├── 2026-04-03.md      # 今日日志（自动加载）
    ├── 2026-04-02.md      # 昨日日志（自动加载）
    └── 2026-03-15.md      # 历史日志（按需检索）
```

第一层是 `MEMORY.md`，承载长期沉淀的架构决策与核心事实，每次会话启动时自动加载。第二层是 `memory/YYYY-MM-DD.md` 日期日志，采用追加写入模式记录每日工作细节。关键的加载策略是：**今天和昨天的日志自动加载**以保持即时上下文连续性，更早的日志不加载但可通过 `memory_search` 按需检索。

OpenClaw 的记忆检索采用 **关键词搜索 + 向量语义搜索的混合架构**。官方文档明确说明，在配置了 embedding provider 时，`memory_search` 会把语义相似度与关键词匹配结合起来，以兼顾“语义接近”和“精确命中 ID / 代码符号”两类需求。

另一个关键机制是**静默记忆刷新**（Silent Memory Flush）。官方文档说明，在会话被压缩（Compaction）之前，OpenClaw 会先运行一次静默回合，提醒 Agent 把重要上下文写入记忆文件，从而降低压缩造成的信息丢失风险。这里值得强调的是：公开资料已经明确了“压缩前先保存”这一原则，但更细的内部触发逻辑并未完整公开，因此不宜过度推断。

### Claude Code：自动记忆与专题化整理

[Claude Code 的 auto memory 系统](https://code.claude.com/docs/en/memory) 也采用了markdown形式
![[Pasted image 20260403151952.png]]

![[Pasted image 20260403152413.png]]

![[Pasted image 20260403152452.png]]
`MEMORY.md` 是核心索引，**前 200 行（或 25KB）在每次会话启动时自动加载**——超出部分不加载。Claude 被指示保持 `MEMORY.md` 简洁，将详细内容拆分到专题文件（如 `debugging.md`、`api-conventions.md`），并在索引中记录引用关系。专题文件不自动加载，Agent 在需要时用标准文件读取工具按需访问。

Claude 并非每次会话都保存记忆，而是自主判断信息是否对未来会话有价值。典型保存内容包括：构建命令和测试约定、调试方案和错误模式、架构笔记和模块关系、用户偏好和工作流习惯。当用户明确说”记住这个”时，Claude 保存到 auto memory；只有明确说”加到 CLAUDE.md”时才写入指令文件——两者的区别在于：`CLAUDE.md` 是开发者手动维护的**指令**，auto memory 是 Agent 自主积累的**认知**。

更值得注意的是它的**专题化整理思路**。Claude 官方文档明确建议把 `MEMORY.md` 保持精简，把详细内容拆到 `debugging.md`、`patterns.md` 等 topic files，再在需要时按需读取。换句话说，Claude Code 当前公开确认的是一种“索引 + 专题文件”的结构化记忆方式；至于更细的内部整理策略，官方文档并没有展开到可以精确复述的程度。


### Codex：仓库即记忆

OpenAI 在 [Harness Engineering](https://openai.com/index/harness-engineering/) 一文中提出了一个更激进的理念：**”如果不在仓库里，对 Agent 就不存在。”**（If it's not in the repo, it doesn't exist for agents.）与 OpenClaw 和 Claude Code 将记忆存储在本地隐藏目录中不同，Codex 的策略是**将仓库本身作为记忆系统**——所有知识必须是版本化的、可发现的代码仓库产物。

`AGENTS.md` 被严格限制在约 100 行以内，充当”目录”而非”百科全书”，指向 `docs/` 目录中更深层的知识来源：

```
docs/
├── design-docs/           # 架构设计文档（版本化的决策记录）
│   ├── index.md
│   └── core-beliefs.md
├── exec-plans/            # 执行计划（含进度日志）
│   ├── active/
│   └── completed/
├── product-specs/         # 产品规格
└── PLANS.md               # 计划总览
```

在长周期任务中，Codex 更强调把计划与知识直接沉淀到仓库内的文档中。OpenAI 公开材料里反复出现的是 `AGENTS.md` 作为入口、`docs/` 作为系统知识库，以及 `PLANS.md` / execution plans 作为长任务的“活文档”。Cookbook 甚至明确展示了：一份维护良好的 `PLANS.md` 可以支撑 Codex 在单个 prompt 下持续工作数小时。这里的关键不在于固定某四个文件名，而在于把目标、约束、进度、决策理由都变成仓库内可版本化的 Markdown 产物。

三种方案的核心差异可以总结为一张表：

| 维度 | OpenClaw | Claude Code | Codex |
|------|----------|-------------|-------|
| **记忆位置** | `~/.openclaw/workspace/` | `~/.claude/projects/` | 代码仓库 `docs/` 目录 |
| **自动加载** | MEMORY.md + 今日/昨日日志 | MEMORY.md 前 200 行 | AGENTS.md（~100行） |
| **按需检索** | BM25 + 向量混合搜索 | Agent 文件读取 | Agent 文件读取 |
| **记忆写入** | 静默刷新（压缩前自动保存） | Agent 自主判断 | Agent 写入仓库文件 |
| **记忆整理** | 依赖文件分层与压缩前保存 | 依赖索引 + topic files 拆分 | 手动维护 + Git 版本控制 |
| **共享性** | 本地机器 | 本地机器 | 通过 Git 团队共享 |
| **设计哲学** | 双层分离 + 混合检索 | Agent 自治 + 周期性巩固 | 仓库即记忆 |

三者的共性在于：都选择了 Markdown 纯文本作为记忆的载体格式，都实现了某种形式的分层加载（避免一次性灌满上下文），都将透明性和可审计性置于效率之上。分歧在于记忆的归属：OpenClaw 让记忆属于 Agent 的工作空间，Claude Code 让记忆属于用户的本地环境，Codex 让记忆属于团队的代码仓库——这也反映了它们各自面向的场景：自治Agent、个人开发助手、团队协作工具。

> **行动指南：** 根据你的场景选择记忆策略。个人开发：利用 Claude Code 的 auto memory，让 Agent 自主积累项目知识。长期自治Agent：采用 OpenClaw 的双层架构，配置 `MEMORY.md`（长期知识）和日期日志（每日细节）。团队协作：借鉴 Codex 的仓库即记忆理念，将 `docs/` 目录结构化为 Agent 可导航的知识库，通过 Git 共享。

## 2025年7月至2026年初：复杂长任务下与多Agent协作

单个 Agent 有了指令、命令和记忆之后，简单任务已经能跑得很好。但一旦任务变长变复杂，三个结构性限制就会暴露出来。

**第一，上下文窗口是有限的。** 一个 Agent 持续工作几十轮工具调用后，对话历史会逐渐逼近上下文上限。模型要么开始压缩早期信息（丢失关键决策），要么被迫提前收尾。任务越长，上下文越脆弱——这不是模型能力的问题，而是单一会话的物理天花板。

**第二，角色混杂导致质量下降。** 让同一个 Agent 既写代码、又做审查、又跑测试，等于让一个人同时扮演开发者和 QA。Anthropic 在 [长任务 harness 设计](https://www.anthropic.com/engineering/harness-design-long-running-apps)中明确指出，模型对自己产出的评价往往过于宽松——自己写的代码自己审，很难客观发现问题。角色分离不是组织偏好，而是质量保障的工程需要。

**第三，单线程执行效率低。** 当一个重构任务可以拆成数据库迁移和 API 改造两条独立路径时，单 Agent 只能串行处理。并行执行需要多个 Agent 同时工作，而这又引出了真正的难题：多 Agent 之间如何分工、如何交接、如何协调进度？



### 单 Agent 定义

2025年7月，Claude Code 正式引入 [Subagents（子智能体）](https://code.claude.com/docs/en/sub-agents)功能，将社区实践提升为平台原生能力。开发者在 `.claude/agents/*.md` 目录中放置文件，通过 YAML 前言声明子Agent的模型类型、触发描述以及可调用的工具集。主Agent根据这些描述自动拉起子Agent处理特定任务，有效保护了主上下文窗口不被污染。

在主流 coding agent 产品中，这种能力属于较早把“专职 Agent 角色”做成 Markdown 声明文件的实践之一。一个子Agent的 `.md` 定义文件同时承担着角色描述、能力边界和协调路由三重功能——它告诉系统”我是谁、我能做什么、什么时候叫我”。

以下是 [Claude Code 官方文档](https://code.claude.com/docs/en/sub-agents)中展示的子Agent定义示例：

```markdown
<!-- .claude/agents/code-reviewer.md -->
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews
  code for quality, security, and maintainability. Use immediately
  after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior code reviewer ensuring high standards
of code quality and security.

When invoked:
1. Run git diff to see recent changes
2. Focus on modified files
3. Begin review immediately

Review checklist:
- Code is clear and readable
- No duplicated code
- Proper error handling
- No exposed secrets or API keys
- Input validation implemented

Provide feedback organized by priority:
- Critical issues (must fix)
- Warnings (should fix)
- Suggestions (consider improving)
```

YAML 前言中的 `description` 字段告诉主Agent何时应该调用这个子Agent，`tools` 限定了子Agent可使用的工具集，`model` 指定运行模型。

声明式子Agent解决了”谁来干”的问题，但分工只是第一步。真正进入长任务后，下一个问题马上变成了：这些已经分好工的 Agent，到底靠什么交接？

### 多Agent协作

定义好 Agent 之后，下一个问题是：它们之间怎么协作？Anthropic 在[常见工作流模式](https://claude.com/blog/common-workflow-patterns-for-ai-agents-and-when-to-use-them)一文中总结了三种基本模式。但在实践中，真正让这些模式跑通的不是模式本身，而是 **Agent 之间靠什么传递状态**。答案几乎总是 Markdown 文件。

**顺序工作流（Sequential）** 中，上一步的输出就是下一步的输入。关键在于这个”输出”不是一段聊天消息，而是一份落盘的 Markdown 工件。比如 `planner` 先把一句话需求扩展成 `SPEC.md`，`builder` 读取这份规格文档再开始实现——两个 Agent 之间的交接点是一个可审计、可修正的文件，而不是一段上下文越来越长的对话。

**并行工作流（Parallel）** 中，（subagent 或 agent teams）多个 Agent 同时工作，靠共享的 `TASKS.md` 协调进度。每个 Agent 认领自己的任务、标记状态、勾选完成项；其他 Agent 通过读取同一个文件感知前置条件是否就绪。这本质上是一个**基于文本文件的异步任务队列**——用 Markdown 文件列 todo 并打勾，最早出现在 Manus 的 `todo.md` 实践中，此后被 Cursor Plan Mode 和 OpenAI 的 `PLANS.md` 产品化，多Agent场景又把它扩展为共享看板。

**评估-优化工作流（Evaluator-Optimizer）** 中，Generator 和 Evaluator 之间靠 Markdown 合同协调。Anthropic 在[长任务 harness 设计](https://www.anthropic.com/engineering/harness-design-long-running-apps)中展示的做法是：每个 sprint 开始前，双方先协商一份 **sprint contract**，明确本轮交付什么、如何算通过；Evaluator 验收后把问题写回 `REVIEW.md`，Generator 据此修正，循环直到质量达标。验收标准本身也是一份 Markdown 工件——可版本化、可回溯、可被第三方审计。

三种模式可以自由组合，组合之后就是今天常见的 agent team 分工：

- `planner` 把需求扩展成 `SPEC.md`（顺序的起点）
- 多个 `builder` 并行认领模块，在 `TASKS.md` 里推进状态（并行）
- `evaluator` 拿着 `contract.md` 做验收，把问题写回 `REVIEW.md`（评估优化）

贯穿这三种模式的共同点是：**Agent 之间传递的不是越来越长的聊天历史，而是一组可反复读取、审计和修正的 Markdown 文档。** 从社区约定的 `workflow-state/` 文件总线，到 `TASKS.md` 共享看板，再到 sprint contract 验收合同——Markdown 文件本身就是 Agent 之间的异步通信协议。

从社区约定的 `workflow-state/` 文件总线，到平台原生的 `.claude/agents/*.md` 声明式路由，再到把 checklist / task file 演化为共享交接工件——多Agent协调的演进方向是从”隐式约定”到”文件即接口”，Markdown文件本身成为Agent之间的异步通信协议。

> **行动指南：** 用 `.claude/agents/*.md` 定义专职子Agent（如 `test-runner.md`、`code-reviewer.md`），在 YAML 前言中声明模型、工具集和触发条件。对于需要多Agent并行的长周期任务，可以把 `TASKS.md`、`PLANS.md` 或 sprint contract 一类文件作为共享工件，让Agent通过读写同一套文档协调进度、交接状态与定义验收标准。

### 什么时候用多Agent

 适合多智能体的三大场景 https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them

#### 上下文保护（防止上下文污染）

- 当某些子任务会产生大量上下文（如千级 token 的订单历史、长文档检索结果），但主任务只需要一个精简摘要时，用独立子 agent 先“吃掉大上下文，再产出摘要”可以让主 agent 上下文保持干净。[1]
- 示例：客服系统中，用一个专门的“订单查询 agent”读取海量订单记录并返回 50–100 token 的关键信息，再交给主支持 agent 处理技术问题，避免主上下文被无关细节稀释。[1]

#### 并行化（覆盖更大信息空间）

- 在复杂搜索 / 研究任务中，让一个“主研究 agent”拆解查询为多个独立研究方向，再并行启动多个子 agent 分别检索与总结，可显著提高**覆盖度与完整性**。[1]
- 好处主要在“更全面”，而不是绝对更快：总计算量增加（多路并发、各自上下文与互相总结），经常会比单线程单智能体更慢，但结果更充分。[1]

#### 专业化（工具集、提示和领域）

- **工具集专业化**：当一个 agent 挂了 20+ 多工具、且跨好几个领域（CRM、营销、消息平台等），容易选错工具或性能整体下降，此时拆成多个按领域分工的专用 agent 更稳。[1]
- **系统提示专业化**：不同任务需要相互冲突的 persona / 约束（同一个 agent 又要共情客服、又要苛刻审查代码），分拆为不同角色的专用 agent 能保一致性。[1]
- **领域专业化**：如法律分析、医学研究等需要大量领域上下文，集中在单个通用 agent 会“挤爆”上下文，不如做领域专用 agent 承载这些知识。[1]

## 2025年10月至12月：可执行技能系统（SKILL.md）

在记忆和多Agent协作逐步成型的同时，指令系统也遇到了新的天花板。

即使有了模块化规则和按需加载，Markdown指令仍然是**静态的**：一份代码审查指令，无论开发者只改了两行CSS还是重构了整个认证模块，Agent得到的基准指令完全相同。这显然不合理。

2025年10月16日，Anthropic 发布了 [Claude Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)，将早期偏”命令模板”的做法正式升级为技能系统（`SKILL.md`）。同年12月，Agent Skills 进一步走向[开放标准](https://agentskills.io/specification)。其核心突破并不是”把脚本挂进 frontmatter”，而是允许开发者在技能正文里通过预处理语法动态注入运行时上下文，让静态 Markdown 变成带计算能力的提示模板。

### 渐进式披露：技能系统的核心架构

前面讲过的模块化规则（Cursor `.mdc`）已经实现了"按需加载"，但它的粒度仍然是整个文件——要么全部注入，要么完全忽略。技能系统更进一步，在单个 `SKILL.md` 内部也实现了分层加载，Anthropic 称之为**渐进式披露（Progressive Disclosure）**。

一个技能的信息分三层，每层的加载时机和 Token 成本完全不同：

- **Level 1 — 元数据**（`name` + `description`）：始终加载到系统提示词中，是 Agent 判断"要不要用这个技能"的唯一依据。成本极低，约 100 tokens。
- **Level 2 — SKILL.md 正文**：只有当 Agent 判断技能与当前任务相关时才加载。这里放核心指令和流程，建议控制在 500 行以内。
- **Level 3 — 捆绑资源**（脚本、参考文档、模板）：Agent 在执行过程中按需读取，不预加载。容量没有上限——因为 Agent 有文件系统访问能力，资源可以拆成任意多个文件。

这套架构解决了一个从单体规则文件时代就存在的根本矛盾：**上下文越丰富，Agent 表现越好；但上下文越多，注意力越分散、Token 消耗越高。** 渐进式披露的回答是：不要一次灌完，让 Agent 自己决定什么时候需要什么。闲置时只占 100 tokens 的元数据槽位，触发时按需展开，执行时再深入读取参考资料。

这也解释了为什么 `description` 的写法如此关键——它是整个三层架构的"入口函数"。如果描述写得模糊，Agent 永远不会触发 Level 2 的加载；如果描述写得过宽，无关任务也会被注入大量上下文。后面"如何写好一个 Skill"一节会展开讨论描述的写法技巧。

### 能力合并：commands + agents → SKILL.md

在技能系统出现之前，Claude Code 里存在两套独立的 Markdown 扩展机制：`.claude/commands/*.md` 提供用户触发的斜杠命令，`.claude/agents/*.md` 定义专职子Agent。两者各管一摊，但边界越来越模糊——一个复杂的命令模板往往需要在隔离环境中运行（agents 的职责），而一个子Agent定义本质上也是一条可被调用的指令。

`SKILL.md` 的 YAML 前言通过几个关键字段，把这两件事统一到了一个文件里：

| 前言字段                                      | 对应的旧机制       | 作用                      |
| ----------------------------------------- | ------------ | ----------------------- |
| `name` + `disable-model-invocation: true` | **commands** | 保留 `/deploy` 这类纯人工触发的入口 |
| `context: fork` + `agent: Explore`        | **agents**   | 在隔离子上下文中运行，指定子Agent类型   |


一个 `SKILL.md` 文件可以同时是一个斜杠命令（用户输入 `/pr-summary` 触发）和一个子Agent定义（`context: fork` 隔离运行）。在 [v2.1.3 版本](https://code.claude.com/docs/en/changelog)中，Claude Code 正式将 `.claude/commands/` 合并进技能系统——[官方文档](https://code.claude.com/docs/en/skills)明确说明：”`commands/deploy.md` 和 `skills/deploy/SKILL.md` 都会创建 `/deploy`，行为完全一致。”旧的 commands 目录仍然兼容，但不再是推荐写法。

类似的合流也在 [Cursor](https://cursor.com/docs/skills) 上发生。Cursor提供了migrate-to-skills工具，来一键将rules迁移到SKills。

这次合流的意义不只是减少了配置目录。更重要的是，开发者不用再思考”这个需求应该写成 command 还是 agent 还是 rule”——在 Claude Code 里答案统一是 `SKILL.md`，通过前言字段的组合来声明它的触发方式、运行环境和能力边界。


### 如何写好一个 Skill
https://claude.com/blog/complete-guide-to-building-skills-for-claude

- 推荐结构：顶部是 frontmatter，然后是简洁的标题、分步骤说明、示例和故障排除。指令要具体到“调用哪个脚本 / 哪个 MCP 工具、需要哪些参数、成功结果长什么样”。[1]
- 好的 `description` 需要同时包含“**做什么**”和“**何时触发**”，并列出用户可能说的短语；坏例子包括“太笼统”、“没有触发语”、“只讲内部模型概念”。[1]
- 正文中要包含：明确步骤、错误场景与解决方式、参考文件链接，并将细节文档放入 `references/` 来控制主文件长度。[1]

以下是RN大仓当时的 description 和 content 要求

![[Pasted image 20260403160717.png]]
![[Pasted image 20260403160808.png]]

![[Pasted image 20260403160717.png]]


### 如何验证 Skill 的有效性

写好技能只是第一步，更关键的问题是：**技能真的有效吗？** Anthropic 围绕 [Skill-Creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) 构建了一套完整的评估体系，从两个维度验证技能的有效性：**触发准确性**和**功能正确性**。

**触发验证**解决的是"技能在该出现时出现了吗"的问题。Skill-Creator 的做法是生成一组混合的测试查询——约一半"应该触发"，约一半"不应该触发"——然后观察 Agent 的实际行为。测试查询必须足够真实：不是 `"格式化数据"` 这样笼统的短语，而是 `"我老板发了个 xlsx 文件，在下载目录里叫 'Q4 sales final FINAL v2.xlsx'，她想让我加一列利润率百分比"` 这样的真实表述。Skill-Creator 用 60% 训练集 / 40% 测试集的方式迭代优化描述措辞，每轮修改后重新评估触发准确率，最多迭代5轮，按测试集得分选择最佳描述以避免过拟合。

**功能验证**解决的是"技能触发后做对了吗"的问题。核心流程是：为每个测试用例同时生成两个执行结果——一个使用技能，一个不使用（基线对照），然后用评估Agent对比两组输出。Skill-Creator 会并行跑评估、做盲测 A/B 对比，并帮助作者定位回归与描述问题。Anthropic 官方在这篇文章里重点强调的是评估框架和工作流本身，而不是给出一套固定可泛化的行业分数基准。

从技能的**生命周期**来看，评估不仅决定技能的准入，还决定技能的进化和淘汰：

**准入标准（当下视角）。** Anthropic 博客的首条指南是"从评估开始"（Start with Evaluation）：先在代表性任务上运行 Agent，观察它在哪里挣扎或需要额外上下文，然后针对性地构建技能填补空白。这意味着技能不应被投机性地创建——先有明确的能力缺口，再有技能。

**完善与淘汰标准（未来视角）。** Skill-Creator 将技能分为两类：**能力提升型**（Capability Uplift）帮助 Agent 做到基础模型做不好的事，**偏好编码型**（Encoded Preference）将团队特定工作流编排为固定序列。两类技能面临不同的生命周期压力。能力提升型技能可能随模型升级而过时——今天模型不擅长的PDF解析，下一代模型可能原生支持，因此需要持续评估来跟踪技能是否仍在提供增量价值。偏好编码型技能则取决于团队流程是否变化——一旦工作流调整，技能必须同步更新或退役。迭代改进的过程是：执行 → 评估 → 盲测对比 → 分析 → 修改 → 再评估，循环直到用户满意、反馈为空或改进收敛。

> **行动指南：** 对于需要根据运行时上下文动态调整的指令，将静态命令升级为 `SKILL.md` 计算型技能。写技能时，先打磨 `description`（决定触发时机），再组织正文内容（遵循渐进式披露，保持 <500 行）。写完后用 Skill-Creator 的评估流程验证：生成测试查询检验触发准确性，对比基线执行检验功能正确性，持续迭代直到效果稳定。

## 总结与展望

回顾这条演进线，Markdown 驱动的 Agent 扩展体系经历了四个阶段：从单体规则文件（告诉 Agent 项目是什么）到模块化规则与命令模板（让指令按需加载、让动作可复用），再到多Agent协作与记忆系统（让 Agent 分工协作、跨会话积累知识），最终到技能系统（将指令、协调、计算统一到 `SKILL.md`）。贯穿始终的是同一个设计直觉：**用纯文本文件而非代码或数据库，来承载 Agent 的上下文、状态和协作协议。**

这套体系真正解决的是三个递进问题。第一，Agent 不了解项目，需要规则文件和命令模板补足即时上下文；第二，单 Agent 不够用，需要 subagent 定义和共享工件来协调分工与验收；第三，Agent 没有记忆，需要 `MEMORY.md`、日志和仓库文档来沉淀长期知识。三层能力对应着不同的任务复杂度——简单项目只需第一层，长任务需要前两层，长期维护和团队协作才需要三层全开。

展望未来，仍存在一些问题
1. 从指令和记忆的角度
	1. **已有知识消费分发困难**：团队在业务迭代中积累了大量组件、工具函数、最佳实践、Rules、Commands 等研发资产，但存在资产分散和Agent兼容困难问题。
		1. **业务上下文资产分散**：这些资产散落在 在线文档平台、README等异构来源中，散落在不同的上下文市场和Skills市场中。**以业务为中心**的上下文资产没有得到聚合，Agent和开发者感知不到、消费困难。
		2. **Agent资产需求存在差异**：不同Agent（Cursor、Claude Code、OpenCode 及各家自研 Agent）需要的资产结构存在差异（如要求的存放目录不同、skills存在定制yaml头），且不断发展（如rules=>skills）。需要通过某种方式来抹平差异，简化分发和迭代过程。
	2. **个人经验未沉淀为组织经验**：个人经验 不等于 团队经验，个人提效 不等于 组织提效。大量有价值的经验存在于个人与Agent的对话历史和交互过程中，但尚未得到有效利用，尚未提升为整个组织级经验。
		1. **沉淀**：用户对 Agent 建议的接受、拒绝与修正行为是判断资产是否有效的天然信号，对话中涌现的高价值技术决策也可沉淀为新资产——但这条回路目前完全缺失。（**沉淀比较麻烦，涉及记忆的总结、抽象层级设定、记忆合并、记忆淘汰等操作**）
		2. **防腐**：RLHF 的核心洞察就是人类反馈是模型改进最直接的信号。在团队 AI 编码场景中，每一次开发者对 Agent 建议的 accept/reject/edit 都是一个隐式标注行为，其信噪比\高于事后收集的问卷或 review。
	3. **难以定义最适合业务的资产和资产组合**：
		1. **单个资产**：Skills、Rules 大量泛滥，但质量存在问题。需要建立资产入库时的**质量检测方法** 和 真实场景中使用效果的检测方法。
		2. **资产组合**：即使单个资产质量高，组合起来也不一定适合特定业务。盲目塞入大量不相关资产会导致检索准确率的下降、上下文膨胀和注意力分散。同时，各个Agent往往对skill有数量限制。
	4. **质量问题和知识腐化**：随着时间推移，无论是仓库里的Rules&Skills，还是原始文档，都面临着腐化问题。在 AI 编码场景下，腐化的 Rules/Skills 比没有 Rules 更危险——Agent 会以高置信度执行过时指令，产出看似正确实则有害的代码，且开发者难以察觉（因为他们信任了 Agent 的输出）。
		1. **仓库内的腐化**：开发者的更新习惯集中在在线文档和组件库 README，代码仓库中的 Rules/Skills 缺乏与来源的绑定与更新，内容腐化不可避免
		2. **源文档的腐化**：这个问题在业界有专门术语：documentation drift 或 doc rot。Atlassian 的工程博客曾指出，超过 60% 的内部技术文档在发布 6 个月后与实际代码产生偏差。
2. 从多Agent协作的角度，Anthropic 在其[多Agent研究系统](https://www.anthropic.com/engineering/multi-agent-research-system)的工程实践中揭示了一系列尚未解决的结构性问题：
	1. **成本放大**：Agent 单次交互的 token 消耗约为普通对话的 4 倍，多Agent系统则高达 **15 倍**。这意味着多Agent只有在任务价值足够高时才经济可行——不是所有任务都值得用 subagent 来做。
	2. **协调失控**：早期版本曾出现对简单查询生成 50 个 subagent 的情况；Agent 之间互相发送过多更新导致彼此干扰；没有明确任务边界时，subagent 会重复调查同一问题（如多个 subagent 都去研究同一段时间的半导体短缺），留下空白无人填补。
	3. **质量退化**：Agent 倾向于选择 SEO 优化的内容农场而非权威来源（如学术 PDF）；在边缘查询上产生幻觉；无休止地搜索不存在的来源，白白消耗 token。
	4. **错误级联**：微小变化引发连锁反应——一个步骤失败，Agent 可能走上完全不同的执行路径，产出不可预测的结果。长时间运行的有状态 Agent 重启代价高昂，且对用户来说体验极差。
	5. **调试困难**：Agent 在相同输入下的行为不确定，无法简单复现问题；用户报告"Agent 找不到显而易见的信息"，但要判断是搜索词不对、来源筛选失败还是工具调用出错，需要逐层追踪诊断。
	6. **部署风险**：多Agent系统是"高度有状态的提示词、工具和执行逻辑的网络，几乎持续运行"，常规滚动部署会中断进行中的任务，需要 rainbow deployment 等特殊策略。
