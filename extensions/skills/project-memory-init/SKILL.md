---
name: project-memory-init
description: 在指定作用域按用户选择创建或刷新项目记忆与技能类型（AGENTS.md + .harness）。仅当用户明确要求初始化时使用，不覆盖已有正文。
version: 3.1.1
---

# Project Memory Init

只在用户明确要求 Init 时运行；Ask、Remember、Doctor 不得代为 Init。用户明确要求 reshape 已有入口时可按该流程初始化。先读 [PROTOCOL](references/PROTOCOL.md) 与 [LAYOUT](references/LAYOUT.md)：前者规定发现形状，后者规定当前路径、类型与写入边界。

模块默认推荐 memory、skills、tasks，按作用域目标采用；Project Memory 只负责前两者的类型。新层先展示 memory 的 project / feedback / reference / user 与 skills 的 managed / referenced 用途，让用户选择，不预建全部。用户已明确选择时直接执行；未选择时命令返回 `selectionRequired` 和推荐清单且不改文件。已有层不传选择只刷新已采用类型。

```bash
edges memory init \
  --target-dir <scope> [--root-dir <root>] \
  [--memory-types project feedback reference user] \
  [--skill-types managed referenced] \
  [--description <本层职责>]
```

新层至少选择一类；两份列表分别可省略。显式选择追加采用，不删除既有或自定义类型。自定义类型使用 `$project-memory-add-type`，不要改官方推荐模板。

层入口直接链到 `.harness/memory/<plural>/AGENTS.md` 与 `.harness/skills/<type>/AGENTS.md`，固定两跳到正文，无容器总入口。可读 AGENTS 都是节点；本层和下层按显式登记区分，容器可跨层直达。已有登记不因中间目录新增入口而重归属，节点身份不自动采用 Memory。`--root-dir` 是边界；默认先取 Git 根，否则最近受管层入口，否则目标自身，不能从工具安装目录推断目标。

`managed` 可写本地 Skill；`referenced` 仅索引当前层 `.agents/skills`，不创建来源目录、不动原位正文或安装链接。同源别名在类型内去重，不同真源同名保留。私有类型先补 ignore 再创建索引。

按 JSON 汇报 created / preserved、agentsAction / indexAction 和下层条目移动。`needs-doctor` 表示只有人工 AGENTS，文件未被覆盖；交给 doctor 追加区块。`complete: false` 的 diagnostics 必须说明，尤其来源缺失或不可读时保留原索引，不能称为空来源刷新成功。旧层返回 `migration-required`，转 `$project-memory-migrate`，不让 doctor 迁移。

工具只维护自己的区块，现有硬约束与手写正文不覆盖。需先安装提供 `edges memory` 的 Edges CLI；运行 `edges memory init --help` 检查命令可用性。模板随 CLI 构建分发，类型和字段结构见 references/templates。实现分层见 [运行时说明](references/runtime.md)。

普通记忆正文统一为 `<type>_<slug>/index.md`；Skill 保持 `<name>/SKILL.md`。Init 不转换旧单文件；公开 tracked 内容转换使用 `$migrate-directory-nodes`。
