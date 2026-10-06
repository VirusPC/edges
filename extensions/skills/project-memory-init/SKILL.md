---
name: project-memory-init
description: 对用户选定的任意目录初始化或刷新系统入口 AGENTS.md（硬约束 + 组成登记），并按选择采用 Project Memory / Skills 类型。仅当用户明确要求 init 时使用；命令仍为 edges memory init。
version: 3.2.0
---

# Project harness init（`$project-memory-init`）

面向用户的名称是 **project harness init**；Skill 名与命令仍为 `$project-memory-init` / `edges memory init`（不强制改 bin 子命令）。只在用户明确要求 Init 时运行；Ask、Remember、Doctor 不得代为 Init。用户明确要求 reshape 已有入口时可按该流程初始化。先读 [PROTOCOL](references/PROTOCOL.md) 与 [LAYOUT](references/LAYOUT.md)：前者规定发现形状，后者规定当前路径、类型与写入边界。

**谁该 init：** 用户认定需要重点维护、要挂 Memory / Skills 模块或登记下层系统入口的目录——空目录或已有内容目录均可。Init 写出合法**系统入口** `AGENTS.md`（`project-harness-*` 区块，标题「本层硬约束 / 本层系统维护信息 / 下层系统维护信息」），并按选择创建 `.harness` 下类型组织清单（`README.md` + `project-entries-*`）。

**谁不该 init：** 仅为列系统一孩子、尚未需要系统二材料的目录（用同目录 `README.md` + `project-entries-*`，或迁移脚本另建）；未经用户要求不要给全仓或批量目录铺 `AGENTS.md`。Init **不会**在作用域根自动创建组织清单 `README.md`——那是系统一入口，由用户或迁移单独建立。

模块默认推荐 memory、skills、tasks，按作用域目标采用；本 Skill 只负责 memory / skills 类型选择与系统入口同步。新层先展示 memory 的 project / feedback / reference / user 与 skills 的 managed / referenced 用途，让用户选择，不预建全部。用户已明确选择时直接执行；未选择时命令返回 `selectionRequired` 和推荐清单且不改文件。已有层不传选择只刷新已采用类型。

```bash
edges --scope <目录> memory init \
  [--target-dir <scope>] [--root-dir <root>] \
  [--memory-types project feedback reference user] \
  [--skill-types managed referenced] \
  [--index-group local|descendant] \
  [--description <本层职责>]
```

新层至少选择一类 memory 或 skill；两份列表分别可省略。显式选择追加采用，不删除既有或自定义类型。自定义类型使用 `$project-memory-add-type`，不要改官方推荐模板。

层入口直接链到 `.harness/memory/<plural>/README.md` 与 `.harness/skills/<type>/README.md`，固定两跳到正文，无容器总入口。可读 AGENTS 都是节点；本层和下层按显式登记区分，容器可跨层直达。已有登记不因中间目录新增入口而重归属，节点身份不自动采用 Memory。`--root-dir` 是边界；默认先取 Git 根，否则最近受管层入口，否则目标自身，不能从工具安装目录推断目标。

`managed` 可写本地 Skill；`referenced` 仅索引当前层 `.agents/skills`，不创建来源目录、不动原位正文或安装链接。同源别名在类型内去重，不同真源同名保留。私有类型先补 ignore 再创建索引。

按 JSON 汇报 created / preserved、agentsAction / indexAction 和下层条目移动。`needs-doctor` 表示只有人工 AGENTS，文件未被覆盖；交给 doctor 追加区块。`complete: false` 的 diagnostics 必须说明，尤其来源缺失或不可读时保留原索引，不能称为空来源刷新成功。旧层返回 `migration-required`，转 `$project-memory-migrate`，不让 doctor 迁移。

工具只维护自己的区块，现有硬约束与手写正文不覆盖。需先安装提供 `edges memory` 的 Edges CLI；运行 `edges memory init --help` 检查命令可用性。模板随 CLI 构建分发，类型和字段结构见 references/templates。实现分层见 [运行时说明](references/runtime.md)。

普通记忆正文统一为 `<type>_<slug>/INDEX.md`；Skill 保持 `<name>/SKILL.md`。Init 不转换旧单文件；公开 tracked 内容转换使用 `$migrate-directory-nodes`。

新建父级索引关系时，由调用本技能的 Agent 根据语义明确选择 `local` 或 `descendant`，并传给 CLI 的 `--index-group`；Tasks 将选项放在 `tasks` 后，Memory 放在 `init` / `doctor` 后，Note 放在 `note` 后。不要按 purpose、文件名或目录深度推导，也不要移动已有关系。已有登记保留原分组；缺失 owner 不代为初始化。生成结构内部已有的固定组成关系由 Service 执行，不逐桶询问。遇到 `task-projects` 旧标记时，先对用户选定范围运行 `scripts/migrate-agents-indexes.mts --root /absolute/scope --check`，明确执行迁移才加 `--write`；普通命令不自动迁移。
