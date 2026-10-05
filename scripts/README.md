# scripts/

项目自身的维护脚本目录。人和 Agent 天天用的入库命令是 `extensions/cli` 的 `edges`，不是仓根脚本。

## 何时放这里

满足以下任一条件：

- **一次性或低频**：setup、release、migration、cleanup、seed data 等
- **只对仓库开发者有意义**：用户不需要直接调
- **不应进 `$PATH`**：污染用户命令空间

## 何时**不**放这里

- 用户/Agent 装好之后**天天会用**的命令 → `extensions/cli` 的 `edges`（`package.json` `"bin"` 安装挂钩）
- 跟外部系统/MCP 协议相关的代码 → `extensions/`；跨机器 harness 的安装脚本仍放本目录，源在 `shared-extensions/`
- 纯 Node 包、可被 pnpm 链接的 → `extensions/mcp-servers/<name>/`

## 命名与权限

- Shell 入口通常无后缀（如 `setup`）；TypeScript 迁移脚本使用 `.mts`，经 pnpm/tsx 执行
- 顶部必须有 shebang（`#!/usr/bin/env bash` / `node` / `python3` 等）
- 必须 `chmod +x`

## 暴露方式

每个脚本必须在 `package.json` 的 `scripts` 字段中注册一个对应入口，用户/Agent 通过 `pnpm <name>` 调用，而不是直接路径。这样：

- 路径变动不破坏调用方
- `pnpm <name>` 可以在所有工作目录运行（不依赖 cwd）
- 集中可见，便于审计

## 当前清单

| 脚本 | 入口 | 作用 |
|---|---|---|
| `setup` | `pnpm setup` | 首次接入初始化：加载 .env；只清带 `# edges bin` 或 `$REPO/bin` 的 PATH。`pnpm setup --uninstall` 再去掉 `source "<repo>/.env"` |
| `migrate-recursive-layout.mts` | `pnpm migrate:recursive-layout --worktree <path> --dry-run` | 按审阅归属迁移当前 Edges 实例；改用 `--apply` 写入，见[迁移指南](../docs/recursive-layout-migration.md) |
| `restore-local-ownership.mts` | `pnpm restore:local-ownership --root <path> --manifest <path> --dry-run` | 审阅符合旧清单的局部所有权纠正；已采用现行公开布局的工作树不重放旧快照 |
| `migrate-directory-nodes.mts` | `pnpm migrate:directory-nodes --root <path>` | 默认预览 tracked/public 旧单文件到目录入口，显式 `--apply` 写入；旧 journal 存在即拒绝 |
| `flatten-content-layout.mts` | `pnpm migrate:top-level-layout --root <path>` | 预览去掉 knowledge 层及 apps 移入 extensions，显式 `--apply`；只改 tracked/public 引用，posts 仅搬迁且不改字节 |
| `migrate-content-units.mts` | `pnpm migrate:content-units --root <path>` | 预览 edges/notes/posts/archive 的普通 Markdown 目录化与附件归位；`--copy-shared` 复制共用附件，`--archive-unreferenced` 归档根 resources 的无引用附件，`--apply` 写入 |
| `link-agent-skills` | `pnpm skills:link` | 把 `extensions/skills` 里每个 skill 软链到 `.agents/skills` |

`pnpm skills:link -- --check` 只校验不写；`--dry-run` 打印动作；`--self-test` 在临时目录跑一遍。vendor 拷贝（`.agents/skills` 里的实体目录）不碰；source 里删掉的 skill，对应软链会清掉。

统一目录转换：`pnpm migrate:directory-nodes --root <worktree>` 默认预览，`--apply` 写入。实现使用 TypeScript `.mts`（NodeNext ESM），仅迁移 tracked/public 受管内容。完整边界与故障处理见 [迁移 Skill](../extensions/skills/migrate-directory-nodes/SKILL.md)。
