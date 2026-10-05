# Session vs JWT

- [**1. 核心机制对比**](#1-%E6%A0%B8%E5%BF%83%E6%9C%BA%E5%88%B6%E5%AF%B9%E6%AF%94)
- [**2. 安全性对比**](#2-%E5%AE%89%E5%85%A8%E6%80%A7%E5%AF%B9%E6%AF%94)
- [**3. 性能与扩展性**](#3-%E6%80%A7%E8%83%BD%E4%B8%8E%E6%89%A9%E5%B1%95%E6%80%A7)
- [**4. 适用场景**](#4-%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF)
- [**5. 实际应用示例**](#5-%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E7%A4%BA%E4%BE%8B)
  * [**场景 1：电商平台用户登录**](#%E5%9C%BA%E6%99%AF-1%E7%94%B5%E5%95%86%E5%B9%B3%E5%8F%B0%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95)
  * [**场景 2：跨域 API 调用**](#%E5%9C%BA%E6%99%AF-2%E8%B7%A8%E5%9F%9F-api-%E8%B0%83%E7%94%A8)
- [**6. 如何选择？**](#6-%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9)
  * [**选择 Session + Cookie 当：**](#%E9%80%89%E6%8B%A9-session--cookie-%E5%BD%93)
  * [**选择 JWT 当：**](#%E9%80%89%E6%8B%A9-jwt-%E5%BD%93)
- [**7. 安全配置建议**](#7-%E5%AE%89%E5%85%A8%E9%85%8D%E7%BD%AE%E5%BB%BA%E8%AE%AE)
  * [**Session + Cookie**](#session--cookie)
  * [**JWT**](#jwt)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

以下是 **Session+Cookie** 与 **JWT** 的详细对比，涵盖工作机制、安全性、性能、适用场景及实际应用建议：

***

### **1. 核心机制对比**

| **维度** | **Session + Cookie** | **JWT** |
| --- | --- | --- |
| **状态管理** | 服务端存储会话数据（有状态） | 客户端存储 Token（无状态） |
| **数据载体** | 仅传递 Session ID（通过 Cookie） | 传递完整用户信息（Token 自包含） |
| **传输方式** | Cookie 自动附加到请求头 | 手动添加到请求头（如 `Authorization`） |
| **依赖关系** | 依赖服务端存储（如 Redis、数据库） | 无需服务端存储，仅需验证签名 |

***

### **2. 安全性对比**

| **风险** | **Session + Cookie** | **JWT** |
| --- | --- | --- |
| **CSRF 攻击** | 需防御（依赖 Cookie 自动发送） | 无风险（需手动添加请求头） |
| **XSS 攻击** | 较低（Session ID 可设为 HttpOnly） | 较高（若 Token 存于 LocalStorage） |
| **数据篡改** | 安全（敏感数据在服务端） | 依赖签名（需防弱算法或密钥泄露） |
| **会话劫持** | 需保护 Session ID（如 HTTPS + Secure） | 需保护 Token（如 HTTPS + 短期有效期） |

***

### **3. 性能与扩展性**

| **维度** | **Session + Cookie** | **JWT** |
| --- | --- | --- |
| **服务端负载** | 每次请求需查询 Session 数据（高并发压力大） | 无状态，直接解析 Token（扩展性强） |
| **网络开销** | 低（仅传输 Session ID） | 较高（Token 体积大，尤其携带多声明） |
| **跨域支持** | 需配置 CORS 和 SameSite 策略 | 天然支持（适合微服务/SPA） |
| **会话控制** | 灵活（可主动注销、踢人） | 需结合黑名单或短有效期（被动失效） |

***

### **4. 适用场景**

| **场景** | **Session + Cookie** | **JWT** |
| --- | --- | --- |
| **传统 Web 应用** | 适合（如 PHP、Java EE、Rails） | 较少使用（除非需跨域） |
| **SPA/移动端** | 需处理跨域 Cookie（配置复杂） | 适合（无状态 API 认证） |
| **微服务架构** | 需共享 Session 存储（如 Redis 集群） | 适合（各服务独立验证 Token） |
| **单点登录(SSO)** | 需中央认证服务（如 CAS） | 适合（JWT 跨域传递用户信息） |

***

### **5. 实际应用示例**

#### **场景 1：电商平台用户登录**

* **Session + Cookie**：
  * 用户登录后，服务端生成 Session 存储购物车和订单状态。
  * Cookie 自动传递 Session ID，适用于频繁查询用户状态的场景。
* **JWT**：
  * 用户登录后返回 JWT，前端存储在 LocalStorage。
  * 每次请求 API 携带 Token，适合订单提交等低频敏感操作（需短期 Token）。

#### **场景 2：跨域 API 调用**

* **Session + Cookie**：
  * 需配置 CORS 允许 `a.com` 访问 `api.com`，并设置 `withCredentials: true`。
  * 可能因浏览器隐私策略（如 Safari ITP）受限。
* **JWT**：
  * 前端直接调用 `api.com/data`，请求头添加 `Authorization: Bearer <JWT>`。
  * 无跨域限制，适合独立前端（如 React/Vue）对接后端 API。

***

### **6. 如何选择？**

#### **选择 Session + Cookie 当：**

* 需要精准控制会话生命周期（如强制下线用户）。
* 涉及敏感操作（如支付、权限变更），依赖服务端实时状态。
* 项目为传统单体架构，无需跨域协作。

#### **选择 JWT 当：**

* 系统为分布式架构（如微服务、Serverless）。
* 需支持多端（Web、App、第三方）统一认证。
* 追求无状态扩展性，避免服务端存储瓶颈。

***

### **7. 安全配置建议**

#### **Session + Cookie**

```http
Set-Cookie: session_id=abc123; 
  HttpOnly;      // 防 XSS
  Secure;        // 仅 HTTPS
  SameSite=Lax;  // 平衡 CSRF 防御与用户体验
  Max-Age=3600;  // 合理有效期
```

#### **JWT**

* **签名算法**：使用 HS256（对称密钥）或 RS256（非对称密钥）。
* **有效期**：设置短过期时间（如 15 分钟）+ 刷新 Token 机制。
* **存储**：优先存于 HttpOnly Cookie（而非 LocalStorage）。
* **加密**：敏感数据用 JWE（JSON Web Encryption）加密。

***

### **总结**

| **方案** | **优势** | **劣势** |
| --- | --- | --- |
| **Session + Cookie** | 精准控制会话、安全性高 | 扩展性差、跨域复杂 |
| **JWT** | 无状态、跨域友好、适合分布式 | 无法主动撤销、需防范 Token 泄露 |

**最终建议**：

* **传统 Web 应用**：优先 Session + Cookie（安全可控）。
* **现代分布式系统**：选择 JWT + 短期 Token + 刷新机制。
* **混合方案**：敏感操作用 Session，跨域 API 用 JWT，结合业务需求灵活设计。


> 更新: 2025-05-25 17:19:57  
> 原文: <https://www.yuque.com/viruspc/el3mi0/wuinofqdygwk7skn>