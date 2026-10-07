# edges init 是标准初始化命令，域 init 委托同一个 init service

模块初始化原先只有 `edges memory init`，notes 与 projects 的 harness 桩顺手挂在这条命令上。根命令 `edges init` 成为标准入口；`edges memory init`、`edges notes init`、`edges projects init` 只委托 `services/init/service.ts`。挂载表 `harness-materials.json` 仍只提供 path，init 模块表用 material id 引用，path 只经 `placeHarnessMaterial`。

**Status:** accepted（ADR 0031；grill 确认于 2026-10-08）

**See also:** ADR 0027（CRUD 动词）、ADR 0030（叶子 CRUD 经 NodeService；该决定不改 memory / tasks / README 命令）

## Decision

`edges init [module...]` 写系统入口和本次列出的模块。不给模块时写 `AGENTS.md`、notes 与 projects 的 `.harness` 组织清单，以及 memory 的 feedback / project / reference。不建 user、skills、tasks、evaluation、observation。`edges init <module>` 可重复，只初始化列出的模块。`edges init memory` 不顺手建 notes / projects 桩；`edges memory init` 在选定类型后仍调用与域 init 相同的桩函数，作为兼容包。

init 不读 `--super`，材料永远落在 `<scope>/.harness`。帮助把「本次会创建」和 tasks（首次 tasks 写入才确保看板）分开。无 TTY。无参 `edges memory init` 仍返回 `selectionRequired` 且不写盘。根 init 的成功信封是 `status: success`；memory init 仍是 `ok: true`。

创建或补齐 scope `AGENTS.md` 是 init service 的公共步骤。桩缺了才建；类型索引继续刷新；AGENTS 只补受管区块。节点文件经 NodeService。唯一例外是非节点 `.gitignore`，仍由 `saveEntries` 写入。本决定不加 tasks / skills 的 init 子命令，也不改 `edges artifacts init`。
