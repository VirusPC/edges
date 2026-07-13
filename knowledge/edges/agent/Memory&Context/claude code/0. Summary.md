# 发 API 前的 5 步预处理 — 总结

每次 `callModel` 之前，`query.ts` 按顺序跑这 5 步：

```
applyToolResultBudget → snipCompact → microcompact → contextCollapse → autocompact
```

---

## 总览

| 步 | 管什么 | 怎么做 | 现状 |
|---|--------|--------|------|
| **1. Tool 输出预算** | 单条/单轮 tool result 太大 | 落盘换预览 | ✅ 默认生效 |
| **2. Snip** | 整段旧对话 | 按 UUID 删掉 | ❌ 默认关闭，仅 `/force-snip` 可用 |
| **3. Microcompact** | 老的 tool result 正文 | 清空 / cache_edits | ⚠️ 多数场景 no-op |
| **4. Context Collapse** | 消息段落 | LLM 写摘要折叠 | ❌ stub，默认关闭 |
| **5. Autocompact** | 整段历史 | LLM 写交接笔记 | ✅ 默认开，~90% 触发 |

---

## 各步要点

### 1. Tool 输出预算
- **三层递进**：工具内截断（Bash 30K 等）→ 单条 50K 落盘 → 单轮 200K 聚合落盘
- 不是每层都触发，谁超限谁处理
- 核心：**落盘 + 预览**，不丢数据

### 2. Snip
- 插入 `snip_boundary`，按 `removedUuids` 删旧消息
- REPL 保留全历史，只裁 model-facing 数组
- 和 `/clear` 不同：同 session、无摘要，只留边界标记
- **现在基本不可用**（`HISTORY_SNIP` 关着，SnipTool 是 stub）

### 3. Microcompact
- 只清**可重跑**的工具输出（Read/Bash/Grep 等）
- 保留最近 5 条，其余换成 `[Old tool result content cleared]`
- 理想路径用 `cache_edits` 删 cache，不打爆 prompt cache
- 需开 `CACHED_MICROCOMPACT`，默认常 no-op

### 4. Context Collapse
- 设计：段落级 LLM 摘要，读时投影，跑在 autocompact 之前
- 意图：比整段摘要更细，比清 tool 输出更狠
- **实现是空壳**，开了反而抑制 autocompact

### 5. Autocompact
- 上下文到 **~179K / 200K（约 90%）** 触发
- 优先 Session Memory 压缩（无 API）；否则 fork LLM 写结构化交接摘要
- 产物：`compact_boundary` + 摘要 + 恢复附件（最近文件、skill、CLAUDE.md 等）
- 最后的主动兜底，让用户不用 `/clear` 也能续写

---

## 递进关系（一张图）

```
工具输出太大？
  → ① 工具内截断 / ② 50K 落盘 / ③ 200K 聚合

整段探索不要了？（关着）
  → ④ Snip 删历史

老 tool 输出可再生？
  → ⑤ Microcompact 清正文

段落要摘要？（关着）
  → ⑥ Context Collapse

还是快满了？
  → ⑦ Autocompact 整段摘要
```

---

## 面试 30 秒版

> 发 API 前有 5 步预处理：tool 输出预算（落盘换预览）、snip（删旧历史，关着）、microcompact（清可重跑的 tool 输出）、context collapse（段落摘要，stub）、autocompact（~90% 触发，LLM 写交接笔记）。真正在用的是 **① 和 ⑤**；中间三层要么关着，要么是 stub 或 no-op。设计思路是递进兜底：先便宜地清 tool 输出，最后才用 LLM 做全量摘要。