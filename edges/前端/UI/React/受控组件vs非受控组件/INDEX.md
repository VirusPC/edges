# 受控组件vs非受控组件

- [一、核心概念](#%E4%B8%80%E6%A0%B8%E5%BF%83%E6%A6%82%E5%BF%B5)
- [二、实现方式对比](#%E4%BA%8C%E5%AE%9E%E7%8E%B0%E6%96%B9%E5%BC%8F%E5%AF%B9%E6%AF%94)
  * [1. 受控组件示例（表单输入）](#1-%E5%8F%97%E6%8E%A7%E7%BB%84%E4%BB%B6%E7%A4%BA%E4%BE%8B%E8%A1%A8%E5%8D%95%E8%BE%93%E5%85%A5)
  * [2. 非受控组件示例（文件上传）](#2-%E9%9D%9E%E5%8F%97%E6%8E%A7%E7%BB%84%E4%BB%B6%E7%A4%BA%E4%BE%8B%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0)
- [三、关键差异深度解析](#%E4%B8%89%E5%85%B3%E9%94%AE%E5%B7%AE%E5%BC%82%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90)
- [四、如何选择？](#%E5%9B%9B%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9)
- [五、常见误区](#%E4%BA%94%E5%B8%B8%E8%A7%81%E8%AF%AF%E5%8C%BA)
- [六、最佳实践总结](#%E5%85%AD%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%E6%80%BB%E7%BB%93)

---

以下是React中**受控组件**与**非受控组件**的详细对比解析，附代码示例和核心原理说明：

***

### 一、核心概念

| **特性** | 受控组件 (Controlled Component) | 非受控组件 (Uncontrolled Component) |
| --- | --- | --- |
| **数据控制权** | 由React状态（State）完全控制 | 由DOM自身管理 |
| **值更新方式** | 通过`onChange`事件同步状态 | 通过`ref`直接操作DOM获取值 |
| **数据流** | 单向数据流（State → 组件 → DOM） | 直接从DOM获取数据 |
| **适用场景** | 表单验证、实时响应输入 | 文件上传、第三方库集成、简单表单 |

***

### 二、实现方式对比

#### 1. 受控组件示例（表单输入）

```jsx
import { useState } from 'react';

function ControlledForm() {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交值:', value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => setValue(e.target.value)} // 状态驱动UI
      />
      <button>提交</button>
    </form>
  );
}
```

**原理**：

* 输入框的值始终由`value={value}`绑定React状态
* 每次输入触发`onChange`更新状态 → 触发重新渲染 → 更新DOM

***

#### 2. 非受控组件示例（文件上传）

```jsx
import { useRef } from 'react';

function UncontrolledForm() {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('文件:', inputRef.current.files[0]); // 直接访问DOM
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="file" 
        ref={inputRef}  // 通过ref关联DOM
      />
      <button>上传</button>
    </form>
  );
}
```

**原理**：

* 使用`useRef`创建引用指向DOM元素
* 提交时直接从`inputRef.current`获取DOM值（不经过React状态）

***

### 三、关键差异深度解析

| **特性** | 受控组件 | 非受控组件 |
| --- | --- | --- |
| **数据验证时机** | 实时验证（onChange中处理） | 提交时验证（需手动操作） |
| **性能影响** | 每次输入触发渲染（简单表单无压力） | 无额外渲染（适合大型表单优化） |
| **默认值设置** | 通过`value` + 初始state控制 | 使用`defaultValue`/`defaultChecked` |
| **强制更新UI** | 直接修改state即可 | 需操作DOM（违反React设计原则） |

> ⚠️ **非受控组件的默认值设置**：

```jsx
<input 
  type="text" 
  defaultValue="初始值"  // 仅首次渲染生效
  ref={inputRef} 
/>
```

***

### 四、如何选择？

| **场景** | 推荐方案 | 理由 |
| --- | --- | --- |
| 复杂表单验证/实时反馈 | ✅ 受控组件 | 状态驱动便于实时校验（如密码强度提示） |
| 文件上传操作 | ✅ 非受控组件 | `<input type="file">` 必须用ref访问File API |
| 集成非React库（如jQuery插件） | ✅ 非受控组件 | 避免React状态与第三方库数据冲突 |
| 高频输入优化（如实时编辑器） | ⚠️ 谨慎选择 | 受控组件可能需用防抖优化，非受控需手动同步状态 |

***

### 五、常见误区

1. **混合使用**

```jsx
// ❌ 反模式：value + ref混合
<input value={value} ref={inputRef} />
```

React会认为你想完全控制组件，导致ref获取的值与state不一致

2. **误用defaultValue**

```jsx
// ❌ 受控组件错误设置初始值
<input value={undefined} /> // 等同于非受控，但后续无法更新
```

3. **非受控组件忘记提交时取值**

```jsx
// ❌ 忘记在提交时使用ref
const handleSubmit = () => {
  // 遗漏 inputRef.current.value
};
```

***

### 六、最佳实践总结

1. **优先使用受控组件**：符合React数据流原则，易于维护
2. **文件上传必用非受控**：`<input type="file">` 需直接操作File API
3. **性能敏感场景优化**：
   * 受控组件用`debounce`减少渲染
   * 非受控组件用`ref` + 手动同步关键状态
4. **第三方库集成**：通过`ref`将DOM控制权交给外部库，配合`useEffect`清理资源

> 官方推荐：\
> *“在大多数情况下，建议使用受控组件。但当实现某些特殊功能时（如文件上传），非受控组件是必要的补充。”* —— React官方文档


> 更新: 2025-07-03 17:53:53  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lhvc7drl17qweft7>