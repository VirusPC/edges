# JWT

- [应用场景](#%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF)
- [流程](#%E6%B5%81%E7%A8%8B)
- [应用](#%E5%BA%94%E7%94%A8)

---

JSON Web Token（简称 JWT）是目前最流行的跨域认证解决方案。

是一种认证授权机制。

JWT 是为了在网络应用环境间传递声明而执行的一种基于 JSON 的开放标准（RFC 7519）。JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源。比如用在用户登录上。





## 应用场景
下列场景中使用JSON Web Token是很有用的：

+ Authorization (授权) : 这是使用JWT的最常见场景。一旦用户登录，后续每个请求都将包含JWT，允许用户访问该令牌允许的路由、服务和资源。[单点登录](https://www.zhihu.com/search?q=%E5%8D%95%E7%82%B9%E7%99%BB%E5%BD%95&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A%2286937325%22%7D)是现在广泛使用的JWT的一个特性，因为它的开销很小，并且可以轻松地跨域使用。
+ Information Exchange (信息交换) : 对于安全的在各方之间传输信息而言，JSON Web Tokens无疑是一种很好的方式。因为JWT可以被签名，例如，用公钥/[私钥对](https://www.zhihu.com/search?q=%E7%A7%81%E9%92%A5%E5%AF%B9&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A%2286937325%22%7D)，你可以确定发送人就是它们所说的那个人。另外，由于签名是使用头和有效负载计算的，您还可以验证内容没有被篡改。

  
**<font style="color:#DF2A3F;">相比sesssion+cookie，最大的优势是，无状态（服务器无需保存状态）和扩展性（天然支持水平扩展、分布式、跨平台认证）。</font>**  


## 流程
<font style="color:rgb(18, 18, 18);">1.用户请求登录服务器</font>

<font style="color:rgb(18, 18, 18);">2。服务器接到请求生成一个jwt-token</font>

<font style="color:rgb(18, 18, 18);">3.把这个jwt-token发回到前端</font>

<font style="color:rgb(18, 18, 18);">4.每次请求的时候带这个token和uid</font>

<font style="color:rgb(18, 18, 18);">5.收到jwt-token首先比较对不对，完后用secret解密后再次比较内部信息对不对，是否被更改过。</font>

<font style="color:rgb(18, 18, 18);">6.认证通过就可以请求别的接口返回对应的response了。</font>

## <font style="color:rgb(18, 18, 18);">应用</font>
Supabase的鉴权



[还分不清 Cookie、Session、Token、JWT？](https://zhuanlan.zhihu.com/p/164696755)

[JWT认证中如何防止他人冒充token？ - 知乎](https://www.zhihu.com/answer/963172899)

https://zhuanlan.zhihu.com/p/86937325

[https://zhuanlan.zhihu.com/p/164696755?share_code=jOWM4qZiUYVL&utm_psn=1910145100593497123](https://zhuanlan.zhihu.com/p/164696755?share_code=jOWM4qZiUYVL&utm_psn=1910145100593497123)







> 更新: 2025-08-16 14:15:23  
> 原文: <https://www.yuque.com/viruspc/el3mi0/cpgs7x>