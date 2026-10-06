# 与已有命令重复的 CRUD 动词只提示，不再执行一次

2026-10-06 grill 确认：Task、Memory、Note、Skill 的命令面使用 list / get / create / update / delete 这些动词。已经有专门命令的写入不另做一套实现，该动词只返回失败并指出该调用的命令。

**Status:** accepted（ADR 0027；grill 确认于 2026-10-06）

## Decision

这些命令不修改数据。退出码为 2，失败 JSON 的 `reason` 给出要执行的命令：

- `tasks delete` 提示 `edges tasks status <target> cancelled`。任务文件和 sidecar 保留。
- `memory create` 与 `memory update` 提示 `edges memory remember`。
- `skill create` 与 `skill update` 提示用 `edges memory remember` 写 `SKILL.md`。

这些命令照常执行：`memory list` / `get` / `delete`，`note create`（即今天的 `edges note` 入库）以及 `note list` / `get` / `update` / `delete`，`skill list` / `get` / `delete`。

## Considered Options

- 不增加 `tasks delete`，作废只留在 help 里：否决。命令面需要这个动词，但删除本身仍是把状态改为 `cancelled`。
- `memory create` / `update` 再实现一遍写入：否决。`remember` 已经按 slug 创建或更新。
- 新动词一律不实现，包括 list / get / delete 和 note 入库：否决。这些没有另一条命令可以指向。
