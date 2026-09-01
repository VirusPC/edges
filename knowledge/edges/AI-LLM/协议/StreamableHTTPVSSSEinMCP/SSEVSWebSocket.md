# SSE VS WebSocket

* **<font style="color:rgb(51, 51, 51);">通信方向</font>**<font style="color:rgb(51, 51, 51);">：Websocket 主要是双向通信（客户端可以发消息给服务端，服务端也可以发消息给客户端），SSE 是单向通信（从服务端到客户端）。</font>
* **<font style="color:rgb(51, 51, 51);">协议基础</font>**<font style="color:rgb(51, 51, 51);">：Websocket 基于HTTP和TCP建立了一套自己的通信协议，而 SSE 则是可以理解为建立在 HTTP 通信协议基础上的一层应用协议。</font>
  * <font style="color:rgb(51, 51, 51);">WebSocket与HTTP的关系：</font>
    * <font style="color:rgb(51, 51, 51);">WebSocket的连接建立需要通过HTTP协议进行一次握手过程（称为“HTTP Upgrade”）。在这个过程中，客户端发送一个HTTP请求，要求升级到WebSocket协议。</font>
    * <font style="color:rgb(51, 51, 51);">服务端响应这个请求并确认升级后，连接从HTTP协议切换到WebSocket协议。</font>
    * <font style="color:rgb(51, 51, 51);">一旦握手完成，后续的通信完全基于TCP连接，而不再使用HTTP协议。</font>
* **<font style="color:rgb(51, 51, 51);">适用场景</font>**<font style="color:rgb(51, 51, 51);">：Websocket 通常用于长连接，SSE 更适合用在单次请求的场景。</font>

| <font style="color:rgb(51, 51, 51);">特性</font> | **SSE** | **WebSocket** |
| --- | --- | --- |
| **通信方向** | <font style="color:rgb(51, 51, 51);">单向（服务器 → 客户端）</font> | <font style="color:rgb(51, 51, 51);">双向（客户端 </font>↔<font style="color:rgb(51, 51, 51);"> 服务器）</font> |
| **协议基础** | <font style="color:rgb(51, 51, 51);">HTTP/1.1</font> | <font style="color:rgb(51, 51, 51);">自定义协议（通常基于 TCP）</font> |
| **标准化程度** | <font style="color:rgb(51, 51, 51);">W3C 标准（HTML5）</font> | <font style="color:rgb(51, 51, 51);">IETF 标准</font> |
| **自动重连** | ✅<font style="color:rgb(51, 51, 51);"> 支持（通过 </font><code><font style="color:rgb(51, 51, 51);">retry</font></code><font style="color:rgb(51, 51, 51);"> 字段）</font> | ❌<font style="color:rgb(51, 51, 51);"> 需手动实现</font> |
| **数据格式** | <font style="color:rgb(51, 51, 51);">纯文本（需手动解析 JSON/XML）</font> | <font style="color:rgb(51, 51, 51);">二进制或文本（灵活）</font> |
| **适用场景** | <font style="color:rgb(51, 51, 51);">实时通知、日志流</font> | <font style="color:rgb(51, 51, 51);">聊天、在线游戏、双向控制</font> |


> 更新: 2025-08-09 13:24:35  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pziurhebm7gix6tp>