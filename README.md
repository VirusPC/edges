# Edges — 个人认知系统

> 把认知资本转化为可复利的判断优势。

Edges 是一个以知识资产为核心、由 Agent 接口和可迁移 harness 支撑的个人认知系统。它把有限的时间、注意力和推理能力投入知识的研究、提炼与使用，让重要经验形成可复用的 Edge，并在真实判断、行动和外部互动中持续获得反馈。

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

复利发生在两个相互促进的层面：反馈修正 Edge，改善知识资产组合；反馈进一步改变 Agent 的记忆、检索、工具和工作流，改善资产管理能力。Edges 当前追求 Human/Agent-in-the-loop 的受控自进化：Agent 协助发现问题、提出改进和执行验证，人判断并采纳重要变更。Recursive Self-Improvement（递归自我改进）是更长期的方向，不是当前能力。

## 知识模型

目录不是一条强制流水线，而是在知识闭环中承担不同角色：

| 角色 | 目录或机制 | 作用 |
| --- | --- | --- |
| 知识生产 | [`notes/`](knowledge/notes/)、[`projects/`](knowledge/projects/)、[`teach/`](knowledge/teach/) | 承载研究线索与在研资产，选择性投入认知资本 |
| 知识沉淀 | [`edges/`](knowledge/edges/) | 形成脱离原始场景仍可反复部署的核心资产 |
| 知识使用 | 内部调用、[`posts/`](knowledge/posts/)、系统接口 | 部署资产，获得决策收益和外部反馈 |
| 工作项 | [`tasks/`](knowledge/tasks/) | 跨 Agent 接力的 Task 看板，按 `edges-tasks-status` 分夹；不是知识原材料，也不是抢单队列 |
| 支撑与退出 | [`resources/`](knowledge/resources/)、[`archive/`](knowledge/archive/) | 支撑资产使用、控制持有成本并保留恢复可能 |

Notes 是低成本、零散且尚未形成稳定结论的捕获。Projects 是以解决问题或交付产出为目标的专项工作区；Teach 是以学习进展和能力获得为目标的专项工作区。三者都是知识生产入口，不是依次晋级的成熟度阶段，也不要求投入相同成本。专项中的原始上下文留在工作区，只有预期能够复用、影响决策或降低不确定性的经验，才值得进一步提炼为 Edge。

