# 样式

- [1. 样式书写方式](#1-%E6%A0%B7%E5%BC%8F%E4%B9%A6%E5%86%99%E6%96%B9%E5%BC%8F)
- [2. 支持的属性](#2-%E6%94%AF%E6%8C%81%E7%9A%84%E5%B1%9E%E6%80%A7)
- [3. 单位](#3-%E5%8D%95%E4%BD%8D)
- [4. 继承与层叠](#4-%E7%BB%A7%E6%89%BF%E4%B8%8E%E5%B1%82%E5%8F%A0)
- [5. 伪类和媒体查询](#5-%E4%BC%AA%E7%B1%BB%E5%92%8C%E5%AA%92%E4%BD%93%E6%9F%A5%E8%AF%A2)
- [6. 动画](#6-%E5%8A%A8%E7%94%BB)
- [总结表格](#%E6%80%BB%E7%BB%93%E8%A1%A8%E6%A0%BC)
- [补充说明](#%E8%A1%A5%E5%85%85%E8%AF%B4%E6%98%8E)

---

React Native 的样式和 H5（即 Web 前端开发中的 CSS）有很多不同。下面详细对比一下两者的主要区别：

# 1. 样式书写方式

* **H5 (Web)**
  * 使用 CSS 文件或 style 标签，也可以用行内样式。
  * 语法是字符串，比如 `color: red; font-size: 16px;`
  * 支持类选择器、ID选择器、伪类、媒体查询等。
* **React Native**
  * 样式是 JS 对象，用 camelCase（小驼峰）命名，而不是 kebab-case（短横线分隔）。
  * 只能用行内样式或 StyleSheet.create 创建样式对象。
  * 语法如：`{ color: 'red', fontSize: 16 }`

# 2. 支持的属性

* **H5 (Web)**
  * CSS 属性非常丰富，如 `float`, `z-index`, `box-shadow`, `transition`, `animation` 等。
  * 支持复杂布局方式：`flex`, `grid`, `float`, `position` 等。
* **React Native**
  * 只支持部分 CSS 属性，主要是布局和视觉相关的，如 `flex`, `margin`, `padding`, `color`, `fontSize` 等。
  * 不支持 `float`, `grid`, `box-shadow`, `transition`, `animation` 等。
  * 布局主要依赖 Flexbox，且部分属性默认值和 Web 不同。

# 3. 单位

* **H5 (Web)**
  * 支持多种单位：`px`, `em`, `rem`, `%`, `vw`, `vh` 等。
* **React Native**
  * 只支持数字，单位默认为“逻辑像素”（density-independent pixel），无需写 `px`。
  * 不支持百分比（%）布局，除了部分场景（如 flex）。

# 4. 继承与层叠

* **H5 (Web)**
  * 样式有继承性和层叠性（Cascading），可以通过选择器影响多个元素。
  * 支持全局样式。
* **React Native**
  * 没有继承和层叠，每个组件的样式都需要单独指定。
  * 没有全局样式，必须逐个组件设置。

# 5. 伪类和媒体查询

* **H5 (Web)**
  * 支持伪类（如 `:hover`, `:active`）和媒体查询（如 `@media`）。
* **React Native**
  * 不支持伪类和媒体查询，但可以用 JS 动态控制样式（比如根据屏幕尺寸设置不同样式）。

# 6. 动画

* **H5 (Web)**
  * 可以用 CSS 动画和过渡效果。
* **React Native**
  * 需要用专门的 API（如 Animated）实现动画，不能直接用 CSS 动画属性。

# 总结表格

| 对比项 | H5 (Web) | React Native |
| --- | --- | --- |
| 书写方式 | CSS 字符串/文件 | JS 对象 |
| 属性命名 | kebab-case | camelCase |
| 支持属性 | 非常丰富 | 部分属性，主要布局和视觉 |
| 单位 | px, em, %, rem 等 | 仅数字，无需单位 |
| 层叠/继承 | 有层叠和继承 | 无层叠和继承 |
| 伪类/媒体查询 | 支持 | 不支持 |
| 动画 | CSS 动画/过渡 | 需用 API 实现 |

# 补充说明

* React Native 的样式更接近于移动端开发中的样式（如 Android/iOS 的样式系统），而不是 Web 的 CSS。
* 如果你有 Web 前端经验，迁移到 React Native 需要适应新的样式书写和布局方式。

如需举例或进一步说明某一部分，可以告诉我！


> 更新: 2025-10-26 08:58:19  
> 原文: <https://www.yuque.com/viruspc/el3mi0/oskqts6zz309nvxs>