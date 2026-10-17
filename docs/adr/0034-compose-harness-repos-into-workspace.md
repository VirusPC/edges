---
status: accepted
---

# 工作空间由就地 harness 加若干被组合的 harness 仓库构成

2026-10-17 的 grill 确认：edges 接入其他工作空间时，不把 edges 当成一个要挂进去的独立记忆库。项目自己的知识在项目里就地 init；大脑、团队库、规范库、组件库这类跨项目的 harness 仓库，用同一套机制叠加进来，统称「组合（compose）」，对应 Devin Agent Memory 文章里的 composable。一个工作空间 = 自身就地的 harness + 若干被组合的 harness 仓库。

本 ADR 补全 ADR 0032 的「接入方式」（code agent 经用户级配置接入大脑仓库、personal agent clone），并部分取代其 Consequences 里「其他仓库里的 code agent 接入大脑 harness」「团队这一层的 harness 仓库」两项未实现说明：接入方式改由本 ADR 规定，实现仍待做。`--super` 跨多个仓库不在本 ADR 范围内。

**Status:** accepted（ADR 0034；grill 确认于 2026-10-17）

**See also:** ADR 0032（大脑是虚拟目录）、ADR 0004（MCP 子进程调 CLI）

## Decision

1. **术语**：大脑、团队库、规范库、组件库都叫被组合的 harness 仓库，动作叫「组合」。不用「外部记忆」「挂载」，这两个词会让人以为 edges 是一个独立记忆库，和「harness 任何目录」冲突。
2. **组合清单分两层**：用户级 `~/.edges/compose.yaml`，放跟人走的仓库（如大脑），不强加给同事；项目级 `.harness/compose.yaml`，随代码提交，团队一致。和 skill 一样两层都支持；同名仓库项目级覆盖用户级，越靠近工作目录越优先。每项写名字、git 地址、可选分支。
3. **拉到本地读**：CLI 统一把被组合仓库 clone 到 `~/.edges/repos/<name>`，代码 Agent 按普通文件读写：有 shell、能 grep、能离线，读的就是 git 原文。ChatGPT 这类没有 shell 的宿主走远程 MCP，服务端同样持有 clone，MCP 子进程调 CLI（遵循 ADR 0004）；它的组合清单用服务端默认清单。
4. **`edges context` 命令**：读两层清单，按覆盖规则合并；本地没有就 clone，有就带超时 `git pull`，失败时沿用旧版本并告警；对项目自身和每个被组合仓库，用现有 traverse 的 `localOnly` 取根 `AGENTS.md` 的「本层硬约束」区块和本层系统维护信息索引（name / description）；按「项目自身、项目级组合、用户级组合」的顺序拼成 Markdown，每段标明来源仓库和路径；有字数上限，超出时先截索引、保留硬约束，并提示精简；输出到 stdout。MCP 的 `context` 工具子进程调用同一条命令。`--super` 用的 `harness-materials.json` 只列同仓相对路径、不挂其他系统的 `AGENTS.md`，不能拿来当组合清单；组合清单是新概念。
5. **开场注入先从简**：不做 hook。只在代码 Agent 客户端的用户级配置或 ChatGPT 自定义指令里写一句「开场先运行 / 调用 `edges context`」。对话框类宿主无法保证开场注入，MCP 工具只在模型决定时才被调用，只能尽力而为。
6. **写回规则**：默认写进项目自身的 harness，写在哪由目录决定。用户明确要求记进某个被组合仓库时，按普通文件修改，但提交必须走分支加 PR，不直推 main。每个仓库只有 PR 一个写入口。
7. **团队库的写入靠提升**：Agent 只写自己所在项目的 harness。往团队库或大脑的提升交给后续的 dream 能力：定期从项目 harness 里挑出可跨项目复用的内容，批量产出 PR，由维护者审核。这样团队库的 PR 数量少，而且一定有人审。dream 何时、在哪运行另议。
8. **分支记忆不做特殊标记**：分支上的记忆留在该分支自己的 `.harness/`，分支丢弃就随之消失；合入项目 main 时和代码在同一个 PR 里被审到；团队库只经提升写入，分支上的零碎经验到不了团队库。中心化方案（Mem0、OpenViking、Hy Memory 等）所有写入进同一个库，只能靠事后打标签（如 `workspace_id`、`branch`）隔离，这是 git 分布式方案的一个优势。

## Considered Options

- **把 edges 当外部记忆库挂进各个工作空间：** 否决。与「harness 任何目录、记忆离被 harness 对象最近」冲突；项目知识应就地 init。
- **git submodule：** 否决。会把别人的仓库塞进项目历史，同事被迫跟着拉。
- **让用户手动 clone 并在配置里写路径：** 否决。路径因人而异，清单无法随代码提交，也没法统一更新。
- **主路径直接调中心化远程服务：** 否决。代码 Agent 有 shell，本地读 git 原文更简单、可离线；远程 MCP 只给没有 shell 的宿主用。
- **复用 `--super` 的 `harness-materials.json` 作为组合清单：** 否决。它只列同仓相对路径，不挂其他系统的 `AGENTS.md`。
- **用会话启动 hook 保证注入：** 暂缓。各宿主的 hook 不统一，先用一句配置指令。
- **Agent 直接写团队库：** 否决。PR 数量多、难审，改由 dream 批量提升。
- **给分支记忆打标签隔离：** 否决。分支自己的 `.harness/` 已经天然隔离。

## Consequences

- 以下都未实现：`edges context` 命令；用户级和项目级两层 `compose.yaml`；远程 MCP 的 `context`、`search`、`remember`；dream。
- 对话框类宿主的开场注入只能尽力而为，不能保证每次会话都带上组合后的上下文。
- 写进被组合仓库要先有该仓库的写权限并走 PR，没有权限时只能留在项目自身的 harness。
- 术语见 `CONTEXT.md` 的「组合（Compose）」「组合清单（Compose List）」。
