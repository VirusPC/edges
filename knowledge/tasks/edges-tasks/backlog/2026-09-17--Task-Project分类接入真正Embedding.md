---
name: task_project_classify_real_embedding
description: Task Project 分类接入真正的 Embedding（本地或云端），支撑 Embedding-based NCC
metadata:
  edges-type: task
  edges-title: Task Project 分类接入真正的 Embedding（本地或云端）
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:13.261Z"
  edges-task-project: edges-tasks
---

为 Task Project 分类接入**真正的 Embedding**（本地模型或云端 Embeddings API），才能做可靠的 Embedding-based NCC（最近质心分类）。本卡只跟 **Embedding 通道**；不跟 Memory Type 升格并卡。

**结论 / Why：**
- classify / `project-tasks-classify` 本质是把不定长 task 文本分到**用户已设好的** Task Project 质心（文本分类；质心预设，**不是** K-means 发现簇）。
- 曾在 PR #78 把 skill 改成「Embedding-based NCC」表述，但 skill 跑在强 LLM 下时，**不能靠提示词让 Chat LLM 生成可用的真 embedding**（数字无稳定几何意义）。
- 因此：**撤回 #78 上 NCC 文案改造**；真要 Embedding-based NCC，需后续接入专用 embedding，由本卡跟踪。当前 #78 保留 project CLI + `project-tasks-classify` 改名与元数据；分类可先走 LLM/agent 对已设质心的直接归类 + 人确认 + CLI 迁移。

**调研：**
- 最流行路径：`sentence-transformers`（如 `all-MiniLM-L6-v2`）出定长向量 + numpy cosine，或 `sklearn.neighbors.NearestCentroid`（向量先 L2 normalize）。
- 不定长文本：embedding 模型就是为此设计；注意 token 上限，超长用标题+摘要或分块。
- 依赖：MiniLM 可 CPU；首次需下载模型；PyTorch 环境占盘是大头；之后可离线。云端 Embeddings API：几乎无本地模型盘，需网络与密钥。
- 不优先：裸 transformers、FAISS/Chroma（质心太少）、用 Chat 提示词「输出 384 维向量」。
- 与 K-means 边界：K-means 挪质心/发现簇；NCC 质心给定只做最近类。

**讨论记录：**
- 流行库讨论 → 定 sentence-transformers 为最流行。
- 「输入不定长」→ embedding 变长进定长出。
- 算力/存储/网络/硬件：MiniLM 门槛低。
- 「本质是文本分类？」→ 是；原型/质心式，非先训分类头。
- 「强 LLM 能否 prompt 出 embedding？」→ 否；应直接 LLM 归类，或上真 embedding 通道。
- 决定：撤回 NCC 改造 commit；本卡后续再加本地或云端 embedding。

**How to apply：**
- 实现前先选本地 SBERT vs 云端 API。
- skill/CLI 明确 embedding 提供者；缓存质心向量。
- 建议表仍人确认后 `update --project`。
- **交叉但不合并：**
  - PR #78 / ADR 0010 / skill `project-tasks-classify`（进行中整理 skill）
  - backlog：`交互式主题聚类`（含真 embedding+K-means 探讨；发现簇 ≠ NCC）
  - backlog：`classify 沉到 edges tasks CLI`（有 embedding 后 CLI 才好沉）
  - backlog：`tasks-memory与看板语义合并`（Q18=B）— 勿与本卡并
- 未指派。有 embedding 方案后再 grill-with-docs。

**交叉笔记：** `knowledge/projects/tasks/2026-09-17--task-project-classify-no-fake-embedding.md`
