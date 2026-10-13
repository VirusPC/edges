---
name: project_cli_context_production_snapshot
description: 改 edges CLI 的 CliContext / run() 入参时：只放 env 与 stdin 快照加 Commander 的 result；不要把 ingest、fs、writer、now 等测试替身塞进 Context。输出类型叫 CliResult，不要叫 RunResult。
metadata:
  edges-title: CliContext 只装生产快照
  edges-type: project
  edges-origin-session-id: 3e96e2b6-5f54-4076-95b5-dc370644bffe
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-15T17:42:58+08:00"
---

`CliContext` 是一次 `edges` 进程的生产快照（`env` / 已读的 stdin）加上 Commander 的出参槽 `result`；测试替身不进这个类型。进程输出叫 `CliResult`，避免和 Task Run（`edges tasks runs`）撞名。

**Why:**
2026-09-15 grill 确认：生产与测试/debug 要分开。原先 `RunIo` 把生产 stdin 和假 `ingest` / 假 `fs` / `writer` / `now` 焊在一起，Context 无法理解。用户并不反对 Context 这个对象，反对的是袋子里一堆生产从不填的字段。

**How to apply:**
- 不要把 `ingest` / `fs` / `writer` / `now` / `repoPath` 加回 `CliContext` 或 `run()` 的第二参。
- CLI 测例只传生产字段（通常是 `{ env }`）；note 成功入库走临时 git + dry-run。假 `fs`/`now` 只打 `createTask` 等领域函数。
- 不要复活 `RunIo` / `RunResult`。`run()` 当进程入口动词可以留。
