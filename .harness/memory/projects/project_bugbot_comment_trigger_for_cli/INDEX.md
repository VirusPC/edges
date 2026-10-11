---
name: project_bugbot_comment_trigger_for_cli
description: >-
  开或更新改到 extensions/cli 的 PR 时打开：后台只在评论点名时跑；必须用 VirusPC 已授权身份评论 bugbot run。不改
  CLI 不要评论。不要引入 PAT、token、Action 或定时任务。
metadata:
  edges-title: CLI 的 PR 要由已授权身份点名 Bugbot
  edges-type: project
  edges-origin-session-id: bc-4a1c9200-98ce-518d-b957-15013d57a837
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-11T10:51:10+00:00'
---

edges 的 Cursor Bugbot 后台已设为「只在评论点名时才跑」。任何 Agent 开启或推送更新一个改到 `extensions/cli/**` 的 pull request 后，必须用用户（VirusPC）已授权的身份在该 PR 下评论 `bugbot run`。不改 CLI 的 PR 不要评论。

**Why:**
Bugbot 按仓库整体开关，不支持按目录触发。若保持每次更新都自动跑，非 CLI 改动也会进入审查，所以后台收成只在评论 `bugbot run` 或 `cursor review` 时才跑。2026-10-11 在 PR #209 实测：github-actions[bot] 发的 `bugbot run` 被忽略；VirusPC 本人发的被 cursor[bot] 用 👀 接单。用户明确不引入 PAT、token，也不用 GitHub Action 或定时任务代替这句评论。用户所述，并由该次实测支持。

**How to apply:**
- 开 PR，或向已有 PR 推送更新时，先看 diff 是否碰到 `extensions/cli/**`。碰到了，就用 VirusPC 已授权的身份在该 PR 评论一行 `bugbot run`。没碰到，不要评论。
- 身份必须是 VirusPC 本人或他已授权、且 Bugbot 会当成用户评论的身份。不要用 github-actions[bot] 或其他机器人账号发这句。
- 不要新增 workflow、Secret、PAT 或定时任务来自动点名。
- 审查清单仍是 `extensions/cli/.cursor/BUGBOT.md`。人审仍是 `.github/CODEOWNERS` 里的 @VirusPC。
