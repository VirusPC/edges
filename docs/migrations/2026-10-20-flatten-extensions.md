# 2026-10-20：取消 `extensions/`，平铺到仓库根

决定见 [ADR 0040](../adr/0040-flatten-extensions-posts-to-personal-repo.md)。旧路径硬切，不留软链。仓外写死旧路径的配置按本表改。同日稍后这些目录又收进 `packages/`，现行路径见 [workspace 说明](2026-10-20-packages-workspace.md)。下表是平铺当时的落点。

| 旧路径 | 新路径 |
| --- | --- |
| `extensions/cli/` | [`cli/`](../../cli/) |
| `extensions/skills/` | [`skills/`](../../skills/) |
| `extensions/apps/` | [`apps/`](../../apps/) |
| `extensions/services/` | [`services/`](../../services/) |
| `extensions/mcp-servers/` | [`mcp-servers/`](../../mcp-servers/) |
| `extensions/system-prompt/` | [`system-prompt/`](../../system-prompt/) |
| `extensions/.harness/` | 并入根 [`.harness/`](../../.harness/) |
| `extensions/AGENTS.md` | 硬约束并入根 [`AGENTS.md`](../../AGENTS.md) |
| `extensions/README.md` | 目录表在根 [`README.md`](../../README.md)；收录标准与接入准则在 [`docs/architecture.md`](../architecture.md) |
| `extensions/docs/`、`extensions/tools/`、`extensions/subagents/` | 空占位，已删除 |
| `extensions/new-server/`、`extensions/others/` | 从本仓删除。个人仓 `shared-extensions/` 由维护者另行搬入，不在这次提交里 |

npm 包名仍是 `@viruspc/edges`。`cli/package.json` 的 `repository.directory` 是 `cli`。外部安装 skill 的仓库路径是 `VirusPC/edges/skills`，不再是 `VirusPC/edges/extensions/skills`。

ECS 上的 Deploy 在 `git reset --hard` 之后，若工作区还留着未被跟踪的 `extensions/`，会整目录删除。Artifacts 预览的 user unit 由仓内 CLI 重写：`WorkingDirectory` 与 `ExecStart` 都在 `%h/projects/edges-framework/services/artifacts-preview/` 下。装在 `/usr/local` 的站点布局迁移器字节未改，不必为此用 root 重装。
