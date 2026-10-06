---
name: project_recursive_system_two_entry
description: >-
  改节点模型、AGENTS.md、Project Harness 或 layout 时打开：核心是递归系统二；系统入口为 AGENTS.md
  且必须带组成登记；从 scope 系统入口经登记可达才算节点；无 isLeaf；Task/Note/Skill 由登记挂入。曾议 AGENTS 不带
  entries 已否。谁必须有真实 AGENTS 见 grill Q10。
metadata:
  edges-title: 递归系统二：系统入口 AGENTS.md 带组成登记
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:12:59+00:00'
---

节点模型 grill（2026-10-06，进行中）已确认的基础假设：核心是递归系统二。系统入口文件为 `AGENTS.md`，必须带组成登记（`project-harness-local` / descendants 或等价 entries）；从 CLI scope 对应的系统入口出发，经登记可达才算节点。无 `isLeaf` 持久化字段，任意节点都可 `addChildren`。Task / Note / Memory / Skill 也是文档节点，由某系统入口的组成登记挂入，入口合同仍为 `index.md` / `SKILL.md` 等（叶子文件名待 Q12）。曾短暂讨论「AGENTS.md 不带 entries、组成改挂 INDEX/README」——已否决，与基础假设冲突。

**Why:** 用户确认 Q1=B、Q2 修正为系统入口、Q3=A（并取消 isLeaf）、Q7=A、Q8=A。行业上 AGENTS.md 是系统二；Edges 把它做成可递归的系统入口树。

**How to apply:** 改 layout / InternalNode / Project Harness / PROTOCOL 时以系统入口带组成为前提。不要再写「AGENTS.md 永不登记子项」。谁必须拥有真实 `AGENTS.md`（Task Project、类型入口是否算系统入口）见待答 Q10；未答前不要批量剥掉 Task Project 上的系统入口标记。虚拟系统入口见 `project_virtual_system_entry_personal_root`。术语以根 `CONTEXT.md` 为准，本条记 grill 进度与翻案。
