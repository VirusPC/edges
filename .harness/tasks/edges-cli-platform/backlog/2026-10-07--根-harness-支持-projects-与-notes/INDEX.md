---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-07T14:58:18.561Z'
  edges-title: 根 .harness 支持 projects 与 notes
  edges-tasks-status: backlog
  edges-task-priority: none
name: harness-root-projects-notes
description: >-
  让仓库根 `.harness` 像已有 tasks/skills/memory 一样，支持 projects、notes
  材料（目录、层入口/类型索引、CLI/list 可达），与 harness-materials 合同对齐。
---
**背景：**
2026-10-07 用户给任务记录员追加需求：根目录的 `.harness` 要支持 projects 和 notes。当时根 `.harness` 已有 evaluation / memory / observation / skills / tasks 等材料，但 projects、notes 尚未作为同级 harness 材料落地；notes 内容多在知识区，projects 作为记忆类型或独立材料的入口也不在根 harness 上。近一周已落地系统森林、harness-materials、list 走主体系统与 AGENTS.md 类型入口，具备把新材料挂进根 harness 的合同基础。
- 相关现状：2026-10-07 对齐 `origin/main` 后，根 `.harness` 同级目录是 evaluation、memory、observation、skills、tasks，没有 projects、notes。`harness-materials` 与 `--super` / forest 合同已在 #167 一带落地；类型入口倾向 AGENTS.md（#168/#170）。
- 预期收益：根系统二可统一挂载与遍历 projects、notes，减少「材料在仓里但 list/入口找不到」的特判。
- 非目标：本卡不规定 notes 与 knowledge/notes 的最终合并策略；不实现具体 UI；不改 posts 硬约束。不并入开放卡「CLI 与根 .harness 补齐 notes / edges / projects / archive」（那张还要补 edges、archive，以及按文件夹名对齐的顶层命令）。
- 关联：对话（任务记录员 2026-10-07）；兄弟 done「落地递归系统二入口、系统森林与 harness-materials」（`.harness/tasks/edges-cli-platform/done/2026-10-07--落地递归系统二入口系统森林与-harness-materials/INDEX.md`）、「list 改走主体系统，类型入口改用 AGENTS.md」（`.harness/tasks/edges-tasks/done/2026-10-07--list-改走主体系统类型入口改用-AGENTSmd/INDEX.md`）、「让 tasks list 顺着 AGENTS.md 走到任务」（`.harness/tasks/edges-tasks/done/2026-10-07--让-tasks-list-顺着-AGENTSmd-走到任务/INDEX.md`）；project-memory done「层入口表面改用 project-harness 标记」（`.harness/tasks/project-memory/done/2026-10-06--层入口表面改用-project-harness-标记/INDEX.md`）。

**目标：**
仓库根 `.harness` 正式支持 projects 与 notes 两种材料：有约定路径与类型入口，CLI/list（在既有 scope/super/all 合同下）能到达，并与 harness-materials 登记一致。

**动作：**
- grill-with-docs：划清 projects/notes 在根 harness 的目录、索引文件、与现有 memory/skills/tasks 的边界
- 实现或配置 harness-materials / AGENTS 登记 / 必要脚手架，使根 scope 可发现这两种材料
- 补测试与简短文档；派发默认先 grill-with-docs

**完成标准：**（待 grill 可再收紧）
- [ ] 根 `.harness` 下 projects、notes 有约定位置与类型入口（AGENTS.md 或现行合同指定文件）
- [ ] 已写入/更新 harness-materials（或等价登记），`--scope <仓根>` 相关 list/查询能按合同看到它们（或缺文件时按合同跳过且有说明）
- [ ] 与 knowledge/notes、memory 里 project 类型的关系有书面边界（可做/可不做清单）
- [ ] 相关 CLI 测试通过；变更经 PR 合入 main
