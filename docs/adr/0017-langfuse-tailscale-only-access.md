# v1 自托管 Langfuse 只走 Tailscale；公网 HTTPS 另议

ADR 0014 把 v1 宿主定在 minigtr，并写过「访问走已有 Tailscale」。2026-09-20 第二轮 grill 确认（peng cheng）：v1 **只**从 Tailscale 访问。公网 HTTPS（反代 + 证书）另开后续，因为用户的设备不会永远开着 Tailscale；本轮不实现。

**Status:** accepted（ADR 0017；grill 确认于 2026-09-20）

**See also:** ADR 0014（[v1 宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；ADR 0018（[密钥不进仓](0018-langfuse-secrets-stay-on-minigtr.md)）

## Decision

- **v1 访问面：仅 Tailscale。** 不在本轮做公网入口、Funnel、或反代证书。
- **没有 Tailscale 时的后果：** 在公网 HTTPS 后续落地之前，访问实际上只剩 minigtr 本机 localhost / 所在局域网。不要把「没开 Tailscale 也能从外面打开」当成 v1 能力。
- **本轮范围：** 只记决策。不部署、不写 Tailscale 地址或 MagicDNS 当给人用的公网网址。

## Considered Options

- v1 就上公网 HTTPS（反代 + 证书）：否决本轮；需要，但设备不总开 Tailscale 是后续动机，不是现在做。
- 把 Tailscale Funnel / 其他公网隧道当 v1：否决；与「仅 Tailscale」同轮冲突。
- 假定人人随时在 tailnet 上：否决；这正是后续 HTTPS 的理由，不能拿来假装 v1 已覆盖。

## Follow-up（未做）

- 公网 HTTPS：反代 + 证书，供未跑 Tailscale 的设备访问。未实现，不要写成已完成。

## Out of scope

- 反代、证书、DNS、公网端口
- Tailscale 地址 / MagicDNS 清单
- 看板状态变更
