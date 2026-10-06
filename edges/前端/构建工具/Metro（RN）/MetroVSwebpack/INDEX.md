# Metro VS webpack

- [RN 为什么通常不用 Webpack（而用 Metro）](#rn-%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%9A%E5%B8%B8%E4%B8%8D%E7%94%A8-webpack%E8%80%8C%E7%94%A8-metro)
  * [1) **运行环境不是浏览器**](#1-%E8%BF%90%E8%A1%8C%E7%8E%AF%E5%A2%83%E4%B8%8D%E6%98%AF%E6%B5%8F%E8%A7%88%E5%99%A8)
  * [2) **RN 的模块解析规则/平台分发更“特殊”**](#2-rn-%E7%9A%84%E6%A8%A1%E5%9D%97%E8%A7%A3%E6%9E%90%E8%A7%84%E5%88%99%E5%B9%B3%E5%8F%B0%E5%88%86%E5%8F%91%E6%9B%B4%E7%89%B9%E6%AE%8A)
  * [3) **资源（assets）处理方式不同**](#3-%E8%B5%84%E6%BA%90assets%E5%A4%84%E7%90%86%E6%96%B9%E5%BC%8F%E4%B8%8D%E5%90%8C)
  * [4) **开发体验与调试链路是 RN 专门适配的**](#4-%E5%BC%80%E5%8F%91%E4%BD%93%E9%AA%8C%E4%B8%8E%E8%B0%83%E8%AF%95%E9%93%BE%E8%B7%AF%E6%98%AF-rn-%E4%B8%93%E9%97%A8%E9%80%82%E9%85%8D%E7%9A%84)
  * [5) **性能优化点是“移动端 bundle”取向**](#5-%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96%E7%82%B9%E6%98%AF%E7%A7%BB%E5%8A%A8%E7%AB%AF-bundle%E5%8F%96%E5%90%91)
  * [6) **生态与“默认路径依赖”**](#6-%E7%94%9F%E6%80%81%E4%B8%8E%E9%BB%98%E8%AE%A4%E8%B7%AF%E5%BE%84%E4%BE%9D%E8%B5%96)
- [那 RN 什么时候会用到 Webpack？](#%E9%82%A3-rn-%E4%BB%80%E4%B9%88%E6%97%B6%E5%80%99%E4%BC%9A%E7%94%A8%E5%88%B0-webpack)

---

## RN 为什么通常不用 Webpack（而用 Metro）

### 1) **运行环境不是浏览器**

React Web 的 bundler（Webpack/Vite/Rollup）默认目标是：

* 浏览器的模块系统与加载方式
* DOM 相关特性
* Web 资源路径/HTTP 服务方式

而 React Native 的 JS 是跑在 **Hermes/JSC** 这类 JS 引擎里，通过 **Native Bridge/JSI** 调原生能力，既没有 DOM，也没有浏览器的资源加载模型。\
Metro 的设计目标就是“把代码打成 RN runtime 最好消费的 bundle 形态”。

***

### 2) **RN 的模块解析规则/平台分发更“特殊”**

RN 常见写法：

* `Foo.ios.tsx` / `Foo.android.tsx` / `Foo.native.tsx` 等平台文件
* `react-native` 字段、`exports` 条件导出里 `react-native` 条件
* 对某些 Node 内置模块的替代/屏蔽策略

Metro 内置了这些 **平台优先级与 resolver 规则**，而 Webpack 虽然也能配，但通常要自己堆 loader/plugin/alias 规则，维护成本高且容易踩坑。

***

### 3) **资源（assets）处理方式不同**

RN 不只是把图片当作 URL：

* `require('./icon.png')` 在 RN 里会变成“资源 ID + 多倍图（@2x/@3x）+ 平台打包资源”的一整套机制
* 字体、图片等需要与 iOS/Android 的资源系统对接

Metro 对 RN assets 的打包/映射是“原生优先”的；Webpack 的资产模型主要是面向 Web 静态资源与 URL。

***

### 4) **开发体验与调试链路是 RN 专门适配的**

Metro 直接服务 RN 的开发流程：

* Fast Refresh（RN 工作流的默认集成）
* 与 RN CLI、真机/模拟器的加载协议、source map、错误覆盖层等配合
* 在设备上“从 dev server 拉 bundle”的模式是 RN 的标配

Webpack 也能做 HMR，但把这一整套与 RN CLI/设备加载打通，成本高且收益不一定大。

***

### 5) **性能优化点是“移动端 bundle”取向**

Metro 针对移动端做过很多取舍/优化（不同版本侧重点不同），例如：

* 更适合 RN 的 bundle 结构、分包/预加载思路（历史上有 RAM bundle 等）
* 一些与 RN runtime/引擎配合的打包策略（如 inline requires 这类方向）

Webpack 当然也能做优化，但它的主战场是 Web，默认优化目标不完全一致。

***

### 6) **生态与“默认路径依赖”**

RN 从最早就把 Metro 作为官方默认 bundler，周边生态（RN CLI、文档、模板、社区排障）都围着它转。\
这会导致“用 Webpack 不是不行，但会变成你要维护一套非主流链路”。

***

## 那 RN 什么时候会用到 Webpack？

* **React Native for Web**（同一套 RN 组件跑到浏览器）：Webpack/Vite 常见
* **特殊 monorepo/公司内部统一构建系统**：可能会尝试用 Webpack/esbuild/turbopack 等替代，但工程投入通常更大

***

如果你说下你的目标（例如：想把 RN 构建统一到公司 Webpack 体系？想加 Module Federation？想提升构建速度？），我可以按目标给你评估“坚持 Metro 还是引入 Webpack/别的 bundler”的利弊与可行方案。


> 更新: 2026-01-04 06:55:58  
> 原文: <https://www.yuque.com/viruspc/el3mi0/iq35zi2czyxwfidg>