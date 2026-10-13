# SvgXml

- [详细解释](#%E8%AF%A6%E7%BB%86%E8%A7%A3%E9%87%8A)
  * [1. **背景**](#1-%E8%83%8C%E6%99%AF)
  * [2. **SvgXml 组件**](#2-svgxml-%E7%BB%84%E4%BB%B6)
  * [3. **应用场景**](#3-%E5%BA%94%E7%94%A8%E5%9C%BA%E6%99%AF)
- [总结](#%E6%80%BB%E7%BB%93)

---

`SvgXml` 标签通常指的是 React Native SVG 库中的一个组件，用于直接渲染 SVG 的 XML 字符串。

***

## 详细解释

### 1. **背景**

在 React Native 中，原生并不支持直接渲染 SVG，需要借助第三方库 [react-native-svg](https://github.com/software-mansion/react-native-svg)。

该库提供了很多 SVG 相关的组件，比如 `<Svg>`, `<Circle>`, `<Rect>` 等。

### 2. **SvgXml 组件**

* `SvgXml` 是 `react-native-svg` 提供的一个特殊组件。
* **作用**：可以直接渲染 SVG 的 XML 字符串，不需要手动拆解为各个 SVG 元素组件。
* **用法**：

```javascript
import { SvgXml } from 'react-native-svg';

const svgMarkup = `
<svg width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>
`;

export default function MySvgComponent() {
  return <SvgXml xml={svgMarkup} width="100%" height="100%" />;
}
```

* 属性说明：
  * `xml`：SVG 的字符串内容。
  * `width`、`height`：渲染的大小。

### 3. **应用场景**

* 你有现成的 SVG 字符串（比如从后端或设计师直接拿到 SVG 代码）时，可以直接用 `SvgXml` 渲染。
* 不需要拆分成 `<Svg>`, `<Path>`, `<Rect>` 等单独组件。

***

## 总结

* `SvgXml` 不是标准的 HTML 或 SVG 标签，而是 React Native SVG 库里用于渲染 SVG 字符串的组件。
* 主要用于在 React Native 里直接渲染 SVG XML 字符串。

如果你想用 SVG 文件或者 SVG 字符串在 React Native 里显示，`SvgXml` 就是最方便的选择之一。


> 更新: 2025-11-03 03:42:53  
> 原文: <https://www.yuque.com/viruspc/el3mi0/baq7o5imvqxyugrk>