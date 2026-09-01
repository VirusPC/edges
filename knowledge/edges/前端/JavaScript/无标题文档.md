# 无标题文档

- [1. `Symbol("key")`\*\* - 创建新的唯一 Symbol\*\*](#1-symbolkey---%E5%88%9B%E5%BB%BA%E6%96%B0%E7%9A%84%E5%94%AF%E4%B8%80-symbol)
- [2. `Symbol.for("key")`\*\* - 获取或创建全局 Symbol\*\*](#2-symbolforkey---%E8%8E%B7%E5%8F%96%E6%88%96%E5%88%9B%E5%BB%BA%E5%85%A8%E5%B1%80-symbol)
- [3. `Symbol.keyFor(symbol)`\*\* - 获取全局 Symbol 的描述符\*\*](#3-symbolkeyforsymbol---%E8%8E%B7%E5%8F%96%E5%85%A8%E5%B1%80-symbol-%E7%9A%84%E6%8F%8F%E8%BF%B0%E7%AC%A6)
- [对比总结：](#%E5%AF%B9%E6%AF%94%E6%80%BB%E7%BB%93)
- [使用示例：](#%E4%BD%BF%E7%94%A8%E7%A4%BA%E4%BE%8B)
- [注意事项：](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

---

在 JavaScript 中，Symbol 是一种原始数据类型，用于创建唯一标识符。以下是 `Symbol("key")`、`Symbol.for("key")` 和 `Symbol.keyFor(symbol)` 的区别详解：

***

### 1. `Symbol("key")`\*\* - 创建新的唯一 Symbol\*\*

```javascript
const sym1 = Symbol("key");
const sym2 = Symbol("key");

console.log(sym1 === sym2); // false（每次创建都是唯一的）
```

* **特点**：
  * 每次调用都会创建一个**全新的、唯一的 Symbol**
  * 即使描述符（"key"）相同，生成的 Symbol 也不同
  * **不在全局 Symbol 注册表中**
* **用途**：创建对象属性的唯一键（避免命名冲突）

```javascript
const obj = {};
const id = Symbol("id");
obj[id] = 123; // 安全地添加属性
```

***

### 2. `Symbol.for("key")`\*\* - 获取或创建全局 Symbol\*\*

```javascript
const sym1 = Symbol.for("globalKey");
const sym2 = Symbol.for("globalKey");

console.log(sym1 === sym2); // true（相同描述符返回同一个 Symbol）
```

* **特点**：
  * 首先检查**全局 Symbol 注册表**
  * 如果存在相同描述符的 Symbol，则返回它
  * 否则创建新 Symbol 并注册到全局表
  * **跨域/跨模块共享同一个 Symbol**
* **用途**：需要在不同代码段共享同一个 Symbol

```javascript
// 模块A.js
const GLOBAL_FLAG = Symbol.for("APP_FLAG");

// 模块B.js
const flag = Symbol.for("APP_FLAG");
console.log(flag === GLOBAL_FLAG); // true
```

***

### 3. `Symbol.keyFor(symbol)`\*\* - 获取全局 Symbol 的描述符\*\*

```javascript
const globalSym = Symbol.for("globalKey");
console.log(Symbol.keyFor(globalSym)); // "globalKey"

const localSym = Symbol("localKey");
console.log(Symbol.keyFor(localSym)); // undefined（非全局 Symbol）
```

* **特点**：
  * 只对通过 `Symbol.for()` 创建的**全局 Symbol 有效**
  * 返回该 Symbol 在注册表中的**字符串描述符**
  * 对非全局 Symbol 返回 `undefined`
* **用途**：调试或序列化全局 Symbol

***

### 对比总结：

| 特性 | `Symbol("key")` | `Symbol.for("key")` | `Symbol.keyFor(sym)` |
| --- | --- | --- | --- |
| **唯一性** | 总是唯一 | 相同 key 返回相同 Symbol | 不创建 Symbol |
| **全局注册表** | ❌ 不注册 | ✅ 注册到全局表 | 查询全局表 |
| **跨模块/域共享** | ❌ | ✅ | ✅ |
| **返回值** | 新 Symbol | 新或已存在的 Symbol | 描述符字符串或 `undefined` |
| **内存影响** | 独立内存 | 全局共享 | 无影响 |
| **主要用途** | 创建私有属性 | 共享标识符 | 获取全局 Symbol 的 key |

***

### 使用示例：

```javascript
// 创建唯一 Symbol（局部）
const privateKey = Symbol("internal");
class MyClass {
  [privateKey] = "secret"; // 真正私有的属性
}

// 创建/获取全局 Symbol
const sharedKey = Symbol.for("shared");
localStorage.setItem(sharedKey, "data");

// 在另一个模块中获取
const key = Symbol.for("shared");
console.log(localStorage.getItem(key)); // "data"

// 查询全局 Symbol 的 key
console.log(Symbol.keyFor(sharedKey)); // "shared"
```

***

### 注意事项：

1. **描述符不是标识符的一部分**\
   `Symbol("key")` 和 `Symbol("key")` 是不同的 Symbol，描述符只用于调试：

```javascript
console.log(Symbol("key").toString()); // "Symbol(key)"
```

2. **全局注册表的键是字符串**\
   `Symbol.for(123)` 会被转换为 `Symbol.for("123")`
3. **避免滥用全局 Symbol**\
   全局注册表可能引起命名冲突，优先使用局部 Symbol

理解这些区别有助于在需要唯一标识符时选择正确的 Symbol 创建方式，同时有效管理全局状态。


> 更新: 2025-06-07 18:47:22  
> 原文: <https://www.yuque.com/viruspc/el3mi0/elx2xum6nn4meas3>