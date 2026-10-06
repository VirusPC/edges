---
name: project_grill_arch_all_org_readme_virtual_flag
description: >-
  改 traverse/架构图时：AGENTS/README/INDEX/SKILL 均可因组成登记成组织节点；README 下层内容只挂
  README；虚拟系统入口须显式 flag，不因缺 AGENTS 自动合成。entryKind 枚举另议。
metadata:
  edges-title: 四种入口可组织；README 下层仍 README；虚拟根须显式 flag
  edges-type: project
  edges-origin-session-id: bc-01a11167-6384-72b0-a940-c268664860c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-06T16:57:48+00:00'
---

节点模型架构图反馈（2026-10-06）已确认：

**1. 四种入口都可成为组织节点：** `AGENTS.md` / `README.md` / `INDEX.md` / `SKILL.md` 只要出现组成登记，当前状态就是组织节点；无登记则为叶子。不因文件名锁定只能是叶子。

**3. 同合同递归下层：** 正如系统入口的下层系统维护信息指向其它 `AGENTS.md`，组织清单的「下层内容」也指向其它 `README.md`（同入口合同）。不要把 README 的 descendants 登记成任意叶子文件名。本层内容仍可挂 INDEX / SKILL / 其它本层入口。

**4. 虚拟系统入口必须显式 flag：** 个人根 / 虚拟根不能因「scope 下没有 AGENTS」就自动合成；须调用方显式打开（CLI/API flag）。未开 flag 时按真实系统入口缺失报错或走既有 scope 发现，不静默虚拟化。

**Why:** 用户审架构图时确认。

**How to apply:** 改 traverse / layout / 架构图与 spec 时遵守。entryKind 枚举仍待商榷（另条）；类图须能表达 AGENTS 入口，不能只有 Task/Memory/Note/Skill 子类。
