# Project 统一作为递归主题材料容器

2026-11-02 确定目标模型：Project 按主题聚合 notes、tasks、memory、skills、routines 与子 Project 等目录材料，使用 `P/<module>` 的直属组成布局，不以独立维护系统为前提。这样用一种分组方式覆盖各模块，移除 Tasks 自己的 Task Project 和 `_default` 层；未归入 Project 的内容仍放在 `<scope>/.edges/<module>`。用户已确认设计并批准实现。

全局 `--project` 与 `--scope` 同级，以 `<scope>/.edges/projects` 为根接受实际相对路径，供所有已有目录操作选择目标；例如子项目路径为 `P/projects/Q`。定位直接复用现有 HarnessMaterial 配置与公共路径函数，不引入第二套模块注册表，不为 Project 自动建立 AGENTS 或一套 `.edges`。参数选择操作范围，不表示移动内容归属。

曾考虑把每个 Project 都视作维护作用域，使用 `P/.edges/<module>`；用户明确指出此次目标是按主题分组，选择直属组成。Project 如需自身维护空间，仍按原有显式初始化规则建立，不能与它聚合的主题材料混为一套。Artifacts 是远端发布服务，不对应此次目录模块；其服务、协议和历史元数据保持原样。

迁移保留原有七个任务分组，各提升为同名主题 Project；新 Project 的目录日期取该组最早 Task 的日期，未归属的 18 条任务只去掉 `_default` 层。迁移前生成预览并检查冲突，任务、日志及组内共享资源一并保留。日期沿用原任务起点，避免把迁移当天误当作主题起始时间。

含下级材料或用户资源的 Project，普通删除拒绝，必须显式 `--recursive` 才删除整棵目录；空容器仍可普通删除。这是容器生命周期的控制规则，不是实际数据删除指令。剩余实现建议与执行验收见[设计稿](../../.edges/memory/projects/project_recursive_projects/INDEX.md)，实现与验收以该设计稿为准。
