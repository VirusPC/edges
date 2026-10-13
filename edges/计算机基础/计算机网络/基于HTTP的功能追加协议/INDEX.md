# 基于HTTP的功能追加协议

- [HTTP的瓶颈](#http%E7%9A%84%E7%93%B6%E9%A2%88)
- [Ajax和XMLHttpRequest - 增强协议](#ajax%E5%92%8Cxmlhttprequest---%E5%A2%9E%E5%BC%BA%E5%8D%8F%E8%AE%AE)
  * [是什么](#%E6%98%AF%E4%BB%80%E4%B9%88)
  * [解决问题](#%E8%A7%A3%E5%86%B3%E9%97%AE%E9%A2%98)
  * [存在问题](#%E5%AD%98%E5%9C%A8%E9%97%AE%E9%A2%98)
- [Comet - 增强协议](#comet---%E5%A2%9E%E5%BC%BA%E5%8D%8F%E8%AE%AE)
  * [是什么](#%E6%98%AF%E4%BB%80%E4%B9%88-1)
  * [解决问题](#%E8%A7%A3%E5%86%B3%E9%97%AE%E9%A2%98-1)
  * [存在问题](#%E5%AD%98%E5%9C%A8%E9%97%AE%E9%A2%98-1)
- [SPDY- 改动协议](#spdy--%E6%94%B9%E5%8A%A8%E5%8D%8F%E8%AE%AE)
  * [是什么](#%E6%98%AF%E4%BB%80%E4%B9%88-2)
  * [解决问题](#%E8%A7%A3%E5%86%B3%E9%97%AE%E9%A2%98-2)
- [WebSocket - 新协议](#websocket---%E6%96%B0%E5%8D%8F%E8%AE%AE)
  * [是什么](#%E6%98%AF%E4%BB%80%E4%B9%88-3)
  * [解决问题](#%E8%A7%A3%E5%86%B3%E9%97%AE%E9%A2%98-3)
  * [特点](#%E7%89%B9%E7%82%B9)
  * [握手](#%E6%8F%A1%E6%89%8B)
  * [使用](#%E4%BD%BF%E7%94%A8)

---

# HTTP的瓶颈

1. **HTTP1.0一条TCP连接上只可发送一个请求**(chrome最大并发数为6)**，HTTP1.1服务器是按请求的顺序响应的**。
2. \*\*请求只能从客户端开始。\*\*客户端不可以接收除响应以外的指令。
3. 发送**冗长的首部**。每次互相发送相同的首部造成的浪费较多。
4. 请求/响应**首部未经压缩**就发送。首部信息越多，延迟越大。
5. **主体部分非强制压缩发送**。可任意选择数据压缩格式。

为了弥补HTTP功能上的不足，基于HTTP提出了一些新的协议。

# Ajax和XMLHttpRequest - 增强协议

## 是什么

Ajax（Asynchronous JavaScript and XML) 是一种有效利用JavaScript和DOM的操作，以达到**局部Web页面替换加载**的异步通信手段。

实现方式：Ajax是一种**技术方案**，但并**不是一种新技术**。它依赖的是现有的CSS/HTML/Javascript，而其中最核心的依赖是浏览器提供的**XMLHttpRequest**对象，是这个对象使得浏览器可以发出HTTP请求与接收HTTP响应。

所以我用一句话来总结两者的关系：**我们使用XMLHttpRequest对象来发送一个Ajax请求。**

***

你真的会使用XMLHttpRequest吗？ <https://segmentfault.com/a/1190000004322487>

***

## 解决问题

只更新局部页面，减少了响应中传输的数据量

## 存在问题

1. 利用Ajax实时地从服务器获取内容，有可能会导致大量请求产生。
2. Ajax仍未解决HTTP协议本身存在的问题。

# Comet - 增强协议

## 是什么

一旦服务器端有内容更新了，Comet不会让请求等待，而是直接给客户端返回响应。这是一种通过**延迟应答**，模拟实现服务器端向客户端推送的功能。

为了实现推送功能，Comet会先将响应置于挂起状态，当服务器端有内容更新时，再返回该响应。

## 解决问题

服务端推送功能

## 存在问题

1. 为了保留响应，一次连接的持续边长，为了维持连接需要消耗更多的资源
2. 未解决HTTP协议本身存在的问题

# SPDY- 改动协议

## 是什么

陆续出现的Ajax和Comet等提高易用性的技术，一定程度上使HTTP得到了改善，但HTTP协议本身仍存在诸多限制。为了进行根本性的改善，需要有一些**协议层面上的改动**。

SPDY没有完全改写HTTP协议，而是在TCP/IP的应用层与传输层之间通过**新加会话层**的形式运作。同时考虑到安全性问题，SPDY规定通信中**使用SSL**。

安全，多路复用，推送，压缩

## 解决问题

使用SPDY后，HTTP协议额外获得以下功能

1. 多路复用流 - 解决问题1
   1. 一个TCP连接，无限制多个HTTP请求。（http1.1的持久连接有限制，Chrome限制同域名6个）
   2. 并发，不用按顺序一一回应。
   3. 效率高。
2. 赋予请求优先级 - 问题1衍生
   1. 再发送多个请求时，解决因带宽低而导致响应变慢的问题
3. 推送功能 - 解决问题2
4. 服务器提示功能 - 问题2衍生
   1. 主动提示客户端请求所需的资源。
5. 压缩HTTP首部 - 解决问题 4

# WebSocket - 新协议

## 是什么

WebSocket，即Web**浏览器**与Web**服务器**之间的**全双工**通信标准。

一旦Web服务器与客户端之间建立起WebSocket协议的通信连接，之后所有的通信都依靠这个专用协议进行。

由于是建立在HTTP基础上的协议，因此**连接的发起方仍是客户端**。

而一旦确立WebSocket通信连接，无论是服务器还是客户端，都可直接向对方发送报文。

## 解决问题

解决了HTTP 5个瓶颈。

## 特点

1. 推送功能
   1. 支持由服务器向客户端推送数据。
   2. 举例来说，在浏览器请求HTML的时候，就提前把可能会用到的JS、CSS文件等静态资源主动发送给客户端，减少延时的等待，也就是服务器推送（Server Push, 也叫Cache Push）.
2. 减少通信量
   1. 只要建立起WebSocket连接，就希望一直保持连接状态。
   2. 和HTTP相比
      1. 每次连接的总开销减少
      2. 首部信息小，通信量减少

## 握手

两次握手：

1. 请求：需要用到HTTP的Upgrade首部字段：`Upgrade: websocket`
2. 响应：返回状态码 101 Switching Protocols， `Upgrade: websocket`

成功握手确立WebSocket连接之后，通信时不再使用HTTP的数据帧，而采用WebSocket独立的数据帧

## 使用

```javascript
const exampleSocket = new WebSocket("wss://www.example.com/socketserver", "protocolOne");
exampleSocket.send("Here's some text that the server is urgently awaiting!");
```

<https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications>


> 更新: 2025-06-03 05:59:18  
> 原文: <https://www.yuque.com/viruspc/el3mi0/nrn6gk>