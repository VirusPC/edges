---
name: project_langfuse_infra_vs_observation_product
description: 改自部署 Langfuse 卡、知识库 Observation 系统、或想把两者并成一条时打开：前者只做实例部署/运维/鉴权/备份；后者是 traces/logs/dashboard 产品语义。v1 验收先 UI 再 1–2 个客户端（ADR 0020）；更广接线留产品卡。决策见 docs/adr/0015-langfuse-infra-vs-observation-product.md。
metadata:
  edges-title: 自部署 Langfuse 与 Observation 产品卡分开
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:26:43+00:00"
---

看板卡「自部署 Langfuse」只覆盖自托管实例的部署、运维、鉴权与备份；不要并进 backlog「知识库 Observation 系统」。Observation 产品可以日后消费这个后端，但不拥有运维范围。v1 验收顺序见 ADR 0020。

**Why:**
2026-09-20 grill 确认（peng cheng）：后端运维与知识库运行时 traces/logs/dashboard 产品语义生命周期不同。第三轮补充：全量 Grok/edges 接线会拖死基础设施卡。

**How to apply:**
- 部署写在自部署 Langfuse 卡与 ADR 0014–0016；访问面 ADR 0017，密钥 ADR 0018，备份 ADR 0019，验收顺序 ADR 0020。
- 检索/读写/代理使用过程的看板语义写在 Observation 产品卡；不要改那张卡的正文来记部署。
- 仓内 `observation/` 是脱敏运营笔记落点，不是后端，也不是产品卡。
- 不要改两张 Task 的状态夹（任务记录员维护）。
- 对照 ADR `docs/adr/0015-langfuse-infra-vs-observation-product.md`。
