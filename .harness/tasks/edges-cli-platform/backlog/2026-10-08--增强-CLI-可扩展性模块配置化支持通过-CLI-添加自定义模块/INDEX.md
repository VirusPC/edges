---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-08T04:32:47.924Z'
  edges-title: 增强 CLI 可扩展性：模块配置化，支持通过 CLI 添加自定义模块
  edges-tasks-status: backlog
  edges-task-priority: none
name: cli_cli
description: 现在加一个模块要改好几处代码。目标是让模块主要靠配置声明，用户也能用 CLI 自己加模块。
---
**背景：**
2026-10-08 合入 #190 后，`edges init` 成了标准命令，每个模块各管各的 init，根命令只负责编排。但模块清单目前写死在代码里，挂载表 `harness-materials.json` 和 init 模块表 `services/init/modules.ts` 是分开维护的。命令注册、service 主文件、init 那一段也都要逐个手写。所以新增一个模块要同时改好几处，用户也没法自己往系统里加模块。用户提出要先记一张卡，增强 CLI 的可扩展性。
- 现状：模块的材料、init 行为和命令入口分散在挂载表、init 模块表、`program.ts` 和各模块的 `commands/*`、`services/*/service.ts` 里。
- 约束：沿用 #187 和 #190 定下的分层，也就是 NodeService 提供底层能力，service 是薄封装，commands 只调 service、不读材料清单。模块之间各管各的，不互相创建对方的材料。
- 预期收益：加模块的成本降低，用户可以按自己的需要扩展系统。
- 关联：#187、#190、ADR 0031；`project-memory` 下的「Memory 模块解耦与可插拔接口」、`edges-cli-platform` 下的「edges 封装为脚手架框架并定义升级路径」。

**目标：**
新增模块主要靠配置声明，不用再到各处改代码。用户可以用 CLI 添加自定义模块，自定义模块和内置模块一样能被 `edges init` 和统一的 CRUD 命令识别。

完成标准待 grill-with-docs 补。待定：配置放在哪里（仓库内还是 scope 下）；自定义模块能用到哪一层（只有 init，还是也包括 list/get/create 等 CRUD）；是否要 `edges modules add` 一类命令。
