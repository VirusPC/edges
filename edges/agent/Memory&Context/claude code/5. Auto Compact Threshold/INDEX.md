**autocompact** 的触发判断在 `shouldAutoCompact()` 里，用的是：

```text
tokenCountWithEstimation(messages) - snipTokensFreed  >=  getAutoCompactThreshold(model)
```

`tokenCountWithEstimation` 取的是**上一轮 API 返回的 usage 总量**（含 input、cache、output），再加上之后新消息的粗估——基本就是「当前上下文有多大」。

## 阈值怎么算

```text
有效窗口 = 模型上下文窗口 − min(模型 max_output, 20K)   // 给摘要预留输出位
触发阈值 = 有效窗口 − buffer
```

`buffer` 随窗口变大：

| 有效窗口 | buffer |
|---------|--------|
| < 400K | 13,000 |
| 400K–800K | 30,000 |
| ≥ 800K | 50,000 |

## 常见模型（默认配置）

当前默认 **200K 窗口**，且 max_output 有 **8K slot cap**：

| 模型窗口 | 有效窗口 | buffer | **触发阈值** | 约占原窗口 |
|---------|---------|--------|-------------|-----------|
| **200K** | 192K | 13K | **≈ 179K** | **~89.5%** |
| **1M** | 992K | 50K | **≈ 942K** | **~94.2%** |

若没开 8K cap（max_output 按 20K 预留）：

| 模型窗口 | 有效窗口 | buffer | **触发阈值** | 约占原窗口 |
|---------|---------|--------|-------------|-----------|
| **200K** | 180K | 13K | **≈ 167K** | **~83.5%** |

## UI 警告线（比触发更早）

同一套逻辑里还有预警：

- **Warning / Error**：阈值 − 20K  
  - 200K 默认 cap 场景：约 **159K** 就开始警告（~79.5%）
- **Blocking limit**：有效窗口 − 3K（手动 `/compact` 的硬顶）

## 环境变量可改

| 变量 | 作用 |
|------|------|
| `DISABLE_AUTO_COMPACT=1` | 关掉 autocompact |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=85` | 按有效窗口百分比触发（测试用） |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` | 压低用于判断的窗口大小 |
| `CLAUDE_CODE_MAX_CONTEXT_TOKENS` | 覆盖模型上下文窗口（ant-only） |

## 一句话

> 默认 **200K 模型、8K output cap** 下，上下文用到大约 **179K token（~90%）** 就会触发 autocompact；1M 模型大约 **942K（~94%）**。判断依据是上一轮 API usage + 本轮新增消息，不是单纯数 message 条数。