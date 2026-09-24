---
name: project_review_shell_chrome_2026_09_24
description: 改审阅壳外观或信息密度时打开：顶栏左侧是 Edges；项目悬停出 description；卡片以标题为主；空状态列不占宽；右栏是 Markdown 抽屉。不改 ADR 0022 交互。
metadata:
  edges-title: 审阅壳外观 2026-09-24 收口
  edges-type: project
  edges-origin-session-id: bc-b815a65b-3fba-50c2-a670-35e2a2012052
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-24T01:39:39+00:00"
---

2026-09-24 peng cheng 收口的审阅壳外观：最上面一条 navbar，左端是系统名 Edges；左栏项目悬停才展示该项目的 description；卡片以人读标题为主，文件名和时间降级；空状态列不占宽度；右栏是分开的 Markdown 抽屉。

**Why:**
他看过预览后认为第一版像未完成的调试页。随后几次收口只改外观和信息密度，不改 ADR 0022 的交互：左栏筛选加只拖项目、中栏状态只读、右栏读 `doc.body`、hash 导航、不写回看板。

**How to apply:**
改审阅壳时守住这些外观。没有 description 的行（例如「全部」）不要编一句。侧栏选中态仍是 design A，那条在仓库根记忆里，不要重开。竖线只拖宽度、筛选靠右，分别见本层对应 feedback。产物仍不入库。用户所述，已在 2026-09-24 的壳上验证。
