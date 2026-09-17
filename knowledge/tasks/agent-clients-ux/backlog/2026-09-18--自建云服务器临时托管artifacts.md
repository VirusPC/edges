---
name: self_hosted_temp_artifact_hosting
description: 假设有自部署云服务器，用临时目录托管 HTML artifacts，替代/补强 Ask user questions 的 review 与选择
metadata:
  edges-type: task
  edges-title: 自建云服务器临时托管 artifacts
  edges-tasks-status: backlog
  edges-task-project: agent-clients-ux
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-18T03:28:00+08:00"
---

用网页 artifacts（例如 Tasks Classify 那种）做 review / 选择判断时，预览是否正常高度依赖客户端：Grok Bot 手机端往往不能预览；桌面端能开 HTML，但交互常有兼容问题（目测不是完整 Chrome 内核）。在此基础上补充假设——用户有一台自部署云服务器——并考虑在服务器上开临时目录，专门托管各类 artifacts，用真实浏览器打开链接完成 review。

**Why:**
聊天内嵌预览不可靠时，把「可交互页面」放到用户自己的服务器上，手机/桌面都能用系统浏览器打开，交互能力不绑死在某一种 Agent 客户端。临时托管也适合短生命周期的 review 页（选完/过期可删），不必和长期博客/站点混在一起。

**How to apply:**
- 细聊：临时目录生命周期（创建、TTL、清理）、鉴权（仅自己可开 vs 短链公开）、上传入口（CLI / skill / agent 写文件）、与聊天里「给链接」的协作方式。
- 对照勿并卡：`agent-clients-ux`「数据与视图分离 + 本地 HTML」（本地/仓内视图，不是云临时托管）；`edges-tasks`「Task 复杂可视化」「交互式主题聚类」「classify」等（业务能力可产出 artifacts，托管是基础设施）。
- 与 `site-and-content` 建站/Astro 区分：那是长期内容站；本卡是短生命周期 review 托管。
- 派发时默认先 grill-with-docs；未指派。
