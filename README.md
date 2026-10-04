# Edges — 个人自我进化系统

[![教学站点部署](https://github.com/VirusPC/edges/actions/workflows/deploy.yml/badge.svg)](https://github.com/VirusPC/edges/actions/workflows/deploy.yml)

> 持续提升自己，也持续提升自我改进的能力。

Edges 当前以个人递归自我改进（Recursive Self-Improvement，RSI）为实践目标，帮助个人持续改善认知、判断、行动与自我改进的方法。它用知识资产、Memory、Agent 协作与可迁移 harness，将学习、判断、行动和反馈连成闭环，让经验既改善下一次行动，也改善学习、判断与自我改进的方法。

这是一个公开的个人系统，不承诺整仓可以即插即用；其中的 skills、CLI、MCP 等组件可以独立复用。

## 理念：知识只有进入闭环，才能产生复利

从投资的角度看，知识管理是在配置认知资本。信息只是研究机会；保存下来并不会自动成为资产。缺少提炼、无法重新找到、不能影响行动的内容，不但无法产生收益，还会积累持有成本。Edges 关心的是选择值得持续投入的经验，把它们转化为能够改善未来决策的知识资产。

核心原则是：**多端捕获，选择投入；沉淀 Edge，按需部署；反馈回流，持续复利。**

```text
(1) 发现机会：对话 / 文章 / 实践 / 学习
        |
        | 低成本捕获
        v
(2) 投入研究：Notes / Projects / Teach
        |
        | 配置认知资本，选择性提炼
        v
(3) 形成资产：Edges
        |
        | 按需部署
        +--> 内部调用 --> 判断与行动
        |
        +--> 外部扩环 --> Posts / 系统接口 --> 外部参与者
        |
        v
(4) 获得收益：行动结果 / 新经验 / 问题 / 反驳 / 新证据
        |
        | 回流并再投资，改善资产与管理能力
        +------------------------------------------> 回到 (1)
```

这就是 Edges 的知识闭环（Knowledge Loop）。“机会”是值得研究的线索，不是交易机会；“收益”是相对原有判断或替代方案，在判断质量、行动效果、决策速度、认知成本或外部反馈上的改善，不等于财务利润。只有收益与反馈重新进入捕获入口并被再次投入，知识积累才会变成认知复利。

人在闭环中拥有认知资本，决定配置方向并承担最终风险；Agent 是受人治理的主动管理者，协助研究、提炼、检索、部署和处理反馈；Memory 让规则、上下文和资产跨任务延续；Loop 则把一次使用变成持续的收益再投资。

知识闭环还可以向外扩张。Edge 被内部调用，形成“判断—行动—新经验”的个人循环；Post 和系统接口把知识部署给更多人和系统，引入新的问题、反驳与证据。输出不是终点：只有反馈催生的新洞察重新进入知识生产入口，个人循环才扩展成连接真实世界的更大循环。

这些积累共同服务于个人 RSI：反馈既改善知识资产，也改善个人学习、判断、行动与自我改进的方法。Edges 的根节点承载人的系统二，为这些改进提供支撑；递归模型的根也可以面向团队、公司或更大的系统，作用域与角色关系见 [CONTEXT.md](CONTEXT.md)。个人决定方向并采纳重要变更，Agent 协助发现问题、提出改进和执行验证。

## 知识模型

目录不是一条强制流水线，而是在知识闭环中承担不同角色：

| 角色 | 目录或机制 | 作用 |
| --- | --- | --- |
| 知识生产 | [`notes/`](knowledge/notes/)、[`projects/`](projects)、[`teaching/`](teaching) | 承载研究线索与在研资产，选择性投入认知资本 |
| 知识沉淀 | [`edges/`](knowledge/edges/) | 形成脱离原始场景仍可反复部署的核心资产 |
| 知识使用 | 内部调用、[`posts/`](knowledge/posts/)、系统接口 | 部署资产，获得决策收益和外部反馈 |
| 工作项 | [`tasks/`](tasks/) 与 [`.harness/tasks/`](.harness/tasks/) | 分别承载领域工作和 Edges 维护任务；各板按 `edges-tasks-status` 分夹 |
| 支撑与退出 | [`resources/`](knowledge/resources/)、[`archive/`](knowledge/archive/) | 支撑资产使用、控制持有成本并保留恢复可能 |

Notes 是低成本、零散且尚未形成稳定结论的捕获。Projects 是以解决问题或交付产出为目标的专项工作区；Teach 是以学习进展和能力获得为目标的专项工作区。三者都是知识生产入口，不是依次晋级的成熟度阶段，也不要求投入相同成本。专项中的原始上下文留在工作区，只有预期能够复用、影响决策或降低不确定性的经验，才值得进一步提炼为 Edge。

[`tasks/`](tasks/) 存放领域工作项，[`.harness/tasks/`](.harness/tasks/) 存放 Edges 维护任务；两板按 Task Project 分组，再按 `edges-tasks-status` 分夹。新人侧捕获默认落入 `backlog/`；执行记录写在同 stem 的 sidecar，不进入 Task 正文。Task 不是 Note，也不是 Multica 式可抢单队列。

### Edge 与演化

Edge 是已经提炼出理由与适用边界、可检验且能相对原有判断或替代方案改善未来决策的可复用判断。单条 Edge 是判断优势；多个相互补充、交叉检验并服务于不同决策的 Edge，共同构成认知资产组合。

Edge 至少应说明结论、理由、适用边界和检验方式，并满足四项准入标准：未来可以复用，能够影响行动，允许复盘或证伪，并能随新经验继续演化。现实验证可以记录，但不是成为 Edge 的前提。Edge 也具有认知风险：证据可能不足，判断可能被越界使用，价值可能随环境衰减，也可能被新证据反驳。

对新增 Edge，可以逐步观察置信度、验证证据、复用记录、最近复查时间、失效条件和衰减风险。这些是帮助判断与演化的观察维度，不是统一的 ROI、Alpha 或综合评分；现有历史内容也尚未按这些维度完成记录。

从 Note 或专项形成 Edge 是提炼，不是移动原文或复制全文。外部反馈首先作为新材料回到 Note 或对应专项，经过判断后再用于演化 Edge：

- 不改变判断含义的勘误、证据和链接补充，可以原地修改。
- 适用边界、因果解释或结论发生实质变化时，创建继任 Edge，并标明替代关系。
- 被替代的旧 Edge 归档到对应的 `archive/edges/` 路径。

### 知识如何发挥作用

- **内部调用**：在新问题中检索并部署 Edge，使其影响判断与行动；产生的决策收益再回到知识生产入口。
- **外部扩环**：Post 或系统接口把活跃知识部署给外部参与者；读者反馈、使用结果和新证据回流后，形成更大的知识闭环。

[`knowledge/posts/`](knowledge/posts/) 存放准备公开发表的成稿。Post 可以取材于 Note、Edge 或专项成果，但不会替代内部知识真源。该目录由人仔细维护；AI 不得自动创建、编辑、移动、删除、重构或重写其中的任何文件，可以在其他位置协助起草，再由人审阅后放入。

知识资产只有能够被及时找到、理解并带着必要上下文投入决策，才具有流动性。当前主要通过文件、Obsidian 和人工检索调用知识；后续计划接入 RAG、PageIndex 等索引方式，并经 [`extensions/`](extensions/) 向外部系统提供机器可读的知识访问能力。它们旨在提高知识流动性，但仍属于规划方向，尚不是现有能力。

### 支撑与退出

[`knowledge/resources/`](knowledge/resources/) 存放跨知识区域共享的图片、音频等附件，不作为独立知识阅读；只属于某个专项的附件与专项共置。

[`knowledge/archive/`](knowledge/archive/) 类似整个知识空间的回收站：过时、重复、错误或低活跃度内容退出活跃区域，以降低持有成本，但仍保留来源和恢复可能性。它不是知识出口，也不限于失效 Edge。归档必须保留内容在 `knowledge/` 下的原始相对路径：

```text
knowledge/notes/a.md → knowledge/archive/notes/a.md
projects/foo/report.md → knowledge/archive/projects/foo/report.md
```

曾经有意义或被引用过的内容应归档，并写明原因；误建、空白或纯临时文件可以直接删除。

> 以上是新增内容和后续维护的目标约定。历史内容尚未全部按该模型整理，目录现状不代表已经完成迁移。

## 系统实现

知识管理、投资、ETL 和 Agent 从知识的组织与使用、价值积累、转化流转、持续协作与演进四个互补视角，共同服务个人 RSI。六个核心思想如下：

- **闭环复利（投资视角）**：投入认知资本，沉淀知识资产；知识指导行动，反馈回到捕获入口，持续积累判断优势。
- **任意输入、统一转化、多种输出（ETL 视角）**：以统一的知识模型承接不同来源与形态的输入，按消费场景转化为多种输出，贯通沉淀、转化与消费的全流程。
- **持续协作与自进化（Agent 视角）**：以 `AGENTS.md` 为入口，人和 Agent 共用 Memory、接续长期任务（Long-horizon Tasks）；Agent Teams 与将改进能力持续用于下一轮个人自我改进，是进一步发展的方向。
- **递归树结构**：有可读 `AGENTS.md` 的目录可作为节点；入口沿用 Project Memory 的三部分：**本层硬约束**规定本层规则，**本层记忆**登记直属材料，**下层记忆索引**登记子节点。Task Project 等业务索引也放进这三部分。树表达逻辑归属，普通交叉引用不产生所有权；物理目录层级不必等于节点层级。各节点可按需拥有维护空间，根可面向个人、团队、公司等主体。
- **文件系统**：以文件系统承载记忆，保持可读、可编辑、可迁移。
- **Git 原生管理**：用 Git 的跟踪、忽略与版本机制管理记忆；例如 user memory 通过 `.gitignore` 不随 Git 提交与共享，同时仍属于本层记忆。

这些原则指导系统演进。目前 CLI 可选显式作用域或最近的 `AGENTS.md` 节点，节点服务按入口索引遍历所有权；Project Memory 按需登记本地类型，不会因为发现节点就自动初始化。43 条曾上收根层的公开局部记忆已返回原所有者；其他克隆的私有材料仍须各自按[迁移指南](docs/recursive-layout-migration.md)审阅与处理。术语定义见 [CONTEXT.md](CONTEXT.md)。

围绕这些原则，Edges 希望部署、接入和输出这三件事尽量一键完成。它们分别托住知识闭环的底座、把捕获接到输入侧、以及把沉淀资产部署出去。仓库按这个方向收敛。

- **部署**：一键把 Edges 拉起来，立刻有可运行的知识管理底座。
- **接入**：一键把各类 Agent 客户端接到输入侧，持续收集知识。
- **输出**：一键把沉淀知识转成合适的对外输出资产（站点、预览页、公开稿等）。

| 目录 | 职责 | 边界 |
| --- | --- | --- |
| [`knowledge/`](knowledge/) | 知识生产、提炼、使用与退出 | Edges 的核心资产 |
| [`AGENTS.md`](AGENTS.md) 与各节点的 `.harness/memory/` | 为人和 Agent 提供分层的规则、决策、纠错与流程记忆 | 归属各节点，服务项目维护，不替代长期知识库 |
| [`extensions/`](extensions/README.md) | 让 Agent 或外部系统接入、操作 Edges | 必须与 Edges 直接相关 |
| [`shared-extensions/`](shared-extensions/README.md) | 跨机器、跨 Agent 共用的个人 harness | 离开 Edges 仍然有价值 |
| [`scripts/`](scripts/README.md) | 初始化、构建、迁移等维护脚本 | 通过 `pnpm` 调用，不加入 `$PATH` |
| [`.harness/evaluation/`](.harness/evaluation/AGENTS.md) | 评测整套 Edges | 系统元工作，不是知识生命周期阶段 |
| [`.harness/observation/`](.harness/observation/AGENTS.md) | 观测运行与使用 | 运营观测，不替代 维护记忆中的决策 |

`.harness/evaluation/` 与 `.harness/observation/` 是系统实现旁的支撑目录：前者对照假设，后者记录野外现象。它们不进入 notes → edges → archive 主链；观测或评测若产生新洞察，仍须回到捕获入口。

捕获入口最终回到同一套知识模型：人和有 shell 的 Agent 使用 [`edges` CLI](extensions/cli/README.md) 的 `edges note …`（稳定参数与 JSON stdout）；没有 shell 的宿主使用 [`new-note` MCP](extensions/mcp-servers/new-note/README.md)；Agent 何时该调用则看 [`edges-note` Skill](extensions/skills/edges-note/SKILL.md)。它们复用同一条 Note 入库链路。npm `package.json` 的 `bin` 只是 `edges` 的安装挂钩，不是单独一层。

Agent Memory 在 Edges 中不是单一目录：当前会话承载尚未入库的临时研究；各节点的 `AGENTS.md` 和 `.harness/memory/` 保存该节点维护所需的规则、决策与经验；`knowledge/` 保存长期认知资产；检索和接口负责把资产重新带入任务。Memory 提供连续性，Agent 负责主动管理，两者共同服务于知识闭环。

`extensions/` 收录为了接入或操作 Edges 而存在的 CLI、MCP server、skill 和其他接口。`shared-extensions/` 则保存不依赖 Edges、可跨机器和 Agent 客户端复用的个人 harness；两者互斥。短生命周期预览页（上传 → 可达 URL → TTL）的用例 × 能力见 [`extensions/services/artifacts-preview`](extensions/services/artifacts-preview/README.md#use-case-matrix)；命令面是 `edges artifacts`。

现有调用侧以文件、Obsidian 和人工检索为主。未来的索引、检索与机器接口仍放在 `extensions/`，提高知识流动性并让闭环连接外部系统，但必须在实现前明确标注为规划能力。

## 使用与维护

### 维护完整的 Edges

```bash
git clone --recurse-submodules https://github.com/VirusPC/edges.git
pnpm install
pnpm setup
pnpm skills:link
```

已有克隆若没有评测 submodule：`git submodule update --init .harness/evaluation/third_party/locomo`。LoCoMo 官方冒烟入口见 [`.harness/evaluation/README.md`](.harness/evaluation/README.md)。

- `pnpm install`：安装 workspace 依赖。
- `pnpm setup`：初始化本地环境（加载 .env；不再把仓根 bin/ 写入 PATH）。
- `pnpm skills:link`：把 Edges 自有 skills 链到项目级 `.agents/skills/`。

### 只使用可复用组件

不克隆整套系统也可以安装公开 skills：

```bash
npx skills@latest add VirusPC/edges/extensions/skills
```

子路径不能省。单独使用 Agent CLI、MCP server 或 skills 的方式分别见 [`extensions/cli/README.md`](extensions/cli/README.md)、[`extensions/mcp-servers/README.md`](extensions/mcp-servers/README.md) 和 [`extensions/skills/README.md`](extensions/skills/README.md)。

### 开发与验证

```bash
pnpm build
pnpm test
```

根 [`package.json`](package.json) 是可用 workspace 命令的当前清单，专项命令见各子目录 README。

### 架构复盘

定期从根目录审视 Edges 的实际用法，按需下钻子作用域，将实践中可复用的维护职责提炼为通用规范：

- 盘点目录的职责、所属作用域与维护对象，检查领域工作、自身维护、共享实现和固定入口是否混淆；同时区分跨作用域通用约定与本作用域特有目录，不能把根目录实例当作各层必建模板。
- 从真实用例中识别通用系统二模块，明确其适用范围、状态归属和共享能力边界。例如维护任务管理可服务不同作用域，但领域任务仍属于各自的领域工作。
- 输出目录职责表、发现的问题与规范候选；复盘结论也可以是保持现状。经确认的共性进入通用规范，局部特性继续留在所属作用域。

模块按需采用，复盘不自动创建全套目录、修改协议或迁移内容。当前先确立规范，暂不启用自动运行。

### 文档与版本

- [`README.md`](README.md)：目录约定、业务逻辑和内容标准的说明；规范按职责保留单一真源，由 AGENTS.md 组织发现。
- [`AGENTS.md`](AGENTS.md)：Agent 必须优先看到的硬约束和分层项目记忆入口。
- [`CONTEXT.md`](CONTEXT.md)：领域术语表，不存放实现细节。
- 各节点的 `.harness/memory/`：保存无法从代码或 Git 历史直接推导的决策、反馈与参考资料；根目录中的 [`.harness/memory/`](.harness/memory/) 只属于根节点。
- 仓库级变更记录在 [`CHANGELOG.md`](CHANGELOG.md)，tag 使用 `vX.Y.Z`。
- 对外 skill 各自独立 semver；`shared-extensions/` 整层使用自己的 [`VERSION`](shared-extensions/VERSION) 与 [`CHANGELOG.md`](shared-extensions/CHANGELOG.md)。

进一步文档：[Edges 扩展](extensions/README.md) · [共享 Agent harness](shared-extensions/README.md) · [维护脚本](scripts/README.md) · [评测](.harness/evaluation/README.md) · [观测](.harness/observation/AGENTS.md)

## 公开仓库边界

本仓库公开在 `github.com/VirusPC/edges`，写入即等同公开发表：

- token、API key、密码、私钥、cookie 等凭据，个人信息、未公开 IP，以及 `.docx`、`.xlsx`、`.pptx` 等办公二进制文件绝不入库。
- 内部域名、系统名、服务名、代码路径、同事身份和排期等标识符必须删除或改写为通用表述后才能入库。
- 截图按“能否直接放到公开博客”判断；需要打码、包含内部 UI 或可能泄漏上下文的截图不要入库。
- 发现疑似泄漏时立即停止并告知仓库所有者；删除工作区文件不等于清除 Git 历史。
- `git filter-repo`、force push 等历史重写必须由仓库所有者确认并执行。

## License

本仓库使用 [MIT License](LICENSE)。系统演进记录见 [`CHANGELOG.md`](CHANGELOG.md)。

目录升级与本机私有材料迁移见[迁移指南](docs/recursive-layout-migration.md)。领域 Task 命令默认操作选定作用域的 `tasks/`；维护任务显式传 `--purpose maintenance`。
