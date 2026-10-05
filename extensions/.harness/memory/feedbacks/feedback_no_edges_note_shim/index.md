---
name: feedback_no_edges_note_shim
description: 改 edges-cli 的 bin、默认命令或兼容入口时：只保留 edges；禁止 edges-note 第二 bin / shim；根目录无子命令不得跑 note ingest。
metadata:
  edges-title: 不要加 edges-note shim 或根目录默认 ingest
  edges-type: feedback
  edges-origin-session-id: bc-655031ca-7e5d-4ca9-900b-dfbb0f41eff8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T11:51:47+00:00"
---

`edges-cli` 的 bin 只允许 `edges`。不要再加 `edges-note` 第二入口或兼容 shim；调用方必须改成 `edges note …`。根目录不带入子命令时只给 help / usage error，不要默默跑 note ingest。

**Why:** 2026-09-11 产品决定（peng cheng）：多命令树要干净，双 bin 和根目录默认 ingest 会把命令树锁死，迁移成本以后更高。这是显式 breaking rename，不是疏忽。

**How to apply:** `package.json` `bin` 保持 `{ "edges": "./dist/index.js" }`。帮助、README、测试都写 `edges note …`。有人提议「先留 shim 过渡」时拒绝。
