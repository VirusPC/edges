# 调研 Agent 能力时优先关注的产品与团队

> 落库日期：2026-10-14（Asia/Shanghai）  
> 用途：做 Agent / Memory / Dreaming 能力调研时的优先跟进清单，不是完整产品评测。  
> 相关长文：[`projects/memory/2026-10-14-Agent-Memory-Dreaming调研.md`](../../projects/memory/2026-10-14-Agent-Memory-Dreaming调研.md)

## 优先关注

| 产品 / 团队 | 为何优先 |
| --- | --- |
| **Cognition / Devin** | Memory Drive + 产品侧 Dreaming；开源的是 Agent Memory Repo **格式**，不是 Dreaming 调度 |
| **OpenAI Codex** | 公开 `codex-rs/memories`（Phase 1/2 ≈ dreaming）；**ChatGPT Dreaming** 是另一条闭源产品能力，勿与 Codex 混谈 |
| **Anthropic Managed Agents / Dreams** | API 级 Dreams job（research preview）；与 Claude Code auto memory 不是同一条公开管线 |
| **Letta** | Sleep-time / Dreaming 有文档 + SDK；MemFS / Context Repositories 可对照 |
| **Mem0** | 库开源；**Dream** 是平台能力（OSS 对照表写明库侧不可用） |
| **Kimi Code** | Coding agent；内置长期记忆仍弱，跟 feature request / 插件生态 |
| **pi（+ 生态）** | 会话持久；长期记忆与 dreaming 多靠扩展（如 pi-memory-dreaming） |
| **dsh** | 本体是否一等公民记忆待核；生态有 auto-memory 类插件 |
| **ZCode** | 会话库有；跨会话长期记忆 / dreaming 多见插件或 MCP |
| **MiniMax Code / mcode** | 有 Proactive Memory、`/memory`；文档未见完整 Dreaming 后台巩固管线 |

## Dreaming：开 vs 闭（一句话）

- **有公开实现可跟代码**：Codex memories Phase 1/2、Letta sleeptime、OpenDream、agentconnect dream-runner 等。
- **产品行为清晰、实现闭源或仅格式开源**：Devin Dreaming、Anthropic Dreams、Mem0 Platform Dream、ChatGPT Dreaming。
- **评价时先拆开**：热路径写入 ≠ Dreaming；库能力 ≠ 托管 Dream；ChatGPT Dreaming ≠ Codex memories。
