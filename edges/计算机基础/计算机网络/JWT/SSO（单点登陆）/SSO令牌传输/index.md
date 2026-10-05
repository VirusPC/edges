# SSO 令牌传输

- [🧩 方式一：前端通道传输 (Front-Channel Transfer) - 主要通过浏览器重定向](#%F0%9F%A7%A9-%E6%96%B9%E5%BC%8F%E4%B8%80%E5%89%8D%E7%AB%AF%E9%80%9A%E9%81%93%E4%BC%A0%E8%BE%93-front-channel-transfer---%E4%B8%BB%E8%A6%81%E9%80%9A%E8%BF%87%E6%B5%8F%E8%A7%88%E5%99%A8%E9%87%8D%E5%AE%9A%E5%90%91)
  * [🔍 核心步骤（以应用 App A 为例）](#%F0%9F%94%8D-%E6%A0%B8%E5%BF%83%E6%AD%A5%E9%AA%A4%E4%BB%A5%E5%BA%94%E7%94%A8-app-a-%E4%B8%BA%E4%BE%8B)
- [🍪 方式二：后端通道传输 (Back-Channel Transfer) - 通过服务器间通信 (OAuth 2.0 Authorization Code Flow)](#%F0%9F%8D%AA-%E6%96%B9%E5%BC%8F%E4%BA%8C%E5%90%8E%E7%AB%AF%E9%80%9A%E9%81%93%E4%BC%A0%E8%BE%93-back-channel-transfer---%E9%80%9A%E8%BF%87%E6%9C%8D%E5%8A%A1%E5%99%A8%E9%97%B4%E9%80%9A%E4%BF%A1-oauth-20-authorization-code-flow)
  * [🔍 核心步骤](#%F0%9F%94%8D-%E6%A0%B8%E5%BF%83%E6%AD%A5%E9%AA%A4)
- [📊 令牌传输方式对比总结](#%F0%9F%93%8A-%E4%BB%A4%E7%89%8C%E4%BC%A0%E8%BE%93%E6%96%B9%E5%BC%8F%E5%AF%B9%E6%AF%94%E6%80%BB%E7%BB%93)
- [🧠 关键结论与选择建议](#%F0%9F%A7%A0-%E5%85%B3%E9%94%AE%E7%BB%93%E8%AE%BA%E4%B8%8E%E9%80%89%E6%8B%A9%E5%BB%BA%E8%AE%AE)

---

好的，我们来**深度剖析** JWT 在单点登录 (SSO) 场景中，尤其是在涉及**跨域**时，令牌是如何安全、有效地从中央认证中心传输到各个应用的。这是整个 SSO 流程中最核心、最精妙的部分之一。

令牌传输的核心目标是：**将认证中心生成的 JWT 安全地传递给最初请求认证的客户端应用（通常是浏览器中的前端应用），并且让该应用能够使用这个 JWT 来访问它自己的后端服务（可能又是另一个域）。**

传输方式主要分为两大类，各有其适用场景和优缺点：

### 🧩 方式一：前端通道传输 (Front-Channel Transfer) - 主要通过浏览器重定向

这种方式依赖浏览器的重定向行为，令牌在应用的**前端**（浏览器 JavaScript）被接收和处理。这是**纯跨域场景**（应用域与认证中心域完全不同）下最常用的方式。

#### 🔍 核心步骤（以应用 App A 为例）

1. **App A 发起认证请求 (重定向到认证中心):**
   * 用户访问 `https://app-a.com`。
   * App A 发现用户未登录（无本地会话或有效 JWT）。
   * App A 的服务器或前端代码将用户的浏览器**重定向**到认证中心的登录 URL。**关键：** 这个重定向会包含一个 `redirect_uri` 参数，告诉认证中心登录成功后把用户送回哪里。
   * **URL 示例:** <code>https://sso.yourdomain.com/login?client_id=app_a&redirect_uri=https://app-a.com/auth-callback&state=xyz123&scope=openid...</code>
     * `client_id`: 标识 App A。
     * `redirect_uri`: **至关重要！** 指定认证成功后浏览器应被重定向回 App A 的哪个端点（通常是专门处理回调的前端路由）。
     * `state`: 随机字符串，用于防止 CSRF 攻击（认证中心会原样返回它，App A 需验证）。
     * `scope`: 请求的权限范围（如 OIDC 的 `openid`）。
2. **用户在认证中心登录:**
   * 浏览器被重定向到 `https://sso.yourdomain.com/login`。
   * 用户在此页面输入凭证（用户名/密码、MFA 等）。
   * 认证中心验证凭证，创建用户会话（通常在其域 `.yourdomain.com` 设置一个 Session Cookie）。
3. **认证中心生成 JWT:**
   * 认证成功！认证中心生成一个签名的 JWT。这个 JWT 包含：
     * `sub`: 用户唯一标识符。
     * `exp`: 过期时间。
     * `iat`: 签发时间。
     * `aud`: 受众 (Audience) - **必须设置为 **`app-a.com`** (或 **`client_id`**)**，表明这个令牌是发给 App A 用的。App A 后端必须验证此字段。
     * 其他声明（角色、权限、邮箱等）。
   * 认证中心使用私钥（非对称算法如 RS256）或共享密钥（对称算法如 HS256，需谨慎）对 JWT 签名。
4. **认证中心将 JWT 传回 App A (关键重定向):**
   * 认证中心需要将用户（连同新生成的 JWT）送回到 App A 指定的 `redirect_uri` (`https://app-a.com/auth-callback`)。
   * **传输 JWT 的具体机制 (核心差异点):**
     * **📌**\*\* 方法 1a: 通过 URL Fragment (Hash):\*\* <code>https://app-a.com/auth-callback#id_token=eyJhbGci...&access_token=eyJhbGci...&token_type=Bearer&state=xyz123</code>
       * **原理:** JWT 被附加在 URL 的 **片段标识符 (fragment)** 部分（`#` 后面的内容）。
       * **关键安全特性:**
         * **浏览器不会将 Fragment 发送到服务器！** 当浏览器加载 `https://app-a.com/auth-callback#...` 时，只有 `https://app-a.com/auth-callback` 会被发送到 App A 的服务器。`#id_token=...` 部分**完全停留在浏览器中**。
         * **防止令牌泄露:** 令牌不会出现在服务器访问日志、Referer 头中，大大降低了意外泄露的风险。
       * **App A 如何获取令牌:**
         * App A 的 `auth-callback` 页面加载后（一个简单的 HTML 页面，通常包含少量 JS）。
         * 该页面的 **前端 JavaScript** 执行 `window.location.hash` 来读取 URL 的 fragment 部分。
         * JS 解析 fragment 字符串，提取出 `id_token` (通常用于身份验证的 JWT) 和/或 `access_token` (用于访问 API 的 JWT/OAuth2 token)。
       * **优点:** 安全性高（令牌不传服务器），符合 OAuth 2.0 Implicit Flow / OpenID Connect 规范。
       * **缺点:** 令牌暴露在浏览器历史记录和可能的 JS 错误日志中；需要前端 JS 处理；不支持纯后端应用。
     * **📌**\*\* 方法 1b: 通过 URL Query Parameter (较少推荐):\*\* <code>https://app-a.com/auth-callback?id_token=eyJhbGci...&access_token=eyJhbGci...&token_type=Bearer&state=xyz123</code>
       * **原理:** JWT 被附加在 URL 的 **查询字符串 (query string)** 部分（`?` 后面的键值对）。
       * **App A 如何获取令牌:**
         * **后端获取 (主要):** 浏览器请求 `https://app-a.com/auth-callback?...` 时，完整的 URL（包括查询字符串）会被发送到 App A 的 **服务器**。服务器端代码（如 Node.js, Java, Python）可以从请求的查询参数中直接读取 `id_token` 等。
         * **前端获取 (也可):** 前端 JS 可以使用 `window.location.search` 读取查询字符串并解析。
       * **优点:** 服务器端可以直接获取令牌，便于设置 HTTP-Only Cookie。
       * **缺点:**
         * **令牌泄露风险高！** 令牌会明文出现在服务器访问日志、浏览器历史记录、Referer 头（如果用户从该页面导航到其他站点）中。**安全性是最大隐患。**
         * 不推荐在现代安全实践中作为主要方式传输敏感令牌。
5. **App A 存储和使用 JWT:**
   * **前端获取令牌后 (Fragment 方式):**
     * 前端 JS 将 JWT（通常是 `access_token`）存储在 **浏览器本地存储 (**`localStorage`\*\* 或 **`sessionStorage`**)\*\* 中。
     * 当 App A 的前端需要调用其自己的后端 API (例如 `https://api.app-a.com/data`) 时：
       1. 从存储中读取 JWT。
       2. 在发起的 **AJAX/Fetch 请求** 的 HTTP 头部手动添加 `Authorization: Bearer <JWT>`。
       3. 后端 API (`api.app-a.com`) 收到请求，验证 `Authorization` 头中的 JWT 签名和声明（如 `aud` 是否为 `api.app-a.com` 或 `app-a.com`）。
       4. **必须配置 CORS:** `api.app-a.com` 的响应头必须包含 `Access-Control-Allow-Origin: https://app-a.com` 和 `Access-Control-Allow-Headers: Authorization` 等，允许来自 `app-a.com` 的跨域请求携带 `Authorization` 头。
   * **后端获取令牌后 (Query 方式):**
     * 服务器可以选择：
       * **方案 A (推荐):** 生成一个针对 `app-a.com` 域的安全的 **HTTP-Only, Secure, SameSite=Lax/Strict Cookie** 来存储 JWT。后续浏览器访问 `app-a.com` 或其子域下的 API 时会自动带上这个 Cookie。后端 API 从 Cookie 中读取 JWT 验证。**避免了前端处理令牌，更防 XSS。**
       * **方案 B:** 将 JWT 渲染到前端页面（或通过其他方式传给前端），让前端像 Fragment 方式一样存储在 `localStorage` 并使用 `Authorization` 头发送。**安全性较低。**

### 🍪 方式二：后端通道传输 (Back-Channel Transfer) - 通过服务器间通信 (OAuth 2.0 Authorization Code Flow)

这种方式主要发生在 App A 的**后端服务器**和**认证中心**之间，前端只负责传递一个临时的 `code`。这是**安全性最高**、**最推荐**的方式，尤其适用于有安全后端服务的应用（SPA + BFF 架构或传统 Web 应用）。它完美解决了前端存储令牌的安全风险。

#### 🔍 核心步骤

1. **App A 发起认证请求 (重定向到认证中心 - 带 **`code`** 请求):**
   * 同方式一的步骤 1，但 `response_type` 参数设为 `code`。
   * **URL 示例:** <code>https://sso.yourdomain.com/login?client_id=app_a&redirect_uri=https://app-a.com/auth-callback&response_type=code&state=xyz123&scope=openid...</code>
2. **用户在认证中心登录:** 同方式一步骤 2。
3. **认证中心生成授权码 (Authorization Code):**
   * 认证成功！认证中心生成一个**短时效、一次性使用**的授权码 `code`（如 `SplxlOexamplecode`）。**注意：此时认证中心还 **\_**&#x6CA1;有**\_\*\* 生成 JWT！\*\*
4. **认证中心将授权码 **`code`** 传回 App A (重定向):**
   * 认证中心重定向浏览器回 App A 的 `redirect_uri`，**将 **`code`**（和 **`state`**）作为查询参数传递**。
   * **URL 示例:** `https://app-a.com/auth-callback?code=SplxlOexamplecode&state=xyz123`
   * **安全性:** `code` 本身不是令牌，泄露风险相对较低（且短时效）。即使被截获，攻击者还需要 App A 的 `client_secret` 才能兑换令牌。
5. **App A 后端用 **`code`** 换取 JWT:**
   * **关键的后端通信:** App A 的**后端服务器** (`app-a.com`) 接收到浏览器对 `/auth-callback?code=...` 的请求。
   * App A 后端立即向认证中心的 **令牌端点 (Token Endpoint)** `https://sso.yourdomain.com/oauth2/token` 发起一个 **服务器到服务器 (Server-to-Server, S2S)** 的 **HTTPS POST** 请求。这个请求包含：
     * `grant_type=authorization_code`
     * `code=SplxlOexamplecode` (上一步收到的授权码)
     * `redirect_uri=https://app-a.com/auth-callback` (必须与请求 `code` 时使用的完全一致)
     * `client_id=app_a`
     * `client_secret=app_a_secret` **(高度机密！仅 App A 后端知道)**
   * **安全通信:** 这个请求发生在 App A 后端和认证中心后端之间，通过安全 HTTPS 连接进行。**浏览器完全看不到这个过程！**
6. **认证中心验证请求并发放 JWT:**
   * 认证中心验证 `code` 有效性、`client_id/client_secret` 是否正确、`redirect_uri` 是否匹配。
   * 验证通过后，认证中心生成所需的 **JWT(s)** (`id_token`, `access_token`, 可能还有 `refresh_token`)。
   * 认证中心将这些 **JWT** 在 HTTPS POST 的响应体（JSON 格式）中返回给 App A 的后端服务器。例如：

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "def50200examplerefreshtoken..."
}
```

7. **App A 后端处理 JWT 并建立用户会话:**
   * App A 后端收到 JWT。
   * 后端可以选择：
     * **方案 A (最安全):** 验证 JWT (`access_token` 和 `id_token` 的签名、`aud`、`exp` 等)。然后创建一个**自身域 (**`app-a.com`**) 的 Session ID**，存储在安全、HTTP-Only、Secure、SameSite 的 Cookie 中返回给浏览器。**JWT 本身不发给浏览器！** 用户会话状态完全由 App A 后端管理。
     * **方案 B:** 验证 JWT。然后设置一个自身域 (`app-a.com`) 的安全 Cookie，**直接将 **`access_token`** JWT 存储在这个 Cookie 里** (通常设为 HTTP-Only, Secure)。后端 API 直接从 Cookie 读取 JWT 验证。
     * **方案 C (较少见):** 验证 JWT。将 `access_token` 通过某种方式（如渲染到页面隐藏字段、通过安全通道如 WebSocket）传递给 App A 前端。前端将其存储在 `localStorage/sessionStorage` 中，并在调用 API 时用 `Authorization: Bearer` 头发送。**安全性低于方案 A/B。**
8. **App A 前端状态更新:**
   * 浏览器收到 App A 后端在步骤 7 设置的 Cookie（无论里面是 Session ID 还是 JWT）。
   * 前端应用感知到登录状态改变（通常通过检查 Cookie 存在或接收后端通知），更新 UI，显示用户已登录。
9. **App A 前端访问后端 API:**
   * **方案 A:** 浏览器自动在发往 `app-a.com` (或其 API 子域) 的请求中携带包含 Session ID 的 Cookie。App A 后端通过 Session ID 查找关联的用户会话信息（该信息最初由 JWT 验证后建立）。
   * **方案 B:** 浏览器自动在发往 `app-a.com` (或其 API 子域) 的请求中携带包含 `access_token` JWT 的 Cookie。App A 后端直接从 Cookie 读取并验证 JWT。
   * **方案 C:** 前端从 `localStorage` 读取 `access_token`，手动添加到 API 请求的 `Authorization: Bearer` 头中。后端验证该头中的 JWT。**需要配置 CORS。**

### 📊 令牌传输方式对比总结

| 特性 | 前端通道 (Fragment/Query) | 后端通道 (Authorization Code) |
| :--- | :--- | :--- |
| **主要参与者** | 浏览器 & 认证中心 & App A 前端 | 浏览器 & 认证中心 & **App A 前端 **\_**&#x548C;**\_\*\* 后端\*\* |
| **核心机制** | 浏览器重定向 | 浏览器重定向 + **服务器间 HTTPS POST** |
| **传输到 App A 的内容** | JWT 本身 (Fragment/Query) | \*\*临时授权码 \*\*`code` (Query) → 后端用 `code` 换 JWT |
| **JWT 暴露给浏览器？** | **是** (存储在 `localStorage` 或 URL 可见) | **通常否** (最佳实践是后端存 Session 或 JWT 在 HTTP-Only Cookie) |
| **安全性** | 中 (Fragment 较好，Query 差；易受 XSS 攻击) | **高** (`client_secret` 保护；JWT 不直接暴露给浏览器) |
| **防令牌泄露** | Fragment 方式较好 (不传服务器) | 最佳 (JWT 仅在服务器间安全传输) |
| **适用场景** | 纯 SPA (无安全后端或 BFF) | **推荐！** SPA + BFF (Backend for Frontend), 传统 Web 应用 |
| **OAuth 2.0 流程** | Implicit Grant (Fragment) | **Authorization Code Grant** |
| **OpenID Connect 支持** | 是 (OIDC Implicit Flow) | **是 (OIDC Authorization Code Flow - 最安全推荐)** |
| **CORS 需求** | 需要 (API 访问) | 需要 (如果前端需直接调用 API 且用 `Authorization` 头) |
| **复杂度** | 相对简单 (主要在浏览器端处理) | 相对复杂 (需要后端参与通信) |

### 🧠 关键结论与选择建议

1. **避免 Query Parameter 传输敏感令牌:** 除非有特殊理由且接受安全风险，否则优先选择 Fragment 或 Code Flow。
2. **Fragment 传输是纯前端跨域 SSO 的主流方案:** 它利用浏览器特性避免了令牌泄露到服务器日志/Referer，适合无后端或后端不参与认证的 SPA。但需注意 XSS 风险。
3. **Authorization Code Flow 是最安全、最推荐的现代方案:** 它通过服务器间通信安全地传输 JWT，避免了令牌暴露给浏览器（或至少存储在更安全的 HTTP-Only Cookie 中）。**这是 OAuth 2.0 / OpenID Connect 的最佳实践，尤其适用于任何有后端组件的应用。**
4. **JWT 的最终使用方式独立于传输方式:** 无论令牌如何传到 App A，App A 最终使用它访问自己的 API 时，方式（`Authorization` 头 或 Cookie）和 CORS 配置要求是相同的。
5. **认证中心的 **`aud`** 声明至关重要:** App A 的后端在验证收到的任何 JWT 时，**必须**检查 `aud` (Audience) 声明是否包含自己的标识符 (`app-a.com` 或 `api.app-a.com`)，以防止令牌被用于攻击其他应用。

理解这些传输机制的细节和权衡，是设计和实现安全、可靠、跨域单点登录系统的基石。💪


> 更新: 2025-08-16 13:49:42  
> 原文: <https://www.yuque.com/viruspc/el3mi0/sv45efs1msvvw1qb>