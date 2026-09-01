# cookiesToSet

- [`cookiesToSet`\*\* 的作用\*\*](#cookiestoset-%E7%9A%84%E4%BD%9C%E7%94%A8)
- [`setAll`\*\* 方法的逻辑\*\*](#setall-%E6%96%B9%E6%B3%95%E7%9A%84%E9%80%BB%E8%BE%91)
- [**为什么需要 **`cookiesToSet`**？**](#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%9C%80%E8%A6%81-cookiestoset)
- [**使用场景**](#%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

在这个代码片段中，`cookiesToSet` 是一个数组，表示需要设置到客户端的 **cookie** 数据。它的主要用途是将 Supabase 的会话信息（例如访问令牌和刷新令牌）同步到客户端，以便在后续请求中能够验证用户的身份。

### `cookiesToSet`\*\* 的作用\*\*

`cookiesToSet` 是 Supabase 的 `auth` 模块在处理用户登录、身份验证或会话刷新时生成的 cookie 数据。这些 cookie 数据通常包括：

1. `access_token`：用于验证用户身份的短期令牌。
2. `refresh_token`：用于在 `access_token` 过期时刷新令牌。
3. **其他会话相关信息**：可能包括 Supabase 的内部状态数据。

Supabase 的 `auth` 方法会自动生成这些 cookie，并通过 `setAll` 方法将它们写入到响应中。

***

### `setAll`\*\* 方法的逻辑\*\*

`setAll` 方法的功能是将 `cookiesToSet` 中的每个 cookie 设置到响应中，同时更新请求上下文中的 cookie 状态。具体来说：

1. **写入到请求的上下文：**

```javascript
cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
```

```
- 这一步是将 cookie 数据更新到当前请求的 `cookies` 对象中。
```

2\. **写入到响应的上下文：**

```javascript
cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
```

```
- 这一步是将 cookie 数据添加到 `supabaseResponse` 的响应中，以便发送给客户端。
```

***

### **为什么需要 **`cookiesToSet`**？**

Supabase 使用 cookie 来管理用户的会话状态（例如 `supabase-auth-token`）。当用户登录或刷新会话时，Supabase 可能需要更新这些 cookie。`cookiesToSet` 是 Supabase 提供的一种方式，用来描述需要更新的 cookie 数据。

在这个代码片段中，`cookiesToSet` 的主要用途是：

1. **同步会话信息到客户端：**\
   将 Supabase 的会话信息（如访问令牌和刷新令牌）写入到客户端的 cookie 中，以便后续请求可以自动携带这些信息。
2. **确保请求和响应的 cookie 状态一致：**\
   在请求和响应中都同步更新 cookie，避免状态不一致的问题。

***

### **使用场景**

* **用户登录后：**\
  当用户登录成功时，Supabase 会生成新的 `access_token` 和 `refresh_token`，并通过 `cookiesToSet` 将这些信息设置到客户端。
* **刷新令牌：**\
  如果用户的 `access_token` 过期，Supabase 会使用 `refresh_token` 请求新的令牌，并通过 `cookiesToSet` 更新客户端的 cookie。
* **身份验证：**\
  在中间件中，`supabase.auth.getUser()` 会检查当前请求的 cookie 是否包含有效的令牌。如果没有，则会触发 `cookiesToSet` 的更新。

***

### **总结**

`cookiesToSet` 是 Supabase 用来描述需要设置到客户端的 cookie 数据的数组。它的作用是：

1. 在用户登录或会话刷新时，更新客户端的 cookie。
2. 确保请求和响应的 cookie 状态一致。
3. 支持 Supabase 的认证和会话管理机制。

通过 `setAll` 方法，这些 cookie 会被写入到请求和响应中，确保客户端能够正确维护会话状态。


> 更新: 2025-08-16 13:29:44  
> 原文: <https://www.yuque.com/viruspc/el3mi0/nyh5igkqi42ffct8>