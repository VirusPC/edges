
**microcompact** 是最轻的一层上下文压缩：**只清旧的、可再生的 tool result 内容**，不删整轮对话，也不做 LLM 摘要。

## 干什么

把历史里**老的工具输出**清掉，换成占位符：

```text
[Old tool result content cleared]
```

用户消息、助手回复、`tool_use` 调用记录都还在，只是对应 `tool_result` 的正文被清空。

## 清哪些工具

只处理「能重跑拿回来」的工具：

- Read、Bash/Shell、Grep、Glob、WebSearch、WebFetch、Edit、Write

Agent 输出、MCP、Task 等**不在名单里**。

## 两种触发方式

**1. 时间触发（time-based）**

- 距上次助手回复超过约 60 分钟（prompt cache 基本过期）
- 除最近 5 条外，其余 compactable tool result 直接改成本地占位符
- 默认 **关闭**（`enabled: false`）

**2. 缓存编辑（cached MC，主路径）**

- 需要 `FEATURE_CACHED_MICROCOMPACT=1` + `CLAUDE_CACHED_MICROCOMPACT=1` + Claude 4.x
- compactable 工具结果 **> 10 条** 时，通过 API 的 `cache_edits` 删掉最老的，**保留最近 5 条**
- **不改本地消息**，在 API 层删 cache 里的 tool result，尽量保住 prompt cache prefix

## 留下什么

| 保留 | 清掉 |
|------|------|
| 用户/助手文字 | 老的 Read/Bash/Grep 等输出正文 |
| 最近 5 条 tool result | |
| 所有 `tool_use` 记录 | |
| 非 compactable 工具结果 | |

模型仍知道「之前调过哪些工具」，只是老输出内容没了；需要时可以重跑。

## 和前后步骤的关系

```
tool 落盘(50K/200K) → snip(关着) → microcompact → autocompact
```

- **tool 落盘**：单条太大 → 落盘换预览
- **microcompact**：老的、可重跑的工具输出 → 清内容腾 token
- **autocompact**：快满窗 → LLM 写整段摘要

## 实际会不会跑

多数默认构建下 microcompact **常常是 no-op**（直接返回原 messages）：

- cached MC 要开 feature + 环境变量 + Claude 4.x
- time-based 默认关

但代码一直在 query 管道里，内部/特定配置下会生效。

## 面试一句话

> microcompact 是最轻的上下文压缩：只清可再生的旧 tool result（Read/Bash/Grep 等），保留最近 N 条和全部对话结构；优先用 cache_edits 删 cache 里的老输出而不打爆 prompt cache，本质是「这些结果能重跑，先扔掉正文腾地方」。