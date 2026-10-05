# Margin Collapsing

- [什么是 Margin Collapsing？](#%E4%BB%80%E4%B9%88%E6%98%AF-margin-collapsing)
- [发生 Margin Collapsing 的场景](#%E5%8F%91%E7%94%9F-margin-collapsing-%E7%9A%84%E5%9C%BA%E6%99%AF)
- [Margin计算逻辑](#margin%E8%AE%A1%E7%AE%97%E9%80%BB%E8%BE%91)
- [如何避免 Margin Collapsing？](#%E5%A6%82%E4%BD%95%E9%81%BF%E5%85%8D-margin-collapsing)
- [总结](#%E6%80%BB%E7%BB%93)

---

在前端开发中，`margin collapsing`**（外边距折叠）** 是 CSS 布局中的一个重要概念，也是面试中可能会问到的知识点。

### 什么是 Margin Collapsing？

当两个或多个垂直方向上的外边距（`margin`）相遇时，它们可能会合并（折叠）成一个外边距，而不是简单地相加。这种现象被称为 **外边距折叠**。

折叠后的外边距的值是相遇的外边距中的最大值，而不是两者之和。

***

### 发生 Margin Collapsing 的场景

以下是常见的外边距折叠场景：

1. **相邻元素之间的垂直外边距折叠**
   * 当两个相邻的块级元素之间的垂直外边距相遇时，它们会发生折叠。
   * 例如：

```css
<div style="margin-bottom: 20px;"></div>
<div style="margin-top: 30px;"></div>

```

折叠后，这两个元素之间的外边距为 `30px`（取较大值）。

2. **父子元素的外边距折叠**
   * 如果父元素和子元素的顶部或底部外边距相遇，并且父元素没有设置 `padding`、`border` 或其他干扰因素，它们的外边距会折叠。
   * 例如：

```css
<div style="margin-top: 20px;">
  <p style="margin-top: 30px;"></p>
</div>

```

折叠后，整个结构的顶部外边距为 `30px`（取较大值）。

3. **空块级元素的外边距折叠**
   * 如果一个块级元素是空的（没有内容、没有内边距、没有边框），它的上下外边距会折叠。
   * 例如：

```css
<div style="margin-top: 20px; margin-bottom: 30px;"></div>

```

折叠后，该空元素的外边距为 `30px`（取较大值）。

***

### Margin计算逻辑

* **同号时**：取绝对值较大的值（正值或负值）。
* **异号时**：取代数和（正负相加）。

### 如何避免 Margin Collapsing？

在一些情况下，开发者可能希望避免外边距折叠，可以通过以下方法阻止：

1. \*\*添加 **`padding`** 或 \*\*`border`
   * 在父元素上添加 `padding` 或 `border`，可以阻止父子元素之间的外边距折叠。
   * 例如：

```css
<div style="padding-top: 1px; margin-top: 20px;">
  <p style="margin-top: 30px;"></p>
</div>

```

2. **触发BFC**
   1. `display` 的值是 `inline-block`、`table-cell`、`table-caption`、`flex`、`grid` 等。
      * 如果父元素设置了 `display: flex` 或 `display: grid`，子元素的外边距不会与父元素发生折叠。
   2. `position` 的值是 `absolute` 或 `fixed`。
   3. `float` 的值不是 `none`。
   4. `overflow` 的值不是 `visible`
      * 设置父元素的 `overflow` 为 `hidden`、`auto` 或 `scroll`，也可以阻止外边距折叠。
      * 例如：

```css
<div style="overflow: hidden; margin-top: 20px;">
  <p style="margin-top: 30px;"></p>
</div>

```

***

### 总结

**外边距折叠** 是 CSS 中的一种优化机制，主要发生在垂直方向的外边距上。理解其发生的场景以及如何避免，是前端布局中非常重要的知识点。


> 更新: 2025-07-19 14:33:15  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pmgfacugce5hkxa0>