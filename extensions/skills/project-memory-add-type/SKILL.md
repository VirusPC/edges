---
name: project-memory-add-type
description: 在指定记忆目录按 LAYOUT 登记一个 Memory Type（<plural>/README.md + 同目录条目 + 层入口一行）。仅当用户明确要求新增 type 时使用。官方类型按选择采用；不要把示例 type 写进 init 模板。
version: 3.0.0
---

# Project Memory Add Type

在**已经 init** 的记忆目录登记一个用户 Memory Type。扩展面只在 LAYOUT：`.harness/<module>/<plural>/README.md` + 同目录条目 + 该层 `AGENTS.md` 本层清单一行。不写 JSON/YAML 注册表。PROTOCOL 不枚举类型。

执行前确认 `edges memory add-type --help` 可用。类型布局参考同级 project-memory-init 的 LAYOUT，执行能力由 Edges CLI 提供。

## 什么时候用

- 用户明确要求「给这一层加一个 type / 登记一个 Memory Type」。
- 不要在 remember / ask / doctor / init 里代为调用。
- 不要把 `docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler` 写进 `AGENTS.tmpl.md`。它们只是示例名，用户要才登记。
- `tasks` Memory Type ≠ 作用域 `tasks/` 或 `.harness/tasks/` 看板。看板状态夹本 skill 碰都不能碰。

## 步骤

1. 确认目标目录已经 `$project-memory-init`（有已采用类型与本套作用域 `AGENTS.md`；Skills-only 也合法）。没有就停，先问用户要不要 Init。
2. 要 `--name`（小写 snake_case，不能是 `user` / `feedback` / `project` / `reference` / `managed` / `referenced`）和一句 `--description`（写进本层清单，供 ask 挑选）。
3. 特权 flag 只在用户点名时加：
   - `--gitignore`：按用户记忆 / ADR-0003 把入口与复数目录追加进仓库根 `.gitignore`（含 `**/` 下层）。
   - `--index-only`：只索引，remember 拒绝写入。
   - `--skills-format`：条目形态为 `<name>/SKILL.md`，不改变所属模块。
   - `--external-content-dir`：本轮 stub，脚本会 JSON 失败；不要绕过它去改 `EXTERNAL_CONTENT_DIRS`。
4. 执行：

   ```bash
   edges memory add-type \
     --target-dir <目录> \
     --module memory \
     --name <type> \
     --description <一句说明> \
     [--gitignore] [--index-only] [--skills-format]
   ```

5. 按返回 JSON 汇报 `type` / `index` / `contentDir` / `action`。然后用 `$project-memory-remember --type <name>` 写一条冒烟，或告诉用户可以开始写。

## 规则

- 能力面仍是 CLI + Skill + MCP 三者并列；本 Skill 调用 `edges memory add-type`。CLI 迁移本身不表示 Memory 的 MCP 入口已经实现。
- 布局按 LAYOUT，执行规则由 CLI service 维护，不另建类型总配置。
- 官方 init 种子不因示例膨胀。

`--module memory|skills` 默认 memory。模块与 format 独立；现有自定义类型不因 Skill 格式搬容器，同一类型身份不能在两模块重复登记。`--gitignore` 覆盖索引和正文且在写入前生效。旧层需先 `$project-memory-migrate`，常规登记不解析旧 `.memory`。
