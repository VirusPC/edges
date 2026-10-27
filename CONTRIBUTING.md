# 参与开发

[README](README.md) 介绍用途、模块与上手方式；本页说明框架源码的组织、开发流程与贡献约定。Agent 开始修改前先读 [AGENTS.md](AGENTS.md)。

## 本地开发

```bash
git clone --recurse-submodules https://github.com/VirusPC/edges.git
cd edges
pnpm install
pnpm setup
pnpm skills:link
pnpm build
pnpm test
```

已有克隆若没有评测 submodule，执行：

```bash
git submodule update --init packages/evaluation/third_party/locomo
```

可用命令以根 [package.json](package.json) 为准，专项命令见各子目录 README；维护脚本见 [scripts/README.md](scripts/README.md)。

## 源码与内容归属

本仓 `VirusPC/edges` 维护 Edges 框架本身。

| 目录 | 作用 |
| --- | --- |
| [packages/cli/](packages/cli/) | CLI：命令名 `edges`，npm 包 `@viruspc/edges` |
| [packages/skills/](packages/skills/) | 随 npm 包分发的 skill 真源 |
| [packages/apps/](packages/apps/) | 可复用的应用界面，目前是任务审阅页 |
| [packages/services/](packages/services/) | Artifacts 预览与评测等常驻 HTTP 服务 |
| [packages/evaluation/](packages/evaluation/README.md) | 可复现的实验、用例与评测报告 |
| [packages/observation/](packages/observation/README.md) | 脱敏运行记录、指标笔记与轨迹接入 |
| [packages/mcp-servers/](packages/mcp-servers/) | MCP 接入，供相应宿主调用 |
| [packages/system-prompt/](packages/system-prompt/) | 新 Agent 接入时使用的 system prompt 片段 |
| [docs/](docs/) | ADR、架构与迁移说明 |
| [scripts/](scripts/README.md) | 初始化、构建与迁移等维护脚本 |
| [.edges/](.edges/) | 本仓自身的维护记忆、技能与任务 |

开发时，`pnpm skills:link` 将 `packages/skills/` 链到 `.agents/skills`。本仓维护用的技能在 `.edges/skills`；构建时复制进安装包的 `packages/cli/skills/` 不入 Git。这几处分别承担分发真源、开发发现、本仓维护和构建产物的职责。

使用方的笔记、教学、复盘、任务、项目、记忆、归档、shared-extensions 与对外博客，放在自己的内容仓库。本框架仓不挂载个人仓库；使用方可在自己的工作区通过 [Compose](packages/skills/edges-compose/SKILL.md) 组织它们。不绑定 Edges 的通用技能与配置也归使用方维护。

现行术语见 [CONTEXT.md](CONTEXT.md)，设计取舍见 [ADR](docs/adr/)。[架构背景材料](docs/architecture.md) 保留了旧 README 的设计思考，涉及入口或路径时应对照现行术语与后续 ADR。

## 服务开发与接入

- [Artifacts 预览服务](packages/services/artifacts-preview/README.md)：配置、部署与生命周期。
- [评测服务](packages/services/evaluation/README.md)：从 Langfuse Custom Experiment 触发仓内实验；服务进程需要源码检出，不包含在全局 npm 安装中。
- [CLI 部署说明](packages/cli/deploy/README.md)：部署与升级操作。

## 变更与版本

仓库级变更记录在 [CHANGELOG.md](CHANGELOG.md)，仓库发布使用 `vX.Y.Z` 标签；CLI 的 npm 发布步骤见 [CLI 发布说明](packages/cli/README.md#发布到-npm)。对外 Skill 各自维护版本与 changelog。开发与提交约束以 [AGENTS.md](AGENTS.md) 为准。

## 拆仓与路径历史

2026-10-20 起，原 `VirusPC/edges` 改名为作者的[公开个人大脑仓](https://github.com/VirusPC/edges-brain-viruspc)并长期保留。本框架仓从拆仓前提交 `025904fa29bcc6970f45c654d95e30c5390d43d7` 拆出，以只含系统路径的单个初始提交开始；更早的 commit、PR、Issue 与 Actions 记录仍在个人大脑仓。npm 包名 `@viruspc/edges` 不变。

同日先移除了 `extensions/` 层，再将代码目录收进 `packages/`。路径对照见[平铺说明](docs/migrations/2026-10-20-flatten-extensions.md)和 [workspace 说明](docs/migrations/2026-10-20-packages-workspace.md)。原 `extensions/` 下的空占位 `docs/`、`tools/`、`subagents/` 已删除；`new-server/` 与 `others/` 从本仓移出，由个人仓放入 `shared-extensions/`。

## 隐私与脱敏

本仓库公开在 `github.com/VirusPC/edges`，写入即等同公开发表：

- token、API key、密码、私钥、cookie 等凭据，个人信息、未公开 IP，以及 `.docx`、`.xlsx`、`.pptx` 等办公二进制文件绝不入库。
- 内部域名、系统名、服务名、代码路径、同事身份和排期等标识符必须删除或改写为通用表述后才能入库。
- 允许点名、链接公开使用案例 `VirusPC/edges-brain-viruspc`。其他个人仓和所有私有仓仍不点名、不链接，包括历史旧名、Actions、子模块路径和评测语料地址；写成「个人大脑仓」「私有仓」或 `example/personal-brain`。
- 截图按「能否直接放到公开博客」判断；需要打码、包含内部 UI 或可能泄漏上下文的截图不要入库。
- 发现疑似泄漏时立即停止并告知仓库所有者；删除工作区文件不等于清除 Git 历史，`git filter-repo`、force push 等历史重写必须由仓库所有者确认并执行。
