# 八股

- [⚙️ **一、核心架构原理**](#%E2%9A%99%EF%B8%8F-%E4%B8%80%E6%A0%B8%E5%BF%83%E6%9E%B6%E6%9E%84%E5%8E%9F%E7%90%86)
- [🧩 **二、状态管理进阶**](#%F0%9F%A7%A9-%E4%BA%8C%E7%8A%B6%E6%80%81%E7%AE%A1%E7%90%86%E8%BF%9B%E9%98%B6)
- [⚡ **三、性能优化深度策略**](#%E2%9A%A1-%E4%B8%89%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96%E6%B7%B1%E5%BA%A6%E7%AD%96%E7%95%A5)
- [🔮 **四、并发模式与异步渲染**](#%F0%9F%94%AE-%E5%9B%9B%E5%B9%B6%E5%8F%91%E6%A8%A1%E5%BC%8F%E4%B8%8E%E5%BC%82%E6%AD%A5%E6%B8%B2%E6%9F%93)
- [🧪 **五、高级组件模式**](#%F0%9F%A7%AA-%E4%BA%94%E9%AB%98%E7%BA%A7%E7%BB%84%E4%BB%B6%E6%A8%A1%E5%BC%8F)
- [🛠️ **六、工程化与质量保障**](#%F0%9F%9B%A0%EF%B8%8F-%E5%85%AD%E5%B7%A5%E7%A8%8B%E5%8C%96%E4%B8%8E%E8%B4%A8%E9%87%8F%E4%BF%9D%E9%9A%9C)
- [💎 **高频考点速查**](#%F0%9F%92%8E-%E9%AB%98%E9%A2%91%E8%80%83%E7%82%B9%E9%80%9F%E6%9F%A5)

---

以下是React进阶的核心考点梳理，结合高频面试题与实际开发场景，帮助你系统掌握React底层原理与高级特性：

***

### ⚙️ **一、核心架构原理**

1. **Fiber架构与时间切片**
   * **Fiber节点**：轻量数据结构（含组件类型、props、state链表指针），替代虚拟DOM作为调度单元。
   * **并发渲染**：将渲染任务拆分为可中断的微任务（5ms/片），通过`requestIdleCallback`调度，避免主线程阻塞。
   * **优先级调度**：事件分类（如用户交互高优、数据加载低优），通过`startTransition`标记非紧急更新。
2. **协调（Reconciliation）算法**
   * **Diff策略**：
     * 同层比较（跨层级移动会销毁重建）
     * 类型匹配（组件类型不同则卸载整个子树）
     * Key优化（列表项需唯一稳定ID，避免索引导致性能问题）
   * **两阶段提交**：
     * **调和阶段**：生成Fiber树并标记副作用（可中断）
     * **提交阶段**：同步应用变更到真实DOM（不可中断）

***

### 🧩 **二、状态管理进阶**

1. **Context API深层机制**
   * 数据通过隐式传递（Provider内部维护订阅链表），消费组件在Provider更新时强制渲染。
   * **性能陷阱**：Context值变化会导致所有消费者重渲染，需配合`memo`或状态拆分优化。
2. **Redux与中间件原理**
   * **单向数据流**：`Action → Middleware → Reducer → Store`。
   * **中间件机制**：柯里化函数链（如`redux-thunk`检查action是否为函数）。
3. **状态库选型**：
   * **Zustand**：基于Hook的轻量方案，避免Context重渲染。
   * **Recoil**：原子化状态+衍生状态（适合复杂依赖关系）。

***

### ⚡ **三、性能优化深度策略**

1. **渲染优化**
   * `React.memo`：浅比较props跳过渲染（类组件用`PureComponent`）。
   * `useMemo/useCallback`：缓存计算结果与函数，避免子组件无效更新。
   * **虚拟化长列表**：`react-window`动态渲染可视区域，减少DOM节点。
2. **数据获取优化**
   * **并行请求**：`Promise.all`合并独立请求，减少网络瀑布。
   * **请求缓存**：`React Query`自动去重+缓存失效策略，避免重复请求。

***

### 🔮 **四、并发模式与异步渲染**

1. **Suspense数据加载**

```jsx
const LazyComponent = React.lazy(() => import('./Component'));
<Suspense fallback={<Spinner />}> 
  <LazyComponent />
</Suspense>

```

```
- **原理**：组件抛出`Promise`时暂停渲染，展示`fallback`UI，完成后继续。
- **代码分割**：`React.lazy`动态加载组件，减少首包体积。
```

2\. **并发渲染控制**
\- `startTransition`：标记非紧急更新（如搜索建议），避免阻塞用户输入。
\- `useDeferredValue`：延迟派生值更新，保持界面响应。

***

### 🧪 **五、高级组件模式**

| **模式** | **核心思想** | **应用场景** | **案例库** |
| --- | --- | --- | --- |
| **复合组件** | 子组件共享隐式状态（通过Context） | 表单、表格等复杂UI | React Bootstrap |
| **受控属性** | 状态提升至父组件控制 | 表单联动、状态同步 | Material UI |
| **Render Props** | 组件通过函数prop渲染内容 | 逻辑复用（如鼠标跟踪） | Downshift |
| **Hooks + 状态获取** | 自定义Hook暴露状态逻辑 | 复杂业务逻辑封装 | React Table |

***

### 🛠️ **六、工程化与质量保障**

1. **服务端渲染（SSR）**
   * **Next.js方案**：`getServerSideProps`同步数据与渲染，解决SEO与首屏性能。
   * **Hydration机制**：客户端“激活”静态HTML，绑定事件恢复交互性。
2. **测试策略**
   * **单元测试**：`Jest` + `@testing-library/react` 测试组件行为。
   * **E2E测试**：Cypress验证完整业务流程。
3. **TypeScript集成**
   * 组件Props类型校验 + 泛型Hooks（如`useState<Type>()`）。

***

### 💎 **高频考点速查**

* **Fiber中断恢复**：通过`workInProgress`树缓存中间状态，任务中断后可恢复。
* **Hooks调用顺序**：依赖调用顺序链表（不能嵌套/条件调用）。
* **批量更新**：React 18默认自动批处理，异步事件中多次`setState`合并为一次渲染。

> 深入学习建议：
>
> * 调试Fiber树：[React Fiber Playground](https://fiber-playground.vercel.app/)
> * 官方并发模式示例：[React Concurrency Demo](https://react.dev/learn/concurrency)


> 更新: 2025-07-03 17:58:58  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vb0tevvi61qk8033>