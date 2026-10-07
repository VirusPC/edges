---
name: project_grill_system_entry_q13_q14
description: >-
  改树遍历或入口迁移时：同目录系统一孩子只在 README entries，AGENTS 只挂系统二材料与下级系统入口；index.md→INDEX.md
  用可预览脚本套 CLI traverse，含 posts（本轮改名授权）。原则见 models/README 设计原则节。
metadata:
  edges-title: grill：README/AGENTS 组成分工与 INDEX 迁移脚本
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:28:37+00:00'
---

节点模型 grill（2026-10-06）续：

**Q13=A：** 同目录既有系统入口 `AGENTS.md` 又有组织清单 `README.md` 时，系统一的孩子只写在 README 的 entries；`AGENTS.md` 的组成登记只挂系统二材料（如 `.harness/memory`、skills、维护看板）与下级系统入口。这是树遍历的核心规则之一：组成边与维护边分开，读系统二材料不自动跨入下一层系统入口（既有约定），系统一遍历走 README entries。

**Q14=B：** 存量 `index.md` 全部迁为 `INDEX.md`，**含 `posts/`**（用户对本轮迁移明确授权）。实现方式：可预览、可重跑的脚本，套用 CLI 里已有树遍历（operations/traverse），不要手改、不要另写扫盘逻辑。简单迁移，不另开复杂工程。

**Why:** 用户确认；Q13 影响遍历；Q14 用户称「写个脚本的事」。

**How to apply:** 改 traverse / layout / 根 README·AGENTS 双文件时遵守 Q13 分工。迁移脚本必须 dry-run、冲突检查、幂等；posts 仅在本轮 INDEX 改名迁移中按用户授权处理，不扩大为可随意改博客正文。原则摘要写入 `extensions/cli/src/domain/models/README.md`。
