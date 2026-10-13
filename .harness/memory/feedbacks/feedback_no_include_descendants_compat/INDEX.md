---
name: feedback_no_include_descendants_compat
description: >-
  改 traverse / NodeService.query 选项时：不要再接受 includeDescendants；只要本层用 localOnly:
  true；默认仍是全部 children。
metadata:
  edges-title: traverse 不兼容 includeDescendants
  edges-type: feedback
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-07T03:14:40+00:00'
---

traverse / NodeService.query 不再接受 `includeDescendants`。默认仍展开全部组成边；只要本层时显式传 `localOnly: true`。旧调用处直接改掉，不做兼容别名。

**Why:** 用户纠正：兼容层没有必要，留着只会让 API 长期两套说法。

**How to apply:** 新代码与测试只用 `localOnly`；发现 `includeDescendants` 就删掉或改成 `localOnly: true`（若原意是 false）。
