---
name: migrate-directory-nodes
description: 显式把 Edges 工作树中受管的 tracked/public 单文件 Memory、Task、Note 转为目录入口，预览引用调整与冲突后按已授权范围应用。用于统一目录迁移，不处理私有记录、ADR、博客或第三方体系。
version: 1.1.0
---

# 统一目录迁移

工具实现位于 Edges checkout 的 `scripts/migrate-directory-nodes.mts`；仅安装本 Skill 或日常 edges CLI 不包含该仓根维护脚本。先在具备 pnpm 依赖的 Edges checkout 中调用下面的 pnpm 命令，`--root` 指向要转换的独立 Git 工作树。先看预览中的 moves、reuseDirectory 和 updatedReferences，核对用户要求的作用域；已有应用授权时可以直接执行，否则把具体预览交用户确认。

```bash
pnpm migrate:directory-nodes --root /absolute/edges-worktree
pnpm migrate:directory-nodes --root /absolute/edges-worktree --apply
```

默认 dry-run 不写文件；显式 `--dry-run` 等价。`--root` 必须是 Git 工作树根，工具只从 tracked/public 名单选内容。Memory 按公开类型索引合同、Task 按项目/状态目录、Note 按 notes 递归命名空间识别。已存在 index.md/SKILL.md 内容目录内其他 Markdown 是资源，不再拆成节点；`.harness` 内容按自己的模块合同处理。

目标为 `<stem>/index.md`。Task 的明确同名 runlog 一并入目录；其他邻近资源不猜归属，保留原文件并重算相对链接。已有同名附件目录可以复用，只新增 index.md；入口、符号链接、目标冲突在写入前拒绝。已登记节点中的引用、片段、编码 URL 和搬入目录的文档相对链接会调整，普通 README/ADR 等未受管文档不改写。

工具不读取或迁移真实私有记录；排除 gitignored、users/private、posts（含旧 knowledge/posts）、第三方安装目录、ADRs。旧迁移日志可能含私有快照，因此只检查日志路径是否存在，不读取内容：即使看起来 completed 也拒绝。不要自动删除、归档或续跑旧日志；先由人确认旧状态，也可在没有本机旧日志的干净独立工作树审阅公开内容。

应用失败按错误中路径保留现场，不手工覆盖目标或删除恢复副本。应用成功后再次预览应无 moves，检查 Git diff 和相关测试。脚本不自动 stage、commit、push；沿用任务已有授权。历史迁移 manifest/journal 保持历史语义，普通 CLI 不提供长期双格式兼容。

日常创建使用 `edges --scope <目录> tasks create`、`edges --scope <目录> memory remember`、`edges --scope <目录> notes create`，默认目录入口。虚拟系统一再加 `--super`（领域任务写在 `<目录>/tasks`，否则写在 `<目录>/.harness/tasks`）。已有完整目录导入只留给 Memory 的 `--import-entry`。`notes create` 在本地写下正文，不复制旁路目录，也不再提供 `--import-entry`。这些日常入口不承担单文件历史迁移。`tasks list` 顺着主体 `AGENTS.md` 的 children 一次 traverse（`--all` 走森林）；不要再扫 README `project-entries`，也不要把 README 链接抄进 `AGENTS.md`。看板变更送进受保护的 `main` 必须开 PR。
