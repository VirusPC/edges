---
status: done
origin_todo: null
related_todos:
  - knowledge/todos/2026-09-09--project-memory可扩展memory-type.md
assignee: zcode
created: 2026-09-10
---

# Task：本专题为哪个 task（todo）服务

> 本文是 task-board-lifecycle 专题的任务溯源记录，也是 [Conclusion.md](Conclusion.md) 所定义格式的首个实例（frontmatter 状态 + origin_todo + 执行记录）。

## 服务对象

本专题服务于**「todo→task 任务层」**这件事：把 `knowledge/todos/` 的个人速记清单，升级为 agent 可认领、可排队、可验收的任务层——本专题为这个任务层提供**状态机设计依据**，最终产出即 [Conclusion.md](Conclusion.md) 的双层设计（Issue 7 态 + Run 5 态 + 三条桥接规则）。

**诚实说明：这个需求目前没有对应的 todo 速记。** 它现在只存在于两处间接文字里：

1. `knowledge/todos/README.md`——「不是 `knowledge/notes/` 里的知识原材料，也不是 agent 可认领/排队的任务层」，后半句暗含：应该存在那样一个任务层；
2. `knowledge/todos/2026-09-09--project-memory可扩展memory-type.md`——可选扩展类型里列了 `tasks`，是任务层在 memory 体系里的预期落点。

直接触发是 2026-09-10 会话中用户提问「任务发布看板，一般是有哪几种状态流转」，随后明确指向「针对 todos 里 todo 转 task 的这个事」。

## 服务链条

```
knowledge/todos/ 个人速记（系统外选项池）
        │  todo→task 转化（本专题给设计依据）
        ▼
agent 可认领任务层 ──→ 预期落点之一：project-memory 的 tasks 扩展类型
        │                （related_todos 指向的那条待办）
        ▼
状态机与文件格式 = Conclusion.md 的裁剪版 Multica 双层设计
```

## 交付物

| 文件 | 内容 |
|---|---|
| [任务发布看板状态流转调研.md](任务发布看板状态流转调研.md) | 13 个产品/规范的一手调研，mermaid 状态机图，全景对照表（commit `8d8f728`） |
| [Conclusion.md](Conclusion.md) | todo→task 的最终设计结论（同上 commit） |
| 本文件（Task.md） | 任务溯源 + Conclusion 格式首个实例 |

## 执行记录

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | zcode（调研子 agent） | 09-10 11:14 | 09-10 11:46 | completed | — |
| 2 | zcode（主会话） | 09-10 12:00 | 09-10 12:15 | completed | — |
| 3 | zcode（调研子 agent，Multica/Buzz） | 09-10 14:27 | 09-10 14:38 | completed | — |
| 4 | zcode（主会话，含 Conclusion 与推送） | 09-10 15:00 | 09-10 16:30 | completed | — |

## 遗留事项

- `knowledge/todos/` 建议补一条「todo→task 任务层」速记，把隐含需求显式化（todos 是给人记的，由人补写，agent 不代笔）。
- 任务层落地（转化 skill、`tasks` memory type）尚未开始，本专题只交付设计依据。
