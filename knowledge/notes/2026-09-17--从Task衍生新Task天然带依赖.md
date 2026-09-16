# 从 Task 衍生出新 Task 时，天然带依赖

来源：Coding Agent 专家转述 peng cheng idea（2026-09-17）。  
情境锚点（仅作 case，**不是本条实现范围**）：执行 / grill「整理 `_default` / classifyTasks」时，又拆出探讨项（真 embedding K-means、classify 沉 CLI 等）——这些是从父 Task 长出来的新 Task。

父 Task 指针：`knowledge/tasks/_default/in_progress/2026-09-16--整理default-project的tasks-skill.md`  
相关但勿合并：`knowledge/tasks/_default/backlog/2026-09-15--交互式主题聚类参考K-means.md`（聚类 UX / 算法，不是依赖图本身）

## Idea 核心

子 Task 从父 Task 拆出时，**边已经存在**：派生 / 阻塞 / 前置，而不只是又多一张扁平看板卡。这个 case 对以后做 **Task Graph（任务依赖图）** 有帮助——边的语义至少要能表达「从谁长出来」「谁挡住谁」「谁必须先做」。

## 价值

- 证据：真实拆分现场就会长边，不必等事后大扫除才补依赖。
- 对 Task Graph：提醒「落盘 = 加节点 + 至少一条派生边」可能是默认动作，而不只是可选推荐。
- 对调度：有边才谈得上就绪集、自动推送；没有派生/阻塞语义，队列只能靠人脑。

## 与现有看板的交叉（指针，不并卡）

这些是 Task Graph 上下游，**本 idea 不并入它们的实现正文**：

- `knowledge/tasks/_default/backlog/2026-09-14--落盘时推荐相关task并问依赖.md` — 每次加节点时攒边
- `knowledge/tasks/_default/backlog/2026-09-15--按消息队列自动推送就绪task.md` — 依赖就绪后消费；正文已写「TaskGraph 依赖是前提」
- `knowledge/projects/tasks/README.md` 与 `knowledge/projects/tasks/2026-09-14--nl-task-dependency-extraction-deep-report.md` — Task 模块调研 / NL 依赖抽取

## 边界

- **不要**和 classifyTasks / 主题聚类 / K-means 实现混成一条；那些是父 case 里拆出的探讨项，本条只抽「衍生即带依赖」这个图论洞察。
- 边类型待细聊：`derived-from` / `blocked-by` / `depends-on` 是否同构，还是要分字段。
- 未升格为新 backlog 卡；若要开卡，应挂在 Task Graph 线，而不是挂在「整理 default tasks-skill」实现线下。
