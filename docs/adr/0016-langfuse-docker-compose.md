# v1 用官方 Langfuse docker compose，不用 Kubernetes

自托管 Langfuse 的官方编排主要是 docker compose（Postgres + Langfuse 栈）与 Kubernetes。v1 落在单台物理机 minigtr（ADR 0014），K8s 会引入集群运维，却不带来 v1 需要的能力。2026-09-20 grill 确认（peng cheng）：v1 用官方 Langfuse docker compose，不用 Kubernetes。

**Status:** accepted（ADR 0016；grill 确认于 2026-09-20）

**See also:** ADR 0014（[v1 宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；ADR 0015（[与 Observation 产品卡的边界](0015-langfuse-infra-vs-observation-product.md)）

## Decision

- **v1 编排：** 官方 Langfuse docker compose，栈内含 Postgres 与 Langfuse 服务。跟官方文档走，不自研编排。
- **不用 Kubernetes。** 单机 v1 不值得开集群控制面；以后若要多机/高可用再另开决策。
- **本仓不落 compose 真源。** 路径、端口、密钥不写进 `CONTEXT.md`，也不在本轮向仓库提交带密钥的 compose。本轮只记决策。

## Considered Options

- Kubernetes（含单节点 k3s / k8s）：否决 v1；运维面大于单机收益。
- 手写非官方 compose / 自研编排：否决；跟官方栈，少一份私有清单。
- 本轮把 compose 与密钥提交进公开仓：否决。

## Out of scope

- 具体 compose 文件、镜像 pin、端口、卷路径、密钥
- 在 minigtr 上实际 `compose up`
- 多机、高可用、从 compose 迁 k8s
- 看板状态变更
