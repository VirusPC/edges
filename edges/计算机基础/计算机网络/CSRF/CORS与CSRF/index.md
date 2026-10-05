# CORS与CSRF

- [**CORS 和同源策略的作用**](#cors-%E5%92%8C%E5%90%8C%E6%BA%90%E7%AD%96%E7%95%A5%E7%9A%84%E4%BD%9C%E7%94%A8)
  * [**同源策略的核心限制**](#%E5%90%8C%E6%BA%90%E7%AD%96%E7%95%A5%E7%9A%84%E6%A0%B8%E5%BF%83%E9%99%90%E5%88%B6)
- [**为什么同源策略无法防止 CSRF？**](#%E4%B8%BA%E4%BB%80%E4%B9%88%E5%90%8C%E6%BA%90%E7%AD%96%E7%95%A5%E6%97%A0%E6%B3%95%E9%98%B2%E6%AD%A2-csrf)
  * [**1. 浏览器会自动携带 Cookie**](#1-%E6%B5%8F%E8%A7%88%E5%99%A8%E4%BC%9A%E8%87%AA%E5%8A%A8%E6%90%BA%E5%B8%A6-cookie)
  * [**2. CSRF 利用的是 HTTP 请求，而非 JavaScript**](#2-csrf-%E5%88%A9%E7%94%A8%E7%9A%84%E6%98%AF-http-%E8%AF%B7%E6%B1%82%E8%80%8C%E9%9D%9E-javascript)
  * [**3. CORS 允许跨域请求，但不解决 CSRF 问题**](#3-cors-%E5%85%81%E8%AE%B8%E8%B7%A8%E5%9F%9F%E8%AF%B7%E6%B1%82%E4%BD%86%E4%B8%8D%E8%A7%A3%E5%86%B3-csrf-%E9%97%AE%E9%A2%98)
- [**举例说明：CSRF 绕过同源策略**](#%E4%B8%BE%E4%BE%8B%E8%AF%B4%E6%98%8Ecsrf-%E7%BB%95%E8%BF%87%E5%90%8C%E6%BA%90%E7%AD%96%E7%95%A5)
- [**如何有效防御 CSRF？**](#%E5%A6%82%E4%BD%95%E6%9C%89%E6%95%88%E9%98%B2%E5%BE%A1-csrf)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

这是一个很好的问题！**同源策略（Same-Origin Policy）** 和 **CSRF（跨站请求伪造）** 确实都与 Web 安全相关，但它们解决的问题和作用的范围不同。即使有同源策略的保护，CSRF 仍然可能发生。下面我们来详细解释：

***

### **CORS 和同源策略的作用**

**同源策略（Same-Origin Policy）** 是浏览器的一种安全机制，它限制从一个源（Origin）加载的脚本如何与另一个源的资源进行交互。简单来说，它的作用是防止跨站脚本（XSS）或恶意站点直接读取敏感数据。

#### **同源策略的核心限制**

1. **跨域的 AJAX 请求**：
   * 如果一个页面来自 `https://example.com`，那么它不能通过 JavaScript 发起对 `https://another.com` 的跨域请求（除非目标服务器允许 CORS）。
2. **访问 DOM**：
   * 一个站点的脚本不能访问另一个站点的页面 DOM。
3. **Cookie 的发送和读取**：
   * 虽然浏览器会自动携带 Cookie，但 JavaScript 无法通过 `document.cookie` 读取跨域的 Cookie。

***

### **为什么同源策略无法防止 CSRF？**

尽管同源策略限制了跨域的 JavaScript 请求，但 **CSRF 攻击并不依赖跨域的 JavaScript 请求，而是利用浏览器的自动行为**。以下是关键点：

#### **1. 浏览器会自动携带 Cookie**

* 当用户访问目标网站（如 `https://example.com`）并登录后，浏览器会存储该网站的会话 Cookie。
* 即使用户在另一个恶意站点（如 `https://attacker.com`）上点击了一个链接或加载了一个恶意页面，浏览器仍然会自动附带用户对 `https://example.com` 的 Cookie。

#### **2. CSRF 利用的是 HTTP 请求，而非 JavaScript**

* CSRF 攻击者不需要通过 JavaScript 发起跨域请求。攻击者可以通过普通的 HTML 表单、图片、脚本标签等方式，向目标网站发送请求。
* 例如：

```html
<img src="https://example.com/api/transfer?to=attacker&amount=1000">
```

或者：

```html
<form action="https://example.com/api/transfer" method="POST">
    <input type="hidden" name="to" value="attacker">
    <input type="hidden" name="amount" value="1000">
</form>
<script>
    document.forms[0].submit();
</script>

```

这些请求会自动携带用户的 Cookie，目标网站会误以为这是用户的合法操作。

#### **3. CORS 允许跨域请求，但不解决 CSRF 问题**

* **CORS（跨域资源共享）** 是一种机制，用于放宽同源策略的限制，允许跨域的 AJAX 请求。
* 但是，CORS 主要是为了保护跨域数据的读取行为，而不是阻止 CSRF。
  * 在 CSRF 中，攻击者并不需要读取服务器的响应数据。
  * 例如，攻击者只需要发起一个转账请求，而不关心服务器返回了什么。

***

### **举例说明：CSRF 绕过同源策略**

1. **场景**：
   * 用户登录了银行网站 `https://bank.com`，并且浏览器已经存储了会话 Cookie。
   * 攻击者诱导用户访问恶意网站 `https://attacker.com`。
2. **攻击过程**：
   * 恶意网站中嵌入了如下代码：

```html
<img src="https://bank.com/transfer?to=attacker&amount=1000">
```

```
- 浏览器会自动携带 `https://bank.com` 的 Cookie，向银行服务器发送请求。
- 银行服务器收到请求后，认为这是用户的合法请求，并执行了转账操作。
```

3\. **为什么同源策略无效？**
\- **同源策略限制了跨域的 JavaScript 访问，但并不限制跨域的 HTTP 请求。**
\- 恶意代码并不需要读取银行服务器的响应数据，只需要触发请求即可。

***

### **如何有效防御 CSRF？**

由于同源策略无法完全阻止 CSRF，我们需要额外的防护手段：

1. **CSRF Token 验证**：
   * 在每次请求中，要求用户提交一个随机生成的 CSRF Token，服务器验证该 Token 是否有效。
   * 攻击者无法获取合法的 Token，因此伪造的请求会被拒绝。
2. **设置 SameSite Cookie**：
   * 设置 Cookie 的 `SameSite` 属性为 `Strict` 或 `Lax`，限制 Cookie 只在同站点请求中发送。
   * 这样可以防止恶意站点触发的跨站请求自动携带用户的 Cookie。
3. **验证请求来源**：
   * 服务器检查请求的 `Referer` 或 `Origin` 头，确保请求来源是合法的站点。
   * 如果请求来源不匹配，拒绝请求。
4. **用户确认操作**：
   * 对于高风险操作（如转账），要求用户输入密码或验证码进行二次确认。

***

### **总结**

* **同源策略** 是浏览器的一种安全机制，主要限制跨域 JavaScript 的行为，但它无法阻止 CSRF 攻击。
* **CSRF 的本质** 是利用浏览器自动附带的 Cookie 或身份认证信息，伪造用户的请求。
* 防御 CSRF 需要结合 CSRF Token、SameSite Cookie、请求来源验证等手段，确保请求的合法性。


> 更新: 2025-06-07 17:40:11  
> 原文: <https://www.yuque.com/viruspc/el3mi0/hadhokx8gcm3dbv0>