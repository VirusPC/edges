# router

- [核心区别](#%E6%A0%B8%E5%BF%83%E5%8C%BA%E5%88%AB)
  * [`useRoute()` - 路由状态（只读）](#useroute---%E8%B7%AF%E7%94%B1%E7%8A%B6%E6%80%81%E5%8F%AA%E8%AF%BB)
  * [`useRouter()` - 路由器实例（操作）](#userouter---%E8%B7%AF%E7%94%B1%E5%99%A8%E5%AE%9E%E4%BE%8B%E6%93%8D%E4%BD%9C)
- [类比 React](#%E7%B1%BB%E6%AF%94-react)
- [⚠️ 注意点（面试考点）](#%E2%9A%A0%EF%B8%8F-%E6%B3%A8%E6%84%8F%E7%82%B9%E9%9D%A2%E8%AF%95%E8%80%83%E7%82%B9)

---

我来看一下这个文件的完整上下文，然后为你解释这两个 API 的区别。

\[1 tool called]

**一句话本质：**`useRoute`\*\* 读取路由状态，**`useRouter`** 操作路由导航。\*\*

## 核心区别

### `useRoute()` - 路由状态（只读）

返回当前路由的**响应式对象**，用于读取路由信息：

* `route.path` - 当前路径
* `route.params` - 路由参数
* `route.query` - 查询参数
* `route.meta` - 路由元信息

在你的代码中：

```plain
  const isFission = ref((route.query.type as string) === 'fission')
```

```plain
        intiveCode: (route.query.invitation_code as string) ?? '',
```

### `useRouter()` - 路由器实例（操作）

返回 router 实例，用于**导航操作**：

* `router.push()` - 跳转到新页面
* `router.replace()` - 替换当前页面
* `router.back()` - 返回上一页
* `router.go()` - 前进/后退 n 步

在你的代码中：

```plain
      router.back()
```

## 类比 React

如果你熟悉 React Router，可以这样理解：

```typescript
// Vue Router
const route = useRoute()        // 类似 React 的 useLocation() + useParams()
const router = useRouter()      // 类似 React 的 useNavigate()

// React Router v6 对比
import { useLocation, useParams, useNavigate } from 'react-router-dom'
const location = useLocation()  // location.search, location.pathname
const params = useParams()      // 路由参数
const navigate = useNavigate()  // navigate('/path') 或 navigate(-1)
```

## ⚠️ 注意点（面试考点）

1. **响应式特性**：`useRoute()` 返回的对象是响应式的，当路由变化时会自动更新
2. **使用场景**：在 Pinia store 中直接调用 composition API 是可以的，但要注意生命周期
3. **性能考虑**：第39行在 store 初始化时读取 `route.query.type`，这个值不会随路由变化而更新（因为被 `ref` 包裹了）。如果需要响应式更新，应该使用 computed：

```typescript
// 当前写法：初始化时固定
const isFission = ref((route.query.type as string) === 'fission')

// 响应式写法：路由变化时自动更新
const isFission = computed(() => (route.query.type as string) === 'fission')
```

你觉得第39行这样写是否符合业务需求？需要改成 computed 吗？


> 更新: 2025-11-13 07:22:16  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ok7ssqgktgf1eruy>