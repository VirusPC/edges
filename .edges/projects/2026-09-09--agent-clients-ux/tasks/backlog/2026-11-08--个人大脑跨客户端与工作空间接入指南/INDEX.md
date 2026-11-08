---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-08T01:42:11.404Z'
  edges-title: 个人大脑跨客户端与工作空间接入指南
  edges-tasks-status: backlog
  edges-task-priority: medium
name: 个人大脑跨客户端与工作空间接入指南
description: 补齐把已有个人大脑接到各 Agent 客户端/工作空间并跨空间复用的 onboarding 指南与核验契约；首期重点 Codex 与 Grok Bot。
---

**背景：**
创建个人大脑已经能走通后，讨论落到：还缺「把已有个人大脑接到不同 Agent 客户端 / 工作空间、并跨空间复用同一份大脑」的指南。用户确认这不是「在某个代码项目里 compose 挂材料」的主故事，而是把大脑本身当作各客户端的工作区来用；并要求补上独立场景「我已经有个人大脑，想在新的客户端或工作空间里继续使用」。批注拍板：指南放在 `edges-onboarding/references` 按组各一份、默认可写、落地顺序 personal → work → coding → chat，首期重点 Codex 与 Grok Bot。本卡只记录任务与设计取舍，不在本卡直接改 onboarding 实现或发包。
- 相关现状：已发布 onboarding 开场仍是五场景 + 两条流程兜底（共七项）；个人大脑建仓流程已有，跨客户端/工作空间接入指南缺失
- 预期收益：新人或换客户端时，能按可观察证据把同一份大脑接到目标工作空间，而不是只凭 Agent 自报「读到了」
- 非目标：本卡不实现 onboarding 功能改动、不改 skill 行为、不发包、不合并；不把 CLI init 与 skill 安装解耦纳入本卡；chat 场景只留坑位，不深入服务端接口
- 关联：ADR [0053 个人大脑以跨客户端复用为主路径](<../../../../../../docs/adr/0053-personal-brain-reused-across-agent-clients.md>)（取舍、已定项、待验证事实与开放问题）；兄弟卡 [完善个人大脑场景的安装与使用说明](<../../../../2026-11-02--edges-readme-优化/tasks/backlog/2026-11-03--完善个人大脑场景的安装与使用说明/INDEX.md>)；记忆索引 [个人大脑跨客户端与工作空间接入](<../../../../../memory/projects/project_personal_brain_client_workspace_access/INDEX.md>)

**目标：**
`edges-onboarding` 能引导用户把已有个人大脑接入目标 Agent 客户端或工作空间，并按统一核验契约跨空间复用同一份大脑；开场菜单可新增「接入已有大脑」场景（提案 6+2=8，现状发布仍 5+2=7）。

**动作：**
- 在 `packages/skills/edges-onboarding/references/` 下按组新增客户端接入指南（具体文件布局未定）
- 开场菜单新增「已有个人大脑 → 接入新客户端/工作空间」独立场景；流程只定位已有大脑并接入，不重建仓
- 建完个人大脑后增加「接入当前客户端」路由步骤：识别宿主 → 打开对应分组指南 → 按契约核验
- 首期优先写清并实测 Codex 与 Grok Bot；Cursor、Claude Code 作对照示例；chat 只留限制与接口坑位
- Compose 进代码项目降为可选旁路，不写进主路径

**完成标准：**
- [ ] references 中各组指南与共享核验契约（契约内容待 grill 定稿）已合入；默认可写，不以「先只读」为产品默认
- [ ] 开场可选「接入已有大脑」；该路径不建仓、不套用「已有项目添加 harness」
- [ ] Codex、Grok Bot 至少各有一份可跟随步骤，并用可观察证据完成最小核验（规则加载、技能发现、读写、跨会话、Git 同步）；未实测能力不得写成已支持
- [ ] 事实边界写进指南：不得把未确认的「Codex Cowork」等同 ChatGPT Work；不得宣称 Grok Bot 仅 clone/切目录就会自动加载 AGENTS.md；写明 Grok Bot 技能目录与仓库 `.agents/skills` 是两套存放
- [ ] 本卡范围内未改无关实现、未发包
