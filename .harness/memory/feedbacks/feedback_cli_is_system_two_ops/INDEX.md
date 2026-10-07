---
name: feedback_cli_is_system_two_ops
description: >-
  改 traverse 双文件并边、scope 根或 tasks 查询入口时：真 AGENTS 默认只做该系统的系统二；要内容面走
  SuperAgentsNode（见 feedback_content_via_super_agents_node），不要从真 AGENTS 并
  README。
metadata:
  edges-title: CLI 默认只做系统二操作
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:24:43+00:00'
---

CLI 默认针对某个系统（`--scope` 下真 `AGENTS.md`）做**该系统的系统二**操作。从真 AGENTS 出发到不了 README 上的 tasks/notes 是预期。

要操作这些内容时：不并边；创建该 scope 的 **SuperAgentsNode**，把内容面当作**虚拟系统的系统二**再遍历（详见 `feedback_content_via_super_agents_node`）。

**Why:** 用户先澄清 CLI 是系统二面，再纠正内容面的正确入口是 SuperAgentsNode，不是 companion 并边。

**How to apply:** 真 AGENTS 路径保持纯系统二；内容查询走 `--super` / SuperAgentsNode。
