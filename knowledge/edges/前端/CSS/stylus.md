# stylus

下面从语法风格、变量/函数、混入与继承、嵌套与父选择器、插值与运算、控制语句、导入与模块、内置函数、生态与工具链等方面，对 Stylus 与 SCSS 的差异做一个清晰对比，并给出示例。

一图速览

+ Stylus：极简可选语法（可省花括号/分号/冒号），更自由的“缩进式”风格，内置函数多、写法更短；历史上在 Node.js/Express/前端脚手架里流行。
+ SCSS：CSS 超集，语法接近原生 CSS，规整且与现代工具链高度兼容，生态最强，推荐在大型团队与长期维护项目中使用。
1. 语法风格与可选符号
+ SCSS：严格接近 CSS。必须用花括号{}、分号;、属性名后冒号:。
+ Stylus：极简可选，三件套都可省略；支持缩进式（类似 Sass 缩进语法）或常规带{}。同时支持无冒号属性写法。

示例（等价样式）：  
SCSS

```plain
.button {
  color: #333;
  padding: 8px 12px;
}
```

Stylus（缩进式，省略:、;、{}）

```plain
.button
  color #333
  padding 8px 12px
```

Stylus（也可用传统花括号）

```plain
.button {
  color: #333
  padding: 8px 12px
}
```

2. 变量与默认值
+ SCSS：变量用 $name。默认值用 !default。
+ Stylus：变量直接标识符或用 $name 都行（习惯是无前缀）。默认值用 ?=。

示例：  
SCSS

```plain
$primary: #07c !default;
.button { color: $primary; }
```

Stylus

```plain
primary ?= #07c
.button
  color primary
```

3. 混入（Mixin）与函数
+ SCSS：@mixin/@include 定义与调用；@function 返回值。
+ Stylus：mixin 就是函数或“调用块”，调用时像函数；return 省略时可用表达式最后一行值。

示例：带参数与默认值  
SCSS

```plain
@mixin btn($c: #333, $p: 8px 12px) {
  color: $c;
  padding: $p;
}
.button { @include btn(#07c, 6px 10px); }
```

Stylus

```plain
btn(c = #333, p = 8px 12px)
  color c
  padding p

.button
  btn(#07c, 6px 10px)
```

函数返回值  
SCSS

```plain
@function px2rem($px, $base: 16) {
  @return ($px / $base) * 1rem;
}
.title { font-size: px2rem(20); }
```

Stylus

```plain
px2rem(px, base = 16)
  (px / base) * 1rem

.title
  font-size px2rem(20)
```

4. 继承与占位选择器
+ SCSS：@extend 支持占位选择器 %placeholder，合并规则稳定。
+ Stylus：有类似 extend，但生态里常更多用 mixin 来复用，或使用 @extend 语法（取决于 stylus 插件/风格）。

SCSS

```plain
%btn-base { display: inline-block; border-radius: 4px; }
.btn { @extend %btn-base; }
```

Stylus（常见是用 mixin 复用）

```plain
btn-base()
  display inline-block
  border-radius 4px

.btn
  btn-base()
```

5. 嵌套与父选择器引用
+ SCSS：& 表示父选择器，支持在任意位置拼接。
+ Stylus：同样用 &；但因可省略多种符号，写法更简洁。

示例：  
SCSS

```plain
.button {
  &--primary { color: #07c; }
  &:hover { opacity: .9; }
}
```

Stylus

```plain
.button
  &--primary
    color #07c
  &:hover
    opacity .9
```

6. 插值与运算
+ SCSS：#{...} 插值；/ 有时是除法有时是分隔符（现代 Dart Sass 改为 math.div）。
+ Stylus：字符串插值使用 { }，运算更自由，自动加单位、类型转换较多（有时会“太聪明”）。

示例（动态类名）：  
SCSS

```plain
$size: large;
.icon-#{$size} { width: 32px; }
```

Stylus

```plain
size = large
.icon-{size}
  width 32px
```

7. 条件与循环（控制指令）
+ SCSS：@if/@else, @for, @each, @while。
+ Stylus：if/else, for/in，语法更接近脚本语言。

示例：生成间距工具类  
SCSS

```plain
@for $i from 0 through 5 {
  .m-#{$i} { margin: #{$i * 4}px; }
}
```

Stylus

```plain
for i in 0..5
  .m-{i}
    margin i * 4px
```

8. 导入与模块化
+ SCSS：@use/@forward（现代推荐），@import 已被弃用；命名空间管理清晰。
+ Stylus：@import、@require 等；没有 @use/@forward 的模块命名空间体系，易全局污染但上手简单。

SCSS

```plain
@use "utils/colors" as c;
.button { color: c.$primary; }
```

Stylus

```plain
@import 'utils/colors'  // 变量/函数直接进全局
.button
  color primary
```

9. 内置函数与颜色处理
+ 两者都有丰富的颜色、列表、映射处理函数。
+ SCSS 有 map、list 等明确类型与一套稳定 API。
+ Stylus 内置函数更多“宽松”，如单位推断、隐式转换，写起来省事，但可能带来隐式行为。
10. 插件与生态
+ SCSS（Dart Sass）是官方实现，更新活跃，生态与构建工具（Webpack/Vite/PostCSS）集成好，Typescript/Design System 团队更常选。
+ Stylus 社区相对冷却，新项目较少使用；但在老项目、喜欢极简写法的团队仍有存量。
11. 与原生 CSS 的对齐度
+ SCSS：语法是 CSS 超集，几乎所有 CSS 都能原样粘贴，迁移到 PostCSS/CSS 变量较顺滑。
+ Stylus：因可省略符号与灵活语法，迁移回纯 CSS 需要调整更多。
12. 选择建议
+ 选 SCSS：
    - 团队协作、多端复杂项目、长期维护；
    - 需要与现代工具链、设计系统紧密配合；
    - 更希望“所见即 CSS”的可读性与一致性。
+ 选 Stylus：
    - 个人或小团队偏好极简语法、快速书写；
    - 老项目延续；
    - 更习惯缩进式、函数式风格。

快速对照小结

+ 变量：SCSS 用 $ var；Stylus 直接 var 或  $var，默认值：SCSS !default，Stylus ?=
+ 语法符号：SCSS 必须 {};:; Stylus 可省略并支持缩进式
+ Mixin：SCSS @mixin/@include；Stylus 直接函数调用
+ 模块化：SCSS @use/@forward；Stylus @import/@require（全局）
+ 父选择器：两者都是 &
+ 控制语句：SCSS 用 @ 指令；Stylus 更像脚本语法
+ 生态：SCSS 更主流活跃；Stylus 相对小众

如果你有具体代码片段，我可以把它从 Stylus 转成 SCSS（或反之），并解释每一步的等价写法与注意点。



> 更新: 2025-11-13 08:32:23  
> 原文: <https://www.yuque.com/viruspc/el3mi0/kgupdy1oll3qpdt9>