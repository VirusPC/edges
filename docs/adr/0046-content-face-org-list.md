---
status: accepted
---

# 系统一叶子登记在内容面 README，缺了就创建

Note、Project 与 Task 是系统一孩子。Q13 规定它们只登记在组织清单 `README.md` 的 `project-entries-*` 里，不进 `AGENTS.md`。创建路径在组织清单不存在、或 README 只是散文、没有 entries 标记时，曾回落到同目录或更上层的 `AGENTS.md`。`edges notes init` / `edges projects init` 又只种 `<scope>/.harness/notes/README.md` 与 `<scope>/.harness/projects/README.md`，而 `edges notes create` / `edges projects create` 写的是 `<scope>/notes/`、`<scope>/projects/`。两份文件不是同一个父节点。

**Status:** accepted（ADR 0046）

**See also:** ADR 0029（Q13：系统一孩子只在 README）、ADR 0031（init 编排；notes/projects 只建 harness 清单的那句由本 ADR 修订）、ADR 0035（`.harness/README.md` 仍是材料索引）

## Decision

1. **叶子父节点是内容面组织清单。** `edges notes create` 登记到 `<scope>/notes/README.md`。`edges projects create` 登记到 `<scope>/projects/README.md`。Task 叶子登记到所属 Task Project 的 `README.md`（维护看板在 `<scope>/.harness/tasks/<project>/README.md`，`--super` 在 `<scope>/tasks/<project>/README.md`）。
2. **缺了就创建，不回落到 AGENTS。** 组织清单不存在时，创建带 `project-entries-local` 的 ReadmeNode。已有散文且没有 entries 标记时，保留原文，只补上标记。`physicalParent` 对系统一孩子只接受带 entries 的 README，或类型索引 README；不再因为同目录有 `AGENTS.md` 就选它。选不中就继续向上找 README，找不到就是没有父节点，而不是挂到 AGENTS。
3. **写之前父节点必须就是这份清单。** 创建 note/project 时，若算出来的父节点不是上述内容面 README，命令失败。创建 task 时，若父节点不是该 Task Project 的 README，命令失败。
4. **init 同时保证内容面清单。** `edges notes init` 与 `edges projects init` 仍把 harness 条目放在 `<scope>/.harness/notes/README.md`、`<scope>/.harness/projects/README.md`，并挂到 `.harness/README.md`（ADR 0035）。同时确保 `<scope>/notes/README.md`、`<scope>/projects/README.md` 存在。harness 条目不带 `project-entries`，不接收叶子。内容面 README 才是叶子的组织清单。init 仍不读 `--super`。
5. **不在本决定里搬家。** 已经写在 `.harness/projects/` 下的叶子留在原处。个人仓的内容面不在本决定里迁移。
6. **类型索引不变。** Memory 与 Skill 仍登记在各自的类型 README。路径落在 `.harness` 下、相对 scope 属于 harness 材料时，仍可以由系统入口承接，这不是系统一叶子。

## Considered Options

- **继续在没有 README 时登记到 AGENTS：** 否决。和 Q13 相反。
- **只改 notes/projects，tasks 仍可挂到项目 AGENTS：** 否决。Task 叶子同样是系统一孩子。写任务时若项目只有 `AGENTS.md`，补项目 README 再登记。发现阶段不把每个仅有 AGENTS 的目录都补成项目。
- **取消 `.harness/notes|projects/README.md`，只留内容面：** 否决。那会拆掉 ADR 0035 的材料索引条目。两份文件职责不同：一份是索引条目，一份是叶子清单。
- **把 create 改到 `.harness/notes/`：** 否决。叶子路径仍是 `<scope>/notes/<date>--<slug>/INDEX.md` 与 `<scope>/projects/...`。

## Consequences

- 没有 `notes/README.md` 时，`edges notes create` 会创建它并把叶子列进去。`projects` 相同。根 `AGENTS.md` 与 `notes/AGENTS.md` 不会因此多出叶子链接。
- 内容面 README 已是散文时，原文保留，并出现 `project-entries-local`。
- `edges notes list` / `edges projects list` 会读这份内容面清单，不要求叶子先挂在 `AGENTS.md` 上。
- 删除叶子时，即使这份 README 没有从 AGENTS 树走到，也会从它的物理父节点摘掉链接。
- 新的 notes/projects init 会多写出内容面 README。已有 harness 条目文件不会被 init 重写。
