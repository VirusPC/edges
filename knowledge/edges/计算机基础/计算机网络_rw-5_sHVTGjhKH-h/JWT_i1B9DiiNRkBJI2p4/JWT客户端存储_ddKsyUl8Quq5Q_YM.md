# JWT客户端存储

- [**常见存储方式**](#%E5%B8%B8%E8%A7%81%E5%AD%98%E5%82%A8%E6%96%B9%E5%BC%8F)
  * [1. **HTTP-Only Cookie**](#1-http-only-cookie)
  * [2. **浏览器存储（LocalStorage/SessionStorage）**](#2-%E6%B5%8F%E8%A7%88%E5%99%A8%E5%AD%98%E5%82%A8localstoragesessionstorage)
  * [3. **内存存储（In-Memory）**](#3-%E5%86%85%E5%AD%98%E5%AD%98%E5%82%A8in-memory)
  * [4. **移动端安全存储（Keychain/Keystore）**](#4-%E7%A7%BB%E5%8A%A8%E7%AB%AF%E5%AE%89%E5%85%A8%E5%AD%98%E5%82%A8keychainkeystore)
- [**最佳实践**](#%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)
  * [1. **安全性优先**](#1-%E5%AE%89%E5%85%A8%E6%80%A7%E4%BC%98%E5%85%88)
  * [2. **混合存储策略**](#2-%E6%B7%B7%E5%90%88%E5%AD%98%E5%82%A8%E7%AD%96%E7%95%A5)
  * [3. **服务端配合**](#3-%E6%9C%8D%E5%8A%A1%E7%AB%AF%E9%85%8D%E5%90%88)
- [**代码示例（SPA + JWT）**](#%E4%BB%A3%E7%A0%81%E7%A4%BA%E4%BE%8Bspa--jwt)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

在客户端存储 JWT（JSON Web Token）时，需要兼顾**安全性**和**便捷性**。以下是常见的存储方式及其优缺点，以及最佳实践建议：

***

### **常见存储方式**

#### 1. **HTTP-Only Cookie**

* **实现方式**：服务器通过 `Set-Cookie` 头将 JWT 写入 Cookie，并标记 `HttpOnly` 和 `Secure`。
* **优点**：
  * 防止 XSS 攻击窃取 Token（JavaScript 无法读取 `HttpOnly` Cookie）。
  * 自动随请求发送到同源后端，无需手动处理。
* **缺点**：
  * 可能受 CSRF 攻击（需配合 `SameSite` 属性和 CSRF Token 防御）。
  * 需处理跨域 Cookie 策略（如 CORS 配置）。
* **示例**：

```http
Set-Cookie: token=xxxx; HttpOnly; Secure; SameSite=Strict; Path=/
```

#### 2. **浏览器存储（LocalStorage/SessionStorage）**

* **实现方式**：登录后，将 JWT 存入 `localStorage` 或 `sessionStorage`，手动添加到请求头（如 `Authorization: Bearer <token>`）。
* **优点**：
  * 简单易用，适合前后端分离架构（如 SPA）。
  * 不自动发送请求，避免 CSRF 风险。
* **缺点**：
  * 易受 XSS 攻击（若站点存在 XSS 漏洞，Token 可能被窃取）。
  * 需手动管理 Token 过期和续期。
* **示例**：

```javascript
// 存储
localStorage.setItem('jwt', token);
// 发送请求
fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
});
```

#### 3. **内存存储（In-Memory）**

* **实现方式**：将 JWT 保存在 JavaScript 变量中（如 Vue/React 的状态管理）。
* **优点**：
  * 完全避免持久化存储风险（如关闭页面后 Token 丢失）。
* **缺点**：
  * 页面刷新或新标签页打开需重新登录。
  * 仅适用于单页应用（SPA）短期会话。

#### 4. **移动端安全存储（Keychain/Keystore）**

* **实现方式**：使用平台提供的安全存储（如 iOS Keychain、Android Keystore）。
* **优点**：
  * 硬件级加密保护，防逆向和篡改。
* **缺点**：
  * 实现复杂，需平台特定 API。

***

### **最佳实践**

#### 1. **安全性优先**

* **短期 Token**：设置较短的 JWT 有效期（如 15 分钟），结合 Refresh Token 机制续期。
* **防御 CSRF**：
  * 使用 `SameSite=Strict/Lax` 的 Cookie。
  * 对关键操作（如修改密码）添加 CSRF Token 验证。
* **防御 XSS**：
  * 避免将用户输入直接插入 DOM（如使用 React/Vue 的模板转义）。
  * 启用 CSP（内容安全策略）限制脚本来源。

#### 2. **混合存储策略**

* **访问令牌（Access Token）**：存于内存或 `sessionStorage`，减少 XSS 暴露时间。
* **刷新令牌（Refresh Token）**：存于 `HttpOnly` Cookie 或安全存储，用于获取新 Access Token。

#### 3. **服务端配合**

* 启用 HTTPS，防止中间人攻击。
* 对 JWT 签名（非对称加密更安全，如 RSA）。
* 维护 Token 黑名单（可选，用于即时吊销 Token）。

***

### **代码示例（SPA + JWT）**

```javascript
// 登录成功后，存储 Token 到内存（或 sessionStorage）
let accessToken = null;

async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  accessToken = data.accessToken; // 存于内存
  localStorage.setItem('refreshToken', data.refreshToken); // 刷新 Token 存于 localStorage
}

// 发送请求时自动携带 Token
async function fetchData() {
  const response = await fetch('/api/data', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  // 处理 Token 过期（如返回 401）
  if (response.status === 401) {
    await refreshToken(); // 使用 Refresh Token 获取新 Access Token
    return fetchData();
  }
  return response.json();
}

// 刷新 Token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/refresh', {
    headers: { 'Authorization': `Bearer ${refreshToken}` }
  });
  accessToken = (await response.json()).accessToken;
}
```

***

### **总结**

* **推荐方案**：
  * 对安全性要求高：`HttpOnly` Cookie + `SameSite` + CSRF Token + 短期 Access Token。
  * 对开发便捷性要求高：内存存储 + Refresh Token（存于 `HttpOnly` Cookie）。
* **避免直接暴露 Token**，始终假设客户端环境不安全，做好服务端鉴权和监控。


> 更新: 2025-05-28 01:57:36  
> 原文: <https://www.yuque.com/viruspc/el3mi0/au236i2449gnvypl>