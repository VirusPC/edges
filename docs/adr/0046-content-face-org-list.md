---
status: accepted
---

# 叶子登记在模块 README，材料目录遵循统一作用域规则

Note、Project 与 Task 是系统一孩子。Q13 规定它们只登记在组织清单 `README.md` 的 `edges-entries-*` 里，不进 `AGENTS.md`。组织清单不存在、或 README 只是散文、没有 entries 标记时，创建曾回落到同目录或更上层的 `AGENTS.md`。本 ADR 最初修复这一问题，但保留了 notes/projects 总是写 scope 直属目录的特例：init 同时创建根目录的叶子清单与 `.edges/` 下不接收叶子的占位条目。

2026-11-02 用户指出，同一个 `--scope` 不应在 notes/projects 与 tasks、skills、routines 上产生两套默认目录规则，模块应共用目录定位函数。这个特例还迫使调用者把 scope 改为 `.edges` 才能写维护项目，混淆了被维护的目录与它的材料目录。

**Status:** accepted（ADR 0046；2026-11-02 修订，取代本 ADR 原有 notes/projects 路径特例与双清单 init 决定）

同日继续统一查询：原先 [ADR 0035](0035-harness-readme-as-layer-material-index.md) 的 super 入口优先级与这里的创建落点冲突，迫使各模块补读直属清单。下面第 8 条取代该旧策略。递归 Project 与去掉 Task Project 分组层见 [ADR 0052](0052-projects-as-recursive-material-groups.md)。

**See also:** ADR 0029（Q13：系统一孩子只在 README）、ADR 0030（内容叶子生命周期经 NodeService）、ADR 0031（init 编排与真实作用域）、ADR 0035（`.edges/README.md` 仍是真实系统的材料索引）

## Decision

1. **材料目录统一由 scope / super 决定。** notes、projects 与 tasks、skills、routines 共用 `packages/cli/src/domain/config/edges-materials.ts` 中的 `materialHarnessRoot`、`placedMaterialPath` / `placeHarnessMaterial`：默认材料根是 `<scope>/.edges`，`--super` 的材料根是 `<scope>`。无论目录是否已存在，都不回退到另一材料根。模块服务从这组辅助函数定位目录，不再自行拼接 `scope + 模块目录` 或复制 super 分支。notes/projects 的创建、目标路径校验与列表使用同一选择。
2. **叶子父节点是所选目录的组织清单。** `edges notes create` 默认登记到 `<scope>/.edges/notes/README.md`，`edges projects create` 默认登记到 `<scope>/.edges/projects/README.md`；`--super` 分别登记到 `<scope>/notes/README.md`、`<scope>/projects/README.md`。Task 叶子登记到所选材料根的 `tasks/README.md`，不再有 Task Project 分组层（ADR 0052）。内容叶子的 create/get/update/destroy 仍经 NodeService。
3. **缺了就创建，不回落到 AGENTS。** 组织清单不存在时，创建带 `edges-entries-local` 的 ReadmeNode。已有散文且没有 entries 标记时，保留原文，只补上标记。`physicalParent` 对系统一孩子只接受带 entries 的 README，或类型索引 README；不再因为同目录有 `AGENTS.md` 就选它。选不中就继续向上找 README，找不到就是没有父节点，而不是挂到 AGENTS。
4. **写之前父节点必须就是这份清单。** 创建 note/project/task 时，若算出来的父节点不是上述所选模块 README，命令失败。
5. **init 只准备真实作用域的模块清单。** `edges notes init` 与 `edges projects init` 在 `<scope>/.edges/notes/README.md`、`<scope>/.edges/projects/README.md` 创建接收叶子的组织清单，并挂到 `.edges/README.md`（ADR 0035）。不再另建根目录内容清单与 `.edges` 占位条目。2026-11-09 起 `edges init --super` 会读取该旗标并初始化 scope 直属清单；不带 `--super` 的 init 仍只准备 `.edges`。`--super create` 继续按需创建 scope 直属的模块清单。
6. **这是路径行为的破坏性变化，不自动迁移。** 旧根目录的笔记、项目与索引留在原处；默认操作不再兼容读取它们，也不双读两个材料根。需要继续处理旧内容时显式使用 `--super`。本次决定尚未发布到 npm，已安装的旧版仍遵循旧行为。
7. **类型索引不变。** Memory 与 Skill 仍登记在各自的类型 README。模块 README 仍由材料索引承接，不把叶子直接登记到 AGENTS。
8. **查询范围由公共入口选择。** 各目录模块共用 `queryMaterialNodes`：默认从真实 `AGENTS.md` 读已登记组成；`--super` 从 scope 直属的 `edges-materials.json` 配置材料展开，根 README 也是普通配置项，不再优先 `.edges/README.md`。`--all` 只读，使用当前 scope 下的独立系统 forest；与 `--super` 同用时加入当前 scope 的虚拟超节点，不为每个系统再加 Super。指定 `--project` 时优先从 P 的 INDEX 组成读取，`--all` 仅追加 P 子树中的独立系统。每次查询按入口路径去重；不改变显式组成链接、内容面或材料所有权的边界。

## Considered Options

- **继续在没有 README 时登记到 AGENTS：** 否决。和 Q13 相反。
- **只改 notes/projects，tasks 仍可挂到项目 AGENTS：** 否决。Task 叶子同样是系统一孩子。写任务时若项目只有 `AGENTS.md`，补项目 README 再登记。发现阶段不把每个仅有 AGENTS 的目录都补成项目。
- **保留 notes/projects 的 scope 直属目录特例：** 2026-11-02 否决，取代本 ADR 原先否决默认 `.edges/notes/` 的决定。同一 scope 应采用同一材料根规则，调用者不应为某个模块改变 scope 的含义。
- **继续维护 `.edges` 占位条目与根目录叶子清单：** 2026-11-02 否决，取代原双清单决定。默认 `.edges` 模块 README 本身就是叶子清单，仍满足 ADR 0035 的材料索引职责。
- **默认双读旧根目录与 `.edges`：** 否决。它会模糊 scope / super 的边界，写入与读取也会不一致。旧内容通过显式 `--super` 操作，不暗中搬迁。
- **为 notes/projects 再造目录辅助函数：** 否决。复用已有 `materialHarnessRoot` / `placedMaterialPath` / `placeHarnessMaterial`，统一来源也统一调用。

## Consequences

- 没有所选模块的 `README.md` 时，create 会创建它并把叶子列进去。默认 notes 在 `.edges/notes/`，`--super` 在 `notes/`；projects 同理。`AGENTS.md` 不会因此多出叶子链接。
- 模块 README 已是散文时，原文保留，并出现 `edges-entries-local`。
- 各模块 list 复用相同的 scope / super / project / all 选择，不再补读另一份模块清单；get、update、delete 仍校验所选材料范围。
- 删除叶子时，即使这份 README 没有从 AGENTS 树走到，也会从它的物理父节点摘掉链接。
- notes/projects init 与默认 create 使用同一份 `.edges` 模块 README，旧根目录内容保持原样。升级后调用旧路径的脚本需显式加 `--super`，或另行安排可审阅的迁移。
