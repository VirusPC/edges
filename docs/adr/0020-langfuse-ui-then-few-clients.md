# v1 先证明 Langfuse UI 健康，再试 1–2 个客户端

基础设施卡容易膨胀成「一次接上所有 Agent」。2026-09-20 第三轮 grill 确认（peng cheng）：自部署 Langfuse 的 v1 验收先证明 UI 健康，再试 1–2 个客户端。更广的 Grok / edges Agent 接线仍归「知识库 Observation 系统」产品卡（ADR 0015），不在本卡 v1。

**Status:** accepted（ADR 0020；grill 确认于 2026-09-20）

**See also:** ADR 0015（[基础设施卡 vs Observation 产品卡](0015-langfuse-infra-vs-observation-product.md)）；ADR 0014（[宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；ADR 0017（[v1 仅 Tailscale](0017-langfuse-tailscale-only-access.md)）

## Decision

- **v1 顺序：** 先证明 Langfuse UI 能打开且看起来健康，再试 1–2 个客户端发 trace。不要一上来铺全客户端矩阵。
- **本卡到客户端冒烟为止。** 1–2 个客户端是「后端活着」的证明，不是 Observation 产品接线。
- **更广的 Grok / edges Agent 接线留在 Observation 产品卡。** 知识库运行时 traces / 多 Agent 语义不并进本卡。
- **本轮范围：** 只记决策。不部署、不接线、不改看板。

## Considered Options

- v1 同时接全部 Grok / edges Agent：否决；那是 Observation 产品范围，会拖死基础设施卡。
- 只证明 UI、永远不试客户端：否决；1–2 个客户端属于本卡冒烟，仍不算产品接线。
- 把客户端接线写进 Observation 产品卡正文（本轮）：否决；不改产品卡。

## Out of scope

- 实际部署、打开 UI、选哪 1–2 个客户端
- Observation 产品的 traces / dashboard 语义与全量接线
- 看板状态变更
