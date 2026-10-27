---
status: accepted
---

# 框架仓改为 packages workspace

2026-10-20 peng cheng 拍板，保留 grill R1 的全部默认。ADR 0040 里「不套 `packages/`」到此为止。

**Status:** accepted（ADR 0041）

## Decision

1. **Workspace 包都在 `packages/`。** 目录名保持平铺后的名字：`packages/cli`、`packages/skills`、`packages/system-prompt`、`packages/apps/*`、`packages/services/*`、`packages/mcp-servers/*`。`pnpm-workspace.yaml` 的 glob 是 `packages/*`、`packages/apps/*`、`packages/services/*`、`packages/mcp-servers/*`。
2. **Skills 是私有包 `@viruspc/edges-skills`。** `@viruspc/edges` 用 `workspace:*` 依赖它。发布构建解析该包，再把带 `SKILL.md` 的目录拷进 CLI 包内的 `skills/`（与原先 copy-bundled-skills 的落点相同）。
3. **System prompt 是私有包 `@viruspc/edges-system-prompt`。** 只导出 `*.md`，没有构建。
4. **评测与观测整棵移出 `.edges/`。** `.edges/evaluation` → `packages/evaluation`（`@viruspc/edges-evaluation`），`.edges/observation` → `packages/observation`（`@viruspc/edges-observation`）。二者是私有 Python 包，只登记脚本与元数据，不强制构建。locomo submodule 的 path 改为 `packages/evaluation/third_party/locomo`。它们不再是 harness 材料。
5. **`.edges/` 其余部分留下。** tasks、memory、notes、projects、skills dogfood 仍在框架仓根 `.edges/`。
6. **一次性迁移脚本进 `scripts/migrations/`。** 根 `package.json` 的 `pnpm migrate:*` 入口保留，改指新路径。`link-agent-skills`、`setup` 留在 `scripts/`。
7. **一次硬切。** `git mv`，不留兼容软链。旧→新对照写在 CHANGELOG 与 `docs/migrations/2026-10-20-packages-workspace.md`。`publish-edges-cli.yml` 与 `deploy.yml` 只改内容，文件名不变。npm 包名 `@viruspc/edges` 不变；`repository.directory` 是 `packages/cli`。

## Consequences

- 仓外写死 `cli/`、`skills/`、`.edges/evaluation/`、`.edges/observation/` 的配置按对照表改。
- ECS 上 Deploy 在 `git reset --hard` 之后删除未被跟踪的旧顶层目录（`cli/`、`skills/`、`apps/`、`services/`、`mcp-servers/`、`system-prompt/`、`.edges/evaluation/`、`.edges/observation/`）。Artifacts user unit 的 `WorkingDirectory` 与 `ExecStart` 指向 `%h/projects/edges-framework/packages/services/artifacts-preview/`，由仓内 CLI `artifacts server install` 重写。站点布局迁移器三份文件只移动、字节不变，不必为此用 root 重装。
- 三个 skill 的 `SKILL.md` 正文路径有变（`project-memory-init`、`project-memory-doctor`、`conversation-to-tasks`）。本决定不改它们的版本与 annotated tag；合入后若要让已安装副本跟上，再按 skill 发版规则 force-update。
