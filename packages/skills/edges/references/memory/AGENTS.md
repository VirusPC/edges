# edges memory

本目录是 edges-memory 系列的共享家，放在总入口 skill `edges` 的 `references/memory/`。协议与布局在 `references/`，开发流程与设计决策见本层维护记忆，见[开发规范](.edges/memory/projects/project_development/INDEX.md)。



<!-- edges-constraints:start -->
## 本层硬约束

<!-- edges-seed:preamble -->
材料放在本层 `.edges/` 下各类型的目录里，以 `.edges/README` 的登记为准，只认已经初始化的类型。读写都走 `edges` skill，按类型用 `edges <模块>`，不要手改受管理的目录和索引。提问或动手之前，按当前任务的相关性，从该类型的根目录到相关子目录逐层查；本轮已经查过、输入也没变，就不再重复查。沉淀遵守该类型既有的创建与审批规则；识别出候选不等于获准落盘。
- 改这套材料的顺序：`PROTOCOL.md` → `LAYOUT.md` → `edges` 的 memory 说明（`../memory-init.md` 与 `references/templates`）→ `edges` 的 references（`memory-ask`、`memory-remember`、`memory-add-type`）。不能跳到下游再反过来定义上游。
- Init 只在用户明确要求时运行；Remember / Ask / Doctor 不得代为 Init。
<!-- edges-constraints:end -->


<!-- edges-local:start -->
## 本层系统维护信息
- [本层 harness 材料索引](<.edges/README.md>) — 本层 harness 材料的组织清单。各材料只在这里登记。
<!-- edges-local:end -->
