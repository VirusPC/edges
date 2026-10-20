# v1 自托管 Langfuse 只走 Tailscale；公网 HTTPS 另议

ADR 0014 把 v1 宿主定在 minigtr，并写过「访问走已有 Tailscale」。2026-09-20 第二轮 grill 确认（peng cheng）：v1 **只**从 Tailscale 访问。公网 HTTPS（反代 + 证书）另开后续，因为用户的设备不会永远开着 Tailscale；本轮不实现。

**Status:** superseded by [ADR 0033](0033-langfuse-public-https-via-cloudflare-tunnel.md)（2026-10-11）。下文是 2026-09-20 的原决策，不再作为现行访问面。

**See also:** ADR 0014（[v1 宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；ADR 0018（[密钥不进仓](0018-langfuse-secrets-stay-on-minigtr.md)）

## Decision

- **v1 访问面：仅 Tailscale。** 不在本轮做公网入口、Funnel、或反代证书。
- **接受无 Tailscale 时的缺口。** 2026-09-20 第三轮确认：公网 HTTPS 落地之前，没有 Tailscale 就只剩 minigtr 本机 localhost / 所在局域网。这是接受的可达性，不是缺陷清单上的「必须立刻补」。不要把「没开 Tailscale 也能从外面打开」当成 v1 能力。
- **本轮范围：** 只记决策。不部署、不写 Tailscale 地址或 MagicDNS 当给人用的公网网址。

## Considered Options

- v1 就上公网 HTTPS（反代 + 证书）：否决本轮；需要，但设备不总开 Tailscale 是后续动机，不是现在做。
- 把 Tailscale Funnel / 其他公网隧道当 v1：否决；与「仅 Tailscale」同轮冲突。
- 假定人人随时在 tailnet 上：否决；这正是后续 HTTPS 的理由，不能拿来假装 v1 已覆盖。

## Consequences

- 下面两条是 2026-09-20 当时的后果。现行访问面与后果见 ADR 0033，不要把这两条当成现在仍要遵守的缺口。
- 在公网 HTTPS 落地之前：场外设备要么在 tailnet 上，要么打不开。localhost / 局域网只覆盖人在 minigtr 旁边或同一 LAN 的情况。
- 当时不为此提前做 Funnel 或自管反代。该后续已由 ADR 0033 以 Cloudflare Tunnel 落地。

## Follow-up（已由 ADR 0033 落地）

- 公网 HTTPS 已接通。方式是 Cloudflare Tunnel，不是本 ADR 起草时设想的、写进仓库的自管反代与证书。现行访问面见 ADR 0033。不要再把本段当成「未实现」。

## Out of scope

- 反代、证书、DNS、公网端口
- Tailscale 地址 / MagicDNS 清单
- 看板状态变更
