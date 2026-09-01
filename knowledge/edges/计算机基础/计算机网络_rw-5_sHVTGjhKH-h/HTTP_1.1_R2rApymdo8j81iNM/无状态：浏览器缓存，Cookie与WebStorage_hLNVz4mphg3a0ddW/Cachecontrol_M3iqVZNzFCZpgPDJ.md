# Cache control

- [🛠️ 核心作用](#%F0%9F%9B%A0%EF%B8%8F-%E6%A0%B8%E5%BF%83%E4%BD%9C%E7%94%A8)
- [📜 常用指令详解](#%F0%9F%93%9C-%E5%B8%B8%E7%94%A8%E6%8C%87%E4%BB%A4%E8%AF%A6%E8%A7%A3)
  * [✅ 缓存开关指令](#%E2%9C%85-%E7%BC%93%E5%AD%98%E5%BC%80%E5%85%B3%E6%8C%87%E4%BB%A4)
  * [⏱️ 缓存有效期指令](#%E2%8F%B1%EF%B8%8F-%E7%BC%93%E5%AD%98%E6%9C%89%E6%95%88%E6%9C%9F%E6%8C%87%E4%BB%A4)
  * [🔄 缓存验证指令](#%F0%9F%94%84-%E7%BC%93%E5%AD%98%E9%AA%8C%E8%AF%81%E6%8C%87%E4%BB%A4)
- [⚠️ 重要行为规则](#%E2%9A%A0%EF%B8%8F-%E9%87%8D%E8%A6%81%E8%A1%8C%E4%B8%BA%E8%A7%84%E5%88%99)
- [🧩 实际应用场景](#%F0%9F%A7%A9-%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF)
  * [场景1：静态资源（CSS/JS/图片）](#%E5%9C%BA%E6%99%AF1%E9%9D%99%E6%80%81%E8%B5%84%E6%BA%90cssjs%E5%9B%BE%E7%89%87)
  * [场景2：动态页面（HTML）](#%E5%9C%BA%E6%99%AF2%E5%8A%A8%E6%80%81%E9%A1%B5%E9%9D%A2html)
  * [场景3：CDN 代理控制](#%E5%9C%BA%E6%99%AF3cdn-%E4%BB%A3%E7%90%86%E6%8E%A7%E5%88%B6)
- [🔧 开发调试技巧](#%F0%9F%94%A7-%E5%BC%80%E5%8F%91%E8%B0%83%E8%AF%95%E6%8A%80%E5%B7%A7)
- [📌 关键注意事项](#%F0%9F%93%8C-%E5%85%B3%E9%94%AE%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

---

`Cache-Control` 是 HTTP 头部中**最核心的缓存控制字段**，用于定义资源在客户端（浏览器）和代理服务器中的缓存策略。它通过指令（Directives）精确控制缓存的行为，比传统的 `Expires` 更灵活且优先级更高。

***

### 🛠️ 核心作用

1. **控制缓存存储**（是否允许缓存）
2. **控制缓存有效期**（缓存存多久）
3. **控制缓存验证**（何时需回源验证）
4. **控制缓存位置**（公共缓存 or 私有缓存）

***

### 📜 常用指令详解

#### ✅ 缓存开关指令

| 指令 | 作用 | 示例场景 |
| --- | --- | --- |
| `no-store` | **禁止任何缓存**（每次请求都从服务器获取） | 敏感数据（如银行交易页面） |
| `no-cache` | **可缓存但每次需验证有效性**（强制回源检查） | 频繁更新的动态资源 |
| `public` | 允许所有缓存（客户端、代理服务器） | CDN 上的公共资源（如图片） |
| `private` | 仅允许客户端（浏览器）缓存 | 用户个性化页面 |

#### ⏱️ 缓存有效期指令

| 指令 | 格式 | 说明 |
| --- | --- | --- |
| `max-age=<seconds>` | `max-age=604800` | 资源有效期（秒），优先级高于 `Expires` |
| `s-maxage=<seconds>` | `s-maxage=3600` | **专用于代理服务器**的有效期（覆盖 `max-age`） |
| `stale-while-revalidate=<seconds>` | `stale-while-revalidate=300` | 过期后仍可用旧缓存，后台异步验证（优化体验） |
| `stale-if-error=<seconds>` | `stale-if-error=86400` | 当回源失败时，使用过期缓存的时间窗口 |

#### 🔄 缓存验证指令

| 指令 | 作用 |
| --- | --- |
| `must-revalidate` | 过期后**必须**回源验证（禁止使用过期缓存） |
| `proxy-revalidate` | 同 `must-revalidate`，但仅针对代理服务器 |

***

### ⚠️ 重要行为规则

1. **优先级**\
   `no-store` > `no-cache` > `private`/`public` > `max-age` > `Expires`\
   （如同时存在冲突指令，左侧优先级更高）
2. **组合使用示例**：

```http
# 允许公共缓存，有效期1小时，过期后必须验证
Cache-Control: public, max-age=3600, must-revalidate

# 禁止缓存（敏感数据）
Cache-Control: no-store

# 可缓存但每次需验证（动态API）
Cache-Control: no-cache
```

3. **与 **`Expires`** 的关系**：
   * 若同时设置 `Cache-Control: max-age` 和 `Expires`，`max-age`\*\* 优先级更高\*\*
   * 现代开发建议\*\*弃用 \*\*`Expires`（因其依赖服务器/客户端时钟同步）

***

### 🧩 实际应用场景

#### 场景1：静态资源（CSS/JS/图片）

```http
Cache-Control: public, max-age=31536000, immutable
```

* 长缓存（1年）+ 禁止更新（`immutable` 表示资源永不变）

#### 场景2：动态页面（HTML）

```http
Cache-Control: no-cache, max-age=0
```

* 每次使用前必须验证（配合 `ETag` 或 `Last-Modified`）

#### 场景3：CDN 代理控制

```http
Cache-Control: public, s-maxage=600, max-age=60
```

* 代理服务器缓存 10 分钟（`s-maxage=600`）
* 浏览器缓存 1 分钟（`max-age=60`）

***

### 🔧 开发调试技巧

1. **禁用缓存（开发阶段）**：

```http
Cache-Control: no-store, no-cache, must-revalidate
```

2. **强制硬刷新**：
   * 浏览器按 `Ctrl+F5` / `Cmd+Shift+R` 跳过缓存
3. **查看缓存状态**：
   * Chrome DevTools → Network → 查看请求的 `Size` 列：
     * `(memory cache)` / `(disk cache)` 表示命中缓存
     * 响应代码 `304 Not Modified` 表示验证通过

***

### 📌 关键注意事项

1. **HTTPS 缓存**：\
   `Cache-Control` 在 HTTPS 下同样有效（除非显式设置 `private`）。
2. **默认行为**：\
   未指定 `Cache-Control` 时，浏览器**可能采用启发式缓存**（根据 `Last-Modified` 时间推测有效期）。
3. **清除缓存**：\
   修改资源 URL（如添加版本号 `style.css?v=2`）是清除旧缓存的最佳实践。

掌握 `Cache-Control` 能显著提升 Web 性能（减少带宽+加快加载），同时确保资源更新及时生效！ 🚀


> 更新: 2025-06-03 05:15:40  
> 原文: <https://www.yuque.com/viruspc/el3mi0/qrm1756up06iai9o>