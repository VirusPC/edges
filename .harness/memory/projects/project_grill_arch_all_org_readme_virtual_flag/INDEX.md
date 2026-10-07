---
name: project_grill_arch_all_org_readme_virtual_flag
description: >-
  改 traverse/架构图时：四入口可组织；README 下层只挂 README；虚拟超节点须显式 --super，默认
  scope/AGENTS.md，不因缺 AGENTS 自动合成。
metadata:
  edges-title: 四种入口可组织；README 下层仍 README；虚拟超节点须 --super
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T17:39:57+00:00'
---

节点模型架构图反馈（2026-10-06）已确认，用词以现行为准：

**1.** 四种入口均可因组成登记成为组织节点。

**3.** README 下层内容只挂其它 README；AGENTS 下层只挂 AGENTS。

**4.** 虚拟超节点须显式 **`--super`**：不能因 scope 无 AGENTS 自动合成；默认取当前 scope 的 AGENTS.md；`--super` 表示再上一级的运行时虚拟超节点。

**Why:** 用户确认；flag/术语后改为 super / 虚拟超节点。

**How to apply:** 改 traverse / 架构图 / CLI 时遵守。对外勿写 virtual-root、虚拟根、虚拟系统入口。
