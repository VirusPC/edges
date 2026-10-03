---
name: project_extensible_memory_types
description: 可扩展 Memory Type：扩展面只在 LAYOUT，用 project-memory-add-type 登记；官方种子仍是六类。决策见 docs/adr/0006-extensible-project-memory-types.md。
metadata:
  edges-title: 可扩展 Memory Type：LAYOUT 登记，不另开注册表
  edges-type: project
  edges-origin-session-id: bc-9250cab9-33e1-4558-bf9b-ab0436599bfd
  edges-agent-client: cursor
  edges-username: Coding Agent 专家
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-13T17:31:43+00:00"
---

官方 init 种子仍是六类（user / feedback / project / reference / skills / agent_skills）；新 Memory Type 由 `$project-memory-add-type`（`memory.py add-type`）在指定记忆目录按 LAYOUT 登记（入口文件 + 复数目录 + AGENTS 本层索引行），与种子同构，已被 remember / ask / doctor 从该层产物发现。PROTOCOL 不枚举具体类型，也不另开 JSON/YAML 类型注册表。实现已落地（ADR 0006）。

**Why:**
2026-09-13 grill 确认（ADR 0006）。类型是检索入口，不是全局注册表键。独立配置平面是多余实体；种子膨胀会把示例（docs / progress / tasks / research / reminder / scheduler）变成默认负担。看板 `knowledge/tasks` 仍是 Issue / Run 真源，与 `tasks` Memory Type 不是同一概念。用户所述。脚本侧已验证：init/remember/doctor 不擦额外 type 行；`--gitignore` / `--index-only` / `--skills-format` 走当前 Python；`--external-content-dir` 本轮 stub。

**How to apply:**
- 用户要加 type：走 `$project-memory-add-type`，不要先做 JSON/YAML 总配置，也不要把示例写进 init 种子。
- 特权 metadata（gitignore、只索引、skills 形态）按现有脚本方式做；内容根放在 `.memory/` 外仍只有官方 `agent_skills`。
- `tasks` 若出现在示例里只是普通 Memory Type，禁止与看板状态夹合并。
- 脚本迁到 edges CLI 是另一条 backlog；能力面仍是 CLI + Skill + MCP 三者并列。
- 决策正文见 `docs/adr/0006-extensible-project-memory-types.md`。
