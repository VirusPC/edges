# Cookie VS URL Fragment 传输

- [**1. 将 JWT 放到 Cookie 中的安全性**](#1-%E5%B0%86-jwt-%E6%94%BE%E5%88%B0-cookie-%E4%B8%AD%E7%9A%84%E5%AE%89%E5%85%A8%E6%80%A7)
  * [**优点**](#%E4%BC%98%E7%82%B9)
  * [**缺点**](#%E7%BC%BA%E7%82%B9)
- [**2. 将 JWT 放到 URL Fragment 中的安全性**](#2-%E5%B0%86-jwt-%E6%94%BE%E5%88%B0-url-fragment-%E4%B8%AD%E7%9A%84%E5%AE%89%E5%85%A8%E6%80%A7)
  * [**优点**](#%E4%BC%98%E7%82%B9-1)
  * [**缺点**](#%E7%BC%BA%E7%82%B9-1)
- [**3. 两种方式的对比**](#3-%E4%B8%A4%E7%A7%8D%E6%96%B9%E5%BC%8F%E7%9A%84%E5%AF%B9%E6%AF%94)
- [**4. 哪种方式更安全？**](#4-%E5%93%AA%E7%A7%8D%E6%96%B9%E5%BC%8F%E6%9B%B4%E5%AE%89%E5%85%A8)
  * [**Cookie 更安全的场景**](#cookie-%E6%9B%B4%E5%AE%89%E5%85%A8%E7%9A%84%E5%9C%BA%E6%99%AF)
  * [**URL Fragment 更安全的场景**](#url-fragment-%E6%9B%B4%E5%AE%89%E5%85%A8%E7%9A%84%E5%9C%BA%E6%99%AF)
- [**5. Supabase 的选择：JWT 放在 Cookie 中**](#5-supabase-%E7%9A%84%E9%80%89%E6%8B%A9jwt-%E6%94%BE%E5%9C%A8-cookie-%E4%B8%AD)
  * [**为什么 Supabase 选择 Cookie？**](#%E4%B8%BA%E4%BB%80%E4%B9%88-supabase-%E9%80%89%E6%8B%A9-cookie)
  * [**如何确保安全性？**](#%E5%A6%82%E4%BD%95%E7%A1%AE%E4%BF%9D%E5%AE%89%E5%85%A8%E6%80%A7)
- [**6. URL Fragment 是否更安全？**](#6-url-fragment-%E6%98%AF%E5%90%A6%E6%9B%B4%E5%AE%89%E5%85%A8)
- [**7. 总结**](#7-%E6%80%BB%E7%BB%93)

---

将 **JWT** 放到 **Cookie** 中和通过 **URL Fragment** 传输，各自都有优缺点，具体哪个更安全取决于场景和对安全性的要求。我们先分析这两种方式的安全性和适用场景。

***

### **1. 将 JWT 放到 Cookie 中的安全性**

#### **优点**

1. **HttpOnly 属性**：
   * 如果将 JWT 存储在 Cookie 中，并设置 `HttpOnly` 属性，浏览器无法通过 JavaScript 访问该 Cookie（防止 XSS 攻击）。
   * 只有服务器端可以读取 Cookie，从而减少令牌被盗的风险。
2. **Secure 属性**：
   * 配合 `Secure` 属性，Cookie 只能通过 HTTPS 传输，防止中间人攻击（MITM）。
3. **自动携带**：
   * 浏览器会自动携带 Cookie，适合需要频繁发送令牌的场景（如后端 API 请求）。

#### **缺点**

1. **CSRF 攻击**：
   * Cookie 会自动随请求发送，可能会被恶意网站利用进行跨站请求伪造（CSRF）。
   * 解决方案：可以通过引入 CSRF Token 或使用 `SameSite` 属性来防范。
2. **需要额外配置**：
   * 如果没有正确设置 `HttpOnly` 和 `Secure` 属性，Cookie 存储的安全性会大幅降低。
3. **跨域限制**：
   * Cookie 的跨域访问需要额外的配置（如设置 `Domain` 属性），在某些场景下可能会增加实现复杂度。

***

### **2. 将 JWT 放到 URL Fragment 中的安全性**

#### **优点**

1. **不随请求发送**：
   * URL Fragment 是 URL 的 `#` 部分，仅在客户端可见，不会随 HTTP 请求发送到服务器。
   * 这可以有效防止 CSRF 攻击，因为服务器端不会自动接收到令牌。
2. **适合前端单页应用（SPA）**：
   * 在前端单页应用中，URL Fragment 可以通过 JavaScript 操作，适合在客户端处理令牌。

#### **缺点**

1. **容易暴露**：
   * URL Fragment 可能会被浏览器插件、历史记录、屏幕截图等暴露。
   * 如果用户复制 URL 或通过第三方工具分享 URL，其他人可能会看到令牌。
2. **无法持久化**：
   * URL Fragment 不会被浏览器存储，每次页面刷新都会丢失，需要额外的逻辑来管理令牌。
3. **依赖 JavaScript**：
   * URL Fragment 的读取和处理完全依赖 JavaScript。如果用户禁用了 JavaScript，可能会导致功能失效。

***

### **3. 两种方式的对比**

| **特性** | **Cookie** | **URL Fragment** |
| --- | --- | --- |
| **安全性** | 安全性高，配合 `HttpOnly` 和 `Secure` 可防止 XSS 和 MITM | 不随请求发送，防止 CSRF，但容易被暴露 |
| **易用性** | 浏览器自动携带，适合后端 API 请求 | 需手动管理，适合前端单页应用（SPA） |
| **持久化** | 可以持久化存储，用户关闭页面后仍然有效 | 不会持久化，每次刷新页面会丢失 |
| **跨域支持** | 需要额外配置（如 `Domain` 属性） | 天然支持跨域，但需注意暴露风险 |
| **适用场景** | 后端 API 请求、需要持久化的认证场景 | 前端单页应用（SPA）、短期令牌传输 |

***

### **4. 哪种方式更安全？**

#### **Cookie 更安全的场景**

1. **后端 API 认证**：
   * 如果你的系统主要是后端 API 认证，Cookie 是更安全的选择。
   * 配合 `HttpOnly` 和 `Secure` 属性，可以有效防止 XSS 和 MITM 攻击。
2. **需要持久化令牌**：
   * Cookie 可以持久化存储，适合用户登录后长期保持会话的场景。
3. **频繁请求令牌**：
   * 浏览器会自动携带 Cookie，减少客户端的复杂性。

#### **URL Fragment 更安全的场景**

1. **前端单页应用（SPA）**：
   * 如果你的系统是完全前端驱动的，URL Fragment 可以避免令牌随请求发送，防止 CSRF 攻击。
2. **短期令牌传输**：
   * URL Fragment 更适合短期令牌传输（如 OAuth2 的回调场景）。
3. **无需持久化**：
   * 如果令牌只需要在当前页面有效，而无需持久化存储，URL Fragment 是一个轻量级的选择。

***

### **5. Supabase 的选择：JWT 放在 Cookie 中**

Supabase 使用 **Cookie** 来存储 JWT，这种方式是经过权衡的选择，其安全性依赖于正确的配置：

#### **为什么 Supabase 选择 Cookie？**

1. **后端 API 认证**：
   * Supabase 的主要场景是后端 API 的认证，Cookie 可以自动随请求发送，简化了客户端的实现。
2. **安全配置**：
   * Supabase 将 JWT 存储在 `HttpOnly` 和 `Secure` Cookie 中，防止 XSS 和 MITM 攻击。
3. **持久化支持**：
   * Cookie 可以持久化存储，适合需要长时间保持会话的场景。

#### **如何确保安全性？**

* 设置 `HttpOnly` 属性，防止 JavaScript 访问 Cookie。
* 设置 `Secure` 属性，确保 Cookie 只能通过 HTTPS 传输。
* 配合 `SameSite` 属性，防范 CSRF 攻击。

***

### **6. URL Fragment 是否更安全？**

虽然 URL Fragment 不随 HTTP 请求发送，可以防止 CSRF，但它并不一定更安全：

1. **容易暴露**：
   * URL Fragment 会出现在浏览器地址栏，可能被用户复制或分享。
   * 浏览器插件或第三方工具可能会读取 URL Fragment。
2. **适用场景有限**：
   * URL Fragment 更适合短期令牌传输（如 OAuth2 回调），不适合长期会话管理。

***

### **7. 总结**

* **Cookie 更安全**：如果正确设置 `HttpOnly` 和 `Secure` 属性，Cookie 是存储 JWT 的更安全选择，尤其是后端 API 认证场景。
* **URL Fragment 更轻量**：适合短期令牌传输或前端单页应用（SPA）场景，但容易暴露，且不支持持久化。

对于 Supabase 的场景（后端 API 认证），将 JWT 放到 **Cookie** 中是一个合理的选择，只要确保安全配置到位，就不会有明显的安全问题。


> 更新: 2025-08-16 13:52:10  
> 原文: <https://www.yuque.com/viruspc/el3mi0/fygvp6bcthh3qz7s>