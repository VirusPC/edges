# 示例

- [**1. 用户登录请求**](#1-%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95%E8%AF%B7%E6%B1%82)
  * [请求](#%E8%AF%B7%E6%B1%82)
  * [响应](#%E5%93%8D%E5%BA%94)
- [**2. Cookie 设置**](#2-cookie-%E8%AE%BE%E7%BD%AE)
- [**3. 用户状态检查请求**](#3-%E7%94%A8%E6%88%B7%E7%8A%B6%E6%80%81%E6%A3%80%E6%9F%A5%E8%AF%B7%E6%B1%82)
  * [请求](#%E8%AF%B7%E6%B1%82-1)
  * [响应](#%E5%93%8D%E5%BA%94-1)
- [**4. 刷新令牌请求**](#4-%E5%88%B7%E6%96%B0%E4%BB%A4%E7%89%8C%E8%AF%B7%E6%B1%82)
  * [请求](#%E8%AF%B7%E6%B1%82-2)
  * [响应](#%E5%93%8D%E5%BA%94-2)

---

以下是 Supabase 用户登录和认证相关的网络请求示例，展示了必要字段：

***

### **1. 用户登录请求**

当用户通过用户名和密码登录时，会发送一个 `POST` 请求到 Supabase 的认证 API。

#### 请求

**URL:**\
`POST https://<your-supabase-url>/auth/v1/token`

**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword",
  "grant_type": "password"
}
```

***

#### 响应

成功登录后，服务器会返回用户的认证信息，包括访问令牌和刷新令牌。

**Body:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.ZflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "1234567890",
    "email": "user@example.com"
  }
}
```

***

### **2. Cookie 设置**

登录成功后，Supabase 会将以下内容存储在浏览器的 cookie 中：

**Cookie 示例:**

```plain
supabase-auth-token=<access_token>.<refresh_token>;
Path=/; HttpOnly; Secure; SameSite=Lax;
```

***

### **3. 用户状态检查请求**

当调用 `supabase.auth.getUser` 时，Supabase 会向服务器发送一个请求以验证当前用户是否登录。

#### 请求

**URL:**\
`GET https://<your-supabase-url>/auth/v1/user`

**Headers:**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

#### 响应

如果用户已登录并且令牌有效：

**Body:**

```json
{
  "id": "1234567890",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "confirmed_at": "2023-08-16T09:25:00Z",
  "last_sign_in_at": "2023-08-16T09:30:00Z"
}
```

如果令牌无效或过期：

**Body:**

```json
{
  "message": "Invalid token: token expired or invalid"
}
```

***

### **4. 刷新令牌请求**

当访问令牌过期时，Supabase 会自动使用刷新令牌来获取新的访问令牌。

#### 请求

**URL:**\
`POST https://<your-supabase-url>/auth/v1/token`

**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Body:**

```json
{
  "refresh_token": "<refresh_token>",
  "grant_type": "refresh_token"
}
```

#### 响应

如果刷新令牌有效：

**Body:**

```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "expires_in": 3600,
  "token_type": "bearer"
}
```

***

这些是 Supabase 认证流程中的关键网络请求示例，展示了必要字段。


> 更新: 2025-08-16 13:26:52  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ps0el5m3mofoc2nm>