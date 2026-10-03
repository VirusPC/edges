# Edges 递归目录迁移

新版常规工具只使用新布局。根作用域的领域 Task 在 `tasks/`，维护 Edges 的 Task 在 `.harness/tasks/`；Task Project 仍只是看板分组。根维护知识在 `.harness/memory/<type>/`，技能类型入口在 `.harness/skills/{managed,referenced}/`。评测与观测归 `.harness/`；项目研究与教学分别在顶层 `projects/`、`teaching/`。

归属与源哈希见[审阅清单](superpowers/plans/2026-10-03-recursive-scope-ownership.json)。清单包含 103 条 Task、100 份现存 Run、4 张附件、52 条局部记忆的逐项映射。3 条 Task 原来没有 Run，不补造。Task 的 stem、状态、Project 和手写元数据保持；两个看板分别保留其项目入口。归属判断不是从 Project 名字推导子作用域。

## 在指定工作树运行

本仓修改须使用独立 worktree。先保存自己的修改，再从工具所在 checkout 执行：

```bash
python3 scripts/migrate-recursive-layout.py --worktree /absolute/path/to/owned-worktree --dry-run
python3 scripts/migrate-recursive-layout.py --worktree /absolute/path/to/owned-worktree --apply
```

也可以用 `pnpm migrate:recursive-layout --worktree <path> --dry-run`。`--worktree` 必须是 Git 工作树根，所有数据写入都限于该路径；脚本不安装技能、不部署服务、不改其他 checkout。完整迁移会核验清单的源哈希、保护文章哈希与 submodule 指针，有差异先停，不覆盖。

公共类型索引合并会保留兼容的未知类型字段和 frontmatter 字段；同名字段值冲突或无法安全合并的元数据结构会在写入前报错，不任选一份或丢弃模块字段。

脚本复用 `project-memory-migrate/scripts/migrate.py` 的规划、旧类型解析、元数据转换、路径保护、Markdown 链接重定位与文件状态写入接口；将通用规划的中间目标合成为审阅后的最终归属，再统一复制、验证并退役旧源。通用迁移器不内置 Edges 业务路径。观察模块的职责与导航以 `.harness/observation/AGENTS.md` 为入口；Memory、Skills 不新增容器总入口。

## 每台机器的私有材料

Git 提交只迁移公开内容，不能代表其他克隆的 ignored 用户材料已迁。即使已拉到新版公开目录，也要在需要升级的独立工作树上运行同一实例命令。普通 `project-memory-migrate --recursive` 保留旧 owner 关系，不能代替本实例的 owner 合并。

清单的 `privateOwnerMap` 明确旧 owner 的目标：

| 旧 owner | 新 owner |
| --- | --- |
| 根 `.` | 根 `.` |
| `extensions` | 根 `.` |
| `extensions/skills/project-memory-init` | 根 `.` |
| `shared-extensions` | 根 `.` |
| `knowledge/tasks` | 根 `.` |
| `knowledge/notes` | 根 `.` |
| `evaluation` | `.harness/evaluation` |
| `knowledge/teaching` | `teaching` |

仅按这份 owner 映射迁移，不读取私有正文推断归属。保留文件名、附件、权限和类型元数据中的未知字段；私有目录按源权限建立，已有目标目录只收紧、不放宽，并在复制任何私有文件前完成权限与忽略设置。正文及类型索引的相对链接按旧位置到最终位置重定位，引用原模块 README 等原位文件时保留其语义目标。不合并有差异的私有索引，不丢掉手写说明。未知 owner、无法判断类型身份或权限、不同目标内容碰撞都会在写入前报具体路径。先由人明确冲突的归属或保留方式，再重跑；不要删除旧文件来绕过检查。仅剩用户正文而没有旧索引时，须已有目标作用域的私有类型索引；新旧索引均不存在则预检报 `private-index-missing`，先恢复本机私有索引再迁移，不能把缺索引当作没有私有数据。

新拉取的公开树可能在 teaching、evaluation 等已采用 `user` 类型的真正作用域里缺少 ignored 官方索引。实例脚本会在写入前为这些明确采用的官方用户类型规划缺失索引：已有本机用户记录时只按实际记录生成索引，无记录时使用官方空索引模板，不新增正文或类型采用。现存索引和手写说明保留；缺少自定义类型索引时，因无法恢复其原权限和未知元数据，会在预检要求先恢复原索引。

已经升级的公开树允许 Task 后续变更状态、增加新记忆；私有残留迁移不重放旧公开快照，也不要求已移动 Task 仍在原来的状态路径。原模块不会因为私有残留重新成为作用域。

`.recursive-layout-migration/journal.json` 保存恢复所需的字节状态，目录权限 0700、文件 0600，并在复制私有材料前加入 Git 忽略；禁止提交或公开这个日志。失败时保留工作树与日志，修正报出的冲突后用同一命令重跑。脚本检查源/目标是否被后来编辑，验证副本、类型索引、链接与忽略覆盖后才删除源。运行完成后再次执行应返回 `unchanged`；后来新增内容不会被覆盖。 旧版本若已复制根私有索引后因其他作用域缺少官方用户索引而停在 `copied`，保留现有日志与旧源，升级脚本后按同一工作树先 `--dry-run`、再 `--apply`。新版先验证原日志中的源/目标未被修改，再扩充缺失官方索引操作并继续；后来编辑过已复制目标时仍会停下报冲突，不丢弃日志或覆盖编辑。

## 验证与边界

```bash
python3 extensions/skills/project-memory-init/scripts/memory.py doctor --target-dir /absolute/path/to/owned-worktree
pnpm --filter edges-cli exec tsx src/index.ts tasks --scope /absolute/path/to/owned-worktree --purpose domain list
pnpm --filter edges-cli exec tsx src/index.ts tasks --scope /absolute/path/to/owned-worktree --purpose maintenance list
scripts/link-agent-skills --dry-run
scripts/link-agent-skills --check
```

发现索引缺项时按 Doctor 的诊断处理；索引刷新保留手写引言。技能安装关系由已有 `link-agent-skills` 管理，只允许修正该工作树自己的安装入口。缺失的 referenced 来源如 `.harness/evaluation/.agents/skills`、`teaching/.agents/skills` 保持明确诊断，不制造 `.agents` 目录或正文。`project-tasks-propose-types` 在当前源码中没有实际目录/正文，因此不凭空创建；通用 Task Skill/MCP 与 Python→CLI 等 backlog 也不因此完成。

`knowledge/posts/` 字节不变。若保护文章内的链接因搬迁需要改正文，预检会停下交人处理。其他 Markdown 只重定位链接，不全局替换历史文字、代码示例或旧目录叙述。未初始化的 submodule 只迁移 Git 的精确 gitlink；其内部文档仍不可读，不据此宣称 LoCoMo 已运行。此迁移不执行 benchmark、部署、全局安装、合并或发布。
