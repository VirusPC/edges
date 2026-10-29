---
name: project_public_knowledge_qa_trial
description: >-
  改根 README 公开实践、页首导航或 GitHub 仓库 homepage 时打开：链接文案是 Edges 小助手，地址
  https://edges-rag.viruspc.tech/；homepage 用
  https://edges.viruspc.tech。公开文案不写「试用」或访问网络限制。
metadata:
  edges-title: 对外入口叫 Edges 小助手，homepage 指向站点根
  edges-type: project
  edges-origin-session-id: bc-3e38df7d-04b8-53aa-b58b-328b1f16654f
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-29T13:58:50+00:00'
---

框架仓对外把 Edges 小助手挂在根 README：页首导航与「公开实践」都链到 https://edges-rag.viruspc.tech/，公开实践旁说明可以拿它问框架仓相关的问题。链接可见文案用「Edges 小助手」。GitHub 仓库 homepage 用 https://edges.viruspc.tech（站点总入口，根路径默认转到教学站），不改成这个地址。2026-10-29 公网 `POST /api/ask` 已返回答案。2026-10-29 用户定稿文案，不再使用「知识问答试用」。

**Why:** 访客从 GitHub 仓库页就能找到小助手，不必先翻到文末。homepage 是整站入口，教学站和任务看板都在这下面；小助手是旁边的查询入口，不代替整站。公开文案只用定稿名字，不写「试用」，也不写访问网络限制。

**How to apply:** 改根 README 公开实践或页首导航时，链接文字写「Edges 小助手」，地址保持 https://edges-rag.viruspc.tech/，旁边的说明用自然中文，语气与周围一致。不要改回「知识问答试用」或「Edges框架知识问答机器人」。不要把 GitHub homepage 改成这个地址，也不要在 README 写入访问网络限制、内网地址或凭据。不改教学静态课页，不改 edges-rag 服务。npm 包版本不因这条链接而升。