[`knowledge/tasks/`](knowledge/tasks/) 存放跨 Agent 接力的工作项，按 `edges-tasks-status` 分夹。新人侧捕获默认落入 `backlog/`；执行记录写在同 stem 的 sidecar，不进入 Task 正文。它不是 Note，也不是 Multica 式可抢单队列。

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
knowledge/projects/foo/report.md → knowledge/archive/projects/foo/report.md
```

曾经有意义或被引用过的内容应归档，并写明原因；误建、空白或纯临时文件可以直接删除。

> 以上是新增内容和后续维护的目标约定。历史内容尚未全部按该模型整理，目录现状不代表已经完成迁移。

## 系统实现

| 目录 | 职责 | 边界 |
| --- | --- | --- |
| [`knowledge/`](knowledge/) | 知识生产、提炼、使用与退出 | Edges 的核心资产 |
| [`AGENTS.md`](AGENTS.md) 与 [`.memory/`](.memory/) | 为 Agent 提供分层的规则、决策、纠错与流程记忆 | 服务项目维护，不替代长期知识库 |
| [`extensions/`](extensions/README.md) | 让 Agent 或外部系统接入、操作 Edges | 必须与 Edges 直接相关 |
| [`shared-extensions/`](shared-extensions/README.md) | 跨机器、跨 Agent 共用的个人 harness | 离开 Edges 仍然有价值 |
| [`bin/`](bin/README.md) | 安装后由人反复调用的命令 | 加入 `$PATH` |
| [`scripts/`](scripts/README.md) | 初始化、构建、迁移等维护脚本 | 通过 `pnpm` 调用，不加入 `$PATH` |

捕获入口最终回到同一套知识模型：人可以使用 `bin/new-note`；有 shell 的 Agent 使用 [`edges-note` CLI](extensions/clis/README.md)，获得稳定参数和 JSON 输出；没有 shell 的宿主使用 [`new-note` MCP](extensions/mcp-servers/new-note/README.md)。它们复用同一条 Note 入库链路。

Agent Memory 在 Edges 中不是单一目录：当前会话承载尚未入库的临时研究；`AGENTS.md` 和 `.memory/` 保存维护系统所需的运营规则、决策与经验；`knowledge/` 保存长期认知资产；检索和接口负责把资产重新带入任务。Memory 提供连续性，Agent 负责主动管理，两者共同服务于知识闭环。

`extensions/` 收录为了接入或操作 Edges 而存在的 CLI、MCP server、skill 和其他接口。`shared-extensions/` 则保存不依赖 Edges、可跨机器和 Agent 客户端复用的个人 harness；两者互斥。

现有调用侧以文件、Obsidian 和人工检索为主。未来的索引、检索与机器接口仍放在 `extensions/`，提高知识流动性并让闭环连接外部系统，但必须在实现前明确标注为规划能力。

## 使用与维护

### 维护完整的 Edges

```bash
pnpm install
pnpm setup
pnpm skills:link
```

- `pnpm install`：安装 workspace 依赖。
- `pnpm setup`：初始化本地环境，并把 `bin/` 加入 `$PATH`。
- `pnpm skills:link`：把 Edges 自有 skills 链到项目级 `.agents/skills/`。

### 只使用可复用组件

不克隆整套系统也可以安装公开 skills：

```bash
npx skills@latest add VirusPC/edges/extensions/skills
```

子路径不能省。单独使用 Agent CLI、MCP server 或 skills 的方式分别见 [`extensions/clis/README.md`](extensions/clis/README.md)、[`extensions/mcp-servers/README.md`](extensions/mcp-servers/README.md) 和 [`extensions/skills/README.md`](extensions/skills/README.md)。

### 开发与验证

```bash
pnpm build
pnpm test
```

根 [`package.json`](package.json) 是可用 workspace 命令的当前清单，专项命令见各子目录 README。

### 文档与版本

- [`README.md`](README.md)：目录约定、业务逻辑和内容标准的唯一真理源。
- [`AGENTS.md`](AGENTS.md)：Agent 必须优先看到的硬约束和分层项目记忆入口。
- [`CONTEXT.md`](CONTEXT.md)：领域术语表，不存放实现细节。
- [`.memory/`](.memory/)：保存无法从代码或 Git 历史直接推导的决策、反馈与参考资料。
- 仓库级变更记录在 [`CHANGELOG.md`](CHANGELOG.md)，tag 使用 `vX.Y.Z`。
- 对外 skill 各自独立 semver；`shared-extensions/` 整层使用自己的 [`VERSION`](shared-extensions/VERSION) 与 [`CHANGELOG.md`](shared-extensions/CHANGELOG.md)。

进一步文档：[Edges 扩展](extensions/README.md) · [共享 Agent harness](shared-extensions/README.md) · [用户命令](bin/README.md) · [维护脚本](scripts/README.md)

## 公开仓库边界

本仓库公开在 `github.com/VirusPC/edges`，写入即等同公开发表：

- token、API key、密码、私钥、cookie 等凭据，个人信息、未公开 IP，以及 `.docx`、`.xlsx`、`.pptx` 等办公二进制文件绝不入库。
- 内部域名、系统名、服务名、代码路径、同事身份和排期等标识符必须删除或改写为通用表述后才能入库。
- 截图按“能否直接放到公开博客”判断；需要打码、包含内部 UI 或可能泄漏上下文的截图不要入库。
- 发现疑似泄漏时立即停止并告知仓库所有者；删除工作区文件不等于清除 Git 历史。
- `git filter-repo`、force push 等历史重写必须由仓库所有者确认并执行。

## License

本仓库使用 [MIT License](LICENSE)。系统演进记录见 [`CHANGELOG.md`](CHANGELOG.md)。
