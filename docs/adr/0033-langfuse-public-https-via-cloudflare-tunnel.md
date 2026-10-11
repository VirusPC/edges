# 自托管 Langfuse 经 Cloudflare Tunnel 提供公网 HTTPS

ADR 0017 把 v1 访问面定成仅 Tailscale，公网 HTTPS 留作后续。2026-10-11 核实：实例已在 minigtr 的 Docker 上运行（Langfuse v4.38.0），经 Cloudflare Tunnel 提供公网 HTTPS；`/api/public/health` 返回 OK。设备不会一直开着 Tailscale，这条公网入口就是当时拆出去的后续，现在按已落地记录。本 ADR 取代 ADR 0017。

**Status:** accepted（ADR 0033；核实于 2026-10-11；取代 [ADR 0017](0017-langfuse-tailscale-only-access.md)）

**See also:** ADR 0014（[宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；ADR 0017（[仅 Tailscale，已取代](0017-langfuse-tailscale-only-access.md)）；ADR 0018（[密钥不进仓](0018-langfuse-secrets-stay-on-minigtr.md)）；ADR 0020（[先 UI，再 1–2 个客户端](0020-langfuse-ui-then-few-clients.md)）

## Decision

- **当前访问面：公网 HTTPS，经 Cloudflare Tunnel。** 宿主仍是物理机 minigtr（ADR 0014），不是云 VPS。Tunnel 把公网 HTTPS 转到这台机器上的 Langfuse，不把 minigtr 改成公网 VPS。
- **不在本仓写实例域名、Cloudflare 账号、证书材料或 Tailscale 地址。** 给人用的入口写成「公网 HTTPS 域名（经 Cloudflare Tunnel）」。密钥仍只留 minigtr 磁盘（ADR 0018）。
- **Tailscale 不再是访问前提。** ADR 0017 的「仅 Tailscale；没有 Tailscale 就只剩 localhost / 局域网」到此为止。机器上可以仍装着 Tailscale，但不要把它写成当前唯一入口。
- **本轮范围：** 记录已经落地的访问面。不在本 ADR 里写 Tunnel 配置、ingress 或账号操作步骤。

## Considered Options

- 继续把 ADR 0017 的仅 Tailscale 当成当前访问面：否决。2026-10-11 公网 HTTPS 已经在线，沿用旧决策会让仓库和实例不一致。
- 在仓库里改写成自管反代加证书材料：否决。实际入口是 Cloudflare Tunnel；证书与账号细节不进公开仓库。
- 把 Tailscale Funnel 写成当前入口：否决。不是这次落地的方式。

## Consequences

- 场外设备通过公网 HTTPS 访问，不要求先加入 tailnet。鉴权仍是 Langfuse 自己的密钥，不因为有公网入口就把密钥写进仓库。
- 写访问方式、冒烟脚本或任务卡时指向本 ADR，不要再把 ADR 0017 当作现行决策。
- v1 验收顺序不变，仍是 ADR 0020。定时机外备份仍未做（ADR 0019 的后续）。

## Out of scope

- Tunnel、DNS、证书的操作步骤与账号标识
- 实例域名、Tailscale 地址 / MagicDNS、100.x 地址
- 密钥与 compose
- 定时机外备份
