# JWT与CSRF

- [**JWT 和 CSRF 的关系**](#jwt-%E5%92%8C-csrf-%E7%9A%84%E5%85%B3%E7%B3%BB)
  * [**1. 如果 JWT 存储在 Cookie 中**](#1-%E5%A6%82%E6%9E%9C-jwt-%E5%AD%98%E5%82%A8%E5%9C%A8-cookie-%E4%B8%AD)
  * [**2. 如果 JWT 存储在 LocalStorage 或 SessionStorage 中**](#2-%E5%A6%82%E6%9E%9C-jwt-%E5%AD%98%E5%82%A8%E5%9C%A8-localstorage-%E6%88%96-sessionstorage-%E4%B8%AD)
  * [**3. 如果 JWT 通过 HTTP Header 发送**](#3-%E5%A6%82%E6%9E%9C-jwt-%E9%80%9A%E8%BF%87-http-header-%E5%8F%91%E9%80%81)
- [**总结**](#%E6%80%BB%E7%BB%93)
- [**最佳实践：SSO 中使用 JWT 防御 CSRF**](#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5sso-%E4%B8%AD%E4%BD%BF%E7%94%A8-jwt-%E9%98%B2%E5%BE%A1-csrf)
- [**总结**](#%E6%80%BB%E7%BB%93-1)

---

在单点登录（SSO）中直接使用 **JWT（JSON Web Token）** 来管理用户会话时，是否会出现 CSRF 问题，取决于 **JWT 的存储方式** 和 **使用场景**。以下是详细分析：

***

### **JWT 和 CSRF 的关系**

CSRF（跨站请求伪造）攻击的核心是：**攻击者通过伪造请求，利用用户的身份在目标网站上执行未授权的操作**。JWT 本身并不会直接引发 CSRF 问题，但如果 JWT 的存储方式不当，可能会让应用暴露在 CSRF 攻击中。

#### **1. 如果 JWT 存储在 Cookie 中**

* **会有 CSRF 风险**：
  * 如果将 JWT 存储在浏览器的 Cookie 中，且没有正确防护，浏览器会自动在跨站请求中附带 Cookie（因为 Cookie 是浏览器自动管理的）。
  * 攻击者可以通过 CSRF 攻击利用用户的 Cookie，发送伪造的请求。
  * **解决方法**：
    * 配置 `SameSite` 属性（如 `SameSite=Lax` 或 `SameSite=Strict`）来限制 Cookie 的跨站使用。
    * 使用 CSRF Token 进行额外的验证，确保请求来源可信。

#### **2. 如果 JWT 存储在 LocalStorage 或 SessionStorage 中**

* **不会有 CSRF 风险，但存在 XSS 风险**：
  * LocalStorage 和 SessionStorage 不会自动在请求中携带数据，因此不会直接受到 CSRF 攻击。
  * 但是，如果应用存在 XSS（跨站脚本攻击）漏洞，攻击者可以通过注入恶意脚本获取存储中的 JWT，从而冒充用户发送请求。
  * **解决方法**：
    * 避免 XSS 漏洞，严格过滤和验证用户输入。
    * 使用 `Content Security Policy (CSP)` 限制脚本的加载来源。

#### **3. 如果 JWT 通过 HTTP Header 发送**

* **不会有 CSRF 风险**：
  * 如果前端将 JWT 存储在内存中，并通过 `Authorization` 头（如 `Bearer <JWT>`）发送给服务器，浏览器不会自动附带这些信息，因此不会受到 CSRF 攻击。
  * 这种方式通常用于前后端分离的应用中，配合跨域资源共享（CORS）策略，可以有效防御 CSRF。

***

### **总结**

* **JWT 使用 Cookie 存储时**：会有 CSRF 风险，需要结合 `SameSite` 属性和 CSRF Token 防护。
* **JWT 使用 LocalStorage 或 SessionStorage 时**：不会有 CSRF 风险，但需要防范 XSS。
* **JWT 使用 HTTP Header（如 **`Authorization`**）时**：不会有 CSRF 风险，但需要确保 CORS 配置正确。

***

### **最佳实践：SSO 中使用 JWT 防御 CSRF**

1. **推荐存储方式**：
   * 如果需要高安全性，建议将 JWT 存储在内存中，并通过 `Authorization` 头发送给服务器。
   * 避免将 JWT 存储在 Cookie 或 LocalStorage 中，尤其是存在潜在 XSS 风险时。
2. **额外防护措施**：
   * **启用 CSRF Token**：
     * 即使使用 Cookie，也可以通过在每次请求中附带 CSRF Token 来验证请求的合法性。
   * **配置 CORS**：
     * 允许可信的跨域请求，拒绝其他来源的请求。
   * **限制 JWT 的有效期**：
     * 使用短期有效的 JWT，减少攻击窗口。
   * **结合 Refresh Token**：
     * 使用 Refresh Token 来延长用户会话，而不是长期存储 JWT。

***

### **总结**

直接使用 JWT 本身不会引发 CSRF 问题，但存储方式会影响安全性。如果将 JWT 存储在 Cookie 中（尤其是跨域场景），仍然需要采取 CSRF 防护措施。如果通过 `Authorization` 头发送 JWT，则不会有 CSRF 风险，但需要妥善配置 CORS 和防范 XSS。


> 更新: 2025-06-07 18:17:18  
> 原文: <https://www.yuque.com/viruspc/el3mi0/cdhgnxzkic3n6lqr>