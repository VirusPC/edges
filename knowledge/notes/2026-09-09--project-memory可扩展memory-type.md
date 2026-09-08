【讨论主题】
为 project-memory skill 设计可自由扩展的 memory type 机制。

【主要结论】
- project-memory 需要支持自由扩展 memory type。
- 示例：`docs` type 放置文档；`progress` type 记录任务进展。
- 用户应能定义扩展 type 的 name、description、metadata。

【认知更新】
- memory type 不应写死；应做成可配置/可扩展的类型系统，由用户声明元信息。

【行动指南】
- 设计扩展方案：支持自定义 type 的 name、description、metadata。
- 用 docs / progress 作为首批示例类型验证方案。

【补充说明】
- 来源：记事本对话速记（2026-09-09）。
- 与 `runa-memory-ask` 结果统计需求同属 memory skill 相关待办。

【相关链接】
无
