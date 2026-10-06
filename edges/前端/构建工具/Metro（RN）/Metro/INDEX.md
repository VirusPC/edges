# Metro

- [Metro 是什么（面试版）](#metro-%E6%98%AF%E4%BB%80%E4%B9%88%E9%9D%A2%E8%AF%95%E7%89%88)
- [Metro 核心能力/特点（建议背这几条）](#metro-%E6%A0%B8%E5%BF%83%E8%83%BD%E5%8A%9B%E7%89%B9%E7%82%B9%E5%BB%BA%E8%AE%AE%E8%83%8C%E8%BF%99%E5%87%A0%E6%9D%A1)
- [与 Webpack 的对比（从面试官常问维度）](#%E4%B8%8E-webpack-%E7%9A%84%E5%AF%B9%E6%AF%94%E4%BB%8E%E9%9D%A2%E8%AF%95%E5%AE%98%E5%B8%B8%E9%97%AE%E7%BB%B4%E5%BA%A6)
  * [1) 定位与目标环境](#1-%E5%AE%9A%E4%BD%8D%E4%B8%8E%E7%9B%AE%E6%A0%87%E7%8E%AF%E5%A2%83)
  * [2) 模块解析与平台差异](#2-%E6%A8%A1%E5%9D%97%E8%A7%A3%E6%9E%90%E4%B8%8E%E5%B9%B3%E5%8F%B0%E5%B7%AE%E5%BC%82)
  * [3) 资源与非 JS 文件处理](#3-%E8%B5%84%E6%BA%90%E4%B8%8E%E9%9D%9E-js-%E6%96%87%E4%BB%B6%E5%A4%84%E7%90%86)
  * [4) 开发服务器与热更新](#4-%E5%BC%80%E5%8F%91%E6%9C%8D%E5%8A%A1%E5%99%A8%E4%B8%8E%E7%83%AD%E6%9B%B4%E6%96%B0)
  * [5) 生态与可扩展性](#5-%E7%94%9F%E6%80%81%E4%B8%8E%E5%8F%AF%E6%89%A9%E5%B1%95%E6%80%A7)
  * [6) 代码分割（Code Splitting）](#6-%E4%BB%A3%E7%A0%81%E5%88%86%E5%89%B2code-splitting)
- [一句话总结（可直接当面试收尾）](#%E4%B8%80%E5%8F%A5%E8%AF%9D%E6%80%BB%E7%BB%93%E5%8F%AF%E7%9B%B4%E6%8E%A5%E5%BD%93%E9%9D%A2%E8%AF%95%E6%94%B6%E5%B0%BE)

---

## Metro 是什么（面试版）

\*\*Metro（Metro Bundler）\*\*是 **React Native 官方默认的 JavaScript 打包器与开发服务器**。它负责把 RN 工程里的 JS/TS 模块解析、打包成设备可加载的 bundle，并提供开发期的增量编译、Fast Refresh、Source Map、错误覆盖层等能力。

你可以把 Metro 理解为：**为“JS 跑在移动端引擎（Hermes/JSC）+ 资源要进原生包（iOS/Android）”这个场景量身定制的 bundler**。

***

## Metro 核心能力/特点（建议背这几条）

* **面向 RN runtime 的打包产物**：产出 RN 可执行的 JS bundle（含 source map），支持开发期从 dev server 拉取。
* **RN 专用的模块解析（resolver）**：
  * 平台文件优先：`*.ios.*`、`*.android.*`、`*.native.*`
  * 支持 `react-native` 条件导出/入口（与 `package.json` `exports` 条件相关）
* **原生资源（assets）打包友好**：`require('./img.png')` 这类会按 RN 资源体系处理（多倍图、资源映射、与原生打包协作）。
* **开发体验深度集成 RN CLI**：Fast Refresh、调试、红屏/黄屏、真机/模拟器加载协议等开箱即用。
* **可配置点**：`metro.config.js`（transformer、resolver、serializer、watcher 等）。也有一些 `unstable_*` 试验字段（你前面提到的 `unstable_conditionNames` 就是这类）。

***

## 与 Webpack 的对比（从面试官常问维度）

### 1) 定位与目标环境

* **Metro**：主要面向 **React Native（Hermes/JSC + iOS/Android）**
* **Webpack**：主要面向 **Web（浏览器）**，也可扩展到 Node/SSR，但核心是 Web 生态

**总结**：两者都是 bundler，但**默认假设的运行时完全不同**。

***

### 2) 模块解析与平台差异

* **Metro 强项**：内置 RN 平台优先级（`.ios/.android/.native`）、RN 条件入口选择
* **Webpack 强项**：通过 `resolve.mainFields / alias / conditionNames` 等能高度定制，但需要你把 RN 那套规则“配出来”

**总结**：RN 项目里，Metro 是“默认就对”；Webpack 是“能做但要工程化配置与维护”。

***

### 3) 资源与非 JS 文件处理

* **Metro**：原生理解 RN 的 asset 模型（图片多倍图、打进原生包、资源 ID 映射）
* **Webpack**：asset modules / loader 体系很成熟，但语义是“Web 资源 → URL/内联/文件输出”，不天然对齐 RN 资源系统

***

### 4) 开发服务器与热更新

* **Metro**：与 RN CLI/设备加载流程深度绑定；Fast Refresh、打包服务、source map 传输是一个整体
* **Webpack**：`webpack-dev-server` / HMR 非常成熟，但主要服务浏览器；要适配 RN 真机加载与调试链路需要额外工作

***

### 5) 生态与可扩展性

* **Webpack**：
  * 插件/loader 生态极其庞大（CSS、图片、代码分割、Module Federation 等）
  * 用途广：应用、SSR、微前端、库构建等
* **Metro**：
  * 插件扩展点有，但生态明显更聚焦 RN
  * “做 RN 正事”非常顺手，“做 Web 那套花活”不如 Webpack

***

### 6) 代码分割（Code Splitting）

* **Webpack**：Web 端 code splitting 是一等公民（按路由/按模块动态加载非常成熟）
* **Metro**：历史上以“单 bundle/有限分包方案”为主；近年 RN 生态也在推进更好的拆包/按需加载，但整体不如 Webpack 在 Web 场景成熟

> 面试表达建议：别说“Metro 不支持”，而说“Metro 的分包能力与 Web 端成熟度相比相对有限/生态不如 Webpack 完整”。

***

## 一句话总结（可直接当面试收尾）

* **Metro**：为 React Native 量身定制的 bundler+dev server，强在平台解析、原生资源、与 RN 调试/热更新链路的一体化。
* **Webpack**：面向 Web 的通用 bundler 平台，强在插件生态、资源处理与 Web 场景的代码分割/工程化能力。

***

如果你愿意，我可以再按面试常见追问帮你准备“追问答案”，比如：

* “Metro 的 pipeline/transformer 是怎么工作的？”
* “如何排查 Metro resolver 冲突、monorepo watch 失效？”
* “为什么会出现 `exports` 解析问题，`unstable_conditionNames` 怎么用？”


> 更新: 2026-01-04 08:30:33  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ruc47wlxgf14rzfq>