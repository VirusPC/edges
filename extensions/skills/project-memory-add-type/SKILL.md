---
name: project-memory-add-type
description: 在指定记忆目录按 LAYOUT 登记一个 Memory Type（<plural>/AGENTS.md + 同目录条目 + 层入口一行）。仅当用户明确要求新增 type 时使用。官方种子仍是六类；不要把示例 type 写进 init 模板。
version: 1.0.0
---

# Project Memory Add Type

在**已经 init** 的记忆目录登记一个用户 Memory Type。扩展面只在 LAYOUT：`.memory/<plural>/AGENTS.md` + 同目录条目 + 该层 `AGENTS.md` 本层清单一行。不写 JSON/YAML 注册表。PROTOCOL 不枚举类型。

下文的 `<init-dir>` 指同级的 `project-memory-init` skill 目录。

## 什么时候用

- 用户明确要求「给这一层加一个 type / 登记一个 Memory Type」。
- 不要在 remember / ask / doctor / init 里代为调用。
- 不要把 `docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler` 写进 `AGENTS.tmpl.md`。它们只是示例名，用户要才登记。
- `tasks` Memory Type ≠ `knowledge/tasks` 看板。看板状态夹本 skill 碰都不能碰。

## 步骤

1. 确认目标目录已经 `$project-memory-init`（有 `.memory/` 与本套 `AGENTS.md`）。没有就停，先问用户要不要 Init。
2. 要 `--name`（小写 snake_case，不能是 `user` / `feedback` / `project` / `reference` / `skills` / `agent_skills`）和一句 `--description`（写进本层清单，供 ask 挑选）。
3. 特权 flag 只在用户点名时加：
   - `--gitignore`：按用户记忆 / ADR-0003 把入口与复数目录追加进仓库根 `.gitignore`（含 `**/` 下层）。
   - `--index-only`：只索引，remember 拒绝写入。
   - `--skills-format`：条目形态与 `skills` 相同。
   - `--external-content-dir`：本轮 stub，脚本会 JSON 失败；不要绕过它去改 `EXTERNAL_CONTENT_DIRS`。
4. 执行：

   ```bash
   python3 <init-dir>/scripts/memory.py add-type \
     --target-dir <目录> \
     --name <type> \
     --description <一句说明> \
     [--gitignore] [--index-only] [--skills-format]
   ```

5. 按返回 JSON 汇报 `type` / `index` / `contentDir` / `action`。然后用 `$project-memory-remember --type <name>` 写一条冒烟，或告诉用户可以开始写。

## 规则

- 能力面仍是 CLI + Skill + MCP 三者并列。本轮动作是 Skill（`$project-memory-add-type`）加当前 Python `memory.py`；迁到 `edges` CLI 以及其后的 MCP 对齐见 backlog，不在本轮、也不用来推迟特权 flag。
- 改 LAYOUT 与当前脚本；不要等 edges CLI，也不要先做类型总配置。
- 官方 init 种子不因示例膨胀。
