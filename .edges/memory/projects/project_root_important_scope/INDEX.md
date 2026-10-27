---
name: project_root_important_scope
description: >-
  改根 AGENTS.md 硬约束时：保留聚光灯、脱敏、git，以及 2026-10-20 从 extensions 并入的三条；通用 skill
  放使用方内容仓并由该仓自定布局，不要改回 shared-extensions，也不要写死 skills/managed。目录细则和说话风格仍不进硬约束。
metadata:
  edges-title: 根硬约束含平铺后并入的三条
  edges-type: project
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-27T07:58:26+00:00'
  edges-origin-session-id: bc-3219fe95-afee-53c8-9317-6d04fc05bc4f
  edges-agent-client: cursor
---

根 `AGENTS.md` 的本层硬约束保留 ask / remember 聚光灯、「硬约束写在本区块」、公开仓脱敏闸门、git 纪律，再加上 2026-10-20 从原 `extensions/AGENTS.md` 并入的三条：不绑定 Edges 的通用 skill 放使用方自己的内容仓（经 `edges compose` 挂载，布局由该仓自定，不再维护 `shared-extensions/`）、顶层命令名跟目录、内容节点走 NodeService。`bin/` / `scripts/` 路径约定和说话风格仍不进硬约束，也不进记忆。

**Why:** 2026-09-06 把根硬约束收成四条，是为了不把 README 目录细则和说话风格写进闸门。2026-10-20 取消 `extensions/` 这一层后，那三条已经没有子目录可放，peng cheng 拍板并入根。它们是会做错事的闸门，不是目录说明。见 ADR 0040。2026-10-27 起，其中「去个人仓 `shared-extensions/`」改为「放使用方自己的内容仓，布局由该仓自定」，不规定 `.edges/skills/managed/` 或仓根 `skills/managed/`。见 ADR 0048。

**How to apply:** 改根硬约束时不要把 README 里的目录细则或说话风格搬回来。不要为了恢复「只留四条」而删掉 2026-10-20 并入的三条。不要把通用 skill 的落点改回 `shared-extensions/`，也不要写成必须落在 `.edges/skills/managed/` 或仓根 `skills/managed/`，不要写死某一份个人仓的名字。skill 用法仍在 ask / remember 正文。
