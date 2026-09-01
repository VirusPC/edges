# 为什么用URL Fragment传输token

- [🔍 风险点：为什么说 Fragment 传输有安全隐患？](#%F0%9F%94%8D-%E9%A3%8E%E9%99%A9%E7%82%B9%E4%B8%BA%E4%BB%80%E4%B9%88%E8%AF%B4-fragment-%E4%BC%A0%E8%BE%93%E6%9C%89%E5%AE%89%E5%85%A8%E9%9A%90%E6%82%A3)
- [🛡️ 为什么仍被使用？安全权衡与缓解措施](#%F0%9F%9B%A1%EF%B8%8F-%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BB%8D%E8%A2%AB%E4%BD%BF%E7%94%A8%E5%AE%89%E5%85%A8%E6%9D%83%E8%A1%A1%E4%B8%8E%E7%BC%93%E8%A7%A3%E6%8E%AA%E6%96%BD)
  * [✅ 1. **防止服务器端泄露 (Prevents Server-Side Leakage) - 核心优势！**](#%E2%9C%85-1-%E9%98%B2%E6%AD%A2%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%AB%AF%E6%B3%84%E9%9C%B2-prevents-server-side-leakage---%E6%A0%B8%E5%BF%83%E4%BC%98%E5%8A%BF)
  * [✅ 2. **短时效性 (Short-Lived Tokens) - 关键缓解**](#%E2%9C%85-2-%E7%9F%AD%E6%97%B6%E6%95%88%E6%80%A7-short-lived-tokens---%E5%85%B3%E9%94%AE%E7%BC%93%E8%A7%A3)
  * [✅ 3. **前端安全实践 (Front-End Security Practices) - 必要配合**](#%E2%9C%85-3-%E5%89%8D%E7%AB%AF%E5%AE%89%E5%85%A8%E5%AE%9E%E8%B7%B5-front-end-security-practices---%E5%BF%85%E8%A6%81%E9%85%8D%E5%90%88)
  * [✅ 4. **令牌范围限制 (Limited Token Scope)**](#%E2%9C%85-4-%E4%BB%A4%E7%89%8C%E8%8C%83%E5%9B%B4%E9%99%90%E5%88%B6-limited-token-scope)
  * [✅ 5. **PKCE (Proof Key for Code Exchange) - 增强保护 (OAuth 2.0)**](#%E2%9C%85-5-pkce-proof-key-for-code-exchange---%E5%A2%9E%E5%BC%BA%E4%BF%9D%E6%8A%A4-oauth-20)
- [🎯 总结：URL Fragment 传输 JWT 的安全观](#%F0%9F%8E%AF-%E6%80%BB%E7%BB%93url-fragment-%E4%BC%A0%E8%BE%93-jwt-%E7%9A%84%E5%AE%89%E5%85%A8%E8%A7%82)
- [📌 最佳实践建议](#%F0%9F%93%8C-%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%E5%BB%BA%E8%AE%AE)

---

您指出了一个非常关键的安全问题！确实，通过 **URL Fragment（**`#`\*\* 后面的部分）传输 JWT 时，令牌会明文显示在浏览器的地址栏中\*\*。用户可以直接看到完整的 Token，浏览器也会将其保存在历史记录中。这确实存在一定的安全风险，但这种方式仍然被广泛使用（尤其在 OAuth 2.0 Implicit Flow 中），是因为它有一些重要的**安全设计权衡和缓解措施**。

以下是关于 URL Fragment 传输 JWT 的安全性的深度解析：

***

### 🔍 风险点：为什么说 Fragment 传输有安全隐患？

1. **视觉暴露 (Visual Exposure)**：
   * 用户可能会看到地址栏中一长串乱码（JWT），虽然看不懂内容，但可能引起疑虑或误操作。
   * **屏幕共享/录屏风险：** 如果用户在进行屏幕共享、录屏或被他人窥屏时，Token 可能被他人看到并复制。
2. **浏览器历史记录 (Browser History)**：
   * **URL（包括 Fragment）会被保存在浏览器的历史记录中。** 任何能访问该用户设备的人（或恶意软件）都可能从历史记录中获取 Token。
3. **客户端脚本泄露 (Leakage via Client-Side Scripts)**：
   * 如果应用存在 **XSS（跨站脚本攻击）漏洞**，恶意脚本可以轻易读取 `window.location.hash` 获取 Token。
   * 前端错误监控工具（如 Sentry, Bugsnag）如果配置不当，可能将包含 Token 的 URL 作为错误上下文上报到日志服务器。
4. **书签或分享链接 (Bookmarking/Link Sharing)**：
   * 用户可能无意中将带有活动 Token 的 URL 保存为书签或分享给他人，导致令牌泄露。

***

### 🛡️ 为什么仍被使用？安全权衡与缓解措施

尽管存在上述风险，URL Fragment 传输仍是跨域 SSO 中常见的方案，因为它解决了几个更关键的问题，并配合其他机制降低风险：

#### ✅ 1. **防止服务器端泄露 (Prevents Server-Side Leakage) - 核心优势！**

* **浏览器永远不会将 URL Fragment (**`#`\*\* 后面的内容) 发送到服务器！\*\* 这是 HTTP 协议的规定。
* **对比风险：**

- 如果使用 **Query Parameter (**`?token=...`**)** 传输：
  \- Token 会出现在 **HTTP 请求行** 中（`GET /callback?token=eyJ... HTTP/1.1`）。
  \- **后果：**
  \- 会记录在 **Web 服务器访问日志** 中。
  \- 可能出现在 **反向代理/CDN 日志** 中。
  \- 可能通过 `Referer` 头泄露给其他站点（如果用户从该页面跳转出去）。
- **Fragment 传输完全避免了这些服务器端和网络层面的泄露！** 这是其最大的安全优势。

#### ✅ 2. **短时效性 (Short-Lived Tokens) - 关键缓解**

* 通过 Fragment 传输的 Token（通常是 `access_token`）被设计为**生命周期非常短**（例如 5-60 分钟）。
* **即使 Token 被泄露，攻击窗口也很小。** 过期后 Token 即失效。
* **最佳实践：** 结合使用 **Refresh Token**（不通过 Fragment 传输！），由应用后端安全存储和使用，用于在 Access Token 过期后获取新的 Access Token。前端只持有短命的 Access Token。

#### ✅ 3. **前端安全实践 (Front-End Security Practices) - 必要配合**

* **JWT 存储：** 前端在从 Fragment 获取 Token 后，应**立即将其从 URL 中清除**（使用 `history.replaceState` 移除 `#token` 部分），并安全存储：

- `sessionStorage`**：** 更推荐，关闭浏览器标签页即清除。
- `localStorage`**：** 持久化存储，但存在跨会话泄露风险（需权衡便利性与安全性）。

* **防范 XSS：**

- **严格的 CSP (Content Security Policy)：** 是防御 XSS 的基石，能有效阻止恶意脚本注入。
- **输入输出编码：** 对所有动态内容进行严格的编码。
- **避免内联脚本/样式：** 减少 XSS 攻击面。
- **使用安全的 JS 框架：** 如 React, Vue, Angular 等内置了部分 XSS 防护。

* **避免日志记录：** 确保前端错误监控工具不会捕获或上报包含 Token 的 URL。

#### ✅ 4. **令牌范围限制 (Limited Token Scope)**

* 通过 Fragment 传输的 Access Token 应只授予**最小必要权限**。避免包含高权限操作（如修改密码、删除账户）。
* 对于敏感操作，应要求用户进行**重新认证**（如输入密码、2FA）。

#### ✅ 5. **PKCE (Proof Key for Code Exchange) - 增强保护 (OAuth 2.0)**

* 即使在 OAuth 2.0 Implicit Flow (使用 Fragment) 中，现代实践也强烈推荐结合 **PKCE** (读作 “pixy”)。
* **作用：**

- 防止 **授权码注入攻击**（即使攻击者截获了 `code` 或 `token`，也无法使用它）。
- 为公共客户端（如 SPA）提供类似客户端密钥的保护。

* **流程简述：**

1. App 在发起授权请求前，生成一个高熵的临时密钥 `code_verifier`。
2. App 对 `code_verifier` 进行哈希（SHA-256）得到 `code_challenge`。
3. App 在重定向到认证中心时带上 `code_challenge` 和使用的哈希方法（`code_challenge_method=S256`）。
4. 认证中心存储 `code_challenge`。
5. App 在获取 Token (无论是通过 Fragment 还是后端通道) 时，必须在请求中包含原始的 `code_verifier`。
6. 认证中心对收到的 `code_verifier` 进行相同的哈希计算，并与存储的 `code_challenge` 比对。匹配才发放 Token。

***

### 🎯 总结：URL Fragment 传输 JWT 的安全观

* **“明文可见” ≠ “不安全”**：Fragment 传输的核心安全价值在于**避免 Token 通过网络传输到服务器端导致日志泄露**。这是一种有意识的安全权衡。
* **风险可控**：通过**短时效 Token、严格的前端安全实践（CSP、防 XSS）、立即清除 URL 中的 Token、PKCE、限制 Token 权限**等措施，可以将其风险控制在可接受范围内，尤其对于中低敏感度的应用。
* **并非万能/最安全**：对于**极高安全性要求**的应用（如金融、医疗）或**无法保证客户端环境安全**（如公共电脑）的场景：
  * **首选方案应该是 OAuth 2.0 Authorization Code Flow with PKCE + 后端处理。** Token 完全不暴露给前端或仅通过安全的 HTTP-Only Cookie 传输。
  * 避免在 Fragment 中传输长期有效的 Token 或高权限 Token。

***

### 📌 最佳实践建议

1. **优先考虑 Authorization Code Flow + PKCE：** 这是 OAuth 2.0 安全最佳实践的当前标准，**强烈推荐**用于 SPA 和移动应用。它完全避免了 Token 出现在 URL 中。
2. **如果必须使用 Implicit Flow / Fragment 传输：**
   * **设置极短的 Access Token 过期时间** (e.g., 5-30 分钟)。
   * **务必实现 PKCE**。
   * **前端立即清除 URL Fragment：** 在获取 Token 后，使用 `window.history.replaceState({}, document.title, window.location.pathname + window.location.search);` 清除 `#` 部分。
   * **将 Token 存储在 **`sessionStorage`** 而非 **`localStorage`**。**
   * **实施严格的 CSP 策略。**
   * **仔细审查和配置前端错误监控工具。**
   * **限制 Token 的权限范围 (**`scope`**)。**
3. **绝对避免使用 Query Parameter (**`?token=`**) 传输敏感 Token！** 其服务器端泄露风险远大于 Fragment 的客户端可见风险。

**结论：** URL Fragment 传输 JWT 有其固有的“可见性”安全风险，但通过一系列设计权衡和严格的安全措施（尤其是短时效+PKCE+前端安全），可以在满足跨域SSO需求的同时，将风险控制在合理范围内。然而，对于新系统设计，**OAuth 2.0 Authorization Code Flow (with PKCE) 是更安全、更推荐的首选方案。**


> 更新: 2025-06-01 12:26:36  
> 原文: <https://www.yuque.com/viruspc/el3mi0/sugns2wsnvhtkeqt>