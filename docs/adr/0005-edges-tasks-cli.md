# edges tasks 本轮只做 CLI；Run 层只读

看板操作要有统一契约，但本轮只落地 CLI，不实现 Skill / MCP，也不抄 Multica daemon。Issue 层用 `edges tasks list|get|create|update|status`；取消走 `status cancelled`（改 frontmatter、移动 Task 文件与 sidecar），不做硬删除。GitHub 关联本轮不做。Run 落盘仍是 ADR 0002 的 `.{stem}.log.md`；本轮 CLI 只读该 sidecar，以稳定 `run-id` 为键，`runs` 给摘要与 JSON，`run-messages` 看单次执行，不开放 CLI append。动词对齐 Multica（`runs` / `run-messages`），不自造顶层 `log`。Skill 与 MCP 以后按同一契约补上；能力面仍是 ADR 0004 的 CLI + Skill + MCP 三者并列。

对照：https://multica.ai/docs/cli ；https://github.com/multica-ai/multica/blob/main/CLI_AND_DAEMON.md ；https://github.com/multica-ai/multica-cli ；https://github.com/multica-ai/multica/pull/314 。仓内索引见 PR #45 的 `.memory/references/reference_multica_cli_tasks_reference.md`（合入 `main` 后可用）。

**Status:** accepted（grill 确认于 2026-09-13）

## Considered Options

- 本轮同时做 Skill / MCP：否决；同一契约后做。
- 硬删除 Task：否决；用 `status cancelled`。
- 本轮接 GitHub Issue/PR：否决，超出范围。
- 本轮 CLI append Run：否决；落盘仍是 ADR 0002 sidecar，本轮不开放 CLI 写接口。
- 自造 `log` 动词：否决；对齐 Multica `runs` / `run-messages`。
- 复制 Multica daemon / 抢单调度：否决。
