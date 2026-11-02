# 递归 Project 迁移验收

2026-11-02 按 [ADR 0052](../adr/0052-projects-as-recursive-material-groups.md) 将框架仓原 Task 分组提升为通用 Project。基线为 `1211393`；执行前保存预览，目标无冲突，再使用同一计划 apply。命令与恢复方式见[迁移脚本说明](../../scripts/migrations/recursive-projects.md)。

## 归属映射

以下 Project 路径相对 `.edges/projects`；日期均取组内最早 Task stem 的日期。已有 Code Review 和 Edges README 优化两个 Project 保留。

| 原任务组 | 任务数 | 新 Project |
| --- | ---: | --- |
| agent-clients-ux | 31 | `2026-09-09--agent-clients-ux` |
| edges-extensions | 43 | `2026-09-09--edges-extensions` |
| edges-tasks | 22 | `2026-09-11--edges-tasks` |
| evaluation | 19 | `2026-09-11--evaluation` |
| observation | 4 | `2026-09-13--observation` |
| project-memory | 25 | `2026-09-08--project-memory` |
| edges-routines | 1 | `2026-10-11--edges-routines` |

命名组整体进入 `P/tasks`，包括原组 README 和共享资源；Project INDEX 保留原组说明。`_default` 的 18 条任务进入 `.edges/tasks/<status>/<stem>`，旧组正文保留在根任务板的历史说明段中。

## 验收结果

- 实际 Task 目录与 CLI 查询均为 **163** 条，根层未归属任务 **18** 条；旧 `edges-task-project` 字段已移除。
- **160** 份 Run Log、**4** 张共享图片逐项 SHA-256 与预览清单一致；图片合计 **134181** 字节。原来没有日志的 3 条任务没有补造日志。
- 已登记节点的相关链接由 NodeService 更新，包括 Code Review 正文和根 README。历史 JSON、历史 Run Log 不作文本替换。
- 同一计划再次 apply 后，公开材料与根 README 共 **549** 个文件的路径、内容哈希不变；重新预览没有待迁移分组或冲突。
- 站点生成成功：**10** 个分组（未归属板 + 9 个 Project），**163** 条任务。

原索引存在 **2** 条失效引用和 **4** 条漏登记任务。迁移保留失效引用原文，不按相似标题猜目标；实际存在的任务补入目标索引，因此 CLI 可发现全部 163 条。后续清理旧引用应单独核对其原意。

验证包括完整 CLI 测试（1026 通过、1 项平台条件跳过，包含打包后独立安装验证）、任务审阅前端 28 项测试、MCP Notes 14 项测试，以及独立代码审查。迁移专项覆盖预览、冲突、原文/资源保留、中断恢复和重复执行；没有对真实 Project 执行删除。
