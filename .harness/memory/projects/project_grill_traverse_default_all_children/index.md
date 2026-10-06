---
name: project_grill_traverse_default_all_children
description: >-
  改 operations/traverse 或依赖其默认的调用方时：默认展开 local∪descendants；本层-only 用显式
  localOnly；includeHarness 仍默认 false。
metadata:
  edges-title: traverse 默认走全部 children
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:47:12+00:00'
---

节点模型 grill（2026-10-06）Q20=A：树遍历**默认**走全部组成边 `children`（`localChildren` ∪ `descendantChildren`）。只要本层时显式收窄（推荐选项名 **`localOnly: true`**；若暂留 `includeDescendants`，则其默认改为 `true`）。

`includeHarness` 仍默认 false（组成边 ≠ 维护边，不变）。

**Why:** 用户确认；local/descendants 是分组不是两棵树，「children」默认应是完整子边集合。旧「默认只 local」易让人以为 descendants 不是孩子。

**How to apply:** 改 `operations/traverse.ts` 与所有依赖旧默认的调用方（memory discover、doctor、tasks query 等）：要本层-only 的显式传 `localOnly`。实施计划 Wave A traverse 任务与 spec 遍历规则同步。这是行为破坏，测试须覆盖新默认。
