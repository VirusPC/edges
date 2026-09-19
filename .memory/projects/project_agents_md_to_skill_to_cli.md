---
name: project_agents_md_to_skill_to_cli
description: peng cheng 理想发现链路——读目录 AGENTS.md，被指引到可加载 Skill，再由统一 Skill 调用 edges CLI；记忆 skills 类型不是自动加载层。
metadata:
  edges-title: 理想链路：AGENTS.md → Skill → CLI
  edges-type: project
  edges-origin-session-id: bc-b6c96ca1-3d8d-53ed-9182-0efcbf2f7f0c
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T06:18:46+00:00"
---

理想工作方式是：进入相关目录先读 `AGENTS.md` → 由其索引/硬约束导向本仓可加载 Skill（`.agents/skills` / `extensions/skills`）→ 由（尽量大一统的）Skill 调用 `edges` CLI 完成仓内操作，而不是 agent 直接手搓文件或自造流程。用户所述（peng cheng，2026-09-19）。

**Why:**
AGENTS.md 是目录级入口与硬约束；Skill 承载工作流与闸门；CLI 是可执行真源（ADR 0004）。项目记忆里的 `skills` 类型只是沉淀态，须晋升/安装后才进自动加载层；`agent_skills` 索引的才是 harness 会调的。

**How to apply:**
写 AGENTS.md 时要能指到 Skill；缺统一 CRUD Skill 时补 `extensions/skills`（见 tasks backlog「edges tasks 的 Skill + MCP 封装」），不要只把流程写进 `.memory/skills` 就当已闭环。Agent 若找不到 Skill/CLI，向用户报缺口。交叉：`prefer_repo_skills_and_cli`、`tasks_board_mutations_via_cli`。
