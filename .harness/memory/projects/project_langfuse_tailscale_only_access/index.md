---
name: project_langfuse_tailscale_only_access
description: 改自托管 Langfuse 的 v1 访问面、或有人要立刻做公网 HTTPS/反代时打开：v1 仅 Tailscale；没有 Tailscale 就接受只剩 minigtr localhost/LAN。公网 HTTPS（反代+证书）是后续未做。决策见 docs/adr/0017-langfuse-tailscale-only-access.md。
metadata:
  edges-title: v1 自托管 Langfuse 只走 Tailscale
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:26:35+00:00"
---

v1 自托管 Langfuse 只从 Tailscale 访问。公网 HTTPS（反代 + 证书）是后续，本轮未做。第三轮确认：在那之前，没有 Tailscale 就接受只剩 minigtr 的 localhost / 局域网，不当成必须立刻补的缺陷。

**Why:**
2026-09-20 第二、三轮 grill 确认（peng cheng）：v1 不需要公网入口；用户设备不会永远开 Tailscale，所以 HTTPS 要另开，但这段窗口的可达性缺口被接受。

**How to apply:**
- 不要把 Funnel、反代、证书或公网端口当成 v1 范围。
- 不要把「没开 Tailscale 也能从外面打开」写成 v1 能力，也不要为此提前实现 HTTPS。
- 不要把 Tailscale MagicDNS / 机器名当成给人用的公网网址。
- 对照 ADR `docs/adr/0017-langfuse-tailscale-only-access.md`；宿主见 ADR 0014。
