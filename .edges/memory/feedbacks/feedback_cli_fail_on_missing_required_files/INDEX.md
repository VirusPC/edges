---
name: feedback_cli_fail_on_missing_required_files
description: >-
  改 cli 里读写节点或项目的命令时打开：读、列表、更新遇到约定必需文件缺失就报错，不补文件。系统一叶子的 create 例外：缺组织清单 README
  时先创建再登记，不挂到 AGENTS。
metadata:
  edges-title: CLI 遇到缺失的必需文件就报错，不自动补
  edges-type: feedback
  edges-origin-session-id: sand-subagent-8eb53323-9aaf-6e82-8fb0-34454bd8dd71
  edges-agent-client: grok-bot
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-21T18:35:38+00:00'
---

CLI 读到不合约定的数据时（例如必需的文件缺失），直接报错，并在报错里写明是哪个目录缺哪个文件。不要为了让读、列表或更新跑通，自动补一个文件把数据问题盖过去。

系统一叶子的创建是另一条路。`notes create`、`projects create`、`tasks create` 在组织清单 README 不存在时，先创建带 `edges-entries-local` 的 README，再把叶子登记在那里。已有散文但没有 entries 标记时保留原文，只补标记。这些叶子不登记到任何 `AGENTS.md`。

**Why:**

2026-10-19 修 `edges tasks project list` 时，第一版在 Task Project 缺 `README.md` 时去读 `AGENTS.md`，第二版在 `update` 时自动补 README。用户指出 `AGENTS.md` 是系统二，项目本来就必须有 README；缺了说明数据有问题，该由人或迁移去修。`get` 和 `update` 在目录在、README 缺时返回 `project <id> is missing README.md: <路径>`，不写任何文件；`list` 跳过该目录。发现阶段仍不把仅有 AGENTS 的目录补成项目。

2026-10-21 用户纠正创建路径：系统一叶子（Note、Project、Task）没有组织清单时，不应回落到 AGENTS。缺的 README 由这次 create 创建，然后登记。见 ADR 0046。

**How to apply:**

- 读、列表、更新遇到「约定里必须存在、实际却缺」的输入，报错并给出相对路径，不写盘。Task Project 的 `get` / `update` 仍如此；`list` 跳过坏条目。
- `notes create` / `projects create` 确保 `<scope>/notes/README.md` 或 `<scope>/projects/README.md`。`tasks create` 确保目标 Task Project 的 README。算出来的父节点不是这份 README 时，创建失败，叶子不写盘。
- Memory 与 Skill 仍登记在类型索引 README。没有更近的 README 时，它们可以挂在 AGENTS。不要把「系统一不挂 AGENTS」扩成所有节点都不挂 AGENTS。
- 不在发现或 list 时批量补 README。
