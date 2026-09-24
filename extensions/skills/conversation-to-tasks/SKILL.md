---
name: conversation-to-tasks
description: 从对话抽出「谁下一步做什么、怎样算做完」的 Task 草稿（含【背景/场景】、交付物/完成标准、非目标、链接）。只整理成文，不落库。需要复盘四栏笔记时改用 conversation-to-notes；需要耐久结论（一句结论→Why→How）时改用 project-memory-remember。
version: 1.0.0
---

# conversation-to-tasks

从对话抽出可执行工作项：谁下一步做什么、怎样算做完。本 skill **只整理成文，不在这里落库**；落库是另一步。

与另两角分工（勿合并）：

| Skill | 产出 |
| --- | --- |
| `conversation-to-notes` | 复盘四栏笔记（【背景】【过程】【所学】【行动指南】） |
| `project-memory-remember` | 耐久结论（一句结论 → **Why:** → **How to apply:**） |
| `conversation-to-tasks`（本 skill） | Task 草稿：场景 + 交付/完成标准 + 非目标 |

## 什么时候用

- 对话里出现了要跟人/Agent 接力的下一步，需要写成看板 Task 形状。
- 不要用它写复盘笔记或沉淀记忆；那些走上面两角。
- 不要手写 `knowledge/tasks/`，也不要在本 skill 里调 `edges tasks create`。

## 步骤

1. **抽取。** 从对话抽出可行动项；一条对话可产生多条或零条。若实质是笔记或耐久结论，改派 `conversation-to-notes` / `project-memory-remember`，不要硬开 Task。
2. **去重（只读）。** 可选：用 `edges tasks list`（或 `get <stem>`）扫已有看板；若已有开放 Task 覆盖同一意图，在输出里建议 `update` 该 stem，不要再造近义新建。
3. **正文形状。** 每条必须有：【背景/场景】（为何此刻出现、出自哪次对话/PR/笔记）、交付物 / 完成标准、非目标、链接（PR、笔记、兄弟 backlog）。`**Why:**` / `**How to apply:**` 可保留，只作边界与做法，**不能代替场景**。
4. **归属建议。** 用 `edges tasks project list` 选已有 Task Project（不要自造 slug，除非先问人）；默认 `backlog`；未点名负责人则不写 assignee。
5. **只输出草稿。** 交 title、description、建议的 project/status、以及正文；等人或后续落库步骤入库。报告建议路径即可，不写盘。

## 正文模板（短）

```markdown
<一句话：解决什么 + 怎样算完>

【背景/场景】
- …

交付物 / 完成标准
- …

非目标
- …

链接
- …

**Why:**（可选，边界）
…

**How to apply:**（可选，做法）
…
```

## 禁止

- 不要 `mkdir` / 手改 `knowledge/tasks/`。
- 不要在本 skill 流程里调用 `edges tasks create|update|status` 写盘（list/get/project list 只读去重与选 project 可以）。
- 不要把复盘四栏或记忆结论塞进 Task 顶替【背景/场景】。
