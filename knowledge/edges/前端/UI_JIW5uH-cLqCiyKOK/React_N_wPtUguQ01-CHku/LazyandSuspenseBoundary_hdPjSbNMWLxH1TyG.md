# Lazy and Suspense Boundary

- [What and Why](#what-and-why)
- [How to use](#how-to-use)
- [Application](#application)
    + [**1. 路由级代码分割（最常见场景）**](#1-%E8%B7%AF%E7%94%B1%E7%BA%A7%E4%BB%A3%E7%A0%81%E5%88%86%E5%89%B2%E6%9C%80%E5%B8%B8%E8%A7%81%E5%9C%BA%E6%99%AF)
    + [**2. 按需加载非关键组件**](#2-%E6%8C%89%E9%9C%80%E5%8A%A0%E8%BD%BD%E9%9D%9E%E5%85%B3%E9%94%AE%E7%BB%84%E4%BB%B6)
    + [**3. 动态加载第三方库**](#3-%E5%8A%A8%E6%80%81%E5%8A%A0%E8%BD%BD%E7%AC%AC%E4%B8%89%E6%96%B9%E5%BA%93)
    + [**4. 优化复杂组件的加载体验**](#4-%E4%BC%98%E5%8C%96%E5%A4%8D%E6%9D%82%E7%BB%84%E4%BB%B6%E7%9A%84%E5%8A%A0%E8%BD%BD%E4%BD%93%E9%AA%8C)
    + [**5. 结合错误边界（Error Boundaries）**](#5-%E7%BB%93%E5%90%88%E9%94%99%E8%AF%AF%E8%BE%B9%E7%95%8Cerror-boundaries)
    + [**何时不需要使用？**](#%E4%BD%95%E6%97%B6%E4%B8%8D%E9%9C%80%E8%A6%81%E4%BD%BF%E7%94%A8)
    + [**核心注意事项**](#%E6%A0%B8%E5%BF%83%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)
    + [**总结**](#%E6%80%BB%E7%BB%93)
- [References](#references)

---

# What and Why

`lazy` allows you to **load components asynchronously**, which means that the component will only be loaded when it's actually needed. This can help reduce the initial load time of your application and improve its performance. 异步加载组件，以实现code spliting和加速首屏渲染。

`Suspense` is a component that allows you to handle **asynchronous** rendering in a more graceful way. It can be used to suspend rendering of a component **until its children have finished loadng.** This can be helpful when loading large amounts of data or when loading components that have dependencies. You can use "Suspense" by wrapping your component with it and specifying a fallback component to render while the main component is loading. 在耗时的主组件加载完毕前，先用一个快速加载的组件来作为暂时的替代。lazy异步加载的组件可能比较耗时，Supsense可以在这一组件加载前先暂时展示一个替代品。

`lazy` and `Suspense` can be combined to use. They help us optimize the performance of our React applications by reducing the amount of unnecessary code that's loaded and improving the user experience during asynchronous operations.

# How to use

1. Define a **lazy** component with a a function that returns a Promise or another thenable (a Promise-like object with a then method). While the thenable will return a component。 #line4
2. Wrap the lazy component with **Suspense**, put the alternate component in fallback.

```jsx
import { useState, Suspense, lazy } from 'react';
import Loading from './Loading.js';

const MarkdownPreview = lazy(() => delayForDemo(import('./MarkdownPreview.js')));

export default function MarkdownEditor() {
  const [showPreview, setShowPreview] = useState(false);
  const [markdown, setMarkdown] = useState('Hello, **world**!');
  return (
    <>
      <textarea value={markdown} onChange={e => setMarkdown(e.target.value)} />
      <label>
        <input type="checkbox" checked={showPreview} onChange={e => setShowPreview(e.target.checked)} />
        Show preview
      </label>
      <hr />
      {showPreview && (
        <Suspense fallback={<Loading />}>
          <h2>Preview</h2>
          <MarkdownPreview markdown={markdown} />
        </Suspense>
      )}
    </>
  );
}

// Add a fixed delay so you can see the loading state
function delayForDemo(promise) {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  }).then(() => promise);
}

```

# Application

* [Next.js dynamic import ](https://nextjs.org/docs/advanced-features/dynamic-import). 动态加载。基于某些条件来动态加载组件，如用户输入或网络请求时动态加载。
* Code spliting。按需加载。
* 首屏加载时间优化。分批加载。一下子加载太多组件可能十分耗时。
* Suspense：Show Loading before a time-consuming component has loaded.

React 的 `lazy` 和 `Suspense` 主要用于 **代码分割（Code Splitting）** 和 **异步加载组件时的用户体验优化**，通常适用于以下场景：

***

### **1. 路由级代码分割（最常见场景）**

当应用包含多个路由页面时，使用 `lazy` + `Suspense` 按需加载不同路由对应的组件，**减少首屏资源体积**。

```jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const Home = lazy(() => import('./routes/Home'));
const About = lazy(() => import('./routes/About'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

**效果**：

* 用户访问 `/` 时，只加载 `Home` 组件的代码。
* 切换到 `/about` 时，再动态加载 `About` 组件的代码。

***

### **2. 按需加载非关键组件**

对于非首屏必需的组件（如弹窗、复杂图表、编辑器等），延迟加载以优化首屏性能。

```jsx
const HeavyModal = lazy(() => import('./HeavyModal'));

function Page() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Open Modal</button>
      {showModal && (
        <Suspense fallback={<div>Loading Modal...</div>}>
          <HeavyModal />
        </Suspense>
      )}
    </div>
  );
}
```

**效果**：

* 点击按钮触发弹窗时，才加载 `HeavyModal` 的代码。

***

### **3. 动态加载第三方库**

当某些第三方库体积较大且使用频率较低时（如富文本编辑器、PDF 生成库），按需加载。

```jsx
const PDFGenerator = lazy(() => import('@react-pdf/renderer'));

function ReportPage() {
  return (
    <Suspense fallback={<div>Loading PDF Generator...</div>}>
      <PDFGenerator>
        {/* PDF 内容 */}
      </PDFGenerator>
    </Suspense>
  );
}
```

***

### **4. 优化复杂组件的加载体验**

对于需要复杂计算或依赖数据的组件，显示加载状态以提升用户体验。

```jsx
const DataVisualization = lazy(() => import('./DataVisualization'));

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Spinner />}>
        <DataVisualization />
      </Suspense>
    </div>
  );
}
```

***

### **5. 结合错误边界（Error Boundaries）**

配合错误边界处理模块加载失败的情况（如网络错误）。

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return <div>Failed to load component: {error.message}</div>;
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<Spinner />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

***

### **何时不需要使用？**

* **首屏关键组件**：首屏必须的组件直接静态导入，避免加载延迟。
* **小型组件**：组件体积过小（如 <1KB）时，分割反而增加 HTTP 请求开销。
* **SSR（服务端渲染）**：`lazy` 和 `Suspense` 在服务端渲染中不生效，需结合 `loadable-components` 等库。

***

### **核心注意事项**

1. `Suspense`\*\* 必须包裹 **`lazy`** 组件\*\*：\
   每个 `lazy` 组件必须被 `Suspense` 包裹，否则会报错。
2. `fallback`\*\* 的合理性\*\*：\
   回退内容应简洁且不影响交互（如加载动画、骨架屏）。
3. **避免过度分割**：\
   过多的代码分割会增加 HTTP 请求数，可能适得其反。
4. **Webpack 魔法注释**：\
   结合 `webpackChunkName` 命名分割后的文件：

```javascript
const Home = lazy(() => import(/* webpackChunkName: "home" */ './Home'));
```

***

### **总结**

| **场景** | **实现方式** | **目标** |
| --- | --- | --- |
| 路由分割 | `React.lazy` + 路由库 | 减少首屏体积 |
| 非关键组件延迟加载 | 条件渲染 + `Suspense` | 按需加载，提升交互响应速度 |
| 第三方库动态加载 | 动态 `import` + `Suspense` | 避免主包臃肿 |
| 复杂组件加载状态管理 | `fallback` 显示加载动画 | 提升用户体验 |

合理使用 `lazy` 和 `Suspense` 可显著优化大型 React 应用的性能，但需平衡代码分割粒度和用户体验。

# References

* [lazy – React](https://react.dev/reference/react/lazy)
* [<Suspense> – React](https://react.dev/reference/react/Suspense)
* [Code-Splitting – React](https://ta.reactjs.org/docs/code-splitting.html)


> 更新: 2025-04-22 17:21:46  
> 原文: <https://www.yuque.com/viruspc/el3mi0/rv3mgexuiqh5lbi0>