# Edges — 个人认知系统

> 构建可复用的认知优势，提高未来判断效率。

Edges 是一个以知识资产为核心、由 Agent 接口和可迁移 harness 支撑的个人认知系统。它让重要经验能够被重新找到和使用，在真实判断、行动与外部互动中接受反馈，并随时间持续演化。

这是一个公开的个人系统，不承诺整仓可以即插即用；其中的 skills、CLI、MCP 等组件可以独立复用。

## 理念：知识必须进入闭环

信息被记录下来，并不意味着它已经成为知识。缺少提炼、无法重新找到、不能影响行动的内容，只是在积累存储成本。Edges 关心的是让经验进入知识闭环（Knowledge Loop），在使用和反馈中逐渐形成可复用的判断优势。

核心原则是：**多端捕获，统一沉淀；按需输出，反馈演化。**

```text
(1) 捕获：对话 / 文章 / 实践 / 学习
        |
        v
(2) 生产：Notes / Projects / Teach
        |
        | 提炼
        v
(3) 沉淀：Edges
        |
        | 使用
        +--> 内部调用 --> 判断与行动
        |
        +--> 外部扩环 --> Posts / 系统接口 --> 外部参与者
        |
        v
(4) 反馈：行动结果 / 新经验 / 问题 / 反驳 / 新证据
        |
        | 重新进入系统，推动知识与系统演化
        +------------------------------------------> 回到 (1)
```

知识闭环可以向外扩张。Edge 被个人调用，形成“判断—行动—新经验”的内部循环；Post 和系统接口把知识带给更多人和系统，引入新的问题、反驳与证据。输出不是终点：只有这些反馈催生的新洞察重新进入知识生产入口，个人循环才扩展成连接真实世界的更大循环。

反馈修正 Edge，推动知识演化；反馈进一步改变知识组织、检索、输出方式或工具能力，推动系统演化。Edges 当前追求 Human/Agent-in-the-loop 的受控自进化：Agent 协助发现问题、提出改进和执行验证，人判断并采纳重要变更。Recursive Self-Improvement（递归自我改进）是更长期的方向，不是当前能力。

## 知识模型

目录不是一条强制流水线，而是在知识闭环中承担不同角色：

| 角色 | 目录或机制 | 作用 |
| --- | --- | --- |
| 知识生产 | [`notes/`](knowledge/notes/)、[`projects/`](knowledge/projects/)、[`teach/`](knowledge/teach/) | 捕获零散材料，或围绕明确目标保留专项上下文 |
| 知识沉淀 | [`edges/`](knowledge/edges/) | 保存脱离原始场景仍可复用的判断 |
| 知识使用 | 内部调用、[`posts/`](knowledge/posts/)、系统接口 | 影响行动，并把知识接入更多参与者和反馈来源 |
| 支撑与退出 | [`resources/`](knowledge/resources/)、[`archive/`](knowledge/archive/) | 提供共享附件，或将内容移出活跃知识空间 |

Notes 是低成本、零散且尚未形成稳定结论的捕获。Projects 是以解决问题或交付产出为目标的专项工作区；Teach 是以学习进展和能力获得为目标的专项工作区。三者都是知识生产入口，不是依次晋级的成熟度阶段。专项中的原始上下文留在工作区，跨场景仍有价值的经验另行提炼为 Edge。

### Edge 与演化

Edge 是已经提炼出理由与适用边界、能够影响未来判断或行动的可复用判断。它至少应说明结论、理由、适用边界和检验方式，并满足四项准入标准：未来可以复用，能够影响行动，允许复盘或证伪，并能随新经验继续演化。现实验证可以记录，但不是成为 Edge 的前提。

从 Note 或专项形成 Edge 是提炼，不是移动原文或复制全文。外部反馈首先作为新材料回到 Note 或对应专项，经过判断后再用于演化 Edge：

- 不改变判断含义的勘误、证据和链接补充，可以原地修改。
- 适用边界、因果解释或结论发生实质变化时，创建继任 Edge，并标明替代关系。
- 被替代的旧 Edge 归档到对应的 `archive/edges/` 路径。

### 知识如何发挥作用

- **内部调用**：在新问题中检索并使用 Edge，使其影响判断与行动；结果产生的新经验再回到知识生产入口。
- **外部扩环**：Post 或系统接口把活跃知识交付给外部参与者；读者反馈、使用结果和新证据回流后，形成更大的知识闭环。

[`knowledge/posts/`](knowledge/posts/) 存放准备公开发表的成稿。Post 可以取材于 Note、Edge 或专项成果，但不会替代内部知识真源。该目录由人仔细维护；AI 不得自动创建、编辑、移动、删除、重构或重写其中的任何文件，可以在其他位置协助起草，再由人审阅后放入。

当前主要通过文件、Obsidian 和人工检索调用知识。后续计划接入 RAG、PageIndex 等索引方式，并经 [`extensions/`](extensions/) 向外部系统提供机器可读的知识访问能力；这些属于规划方向，尚不是现有能力。

### 支撑与退出

[`knowledge/resources/`](knowledge/resources/) 存放跨知识区域共享的图片、音频等附件，不作为独立知识阅读；只属于某个专项的附件与专项共置。

[`knowledge/archive/`](knowledge/archive/) 类似整个知识空间的回收站：内容退出活跃区域，但保留来源和恢复可能性。它不是知识出口，也不限于失效 Edge。归档必须保留内容在 `knowledge/` 下的原始相对路径：

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
| [`extensions/`](extensions/README.md) | 让 Agent 或外部系统接入、操作 Edges | 必须与 Edges 直接相关 |
| [`shared-extensions/`](shared-extensions/README.md) | 跨机器、跨 Agent 共用的个人 harness | 离开 Edges 仍然有价值 |
| [`bin/`](bin/README.md) | 安装后由人反复调用的命令 | 加入 `$PATH` |
| [`scripts/`](scripts/README.md) | 初始化、构建、迁移等维护脚本 | 通过 `pnpm` 调用，不加入 `$PATH` |

捕获入口最终回到同一套知识模型：人可以使用 `bin/new-note`；有 shell 的 Agent 使用 [`edges-note` CLI](extensions/clis/README.md)，获得稳定参数和 JSON 输出；没有 shell 的宿主使用 [`new-note` MCP](extensions/mcp-servers/new-note/README.md)。它们复用同一条 Note 入库链路。

`extensions/` 收录为了接入或操作 Edges 而存在的 CLI、MCP server、skill 和其他接口。`shared-extensions/` 则保存不依赖 Edges、可跨机器和 Agent 客户端复用的个人 harness；两者互斥。

现有输出侧以文件、Obsidian 和人工检索为主。未来的索引、检索与机器接口仍放在 `extensions/`，让知识闭环可以连接外部系统，但必须在实现前明确标注为规划能力。

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
