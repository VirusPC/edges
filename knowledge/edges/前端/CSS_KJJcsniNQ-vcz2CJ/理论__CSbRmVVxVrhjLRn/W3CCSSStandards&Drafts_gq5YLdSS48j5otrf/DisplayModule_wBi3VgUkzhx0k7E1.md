# Display Module

- [Abstract](#abstract)
- [Introduction](#introduction)
- [Box Layout Modes: the `display` property](#box-layout-modes-the-display-property)
- [Run-In Layout](#run-in-layout)

---

## Abstract

此模块描述了 CSS formatting box tree 是如何从 document element tree 生成的, 并且定义了 `display` 属性来控制这个行为.

## Introduction

<font style="color:#333333;">CSS将源文档组织成 a </font>**<font style="color:#333333;">tree</font>**<font style="color:#333333;"> of </font>**<font style="color:#333333;">elements</font>**<font style="color:#333333;"> and </font>**<font style="color:#333333;">text nodes</font>**<font style="color:#333333;">，并将其呈现在画布上（例如屏幕，纸片或音频流）。 （某些源文档从更复杂的树开始，例如DOM，这些树可以具有注释节点和其他类型的事物。出于CSS的目的，所有这些其他类型的节点都将被忽略，就好像它们不存在一样。 ）</font>

为了做这件事，它生成一个中间结构 **box tree**，用于表示被渲染的文档的格式化结构。

Box tree 中的每个 box 代表着与之相关的画布上的某个空间和/或时间上的 element(或 pseudo element). Box tree中的每个 **text run** 同样表示其相应 text node 的内容。

为了创建 box tree，CSS 首先使用 cascading and inheritance，将每个CSS属性的计算值分配给 source tree 中的每个元素和文本节点。（见\[CSS3-CASCADE]。）

然后，对于每个 **element**，CSS生成由该元素的`display` 属性指定的零个或多个 box。通常，一个元素会生成一个 principle box，它表示自身并包含其在 box tree 中的内容。但是，某些 'display' values（例如 `display：list-item`）会生成多个 box（例如 principle box 和子 marker biox）。某些值（如'none'或'contents'）会导致元素和/或其子元素根本不生 box。box 通常由其 display 类型来表示，例如，由具有 `display:block` 的元素生成的 box 称为“block box”或“block”。

除非另有说明，否则将为 box 指定与其生成元素相同的样式。通常，继承的属性被分配给 **principle box**，然后通过 box tree继承给由同一元素生成的任何其他 box。非继承属性默认应用于 **principle box**，但当元素生成多个 box 时，有时定义为应用于其他框：例如，应用于 table 元素的 `border` 属性应用于其 table grid box，而不是其 principle 的  table wrapper box。如果值计算过程更改了这些 box 的样式，并且元素的样式被请求（例如通过 `getComputedStyle()`），那么对每个属性元素将反映应用在该属性的 box 的值。

类似地，对每个连续的兄弟文本节点序列，生成一个包含其所有文本内容的 text run， 它被赋予了与生成的文本节点相同的样式。但是，如果序列不包含文本，则不会生成 text run。

为了构建 box tree, 由一个元素生成的 box 们是其所有祖先元素的 principle box 的后代。通常情况下，一个元素的 principle box 的直接 parent box 是 离它最近的会生成box的祖先元素的 principle box。然而这里有一些例外: 比如对于 'run-in' box，生成多个 container box 的 display 类型(如 table)，以及介于中间的 anonymous box。

一个\*\* anonymous box\*\* 是一个不与任何元素相关联的 box。Anonymous box 在特定情况下被生成，用来在 box tree 需要一个特殊的嵌套结构，且这个结构不被从 element tree 生成的 box 们提供时，修补 box tree。比如: 一个 table cell box 要求其父 box 是 table row box。如果它的父 box 不是的话，就会自动生成一个。它与由元素直接生成的 box 的不同之处在于，后者会严格按照 element tree 来继承样式，而 anonymous box 通过它的子代来继承。

<font style="color:rgb(51, 51, 51);">在布局过程中，box 和 text runs可以分为多个片段。 例如，在 fragmentation 过程中, 当一个 inline box 和/或 text run 分裂到多行，或当给 block box 被分裂到多页或多列。它也可能由于</font>[bidi重排](https://www.w3.org/TR/css-writing-modes-3/#bidi-algo)<font style="color:rgb(51, 51, 51);">文本或高级的display类型的box分割， 如 </font>[block-in-inline](https://www.w3.org/TR/CSS2/visuren.html#img-anon-block)<font style="color:rgb(51, 51, 51);"> 分割或 </font>[column-spanner-in-block](https://www.w3.org/TR/css-multicol-1/#spanning-columns)<font style="color:rgb(51, 51, 51);"> 分割。一个 box 因此由一个或多个 box fragments 组成，一个 text run 由一个或多个 text fragments组成。</font>

## Box Layout Modes: the `display` property

## Run-In Layout

> CSS Display Module Level 3 W3C Candidate Recommendation Draft, 18 December 2020 <https://www.w3.org/TR/css-display-3/>


> 更新: 2021-04-27 09:09:53  
> 原文: <https://www.yuque.com/viruspc/el3mi0/um6bap>