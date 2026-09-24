---
name: conversation-to-tasks
description: 把对话整理成 Task 草稿（结论 → 事实背景 → Why → How）。只成文，不落库。复盘笔记用 conversation-to-notes；耐久结论用 project-memory-remember。
version: 1.0.0
---

把对话里「谁下一步做什么、怎样算做完」整理成可贴进看板的 Task 草稿。

本 skill **只整理成文，不落库**。写入看板是另一步（例如之后调用 `edges tasks create` / `update`）。这与 `conversation-to-notes` 对称：笔记 skill 也不负责把笔记写进仓库。

正文形状跟看板约定一致：`knowledge/tasks/README.md` 与 `project_task_separate_facts_from_idea`——**结论 → 事实背景 → Why → How**；不写执行流水。

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
- 需要把「为何此刻出现」写进事实背景，避免读者只看到 Why / How、猜不出场景。

## 什么时候不用

- 只要复盘或沉淀记忆 → 用 `conversation-to-notes` / `project-memory-remember`。
- 要把草稿写入 `knowledge/tasks/` → 不在本 skill 里做，交给落库步骤。

## 输入

- 原始对话（或足够完整的摘要）
- 可选：已知相关 PR、笔记路径、已有 Task stem

## 步骤

1. **抽取工作项。** 从对话里列出可行动项；一条对话可以整理出多条、一条，或零条。若实质是笔记或耐久结论，改派对应 skill，不要硬开 Task。
2. **只读去重（可选）。** 用 `edges tasks list` / `edges tasks get <stem>` 查看开放任务。若已有 Task 覆盖同一意图，在输出里建议更新该 stem，不要近义新建。
3. **按约定写正文。** 每条四段齐全；缺的就补，或写明「无」。
   - **结论**（一句话，也可作 `description`）：解决什么问题 + 做成后预期是什么结果。读者不该翻到 Why / How 才看到 punchline。
   - **事实背景：** 只写已发生或仓库里已有的事——含「为何此刻出现、出自哪次对话 / PR / 笔记」。不要把尚待实现的意图写进这里。
   - **Why:** 为什么要做（动机与边界）。不要复述事实背景。
   - **How to apply:** 怎么做、怎样算完：交付物 / 完成标准、关键做法、非目标、关联链接。不写执行流水。
4. **建议归属。** 用 `edges tasks project list` 选已有项目，不要自造 slug（除非先问人）。默认状态 `backlog`。对话未点名负责人则不写 assignee。
5. **只交草稿。** 输出标题、`description` 建议、正文、建议的 project / status；可以说明「若落库大致会是哪条路径」，但 **不要写盘**，也不要调用 `create` / `update` / `status`。

## 正文模板

```markdown
<一句话结论：解决什么问题 + 做成后是什么结果>

**事实背景:**
- 为何此刻出现；出自哪次对话 / PR / 笔记
- 已发生或仓库里已有的约束、现状（可核对）

**Why:**
为何要做（动机与边界；不要复述上面的事实）

**How to apply:**
- 交付物 / 完成标准：…
- 做法要点：…
- 非目标：…
- 关联：…
- 派发前默认先 grill-with-docs（用户当次明确跳过除外）
```

## 约束

- 输出使用中文；写给人审阅，用白话完整句。
- 不添加对话里没有的新需求。
- 事实背景 ≠ Why：前者是可核对的已发生事实与场景，后者是动机与边界。
- 禁止手改 `knowledge/tasks/`；禁止在本 skill 流程里调用写盘命令（`create` / `update` / `status`）。
- `list` / `get` / `project list` 仅用于去重与选项目。
- 不要把复盘四栏或记忆结论塞进 Task，顶替事实背景。
- 不写执行流水（流水只进 sidecar log，不进 Task 正文）。
