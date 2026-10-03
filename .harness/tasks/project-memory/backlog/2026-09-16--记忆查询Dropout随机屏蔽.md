---
name: memory_query_dropout_random_mask
description: 查询/使用记忆时随机屏蔽一部分（类 Dropout），减轻过去记忆拉偏
metadata:
  edges-type: task
  edges-title: 记忆查询 Dropout：随机屏蔽一部分记忆
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:13.200Z"
  edges-task-project: project-memory
---

Agent 查询或使用记忆时，借鉴 Dropout：每次**随机屏蔽一部分**记忆条目（或片段），再交给模型；目标是减轻「当前会话被过去记忆拉偏太大」的风险，看回答是否更稳、更少刻板复读旧结论。

**Why:**
peng cheng 担心记忆越积越多时，检索结果会过度锚定历史偏好与旧决策，新问题仍被旧上下文带跑。Dropout 在训练里用随机失活提高泛化；类比到 inference 时的记忆注入，随机丢一部分可能降低单次偏差、暴露「缺了哪条记忆会怎样」。这是假设，需要实验验证，不是已定方案。

**How to apply:**
- 先细聊作用点：只在 `project-memory-ask` / recall 结果上 drop，还是写入前也 drop；按条、按 type、还是按相似度层 drop。
- 定随机策略：drop rate、是否可复现种子、是否保留「必留」关键条目（如当前任务 ADR）。
- 和 Observation / Evaluation 交叉：要能对比「全量记忆 vs dropout」的回答差异，否则只剩体感。
- **非目标：** 不替代记忆清理/过期策略；不默认打开当生产必开项，先可开关实验。
- 交叉：`知识库 Observation 系统`、`知识库 Evaluation 系统`、`找公开 benchmark 证明 memory 有效性`。
- 未指派。派发时默认先 grill-with-docs。
