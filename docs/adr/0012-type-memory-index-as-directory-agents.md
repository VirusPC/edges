# 类型记忆索引改为类型目录下的 AGENTS.md

项目记忆的类型入口原先平铺在 `.memory/` 根部（`USER.md` / `FEEDBACK.md` 等）。2026-09-17 grill 确认：类型入口改为对应复数目录下的 `AGENTS.md`，与条目同处；层入口与类型入口同名但契约不同。本轮只定 CONTEXT / PROTOCOL / LAYOUT / 本 ADR；doctor 迁移与脚本接线等用户另行 go-ahead。

**Status:** accepted（grill 确认于 2026-09-17）

**See also:** ADR 0003（用户记忆仍在仓内且 gitignore；索引路径改到 `users/AGENTS.md`）；ADR 0006（扩展面仍只在 LAYOUT，入口文件现为复数目录下的 `AGENTS.md`）

## Decision

- **位置：** 类型入口落在 `.memory/<plural>/AGENTS.md`，条目仍在同一复数目录。
- **两种契约：** 层入口 `AGENTS.md`（important / local / children）与类型入口 `AGENTS.md`（引言 + 条目清单）共存，不得混用。
- **发现：** 层入口 `project-memory-local` 链到 `.memory/<plural>/AGENTS.md`；发现（概念上的 `index_files()`）跟着这些链接走。
- **模板：** 类型入口由既有类型模板（`FEEDBACK.tmpl.md` 等）生成，不用层入口的 `AGENTS.tmpl.md`。只改输出路径与文件名，不改模板正文形状。
- **特例路径：** `user` → `users/AGENTS.md`，整类 gitignore。`agent_skills` 索引在 `.memory/agent_skills/AGENTS.md`，永不写入 `.agents/`。
- **harness：** 读同目录条目时可能自动加载类型入口——接受，类型入口保持短。
- **本轮不做：** 可扩展类型注册表重开、可插拔 Memory 后端、脚本 / doctor / `.gitignore` 落地。

## Considered Options

- 维持 `.memory/FEEDBACK.md` 等根部平铺：否决；每加一类就要发明一套入口文件名。
- 把类型清单一并写进层入口、取消第二跳：否决；两跳形状已是协议。
- 类型入口复用层入口 `AGENTS.tmpl.md`（important / local / children）：否决；契约不同。
- 本轮重开类型注册表或可插拔 Memory 后端：否决；与本条正交（ADR 0006 仍有效）。

## Consequences

- LAYOUT 不再把种子索引写成 `.memory/` 根部的 `USER.md` / `FEEDBACK.md`。旧平铺文件是 doctor 后续迁移对象：认出 → 搬到 `<plural>/AGENTS.md` → 删除旧文件。
- ADR 0003 的仓内 + gitignore 不变；索引文件从 `USER.md` 改为 `users/AGENTS.md`（`users/` 已挡住；存量 `USER.md` 迁走前仍按 0003 挡住）。
- ADR 0006 的扩展面仍只改 LAYOUT：现为「复数目录 + 其中的 `AGENTS.md` + 层入口一行」。
- 实现（init / remember / ask / doctor / 模板输出路径 / `.gitignore`）等用户另行 go-ahead，不在本决策里做。
