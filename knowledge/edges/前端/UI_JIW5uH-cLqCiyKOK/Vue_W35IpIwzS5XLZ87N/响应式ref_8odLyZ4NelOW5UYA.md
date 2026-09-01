# 响应式 ref

- [一句话总结](#%E4%B8%80%E5%8F%A5%E8%AF%9D%E6%80%BB%E7%BB%93)
- [🔍 深度对比分析](#%F0%9F%94%8D-%E6%B7%B1%E5%BA%A6%E5%AF%B9%E6%AF%94%E5%88%86%E6%9E%90)
  * [1️⃣ 核心机制差异](#1%EF%B8%8F%E2%83%A3-%E6%A0%B8%E5%BF%83%E6%9C%BA%E5%88%B6%E5%B7%AE%E5%BC%82)
    + [Vue 3 (Composition API)](#vue-3-composition-api)
    + [React (useState)](#react-usestate)
  * [2️⃣ 关键差异对比表](#2%EF%B8%8F%E2%83%A3-%E5%85%B3%E9%94%AE%E5%B7%AE%E5%BC%82%E5%AF%B9%E6%AF%94%E8%A1%A8)
  * [3️⃣ 实际代码对比](#3%EF%B8%8F%E2%83%A3-%E5%AE%9E%E9%99%85%E4%BB%A3%E7%A0%81%E5%AF%B9%E6%AF%94)
    + [场景一：简单计数器](#%E5%9C%BA%E6%99%AF%E4%B8%80%E7%AE%80%E5%8D%95%E8%AE%A1%E6%95%B0%E5%99%A8)
    + [场景二：对象更新（关键差异！）](#%E5%9C%BA%E6%99%AF%E4%BA%8C%E5%AF%B9%E8%B1%A1%E6%9B%B4%E6%96%B0%E5%85%B3%E9%94%AE%E5%B7%AE%E5%BC%82)
    + [场景三：连续多次更新](#%E5%9C%BA%E6%99%AF%E4%B8%89%E8%BF%9E%E7%BB%AD%E5%A4%9A%E6%AC%A1%E6%9B%B4%E6%96%B0)
  * [4️⃣ 在你的代码中的体现](#4%EF%B8%8F%E2%83%A3-%E5%9C%A8%E4%BD%A0%E7%9A%84%E4%BB%A3%E7%A0%81%E4%B8%AD%E7%9A%84%E4%BD%93%E7%8E%B0)
  * [5️⃣ 响应式原理深度对比](#5%EF%B8%8F%E2%83%A3-%E5%93%8D%E5%BA%94%E5%BC%8F%E5%8E%9F%E7%90%86%E6%B7%B1%E5%BA%A6%E5%AF%B9%E6%AF%94)
    + [Vue 3 Proxy 响应式](#vue-3-proxy-%E5%93%8D%E5%BA%94%E5%BC%8F)
    + [React useState 更新](#react-usestate-%E6%9B%B4%E6%96%B0)
  * [6️⃣ 性能和心智模型](#6%EF%B8%8F%E2%83%A3-%E6%80%A7%E8%83%BD%E5%92%8C%E5%BF%83%E6%99%BA%E6%A8%A1%E5%9E%8B)
    + [Vue：**可变数据 + 依赖追踪**](#vue%E5%8F%AF%E5%8F%98%E6%95%B0%E6%8D%AE--%E4%BE%9D%E8%B5%96%E8%BF%BD%E8%B8%AA)
    + [React：**不可变数据 + 协调算法**](#react%E4%B8%8D%E5%8F%AF%E5%8F%98%E6%95%B0%E6%8D%AE--%E5%8D%8F%E8%B0%83%E7%AE%97%E6%B3%95)
  * [7️⃣ 常见陷阱对比](#7%EF%B8%8F%E2%83%A3-%E5%B8%B8%E8%A7%81%E9%99%B7%E9%98%B1%E5%AF%B9%E6%AF%94)
    + [Vue 陷阱](#vue-%E9%99%B7%E9%98%B1)
    + [React 陷阱](#react-%E9%99%B7%E9%98%B1)
- [🎯 总结：何时使用哪种模式](#%F0%9F%8E%AF-%E6%80%BB%E7%BB%93%E4%BD%95%E6%97%B6%E4%BD%BF%E7%94%A8%E5%93%AA%E7%A7%8D%E6%A8%A1%E5%BC%8F)
- [💡 面试加分点](#%F0%9F%92%A1-%E9%9D%A2%E8%AF%95%E5%8A%A0%E5%88%86%E7%82%B9)
  * [Q: 为什么 React 选择不可变数据？](#q-%E4%B8%BA%E4%BB%80%E4%B9%88-react-%E9%80%89%E6%8B%A9%E4%B8%8D%E5%8F%AF%E5%8F%98%E6%95%B0%E6%8D%AE)
  * [Q: Vue 3 为什么从 Object.defineProperty 迁移到 Proxy？](#q-vue-3-%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BB%8E-objectdefineproperty-%E8%BF%81%E7%A7%BB%E5%88%B0-proxy)

---

## 一句话总结

**表面相似但本质不同**：Vue 的 `ref.value =` 是**直接修改**响应式数据，React 的 `setState` 是**调度更新**并合并状态。

***

## 🔍 深度对比分析

### 1️⃣ 核心机制差异

#### Vue 3 (Composition API)

```typescript
const count = ref(0)
count.value = 1  // ✅ 直接赋值，立即生效
console.log(count.value)  // 1 - 立即读取到新值
```

**工作原理**：

* 基于 **Proxy** 的响应式系统
* `.value` 的 setter 触发依赖收集和更新
* **同步修改**数据，异步调度视图更新

#### React (useState)

```typescript
const [count, setCount] = useState(0)
setCount(1)  // ❌ 调度更新，非立即生效
console.log(count)  // 0 - 仍是旧值！
```

**工作原理**：

* 基于 **不可变数据** 的更新机制
* `setState` 触发重新渲染
* **异步批量更新**（Automatic Batching）

***

### 2️⃣ 关键差异对比表

| 维度 | Vue `ref.value =` | React `setState` |
| --- | --- | --- |
| **修改方式** | 直接赋值（Mutable） | 函数调用（Immutable） |
| **生效时机** | 数据立即变，视图异步更新 | 数据和视图都异步更新 |
| **读取新值** | `count.value` 立即读到新值 | 同步读 `count` 仍是旧值 |
| **响应式原理** | Proxy 拦截 | Virtual DOM diff |
| **批量更新** | 自动批处理 | React 18+ 自动批处理 |
| **对象更新** | 可直接修改属性 | 必须创建新对象 |

***

### 3️⃣ 实际代码对比

#### 场景一：简单计数器

**Vue**：

```typescript
const count = ref(0)

function increment() {
  count.value++
  console.log(count.value)  // 1 ✅ 立即读到新值
  count.value++
  console.log(count.value)  // 2 ✅ 再次增加
}
// 视图只更新一次（批处理）
```

**React**：

```typescript
const [count, setCount] = useState(0)

function increment() {
  setCount(count + 1)
  console.log(count)  // 0 ❌ 仍是闭包中的旧值
  setCount(count + 1)  // ❌ 错误！仍基于旧值 0，结果还是 1
}

// 正确写法：使用函数式更新
function increment() {
  setCount(prev => prev + 1)
  setCount(prev => prev + 1)  // ✅ 结果是 2
}
```

***

#### 场景二：对象更新（关键差异！）

**Vue**：

```typescript
const user = ref({ name: '张三', age: 25 })

// ✅ 方式1：直接修改属性（响应式）
user.value.age = 26

// ✅ 方式2：整体替换
user.value = { name: '张三', age: 26 }

// ✅ 方式3：使用解构（推荐）
user.value = { ...user.value, age: 26 }
```

**React**：

```typescript
const [user, setUser] = useState({ name: '张三', age: 25 })

// ❌ 错误：直接修改不会触发更新
user.age = 26  // 无效！

// ✅ 正确：必须创建新对象
setUser({ ...user, age: 26 })
```

***

#### 场景三：连续多次更新

**Vue**：

```typescript
const formData = ref({ name: '', age: 0, job: '' })

function fillForm() {
  formData.value.name = '张三'    // 立即生效
  formData.value.age = 25         // 立即生效
  formData.value.job = 'developer' // 立即生效
  
  console.log(formData.value.name)  // '张三' ✅
  // 视图只更新一次（自动批处理）
}
```

**React**：

```typescript
const [formData, setFormData] = useState({ name: '', age: 0, job: '' })

function fillForm() {
  setFormData(prev => ({ ...prev, name: '张三' }))
  setFormData(prev => ({ ...prev, age: 25 }))
  setFormData(prev => ({ ...prev, job: 'developer' }))
  
  console.log(formData.name)  // '' ❌ 仍是旧值
  // React 18+ 自动批处理，只重渲染一次
}

// 更优雅的写法
setFormData(prev => ({
  ...prev,
  name: '张三',
  age: 25,
  job: 'developer'
}))
```

***

### 4️⃣ 在你的代码中的体现

看看你的 `pugc.ts` 中的实际用法：

```typescript
// Vue 风格：直接赋值
applyStatus.value = 'first'
formData.value = { ...formData.value, ...v }  // 合并更新
hasFinished.value = !!res.hasFinished

// 如果是 React，需要这样：
setApplyStatus('first')
setFormData(prev => ({ ...prev, ...v }))
setHasFinished(!!res.hasFinished)
```

***

### 5️⃣ 响应式原理深度对比

#### Vue 3 Proxy 响应式

```typescript
const count = ref(0)

// 内部实现简化版
count = {
  get value() {
    track()  // 依赖收集
    return this._value
  },
  set value(newVal) {
    this._value = newVal
    trigger()  // 触发更新（调度到微任务队列）
  }
}
```

**执行顺序**：

```plain
1. count.value = 1      → 触发 setter
2. 数据立即更新         → _value = 1
3. trigger() 调度更新   → 加入微任务队列
4. console.log()        → 读到新值 1
5. 微任务执行           → DOM 更新
```

#### React useState 更新

```typescript
const [count, setCount] = useState(0)

// 内部实现简化版
function setCount(newValue) {
  const fiber = getCurrentFiber()
  const update = { value: newValue }
  
  fiber.updateQueue.push(update)  // 加入更新队列
  scheduleUpdate(fiber)           // 调度重渲染
}
```

**执行顺序**：

```plain
1. setCount(1)          → 创建更新对象
2. 加入更新队列         → updateQueue.push()
3. 调度重渲染           → scheduleUpdate()
4. console.log(count)   → 仍是闭包中的旧值 0
5. 重渲染执行           → 新的 count = 1
```

***

### 6️⃣ 性能和心智模型

#### Vue：**可变数据 + 依赖追踪**

* ✅ 精确更新（只更新使用了该数据的组件）
* ✅ 写起来直观（直接赋值）
* ⚠️ 需要理解 `.value` 的触发时机
* ⚠️ 解构会失去响应式（需要 `toRefs`）

#### React：**不可变数据 + 协调算法**

* ✅ 数据流清晰（单向数据流）
* ✅ 时间旅行调试（状态快照）
* ⚠️ 需要避免闭包陷阱
* ⚠️ 对象更新需要解构（容易出错）

***

### 7️⃣ 常见陷阱对比

#### Vue 陷阱

```typescript
// ❌ 解构后失去响应式
const { value } = count
value = 10  // 无效！

// ✅ 正确
count.value = 10
```

#### React 陷阱

```typescript
// ❌ 闭包陷阱
useEffect(() => {
  setTimeout(() => {
    console.log(count)  // 可能是过期的值
  }, 1000)
}, [])

// ✅ 正确
useEffect(() => {
  setTimeout(() => {
    console.log(count)
  }, 1000)
}, [count])  // 依赖更新
```

***

## 🎯 总结：何时使用哪种模式

| 场景 | Vue ref.value | React setState |
| --- | --- | --- |
| **简单计数** | 更直观 | 需要函数式更新 |
| **表单管理** | 可直接修改字段 | 需要解构合并 |
| **嵌套对象** | 可深度修改 | 必须不可变更新 |
| **立即读取** | ✅ 立即生效 | ❌ 需要等下次渲染 |
| **调试** | Proxy 调试困难 | 时间旅行友好 |

***

## 💡 面试加分点

### Q: 为什么 React 选择不可变数据？

**A**:

1. **简化变更检测**：浅比较即可判断（`oldState !== newState`）
2. **支持时间旅行**：Redux DevTools 可以记录每个状态快照
3. **并发模式友好**：状态快照可以安全地在不同优先级任务间切换

### Q: Vue 3 为什么从 Object.defineProperty 迁移到 Proxy？

**A**:

1. **性能优化**：无需递归遍历所有属性
2. **更强大的拦截**：可监听数组索引、动态添加属性
3. **更好的类型推导**：TypeScript 支持更好

***

**作为 React 开发者，你更喜欢哪种模式？或者对响应式原理还有什么疑问？**


> 更新: 2025-11-13 07:15:10  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ar8o1rk7g6igha5e>