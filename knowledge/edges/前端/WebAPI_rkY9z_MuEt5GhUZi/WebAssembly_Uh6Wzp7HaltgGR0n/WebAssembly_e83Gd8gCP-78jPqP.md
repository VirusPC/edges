# WebAssembly

- [什么是WebAssembly](#%E4%BB%80%E4%B9%88%E6%98%AFwebassembly)
- [解决的问题](#%E8%A7%A3%E5%86%B3%E7%9A%84%E9%97%AE%E9%A2%98)
- [配置wasm环境](#%E9%85%8D%E7%BD%AEwasm%E7%8E%AF%E5%A2%83)
- [基本使用](#%E5%9F%BA%E6%9C%AC%E4%BD%BF%E7%94%A8)

---

# 什么是WebAssembly

WebAssembly是一种新的代码类型。它是一个底层的类似汇编的语言，以紧凑的二进制的形式存储。它被设计为高级编程语言（例如C、C++和Rust等）的编译的可移植目标，允许在web端以近乎native的性能来执行这些语言的代码。

# 解决的问题

JavaScript与本地代码之间的性能差距。

通过提供一种在浏览器中直接运行编译代码的方式，WebAssembly可以极大地提高Web应用程序的性能，使它们更接近本地应用程序的性能。此外，由于WebAssembly被设计为可移植和语言无关的格式，它为想要使用各种编程语言编写高性能应用程序的Web开发人员开辟了新的可能性。

# 配置wasm环境

开始： <https://emscripten.org/docs/getting_started/downloads.html>

cmd下运行`emsdk install latest`，脚本中可能会会有些python的库用不了，用powershell

在powershell上可能会出现："因为在此系统上禁止运行脚本"报错， 管理员模式下执行<code><font style="color:rgb(0, 0, 0);">set-ExecutionPolicy RemoteSigned;</font></code> <https://www.jianshu.com/p/f4854a0a900d>

安装完后，每次使用都要通过powershell，调用emsdk activate来激活，再用emcc编译等

# 基本使用

web平台分为两部分：

1. 一个运行web应用代码的虚拟机。如：javascript、webassembly
2. 一些Web API, web应用可以调用这些API来控制网络浏览器/设备的功能，(DOM, CSSOM, WebGL, IndexedDB, Web Audio API, etc.).

<font style="color:rgb(27, 27, 27);">The different code types can call each other as required — the </font>[WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly)<font style="color:rgb(27, 27, 27);"> wraps exported WebAssembly code with JavaScript functions that can be called normally, and WebAssembly code can import and synchronously call normal JavaScript functions. In fact, the basic unit of WebAssembly code is called a module and WebAssembly modules are symmetric in many ways to ES2015 modules.</font>

<font style="color:rgb(27, 27, 27);"></font>

<font style="color:rgb(27, 27, 27);">使用wasm的方法</font>

1. <font style="color:rgb(27, 27, 27);">通过glue code间接使用</font>
2. ` WebAssembly.compileStreaming/WebAssembly.instantiateStreaming` <https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running>
3. <font style="color:rgb(27, 27, 27);">In the future, WebAssembly modules will be </font>[loadable just like ES2015 modules](https://github.com/WebAssembly/proposals/issues/12)<font style="color:rgb(27, 27, 27);"> (using </font><font style="color:rgb(27, 27, 27);background-color:rgb(244, 244, 244);"><script type='module'></font><font style="color:rgb(27, 27, 27);">), meaning that JavaScript will be able to fetch, compile, and import a WebAssembly module as easily as an ES2015 module.</font>

<font style="color:rgb(27, 27, 27);"></font>

<font style="color:rgb(27, 27, 27);">Module:</font>

<font style="color:rgb(27, 27, 27);">Instance:</font>

<font style="color:rgb(27, 27, 27);">Table: 函数列表</font>

<font style="color:rgb(27, 27, 27);">Memorey: wasm运行的内存大小，可设置初始值和最大值， 是否\[共享]\(</font><https://developer.mozilla.org/en-US/docs/WebAssembly/Understanding_the_text_format#shared_memories><font style="color:rgb(27, 27, 27);">)等</font>

<font style="color:rgb(27, 27, 27);"></font>

<font style="color:rgb(27, 27, 27);">2方法下，获取导出函数的两种途径： You can retrieve exported WebAssembly functions in two ways:</font>

* <font style="color:rgb(27, 27, 27);">By calling</font><font style="color:rgb(27, 27, 27);"> </font>[Table.prototype.get()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table/get)<font style="color:rgb(27, 27, 27);"> </font><font style="color:rgb(27, 27, 27);">on an existing table.</font>
* <font style="color:rgb(27, 27, 27);">By accessing a function exported from a wasm module instance via </font>[Instance.exports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Instance/exports)<font style="color:rgb(27, 27, 27);">.</font>

<font style="color:rgb(27, 27, 27);"></font>

<https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts>

ccall, cwrap: <https://emscripten.org/docs/api_reference/preamble.js.html#id3>


> 更新: 2023-04-22 09:09:04  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ogu6yb28a5lhgg2y>