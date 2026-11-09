# Project 统一作为递归主题材料容器

2026-11-02 确定目标模型：Project 按主题聚合 notes、tasks、memory、skills、routines 与子 Project 等目录材料，使用 `P/<module>` 的直属组成布局，不以独立维护系统为前提。这样用一种分组方式覆盖各模块，移除 Tasks 自己的 Task Project 和 `_default` 层；未归入 Project 的内容仍放在 `<scope>/.edges/<module>`。用户已确认设计并批准实现。

全局 `--project` 与 `--scope` 同级，以 `<scope>/.edges/projects` 为根接受实际相对路径，供所有已有目录操作选择目标；例如子项目路径为 `P/projects/Q`。定位直接复用现有 HarnessMaterial 配置与公共路径函数，不引入第二套模块注册表，不为 Project 自动建立 AGENTS 或一套 `.edges`。参数选择操作范围，不表示移动内容归属。

曾考虑把每个 Project 都视作维护作用域，使用 `P/.edges/<module>`；用户明确指出此次目标是按主题分组，选择直属组成。Project 如需自身维护空间，仍按原有显式初始化规则建立，不能与它聚合的主题材料混为一套。Artifacts 是远端发布服务，不对应此次目录模块；其服务、协议和历史元数据保持原样。

迁移保留原有七个任务分组，各提升为同名主题 Project；新 Project 的目录日期取该组最早 Task 的日期，未归属的 18 条任务只去掉 `_default` 层。迁移前生成预览并检查冲突，任务、日志及组内共享资源一并保留。日期沿用原任务起点，避免把迁移当天误当作主题起始时间。

含下级材料或用户资源的 Project，普通删除拒绝，必须显式 `--recursive` 才删除整棵目录；只有自身正文和未改写生成索引的空容器仍可普通删除。这是容器生命周期的控制规则，不是实际数据删除指令。完整行为与边界见[设计稿](../../.edges/memory/projects/project_recursive_projects/INDEX.md)，迁移命令、冲突检查与中断恢复见[迁移说明](../../scripts/migrations/recursive-projects.md)。

实现后的框架仓数据核对见[迁移验收](../migrations/2026-11-02-recursive-projects.md)。

2026-11-09 补充：`--super` 是整仓材料面，不是单个模块的特例。默认材料根仍是 `<scope>/.edges`。显式 `--super` 时，notes、tasks、routines、skills、memory、compose 以及 `edges init` 都使用 `<scope>/<module>`。`--project` 只在这一面的 projects 目录里解析：默认 `<scope>/.edges/projects`，`--super` 时 `<scope>/projects`，两条路径互不回退。选中 P 之后，材料仍在 `P/<module>`。`edges init --super` 还会在 scope 的 `AGENTS.md` 硬约束里追加一次「这是独立 edges harness 仓库，调用 edges cli 时优先考虑加 --super 参数」，保留用户已写的其他约束。`edges --super compose add` 在未给路径时把检出放在 `<scope>/<name>`，登记表是 `<scope>/compose/README.md`。不带 `--super` 的 init 与 compose 仍使用 `.edges/`。
