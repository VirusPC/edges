# 2026-10-20：代码目录收进 `packages/`

2026-10-27 起材料目录叫 `.edges`。本说明里的材料目录前缀已写成这个现行名；当时的目录名是 `.harness`。对照见 [更名说明](2026-10-27-rename-harness-to-edges.md)。评测与观测在更名之前已经不在材料目录里。

决定见 [ADR 0041](../adr/0041-packages-workspace-layout.md)。旧路径硬切，不留软链。仓外写死旧路径的配置按本表改。更早的 `extensions/` → 仓库根对照仍在 [平铺说明](2026-10-20-flatten-extensions.md)；那张表描述的是平铺当时的落点，现行路径以本表为准。

| 旧路径 | 新路径 |
| --- | --- |
| `cli/` | [`packages/cli/`](../../packages/cli/) |
| `skills/` | [`packages/skills/`](../../packages/skills/)（`@viruspc/edges-skills`） |
| `apps/` | [`packages/apps/`](../../packages/apps/) |
| `services/` | [`packages/services/`](../../packages/services/) |
| `mcp-servers/` | [`packages/mcp-servers/`](../../packages/mcp-servers/) |
| `system-prompt/` | [`packages/system-prompt/`](../../packages/system-prompt/)（`@viruspc/edges-system-prompt`） |
| `.edges/evaluation/` | [`packages/evaluation/`](../../packages/evaluation/)（`@viruspc/edges-evaluation`） |
| `.edges/observation/` | [`packages/observation/`](../../packages/observation/)（`@viruspc/edges-observation`） |
| 一次性迁移脚本 `scripts/<name>` | [`scripts/migrations/`](../../scripts/migrations/) |
| `scripts/link-agent-skills`、`scripts/setup` | 仍在 [`scripts/`](../../scripts/) |

Workspace glob：`packages/*`、`packages/apps/*`、`packages/services/*`、`packages/mcp-servers/*`。

npm 包名仍是 `@viruspc/edges`。`packages/cli/package.json` 的 `repository.directory` 是 `packages/cli`。CLI 以 `workspace:*` 依赖 `@viruspc/edges-skills`，构建解析该包后把 skill 拷进 `packages/cli/skills/`（不入库）。外部安装 skill 的仓库路径是 `VirusPC/edges/packages/skills`。

`.edges/` 里的 tasks、memory、notes、projects、skills dogfood 不动。评测与观测不再登记为 harness 材料。

ECS 上的 Deploy 在 `git reset --hard` 之后，若工作区还留着未被跟踪的旧顶层目录（`cli/`、`skills/`、`apps/`、`services/`、`mcp-servers/`、`system-prompt/`、`.edges/evaluation/`、`.edges/observation/`），会整目录删除。Artifacts 预览的 user unit 由仓内 CLI 重写：`WorkingDirectory` 与 `ExecStart` 都在 `%h/projects/edges-framework/packages/services/artifacts-preview/` 下。装在 `/usr/local` 的站点布局迁移器字节未改，不必为此用 root 重装。
