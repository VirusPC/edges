---
name: feedback_skill_install_defaults_to_project
description: >-
  写 onboarding、init 示例或代用户装 skill 时打开：默认 edges init -- -y 装进当前项目；-g
  只在明确只要本机用户目录时使用。
metadata:
  edges-title: skill 默认装进当前项目
  edges-type: feedback
  edges-origin-session-id: bc-91ca69a1-a41c-5870-beff-6b16231a5716
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-11-04T08:09:49+00:00'
---

接入 Edges 时，包内 skill 默认装进当前项目。推荐命令是 `edges --scope . init -- -y` 与 `edges skills init -- -y`。`-g` 只在用户明确只要本机用户目录、不进仓库时使用。

**Why:** 2026-11-04 peng cheng 定下：个人大脑上的 Cursor 云端 Agent 读不到装在本机用户目录里的 skill。已用 `skills@1.7.2` 核对：不加 `-g` 写当前目录；探测到 `CURSOR_AGENT` 或显式 `--agent cursor` 时，项目内落点是 `.agents/skills/<name>/`。`--agent claude-code` 写项目内 `.claude/skills/<name>/`。加上 `-g` 才写 `~/.agents/skills` 或 `~/.claude/skills`。

**How to apply:** 写 onboarding、`edges init` / `edges skills init` 的帮助与示例、或代用户执行含 skills 的 init 时，默认带 `-- -y`，不要把 `-- -g -y` 写成默认。要钉死共用目录再加 `--agent cursor`；只要 Claude Code 的项目目录再加 `--agent claude-code`。用户明确说只要本机、不提交进仓库时才加 `-g`。装进项目的技能目录和 `skills-lock.json` 由用户提交，云端和只 clone 仓库的 agent 才看得见。
