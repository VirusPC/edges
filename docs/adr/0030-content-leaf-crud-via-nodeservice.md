# 内容叶子的增删改查经 NodeService，CLI 旗标用同一张表

2026-10-08 grill 确认：Note 与 Skill 的 create / get / update / delete 只经 NodeService，不再用 records 或扫盘旁路。`notes create` 只在本地写叶子，不做 git commit、push 或 PR。skills create 与 update 真写受管 `SKILL.md`。下面这张旗标表是全仓 house CLI surface；本决定先落地 notes 与 skills，README / 组织列表、memory、tasks 以后照表跟随，本决定不改那些命令。

**Status:** accepted（ADR 0030；grill 确认于 2026-10-08）

**See also:** ADR 0027（CRUD 动词）、ADR 0028（list 分组信封）

## Decision

内容叶子（Note、Skill，以及随后的 Project）的创建、读取、更新与删除一律调用 `NodeService.create` / `get` / `update` / `destroy`。命令层不 `readFileSync` / `writeFileSync` / `rmSync` / `readdir` 直改叶子或父索引。删除用 `destroy`，并清掉父级组成登记。

`notes create` 只做本地 `NodeService.create`。不在 create 上做 token 鉴权，也不保留 `--import-entry`、`--co-author`、`--mode`、`--dry-run`、`--content`、`--content-file`、`--markdown`、`--token-file`、`--token-stdin`。

skills create 与 update 写入当前 scope 的受管技能目录 `skills/managed/<kebab-name>/SKILL.md`（与 harness-materials `skills.managed` 对齐；真系统落在 `<scope>/.harness/` 下，`--super` 落在 scope 目录下），并登记父级组织清单。本决定不加 `referenced` 或其他特殊旗标。`edges memory remember` 仍可写 skill 类记忆，与 `edges skills` 并列，不互相代替。

标准 CRUD 旗标（house CLI surface）：

| 命令 | 旗标 |
| --- | --- |
| `list` | 共享 `--filter` / `--group-by` 信封，外加全局 `--scope` / `--super` / `--all`。不另造域专用 list 旗标 |
| `get` | 只收目标 |
| `create` | metadata + `--body`，外加该类型真正需要的旗标 |
| `update` | metadata + `--body`，外加该类型真正需要的旗标 |
| `delete` | 只收目标 |

类型旗标只在必要时出现：note 标题经正文 H1 或 `--title`；skill 用 name / description。正文旗标用 `--body`，不用 `--content`。metadata 用可重复的 `--metadata key=value`。

2026-10-08 补充：CRUD 用例放在各领域的 `services/<module>/service.ts`。commands 不直接装配 `NodeService`，也不直接调用 `dated-leaf` 这类共用底层。notes 与 projects 的主文件固定叶子规格后委托 `services/node/dated-leaf.ts`。其余领域的主文件 re-export 模块内已有实现，以及该命令已经在用的跨领域符号；不把实现再搬一遍。`memory` 的迁移实现是可选项，主文件用动态 `import("./migrate.js")` 转发 `migrateMemory`，避免普通启动去加载它。`services/node/*`、`scope.ts`、`list-query.ts`、`metadata.ts`、`config.ts`、`import-entry.ts` 保持跨领域工具，不单独套 `service.ts`。

## Considered Options

- 保留 `services/note/records.ts` 与 `services/skills/records.ts`，内部改调 NodeService：否决。旁路模块还会被当成第二条写入门。
- `notes create` 继续 git/PR ingest，只把 get/update/delete 收口：否决。同一命令面会留下两套写入。
- skills create/update 继续只提示 `edges memory remember`：否决。见 ADR 0027 的修订；Skill 叶子要能被 `edges skills` 真写。
