# v1 自托管 Langfuse 落在物理机 minigtr，不上云 VPS

看板卡「自部署 Langfuse」原先按「自有云服务器」起意，容易默认成阿里云 ECS / 其他云 VPS。v1 并不需要 24/7 公网入口：这台机器已指派给 minigtr 设备管理（`minigtr设备助手`），Docker 已就绪，Tailscale 已在线。2026-09-20 grill 确认（peng cheng）：v1 部署目标是物理机 **minigtr**（Ubuntu 24.04 双系统 Linux），不是云 VPS。

**Status:** accepted（ADR 0014；grill 确认于 2026-09-20）

**See also:** ADR 0015（[与 Observation 产品卡的边界](0015-langfuse-infra-vs-observation-product.md)）；ADR 0016（[官方 docker compose，不用 k8s](0016-langfuse-docker-compose.md)）；ADR 0017（[v1 仅 Tailscale](0017-langfuse-tailscale-only-access.md)）；ADR 0018（[密钥留 minigtr](0018-langfuse-secrets-stay-on-minigtr.md)）；ADR 0019（[named volume + 偶发 tar](0019-langfuse-named-volumes-manual-backup.md)）；[`knowledge/notes/2026-09-20--机械师Mini-GTR-Ubuntu双系统安装.md`](../../knowledge/notes/2026-09-20--机械师Mini-GTR-Ubuntu双系统安装.md)（宿主从何而来，不含本决策）

## Decision

- **v1 宿主：** 物理机 minigtr（Ubuntu 24.04 双系统 Linux）。访问面见 ADR 0017（v1 仅 Tailscale），不把公网 VPS 当 v1 前提。
- **不选阿里云 / 其他云 VPS 当 v1 目标：** 机器已有设备管理归属、Docker、Tailscale；再开一朵云只增加账本和公网暴露，不解决 v1 缺的能力。
- **不与已有 ECS 站点假设绑成同一宿主。** Artifacts / teach 等已有云机是另一套部署，本卡不把它们收成 Langfuse v1 主机。
- **本轮范围：** 只落地 glossary + ADR。不部署实例，不把 compose 文件、端口或密钥写入本仓。

## Considered Options

- 阿里云 ECS / 其他云 VPS 当 v1 宿主：否决；v1 不需要公网 VPS，minigtr 已具备运维前提。
- Langfuse Cloud 托管当本卡目标：否决；本卡是自部署实例，不是 SaaS。
- 其他本机（如 Mac mini）当 v1 宿主：否决；卡已指派 minigtr 设备管理。
- 本轮部署或把密钥/compose 写入本仓：否决。

## Consequences

- 访问策略不在本 ADR 展开：v1 仅 Tailscale；公网 HTTPS 是后续（ADR 0017）。在那之前，没有 Tailscale 就只剩 minigtr 的 localhost / 局域网。
- 密钥与备份见 ADR 0018 / 0019，不在本 ADR 规定目录或卷名。

## Out of scope

- 在 minigtr 上实际拉起实例
- 本仓 docker-compose / 密钥 / 端口 / Tailscale 地址
- 与 Artifacts 预览服务或 ECS 站点是否同机的后续运维细节
- 看板状态变更（由任务记录员维护）
