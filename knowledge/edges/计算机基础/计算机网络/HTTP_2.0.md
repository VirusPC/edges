# HTTP/2.0

- [HTTP/2.0 与SPDY](#http20-%E4%B8%8Espdy)

---

2014年11月实现标准化。



目标是改善用户在使用Web时的速度体验。



基本上都会**先通过HTTP/1.1与TCP连接**。



# HTTP/2.0 与SPDY
<font style="color:rgb(18, 18, 18);"> HTTP/2.0 的新特点和 SPDY 很相似，其实 HTTP/2.0 本来就是基于 SPDY 设计的，可以说是 SPDY 的升级版。 但是 HTTP/2.0 仍有和 SPDY 不同的地方，主要有如下两点：</font>

1. <font style="color:rgb(18, 18, 18);">HTTP2.0 支持明文 HTTP 传输，而 SPDY 强制使用 HTTPS。 </font>
2. <font style="color:rgb(18, 18, 18);">HTTP2.0 消息头的压缩算法采用 HPACK，而非 SPDY 采用的 DEFLATE。</font>  
 



> 更新: 2022-07-30 09:05:10  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vk1cbb>