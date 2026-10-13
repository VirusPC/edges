# CSRF

- [什么是CSRF](#%E4%BB%80%E4%B9%88%E6%98%AFcsrf)
- [如何解决CSRF](#%E5%A6%82%E4%BD%95%E8%A7%A3%E5%86%B3csrf)
    + [客户端防范 禁止get修改数据](#%E5%AE%A2%E6%88%B7%E7%AB%AF%E9%98%B2%E8%8C%83-%E7%A6%81%E6%AD%A2get%E4%BF%AE%E6%94%B9%E6%95%B0%E6%8D%AE)
    + [服务端防范 anti-csrf-token](#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E9%98%B2%E8%8C%83-anti-csrf-token)
    + [服务端设置 SameSite Cookie](#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E8%AE%BE%E7%BD%AE-samesite-cookie)
    + [服务端验证请求来源](#%E6%9C%8D%E5%8A%A1%E7%AB%AF%E9%AA%8C%E8%AF%81%E8%AF%B7%E6%B1%82%E6%9D%A5%E6%BA%90)
    + [用户确认操作](#%E7%94%A8%E6%88%B7%E7%A1%AE%E8%AE%A4%E6%93%8D%E4%BD%9C)
- [XSS 与 CORS 区别](#xss-%E4%B8%8E-cors-%E5%8C%BA%E5%88%AB)

---

# 什么是CSRF
CSRF (Cross Site Request Forgery)攻击，中文名：跨站请求伪造。其原理是攻击者构造网站后台某个功能接口的请求地址，诱导用户去点击或者用特殊方法让该请求地址自动加载。

用户在登录状态下这个请求被服务端接收后会被误以为是用户合法的操作。对于 GET 形式的接口地址可轻易被攻击，对于 POST 形式的接口地址也不是百分百安全，攻击者可诱导用户进入带 Form 表单可用POST方式提交参数的页面。



# 如何解决CSRF
### 客户端防范 禁止get修改数据
禁止通过get修改数据库

### 服务端防范 anti-csrf-token
危险网站可以伪造一个表单并隐藏，并在自己网站的onload事件中，触发这个表单的提交事件，就可以改GET攻击为POST攻击。解决方法如下:

+ 服务端在收到页面路由请求时，生成一个随机数，在渲染请求页面时把随机数埋入页面（一般埋入 form 表单内。<input type="hidden" name="_csrf_token" value="xxxx">）
+ 服务端设置setCookie，把该随机数作为cookie或者session种入用户浏览器
+ 当用户发送 GET 或者 POST 请求时带上_csrf_token参数（对于 Form 表单直接提交即可，因为会自动把当前表单内所有的 input 提交给后台，包括_csrf_token）
+ 后台在接受到请求后解析请求的cookie获取_csrf_token的值，然后和用户请求提交的_csrf_token做个比较，如果相等表示请求是合法的。

### 服务端设置 SameSite Cookie
设置 Cookie 的 SameSite 属性为 Strict 或 Lax，限制 Cookie 只在同站点请求中发送。这样可以防止恶意站点触发的跨站请求自动携带用户的 Cookie。



SameSite Cookie 的局限性：

+ 浏览器支持问题：并非所有浏览器都完全支持 SameSite 属性，尤其是一些旧版本浏览器。
+ SameSite=Lax 的限制：如果设置为 SameSite=Lax，虽然可以防止大部分跨站请求，但仍然允许部分跨站请求（例如 GET 请求）。
+ SameSite=None 的场景：如果需要跨站共享 Cookie（如第三方服务或嵌入式内容），必须设置 SameSite=None，这可能暴露 Cookie。

### 服务端验证请求来源
跨域单点登录时，不能用same site cookie

服务器检查请求的 Referer 或 Origin 头，确保请求来源是合法的站点。如果请求来源不匹配，拒绝请求。

### 用户确认操作
对于高风险操作（如转账），要求用户输入密码或验证码进行二次确认。

# XSS 与 CORS 区别
xss：用户过分信任网站，放任来自浏览器地址栏代表的那个网站代码在自己本地任意执行。如果没有浏览器的安全机制限制，xss代码可以在用户浏览器为所欲为；



csrf：网站过分信任用户，放任来自所谓通过访问控制机制的代表合法用户的请求执行网站的某个特定功能。



[「每日一题」CSRF 是什么？](https://zhuanlan.zhihu.com/p/22521378)

[如何用简洁生动的语言说明 XSS 和 CSRF 的区别？ - 知乎](https://www.zhihu.com/answer/86209323)

### 


> 更新: 2025-06-07 18:15:12  
> 原文: <https://www.yuque.com/viruspc/el3mi0/zpgyue>