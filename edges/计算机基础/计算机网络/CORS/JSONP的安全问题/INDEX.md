# JSONP的安全问题

- [**JSONP 的安全问题**](#jsonp-%E7%9A%84%E5%AE%89%E5%85%A8%E9%97%AE%E9%A2%98)
- [**解决 JSONP 的安全问题**](#%E8%A7%A3%E5%86%B3-jsonp-%E7%9A%84%E5%AE%89%E5%85%A8%E9%97%AE%E9%A2%98)
  * [**1. 使用可信的服务器**](#1-%E4%BD%BF%E7%94%A8%E5%8F%AF%E4%BF%A1%E7%9A%84%E6%9C%8D%E5%8A%A1%E5%99%A8)
  * [**2. 校验回调函数的名字**](#2-%E6%A0%A1%E9%AA%8C%E5%9B%9E%E8%B0%83%E5%87%BD%E6%95%B0%E7%9A%84%E5%90%8D%E5%AD%97)
  * [**3. 使用唯一的回调函数名字**](#3-%E4%BD%BF%E7%94%A8%E5%94%AF%E4%B8%80%E7%9A%84%E5%9B%9E%E8%B0%83%E5%87%BD%E6%95%B0%E5%90%8D%E5%AD%97)
  * [**4. 限制 JSONP 的访问范围**](#4-%E9%99%90%E5%88%B6-jsonp-%E7%9A%84%E8%AE%BF%E9%97%AE%E8%8C%83%E5%9B%B4)
  * [**5. 使用 HTTPS**](#5-%E4%BD%BF%E7%94%A8-https)
  * [**6. 替代 JSONP 的更安全方案：CORS**](#6-%E6%9B%BF%E4%BB%A3-jsonp-%E7%9A%84%E6%9B%B4%E5%AE%89%E5%85%A8%E6%96%B9%E6%A1%88cors)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

是的，**JSONP 存在安全问题**，因为它允许加载并执行跨域返回的任意 JavaScript 代码，这可能会被恶意利用。以下是常见的安全问题及解决方法：

***

### **JSONP 的安全问题**

1. **恶意代码注入**\
   如果目标服务器被攻击或不可信，返回的 JSONP 响应可能包含恶意代码。例如：

```javascript
myCallback({ "data": "safe data" });
stealSensitiveData(); // 恶意代码
```

恶意代码在浏览器中执行，可能窃取用户的敏感信息（如 `document.cookie`）。

2. **XSS 攻击（跨站脚本攻击）**\
   如果 JSONP 的 `callback` 参数被用户控制，攻击者可以构造恶意请求，执行任意代码。例如：

```html
<script src="https://api.example.com/data?callback=alert('XSS')"></script>

```

服务器将返回：

```javascript
alert('XSS');
```

3. **全局命名冲突**\
   JSONP 使用全局回调函数，如果多个请求使用相同的回调函数名字，可能导致数据覆盖或冲突。
4. **缺乏请求限制**\
   JSONP 请求没有来源验证，任何页面都可以发起 JSONP 请求，导致敏感数据泄露。

***

### **解决 JSONP 的安全问题**

#### **1. 使用可信的服务器**

* 确保只向可信的服务器发起 JSONP 请求。
* 服务器必须严格校验 `callback` 参数的合法性（如只允许字母和数字）。

#### **2. 校验回调函数的名字**

* 服务器端应对 `callback` 参数进行严格校验，避免执行恶意代码。例如：
  * 只允许合法的函数名（如字母、数字、下划线组成）。
  * 如果回调函数名字非法，可以返回错误响应。
  * 示例校验：

```python
import re

callback = request.args.get("callback")
if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', callback):
    return "Invalid callback", 400
```

#### **3. 使用唯一的回调函数名字**

* 动态生成唯一的回调函数名字，避免命名冲突。例如：

```javascript
var callbackName = "callback_" + Date.now();
window[callbackName] = function(data) {
    console.log(data);
};

var script = document.createElement("script");
script.src = `https://api.example.com/data?callback=${callbackName}`;
document.body.appendChild(script);
```

#### **4. 限制 JSONP 的访问范围**

* 服务器端可以通过 **Referer** 或 **Origin** 检查请求来源，拒绝不可信的来源发起的 JSONP 请求。
* 示例：

```python
referer = request.headers.get("Referer")
if not referer or "trusteddomain.com" not in referer:
    return "Forbidden", 403
```

#### **5. 使用 HTTPS**

* 确保 JSONP 请求和响应都通过 HTTPS 传输，防止中间人攻击（MITM）。

#### **6. 替代 JSONP 的更安全方案：CORS**

* JSONP 是一种过时的技术，建议使用 **CORS（跨域资源共享）** 来实现跨域数据请求。
* CORS 支持严格的跨域访问控制规则，并且支持多种 HTTP 方法（如 `GET`、`POST`）。
* 示例：
  * 服务器端设置 CORS 头：

```plain
Access-Control-Allow-Origin: https://trusteddomain.com
```

```
- 客户端通过 `fetch` 发起请求：
```

```javascript
fetch("https://api.example.com/data", {
    method: "GET",
    headers: {
        "Content-Type": "application/json"
    }
}).then(response => response.json())
  .then(data => console.log(data));
```

***

### **总结**

**JSONP 的安全问题：**

* 恶意代码注入
* XSS 攻击
* 全局命名冲突
* 缺乏请求限制

**解决方法：**

1. 确保服务器可信，并校验 `callback` 参数。
2. 动态生成唯一的回调函数名字。
3. 限制请求来源（Referer 或 Origin 检查）。
4. 使用 HTTPS 防止中间人攻击。
5. **推荐使用 CORS 替代 JSONP**，这是更现代且安全的跨域解决方案。

JSONP 在现代开发中已逐渐被淘汰，仅在某些旧系统中仍被使用。如果有条件，优先使用 CORS 实现跨域请求。


> 更新: 2025-06-26 02:08:24  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pn2oywt4ocslv9sm>