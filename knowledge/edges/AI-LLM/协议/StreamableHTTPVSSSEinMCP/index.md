# Streamable HTTP VS SSE in MCP

- [Background](#background)
- [Why](#why)
- [Benefits](#benefits)
- [SSE (Server-Sent Events)](#sse-server-sent-events)
- [Streamable HTTP](#streamable-http)
- [Summary](#summary)
- [References](#references)

---

SSE存在的问题：

* **<font style="color:rgb(25, 27, 31);">服务器必须维护长连接（Stateful）</font>**<font style="color:rgb(25, 27, 31);">。在高并发情况下会导致显著的资源消耗。（在整个 connection 的生命周期中，MCP Server 需要一直保持着这个 SSE 连接，Stateful）</font>
* **<font style="color:rgb(25, 27, 31);">服务器消息只能通过 SSE 传递</font>**<font style="color:rgb(25, 27, 31);">。造成了不必要的复杂性和开销。</font>
* **<font style="color:rgb(25, 27, 31);">基础架构兼容性</font>**<font style="color:rgb(25, 27, 31);">。架构实现复杂。许多现有的网络基础架构可能无法正确处理长期的 SSE 连接。企业防火墙可能会强制终止超时连接，导致服务不可靠</font>

Streamable如何结局：

* Streamable HTTP 相比 HTTP + SSE 具有更好的稳定性，在高并发场景下表现更优。
* Streamable HTTP 在**性能**方面相比 HTTP + SSE 具有明显优势，响应时间更短且更稳定。
* Streamable HTTP 客户端实现相比 HTTP + SSE 更简单，代码量更少，**维护成本**更低。

![1754746192702-08ebf982-cd8f-4f68-8d06-45724184d502.png](./img/ktlNYtpencnAhF4x/1754746192702-08ebf982-cd8f-4f68-8d06-45724184d502-198821.png)

### Background

Those specialized transport layers are necessary because traditional HTTP’s request-response model is inefficient for real-time AI communication. That is because plain **HTTP introduces high overhead and latency** due to frequent connection setups. In contrast, MCP requires continuous, low-latency data streams—something HTTP+SSE and Streamable HTTP are designed to handle.

### Why

MCP initially used HTTP+SSE to enable server-to-client streaming in remote scenarios. However, these [three major limitations](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/206) justified the change:

* No support for resumable streams.
* Requires the server to maintain a long-lived, highly available connection.
* Only allows server messages to be delivered via SSE.

Streamable HTTP addresses those issues. It enables stateless communication and even supports on-demand upgrades to SSE. That improves compatibility with modern infrastructure and guarantees more stable and efficient communication.

### <font style="color:rgb(31, 35, 40);">Benefits</font>

* **<font style="color:#DF2A3F;">Stateless servers are now possible</font>**<font style="color:rgb(31, 35, 40);">—eliminating the requirement for high availability long-lived connections</font>
* **<font style="color:#DF2A3F;">Plain HTTP implementation</font>**<font style="color:rgb(31, 35, 40);">—MCP can be implemented in a plain HTTP server without requiring SSE</font>
* **<font style="color:#DF2A3F;">Infrastructure compatibility</font>**<font style="color:rgb(31, 35, 40);">—it's "just HTTP," ensuring compatibility with middleware and infrastructure</font>
* **<font style="color:rgb(31, 35, 40);">Backwards compatibility</font>**<font style="color:rgb(31, 35, 40);">—this is an incremental evolution of our current transport</font>
* **<font style="color:rgb(31, 35, 40);">Flexible upgrade path</font>**<font style="color:rgb(31, 35, 40);">—servers can choose to use SSE for streaming responses when needed</font>

### <font style="color:rgb(31, 35, 40);">SSE (Server-Sent Events)</font>

**<font style="color:rgb(31, 35, 40);">SSE (Server-Sent Events) </font>**<font style="color:rgb(31, 35, 40);">is a mechanism that allows web clients to receive automatic updates from a server. Those updates are known as “events,” and are sent over a single, long-lived </font><font style="color:#DF2A3F;">HTTP</font><font style="color:rgb(31, 35, 40);"> connection.</font>

<font style="color:rgb(31, 35, 40);"></font>

<font style="color:rgb(31, 35, 40);">Unlike WebSockets, SSE is</font><font style="color:#DF2A3F;"> unidirectional,</font><font style="color:rgb(31, 35, 40);"> meaning that data flows only from the server to the client. SSE works by the server sending a stream of events over this open connection, typically formatted as text/event-streamMIME type.</font>

![1754744641946-0a525cfe-dff8-428a-8b94-57a428fb0560.png](./img/ktlNYtpencnAhF4x/1754744641946-0a525cfe-dff8-428a-8b94-57a428fb0560-816502.png)

The server must provide two endpoints:

* An SSE GET endpoint for clients to establish a connection and receive messages from the server.
* A regular HTTP POST endpoint for clients to send JSON-RPC messages to the server.

有点像https，https也是分两次。https从上往下：应用层http，加密层tls/ssl，传输层TCP。先通过TLS/SSL协议握手来建立安全连接，传入对称加密密钥；再。

PS：https是http的一种实现方式（http补充了tls/ssl层，但请求方法和数据格式没变），sse是基于http的一种独立的协议（定义了自己的通信规则和行为）。

When a client connects, the server must send an endpoint event containing a URI that the client will use to send messages.\*\* All client JSON-RPC messages are then sent as HTTP POST requests to this URI. \*\*服务端需要返回一个URI。

<font style="color:rgb(31, 35, 40);"></font>

<font style="color:rgb(48, 59, 69);">These are the main pros and cons of using SSE in MCP:\ </font><font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Streaming large results</font>**<font style="color:rgb(48, 59, 69);">: Allows sending partial results immediately, avoiding delays while MCP tools process large data or wait for external API responses.\ </font><font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Event-driven triggers</font>**<font style="color:rgb(48, 59, 69);">: Supports unsolicited server events to notify clients about changes, with alerts or status updates.\ </font><font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Simplicity</font>**<font style="color:rgb(48, 59, 69);">: Uses standard HTTP, requiring no special protocols or complex setup.</font>

<font style="color:rgb(48, 59, 69);">👎</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Unidirectional only</font>**<font style="color:rgb(48, 59, 69);">: Data can only flow from servers to clients in the SSE channel. Clients must use separate HTTP POST requests for sending messages.\ </font><font style="color:rgb(48, 59, 69);">👎</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Long-lived connection resource use</font>**<font style="color:rgb(48, 59, 69);">: Maintaining open connections can consume a lot of server resources, especially at scale.</font>

<font style="color:rgb(31, 35, 40);"></font>

<font style="color:rgb(51, 51, 51);">OpenAI 之所以选择 SSE，而非 WebSocket，是因为 SSE 的技术特点刚好可以契合流式应答的需求：客户端与大模型的交互是一次性的，每产生一个 token，服务端就可以给客户端推送一次，当生成内容结束时，断掉连接，</font>**<font style="color:rgb(51, 51, 51);">无需考虑客户端的存活情况</font>**<font style="color:rgb(51, 51, 51);">。</font>

<font style="color:rgb(51, 51, 51);"></font>

<font style="color:rgb(51, 51, 51);">如果采用 WebSocket 的话，服务端就需要维护的连接比较复杂，像 OpenAI 这样的服务体量，维护连接就会造成很大的服务器压力，而且，在生成内容场景下，也没有向服务端进一步发送内容，WebSocket 的双向通信在这里也是多余的。</font>

### <font style="color:rgb(31, 35, 40);">Streamable HTTP</font>

<font style="color:rgb(48, 59, 69);">ℹ️</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Extra</font>**<font style="color:rgb(48, 59, 69);">: Why streamable HTTP + optional SSE instead of WebSockets?</font>

1. <font style="color:rgb(48, 59, 69);">Using WebSockets for simple, stateless RPC calls adds unnecessary network and operational overhead.</font>
2. <font style="color:rgb(48, 59, 69);">Browsers cannot attach headers like</font><font style="color:rgb(48, 59, 69);"> </font><code><font style="color:rgb(48, 59, 69);">Authorization</font></code><font style="color:rgb(48, 59, 69);"> </font><font style="color:rgb(48, 59, 69);">to WebSockets, and unlike SSE, WebSockets cannot be reimplemented with standard HTTP tools.</font>
3. [<font style="color:rgb(61, 127, 252);">WebSocket upgrades</font>](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Protocol_upgrade_mechanism)<font style="color:rgb(48, 59, 69);"> only work with GET requests, making POST-based flows complex and slower due to required upgrade steps.</font>

<font style="color:rgb(48, 59, 69);">无状态问题、Authorization问题、POST请求问题</font>

<font style="color:rgb(48, 59, 69);"></font>

<font style="color:rgb(48, 59, 69);"> It uses standard HTTP POST and GET requests for communication.</font>

<font style="color:rgb(48, 59, 69);"></font>

![1754745447233-356a4fe1-3a38-4abd-b376-fbb5f2975c1d.png](./img/ktlNYtpencnAhF4x/1754745447233-356a4fe1-3a38-4abd-b376-fbb5f2975c1d-984171.png)

<font style="color:rgb(48, 59, 69);">These are the key advantages of using Streamable HTTP in MCP:</font>\ <font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Stateless servers supported</font>**<font style="color:rgb(48, 59, 69);">: Removes the need for always-on, long-lived connections.</font>\ <font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Plain HTTP</font>**<font style="color:rgb(48, 59, 69);">: Can be implemented using any standard HTTP server without requiring SSE.</font>\ <font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Infrastructure-friendly</font>**<font style="color:rgb(48, 59, 69);">: Compatible with common HTTP middleware, </font>[<font style="color:rgb(61, 127, 252);">proxies</font>](https://brightdata.com/blog/proxy-101/what-is-proxy-server)<font style="color:rgb(48, 59, 69);">, and hosting platforms.</font>\ <font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Backward compatible</font>**<font style="color:rgb(48, 59, 69);">: Builds incrementally on the previous HTTP+SSE transport.</font>\ <font style="color:rgb(48, 59, 69);">👍</font><font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">Optional streaming</font>**<font style="color:rgb(48, 59, 69);">: Servers can upgrade to SSE for streaming responses when needed.</font>

<font style="color:rgb(48, 59, 69);"></font>

### <font style="color:rgb(48, 59, 69);">Summary</font>

| **<font style="color:rgb(48, 59, 69);">Aspect</font>** | **<font style="color:rgb(48, 59, 69);">HTTP+SSE</font>** | **<font style="color:rgb(48, 59, 69);">Streamable HTTP</font>** |
| --- | --- | --- |
| **<font style="color:rgb(48, 59, 69);">Communication type</font>** | <font style="color:rgb(48, 59, 69);">Unidirectional (Server → Client)</font> | **<font style="color:#DF2A3F;">Bidirectional</font>\*\*\*\*<font style="color:rgb(48, 59, 69);"> </font>**<font style="color:rgb(48, 59, 69);">(Client </font><font style="color:rgb(48, 59, 69);">↔</font><font style="color:rgb(48, 59, 69);"> Server via GET/POST)</font> |
| **<font style="color:rgb(48, 59, 69);">HTTP protocol usage</font>** | <font style="color:rgb(48, 59, 69);">GET for streaming, separate POST for client messages</font> | <font style="color:rgb(48, 59, 69);">Uses </font>**<font style="color:#DF2A3F;">standard HTTP</font>**<font style="color:rgb(48, 59, 69);"> </font>**<font style="color:#DF2A3F;">POST and GET</font>**<font style="color:rgb(48, 59, 69);"> from a single endpoint</font> |
| **<font style="color:rgb(48, 59, 69);">Statefulness</font>** | <font style="color:rgb(48, 59, 69);">Stateful</font> | **<font style="color:#DF2A3F;">Stateful, but supports stateless servers</font>** |
| **<font style="color:rgb(48, 59, 69);">Requires long-lived HTTP connection</font>** | <font style="color:rgb(48, 59, 69);">Yes</font> | **<font style="color:#DF2A3F;">No</font>** |
| **<font style="color:rgb(48, 59, 69);">High availability required</font>** | <font style="color:rgb(48, 59, 69);">Yes, for connection persistence</font> | <font style="color:rgb(48, 59, 69);">No, works with stateless or ephemeral servers</font> |
| **<font style="color:rgb(48, 59, 69);">Scalability</font>** | <font style="color:rgb(48, 59, 69);">Limited</font> | <font style="color:rgb(48, 59, 69);">High</font> |
| **<font style="color:rgb(48, 59, 69);">Streaming support</font>** | <font style="color:rgb(48, 59, 69);">Yes (via</font><font style="color:rgb(48, 59, 69);"> </font><code><font style="color:rgb(48, 59, 69);">text/event-stream</font></code><br/><font style="color:rgb(48, 59, 69);">)</font> | <font style="color:rgb(48, 59, 69);">Yes (via SSE as optional enhancement)</font> |
| **<font style="color:rgb(48, 59, 69);">Authentication support</font>** | <font style="color:rgb(48, 59, 69);">Yes</font> | <font style="color:rgb(48, 59, 69);">Yes</font> |
| **<font style="color:rgb(48, 59, 69);">Support for resumability and redelivery</font>** | <font style="color:rgb(48, 59, 69);">No</font> | <font style="color:rgb(48, 59, 69);">No</font> |
| **<font style="color:rgb(48, 59, 69);">Number of clients</font>** | <font style="color:rgb(48, 59, 69);">Multiple</font> | <font style="color:rgb(48, 59, 69);">Multiple</font> |
| **<font style="color:rgb(48, 59, 69);">Usage in MCP</font>** | <font style="color:rgb(48, 59, 69);">Deprecated since protocol version</font><font style="color:rgb(48, 59, 69);"> </font><code><font style="color:rgb(48, 59, 69);">2025-03-26</font></code> | <font style="color:rgb(48, 59, 69);">Introduced in protocol version</font><font style="color:rgb(48, 59, 69);"> </font><code><font style="color:rgb(48, 59, 69);">2025-03-26</font></code> |
| **<font style="color:rgb(48, 59, 69);">Backward Compatibility</font>** | <font style="color:rgb(48, 59, 69);">—</font> | <font style="color:rgb(48, 59, 69);">Fully backward compatible with SSE-based c</font> |

<font style="color:rgb(31, 35, 40);"></font>

### References

* <https://brightdata.com/blog/ai/sse-vs-streamable-http>
* <https://github.com/modelcontextprotocol/modelcontextprotocol/pull/206>
* https://zhuanlan.zhihu.com/p/1900195324611499288
* ⚡ MCP协议进化论：HTTP Streamable凭什么让Anthropic果断抛弃SSE？ - 许宏斌的文章 - 知乎

<https://zhuanlan.zhihu.com/p/1911471559861841962>


> 更新: 2025-08-09 13:32:13  
> 原文: <https://www.yuque.com/viruspc/el3mi0/rowhkuldpmrpuvea>