---
name: project_extensible_memory_types
description: 可扩展 Memory Type：扩展面只在 LAYOUT，用 project-memory-add-type 登记；官方种子仍是六类。实现计划见 docs/superpowers/plans/2026-09-13-extensible-project-memory-types.md。决策见 docs/adr/0006-extensible-project-memory-types.md。
metadata:
  edges-title: 可扩展 Memory Type：LAYOUT 登记，不另开注册表
  edges-type: project
  edges-origin-session-id: bc-9250cab9-33e1-4558-bf9b-ab0436599bfd
  edges-agent-client: cursor
  edges-username: Coding Agent 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-13T12:03:20+00:00"
---

官方 init 种子仍是六类（user / feedback / project / reference / skills / agent_skills）；新 Memory Type 由 skill 在指定记忆目录按 LAYOUT 登记（入口文件 + 复数目录 + AGENTS 本层索引行），与种子同构，可被 remember / ask / doctor 发现。PROTOCOL 不枚举具体类型，也不另开 JSON/YAML 类型注册表。实现计划（writing-plans，本轮只落计划不写 skill）在 docs/superpowers/plans/2026-09-13-extensible-project-memory-types.md。

**Why:**
2026-09-13 grill 确认（ADR 0006）。类型是检索入口，不是全局注册表键。独立配置平面是多余实体；种子膨胀会把示例（docs / progress / tasks / research / reminder / scheduler）变成默认负担。看板 knowledge/tasks 仍是 Issue / Run 真源，与 tasks Memory Type 不是同一概念。实现时最大的坑是 sync_target_agents / doctor --apply 今天会用种子清单整段覆盖本层区块，必须改成合并，否则 add-type 立刻被擦掉。用户所述；计划已落盘。

**How to apply:**
- 实现走该计划：先 discovery 与「不擦额外行」，再 add-type，doctor 放在非 doctor skill 之后。
- 写 $project-memory-add-type，改 LAYOUT 与当前 Python skills / scripts；不要等 edges CLI，也不要先做 JSON/YAML 总配置。
- 特权 metadata（gitignore、只索引、skills 形态）按现有脚本方式做，过重就 stub 并注明；gitignore 对齐 ADR 0003。外部内容根（--external-content-dir）本轮 stub。
- 官方 init 种子不因示例膨胀。tasks 若出现在示例里只是普通 Memory Type，禁止与看板状态夹合并。
- 脚本迁到 edges CLI 是另一条 backlog；能力面仍是 CLI + Skill + MCP 三者并列。
- 本计划 PR 不实现 skill。
