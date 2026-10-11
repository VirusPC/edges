---
name: project_bugbot_comment_trigger_for_cli
description: >-
  讨论 Bugbot 何时会跑、或改 CLI 自动审查时打开：后台已改为只在评论 bugbot run 或 cursor review
  时才跑，且不能按目录触发；只有改到 extensions/cli 的正式同源 PR 由工作流自动点名，其他 PR 要人手评论。不要用
  pull_request_target。
metadata:
  edges-title: CLI 改动才自动点名 Bugbot
  edges-type: project
  edges-origin-session-id: bc-4a1c9200-98ce-518d-b957-15013d57a837
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-11T10:23:07+00:00'
---

Cursor Bugbot 在 edges 仓库里只在评论点名时才跑（`bugbot run` 或 `cursor review`）。它按仓库整体开关，不能按目录触发。因此只有改到 `extensions/cli/**` 的正式、同源 pull request 才由 Actions 自动评论 `bugbot run`；其他 PR 需要审查时，由人评论同一句。

**Why:**
2026-10-11 peng cheng 在 Cursor 后台把 edges 的 Bugbot 从自动审查改成「只在评论点名时才跑」。用户所述。后台没有按目录触发的开关，若保持每次 PR 更新都自动跑，非 CLI 改动也会进入审查。点名模式下 Bugbot 不会自己跟随后续提交，而默认审查是增量的，所以每次新推送都要点名一次；同一个 head SHA 不重复评论，连续推送则取消尚未完成的旧运行。fork 上的 `GITHUB_TOKEN` 没有写权限。由 github-actions[bot] 发出的 `bugbot run` 能否被 Bugbot 识别，写这条时尚未验证。

**How to apply:**
- 保持后台的「只在点名时跑」。不要为了少写工作流把它改回全量自动跑。
- CLI 的自动点名只走 `.github/workflows/bugbot-cli.yml`：`pull_request` 的 opened / synchronize / reopened / ready_for_review，路径 `extensions/cli/**`。用默认 `GITHUB_TOKEN`，权限只给 `pull-requests: write` 和 `issues: write`。
- 不要用 `pull_request_target`，不要 checkout PR 代码。
- 草稿，以及 head 仓库不是本仓的 fork，直接跳过，不要把权限失败当成工作流失败。
- 其他目录的 PR 需要 Bugbot 时，在评论里写 `bugbot run`（或 `cursor review`）。
- 审查清单仍是 `extensions/cli/.cursor/BUGBOT.md`；人审仍是 `.github/CODEOWNERS` 里的 @VirusPC。ADR 0021 的「不要新开 workflow」只约束 ECS 部署链，不约束这条审查工作流。
