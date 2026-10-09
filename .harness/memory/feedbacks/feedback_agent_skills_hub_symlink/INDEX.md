---
name: feedback_agent_skills_hub_symlink
description: >-
  整理仓库或本机 .xxx/skills 时：能读 .agents/skills 的不占目录；Claude Code 只留软链，禁止实体拷贝。commands
  目录不适用。
metadata:
  edges-title: Skill 分发：能不要的不要，必须留的软链
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-09T17:31:29+08:00'
  edges-origin-session-id: e886f112-bb58-4cb0-b74c-46f73f93bea5
  edges-agent-client: cursor
---

项目级和全局的 skill 分发同一条原则：能读 `.agents/skills` 的 Agent 不占目录；读不到的只留软链，禁止实体拷贝。

**Why:**

多数 Agent（Codex、Cursor、Gemini CLI、OpenCode、Factory、Grok）已经直读 `.agents/skills`（全局 `~/.agents/skills` 同样成立）。再往 `.claude/skills`、`.codex/skills`、`.cursor/skills` 等各拷一份，只会漂移——OpenSpec 那批拷贝里 `.opencode/skills` 的斜杠命令文案就落后了几个月。

Claude Code 是例外：它不读 `.agents/skills`，只认 `.claude/skills`。把这条路径删掉，Claude 在本仓库就看不到项目级 skill；拷一份又会再漂移。所以只留 `.claude/skills -> .agents/skills`。

`openspec update` / `openspec init` 仍可能按它自己的 agent 列表把拷贝写回来。那是复发，不是要改回「每家一份实体」。

`.xxx/commands`（以及 `.opencode/command`、`.agent/workflows`）不适用这条：各家目录名、文件名、frontmatter 甚至格式（Gemini 用 toml）都不同，整目录软链会坏。

**How to apply:**

- 仓库内实体只放 `.agents/skills/`。`.claude/skills` 必须是指向它的软链，不要改回拷贝，也不要删掉。
- 不要重建 `.codex/skills`、`.cursor/skills`、`.factory/skills`、`.gemini/skills`、`.opencode/skills`、`.agent/skills`。被 OpenSpec 写回来就删掉拷贝。
- 全局 `pnpm skills:install-claude-global`（只 `-a claude-code`）落盘的是实体拷贝：`npx skills` 只选 Claude Code 一家时不经过中枢，直接拷进 `~/.claude/skills/<name>`，不写 `~/.agents/skills`、不建软链（2026-10-09 用 `skills` 1.7.1 在隔离 HOME 实测）。这与本条软链原则不一致，是脚本现状，不是允许拷贝的依据。要「中枢实体 + Claude Code 软链」，须同时选一家读中枢的 Agent，如 `-a codex claude-code`。不要为「兼容」再往其他 `~/.xxx/skills` 扇出。
- 不要清理 `$HOME` 下各 Agent 的 skills 目录——里面混着 hi-*、opencli 等非本仓内容。
- 不要用同一套「目录软链」去收 `.xxx/commands`。
