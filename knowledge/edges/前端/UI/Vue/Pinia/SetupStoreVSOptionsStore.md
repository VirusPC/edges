# Setup Store VS Options Store

- [一、完整对比表](#%E4%B8%80%E5%AE%8C%E6%95%B4%E5%AF%B9%E6%AF%94%E8%A1%A8)
- [二、完整代码对比](#%E4%BA%8C%E5%AE%8C%E6%95%B4%E4%BB%A3%E7%A0%81%E5%AF%B9%E6%AF%94)
  * [示例场景：用户管理 Store](#%E7%A4%BA%E4%BE%8B%E5%9C%BA%E6%99%AF%E7%94%A8%E6%88%B7%E7%AE%A1%E7%90%86-store)
    + [1️⃣ Setup Store（Composition API 风格）](#1%EF%B8%8F%E2%83%A3-setup-storecomposition-api-%E9%A3%8E%E6%A0%BC)
    + [2️⃣ Options Store（Options API 风格）](#2%EF%B8%8F%E2%83%A3-options-storeoptions-api-%E9%A3%8E%E6%A0%BC)
- [三、使用方式对比](#%E4%B8%89%E4%BD%BF%E7%94%A8%E6%96%B9%E5%BC%8F%E5%AF%B9%E6%AF%94)
  * [在组件中使用](#%E5%9C%A8%E7%BB%84%E4%BB%B6%E4%B8%AD%E4%BD%BF%E7%94%A8)
- [四、深入原理差异](#%E5%9B%9B%E6%B7%B1%E5%85%A5%E5%8E%9F%E7%90%86%E5%B7%AE%E5%BC%82)
  * [1. 响应式系统](#1-%E5%93%8D%E5%BA%94%E5%BC%8F%E7%B3%BB%E7%BB%9F)
  * [2. TypeScript 类型推导](#2-typescript-%E7%B1%BB%E5%9E%8B%E6%8E%A8%E5%AF%BC)
- [五、高级特性对比](#%E4%BA%94%E9%AB%98%E7%BA%A7%E7%89%B9%E6%80%A7%E5%AF%B9%E6%AF%94)
  * [1. 组合其他 Store](#1-%E7%BB%84%E5%90%88%E5%85%B6%E4%BB%96-store)
  * [2. 私有方法和逻辑封装](#2-%E7%A7%81%E6%9C%89%E6%96%B9%E6%B3%95%E5%92%8C%E9%80%BB%E8%BE%91%E5%B0%81%E8%A3%85)
  * [3. 使用 Composables](#3-%E4%BD%BF%E7%94%A8-composables)
- [六、应用场景决策树](#%E5%85%AD%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF%E5%86%B3%E7%AD%96%E6%A0%91)
- [七、实际应用场景推荐](#%E4%B8%83%E5%AE%9E%E9%99%85%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF%E6%8E%A8%E8%8D%90)
  * [推荐使用 Setup Store 的场景](#%E6%8E%A8%E8%8D%90%E4%BD%BF%E7%94%A8-setup-store-%E7%9A%84%E5%9C%BA%E6%99%AF)
  * [推荐使用 Options Store 的场景](#%E6%8E%A8%E8%8D%90%E4%BD%BF%E7%94%A8-options-store-%E7%9A%84%E5%9C%BA%E6%99%AF)
- [八、迁移建议](#%E5%85%AB%E8%BF%81%E7%A7%BB%E5%BB%BA%E8%AE%AE)
  * [从 Options Store 迁移到 Setup Store](#%E4%BB%8E-options-store-%E8%BF%81%E7%A7%BB%E5%88%B0-setup-store)
- [九、性能对比](#%E4%B9%9D%E6%80%A7%E8%83%BD%E5%AF%B9%E6%AF%94)
- [十、面试高频问题](#%E5%8D%81%E9%9D%A2%E8%AF%95%E9%AB%98%E9%A2%91%E9%97%AE%E9%A2%98)
  * [Q1: Setup Store 和 Options Store 的本质区别是什么？](#q1-setup-store-%E5%92%8C-options-store-%E7%9A%84%E6%9C%AC%E8%B4%A8%E5%8C%BA%E5%88%AB%E6%98%AF%E4%BB%80%E4%B9%88)
  * [Q2: 为什么 Setup Store 的 TypeScript 支持更好？](#q2-%E4%B8%BA%E4%BB%80%E4%B9%88-setup-store-%E7%9A%84-typescript-%E6%94%AF%E6%8C%81%E6%9B%B4%E5%A5%BD)
  * [Q3: 什么时候必须用 Setup Store？](#q3-%E4%BB%80%E4%B9%88%E6%97%B6%E5%80%99%E5%BF%85%E9%A1%BB%E7%94%A8-setup-store)
  * [Q4: Options Store 还有存在的意义吗？](#q4-options-store-%E8%BF%98%E6%9C%89%E5%AD%98%E5%9C%A8%E7%9A%84%E6%84%8F%E4%B9%89%E5%90%97)
- [总结建议](#%E6%80%BB%E7%BB%93%E5%BB%BA%E8%AE%AE)

---

**本质总结：** Setup Store 是 Composition API 风格的自由组合模式，Options Store 是传统的结构化约束模式。Setup Store 更灵活强大，Options Store 更规范易读，选择取决于项目复杂度和团队习惯。

## 一、完整对比表

| 维度 | Setup Store | Options Store |
| --- | --- | --- |
| **定义方式** | `defineStore('id', () => {})` | `defineStore('id', { state, getters, actions })` |
| **State 定义** | `const count = ref(0)` | `state: () => ({ count: 0 })` |
| **Getters 定义** | `const double = computed(() => ...)` | `getters: { double() {...} }` |
| **Actions 定义** | 返回任意函数 | `actions: { increment() {...} }` |
| **修改 State** | 直接赋值 `count.value++` | `this.count++` |
| **访问其他 State** | 直接访问变量 | `this.otherState` |
| **访问其他 Getters** | 直接访问变量 | `this.otherGetter` |
| **调用其他 Actions** | 直接调用函数 | `this.otherAction()` |
| **TypeScript 推导** | ⭐⭐⭐⭐⭐ 完美 | ⭐⭐⭐ 需要额外类型声明 |
| **私有方法** | ✅ 支持（不返回即可） | ❌ 不支持 |
| **使用 Composables** | ✅ 完全支持 | ❌ 不支持 |
| **代码组织** | 自由，可按功能分组 | 强制分为 state/getters/actions |
| **学习曲线** | Composition API 基础 | Options API 基础 |
| **DevTools 支持** | ✅ 完整 | ✅ 完整 |
| **插件拦截** | 所有返回的函数 | 仅 actions |
| **热模块替换(HMR)** | ✅ 支持 | ✅ 支持 |
| **代码量** | 通常更少 | 需要更多模板代码 |
| **适合场景** | 复杂逻辑、需要组合能力 | 简单 CRUD、规范化团队 |

## 二、完整代码对比

### 示例场景：用户管理 Store

#### 1️⃣ Setup Store（Composition API 风格）

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore('user', () => {
  // ===== State =====
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const loading = ref(false)
  const loginAttempts = ref(0)
  
  // ===== Getters =====
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.name || '游客')
  const canRetry = computed(() => loginAttempts.value < 3)
  
  // ===== 私有方法（不返回）=====
  const validateToken = (token: string): boolean => {
    return token.length > 20
  }
  
  const saveToLocalStorage = () => {
    localStorage.setItem('token', token.value)
  }
  
  // ===== Actions =====
  const login = async (username: string, password: string) => {
    loading.value = true
    loginAttempts.value++
    
    try {
      const res = await api.login({ username, password })
      
      if (!validateToken(res.token)) {
        throw new Error('Invalid token')
      }
      
      token.value = res.token
      user.value = res.user
      saveToLocalStorage()
      
      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      loading.value = false
    }
  }
  
  const logout = () => {
    user.value = null
    token.value = ''
    loginAttempts.value = 0
    localStorage.removeItem('token')
  }
  
  const updateProfile = async (data: Partial<User>) => {
    if (!user.value) return
    
    const updated = await api.updateUser(data)
    user.value = { ...user.value, ...updated }
  }
  
  // ===== 使用其他 Composables =====
  const router = useRouter()
  const navigateToHome = () => {
    router.push('/')
  }
  
  // ===== 工具方法 =====
  const formatUserRole = (role: string) => {
    return role.toUpperCase()
  }
  
  // ===== 返回公开 API =====
  return {
    // State
    user,
    token,
    loading,
    loginAttempts,
    
    // Getters
    isLoggedIn,
    userName,
    canRetry,
    
    // Actions
    login,
    logout,
    updateProfile,
    navigateToHome,
    
    // Utils
    formatUserRole,
    
    // 注意：validateToken 和 saveToLocalStorage 没有返回，是私有的
  }
})
```

#### 2️⃣ Options Store（Options API 风格）

```typescript
import { defineStore } from 'pinia'

interface State {
  user: User | null
  token: string
  loading: boolean
  loginAttempts: number
}

export const useUserStore = defineStore('user', {
  // ===== State =====
  state: (): State => ({
    user: null,
    token: '',
    loading: false,
    loginAttempts: 0,
  }),
  
  // ===== Getters =====
  getters: {
    isLoggedIn(state): boolean {
      return !!state.token
    },
    
    userName(state): string {
      return state.user?.name || '游客'
    },
    
    canRetry(state): boolean {
      return state.loginAttempts < 3
    },
    
    // 访问其他 getter
    userInfo(): string {
      return `${this.userName} - ${this.isLoggedIn ? 'Online' : 'Offline'}`
    },
  },
  
  // ===== Actions =====
  actions: {
    // ❌ 不能定义私有方法！只能都放在 actions 里
    validateToken(token: string): boolean {
      return token.length > 20
    },
    
    saveToLocalStorage() {
      localStorage.setItem('token', this.token)
    },
    
    async login(username: string, password: string) {
      this.loading = true
      this.loginAttempts++
      
      try {
        const res = await api.login({ username, password })
        
        // 调用其他 action
        if (!this.validateToken(res.token)) {
          throw new Error('Invalid token')
        }
        
        this.token = res.token
        this.user = res.user
        this.saveToLocalStorage()
        
        return true
      } catch (error) {
        console.error('Login failed:', error)
        return false
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.user = null
      this.token = ''
      this.loginAttempts = 0
      localStorage.removeItem('token')
    },
    
    async updateProfile(data: Partial<User>) {
      if (!this.user) return
      
      const updated = await api.updateUser(data)
      this.user = { ...this.user, ...updated }
    },
    
    // ❌ 不能使用 composables（如 useRouter）
    // 只能通过外部传参或全局对象
    navigateToHome() {
      // 需要其他方式处理路由
      window.location.href = '/'
    },
    
    formatUserRole(role: string) {
      return role.toUpperCase()
    },
  },
})
```

## 三、使用方式对比

### 在组件中使用

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// ===== Setup Store 和 Options Store 使用方式相同 =====

// State 和 Getters：必须用 storeToRefs
const { 
  user, 
  loading, 
  isLoggedIn, 
  userName 
} = storeToRefs(userStore)

// Actions：直接解构
const { 
  login, 
  logout, 
  updateProfile 
} = userStore

// 调用
const handleLogin = async () => {
  const success = await login('admin', '123456')
  if (success) {
    console.log('登录成功')
  }
}

// 访问（两种方式都可以）
console.log(userName.value)        // 通过 ref
console.log(userStore.userName)    // 通过 store（Pinia 自动解包）
</script>

```

## 四、深入原理差异

### 1. 响应式系统

```typescript
// Setup Store 本质
const store = reactive({
  // 直接暴露 ref 和 computed
  count: ref(0),
  double: computed(() => count.value * 2),
  increment: () => count.value++
})

// Options Store 本质（Pinia 内部转换）
const store = reactive({
  // Pinia 将 state 转为 ref
  count: ref(0),
  // Pinia 将 getter 转为 computed
  double: computed(() => store.count * 2),
  // Actions 绑定 this
  increment: function() { this.count++ }.bind(store)
})
```

### 2. TypeScript 类型推导

```typescript
// ✅ Setup Store：完美的类型推导
export const useUserStore = defineStore('user', () => {
  const count = ref<number>(0)          // 类型自动推导
  const user = ref<User | null>(null)   // 泛型支持完美
  
  const increment = () => {
    count.value++  // ✅ 完整的智能提示
  }
  
  return { count, user, increment }
})

// 使用时
const store = useUserStore()
store.count        // ✅ 类型：Ref<number>
store.user.value   // ✅ 类型：User | null，完整智能提示


// ⚠️ Options Store：需要手动声明类型
interface State {
  count: number
  user: User | null
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    count: 0,
    user: null,
  }),
  
  actions: {
    increment() {
      this.count++  // ✅ 有类型，但推导不如 setup store 精确
    },
    
    // ⚠️ 复杂类型需要显式声明
    async fetchUser(): Promise<User | null> {
      const res = await api.getUser()
      this.user = res
      return res
    }
  }
})
```

## 五、高级特性对比

### 1. 组合其他 Store

```typescript
// ===== Setup Store：自然组合 =====
export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()  // ✅ 直接使用
  
  const items = ref<CartItem[]>([])
  
  const addItem = (item: CartItem) => {
    if (!userStore.isLoggedIn) {  // ✅ 直接访问
      throw new Error('Please login first')
    }
    items.value.push(item)
  }
  
  return { items, addItem }
})

// ===== Options Store：需要在 actions 中 =====
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[]
  }),
  
  actions: {
    addItem(item: CartItem) {
      const userStore = useUserStore()  // ⚠️ 必须在函数内部调用
      
      if (!userStore.isLoggedIn) {
        throw new Error('Please login first')
      }
      this.items.push(item)
    }
  }
})
```

### 2. 私有方法和逻辑封装

```typescript
// ===== Setup Store：完美的封装 =====
export const useDataStore = defineStore('data', () => {
  const data = ref<Data[]>([])
  
  // ✅ 私有方法：不返回，外部无法访问
  const validateData = (item: Data) => {
    return item.id > 0 && item.name.length > 0
  }
  
  const processData = (raw: RawData[]): Data[] => {
    return raw
      .filter(validateData)
      .map(item => ({ ...item, processed: true }))
  }
  
  // 公开方法
  const fetchData = async () => {
    const raw = await api.getData()
    data.value = processData(raw)  // ✅ 使用私有方法
  }
  
  return {
    data,
    fetchData
    // validateData 和 processData 不返回，保持私有
  }
})

// ===== Options Store：无法实现私有方法 =====
export const useDataStore = defineStore('data', {
  state: () => ({
    data: [] as Data[]
  }),
  
  actions: {
    // ❌ 所有方法都是公开的
    validateData(item: Data) {
      return item.id > 0 && item.name.length > 0
    },
    
    processData(raw: RawData[]): Data[] {
      return raw
        .filter(this.validateData)
        .map(item => ({ ...item, processed: true }))
    },
    
    async fetchData() {
      const raw = await api.getData()
      this.data = this.processData(raw)
    }
  }
})

// 外部可以访问所有方法（即使你不想暴露）
const store = useDataStore()
store.validateData({ id: 1 })  // ⚠️ 这是实现细节，不应该暴露
```

### 3. 使用 Composables

```typescript
// ===== Setup Store：完全支持 =====
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@/composables/useNotification'

export const useAppStore = defineStore('app', () => {
  const router = useRouter()          // ✅
  const { t } = useI18n()              // ✅
  const { notify } = useNotification() // ✅
  
  const navigate = (path: string) => {
    router.push(path)
  }
  
  const showMessage = (key: string) => {
    notify(t(key))
  }
  
  return { navigate, showMessage }
})

// ===== Options Store：不支持 =====
export const useAppStore = defineStore('app', {
  actions: {
    navigate(path: string) {
      // ❌ 无法使用 useRouter
      // 只能通过全局对象或外部传参
      window.location.href = path
    },
    
    showMessage(message: string) {
      // ❌ 无法使用 composables
      alert(message)
    }
  }
})
```

## 六、应用场景决策树

```plain
开始
 │
 ├─ 项目使用 Composition API？
 │   ├─ 是 → Setup Store ⭐⭐⭐⭐⭐
 │   └─ 否 → 看下一条
 │
 ├─ 需要使用 Vue Router/其他 Composables？
 │   ├─ 是 → Setup Store ⭐⭐⭐⭐⭐
 │   └─ 否 → 看下一条
 │
 ├─ 需要私有方法/复杂逻辑封装？
 │   ├─ 是 → Setup Store ⭐⭐⭐⭐⭐
 │   └─ 否 → 看下一条
 │
 ├─ TypeScript 类型推导很重要？
 │   ├─ 是 → Setup Store ⭐⭐⭐⭐⭐
 │   └─ 否 → 看下一条
 │
 ├─ 团队更熟悉 Options API？
 │   ├─ 是 → Options Store ⭐⭐⭐
 │   └─ 否 → 看下一条
 │
 ├─ 需要严格的代码结构约束？
 │   ├─ 是 → Options Store ⭐⭐⭐⭐
 │   └─ 否 → Setup Store ⭐⭐⭐⭐⭐
 │
 └─ 简单的 CRUD 操作，状态管理不复杂？
     ├─ 是 → Options Store ⭐⭐⭐⭐
     └─ 否 → Setup Store ⭐⭐⭐⭐⭐
```

## 七、实际应用场景推荐

### 推荐使用 Setup Store 的场景

1. **复杂业务逻辑**
   * 需要多个 composables 协作
   * 有复杂的数据处理流程
   * 需要私有方法封装
2. **需要路由/国际化等 Vue 生态**

```typescript
const router = useRouter()
const { t } = useI18n()
const route = useRoute()
```

3. **强类型 TypeScript 项目**
   * 需要完美的类型推导
   * 大量泛型使用
4. **现代化新项目**
   * Vue 3 + Composition API
   * 追求最佳实践
5. **你的项目就是典型例子！**

```typescript
export const usePugcStore = defineStore('pugc', () => {
  const router = useRouter()  // ✅ 使用 composable
  const route = useRoute()    // ✅ 使用 composable
  
  // 复杂的业务逻辑
  const formatStartTime = (timestamp: number) => { /* ... */ }
  
  return { /* ... */ }
})
```

### 推荐使用 Options Store 的场景

1. **简单 CRUD 应用**

```typescript
{
  state: () => ({ list: [] }),
  actions: {
    fetchList() { /* ... */ },
    create() { /* ... */ },
    update() { /* ... */ },
    delete() { /* ... */ }
  }
}
```

2. **Options API 为主的项目**
   * 老项目迁移
   * 团队习惯 Options API
3. **需要严格的代码规范**
   * state/getters/actions 强制分离
   * 便于 code review
4. **学习和教学场景**
   * 结构更清晰
   * 易于理解状态管理概念

## 八、迁移建议

### 从 Options Store 迁移到 Setup Store

```typescript
// 之前：Options Store
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  
  getters: {
    double(state) {
      return state.count * 2
    }
  },
  
  actions: {
    increment() {
      this.count++
    }
  }
})

// 之后：Setup Store
export const useCounterStore = defineStore('counter', () => {
  // state → ref
  const count = ref(0)
  const name = ref('Counter')
  
  // getters → computed
  const double = computed(() => count.value * 2)
  
  // actions → functions
  const increment = () => {
    count.value++
  }
  
  return { count, name, double, increment }
})
```

## 九、性能对比

| 维度 | Setup Store | Options Store | 说明 |
| --- | --- | --- | --- |
| **初始化性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Setup 稍快，少一层转换 |
| **运行时性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 基本相同 |
| **内存占用** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Setup 可以不暴露私有方法 |
| **DevTools** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 完全相同 |
| **HMR 速度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 基本相同 |

**结论**：性能差异微乎其微，不应作为选择依据。

## 十、面试高频问题

### Q1: Setup Store 和 Options Store 的本质区别是什么？

**A:**

* **语法层面**：Setup 是函数式，Options 是对象配置式
* **实现层面**：Setup 直接返回响应式对象，Options 需要 Pinia 内部转换
* **能力层面**：Setup 可以使用任何 Composition API，Options 受限于配置结构
* **封装层面**：Setup 支持私有方法，Options 所有方法都公开

### Q2: 为什么 Setup Store 的 TypeScript 支持更好？

**A:**

1. 直接使用 `ref<T>()` 和 `computed<T>()`，类型天然准确
2. 不依赖 `this`，避免了 `this` 的类型推导问题
3. 编译器可以做更好的类型收窄和推导
4. 泛型和复杂类型支持更自然

### Q3: 什么时候必须用 Setup Store？

**A:**

* 需要使用 `useRouter`、`useRoute` 等 composables
* 需要在 store 中使用其他自定义 composables
* 需要定义私有方法（不希望暴露给外部）
* 项目完全使用 Composition API

### Q4: Options Store 还有存在的意义吗？

**A:** 有！

* 对于熟悉 Vuex/Options API 的团队，迁移成本低
* 强制的结构化约束，适合大团队规范
* 简单 CRUD 场景下更直观
* 某些插件可能只支持 Options Store 的拦截

## 总结建议

🎯 **95% 的场景推荐 Setup Store**，因为：

* Vue 3 的未来方向
* 更灵活强大
* 更好的 TypeScript 支持
* 可以无缝使用整个 Vue 生态

⚠️ **保留 Options Store 用于**：

* 维护老项目
* 团队统一使用 Options API
* 需要强制规范的场景

你的项目已经正确选择了 Setup Store！✅


> 更新: 2025-11-16 09:51:55  
> 原文: <https://www.yuque.com/viruspc/el3mi0/fptrx0p9qioe9fw4>