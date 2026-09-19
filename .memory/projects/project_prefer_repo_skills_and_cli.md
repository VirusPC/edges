---
name: project_prefer_repo_skills_and_cli
description: 执行 VirusPC/edges 仓内工作时，优先调用本仓 Skill 与 edges CLI；不可用须向用户说明缺口，勿默认手搓绕过。
metadata:
  edges-title: 仓内任务优先用仓库 Skill 与 CLI
  edges-type: project
  edges-origin-session-id: bc-b3296852-77bf-5b3b-a2c3-9b223c4dff34
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-19T06:18:49+00:00"
---

做 edges 仓内任务时，优先使用本仓库已有的 Skill（如 `.agents/skills` / `extensions/skills`）与 CLI（`edges` / `extensions/clis`），而不是手写等价流程或绕过能力面。

**Why:**
与 ADR 0004（CLI+Skill+MCP）一致；保证契约单一、缺口可见、可补齐。

**How to apply:**
按 `agents_md_to_skill_to_cli` 的理想链路：读目录 `AGENTS.md` → 加载其指向的 Skill → 由 Skill 调 `edges` CLI；缺口向用户报，勿手搓绕过。
