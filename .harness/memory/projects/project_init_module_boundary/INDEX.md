---
name: project_init_module_boundary
description: 改 edges init 或域 init 时：memory 不顺手建其他模块；每个有材料的模块只初始化自己。
metadata:
  edges-title: 各模块 init 只创建本模块的材料
  edges-type: project
  edges-origin-session-id: bc-7e37e06f-18ea-5dfd-8876-1ffccc2fc168
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-08T02:40:50+00:00'
---

各模块的 init 只创建并登记本模块的材料。`edges memory init` 不创建 notes、projects、skills、tasks。根命令 `edges init` 只编排公共系统入口，再调用各模块自己的 init。

**Why:** 用户审 #190 后推翻了兼容包和「域入口只有 memory、notes、projects」。原话是「不顺手创建，明确划分模块，简化模型」和「各管各的，简化心智」。顺手创建会让调用方分不清一条命令会带上哪些模块。

**How to apply:** 给模块加 init 时，只建该模块自己的 harness 材料，并经 `services/<module>/service.ts` 薄转发到 init service 里对应的那一段。`edges init <module>` 与 `edges <module> init` 写同一批文件。没有可初始化材料的模块不要硬造命令：evaluation 与 observation 没有领域 CLI；`edges artifacts init` 只写 token 配置。无参 `edges init` 的默认集仍是 memory、notes、projects。
