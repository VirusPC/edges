# 列表分组只用一种输出，缺字段记为 `__undefined__`

2026-10-06 grill 确认：Task、Memory、Note、Skill 的 `list --group-by` 使用同一种 JSON。不再为任务的 project 分组单独保留 `edges.tasks.grouped/v1`。修订 [ADR 0021](0021-persistent-tasks-board-site.md) 的数据面。审阅页自己的 groups 与 items 输入不变。

**Status:** accepted（ADR 0028；grill 确认于 2026-10-06）

**See also:** ADR 0021（[`/tasks/` 持久看板站](0021-persistent-tasks-board-site.md)）

## Decision

- 分组输出是 `{ status: "success", groupBy, groups: [{ key, items }] }`。
- 先按 `--filter` 过滤，再分组。同一字段多条过滤是 OR，不同字段是 AND，比较只做等于。任务已有的 `--status`、`--priority`、`--project` 是对应 `--filter` 的同一条件。
- 字段只认条目上的一层键。名为 `a.b` 的键就是这个名字，不表示嵌套取值。
- 缺字段当作值 `__undefined__`。列表的 `key`、审阅页这一组的 id 和 title、以及 `--filter field=__undefined__` 都使用这个词。
- 值就是空字符串时单独成组，不并进缺字段。
- 值正好是 `__undefined__` 时，和缺字段进入同一组。
- 字符串、数字、布尔值按文本比较，所以 `--filter n=1` 匹配数字 `1`。对象和数组先按键名排序变成 JSON 文本，再参加比较和分组。
- `/tasks/` 读取这份输出，再映射成审阅页的 groups 与 items。`current` 与 `suggested` 都写成该组的 key。

## Considered Options

- 保留 `edges.tasks.grouped/v1`，只让其他资源用简单外壳：否决。持久站会因此留下第二种列表契约。
- 缺字段用 JSON `null`，或用 `unspecified`：否决。`null` 不能作为审阅页的 group id；`unspecified` 容易和真实字段值重名。
- 用 `v:` / `m` 给审阅页 id 编码：否决。列表和审阅页会各有一套键。
