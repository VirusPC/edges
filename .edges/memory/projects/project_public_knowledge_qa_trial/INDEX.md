---
name: project_public_knowledge_qa_trial
description: >-
  改根 README 公开实践、页首导航或 GitHub 仓库 homepage 时打开：知识问答试用是
  https://edges-rag.viruspc.tech/；homepage 用
  https://edges.viruspc.tech。公开文案不写访问网络限制。
metadata:
  edges-title: 对外知识问答试用挂在 README，homepage 指向站点根
  edges-type: project
  edges-origin-session-id: bc-3e38df7d-04b8-53aa-b58b-328b1f16654f
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-29T13:53:43+00:00'
---

框架仓对外把知识问答试用挂在根 README：页首导航与「公开实践」都链到 https://edges-rag.viruspc.tech/，说明可以查询框架仓相关问题。GitHub 仓库 homepage 用 https://edges.viruspc.tech（站点总入口，根路径默认转到教学站），不改成问答地址。2026-10-29 公网 `POST /api/ask` 已返回答案。

**Why:** 访客从 GitHub 仓库页就能找到问答，不必先翻到文末。homepage 是整站入口，教学站和任务看板都在这下面；问答是旁边的试用，不代替整站。公开文案只提供可打开的地址，不写访问网络限制。

**How to apply:** 改根 README 公开实践或页首导航时保留该链接，语气与周围中文一致。不要把 GitHub homepage 改成问答地址，也不要在 README 写入访问网络限制、内网地址或凭据。不改教学静态课页，不改 edges-rag 服务。npm 包版本不因这条链接而升。
