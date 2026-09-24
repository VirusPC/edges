---
name: conversation-to-tasks
description: 把对话整理成 Task 草稿（背景、交付标准、非目标、关联）。只成文，不落库。复盘笔记用 conversation-to-notes；耐久结论用 project-memory-remember。
version: 1.0.0
---

把对话里「谁下一步做什么、怎样算做完」整理成可贴进看板的 Task 草稿。

本 skill **只整理成文，不落库**。写入看板是另一步（例如之后调用 `edges tasks create` / `update`）。这与 `conversation-to-notes` 对称：笔记 skill 也不负责把笔记写进仓库。

## 和另外两角怎么分

同一段对话可能拆出三类产物，不要揉成一张：

| Skill | 回答的问题 | 产物 |
| --- | --- | --- |
| `conversation-to-notes` | 这次对话澄清了什么？ | 复盘四栏笔记 |
| `project-memory-remember` | 以后还该记住什么？ | 耐久结论（结论 → Why → How） |
| `conversation-to-tasks`（本 skill） | 谁接下来做什么、怎样算完？ | Task 草稿 |

拿不准时：没有可指派的下一步、也没有完成标准 → 不要硬开 Task，改走 notes 或 remember。

## 什么时候用

- 对话里已经出现可接力的下一步，需要写成看板 Task 的形状。
- 需要把「为何此刻出现」写清楚，避免读者只看到边界与做法、猜不出场景。

## 什么时候不用

- 只要复盘或沉淀记忆 → 用 `conversation-to-notes` / `project-memory-remember`。
- 要把草稿写入 `knowledge/tasks/` → 不在本 skill 里做，交给落库步骤。

## 输入

- 原始对话（或足够完整的摘要）
- 可选：已知相关 PR、笔记路径、已有 Task stem

## 步骤

1. **抽取工作项。** 从对话里列出可行动项；一条对话可以整理出多条、一条，或零条。若实质是笔记或耐久结论，改派对应 skill，不要硬开 Task。
2. **只读去重（可选）。** 用 `edges tasks list` / `edges tasks get <stem>` 查看开放任务。若已有 Task 覆盖同一意图，在输出里建议更新该 stem，不要近义新建。
3. **写正文。** 每条必须包含下面四块；缺一块就补全，或明确写「无」。
   - **【背景/场景】**：为何此刻出现，出自哪次对话、PR 或笔记。后面的 Why / How 不能代替这一块。
   - **交付物 / 完成标准**：交什么，怎样算做完。
   - **非目标**：明确不做的事。
   - **关联**：相关 PR、笔记、兄弟 backlog。
4. **建议归属。** 用 `edges tasks project list` 选已有项目，不要自造 slug（除非先问人）。默认状态 `backlog`。对话未点名负责人则不写 assignee。
5. **只交草稿。** 输出标题、正文、建议的 project / status；可以说明「若落库大致会是哪条路径」，但 **不要写盘**，也不要调用 `create` / `update` / `status`。

## 正文模板

```markdown
<一句话：解决什么 + 怎样算完>

【背景/场景】
- …

交付物 / 完成标准
- …

非目标
- …

关联
- …
```

需要时可以在文末加简短的 **Why**（边界）和 **How to apply**（做法）。它们是补充，不能替换【背景/场景】。

## 约束

- 输出使用中文；写给人审阅，用白话完整句。
- 不添加对话里没有的新需求。
- 禁止手改 `knowledge/tasks/`；禁止在本 skill 流程里调用写盘命令（`create` / `update` / `status`）。
- `list` / `get` / `project list` 仅用于去重与选项目。
- 不要把复盘四栏或记忆结论塞进 Task，顶替【背景/场景】。
