---
name: feedback_cli_is_system_two_ops
description: >-
  改 traverse、scope 根或 tasks 查询入口时：同目录 README 不并进真 AGENTS；层入口本层可登记材料 README，默认
  list 顺着它走到任务。--super 仍是虚拟系统。
metadata:
  edges-title: CLI 默认只做系统二操作
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T12:27:49+00:00'
---

CLI 默认针对某个系统（`--scope` 下真 `AGENTS.md`）做该系统的系统二操作。同目录 README 不是这条 `AGENTS.md` 的 child，不要从真 AGENTS 并边去读它。

层入口的本层系统维护信息可以登记材料 README（尤其仓库根挂 `.harness/tasks/README.md`）。这些链接是已登记的 children，默认 `edges tasks list` 顺着它们走到看板上的任务。内容面的另一入口仍是 `--super` / SuperAgentsNode：材料路径接到 scope 目录本身，不挂其它系统的 AGENTS。

**Why:** 用户先澄清 CLI 是系统二面，再纠正内容面不要靠 companion 并边。2026-10-07 grill 补上边界：到不了任务，若是因为层入口挂了看板 `AGENTS.md` 而没挂看板 README，就改登记；不要因此把同目录 README 并进真 AGENTS，也不要另写 list walker。

**How to apply:** 真 AGENTS 不并同目录 README，不恢复 `includeContentFace`。要让默认 list 看见维护任务，把材料 README 写进层入口本层。虚拟系统的内容查询仍走 `--super`。
