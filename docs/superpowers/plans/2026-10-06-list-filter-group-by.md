# 列表过滤与分组 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `list --filter` 与 `list --group-by` 使用同一种比较和分组，任务列表的分组输出不再使用 `edges.tasks.grouped/v1`。

**Architecture:** `services/list-query.ts` 做纯函数：缺字段是 `__undefined__`，同字段过滤是 OR，不同字段是 AND，对象和数组按键名排序后的 JSON 文本比较。命令先沿用现有的 status / priority / project 筛选，再套 `--filter`，最后分组。`/tasks/` 生成器按 `project` 分组后，把 `key` 写成审阅页的 group id、title、`current` 和 `suggested`。

**Tech Stack:** Node 22、`node:test`、现有 Task 列表函数。不新增依赖。

**Spec:** ADR 0028，以及 `docs/superpowers/specs/2026-10-06-commands-service-decoupling-research.md` 的字符串化结论。

## Global Constraints

- 分组输出是 `{ status: "success", groupBy, groups: [{ key, items }] }`。
- 缺字段、以及值为 `__undefined__` 的行，分到 key `__undefined__`。空字符串单独成组。
- 只认一层键。数字、布尔值按文本比较。
- 任务的 `--status`、`--priority`、`--project` 保留，并与 `--filter` 同时生效。
- 审阅页输入仍是它自己的 groups 与 items。

## Tasks

### Task 1: 纯函数

Create `extensions/cli/src/services/list-query.ts` and `extensions/cli/test/services/list-query.test.ts`.

`fieldText(record, field)`、`matchesFilters(record, filters)`、`groupRecords(records, field)`。

测试：缺字段等于 `__undefined__`；`{b:1,a:2}` 与 `{a:2,b:1}` 是同一组；同字段两条过滤是 OR；不同字段是 AND；空字符串不等于缺字段。

### Task 2: `edges tasks list`

`--filter <field=value>` 可重复。`--group-by <field>` 接受任意字段名。分组 stdout 使用 Task 1 的外壳，不再写 `schema`。未分组时仍是 `{ tasks: [...] }`。

更新 `test/tasks/grouped-list.test.ts` 和 `test/tasks/all-scopes.test.ts` 里对 `edges.tasks.grouped/v1` 的列表输出断言。

### Task 3: `/tasks/` 生成

`generateTasksSite` 用 `project` 的文本做组标题。同一个项目名出现在不同 scope 时，审阅页不允许跨 source 分配，所以站点上的 group id 加上 scope 和 purpose。列表命令本身仍只按字段值分组。

内部的 `buildGroupedList` 可以暂时留下，列表命令和站点生成不再把它当作对外契约。
