# SSE

- [**1. 什么是 SSE？**](#1-%E4%BB%80%E4%B9%88%E6%98%AF-sse)
- [**2. 原理与实现机制**](#2-%E5%8E%9F%E7%90%86%E4%B8%8E%E5%AE%9E%E7%8E%B0%E6%9C%BA%E5%88%B6)
  * [**客户端实现（JavaScript）**](#%E5%AE%A2%E6%88%B7%E7%AB%AF%E5%AE%9E%E7%8E%B0javascript)
  * [**服务器端实现**](#%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%AB%AF%E5%AE%9E%E7%8E%B0)
- [**3. 与 WebSocket 的对比**](#3-%E4%B8%8E-websocket-%E7%9A%84%E5%AF%B9%E6%AF%94)
- [**4. 优缺点**](#4-%E4%BC%98%E7%BC%BA%E7%82%B9)
  * [**优点**](#%E4%BC%98%E7%82%B9)
  * [**缺点**](#%E7%BC%BA%E7%82%B9)
- [**5. 实际应用中的问题与解决方案**](#5-%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E4%B8%AD%E7%9A%84%E9%97%AE%E9%A2%98%E4%B8%8E%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
  * [**常见问题**](#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
- [**6. 面试可能的问题**](#6-%E9%9D%A2%E8%AF%95%E5%8F%AF%E8%83%BD%E7%9A%84%E9%97%AE%E9%A2%98)
- [**7. 总结**](#7-%E6%80%BB%E7%BB%93)

---

好的，用户让我从面试的角度系统介绍SSE。首先，我需要明确用户的需求。他们可能是一个正在准备面试的开发者，或者是一个面试官想了解如何考察SSE相关的知识。用户之前已经问过SSE是否基于COMET协议以及SSE的提出时间，现在希望得到更全面的系统性介绍，可能用于面试中的回答或问题设计。 接下来，我需要确定SSE的核心知识点。SSE（Server-Sent Events）是HTML5的一部分，用于服务器向客户端推送事件。面试中可能涉及其原理、使用场景、与类似技术的比较、优缺点以及实际应用中的注意事项。 用户可能希望答案结构清晰，便于记忆和回答。因此，我需要将内容分为几个部分，比如定义、原理、使用场景、与WebSocket等的对比、优缺点、实际应用中的问题及解决方法等。 同时，用户可能希望了解面试官可能会问的问题，比如如何实现一个SSE服务器，或者如何处理连接中断的情况。因此，在回答中可以加入一些常见的面试问题及示例代码，帮助用户更好地准备。 还需要注意区分SSE与其他技术如COMET、WebSocket的不同之处，这是面试中常见的比较点。要强调SSE的单向通信特点，以及它适合的场景，比如实时通知、数据监控等。 另外，用户可能对SSE的兼容性和性能优化感兴趣，比如如何处理高并发连接，或者如何在不支持的浏览器中降级处理。这部分内容也是面试中可能涉及的内容。 最后，要确保回答准确且全面，避免遗漏关键点，同时用简洁的语言表达，便于理解和记忆。可能需要检查是否有最新的标准或变化，但根据之前的资料，SSE的标准在2013年就已经确定，后续没有重大变更，所以可以放心引用。

在面试中系统介绍 **SSE（Server-Sent Events）** 时，可以从以下几个方面展开，结合技术细节、应用场景和与其他技术的对比，体现你的深度理解：

***

### **1. 什么是 SSE？**

SSE 是 HTML5 提供的一种**服务器向客户端推送实时事件**的通信协议，属于 **单向通信**（服务器 → 客户端）。

* **核心目标**：通过 HTTP 长连接持续发送事件流（如文本、JSON），替代传统的轮询或 COMET 技术。
* **典型场景**：实时通知（如邮件提醒）、数据监控（如股票行情）、日志流等。

***

### **2. 原理与实现机制**

#### **客户端实现（JavaScript）**

* **API**：使用 `EventSource` 对象建立连接。

```javascript
const eventSource = new EventSource("https://example.com/updates");
eventSource.onmessage = function(event) {
  console.log("收到服务器消息:", event.data);
};
```

* **事件类型**：
  * `onmessage`：默认事件（`data` 字段触发）。
  * 自定义事件：服务器通过 `event:` 字段定义，客户端监听 `addEventListener`。

```javascript
eventSource.addEventListener("customEvent", function(event) {
  console.log("自定义事件数据:", event.data);
});
```

#### **服务器端实现**

* **响应格式**：返回 \*\*MIME 类型为 \*\*`text/event-stream` 的文本流。

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

* **事件格式**：

```plain
event: customEvent
data: {"message": "Hello, SSE!"}
id: 12345
retry: 3000  // 自动重连时间（毫秒）
```

* **代码示例（Node.js）**：

```javascript
app.get("/updates", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 每隔 1 秒发送事件
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: new Date() })}\n\n`);
  }, 1000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});
```

***

### **3. 与 WebSocket 的对比**

| 特性 | **SSE** | **WebSocket** |
| --- | --- | --- |
| **通信方向** | 单向（服务器 → 客户端） | 双向（客户端 ↔ 服务器） |
| **协议基础** | HTTP/1.1 | 自定义协议（通常基于 TCP） |
| **标准化程度** | W3C 标准（HTML5） | IETF 标准 |
| **自动重连** | ✅ 支持（通过 `retry` 字段） | ❌ 需手动实现 |
| **数据格式** | 纯文本（需手动解析 JSON/XML） | 二进制或文本（灵活） |
| **适用场景** | 实时通知、日志流 | 聊天、在线游戏、双向控制 |

***

### **4. 优缺点**

#### **优点**

1. **简单易用**：基于 HTTP 协议，无需额外握手或复杂配置。
2. **自动重连**：连接中断后自动恢复（通过 `retry` 字段）。
3. **兼容性好**：现代浏览器（Chrome、Firefox、Safari）均支持。
4. **轻量级**：相比 WebSocket，协议头更小，适合低延迟场景。

#### **缺点**

1. **单向通信**：客户端无法主动向服务器发送消息。
2. **HTTP/1.1 限制**：受 Keep-Alive 和代理服务器的限制（HTTP/2 支持更好）。
3. **不支持二进制数据**：只能传输文本（需手动编码二进制为 Base64）。
4. **IE 兼容性差**：IE 不支持 SSE（需降级为轮询或使用 polyfill）。

***

### **5. 实际应用中的问题与解决方案**

#### **常见问题**

1. **连接断开**：
   * **解决方案**：服务器定期发送空事件（如 `:\n\n`）保持连接活跃。

```javascript
res.write(": keep alive\n\n");
```

2. **高并发压力**：
   * **解决方案**：使用反向代理（如 Nginx）负载均衡，或切换到 WebSocket。
3. **跨域问题**：
   * **解决方案**：服务器设置 CORS 头（`Access-Control-Allow-Origin`）。
4. **消息丢失**：
   * **解决方案**：使用 `id` 字段记录消息序号，客户端请求断点续传。

```plain
id: 123
data: { "msg": "data 123" }
```

***

### **6. 面试可能的问题**

1. **SSE 和 WebSocket 的区别？**
   * 强调单向 vs 双向、协议差异、适用场景。
2. **SSE 如何实现自动重连？**
   * 通过 `retry` 字段和 `EventSource` 的自动重连机制。
3. **SSE 的兼容性如何？**
   * 现代浏览器支持，IE 需降级处理（如轮询）。
4. **如何在 Node.js 中实现 SSE 服务器？**
   * 展示代码示例，说明设置头信息和事件格式。
5. **SSE 的性能瓶颈是什么？**
   * HTTP/1.1 的 Keep-Alive 限制、高并发连接压力。

***

### **7. 总结**

SSE 是一种 **轻量级、标准化** 的服务器推送方案，适合 **单向实时更新** 的场景。它的优势在于 **简单易用** 和 **兼容性好**，但受限于 **单向通信** 和 **HTTP 协议的局限性**。在面试中，通过结合实际代码、对比分析和场景适配，可以体现你对 SSE 的深入理解。


> 更新: 2025-07-20 15:26:08  
> 原文: <https://www.yuque.com/viruspc/el3mi0/um5pmmarqgemsf3w>