---
name: project_bugbot_comment_trigger_for_cli
description: >-
  讨论 Bugbot 何时会跑、或改 CLI 自动审查时打开：后台只在评论点名时才跑，且不认机器人评论（PR #209 已证实）。CLI 正式 PR 用仓库
  Secret BUGBOT_TRIGGER_TOKEN（仅 VirusPC/edges 的 Pull requests 与 Issues 读写 PAT）以
  VirusPC 身份评论 bugbot run。Secret 为空则成功跳过。token 过期要轮换。
metadata:
  edges-title: CLI 改动才自动点名 Bugbot
  edges-type: project
  edges-origin-session-id: bc-4a1c9200-98ce-518d-b957-15013d57a837
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-11T10:34:08+00:00'
---

Cursor Bugbot 在 edges 仓库里只在评论点名时才跑（`bugbot run` 或 `cursor review`），并且不认机器人账号的评论。它按仓库整体开关，不能按目录触发。改到 `extensions/cli/**` 的正式 pull request 由 Actions 用仓库 Secret `BUGBOT_TRIGGER_TOKEN` 以 VirusPC 的身份评论 `bugbot run`；其他 PR 需要审查时，由人评论同一句。

**Why:**
2026-10-11 peng cheng 在 Cursor 后台把 edges 的 Bugbot 从自动审查改成「只在评论点名时才跑」。用户所述。后台没有按目录触发的开关。点名模式下 Bugbot 不会自己跟随后续提交，而默认审查是增量的，所以每次新推送都要点名一次；同一个 head SHA 不重复评论。

同一天在 PR #209 上实测：github-actions[bot] 的 `bugbot run` 发出 5 分钟以上后，没有 Cursor Bugbot 检查、审查或回复。据此判断 Bugbot 不认机器人账号，自动点名必须用个人 token。用户所述，并已由该次实测支持。

**How to apply:**
- 保持后台的「只在点名时跑」。不要为了少写工作流把它改回全量自动跑，也不要再改回用 `GITHUB_TOKEN` 发 `bugbot run`。
- CLI 的自动点名只走 `.github/workflows/bugbot-cli.yml`。`gh` 的 `GH_TOKEN` 用仓库 Secret `BUGBOT_TRIGGER_TOKEN`：peng cheng 本人的 fine-grained PAT，仅 `VirusPC/edges`，Pull requests 与 Issues 读写。评论显示为 VirusPC。token 过期后换一张同样范围的 PAT，更新同名 Secret。
- Secret 为空（fork 读不到，或还没配置）时打印提示并成功结束，不报错。工作流的 `GITHUB_TOKEN` 只给 `contents: read`。
- 不要用 `pull_request_target`，不要 checkout PR 代码。草稿不点名。
- 其他目录的 PR 需要 Bugbot 时，在评论里写 `bugbot run`（或 `cursor review`）。
- 审查清单仍是 `extensions/cli/.cursor/BUGBOT.md`；人审仍是 `.github/CODEOWNERS` 里的 @VirusPC。ADR 0021 的「不要新开 workflow」只约束 ECS 部署链，不约束这条审查工作流。
