**一句话**：Snip 解决的是「整段对话历史太长，但我不想等 autocompact、也不想只靠清 tool 输出」——让你**主动剪掉**已经不需要的旧消息，给上下文腾地方。

---

## 现有压缩各管什么

| 手段 | 删什么 | 谁决定 | 问题 |
|------|--------|--------|------|
| **microcompact** | 旧 tool result 的内容 | 系统自动 | 用户/助手消息还在，探索过程仍占 token |
| **autocompact** | 整段历史 → LLM 写摘要 | 快满窗时自动触发 | 要额外 API 调用；摘要可能丢细节；时机偏晚 |
| **tool 落盘** | 单条超大输出 | 系统自动 | 不管「整轮对话」有多啰嗦 |

缺的是：**「这段探索结束了，整段都不要了」** 这种按需、整段删除的能力。Snip 就是补这个口子。

---

## Snip 想干什么

```
REPL 里：完整历史还在（你能往上滚回看）
发给 API：snip_boundary 之前的消息按 UUID 删掉
```

典型场景：

- 花了 20 轮试错误方向，找到正确做法后，旧探索可以整段丢掉
- 某次 Bash/Grep 的探索过程不再需要逐字保留
- 长会话里 SDK 的 `mutableMessages` 只增不减 → snip 后内存也能回收

和 autocompact 的差别：**不是让 LLM 重写摘要，而是直接删**——更快、更可控，由用户或模型决定「删哪段」。

---

## 设计上的三个意图

**1. 模型/用户主导，不是盲压**

消息数 ≥ 30 时会 nudge：「考虑用 `/force-snip` 或 Snip 工具」。  
意思是：哪些该留、哪些该扔，交给知道任务上下文的人，而不是统一规则一刀切。

**2. 双视图：UI 全量，API 裁剪**

`snip_boundary` 记在 transcript 里，UI 仍能看完整对话；只有发给模型的那份变短。  
比「直接从 REPL 删掉」更温和。

**3. 比 autocompact 更早、更便宜**

不必等到 85% 上下文才动刀；觉得某段历史没用了就可以 snip，不用先花 token 做摘要。

---

## 为什么现在关着、你也觉得多余

代码写了一半，产品没闭环：

- `HISTORY_SNIP` 默认关闭
- 只有 `/force-snip` 真能设 boundary
- `SnipTool` 是 stub，模型调了也不删消息
- `snip_marker` 没有创建路径

所以**设计动机合理，但当前对用户几乎没用**——关着是合理的。

---

## 和面试/架构怎么讲

> 上下文管理是三层递进：microcompact 清 tool 输出 → snip 按需删整段历史（用户/模型驱动）→ autocompact 快满时 LLM 摘要。Snip 填补的是「主动、整段、低成本删历史」；microcompact 不够细，autocompact 太晚太贵。现在 feature 关着，因为 SnipTool 没接完，只有内部 `/force-snip` 能测。

如果整个 snip 拿掉，现有 **microcompact + autocompact + tool 落盘** 仍能跑，只是少了一条「中途主动剪枝」的路。