---
name: project_langfuse_docker_compose
description: 选自托管 Langfuse 的 v1 编排、或有人提出上 Kubernetes 时打开：用官方 docker compose（Postgres + Langfuse 栈），不用 k8s；本仓不提交带密钥的 compose。决策见 docs/adr/0016-langfuse-docker-compose.md。
metadata:
  edges-title: v1 Langfuse 用官方 docker compose
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:18:29+00:00"
---

v1 自托管 Langfuse 用官方 docker compose（Postgres + Langfuse 栈），不用 Kubernetes。本轮不把 compose 路径、端口或密钥写入 CONTEXT 或本仓。

**Why:**
2026-09-20 grill 确认（peng cheng）：v1 落在单台物理机 minigtr，K8s 引入集群运维却不带来 v1 需要的能力。跟官方栈，少一份私有编排清单。

**How to apply:**
- 拉起实例跟官方 Langfuse compose 文档，不要先上 k8s / k3s。
- 多机或高可用另开决策，不要默默把 v1 改成集群。
- 不要把 compose 文件和密钥提交进公开仓；CONTEXT 只留术语。
- 对照 ADR `docs/adr/0016-langfuse-docker-compose.md`；宿主见 ADR 0014。
