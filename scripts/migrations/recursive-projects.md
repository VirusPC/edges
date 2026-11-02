# 递归 Project 迁移

把 `<scope>/.edges/tasks/<group>` 提升为真实 Project：`<scope>/.edges/projects/<最早 Task 日期>--<group>/tasks`。`_default` 内的 Task 直接进入上层 `tasks/<status>/<stem>`。无 Task 的具名组必须通过 `--dates` 提供日期，不取当天或文件修改时间。

在框架仓执行，先保存预览，再使用同一份计划执行：

```sh
pnpm migrate:recursive-projects \
  --root /absolute/scope --plan /absolute/work/migration-plan.json

pnpm migrate:recursive-projects \
  --root /absolute/scope --plan /absolute/work/migration-plan.json --apply
```

计划包含原 README、完整文件清单与 SHA-256；存入工作区 `.work/`，保留到迁移验收完成。中断后重复第二条命令即可恢复。不要重新生成计划覆盖中断前的清单。完成后再次执行同一计划只校验；新预览应显示没有待迁移分组。

预览列出各组最早日期、Task/Run Log/资源计数、既有缺失引用、未登记 Task 及冲突。缺失引用保持原意，不猜测历史链接目标；实际扫描到的 Task 补入目标索引，保证迁移后 CLI 可发现。目标已占用、Task 重名/缺少日期/状态不符、符号链接、预览后内容变化均拒绝执行。`_default` 里的额外共享资源必须先单独制定保留方案，脚本拒绝猜测其归属。

具名组以 README 所属目录为整体，通过 NodeService 搬到 `P/tasks`，因此共享图片的相对位置及 Run Log 字节保持不变。Project INDEX 保留原组标题、描述和正文。Task 的旧 `edges-task-project` 字段删除；状态、优先级和资源保留。脚本维护已登记节点的 Markdown 引用，不批量替换历史 JSON 的 `source` 字段，也不删除已有 Project。

空组日期文件是普通 JSON，例如 `{"empty-topic":"2026-09-01"}`；预览时追加 `--dates /absolute/work/dates.json`。有 Task 的组始终以最早 Task stem 日期为准。
