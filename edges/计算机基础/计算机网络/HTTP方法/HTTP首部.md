# HTTP 首部

- [报文首部](#%E6%8A%A5%E6%96%87%E9%A6%96%E9%83%A8)
  * [首部字段组成](#%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5%E7%BB%84%E6%88%90)
    + [请求行](#%E8%AF%B7%E6%B1%82%E8%A1%8C)
    + [状态行](#%E7%8A%B6%E6%80%81%E8%A1%8C)
    + [请求首部字段](#%E8%AF%B7%E6%B1%82%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5)
    + [响应首部字段](#%E5%93%8D%E5%BA%94%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5)
    + [通用首部字段](#%E9%80%9A%E7%94%A8%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5)
    + [实体首部字段:](#%E5%AE%9E%E4%BD%93%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5)
    + [为Cookie服务的首部字段](#%E4%B8%BAcookie%E6%9C%8D%E5%8A%A1%E7%9A%84%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5)
    + [其他首部字段](#%E5%85%B6%E4%BB%96%E9%A6%96%E9%83%A8%E5%AD%97%E6%AE%B5)
  * [端到端首部与逐条首部](#%E7%AB%AF%E5%88%B0%E7%AB%AF%E9%A6%96%E9%83%A8%E4%B8%8E%E9%80%90%E6%9D%A1%E9%A6%96%E9%83%A8)
- [报文主体](#%E6%8A%A5%E6%96%87%E4%B8%BB%E4%BD%93)
- [场景](#%E5%9C%BA%E6%99%AF)
  * [发送多种数据的多部分对象](#%E5%8F%91%E9%80%81%E5%A4%9A%E7%A7%8D%E6%95%B0%E6%8D%AE%E7%9A%84%E5%A4%9A%E9%83%A8%E5%88%86%E5%AF%B9%E8%B1%A1)
  * [范围请求](#%E8%8C%83%E5%9B%B4%E8%AF%B7%E6%B1%82)
  * [内容协商](#%E5%86%85%E5%AE%B9%E5%8D%8F%E5%95%86)

---

![1646655511551-27f15a11-84a5-4e3b-abf6-c39178a7727d.png](./img/OjLDsJ2q9LBI6cYo/1646655511551-27f15a11-84a5-4e3b-abf6-c39178a7727d-617161.png)

# 报文首部

## 首部字段组成

### 请求行

1. `方法 URI（path+查询参数） 协议版本` 例：`POST /form/entry HTTP/1.1`
2. 不会包含url fragment (hash)。jwt利用了这一点避免token泄露给服务端。

### 状态行

1. `协议版本 状态码 状态码的原因短语`例：`HTTP/1.1 200 OK`

### 请求首部字段

1. 标记来源（CORS相关）
   1. Origin
      1. 客户端的域。仅包含协议、主机名和端口号，不包含路径信息，用于标识请求的来源域。
   2. Host
      1. 请求的目标服务器的域（主机名+端口号）。与请求行中的uri共同组成完整文件路径。
      2. 唯一一个必选包含的字段。没主机名则为空。
   3. User-Agent
      1. 发起请求的浏览器和用户代理名称等信息
   4. Referer
      1. 客户端口发起请求的URI，请求页面来源。仅包含协议、主机名和端口号，不包含路径信息，用于标识请求的来源域。
   * Access-Control-Request-Method
     * **预检请求（OPTIONS）中声明实际请求的 HTTP 方法**（如 PUT、DELETE）
   * withCredentials

> 💡 实际开发中：
>
> * 配置 CORS 时依赖 `Origin`；
> * 分析流量来源用 `Referer`；
> * `Host` 由浏览器自动处理，一般无需干预。

2. Session与Cookie相关
   1. Cookie
3. Accept相关
   1. Accept
      1. 用户能够处理的媒体类型及媒体类型的相对优先级。
   2. Accept-Charset
   3. Accept-Encoding
   4. Accept-Language
4. 协商缓存相关
   1. If-Match, If-None-Match
      1. 判断请求资源的ETag是否匹配。
      2. 实体标记（ETag）是与特定资源关联的确定值。资源更新后，ETag也会随之更新。
   2. If-Modified-Since, If-Unmodified-Since
      1. 根据指定日期后，资源是否发生更新，来决定是否返回资源
      2. 响应状态码为200 OK 或304 Not Modified
   3. If-Range，Range
      1. If-Range的值可以为ETag或日期
      2. 若满足条件，根据Range进行范围查询（206 Partial Content）。否则返回整个网页
5. Jwt相关
   1. Authorization
      1. 客户端与服务器间的认证信息。jwt的token就放在这里，采用bearer认证方案。

```http
GET /api/user HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

6. XSS相关
   1. CSP。Content-Security-Policy: script-src 'self';
7. Proxy-Authorization
   1. 客户端与代理之间的认证信息。
8. Expect
   1. 告诉服务器，期望做出某种特定的行为
   2. 可以利用该首部字段，写明期望的扩展。规定只定义了100-continue这一个值
   3. 接收 100 Continue 状态码
9. From
   1. 告知服务器 使用用户代理的用户的email
10. Max-Forwards
    1. 最大转发次数
    2. 配合TRACE 或 OPTIONS使用
11. TE

### 响应首部字段

1. Location
   1. 提供重定向的URI
2. Set-Cookie
3. CORS相关
   1. Access-Control-Allow-Origin
   2. Access-Control-Allow-Methods：**声明允许的 HTTP 方法**（对预检请求响应）
   3. Access-Control-Allow-Credentials：**是否允许携带凭证**（Cookie、HTTP认证等），值为 `true` 或省略
4. Accept-Ranges
   1. 告知客户端能否处理范围请求
   2. 值为bytes或none
5. Age
   1. 代表对象在缓存代理中存储的时长，以秒为单位。
   2. 值通常接近于0。表示此对象刚刚从原始服务器获取不久。
6. ETag
   1. 资源被缓存时，可以得到唯一性标识。
   2. 仅靠URI判断资源是否相同不够（如URI相同，但文件可能修改过，与之前不一样了）。
   3. 生成方式没有统一的算法规则，由服务器决定
   4. 分为强ETag值与弱ETag值。
      1. 强：不论实体发生多么细微的变化都会改变其值
      2. 弱：只有资源发生了根本变才会改变其值。会在字段值最开始处附加`W/`
7. Proxy-Authenticate
   1. 把由Proxy Server所要求的认证信息发送个客户端。
8. WWW-Authenticate
   1. 401 Unauthorized之后的HTTP认证
9. Retry-After
   1. 告知应该多久之后再次发送请求
   2. 配合503 Service Unavailable或3XX redirect使用。
10. Server
    1. 告知HTTP服务器应用程序的信息
11. Vary
    1. 缓存控制

### 通用首部字段

1. 相同指令，根据发出方（客户端还是服务端）的不同，可能有不同语义
2. Cache-Control
   1. no-store是不缓存，no-cache是不缓存过期的资源
3. Connection
   1. 作用
      1. 控制不再转发给代理的首部字段（hop-by-hop首部），值为要删除的首部名
      2. 管理持久连接。默认Keep-Alive，关闭时值为close。配合Keep-Alive首部使用
4. Date
   1. 创建HTTP报文的时间
5. Pragma
   1. 历史遗留字段
6. Trailer
   1. 说明在报文主体后记录了哪些字段。值为字段名
   2. 可应用在HTTP/1.1分块传输编码。
7. Transfer Encoding
   1. 传输报文主体时采用的编码方式。
8. Upgrade
   1. 检测HTTP协议及其他协议，是否可以使用更高的版本进行通信
   2. 其参数值用来指定一个完全不同的通信协议（如TLS/1.0）
9. Via
   1. 追踪客户端与服务器之间的请求和响应报文的传输路径。
   2. 通常和Trace方法一起用。
10. Warning
    1. 告知用户一些缓存相关问题的警告。
    2. 从HTTP/1.0的响应首部（Retry-After）演变过来的。

### 实体首部字段:

1. Allow
   1. 通知客户端能够支持Request-URI指定资源的所有HTTP方法。
   2. 接收到不支持的HTTP方法时，会以状态码 405 Method Not Allowed 作为响应返回。与此同时，还会把所有能支持的HTTP方法写入首部字段Allow后返回。
2. Content-Encoding
3. Content-Language
4. Content-Length
5. Content-Location
6. Content-MD5
7. Content-Range
8. Content-Type
9. Expires
10. Last-Modified

### 为Cookie服务的首部字段

未标准化，但得到了广泛应用

1. Set-Cookie
2. Cookie

### 其他首部字段

Http首部字段是可以自行扩展的

1. X-Frame-Options
2. X-XSS-Protection
3. DNT
4. P3P

## 端到端首部与逐条首部

1. 端到端首部：
   1. 此类别中的首部会转发给请求、响应对应的最终接收目标
   2. 必须被转发
   3. 必须保存在由缓存生成的响应中
2. 逐跳首部
   1. 只对单次转发有效
   2. 会因通过缓存或代理而不再转发
   3. 在HTTP/1.1和之后的版本中，需要提供**Connection**首部字段
   4. HTTP/1.1全部逐条字段如下：
      1. Connection
      2. Keep-Alive
      3. Proxy-Authenticate
      4. Proxy-Authorization
      5. Trailer
      6. TE
      7. Transfer-Encoding
      8. Upgrade

# 报文主体

1. 报文主体 VS 实体主体
   1. 报文：是HTTP通信中的基本单位，由8位组字节流组成。
   2. 实体: 作为请求或响应的有效载荷数据被传输，内容由实体首部和实体主体组成。
   3. **报文主体**用于**传输**请求或响应的**实体主体**。
   4. 通常报文主体等于实体主体。当传输中进行编码操作时，实体主体的内容发生变化，二者才不同。
   5. 常用内容编码：gzip, copress, deflate(zlib), identity（不进行编码）

# 场景

## 发送多种数据的多部分对象

1. **MIME**允许邮件处理文本，图片，视频等多个不同类型的数据。在MIME扩展中会使用一种称为\*\*多部分对象集合(Multipart)\*\*的方法，来容纳多种不同类型的数据。
2. 相关报文头？
   1. Content-Type：multipart/form-data
   2. Content-Type：multipart/byteranges

## 范围请求

1. 请求部分内容
2. 请求报文首部里设置Range字段。
3. 响应报文首部里有Content-Range字段。若返回成功，则返回206状态码

## 内容协商

1. 内容协商机制是指，客户端和服务端就响应的资源内容进行交涉，然后提供给客户端最为合适的资源。
2. 内容协商会以语言、字符集、编码方式等为基准判断响应的资源。
3. 相关首部字段：
   1. Accept
   2. Accept-Charset
   3. Accept-Encoding
   4. Accept-Language
   5. Content-Language
4. 内容协商有以下3种类型：
   1. 服务器驱动协商：由服务器端进行内容协商。以请求的首部字段为参考，在服务器端自动处理。
   2. 客户端驱动协商：由客户端进行内容协商。用户从网页的一个可选列表中手动选择。也包括利用js脚本在Web页面上自动进行上述选择：比如按OS的类型或浏览器类型，自行切换成PC版页面或手机版页面。
   3. 透明协商：前两者的结合体，各自进行内容协商。

#

前端需要特别注意的字段

1. **CORS 相关字段**：
   * `Origin` (请求头)
   * `Access-Control-Allow-Origin` (响应头)
   * `Access-Control-Allow-Headers` (响应头)
   * `Access-Control-Expose-Headers` (允许前端读取的自定义头)
   * Cookie
   * Access control allow credentials
   *
2. **安全相关字段**：
   * `Strict-Transport-Security` (HSTS)
   * `Content-Security-Policy` (CSP)
   * `X-Content-Type-Options: nosniff` (禁用 MIME 嗅探)
3. **缓存控制**：
   * `Cache-Control` (请求/响应)
   * `ETag` / `Last-Modified` (响应)
   * `If-Modified-Since` / `If-None-Match` (请求)

* Jwt相关


> 更新: 2025-06-10 19:13:22  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ik36iv>