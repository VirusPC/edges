---
status: accepted
---

# 框架仓平铺 extensions，posts 归个人仓

2026-10-20 peng cheng 拍板。`extensions/` 不再作为框架仓的一层目录；对外博客与 site-and-content 看板归个人仓。

**Status:** accepted（ADR 0040）

**Superseded in part by** [ADR 0048](0048-retire-shared-extensions.md)：个人仓不再设 `shared-extensions/`。不绑定 Edges 的通用 skill 改归使用方 `.edges/skills/managed/`。下文 Decision 第 2 条里的安置句保留作 2026-10-20 的记录；平铺 `extensions/`、`posts/` 离开本仓，仍然有效。

## Decision

1. **原名平铺到仓库根：** `cli/`、`skills/`、`apps/`、`services/`、`mcp-servers/`、`system-prompt/`。不套 `packages/`。兄弟目录之间的相对路径保持不变。
2. **删空占位与个人运维目录：** 删除 `extensions/docs`、`extensions/tools`、`extensions/subagents`。`extensions/new-server` 与 `extensions/others` 从框架仓删除；个人仓 `shared-extensions/` 由 peng cheng 另行搬入。
3. **拆掉 extensions 这一层 harness：** `extensions/AGENTS.md` 的硬约束并入根 `AGENTS.md`。`extensions/.edges/` 的记忆并入根 `.edges`，索引合并。`skills/project-memory-init` 改由根登记为下层系统。`feedback_cli_under_extensions` 按同一 slug 翻案：CLI 放仓库根 `cli/`，并注明 2026-10-20 推翻「禁止放仓库根」。
4. **旧路径硬切：** 不留 `extensions/` 软链。旧→新映射写在 CHANGELOG 与 `docs/migrations/`。
5. **仓内路径引用全量改写：** 包括历史计划、done 卡、CHANGELOG 历史条目、评测报告。只改本仓路径；外部 URL 里无关的 `extensions` 字样不动。`../` 相对链接按新位置重算。
6. **两个 PR：** 先迁出 posts（对 main）；再原子平铺（`git mv` + 路径 + 重新生成的 lockfile + `deploy.yml` 与 `publish-edges-cli.yml` 只改内容、文件名不变）。平铺合入前 main 上不出现半平铺状态。
7. **ECS 不为此要 root：** 迁移器三份文件只移动、不改字节。`deploy.yml` 里的 `repo_entry` / `repo_lib` / `repo_py` / `install_cmd` 改为新路径。`edges-artifacts-preview.service` 的 `WorkingDirectory` / `ExecStart` 指向 `%h/projects/edges-framework/services/artifacts-preview/`，由 deploy 里的仓内 CLI `artifacts server install` 重写并重启。ECS 上不用全局 `edges`。`reset --hard` 之后若残留未被跟踪的 `extensions/`，整目录删除。
8. **site-and-content 整项目离开框架仓：** 删除 `posts/`、`.edges/tasks/site-and-content/`（含 4 张卡）、项目记忆 `project_posts_public_astro_blog`，并去掉根 `AGENTS.md` 的 posts 硬约束。个人仓已有文章与看板副本；博客记忆由个人仓补登记。框架仓的 `/tasks/` 看板生成器留下。

## Consequences

- 仓外写死 `extensions/cli`、`extensions/skills`、`extensions/mcp-servers` 的配置要按映射表改。
- npm 包名 `@viruspc/edges`、`publish-edges-cli.yml` 与 `deploy.yml` 的文件名、nginx `/tasks/`、`edges` 命令面不变。
- 个人仓 `posts/` 仍由人维护；该约束写在个人仓，不写在本仓。
