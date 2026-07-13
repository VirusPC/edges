**autocompact** 是上下文管理的**最后一道主动防线**：快满窗时，把整段旧对话压成一份 LLM 写的「交接笔记」，让会话能继续，不用 `/clear`。

## 干什么

每次 `callModel` 之前检查 token 用量；超阈值就触发压缩，然后用压缩后的消息继续**同一轮**请求：

```
旧历史（可能几十万 token）
    ↓
LLM 写结构化摘要（第一人称交接笔记）
    ↓
compact_boundary + 摘要 + 恢复附件
    ↓
用这套新上下文继续调 API
```

和前面几层的区别：

| 层级 | 压什么 | 要不要 LLM |
|------|--------|-----------|
| microcompact | 老的 tool result 正文 | 否 |
| context collapse | 消息段落摘要（stub） | 是 |
| **autocompact** | **整段历史 → 交接摘要** | **是** |

## 什么时候触发

- 默认**开着**（`settings.json` 的 `autoCompactEnabled`，可用 `DISABLE_AUTO_COMPACT=1` 关）
- 阈值 ≈ 有效上下文窗口 − buffer（200K 窗口默认 buffer ~13K）
- 估算 token 超阈值 → 触发
- 连续失败 **3 次**后熔断，本会话不再重试

## 压缩走哪条路

`autoCompactIfNeeded` 按优先级尝试：

**1. Session Memory 压缩（优先，不调摘要模型）**

- 用已提取的 Session Memory 当摘要
- 保留最近一段消息（至少 5 条含文本的消息，约 10K–40K token）
- 更快、更便宜

**2. 传统 API 摘要（兜底）**

- fork 一次 LLM 调用，用 `BASE_COMPACT_PROMPT` 写摘要
- 要求覆盖：用户意图、技术决策、文件/代码、错误修复、待办、当前进度、下一步
- **整段历史全部摘要**，不保留原始消息（和 SM 路径不同）

## 压缩后留下什么

`buildPostCompactMessages` 组装的新上下文：

```
1. compact_boundary     ← 边界标记（auto / manual）
2. summaryMessages      ← LLM 写的交接摘要
3. messagesToKeep       ← SM 路径会保留最近几轮；传统路径通常为空
4. attachments          ← 压缩后恢复的关键上下文
5. hookResults          ← SessionStart hook 注入
```

**attachments** 会补回模型继续干活需要的东西：

- 最近读过的文件（最多 5 个，各 ~5K token）
- 用过的 skill 指令
- CLAUDE.md / plan mode
- MCP、Agent 列表等 delta

原始 JSONL transcript 还在磁盘，只是**发给 API 的上下文被替换**。

## 和 `/compact` 的关系

同一套 `compactConversation` 引擎：

- **autocompact**：自动触发，静默执行，不追问用户
- **`/compact`**：手动触发，可带自定义指令（如「只总结认证模块」）

## 413 时的兜底

主动 autocompact 没压住时，API 返回 prompt too long：

1. 先试 context collapse 的 `recoverFromOverflow`（stub，基本 no-op）
2. 再走 **reactive compact**（更激进的压缩）

## 面试一句话

> autocompact 是快满窗时的自动全量压缩：优先用 Session Memory 无 API 摘要并保留最近几轮，否则 fork LLM 写结构化交接笔记，插入 compact_boundary 后替换上下文继续工作；前面 microcompact 清 tool 输出，autocompact 是最后的「整段摘要」兜底，让用户不用手动 `/clear` 就能长会话续写。

> 默认 200K 模型、8K output cap 下，上下文用到大约 179K token（~90%） 就会触发 autocompact；1M 模型大约 942K（~94%）。判断依据是上一轮 API usage + 本轮新增消息，不是单纯数 message 条数。