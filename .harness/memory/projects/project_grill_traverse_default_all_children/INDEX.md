---
name: project_grill_traverse_default_all_children
description: >-
  改 operations/traverse 或依赖其默认的调用方时：默认展开 local∪descendants；本层-only 用显式
  localOnly；不再接受 includeDescendants；includeHarness 仍默认 false。
metadata:
  edges-title: traverse 默认走全部 children
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:15:15+00:00'
---

节点模型 grill（2026-10-06）Q20=A：树遍历**默认**走全部组成边 `children`（`localChildren` ∪ `descendantChildren`）。只要本层时显式收窄：选项名 **`localOnly: true`**。不再保留 `includeDescendants` 兼容别名。

`includeHarness` 仍默认 false（组成边 ≠ 维护边，不变）。

**Why:** 用户确认默认全部 children；后又纠正不要兼容旧 flag，调用处直接改。

**How to apply:** 改 `operations/traverse.ts` 与调用方：要本层-only 的显式传 `localOnly`。不要再写 `includeDescendants`。
