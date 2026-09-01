# 跨标签页通信

- [📍� 1. `window.postMessage` + `window.open` / `window.opener`](#%F0%9F%93%8D%EF%BF%BD-1-windowpostmessage--windowopen--windowopener)
- [📍 2. `BroadcastChannel API`](#%F0%9F%93%8D-2-broadcastchannel-api)
- [🗂 3. `LocalStorage` 或 `SessionStorage` + `storage` 事件](#%F0%9F%97%82-3-localstorage-%E6%88%96-sessionstorage--storage-%E4%BA%8B%E4%BB%B6)
- [🔄 4. `SharedWorker`](#%F0%9F%94%84-4-sharedworker)
- [💾 5. `IndexedDB` + 轮询/通知机制](#%F0%9F%92%BE-5-indexeddb--%E8%BD%AE%E8%AF%A2%E9%80%9A%E7%9F%A5%E6%9C%BA%E5%88%B6)
- [🛠 6. `Service Worker` + `postMessage` / `BroadcastChannel`](#%F0%9F%9B%A0-6-service-worker--postmessage--broadcastchannel)
- [📌 总结与选择建议](#%F0%9F%93%8C-%E6%80%BB%E7%BB%93%E4%B8%8E%E9%80%89%E6%8B%A9%E5%BB%BA%E8%AE%AE)

---

在 Chrome 浏览器（以及其他现代浏览器）中实现跨标签页通信主要有以下几种方式，每种方式都有其适用场景和优缺点：

### 📍� 1. `window.postMessage` + `window.open` / `window.opener`

* **原理：** 当一个标签页通过 `window.open()` 打开另一个标签页，或者一个标签页是另一个标签页通过 `window.open()` 打开的（即 `window.opener` 存在），它们可以直接互相发送消息。
* **实现：**
  * 发送方使用 `targetWindow.postMessage(message, targetOrigin)`。
  * 接收方在源窗口上监听 `message` 事件：`window.addEventListener('message', handleMessage)`。
  * 在 `handleMessage` 中检查 `event.origin` 确保来源安全，然后处理 `event.data`。
* **优点：** 直接、相对简单。
* **缺点：**
  * 需要明确的窗口引用关系（通过 `open` 打开或 `opener`）。
  * 只能与有直接关系的特定窗口通信。
  * 需要严格检查 `origin` 以防止安全风险。
* **场景：** 父窗口与它打开的子弹窗/标签页之间的通信。

### 📍 2. `BroadcastChannel API`

* **原理：** 创建一个命名频道，所有同源的标签页都可以加入该频道并通过它广播和接收消息。
* **实现：**
  * 创建频道：`const channel = new BroadcastChannel('channel_name');`
  * 发送消息：`channel.postMessage(message);`
  * 接收消息：`channel.onmessage = (event) => { console.log(event.data); };` 或 `channel.addEventListener('message', handleMessage);`
  * 关闭频道：`channel.close();` (不再需要通信时)
* **优点：**
  * 简单易用，API 直观。
  * 天然支持同源下的所有标签页（无需知道彼此存在或建立直接引用）。
* **缺点：**
  * 兼容性：IE 完全不支持，旧版浏览器可能需要 polyfill（但在 Chrome 中支持良好）。
  * 仅限同源页面。
* **场景：** 同源下任意标签页间的广播通信（如通知状态变化、同步数据）。

### 🗂 3. `LocalStorage` 或 `SessionStorage` + `storage` 事件

* **原理：** 利用 Web Storage API (`localStorage` 或 `sessionStorage`) 存储数据。当一个标签页修改了存储项时，会触发在所有其他**同源**标签页（除了触发修改的那个标签页本身）的 `window` 对象上的 `storage` 事件。
* **实现：**
  * 发送方：使用 `localStorage.setItem('key', JSON.stringify(message));` 存储数据（修改存储即触发事件）。
  * 接收方：监听 `storage` 事件：

```javascript
window.addEventListener('storage', (event) => {
  if (event.key === 'your_key') {
    const message = JSON.parse(event.newValue);
    // 处理消息
  }
});
```

* **优点：**
  * 兼容性极好（几乎所有浏览器都支持）。
  * 不需要直接的窗口引用。
* **缺点：**
  * 触发事件的标签页**不会**收到自己触发的 `storage` 事件。
  * `storage` 事件是异步的，可能会有轻微延迟。
  * 传递的数据只能是字符串，复杂对象需 `JSON.stringify/parse`。
  * 频繁修改存储可能影响性能，且受同源策略和存储大小限制。
  * `sessionStorage` 作用域更严格（仅在当前顶级窗口/标签页内共享），通常不用于跨独立标签页通信。
* **场景：** 需要兼容旧浏览器时的简单通知或小数据量同步。

### 🔄 4. `SharedWorker`

* **原理：** Shared Worker 是一种特殊类型的 Web Worker，可以被**多个**同源浏览上下文（标签页、iframe 等）共享。这些上下文可以通过 Shared Worker 作为中介进行通信。
* **实现：**
  1. **创建 Shared Worker (**`shared-worker.js`**):**

```javascript
// shared-worker.js
const ports = []; // 存储所有连接的端口
onconnect = (e) => {
  const port = e.ports[0];
  ports.push(port);
  port.onmessage = (event) => {
    // 收到一个页面的消息，广播给所有其他页面
    ports.forEach(p => {
      if (p !== port) { // 避免发回给发送者
        p.postMessage(event.data);
      }
    });
  };
};
```

```
2. **在页面中使用：**
```

```javascript
const worker = new SharedWorker('shared-worker.js');
worker.port.start(); // 必须调用 start() 建立连接
// 发送消息
worker.port.postMessage({ type: 'msg', content: 'Hello from Tab!' });
// 接收消息
worker.port.onmessage = (event) => {
  console.log('Received from another tab via worker:', event.data);
};
```

* **优点：**
  * 提供真正的中心化通信枢纽。
  * 可以在 Worker 中维护共享状态或执行复杂逻辑。
  * 通信效率较高。
* **缺点：**
  * 实现相对复杂。
  * 兼容性：IE 不支持，旧版浏览器支持有限（但在 Chrome 中支持良好）。
  * 需要处理端口连接和生命周期管理。
  * 调试可能比其它方法稍困难。
* **场景：** 需要复杂状态管理、中心化控制或高效广播的同源多标签页应用。

### 💾 5. `IndexedDB` + 轮询/通知机制

* **原理：** 使用 IndexedDB 存储共享数据。标签页可以通过：
  * **轮询：** 定期检查数据库特定位置的变化（不高效，不推荐作为首选）。
  * `BroadcastChannel`\*\* / **`postMessage`** / **`storage`** 事件：\*\* 当一个标签页修改了共享数据后，使用上述方法之一通知其他标签页“数据已更新”，其他标签页再去 IndexedDB 读取最新数据。
* **实现：** 通常结合其他通信机制（如 BroadcastChannel）来通知变化，然后用 IndexedDB 存储实际数据。
* **优点：**
  * IndexedDB 适合存储大量结构化数据。
  * 结合通知机制效率尚可。
* **缺点：**
  * 实现最复杂。
  * 纯粹的轮询效率低下。
  * IndexedDB API 相对复杂。
* **场景：** 当需要在多个标签页间共享和同步**大量结构化数据**时（如离线应用的数据同步），通常与其他通信方式（如 BroadcastChannel）配合使用。

### 🛠 6. `Service Worker` + `postMessage` / `BroadcastChannel`

* **原理：** Service Worker 作为一个运行在后台的独立线程，可以充当所有其控制的同源页面（标签页）之间的通信中心枢纽。页面可以向 Service Worker 发送消息，Service Worker 可以将消息转发给其他活动的客户端（标签页）。
* **实现：**
  1. **页面发送消息给 Service Worker:**

```javascript
// 页面中
navigator.serviceWorker.controller.postMessage({
  type: 'broadcast',
  message: 'Hello from a tab!'
});
```

```
2. **Service Worker (**`service-worker.js`**) 接收并广播消息:**
```

```javascript
// service-worker.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'broadcast') {
    // 广播给所有控制的客户端（除了发送者）
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        if (client.id !== event.source.id) { // 避免发回给发送者
          client.postMessage(event.data.message);
        }
      });
    });
  }
});
```

```
3. **页面接收来自 Service Worker 的消息:**
```

```javascript
// 页面中
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Received broadcast via SW:', event.data);
});
```

```
- _替代方案：_ Service Worker 内部也可以使用 `BroadcastChannel` 与页面通信。
```

* **优点：**
  * 中心化控制，适合后台同步、推送通知等场景。
  * Service Worker 本身是 PWA 的核心技术。
* **缺点：**
  * 实现较复杂，涉及 Service Worker 的生命周期管理。
  * 需要 HTTPS（本地开发 `localhost` 除外）。
  * 兼容性：旧版浏览器支持有限（但在现代 Chrome 中完美支持）。
* **场景：** 需要后台处理、离线支持或作为更复杂 PWA 功能一部分的跨标签页通信。

### 📌 总结与选择建议

| 方式 | 优点 | 缺点 | 典型场景 |
| :--- | :--- | :--- | :--- |
| `postMessage`\*\* + **`open` | 直接、简单 | 需窗口引用、只能特定窗口通信、需检查 origin | 父子窗口通信 |
| `BroadcastChannel` | 简单易用、支持任意同源页 | 兼容性（IE 无）、仅同源 | 同源标签页广播通知 |
| `Storage`** + **`storage`**事件** | 兼容性好、简单 | 自身不触发事件、数据量小、异步、性能考虑 | 兼容旧浏览器的简单通知/同步 |
| `SharedWorker` | 中心化、高效、可维护状态 | 实现复杂、兼容性（IE 无）、调试稍难 | 复杂状态共享/高效广播 |
| `IndexedDB`** + 通知\*\* | 存储大量结构化数据 | 实现最复杂、纯轮询效率低 | 大量结构化数据同步（配合通知） |
| `Service Worker` | 中心化、后台能力、PWA 核心 | 实现复杂、需 HTTPS、兼容性（旧浏览器有限） | PWA、后台同步、复杂广播 |

**对于大多数现代 Chrome 应用场景：**

1. **首选 **`BroadcastChannel API`**：** 简单直接，API 清晰，专门为同源页面间广播通信设计。
2. **需要兼容旧浏览器或简单通知：** 使用 `LocalStorage` + `storage` 事件。
3. **需要中心化管理复杂状态或高效广播：** 考虑 `SharedWorker`。
4. **涉及大量数据共享：** `IndexedDB` 配合 `BroadcastChannel` 或 `SharedWorker` 进行通知。
5. **在 PWA 或需要后台能力：** 利用 `Service Worker` 作为通信枢纽。
6. **特定父子窗口：** 使用 `postMessage` + `window.open`/`opener`。

**重要安全提示：** 无论使用哪种方式，务必遵守同源策略（Same-Origin Policy）。跨源通信受到严格限制。在接收消息时（尤其是 `postMessage` 和 `storage` 事件），**必须验证 **`event.origin`** 或 **`event.originalEvent.origin`** 以确保消息来自可信的来源**，以防止安全漏洞（如 XSS、CSRF）。


> 更新: 2025-06-17 14:16:15  
> 原文: <https://www.yuque.com/viruspc/el3mi0/zapm4rr03edrl30v>