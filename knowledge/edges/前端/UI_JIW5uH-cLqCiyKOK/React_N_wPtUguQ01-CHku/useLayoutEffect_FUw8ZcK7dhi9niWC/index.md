# useLayoutEffect

- [介绍](#%E4%BB%8B%E7%BB%8D)
  * [**核心特性**](#%E6%A0%B8%E5%BF%83%E7%89%B9%E6%80%A7)
    + [1. **执行时机**](#1-%E6%89%A7%E8%A1%8C%E6%97%B6%E6%9C%BA)
    + [2. **与 **`useEffect`** 的对比**](#2-%E4%B8%8E-useeffect-%E7%9A%84%E5%AF%B9%E6%AF%94)
  * [**典型使用场景**](#%E5%85%B8%E5%9E%8B%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF)
    + [1. **测量 DOM 元素**](#1-%E6%B5%8B%E9%87%8F-dom-%E5%85%83%E7%B4%A0)
    + [2. **同步更新 DOM**](#2-%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0-dom)
    + [3. **依赖布局的动画**](#3-%E4%BE%9D%E8%B5%96%E5%B8%83%E5%B1%80%E7%9A%84%E5%8A%A8%E7%94%BB)
  * [**注意事项**](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)
  * [**代码示例对比**](#%E4%BB%A3%E7%A0%81%E7%A4%BA%E4%BE%8B%E5%AF%B9%E6%AF%94)
    + [`useEffect`\*\* 导致闪烁\*\*](#useeffect-%E5%AF%BC%E8%87%B4%E9%97%AA%E7%83%81)
    + [`useLayoutEffect`\*\* 修复闪烁\*\*](#uselayouteffect-%E4%BF%AE%E5%A4%8D%E9%97%AA%E7%83%81)
  * [**总结**](#%E6%80%BB%E7%BB%93)
- [原理](#%E5%8E%9F%E7%90%86)
  * [**React 的更新流程与 **`useLayoutEffect`** 的执行**](#react-%E7%9A%84%E6%9B%B4%E6%96%B0%E6%B5%81%E7%A8%8B%E4%B8%8E-uselayouteffect-%E7%9A%84%E6%89%A7%E8%A1%8C)
  * [**为什么 **`useLayoutEffect`** 能保证执行时机？**](#%E4%B8%BA%E4%BB%80%E4%B9%88-uselayouteffect-%E8%83%BD%E4%BF%9D%E8%AF%81%E6%89%A7%E8%A1%8C%E6%97%B6%E6%9C%BA)
    + [**1. React 的提交阶段执行顺序**](#1-react-%E7%9A%84%E6%8F%90%E4%BA%A4%E9%98%B6%E6%AE%B5%E6%89%A7%E8%A1%8C%E9%A1%BA%E5%BA%8F)
    + [**2. 浏览器的事件循环与渲染流程**](#2-%E6%B5%8F%E8%A7%88%E5%99%A8%E7%9A%84%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF%E4%B8%8E%E6%B8%B2%E6%9F%93%E6%B5%81%E7%A8%8B)
    + [**3. 与 **`useEffect`** 的对比**](#3-%E4%B8%8E-useeffect-%E7%9A%84%E5%AF%B9%E6%AF%94)
  * [**执行时机的关键点**](#%E6%89%A7%E8%A1%8C%E6%97%B6%E6%9C%BA%E7%9A%84%E5%85%B3%E9%94%AE%E7%82%B9)
  * [**示例：验证执行时机**](#%E7%A4%BA%E4%BE%8B%E9%AA%8C%E8%AF%81%E6%89%A7%E8%A1%8C%E6%97%B6%E6%9C%BA)
  * [**总结**](#%E6%80%BB%E7%BB%93-1)
- [应用](#%E5%BA%94%E7%94%A8)
  * [**1. 测量 DOM 元素的布局信息**](#1-%E6%B5%8B%E9%87%8F-dom-%E5%85%83%E7%B4%A0%E7%9A%84%E5%B8%83%E5%B1%80%E4%BF%A1%E6%81%AF)
    + [**示例：动态调整元素宽度**](#%E7%A4%BA%E4%BE%8B%E5%8A%A8%E6%80%81%E8%B0%83%E6%95%B4%E5%85%83%E7%B4%A0%E5%AE%BD%E5%BA%A6)
  * [**2. 同步更新 DOM 状态**](#2-%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0-dom-%E7%8A%B6%E6%80%81)
    + [**示例：Tooltip 位置修正**](#%E7%A4%BA%E4%BE%8Btooltip-%E4%BD%8D%E7%BD%AE%E4%BF%AE%E6%AD%A3)
  * [**3. 依赖 DOM 的动画初始化**](#3-%E4%BE%9D%E8%B5%96-dom-%E7%9A%84%E5%8A%A8%E7%94%BB%E5%88%9D%E5%A7%8B%E5%8C%96)
    + [**示例：平滑过渡动画**](#%E7%A4%BA%E4%BE%8B%E5%B9%B3%E6%BB%91%E8%BF%87%E6%B8%A1%E5%8A%A8%E7%94%BB)
  * [**4. 自动滚动到元素**](#4-%E8%87%AA%E5%8A%A8%E6%BB%9A%E5%8A%A8%E5%88%B0%E5%85%83%E7%B4%A0)
    + [**示例：消息列表底部自动滚动**](#%E7%A4%BA%E4%BE%8B%E6%B6%88%E6%81%AF%E5%88%97%E8%A1%A8%E5%BA%95%E9%83%A8%E8%87%AA%E5%8A%A8%E6%BB%9A%E5%8A%A8)
  * [**5. 修复第三方库的 DOM 冲突**](#5-%E4%BF%AE%E5%A4%8D%E7%AC%AC%E4%B8%89%E6%96%B9%E5%BA%93%E7%9A%84-dom-%E5%86%B2%E7%AA%81)
    + [**示例：与 D3.js 集成**](#%E7%A4%BA%E4%BE%8B%E4%B8%8E-d3js-%E9%9B%86%E6%88%90)
  * [**何时使用 **`useEffect`** 替代？**](#%E4%BD%95%E6%97%B6%E4%BD%BF%E7%94%A8-useeffect-%E6%9B%BF%E4%BB%A3)
  * [**注意事项**](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9-1)
  * [**总结**](#%E6%80%BB%E7%BB%93-2)

---

同步版的useEffect

## 介绍

在 React 中，`useLayoutEffect` 的作用是 **在 DOM 更新后、浏览器执行绘制（Painting）之前同步执行副作用**。它的行为与 `useEffect` 类似，但触发时机不同，适用于需要直接操作 DOM 或避免视觉闪烁的场景。

***

### **核心特性**

#### 1. **执行时机**

* **DOM 更新后**：React 完成组件渲染并更新 DOM。
* **浏览器绘制前**：在浏览器将更新后的 DOM 渲染到屏幕之前同步执行。
* **同步阻塞**：会阻塞浏览器的绘制流程，直到副作用执行完成。

#### 2. **与 **`useEffect`** 的对比**

| **特性** | `useLayoutEffect` | `useEffect` |
| --- | --- | --- |
| **触发时机** | DOM 更新后，浏览器绘制前（同步） | DOM 更新后，浏览器绘制后（异步） |
| **适用场景** | 需要同步操作 DOM（如测量布局） | 无需阻塞渲染的副作用（如数据请求） |
| **视觉影响** | 避免布局抖动或闪烁 | 可能短暂显示不一致状态 |
| **性能风险** | 可能阻塞渲染，需谨慎使用 | 更安全，不阻塞渲染 |

***

### **典型使用场景**

#### 1. **测量 DOM 元素**

当需要读取元素的尺寸或位置时（如动态调整布局），使用 `useLayoutEffect` 确保在绘制前获取最新值：

```jsx
function Component() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    // 同步测量 DOM 元素宽度
    setWidth(ref.current.offsetWidth);
  }, []);

  return <div ref={ref}>Width: {width}px</div>;
}
```

#### 2. **同步更新 DOM**

避免用户看到中间状态（如闪烁的 UI）：

```jsx
function Tooltip() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useLayoutEffect(() => {
    // 计算并更新 Tooltip 位置
    const rect = ref.current.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.top });
  }, [dependencies]);

  return <div ref={ref} style={{ position: 'absolute', left: position.x, top: position.y }} />;
}
```

#### 3. **依赖布局的动画**

对动画的起始状态进行精确控制：

```jsx
useLayoutEffect(() => {
  // 确保动画起始状态与 DOM 同步
  element.style.transform = "translateX(0)";
  requestAnimationFrame(() => {
    element.style.transform = "translateX(100px)";
  });
}, []);
```

***

### **注意事项**

1. **性能风险**
   * 同步执行可能阻塞浏览器渲染，导致页面卡顿。
   * **仅在必要时使用**（如必须同步操作 DOM 的场景）。
2. **服务端渲染（SSR）**
   * `useLayoutEffect` 在服务端渲染时会触发警告（因为它依赖浏览器环境）。
   * 解决方案：在 SSR 时用 `useEffect` 替代，或通过 `typeof window !== 'undefined'` 条件执行。
3. **依赖项管理**
   * 与 `useEffect` 类似，需正确声明依赖数组，避免无限循环。

***

### **代码示例对比**

#### `useEffect`\*\* 导致闪烁\*\*

```jsx
function Component() {
  const [width, setWidth] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    // 异步执行，用户可能先看到旧值
    setWidth(ref.current.offsetWidth);
  }, []);

  return <div ref={ref}>{width}</div>; // 可能短暂显示 0
}
```

#### `useLayoutEffect`\*\* 修复闪烁\*\*

```jsx
useLayoutEffect(() => {
  // 同步执行，直接更新值后再绘制
  setWidth(ref.current.offsetWidth);
}, []);
```

***

### **总结**

`useLayoutEffect` 是 React 为**同步 DOM 操作**提供的高阶 Hook，适用于：

1. 测量或修改 DOM 布局。
2. 避免视觉不一致（如闪烁、抖动）。
3. 依赖 DOM 状态的动画初始化。

**慎用场景**：无需同步的副作用（如 API 请求、事件订阅）应优先使用 `useEffect`。

## 原理

`useLayoutEffect` 能够保证在 **浏览器布局（layout）阶段之前**、**DOM 修改完成之后** 执行，这归功于 React 的调度机制和浏览器的事件循环模型。以下是它如何实现这一点的详细解释。

***

### **React 的更新流程与 **`useLayoutEffect`** 的执行**

React 的更新流程分为两大阶段：

1. **渲染阶段（Render Phase）**
   * React 会根据状态或属性的变化重新计算虚拟 DOM（Virtual DOM）。
   * 在这一阶段，React 只会进行纯粹的计算工作（如 diff 算法），不会直接修改真实的 DOM。
   * 这一阶段是可以被中断的（对于 Concurrent Mode）。
2. **提交阶段（Commit Phase）**
   * React 会将已经计算好的虚拟 DOM 应用到真实 DOM 中（即 DOM 的更新）。
   * 在这一阶段，React 会执行以下步骤：
     * 更新真实 DOM。
     * 调用 `useLayoutEffect` 的回调函数。
     * 浏览器随后会进行布局（layout）和绘制（paint）。

`useLayoutEffect` 的执行时机位于 **提交阶段**，并且是在浏览器开始布局和绘制之前。

***

### **为什么 **`useLayoutEffect`** 能保证执行时机？**

React 的设计和浏览器的工作原理共同保证了 `useLayoutEffect` 的执行时机：

#### **1. React 的提交阶段执行顺序**

在 React 的提交阶段，`useLayoutEffect` 的回调函数会被同步执行，具体顺序如下：

1. React 将虚拟 DOM 的变化同步更新到真实 DOM。
2. 执行所有组件中注册的 `useLayoutEffect` 回调函数。
3. 浏览器进入布局和绘制阶段。

由于 `useLayoutEffect` 是在 DOM 更新之后立即执行的，它可以确保：

* 读取到更新后的 DOM 状态（如新的尺寸或位置）。
* 在浏览器布局和绘制之前修改 DOM。

#### **2. 浏览器的事件循环与渲染流程**

浏览器的渲染流程遵循以下规则：

* 在主线程上的任务（如 JavaScript 执行）完成之前，浏览器不会进入布局和绘制阶段。
* React 使用同步的方式调用 `useLayoutEffect`，这意味着它会在主线程上阻塞，直到所有 `useLayoutEffect` 回调函数执行完毕。

因此，`useLayoutEffect` 的执行时机总是位于：

1. React 更新了真实 DOM 之后；
2. 浏览器开始布局和绘制之前。

#### **3. 与 **`useEffect`** 的对比**

* `useEffect` 的回调函数会被推入事件循环的微任务队列中，等到浏览器完成布局和绘制后才执行。
* 而 `useLayoutEffect` 是同步执行的，直接在 DOM 更新后调用，不会被推迟到下一帧。

***

### **执行时机的关键点**

以下是 `useLayoutEffect` 的执行时机总结：

1. **React 更新真实 DOM**：React 在提交阶段将虚拟 DOM 的变化应用到真实 DOM。
2. \*\*同步执行 \*\*`useLayoutEffect`：React 会在真实 DOM 更新完成后立即执行所有 `useLayoutEffect` 回调函数。
3. **浏览器布局和绘制**：在 `useLayoutEffect` 执行完毕后，浏览器才会进入布局和绘制阶段。

这一顺序确保了 `useLayoutEffect` 的回调函数可以：

* 读取最新的 DOM 状态（如通过 `getBoundingClientRect` 获取元素尺寸）。
* 在布局和绘制之前对 DOM 进行修改，避免视觉闪烁。

***

### **示例：验证执行时机**

以下代码可以验证 `useLayoutEffect` 的执行时机：

```jsx
import React, { useLayoutEffect, useEffect, useRef } from "react";

function App() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    console.log("useLayoutEffect: DOM content", ref.current.textContent);
    ref.current.style.color = "red"; // 修改 DOM
  });

  useEffect(() => {
    console.log("useEffect: DOM content", ref.current.textContent);
  });

  return <div ref={ref}>Hello, world!</div>;
}

export default App;
```

**执行结果：**

1. `useLayoutEffect` 会先执行，读取并修改 DOM。
2. `useEffect` 会在浏览器完成布局和绘制之后执行。

***

### **总结**

`useLayoutEffect` 能够保证在 **布局（layout）之前**、**DOM 修改之后** 执行，主要依赖以下机制：

1. React 的提交阶段会同步执行 `useLayoutEffect`，确保它在布局和绘制之前完成。
2. 浏览器的事件循环模型确保在主线程任务完成之前不会进入布局和绘制阶段。
3. `useLayoutEffect` 是同步阻塞的，而 `useEffect` 是异步的。

这种机制使得 `useLayoutEffect` 成为处理与布局相关任务（如 DOM 测量和同步修改）的理想工具。

## 应用

在 React 中，`useLayoutEffect` 的**应用场景主要集中在对 DOM 的同步操作和避免视觉不一致**的场景中。以下是具体的应用场景和示例：

***

### **1. 测量 DOM 元素的布局信息**

当需要获取元素的最新尺寸、位置或滚动状态时，\*\*必须使用 \*\*`useLayoutEffect`，以确保在浏览器绘制前完成测量，避免用户看到布局抖动。

#### **示例：动态调整元素宽度**

```jsx
function ResponsiveComponent() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    // 同步测量元素宽度
    const measuredWidth = ref.current.offsetWidth;
    setWidth(measuredWidth);
  }, []); // 依赖为空数组，仅在挂载时执行

  return <div ref={ref}>当前宽度：{width}px</div>;
}
```

**场景价值**：避免组件渲染后短暂显示默认值（如 `0`），再突然更新为实际值。

***

### **2. 同步更新 DOM 状态**

当 DOM 修改需要立即生效且不允许中间状态（如闪烁）时，使用 `useLayoutEffect`。

#### **示例：Tooltip 位置修正**

```jsx
function Tooltip({ text }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const rect = tooltipRef.current.getBoundingClientRect();
    // 根据视口边界修正位置，避免超出屏幕
    const adjustedX = rect.left < 0 ? 0 : rect.left;
    const adjustedY = rect.top < 0 ? 0 : rect.top;
    setPosition({ x: adjustedX, y: adjustedY });
  }, [text]); // 依赖 text 变化触发重新定位

  return (
    <div 
      ref={tooltipRef}
      style={{ position: 'fixed', left: position.x, top: position.y }}
    >
      {text}
    </div>
  );
}
```

**场景价值**：直接修正位置后再渲染到屏幕，用户不会看到 Tooltip 的“跳动”。

***

### **3. 依赖 DOM 的动画初始化**

当动画的起始状态需要与 DOM 的当前状态严格同步时（如从当前位置开始动画），使用 `useLayoutEffect`。

#### **示例：平滑过渡动画**

```jsx
function AnimatedBox() {
  const boxRef = useRef(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    // 强制同步布局，确保初始位置正确
    box.style.transform = 'translateX(0)';
    // 在下一帧触发动画
    requestAnimationFrame(() => {
      box.style.transition = 'transform 0.3s';
      box.style.transform = 'translateX(100px)';
    });
  }, []);

  return <div ref={boxRef} className="box" />;
}
```

**场景价值**：避免动画从错误的位置开始（如默认位置到修正后的位置之间的闪烁）。

***

### **4. 自动滚动到元素**

当需要根据某些条件（如数据更新）自动滚动到指定元素时，使用 `useLayoutEffect` 确保滚动操作在绘制前完成。

#### **示例：消息列表底部自动滚动**

```jsx
function MessageList({ messages }) {
  const listRef = useRef(null);

  useLayoutEffect(() => {
    // 每次消息更新后滚动到底部
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  return (
    <div ref={listRef} className="message-container">
      {messages.map(msg => <div key={msg.id}>{msg.text}</div>)}
    </div>
  );
}
```

**场景价值**：用户不会看到滚动条中途跳动的中间状态。

***

### **5. 修复第三方库的 DOM 冲突**

当集成某些直接操作 DOM 的第三方库（如 D3.js、Three.js）时，使用 `useLayoutEffect` 确保 React 的 DOM 更新与第三方操作同步。

#### **示例：与 D3.js 集成**

```jsx
function Chart({ data }) {
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    const svg = d3.select(svgRef.current);
    // 同步清除旧图形并绘制新图形
    svg.selectAll("*").remove();
    svg.append("rect")
       .attr("width", data.width)
       .attr("height", data.height);
  }, [data]);

  return <svg ref={svgRef} />;
}
```

**场景价值**：避免 React 的异步渲染与 D3 的 DOM 操作发生冲突，导致图形残留或闪烁。

***

### **何时使用 **`useEffect`** 替代？**

以下场景应优先使用 `useEffect`：

* **数据请求**（如 `fetch`）。
* **事件监听**（如 `window.addEventListener`）。
* **无需同步的副作用**（如日志记录、延迟操作）。

***

### **注意事项**

1. **性能风险**：\
   `useLayoutEffect` 是同步执行的，可能阻塞浏览器渲染，导致页面卡顿。仅在必要时使用。
2. **服务端渲染（SSR）**：\
   在服务端渲染时，`useLayoutEffect` 会导致警告（因无 DOM 环境），需用 `useEffect` 替代或动态加载组件。
3. **依赖管理**：\
   明确声明依赖数组，避免无限循环或过频执行。

***

### **总结**

`useLayoutEffect` 的核心应用场景是 **需要同步操作 DOM 或避免视觉不一致**，典型场景包括：

* 测量布局 → 确保数据准确性。
* 修正位置 → 避免 UI 跳动。
* 动画初始化 → 平滑过渡。
* 强制滚动 → 无缝用户体验。
* 第三方库集成 → 解决 DOM 竞争。

**关键原则**：如果副作用会导致用户看到中间状态，用 `useLayoutEffect`；否则用 `useEffect`。


> 更新: 2025-07-02 14:06:35  
> 原文: <https://www.yuque.com/viruspc/el3mi0/veo2obnohw6vf8px>