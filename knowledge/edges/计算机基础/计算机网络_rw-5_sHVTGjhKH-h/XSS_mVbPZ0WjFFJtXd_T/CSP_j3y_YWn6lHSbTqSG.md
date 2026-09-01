# CSP

- [🔒 **一、CSP 核心作用**](#%F0%9F%94%92-%E4%B8%80csp-%E6%A0%B8%E5%BF%83%E4%BD%9C%E7%94%A8)
  * [**阻断未经授权的资源加载**](#%E9%98%BB%E6%96%AD%E6%9C%AA%E7%BB%8F%E6%8E%88%E6%9D%83%E7%9A%84%E8%B5%84%E6%BA%90%E5%8A%A0%E8%BD%BD)
  * [**禁用危险内联脚本**](#%E7%A6%81%E7%94%A8%E5%8D%B1%E9%99%A9%E5%86%85%E8%81%94%E8%84%9A%E6%9C%AC)
- [⚙️ **二、关键指令解析**](#%E2%9A%99%EF%B8%8F-%E4%BA%8C%E5%85%B3%E9%94%AE%E6%8C%87%E4%BB%A4%E8%A7%A3%E6%9E%90)
- [🛡️ **三、防御原理（对抗 XSS）**](#%F0%9F%9B%A1%EF%B8%8F-%E4%B8%89%E9%98%B2%E5%BE%A1%E5%8E%9F%E7%90%86%E5%AF%B9%E6%8A%97-xss)
  * [1. **阻断反射型/存储型 XSS**](#1-%E9%98%BB%E6%96%AD%E5%8F%8D%E5%B0%84%E5%9E%8B%E5%AD%98%E5%82%A8%E5%9E%8B-xss)
  * [2. **限制非法资源加载**](#2-%E9%99%90%E5%88%B6%E9%9D%9E%E6%B3%95%E8%B5%84%E6%BA%90%E5%8A%A0%E8%BD%BD)
  * [3. **禁用 **`eval()`** 等危险函数**](#3-%E7%A6%81%E7%94%A8-eval-%E7%AD%89%E5%8D%B1%E9%99%A9%E5%87%BD%E6%95%B0)
- [🚀 **四、部署实战**](#%F0%9F%9A%80-%E5%9B%9B%E9%83%A8%E7%BD%B2%E5%AE%9E%E6%88%98)
  * [步骤 1：配置策略（Nginx 示例）](#%E6%AD%A5%E9%AA%A4-1%E9%85%8D%E7%BD%AE%E7%AD%96%E7%95%A5nginx-%E7%A4%BA%E4%BE%8B)
  * [步骤 2：前端适配](#%E6%AD%A5%E9%AA%A4-2%E5%89%8D%E7%AB%AF%E9%80%82%E9%85%8D)
  * [步骤 3：监控违规报告](#%E6%AD%A5%E9%AA%A4-3%E7%9B%91%E6%8E%A7%E8%BF%9D%E8%A7%84%E6%8A%A5%E5%91%8A)
- [⚠️ **五、避坑指南**](#%E2%9A%A0%EF%B8%8F-%E4%BA%94%E9%81%BF%E5%9D%91%E6%8C%87%E5%8D%97)
- [💡 **六、最佳实践策略**](#%F0%9F%92%A1-%E5%85%AD%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%E7%AD%96%E7%95%A5)
- [📊 **CSP 效果统计**](#%F0%9F%93%8A-csp-%E6%95%88%E6%9E%9C%E7%BB%9F%E8%AE%A1)

---

**CSP（Content Security Policy，内容安全策略）是防御 XSS 攻击的浏览器安全标准**，它通过**白名单机制**控制页面可加载的资源来源，彻底阻断恶意脚本执行。以下是深度解析：

***

### 🔒 **一、CSP 核心作用**

#### **阻断未经授权的资源加载**

```http
# 示例策略：仅允许同源脚本和静态资源
Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com;
```

* 若页面中混入 `<script src="http://hacker.com/malware.js">` → **浏览器直接拦截加载**

#### **禁用危险内联脚本**

```html
<!-- 传统 XSS 攻击向量 -->
<button onclick="stealData()">点击</button>
<script>alert(1)</script>

```

* 启用 CSP 后 → **内联脚本和事件处理器自动失效**

***

### ⚙️ **二、关键指令解析**

| **指令** | **作用** | **示例值** |
| --- | --- | --- |
| `default-src` | 默认资源加载策略（兜底规则） | `'self'`（同源） |
| `script-src` | 控制 JavaScript 来源 | `'self' 'unsafe-inline'` |
| `style-src` | 控制 CSS 来源 | `'self' fonts.googleapis.com` |
| `img-src` | 控制图片来源 | `'self' data:` |
| `connect-src` | 限制 XHR/fetch/WebSocket 连接目标 | `https://api.example.com` |
| `frame-src` | 控制 iframe 嵌入来源 | `'none'`（禁止所有 iframe） |
| `report-uri` | 违规行为上报地址 | `https://report.example.com/csp` |

> 💡 特殊关键词：
>
> * `'none'`：禁止任何资源
> * `'unsafe-inline'`：允许内联脚本（**降低安全性**）
> * `'nonce-{随机值}'`：允许特定内联脚本（推荐替代 `unsafe-inline`）
> * `'strict-dynamic'`：信任动态生成的脚本（现代框架必备）

***

### 🛡️ **三、防御原理（对抗 XSS）**

#### 1. **阻断反射型/存储型 XSS**

```html
<!-- 攻击者注入的恶意脚本 -->
<script>sendCookiesToHacker();</script>

```

* **结果**：浏览器拒绝执行 → 控制台报错：\
  `Refused to execute inline script because of CSP`

#### 2. **限制非法资源加载**

```html
<!-- 恶意外部脚本 -->
<script src="https://hacker.com/exploit.js"></script>

```

* **结果**：若未在 `script-src` 白名单 → 直接拦截

#### 3. **禁用 **`eval()`** 等危险函数**

```javascript
// 动态执行字符串（常见攻击入口）
eval(userControlledData); 
```

* **结果**：触发 CSP 违规 → 函数被禁用

***

### 🚀 **四、部署实战**

#### 步骤 1：配置策略（Nginx 示例）

```nginx
# 全局启用 CSP
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-{RAND}'; style-src 'self' 'unsafe-inline'; img-src *; report-uri /csp-report;";
```

#### 步骤 2：前端适配

```html
<!-- 仅允许带 nonce 的内联脚本 -->
<script nonce="RAND">
  // 合法脚本（服务端动态生成 nonce）
</script>
<!-- 外部脚本需在白名单域名 -->
<script src="https://trusted.cdn.com/lib.js"></script>

```

#### 步骤 3：监控违规报告

```json
// 发送到 report-uri 的违规报告示例
{
  "csp-report": {
    "blocked-uri": "https://hacker.com/exploit.js",
    "violated-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self'"
  }
}
```

***

### ⚠️ **五、避坑指南**

| **陷阱** | **正确方案** |
| --- | --- |
| 过度依赖 `'unsafe-inline'` | 用 `nonce` 或 `hash` 精细控制内联脚本 |
| 忘记 `frame-ancestors` | 防点击劫持：`frame-ancestors 'none'` |
| 未处理动态脚本加载 | 添加 `'strict-dynamic'` 支持现代框架 |
| 缺失 `upgrade-insecure-requests` | 强制 HTTPS：`upgrade-insecure-requests` |

***

### 💡 **六、最佳实践策略**

```http
# 推荐策略（兼顾安全与兼容）
Content-Security-Policy: 
  default-src 'none'; 
  script-src 'self' 'nonce-{RAND}' 'strict-dynamic'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data:; 
  font-src 'self'; 
  connect-src 'self' https://api.example.com; 
  frame-ancestors 'none'; 
  report-uri /csp-report;
```

***

### 📊 **CSP 效果统计**

* **XSS 拦截率**：启用 CSP 后，**可阻断 98% 的 XSS 攻击**（Google 安全报告）
* **部署成本**：
  * 初始配置：~2 人日
  * 长期维护：通过违规报告持续优化策略

> 🔑 **终极价值**：\
> CSP 将 XSS 防御从 **“过滤输入”** 升级为 **“浏览器级强制拦截”**，是 Web 安全的基石技术。


> 更新: 2025-06-07 17:17:42  
> 原文: <https://www.yuque.com/viruspc/el3mi0/cxxlxsu4w6w87m0r>