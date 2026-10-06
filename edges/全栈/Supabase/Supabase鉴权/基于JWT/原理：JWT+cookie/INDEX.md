# 原理： JWT + cookie

- [原理](#%E5%8E%9F%E7%90%86)
- [Cookie 字段](#cookie-%E5%AD%97%E6%AE%B5)
- [`supabase.auth.getUser` 的工作方式](#supabaseauthgetuser-%E7%9A%84%E5%B7%A5%E4%BD%9C%E6%96%B9%E5%BC%8F)
- [总结](#%E6%80%BB%E7%BB%93)

---

是的，Supabase 的用户认证机制是基于 **JWT（JSON Web Token）** 和浏览器的 **cookie** 来实现的。具体来说，Supabase 使用 cookie 来存储用户的会话信息，以便在后续的请求中验证用户身份。

### 原理

1. 当用户登录后，Supabase 会生成一个 JWT（包括访问令牌和刷新令牌）。
2. 这些令牌会通过 HTTP 响应头或 cookie 的形式存储在客户端。
3. Supabase 的客户端库（如 `supabase-js`）会自动处理这些令牌，将它们存储在浏览器的 cookie 中，并在后续请求中自动发送给服务器。

### Cookie 字段

在浏览器中，Supabase 的认证信息主要通过以下两个 cookie 字段存储：

1. `supabase-auth-token`
   * 这是存储用户的认证令牌（JWT）的 cookie 字段。
   * 包含访问令牌和刷新令牌。
   * Supabase 客户端会自动使用这个令牌来验证用户是否登录。
2. `refresh_token`（可能存储在 `supabase-auth-token` 内部，具体实现可能有所不同）
   * 用于在访问令牌过期时刷新会话。

### `supabase.auth.getUser` 的工作方式

* 当调用 `supabase.auth.getUser` 时，Supabase 会检查当前存储在 cookie 中的 `supabase-auth-token`。
* 如果该 cookie 存在且有效，则可以通过解析 JWT 来获取用户信息，从而判断用户是否登录。
* 如果 cookie 不存在或已过期，则用户会被视为未登录。

### 总结

* Supabase 的认证机制确实基于 cookie。
* 主要的 cookie 字段是 `supabase-auth-token`，它存储了用户的 JWT（访问令牌和刷新令牌）。
* 用户名和密码不会直接存储在 cookie 中，因为这些信息通常只用于登录时验证，后续会使用 JWT 进行身份验证。

如果你需要更详细的调试，可以在浏览器开发者工具中查看 cookie 信息，找到 `supabase-auth-token` 的内容。


> 更新: 2025-08-16 13:25:03  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vumoax9382ti4tbo>