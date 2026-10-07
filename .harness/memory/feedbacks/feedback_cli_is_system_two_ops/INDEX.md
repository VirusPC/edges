---
name: feedback_cli_is_system_two_ops
description: >-
  改 traverse 双文件并边、scope 根或 tasks 查询入口时：CLI 默认针对某系统入口做系统二操作；从 AGENTS 出发到不了
  README 内容树是预期，不要为了逛系统一而并边。
metadata:
  edges-title: CLI 默认只做系统二操作
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:22:53+00:00'
---

CLI 默认是针对某个系统（`--scope` 下的系统入口 AGENTS）做**系统二**操作。从 AGENTS 出发 traverse 只应看到系统维护信息与下层系统入口；到不了同目录 README 上的系统一内容（tasks/notes 等）是符合预期的，不是缺陷。

因此不要为了「一次 traverse 看见整目录内容」而在遍历时把同目录 README 并进 AGENTS 的边。系统一查询应显式从 README（或 `--super` 等另定入口）出发，不要把内容树偷偷挂到系统二入口上。

**Why:** 用户纠正：并边的产品前提（scope=完整视图）与「CLI 本是系统二操作面」冲突。

**How to apply:** 改 `companionReadme` / traverse 并边、或依赖「从 AGENTS 能走到 tasks README」的测试与调用方时：删掉并边假设；系统二路径只跟 AGENTS 组成；系统一另选根。
