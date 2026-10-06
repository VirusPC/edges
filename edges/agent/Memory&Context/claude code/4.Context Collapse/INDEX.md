**Context Collapse** 设计上是介于 microcompact 和 autocompact 之间的**段落级折叠**：用后台 LLM 把一段旧消息压成摘要，保留决策/路径/错误等关键信息，而不是只清 tool 输出，也不是整段对话一次性摘要。

## 设计意图

```
对话变长 → 接近上下文上限
    ↓
applyCollapsesIfNeeded()  ← query.ts:624
    ↓
后台 LLM 压缩一段旧消息 → 生成摘要
    ↓
projectView() 投影：发给 API 的是折叠后的视图
    ↓
REPL 里仍保留完整历史（读时投影，不是真删）
```

和前后步骤的分工：

| 层级 | 压什么 | 方式 |
|------|--------|------|
| microcompact | 老的 tool result 正文 | 清空 / cache_edits |
| **context collapse** | **一段消息（多轮对话块）** | **LLM 写摘要替换** |
| autocompact | 整段历史 | LLM 写交接笔记，插 compact_boundary |

query.ts 里的注释也说明了顺序意图：

> 在 autocompact **之前**跑；如果 collapse 已经把上下文压下去了，autocompact 就不触发，**保留更细粒度的上下文**，而不是直接整段摘要。

## 关键机制（设计）

1. **读时投影**：摘要存在 collapse store，不在 REPL 消息数组里；每次发 API 前 `projectView()` 重放 commit log
2. **分阶段提交**：上下文到 ~90% 开始 commit 折叠，~95% 阻塞新 spawn
3. **413 恢复**：API 报 prompt too long 时，先 `recoverFromOverflow()` 把已 stage 的折叠全部提交，再考虑 reactive compact
4. **抑制 autocompact**：collapse 真正启用时，autocompact 会被关掉，避免两者抢上下文管理权

## 配套工具

- **CtxInspectTool**：让模型查看 token 用量、消息数（已实现）
- **collapseReadSearch.ts**：折叠后 Read/Grep 等「静默吸收」逻辑（已实现）
- 和 **HISTORY_SNIP** 是兄弟 feature，但 snip 是手动删，collapse 是自动摘要

## 现状：基本是空壳

核心实现全是 stub：

```52:56:src/services/contextCollapse/index.ts
export const applyCollapsesIfNeeded: (...) => Promise<CollapseResult> =
  async (messages: Message[]) => ({ messages })  // 原样返回，啥也不干
```

`projectView` 也是恒等函数。所以默认 **关了**：

```63:63:scripts/defines.ts
  // 'CONTEXT_COLLAPSE', // 已禁用：实现是空壳 stub，启用后会抑制 auto compact 导致上下文管理完全失效
```

开了 flag 却跑 stub → autocompact 被抑制、collapse 又不干活 → 上下文管理失效。

## 面试一句话

> Context Collapse 是段落级 LLM 摘要折叠：把旧消息块压成摘要，通过读时投影发给 API，REPL 保留全量历史；跑在 autocompact 之前，能替代整段摘要以保留粒度，也是 413 的第一道恢复。但当前实现是 stub，默认关闭，实际生效的是 microcompact + autocompact。