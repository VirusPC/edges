---
name: project_personal_brain_client_workspace_access
description: >-
  个人大脑以工作空间复用为主路径：references 分组指南、接入已有大脑场景、默认可写与可观察核验；首期重点 Codex/Grok
  Bot；未证实能力不得宣称已支持。
metadata:
  edges-title: 个人大脑跨客户端与工作空间接入
  edges-type: project
  edges-origin-session-id: sand-subagent-d9cb7c5c-5e95-1267-09c4-27242a91b53a
  edges-agent-client: grok-bot
  edges-username: Grok Bot
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: '2026-11-08T01:27:13+08:00'
---

个人大脑建好后，主路径是把同一份大脑接到不同 Agent 客户端 / 工作空间当工作区用，而不是先 compose 进某个代码项目；缺的是分组指南、独立「接入已有大脑」场景，以及可观察核验。

**Why:**
- 2026-11-08 对话：创建个人大脑已可用，但「把个人大脑接入不同 Agent 客户端作为 workspace」仍无指南。
- 用户澄清：主线是在不同工作空间复用同一份大脑（Grok Bot、work 类工作空间、coding 客户端等）；compose 进项目是可选旁路。
- 批注拍板：指南放 `edges-onboarding/references` 每组一份；默认可写；首期重点 Codex 与 Grok Bot；新增「已有个人大脑，接入新客户端/工作空间」场景。
- 若只写「clone 一下」或只信 Agent 自报，会把未验证能力写成已支持，并混淆 Grok Bot 技能目录与仓库 skills。

**How to apply:**
- 实现时只路由：识别宿主 → 打开 `references` 对应分组指南 → 按共享契约核验；不要在 SKILL 正文塞完整客户端步骤。
- 提案文件布局（实现时再落盘，本条只定方向）：
  - `packages/skills/edges-onboarding/references/client-access/contract.md`（七层可观察核验）
  - `personal.md` / `work-space.md` / `coding.md` / `chat.md`
- 开场菜单提案：六场景 + 两条流程兜底 = 八项；**现状发布仍是五场景 + 两条兜底 = 七项**，未合入前不要当已上线。
- 独立场景「接入已有大脑」：定位本地目录或远端仓（需要时 clone）→ 识别客户端与工作空间 → 按组指南接入 → 核验；**不** init 新仓、**不** GitHub 建仓、**不**套用「已有项目加 harness」。
- 产品优先级（不对用户展示类别菜单）：personal → work → coding → chat（chat 只留接口坑位）。
- 默认可写；核验必须有人能看见的证据（工作空间根路径、引用 AGENTS 约定、技能列表/唤起记录、读写文件、跨会话读回、Git 同步）。Agent 只说「我加载了」不算通过。
- 事实边界（未证实不得写成已支持）：
  - 用户所称「Codex Cowork」产品形态未确认，不可等同 ChatGPT Work；官方 ChatGPT Work 资料仅作参考单列。
  - 尚无证据证明 Grok Bot 仅 clone / 切目录就会自动加载大脑 `AGENTS.md`；显式读取是待验证候选。
  - Grok Bot 技能在 workflows（环境管理），与大脑仓库 `.agents/skills` 是两套存放；clone 完成 ≠ 技能已装上或版本一致。
- 首期重点实测：Codex、Grok Bot；Cursor、Claude Code 作对照示例。
- 关联任务：[个人大脑跨客户端与工作空间接入指南](<../../../projects/2026-09-09--agent-clients-ux/tasks/backlog/2026-11-08--个人大脑跨客户端与工作空间接入指南/INDEX.md>)
- 兄弟卡：[完善个人大脑场景的安装与使用说明](<../../../projects/2026-11-02--edges-readme-优化/tasks/backlog/2026-11-03--完善个人大脑场景的安装与使用说明/INDEX.md>)（安装/日常说明，不替代本接入指南）
- 本条是设计取舍摘要，不是实现完成声明；HTML 审阅稿仅作对话过程材料，不要把 packed runtime 大段入库。
