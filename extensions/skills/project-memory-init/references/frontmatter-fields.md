# 条目 frontmatter 的字段来源

字段清单与顺序看 [`templates/type_slug.tmpl.md`](templates/type_slug.tmpl.md)。这里只讲值从哪来，以及更新已有条目时谁覆盖谁。

本文件只适用于 `feedback`、`project`、`reference` 三种普通记忆；`skills/` 的内容遵循其自身协议。

**正常写入路径用不到这一份。** 除 `--title` / `--description` 外的字段都由脚本自动填，只有要修正已经写错的值时才需要查表。

| 字段组 | 来源 | 更新时 |
| --- | --- | --- |
| 身份与语义 `name` `type` | `name` 等于文件名去后缀，`type` 就是 `--type` | 不变 |
| 语义 `title` `description` | 同名命令行参数；`description` 就是索引行里那句说明 | 不传则保留原值 |
| 出处 `originSessionId` `agentClient` | 环境变量：`CURSOR_CONVERSATION_ID` / `CLAUDE_SESSION_ID`，以及 `CURSOR_AGENT` → `cursor`、`CLAUDECODE` → `claude-code` | **保留创建时的值** |
| 审计 `username` `email` `updatedAt` | 前两个取 `git -C <目录> config`，后一个取本地时区 ISO 8601 | **每次覆盖** |

- 出处记「谁最先写的」，审计记「谁最后改的」，两端都有了就不必再加 `createdAt`。
- 显式参数（`--origin-session-id` / `--agent-client` / `--username` / `--email`）优先级最高，写错了可以改回来。
- `git config` 在非仓库目录里也会读全局配置，所以 `username` / `email` 基本总能取到；真取不到才省略。审计字段探测不到时沿用旧值，不清空。
