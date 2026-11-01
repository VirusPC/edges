---
name: feedback_scope_super_all
description: >-
  改 edges 的 list、写任务、init、doctor、帮助、skill 或持久看板生成时：目录和登记分组只由
  --scope、--super、--all 与路径决定，不要再加 purpose、index-group 或另一套全仓开关。
metadata:
  edges-title: scope、super、all 的组合形成一切
  edges-type: feedback
  edges-origin-session-id: ed32d8b9-d356-4eb9-8822-6ad2ddc36d1c
  edges-agent-client: cursor
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-11-02T06:52:14+08:00'
---

`--scope`、`--super`、`--all` 与路径决定目录和登记分组。不设 purpose、index-group 之类用途旗标。

**Why:** 用户 2026-10-07 收口，2026-10-18 再拍板。用途和 index-group 是在主体系统之外又加一套分类，命令因此变复杂。目录由范围参数和路径定下之后，看板落点和登记分组跟着目录走。

**How to apply:** 改 list、写任务、init、doctor、帮助、skill 或持久看板生成时，范围只用这三个根开关。`--scope` 选定主体；`--super` 把主体换成该 scope 上的虚拟系统一；`--all` 从当前 scope 走森林。一般 `--scope` 就够。主体是仓库之外的虚拟系统一时，用 `--scope <仓库根> --super`，任务写入该系统的 `tasks/`（即 `<仓库根>/tasks`）。真系统的看板是 `<scope>/.edges/tasks`。最全的查询是 `--scope <仓库根> --super --all`。

`edges init`、`edges memory init`、`edges notes init`、`edges projects init`、`edges skills init`、`edges tasks init` 不接受 `--index-group`。未登记的子作用域按路径登记：目标 `AGENTS.md` 在锚点 `.edges` 下是 local，否则是 descendant。已经登记的保持原组。`edges memory doctor --apply` 用同一规则补上缺失的父级链接，不挪已有登记。

`packages/cli/scripts/generate-tasks-site.ts` 不接受 `--purpose`，始终汇总该根下发现的全部任务板。list、分组和生成页仍输出从目录推出的 `source.purpose`（父目录名为 `.edges` 则是 maintenance，否则是 domain）。身份键仍是 `scope:purpose:project:stem`。

不要再加用途、分组或另一套全仓开关。NodeService 写节点时的 `indexGroup` 覆盖不是这条要删的旗标。

## 2026-11-02：各模块共用目录定位规则

用户在 README 维护 Project 落点讨论中明确要求：各模块路径行为应当一致，并使用通用辅助函数定位目录。此前 notes/projects 固定写 scope 直属目录的特例（ADR 0046）由这次决定取代。

**Why:** 同一个 scope 下，tasks、skills、routines 默认写 .edges，notes/projects 却写根目录，导致维护项目落错位置；让调用者改成 scope/.edges 才能写维护项目，会把目录差异转嫁给使用者。

**How to apply:**
- 按 scope 与 super 共用目录定位：默认材料根为 <scope>/.edges，--super 为 <scope>。复用现有辅助函数，模块服务不各自拼另一套规则，commands 只传入选择。
- notes/projects 的 create/get/update/delete/list 使用同一位置规则；init 仍只初始化真实 scope 的 .edges 模块索引，不再同时生成根内容清单与 harness 占位说明。
- 旧根目录内容通过 --super 访问，不静默搬迁；文档、Skill、ADR 和回归测试随接口调整同步。
- 这条记忆记录用户确认的目标规则。具体可用版本以发布记录为准，不把未发布实现当作已安装 CLI 的能力。
- 用户随后要求统一后应更简洁：复用公共定位与遍历时，同步删除旧路径特例对应的二次扫描和重复处理，不以新增包装代替消除重复机制。

## 显式路径的后续目标

用户在各模块 create 增加 --path 的讨论中进一步澄清：在模块行为一致的前提下尽可能受控，并保留兜底方法。路径输入不能只放开 create 而与 get/update/delete 脱节；尽量复用公共函数，删除重复机制。跨模块目录覆盖和兜底入口的具体形式仍待细化，不把任意目录写入候选当成已确认契约。具体边界以设计确认后的契约为准。
