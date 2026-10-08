---
name: feedback_commands_do_not_import_harness_materials
description: 改 CLI 命令时：不要在 commands 里 import harness-materials；看板路径与是否存在走该领域 service。
metadata:
  edges-title: commands 不直接读 harness 材料表
  edges-type: feedback
  edges-origin-session-id: bc-7e37e06f-18ea-5dfd-8876-1ffccc2fc168
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-08T03:52:30+00:00'
---

`extensions/cli/src/commands` 不 import `domain/config/harness-materials`。要看板 README 的位置、是否存在，或某个节点是不是看板 README，走该领域 `services/<module>/service.ts` 导出的薄函数。

**Why:** 用户在 2026-10-08 确认完成标准第 4 条「改一下」。命令自己读挂载表，材料路径判断就留在参数解析层。

**How to apply:** 新命令需要材料位置时，在该模块 service 加薄函数再导出，并保持 `commands` 目录的守护测试通过。审阅页 HTML 与 artifacts token 配置的直接写入与挂载表无关，见 plan 待确认第 12 条，不要顺手大搬。
