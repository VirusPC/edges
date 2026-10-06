# Backgrounds and Borders

- [Introduction](#introduction)
- [Background](#background)
  * [Layering Multiple Background Images](#layering-multiple-background-images)
  * [Properties](#properties)
  * [Backgrounds for Special Elements](#backgrounds-for-special-elements)
- [Borders](#borders)
- [Rounded Corners](#rounded-corners)
- [Border Images](#border-images)
- [Miscellaneous Effects](#miscellaneous-effects)

---

CSS Backgrounds and Borders Module Level 3 包括 CSS 中有关 border 和 background 的部分。

## Introduction

当元素们根据 CSS Box Model 渲染，每一个元素要不不展示，要么被格式化为一个或多个长方形box. margin可以为负数，但margin不对 background 和 border 产生影响。

这个模块的属性用于处理 border 区域的装饰以及 content, padding 和border 区域的 background. 此外，box 可以通过`box-shadow` 属性来设置 "drop-shadow" 效果。

如果一个元素被分割为多个 box(跨行，跨页等), 'box-decoration-break' \[CSS3-BREAK]  定义了 border 和 background 如何被分割。

相关的 background, border 和 shadow 的 stacking order 也在此模块中被定义。

此模块里所有的属性都适用于 `::first letter` 伪元素。background 相关属性以及 `border-radius` 属性适用于 `::first-line` 伪元素。UA 可能会为 ::first-line 应用 `border-image` 或 `box-ahadow`属性，但绝不会为其应用 `border-color/style/width` 属性

## Background

### Layering Multiple Background Images

所有的元素都至少有一个 background layer(即使 `background-image`为`none`, 此时意味着图片为空，下载失败，或图片无法展示)。如果 `background-image` 属性有多个逗号隔开的值，会创建同样数量的 layer，先定义的 image 距离用户更近，background 的 color 如果有定义的话，位于最下层。background 永远位于 border 之下。

### Properties

background 的属性规定了使用什么颜色(`background-color`)和图片(`background-Image`)，以及他们的大小(background-size)，定位(`background-attachment`, `background-origin`， `background-position`)，绘制区域(background-clip)，如何被平铺(`background-repeat`)等。

background 的相关属性不会被继承。但由于`background-color`默认值是 `transparent`，`background-Image`的默认值是`none`,所以默认情况下会与其子元素共享 background。

`background-clip`, `background-origin`等默认为`border-box`，还可以设置为`padding-box`或`content-box`，但不能设置为`margin-box`。注意根元素有着不同的绘制区域，所以`background-clip`在根元素上不生效。

### Backgrounds for Special Elements

canvas API中不存在HTML标记或CSS类的概念。为了给 canvas 添加样式，css会将其根元素(如html中的body元素)的 background 传播给它，作为 canvas background。canvas background 的 background positioning area 仍然由根元素决定。如果将 background 传给它的元素没有生成box(如`display: none`), canvas background 会设为透明。如果 canvas background 是透明的，在它之下的 canvas surface 就会被显示。canvas surface 的纹理由 UA 决定，一般是纯白。

对于根元素为 HTML 元素或 XHTML 元素的文档：如果根元素上的 `background-image` 的值为“none”，并且其 `background-color` 是 `transparent`，UA 必须从该元素的第一个HTML Body或XHTML Body子元素传播后台属性的值。该BODY元素使用background属性的初始值，其传播下去的值被视为在根元素上指定的值。建议HTML文档的作者为BODY元素而不是HTML元素指定画布背景。

## Borders

## Rounded Corners

## Border Images

## Miscellaneous Effects

Backgrounds and Borders https://www.w3.org/TR/css-backgrounds-3/


> 更新: 2021-04-11 14:36:55  
> 原文: <https://www.yuque.com/viruspc/el3mi0/my0m0s>