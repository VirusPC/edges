# 例子

- [**1. 跨域图片加载与 Canvas 污染**](#1-%E8%B7%A8%E5%9F%9F%E5%9B%BE%E7%89%87%E5%8A%A0%E8%BD%BD%E4%B8%8E-canvas-%E6%B1%A1%E6%9F%93)
- [**2. 跨域脚本加载与内容读取**](#2-%E8%B7%A8%E5%9F%9F%E8%84%9A%E6%9C%AC%E5%8A%A0%E8%BD%BD%E4%B8%8E%E5%86%85%E5%AE%B9%E8%AF%BB%E5%8F%96)
- [**3. 跨域字体加载（Web Fonts）**](#3-%E8%B7%A8%E5%9F%9F%E5%AD%97%E4%BD%93%E5%8A%A0%E8%BD%BDweb-fonts)
- [**4. 跨域 JSON 数据加载（直接通过 **``**）**](#4-%E8%B7%A8%E5%9F%9F-json-%E6%95%B0%E6%8D%AE%E5%8A%A0%E8%BD%BD%E7%9B%B4%E6%8E%A5%E9%80%9A%E8%BF%87-)
- [**总结**](#%E6%80%BB%E7%BB%93)
- [**场景描述**](#%E5%9C%BA%E6%99%AF%E6%8F%8F%E8%BF%B0)
- [**示例代码**](#%E7%A4%BA%E4%BE%8B%E4%BB%A3%E7%A0%81)
- [**限制表现**](#%E9%99%90%E5%88%B6%E8%A1%A8%E7%8E%B0)
- [**例外情况**](#%E4%BE%8B%E5%A4%96%E6%83%85%E5%86%B5)
- [**如何安全实现跨域数据共享**](#%E5%A6%82%E4%BD%95%E5%AE%89%E5%85%A8%E5%AE%9E%E7%8E%B0%E8%B7%A8%E5%9F%9F%E6%95%B0%E6%8D%AE%E5%85%B1%E4%BA%AB)
- [**总结**](#%E6%80%BB%E7%BB%93-1)
- [**场景说明**](#%E5%9C%BA%E6%99%AF%E8%AF%B4%E6%98%8E)
- [**方案 1：通过 iframe 嵌入跨源页面**](#%E6%96%B9%E6%A1%88-1%E9%80%9A%E8%BF%87-iframe-%E5%B5%8C%E5%85%A5%E8%B7%A8%E6%BA%90%E9%A1%B5%E9%9D%A2)
  * [**A 网站代码（接收方）**](#a-%E7%BD%91%E7%AB%99%E4%BB%A3%E7%A0%81%E6%8E%A5%E6%94%B6%E6%96%B9)
  * [**B 网站代码（发送方）**](#b-%E7%BD%91%E7%AB%99%E4%BB%A3%E7%A0%81%E5%8F%91%E9%80%81%E6%96%B9)
- [**方案 2：通过 window.open 打开新窗口**](#%E6%96%B9%E6%A1%88-2%E9%80%9A%E8%BF%87-windowopen-%E6%89%93%E5%BC%80%E6%96%B0%E7%AA%97%E5%8F%A3)
  * [**A 网站代码（接收方）**](#a-%E7%BD%91%E7%AB%99%E4%BB%A3%E7%A0%81%E6%8E%A5%E6%94%B6%E6%96%B9-1)
  * [**B 网站代码（发送方）**](#b-%E7%BD%91%E7%AB%99%E4%BB%A3%E7%A0%81%E5%8F%91%E9%80%81%E6%96%B9-1)
- [**关键安全实践**](#%E5%85%B3%E9%94%AE%E5%AE%89%E5%85%A8%E5%AE%9E%E8%B7%B5)
- [**实际应用场景**](#%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF)
- [**浏览器兼容性**](#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7)
- [**调试技巧**](#%E8%B0%83%E8%AF%95%E6%8A%80%E5%B7%A7)

---

以下是关于“跨源脚本与资源的有限访问”的具体例子及限制表现：

***

### **1. 跨域图片加载与 Canvas 污染**

* **例子**：

```html
<!-- a.com 的页面中加载 b.com 的图片 -->
<img src="https://b.com/image.jpg" id="cross-origin-img">
<canvas id="my-canvas"></canvas>
<script>
  const img = document.getElementById('cross-origin-img');
  img.onload = () => {
    const canvas = document.getElementById('my-canvas');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0); // 允许将跨域图片绘制到 Canvas
    const pixelData = ctx.getImageData(0, 0, 1, 1); // 抛出 SecurityError
  };
</script>

```

* **限制**：\
  虽然可以加载跨域图片并显示，但若尝试通过 `getImageData()` 读取像素数据，浏览器会阻止，防止恶意网站通过像素分析窃取敏感信息（如验证码图片）。
* **解决方案**：\
  服务器需为图片资源设置 CORS 头：

```http
Access-Control-Allow-Origin: https://a.com
```

***

### **2. 跨域脚本加载与内容读取**

* **例子**：

```html
<!-- a.com 的页面加载 b.com 的脚本 -->
<script src="https://b.com/script.js"></script>
<script>
  // 假设 b.com/script.js 的内容是：var secret = "123";
  console.log(secret); // 可以正常输出 "123"
</script>

```

* **看似允许**：\
  跨域脚本的内容会被执行，但其代码在全局作用域中运行，**无法被 a.com 直接提取或修改**。例如，若 `script.js` 返回纯数据（如 `{ data: "..." }`），a.com 无法直接读取该数据。
* **限制本质**：\
  跨域脚本的代码可以执行（如定义全局变量或函数），但**无法通过 JavaScript 直接读取脚本的原始文本内容**（如通过 `fetch` 获取脚本内容）。
* **绕过方法**：
  * **JSONP**：利用 `<script>` 标签的跨域能力，要求服务器返回回调函数包裹的数据：

```html
<script src="https://b.com/data?callback=handleData"></script>
<script>
  function handleData(data) { 
    console.log(data); // 接收数据 { key: "value" }
  }
</script>

```

***

### **3. 跨域字体加载（Web Fonts）**

* **例子**：

```css
/* a.com 的 CSS 中加载 b.com 的字体文件 */
@font-face {
  font-family: 'MyFont';
  src: url('https://b.com/font.woff2') format('woff2');
}
body {
  font-family: 'MyFont';
}
```

* **限制**：\
  部分浏览器默认阻止跨域字体加载，导致字体无法生效，控制台报错：

```plain
Access to font at 'https://b.com/font.woff2' from origin 'https://a.com' has been blocked by CORS policy.
```

* **解决方案**：\
  服务器需为字体文件设置 CORS 头：

```http
Access-Control-Allow-Origin: https://a.com
```

***

### **4. 跨域 JSON 数据加载（直接通过 **`<script>`**）**

* **例子**：

```html
<!-- a.com 尝试加载 b.com 的 JSON 数据 -->
<script src="https://b.com/data.json"></script>

```

```
- 假设 `data.json` 的内容是 `{ "key": "value" }`。
- **结果**：浏览器会加载该 JSON 文件，但因其不是合法的 JavaScript 语法，控制台会报语法错误，且 a.com 无法获取数据内容。
```

* **限制本质**：\
  浏览器允许跨域加载资源，但若资源内容不符合 JavaScript 语法，或未通过特定方式（如 JSONP）封装，则无法被页面直接使用。

***

### **总结**

“跨源脚本与资源的有限访问”的核心表现是：

1. **允许跨域加载资源**（如图片、脚本、字体），但**限制对资源内容的直接读取或操作**（如 Canvas 像素分析、字体文件加载）。
2. **跨域脚本可以执行**，但无法直接提取其原始内容（如字符串形式的数据）。

这些限制旨在防止恶意网站窃取跨域敏感信息，开发者需通过 CORS、JSONP 或代理等方式实现合法跨域数据交互。

以下是同源策略对数据存储限制的具体例子：

***

### **场景描述**

假设有两个不同源的网站：

* **网站A**：`https://a.com`，在 LocalStorage 中存储了用户信息。
* **网站B**：`https://b.com`，尝试通过 JavaScript 读取或修改网站A的 LocalStorage 数据。

***

### **示例代码**

1. **网站A（a.com）的代码**：

```javascript
// 在 a.com 的页面中存储数据
localStorage.setItem('userToken', 'abc123');
```

2. **网站B（b.com）的代码**：

```javascript
// 尝试读取 a.com 的 LocalStorage
try {
  const token = localStorage.getItem('userToken');
  console.log('窃取的Token:', token); // 输出：null
} catch (err) {
  console.error('错误:', err.message); 
  // 输出：SecurityError: Failed to read the 'localStorage' property from 'Window'
}
```

***

### **限制表现**

* **结果**：网站B无法读取或修改网站A的 LocalStorage 数据，浏览器会抛出安全错误。
* **原因**：浏览器严格遵守同源策略，不同源的页面（协议、域名、端口任一不同）无法直接访问彼此的客户端存储（LocalStorage、SessionStorage、IndexedDB 等）。

***

### **例外情况**

1. **同源下的子域名共享**（需主动配置）：
   * 若网站A为 `a.example.com`，网站B为 `b.example.com`，可通过设置 `document.domain = 'example.com'` 共享 Cookie，但 **LocalStorage 仍无法共享**。
   * **注意**：现代浏览器已逐步废弃 `document.domain` 的设置，推荐使用 `postMessage` 或 CORS 实现安全跨域通信。
2. **恶意攻击的防御**：
   * 如果网站B通过 XSS 漏洞注入网站A的页面代码，则可以在网站A的上下文中操作其 LocalStorage。但这属于安全漏洞，需通过输入过滤和 CSP（内容安全策略）防御。

***

### **如何安全实现跨域数据共享**

1. `postMessage`\*\* API\*\*：

```javascript
// 网站A（a.com）主动向网站B（b.com）发送数据
window.parent.postMessage({ token: 'abc123' }, 'https://b.com');

// 网站B（b.com）监听消息
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://a.com') return; // 验证来源
  console.log('接收的Token:', event.data.token); // 输出：abc123
});
```

2. **服务器代理**：
   * 网站B通过自己的服务器（b.com/api/proxy）向网站A的API发起请求，由服务器端绕过同源策略获取数据。

***

### **总结**

同源策略对数据存储的限制确保了：

* 不同网站间的客户端存储（如 LocalStorage）完全隔离，防止恶意网站窃取敏感信息。
* 开发者需通过安全的跨域通信机制（如 `postMessage`、CORS 或服务器代理）实现合法数据共享。

以下是一个完整的跨域 `postMessage` 示例，包含两个不同源的网站（A 网站和 B 网站）通过 `postMessage` 实现安全通信的代码实现：

***

### **场景说明**

* **A 网站**：`https://a.com`，作为消息接收方。
* **B 网站**：`https://b.com`，作为消息发送方。
* **目标**：B 网站通过 `postMessage` 向 A 网站发送数据，A 网站验证来源后接收数据。

***

### **方案 1：通过 iframe 嵌入跨源页面**

#### **A 网站代码（接收方）**

```html
<!-- https://a.com/page.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>A 网站（接收方）</h1>
  <iframe id="bFrame" src="https://b.com/page.html"></iframe>
  <div id="output"></div>
  <script>
    // 监听来自 iframe 的消息
    window.addEventListener('message', (event) => {
      // 关键安全步骤：验证消息来源
      if (event.origin !== 'https://b.com') {
        console.warn('拒绝来自未知源的请求:', event.origin);
        return;
      }

      // 安全处理数据
      document.getElementById('output').innerHTML = `
        收到来自 ${event.origin} 的数据：${event.data}
      `;
      console.log('接收数据:', event.data);

      // 可选：向 B 网站发送回复
      event.source.postMessage('数据已接收', event.origin);
    });
  </script>
</body>
</html>

```

#### **B 网站代码（发送方）**

```html
<!-- https://b.com/page.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>B 网站（发送方）</h1>
  <button onclick="sendMessage()">向 A 网站发送消息</button>
  <script>
    function sendMessage() {
      // 获取父窗口（A 网站）的引用
      const aWindow = window.parent;

      // 发送消息到 A 网站（指定目标源）
      aWindow.postMessage(
        { type: 'greeting', text: 'Hello from B!' }, 
        'https://a.com' // 严格限制目标源
      );
    }

    // 可选：监听来自 A 网站的回复
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://a.com') return;
      console.log('收到回复:', event.data);
    });
  </script>
</body>
</html>

```

***

### **方案 2：通过 window.open 打开新窗口**

#### **A 网站代码（接收方）**

```html
<!-- https://a.com/open.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>A 网站（接收方）</h1>
  <button onclick="openB()">打开 B 网站</button>
  <div id="output"></div>
  <script>
    let bWindow;

    function openB() {
      // 打开 B 网站并保存窗口引用
      bWindow = window.open('https://b.com/open.html');
    }

    // 监听来自 B 网站的消息
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://b.com') return;
      document.getElementById('output').innerHTML = `
        收到消息：${event.data.text}
      `;
    });
  </script>
</body>
</html>

```

#### **B 网站代码（发送方）**

```html
<!-- https://b.com/open.html -->
<!DOCTYPE html>
<html>
<body>
  <h1>B 网站（发送方）</h1>
  <button onclick="sendToA()">发送消息到 A 网站</button>
  <script>
    function sendToA() {
      // 获取打开者窗口（A 网站）的引用
      const aWindow = window.opener;

      // 发送消息到 A 网站
      aWindow.postMessage(
        { type: 'status', text: 'B 网站已加载！' },
        'https://a.com' // 严格限制目标源
      );
    }
  </script>
</body>
</html>

```

***

### **关键安全实践**

1. **验证消息来源 (**`event.origin`**)**\
   接收方必须始终检查 `event.origin`，防止恶意网站伪造消息：

```javascript
if (event.origin !== 'https://expected-domain.com') return;
```

2. \*\*指定精确的 \*\*`targetOrigin`\
   发送方使用 `postMessage(data, targetOrigin)` 时，应明确指定目标源（避免使用 `'*'`）：

```javascript
// 安全做法
otherWindow.postMessage(data, 'https://a.com');

// 危险做法（允许发送到任意源）
otherWindow.postMessage(data, '*');
```

3. **数据内容安全**
   * 避免发送敏感信息（如用户凭证）。
   * 对接收的数据进行消毒处理，防止 XSS 攻击。

***

### **实际应用场景**

* **单点登录 (SSO)**：子站点向主站传递登录状态。
* **跨域表单嵌入**：父页面与嵌入的第三方服务交互。
* **多窗口协作**：独立打开的多个应用窗口共享数据。

***

### **浏览器兼容性**

* 所有现代浏览器（Chrome、Firefox、Safari、Edge）均支持 `postMessage`。
* 不支持 IE 6/7，IE 8+ 部分支持（需 Polyfill）。

***

### **调试技巧**

1. 在浏览器控制台查看 `postMessage` 通信记录。
2. 使用 `console.log(event.data)` 打印接收的数据。
3. 检查 `event.origin` 是否符合预期。

***

通过这个示例，您可以安全地实现跨域通信，同时遵循浏览器安全策略。


> 更新: 2025-05-25 14:41:53  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lzvit0sat9tvh22a>