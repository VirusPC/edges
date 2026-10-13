# Mission: OpenHands 架构与核心实现

## Why
搞懂 [OpenHands](https://github.com/OpenHands/OpenHands) 的架构与核心实现，能在读代码/改扩展时对照真实组件边界，而不是只停留在产品演示印象。

## Success looks like
- 能用自己的话画出一次用户请求如何经过 Event / Agent / Runtime / LLM 走完一轮
- 能指出仓库里对应的主要目录或入口文件，并说清各自职责
- 面对「改行为 / 加工具 / 换沙箱」类需求时，知道该先动哪一层、不该搅哪一层

## Constraints
- 教学中文；组件名、类名、路径保留英文
- 以官方文档与仓库源码/文档为准，不凭记忆编造 API
- 以架构与实现为主，不以「会点 UI 发任务」为成功标准
- 优先引用 V1 SDK 文档（`docs.openhands.dev/sdk/arch/*` / software-agent-sdk）；缺材料时再对照 legacy V0 backend 页，且标明历史

## Out of scope
- 完整产品运营、计费、商业对比长文
- 从零写一个对等 agent 框架（可对照，不复刻）
- 穷尽每一个 integration / 第三方插件
