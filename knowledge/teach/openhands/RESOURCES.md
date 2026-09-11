# OpenHands Resources

面向本 mission：搞清 V1 **SDK 代理循环**（Conversation / EventLog / Agent.step / LLM / Tools / Workspace），而不是 Agent Canvas 产品演示。

**仓库边界（先记住）：** [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) 在 `main` 上是 **Agent Canvas**；代理循环 / 事件 / LLM / Workspace / Agent Server 在 [OpenHands/software-agent-sdk](https://github.com/OpenHands/software-agent-sdk)。官方文档：https://docs.openhands.dev 。

## Knowledge（事实 / 组件与数据流）

1. **[SDK Architecture Overview](https://docs.openhands.dev/sdk/arch/overview)**  
   官方总览（亦列于 [llms.txt](https://docs.openhands.dev/llms.txt)）。四个包：`sdk` / `tools` / `workspace` / `agent_server`；local vs sandboxed；Clients → Agent Server → SDK；User→Conversation→Agent→LLM→Tool 基本序列。课前 5 分钟定向用。

2. **[Agent — reasoning-action loop](https://docs.openhands.dev/sdk/arch/agent)**  
   官方架构页；源码路径 `openhands-sdk/openhands/sdk/agent/`。精确描述 `step()`：pending actions → condenser → LLM → parse Action/Message → confirmation → tool execute → ObservationEvents。**Lesson 1 精读主文。**

3. **[Events — typed event framework](https://docs.openhands.dev/sdk/arch/events)**  
   官方架构；源码 `openhands-sdk/openhands/sdk/event/`。Append-only log 即记忆；`MessageEvent` / `ActionEvent` / `ObservationEvent`；LLM-convertible vs internal；`source` ≠ LLM `role`。

4. **[Conversation — orchestration](https://docs.openhands.dev/sdk/arch/conversation)**  
   官方架构；源码 `openhands-sdk/openhands/sdk/conversation/`。Factory → `LocalConversation` vs `RemoteConversation`；`ConversationState` + `EventLog`；持久化 / stuck detection 等服务只观察流。

5. **[Workspace](https://docs.openhands.dev/sdk/arch/workspace)**  
   官方架构。`LocalWorkspace` vs `RemoteWorkspace` / Docker / RemoteAPI；workspace 类型决定 Local vs Remote Conversation；工具在 workspace 环境内执行（不是再经一层 V0 Runtime 客户端）。

6. **[LLM](https://docs.openhands.dev/sdk/arch/llm)** + **[Tool System & MCP](https://docs.openhands.dev/sdk/arch/tool-system)**  
   LiteLLM 提供层；Action→Executor→Observation；registry + MCP bridge。

7. **[Agent Server Package](https://docs.openhands.dev/sdk/arch/agent-server)**  
   Agent Canvas / `RemoteConversation` 使用的 HTTP/WebSocket 边界；何时不要把 SDK 嵌进进程。

8. **仓库一手来源（代码路径）**  
   - [software-agent-sdk README](https://github.com/OpenHands/software-agent-sdk/blob/main/README.md) — 最小 API（`LLM` / `Agent` / `Conversation` / `run()`）。  
   - [OpenHands README](https://github.com/OpenHands/OpenHands/blob/main/README.md) + [docs/architecture.md](https://github.com/OpenHands/OpenHands/blob/main/docs/architecture.md) — Canvas ↔ Agent Server 边界（UI，不是代理核心）。  
   - 仓内 `docs/` 以 Canvas 为导向，不要当成 V1 代理循环教材。

## Wisdom（设计动机 / 为何如此）

9. **[Design Principles](https://docs.openhands.dev/sdk/arch/design)**  
   官方 V1 设计：可选隔离；默认无状态 / 单一状态源；agent↔app 边界；可组合——用来讲「为何 V1 长得不像 V0」。

10. **[The OpenHands Software Agent SDK paper](https://arxiv.org/abs/2511.03690)**（[HTML](https://arxiv.org/html/2511.03690v1)）  
    作者 `@openhands.dev`；SDK README 有链。V0→V1 演进图；九个互锁组件（§4）；事件溯源状态；Local→Remote factory；与其它 agent SDK 对比。

11. **[Docs LLM index](https://docs.openhands.dev/llms.txt)**  
    机器可读目录：SDK 架构 vs Canvas/CLI/Cloud；明确标注 legacy V0 不进主索引。排课用。

12. **Legacy V0 backend（仅历史）** — [Backend Architecture](https://docs.openhands.dev/openhands/usage/architecture/backend)  
    仍挂在文档站；旧词如 `EventStream` / `Runtime` / `ActionExecutionServer` / `CodeActAgent`。读旧博客 / 旧 PR 时对照——**不要当现行默认教材。**

## Gaps

- `software-agent-sdk` 未发现正式 `docs/ADR*` 目录；设计意图以 Design Principles + paper §3 为准。  
- 长期跨会话 memory、Agent Canvas UI、ACP、MCP 深潜留给后续课。
