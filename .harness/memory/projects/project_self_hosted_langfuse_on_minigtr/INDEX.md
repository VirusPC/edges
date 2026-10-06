---
name: project_self_hosted_langfuse_on_minigtr
description: 改自托管 Langfuse 的 v1 宿主、或默认往阿里云/云 VPS 上放时打开：宿主是物理机 minigtr，按多数时候在线的小型服务器运维；双系统仍在但 Windows 不是日常路径。不是阿里云或其它云 VPS。访问面见 ADR 0017。决策见 docs/adr/0014-self-hosted-langfuse-on-minigtr.md。
metadata:
  edges-title: v1 自托管 Langfuse 落在物理机 minigtr
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:26:35+00:00"
---

v1 自托管 Langfuse 的宿主是物理机 minigtr（Ubuntu 24.04 双系统 Linux），按多数时候在线的小型服务器运维，不是阿里云或其他云 VPS。双系统仍在，但 Windows 不是日常路径。看板卡原先按「自有云」起意，以本 ADR 为准。

**Why:**
2026-09-20 grill 确认（peng cheng）：minigtr 已指派给设备管理，Docker / Tailscale 就绪。第三轮补充：人很少日常用 Windows，不要按频繁切系统来设计可用性。

**How to apply:**
- 部署或讨论 v1 宿主时读 ADR 0014，不要跟着任务正文里的「自有云服务器」走。
- 按 Linux 侧多数时候开着来假设实例可用性；不要为双系统热切换做设计。
- 访问仅 Tailscale（ADR 0017）；验收顺序见 ADR 0020。
- 不要把 Tailscale 地址、端口或密钥写进 CONTEXT 或本仓 compose。
- 对照 ADR `docs/adr/0014-self-hosted-langfuse-on-minigtr.md`。
