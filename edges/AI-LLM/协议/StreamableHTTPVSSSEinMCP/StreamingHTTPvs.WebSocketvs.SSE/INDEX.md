# Streaming HTTP vs. WebSocket vs. SSE

| <font style="color:rgb(23, 23, 23);">Feature</font> | <font style="color:rgb(23, 23, 23);">WebSocket</font> | <font style="color:rgb(23, 23, 23);">SSE</font> | <font style="color:rgb(23, 23, 23);">Streaming HTTP</font> |
| --- | --- | --- | --- |
| **<font style="color:rgb(23, 23, 23);">Direction</font>** | <font style="color:rgb(23, 23, 23);">Bidirectional</font> | <font style="color:rgb(23, 23, 23);">Unidirectional</font> | <font style="color:rgb(23, 23, 23);">Bidirectional or Unidirectional</font> |
| **<font style="color:rgb(23, 23, 23);">Protocol</font>** | <font style="color:rgb(23, 23, 23);">WebSocket (over TCP)</font> | <font style="color:rgb(23, 23, 23);">HTTP/1.1 or HTTP/2</font> | <font style="color:rgb(23, 23, 23);">HTTP/1.1 or HTTP/2</font> |
| **<font style="color:rgb(23, 23, 23);">Connection</font>** | <font style="color:rgb(23, 23, 23);">Persistent TCP</font> | <font style="color:rgb(23, 23, 23);">Long-lived HTTP</font> | <font style="color:rgb(23, 23, 23);">Long-lived HTTP</font> |
| **<font style="color:rgb(23, 23, 23);">Overhead</font>** | <font style="color:rgb(23, 23, 23);">Handshake, low message overhead</font> | <font style="color:rgb(23, 23, 23);">Lightweight event framing</font> | <font style="color:rgb(23, 23, 23);">HTTP headers, chunked encoding</font> |
| **<font style="color:rgb(23, 23, 23);">Client Support</font>** | <font style="color:rgb(23, 23, 23);">WebSocket libraries</font> | <code><font style="color:rgb(23, 23, 23);background-color:rgba(0, 0, 0, 0.1);">EventSource</font></code><br/><font style="color:rgb(23, 23, 23);">, HTTP clients</font> | <font style="color:rgb(23, 23, 23);">Any HTTP client</font> |
| **<font style="color:rgb(23, 23, 23);">Reconnection</font>** | <font style="color:rgb(23, 23, 23);">Manual</font> | <font style="color:rgb(23, 23, 23);">Automatic (browser)</font> | <font style="color:rgb(23, 23, 23);">Manual</font> |
| **<font style="color:rgb(23, 23, 23);">Kubernetes Use</font>** | <code><font style="color:rgb(23, 23, 23);background-color:rgba(0, 0, 0, 0.1);">exec</font></code><br/><font style="color:rgb(23, 23, 23);">,</font><font style="color:rgb(23, 23, 23);"> </font><code><font style="color:rgb(23, 23, 23);background-color:rgba(0, 0, 0, 0.1);">attach</font></code><br/><font style="color:rgb(23, 23, 23);">,</font><font style="color:rgb(23, 23, 23);"> </font><code><font style="color:rgb(23, 23, 23);background-color:rgba(0, 0, 0, 0.1);">portforward</font></code> | <font style="color:rgb(23, 23, 23);">Not used</font> | <code><font style="color:rgb(23, 23, 23);background-color:rgba(0, 0, 0, 0.1);">watch</font></code><br/><font style="color:rgb(23, 23, 23);">,</font><font style="color:rgb(23, 23, 23);"> </font><code><font style="color:rgb(23, 23, 23);background-color:rgba(0, 0, 0, 0.1);">logs</font></code> |
| **<font style="color:rgb(23, 23, 23);">Use Case</font>** | <font style="color:rgb(23, 23, 23);">Interactive sessions</font> | <font style="color:rgb(23, 23, 23);">Notifications, feeds</font> | <font style="color:rgb(23, 23, 23);">Logs, updates</font> |

PS：websocket 服务端需要维护连接

* 跟踪哪些客户端已经连接。
* 处理连接的关闭、断开和重建。
* 发送和接收消息。

When to Choose What?

* Streaming HTTP: Ideal for simple, server-to-client streaming with broad client compatibility. Use it for logs, resource monitoring, or when WebSocket isn’t feasible. Kubernetes’ watch and logs endpoints are great examples.
* WebSocket: Best for bidirectional, low-latency communication in interactive scenarios. Choose it for terminal sessions, real-time apps, or Kubernetes’ exec and portforward.
* SSE: Perfect for browser-based, server-to-client event streams with minimal setup. Use it for notifications or live feeds, though it’s less common in Kubernetes.

<https://dev.to/mechcloud_academy/streaming-http-vs-websocket-vs-sse-a-comparison-for-real-time-data-1geo>


> 更新: 2025-08-16 14:11:12  
> 原文: <https://www.yuque.com/viruspc/el3mi0/sfwvgezxi4eac74v>