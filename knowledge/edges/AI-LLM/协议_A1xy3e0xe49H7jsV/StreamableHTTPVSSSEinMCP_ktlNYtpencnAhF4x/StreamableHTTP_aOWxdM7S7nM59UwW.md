# Streamable HTTP

- [**1. 核心定义**](#1-%E6%A0%B8%E5%BF%83%E5%AE%9A%E4%B9%89)
- [**2. 协议与实现**](#2-%E5%8D%8F%E8%AE%AE%E4%B8%8E%E5%AE%9E%E7%8E%B0)
  * [**SSE 的特点**](#sse-%E7%9A%84%E7%89%B9%E7%82%B9)
  * [**Streamable HTTP 的特点**](#streamable-http-%E7%9A%84%E7%89%B9%E7%82%B9)
- [**3. 关键区别**](#3-%E5%85%B3%E9%94%AE%E5%8C%BA%E5%88%AB)
- [**4. 技术选择建议**](#4-%E6%8A%80%E6%9C%AF%E9%80%89%E6%8B%A9%E5%BB%BA%E8%AE%AE)
- [**5. 示例对比**](#5-%E7%A4%BA%E4%BE%8B%E5%AF%B9%E6%AF%94)
  * [**SSE 服务器（Node.js）**](#sse-%E6%9C%8D%E5%8A%A1%E5%99%A8nodejs)
  * [**Streamable HTTP 服务器（Node.js）**](#streamable-http-%E6%9C%8D%E5%8A%A1%E5%99%A8nodejs)
- [**6. 总结**](#6-%E6%80%BB%E7%BB%93)

---

好的，用户问的是SSE和Streamable HTTP有什么区别。首先，我需要明确这两个概念的定义和用途。SSE是Server-Sent Events，属于HTML5的一部分，用于服务器向客户端推送实时事件。而Streamable HTTP可能是指HTTP流式传输，即服务器在响应中逐步发送数据，而不是一次性返回整个响应体。 接下来，我需要比较两者的异同。SSE是专为实时事件设计的，使用特定的格式和API，比如`EventSource`，支持自动重连和事件类型。而Streamable HTTP更通用，可以用于任何数据流，比如文件下载或视频流，但需要客户端手动处理流式数据。 用户可能混淆了这两个概念，或者想了解它们在实现上的差异。需要解释SSE是基于HTTP流式传输的一种特定应用，而流式HTTP本身是一个更广泛的概念。同时，要指出SSE在浏览器中的标准化支持，而流式HTTP需要开发者自行处理。 还要考虑用户可能的实际应用场景，比如实时通知适合用SSE，而大文件传输适合用流式HTTP。此外，需要提到两者的协议细节，如SSE的MIME类型和事件格式，以及流式HTTP的数据分块方式。 最后，确保回答清晰，结构合理，帮助用户理解两者的区别和适用场景。

**SSE（Server-Sent Events）** 和 **Streamable HTTP（流式 HTTP）** 都涉及服务器向客户端**持续发送数据**，但它们的**设计目标、协议规范和应用场景**有显著区别。以下是详细对比：

***

### **1. 核心定义**

| **特性** | **SSE** | **Streamable HTTP** |
| --- | --- | --- |
| **定义** | HTML5 标准的**实时事件推送协议**，专为服务器到客户端的单向通信设计。 | 通用的**HTTP 流式传输**，指服务器在响应中逐步发送数据（非一次性返回完整响应体）。 |
| **目标** | 实时推送**结构化事件**（如通知、状态更新）。 | 传输**连续数据流**（如文件下载、视频流、日志流）。 |

***

### **2. 协议与实现**

#### **SSE 的特点**

1. **协议标准**：
   * 基于 HTTP/1.1 或 HTTP/2。
   * 使用 `text/event-stream` MIME 类型。
   * 客户端通过 `EventSource` API 接收事件。
2. **数据格式**：

```plain
event: customEvent
data: {"message": "Hello, SSE!"}
id: 123
retry: 3000
```

```
- 支持事件类型（`event`）、唯一 ID（`id`）和自动重连时间（`retry`）。
```

3\. **浏览器支持**：
\- 提供原生 `EventSource` API，自动处理连接管理和事件解析。
4\. **适用场景**：
\- 实时通知（如邮件提醒、股票行情）。
\- 单向数据流（如服务器日志推送）。

#### **Streamable HTTP 的特点**

1. **协议标准**：
   * 基于 HTTP/1.1 的分块传输编码（Chunked Transfer Encoding）或 HTTP/2 的流式传输。
   * 使用任意 MIME 类型（如 `application/octet-stream`、`video/mp4`）。
2. **数据格式**：
   * 数据按需分块发送，客户端逐步接收并处理。
   * 无固定格式，需手动解析（如 JSON、二进制数据）。
3. **实现方式**：
   * 客户端通过 `fetch`、`XMLHttpRequest` 或自定义 HTTP 请求处理流式数据。
   * 示例（JavaScript）：

```javascript
fetch('/stream')
  .then(response => {
    const reader = response.body.getReader();
    while (true) {
      reader.read().then(({ done, value }) => {
        if (done) break;
        console.log("收到数据:", new TextDecoder().decode(value));
      });
    }
  });
```

4. **适用场景**：
   * 大文件下载（如 PDF、视频）。
   * 实时视频流或音频流。
   * 服务器生成的动态内容（如日志输出）。

***

### **3. 关键区别**

| **维度** | **SSE** | **Streamable HTTP** |
| --- | --- | --- |
| **通信方向** | 单向（服务器 → 客户端） | 单向或双向（取决于实现） |
| **协议规范** | 标准化协议（HTML5 + W3C） | 无统一规范，依赖 HTTP 分块传输或流式接口 |
| **数据结构** | 结构化事件（含事件类型、ID、重连时间等） | 无结构化数据，需手动解析 |
| **客户端 API** | 原生 `EventSource` API | 需手动处理流（如 `fetch` + `ReadableStream`） |
| **自动重连** | ✅ 支持（通过 `retry` 字段） | ❌ 需手动实现重连逻辑 |
| **兼容性** | 现代浏览器支持（IE 不支持） | 所有浏览器均支持 HTTP 流式传输 |
| **典型应用场景** | 实时通知、状态更新 | 文件下载、媒体流、动态日志 |

***

### **4. 技术选择建议**

* **选择 SSE**：
  * 需要**轻量级的实时事件推送**（如消息通知、状态监控）。
  * 希望利用浏览器原生 API 简化开发（无需手动处理流）。
  * 不需要客户端主动发送消息（纯单向通信）。
* **选择 Streamable HTTP**：
  * 需要**传输非结构化数据**（如文件、二进制流）。
  * 需要**双向通信**或复杂数据格式（如 WebSocket 替代方案）。
  * 需要兼容旧浏览器或自定义协议（如 IE 支持）。

***

### **5. 示例对比**

#### **SSE 服务器（Node.js）**

```javascript
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: new Date() })}\n\n`);
  }, 1000);
});
```

#### **Streamable HTTP 服务器（Node.js）**

```javascript
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  setInterval(() => {
    res.write(JSON.stringify({ time: new Date() }) + '\n');
  }, 1000);
});
```

***

### **6. 总结**

* **SSE 是 Streamable HTTP 的子集**：SSE 基于 HTTP 流式传输，但添加了事件格式和浏览器原生支持。
* **SSE 更适合实时事件推送**：提供结构化数据、自动重连和事件类型，简化开发。
* **Streamable HTTP 更通用**：适用于任何流式数据传输，但需要手动处理连接和数据解析。

根据需求选择合适的方案：**实时事件通知用 SSE，文件流或复杂数据用 Streamable HTTP**。


> 更新: 2025-07-11 06:31:47  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vaudtlphzi4iwcfd>