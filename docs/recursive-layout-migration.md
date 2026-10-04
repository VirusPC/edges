# Edges 递归目录迁移与所有权纠正

当前根节点的领域 Task 在 `tasks/`，维护 Task 在 `.harness/tasks/`；各节点的维护记忆在自己的 `.harness/memory/<type>/`，技能类型在 `.harness/skills/{managed,referenced}/`。评测、观测归 `.harness/`，研究与教学分别在 `projects/`、`teaching/`。有可读 `AGENTS.md` 的目录可成为节点；节点发现本身不初始化 Memory。当前状态见 [ADR 0024](adr/0024-scope-first-content-ownership.md)。

## 2026-10-03 目录迁移快照

[原审阅清单](superpowers/plans/2026-10-03-recursive-scope-ownership.json)逐项记录当时 103 条 Task、100 份既有 Run、4 张附件、52 条局部记忆。3 条 Task 当时没有 Run，不补造。该清单及旧实施计划保留审计事实；其将五个子节点记忆上收根层的决定已在 2026-10-05 被纠正，不能用它覆盖当前记录。Git 更新已将公开纠正送到后续克隆，勿对现行公开树重放旧快照。

若某独立克隆仍处于**适用旧布局的原始状态**，先核对清单源哈希和当前文件，再在其独立 worktree 上审阅旧迁移命令的 `--dry-run`；只有预检证明该克隆与旧快照完全对应，才可考虑 `--apply`。命令形式为 `pnpm migrate:recursive-layout --worktree /absolute/path/to/owned-worktree --dry-run`（再将最后一项改成 `--apply`）。这不是已经提升或后来编辑的公开记录的恢复命令。迁移保留 Task stem、状态、Project、手写元数据和资源，遇源哈希、保护文章或 submodule 指针差异即停。

## 2026-10-05 公开纠正

[现行纠正清单](superpowers/plans/2026-10-05-local-ownership-correction.json)按当前源字节恢复了 43 条公开记录：`extensions` 16、`extensions/skills/project-memory-init` 17、`shared-extensions` 1、`knowledge/notes` 1、旧 `knowledge/tasks` 的 8 条归 `.harness/tasks`。25 份类型入口保留人工说明与未知元数据；根层后来新增的记忆仍在根层。`pnpm restore:local-ownership --root <独立克隆绝对路径> --manifest <已审阅清单绝对路径> --dry-run` 是针对**仍符合这份纠正清单源状态**的公开纠正审阅入口；目标碰撞、源漂移会拒绝写入，已纠正则不再移动。普通 `edges memory migrate --recursive` 保留旧 owner 关系，不代替实例归属纠正。

## 每个克隆的私有材料

Git 不分发 ignored 用户材料，也不证明别的克隆已完成私有纠正。新实例迁移映射保留 owner-local 关系：根归根，`extensions`、`extensions/skills/project-memory-init`、`shared-extensions`、`knowledge/notes` 各归本节点，旧 `knowledge/tasks` 归 `.harness/tasks`，旧 `evaluation` 归 `.harness/evaluation`，旧 `knowledge/teaching` 归 `teaching`。不能凭标题或正文猜私有归属。

曾被旧版本提升到根的私有记录须在**该克隆**凭 `.recursive-layout-migration/journal.json` 的可信旧 owner 与源身份显式 opt-in 纠正。先保留原 journal 和源/目标字节，核对其权限、忽略规则和 provenance，再在隔离副本用 `pnpm restore:local-ownership --root <该克隆绝对路径> --private --dry-run` 审阅。来源缺失、歧义、目标冲突或旧版仍 pending 的提升 journal 会给出诊断并拒绝猜测；请人工核实后处理，勿删除 journal 或覆盖编辑。完成旧迁移的新 journal 可继续安全 resume，纠正过程使用独立的 ignored `.ownership-correction/private.json`，与旧实例日志分开。这里没有对当前克隆执行私有纠正。

迁移及纠正保留文件名、附件、权限和未知元数据；已建立的目标目录只收紧私有权限，不放宽。旧私有类型索引缺失时预检拒绝，不能把缺索引当作没有私有数据。已采用官方 `user` 类型而缺 ignored 索引的教学、评测等节点，实例迁移按实际记录生成或使用官方空模板；不会凭空采用自定义类型。任何后来编辑的副本不能被旧 journal 强制重放。

## 验证与边界

通用迁移器的 `.project-memory-migration/journal.json` 与实例迁移、纠正 journal 各自独立。升级前未完成且缺目录权限记录的通用日志会报 `journal-directory-permissions-missing`；需在受保护副本核实可信权限及文件状态，不能删日志重跑。详见[迁移 Skill 的旧版日志恢复说明](../extensions/skills/project-memory-migrate/SKILL.md#旧版未完成日志的恢复)。

在独立工作树内，可只读运行 `pnpm --filter edges-cli exec tsx src/index.ts memory doctor --target-dir <节点目录>`、`edges tasks --scope <工作树> --purpose domain list` 与 `--purpose maintenance list`。Doctor 对不存在的 referenced 安装来源给出诊断，不意味着可制造空 `.agents/skills` 或正文；公共索引刷新只针对实际存在的源，并保留人工前缀。`scripts/link-agent-skills --dry-run` 与 `--check` 只检查安装关系。`project-tasks-propose-types` 尚无实际源码目录；通用 Task Skill/MCP、自动复盘与 Agent Teams 编排也不因这次归属纠正而完成。

`knowledge/posts/` 保持不变；若其链接需要修改，须由人处理。未初始化 submodule 只保留精确 gitlink，不据此宣称其内部测试已运行。迁移不执行 benchmark、部署、全局安装、合并或发布。
