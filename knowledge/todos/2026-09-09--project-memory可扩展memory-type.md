【讨论主题】
为 project-memory skill 设计可自由扩展的 memory type 机制。

【主要结论】
- project-memory 需要支持自由扩展 memory type。
- 已有示例：`docs` type 放置文档；`progress` type 记录任务进展。
- 可选扩展类型还包括：`tasks`、`docs`、`research`、`progress`、`reminder`、`scheduler`（与上述示例并存，不互相取代）。
- 每个扩展 type 都由用户定义自己的 name、description、metadata。

【认知更新】
- memory type 不应写死；应做成可配置/可扩展的类型系统，由用户为每个扩展 type 分别声明 name、description、metadata。

【行动指南】
- 设计扩展方案：每个自定义 type 均可声明 name、description、metadata。
- 用可选类型 `tasks` / `docs` / `research` / `progress` / `reminder` / `scheduler` 作为示例类型验证方案。

【补充说明】
- 来源：记事本对话速记（2026-09-09）。
- 与 `runa-memory-ask` 结果统计需求同属 memory skill 相关待办。

【相关链接】
无
