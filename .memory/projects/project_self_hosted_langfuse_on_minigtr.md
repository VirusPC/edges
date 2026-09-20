---
name: project_self_hosted_langfuse_on_minigtr
description: 改自托管 Langfuse 的 v1 宿主、或默认往阿里云/云 VPS 上放时打开：宿主是物理机 minigtr（Ubuntu 24.04 双系统），已指派 minigtr 设备管理且 Docker/Tailscale 就绪；不是阿里云或其它云 VPS。决策见 docs/adr/0014-self-hosted-langfuse-on-minigtr.md。
metadata:
  edges-title: v1 自托管 Langfuse 落在物理机 minigtr
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:18:30+00:00"
---

v1 自托管 Langfuse 的宿主是物理机 minigtr（Ubuntu 24.04 双系统 Linux），不是阿里云或其他云 VPS。看板卡原先按「自有云」起意，以本 ADR 为准。

**Why:**
2026-09-20 grill 确认（peng cheng）：minigtr 已指派给设备管理（`minigtr设备助手`），Docker 就绪，Tailscale 在线；v1 不需要再开一朵带公网入口的云。再绑 ECS / Langfuse Cloud 会把本卡和已有站点、SaaS 搅在一起。

**How to apply:**
- 部署或讨论 v1 宿主时读 ADR 0014，不要跟着任务正文里的「自有云服务器」走。
- 不要把 Artifacts / teach 已有 ECS 收成 Langfuse v1 主机。
- 不要把 Tailscale 地址、端口或密钥写进 CONTEXT 或本仓 compose。
- 对照 ADR `docs/adr/0014-self-hosted-langfuse-on-minigtr.md`；交叉 ADR 0015 / 0016。
