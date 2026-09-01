# 无标题文档

- [**BFC 的特性：**](#bfc-%E7%9A%84%E7%89%B9%E6%80%A7)
- [**如何触发 BFC？**](#%E5%A6%82%E4%BD%95%E8%A7%A6%E5%8F%91-bfc)
- [**常见用途：**](#%E5%B8%B8%E8%A7%81%E7%94%A8%E9%80%94)

---

\*\*BFC（块级格式化上下文）\*\*是 CSS 的一种布局机制，用于管理元素的布局和清除浮动。BFC 内部的元素独立于外部元素，不会相互影响。

### **BFC 的特性：**

1. 同一个 BFC 内的元素会按照正常的文档流布局。
2. BFC 可以包含浮动元素（清除浮动问题）。
3. BFC 不会与外部浮动元素重叠。

### **如何触发 BFC？**

以下方法可以触发 BFC：

1. 设置 `overflow` 为非 `visible`：

```css
.element {
  overflow: hidden; /* auto, scroll 也可以 */
}
```

2. 设置 `display` 为以下值之一：

```css
.element {
  display: inline-block; /* 或其他值 */
}
```

```
- `inline-block`
- `table`
- `flex`
- `grid`
```

3\. 设置 `float`：

```css
.element {
  float: left; /* 或 right */
}
```

4. 设置 `position` 为 `absolute` 或 `fixed`：

```css
.element {
  position: absolute; /* 或 fixed */
}
```

### **常见用途：**

1. **清除浮动**：通过触发 BFC 包裹浮动元素，防止父元素高度塌陷。
2. **避免重叠问题**：用于解决外边距合并等问题。

简而言之，BFC 是布局中的一个隔离区域，用于控制元素的排列和避免布局问题。


> 更新: 2025-06-08 06:39:08  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gy9lw2947fz7svvc>