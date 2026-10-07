# Worker 基础

worker.js和普通js脚本的区别：

1. 有一些全局的对象，用来对事件、错误等做出反应：`onmessage`, `onerror`, `onerror`等
   1. 里面可以使用全局postMessage来向产生该worker的线程发送信息
2. 通过`importScripts("a.js", "b.js")`导入脚本
3. 与dedicated worker相比，shared worker可以在线程间共享
4. 不存在window全局对象，可使用self，globalThis
5. 不能直接修改页面，包括不能侧坐DOM和使用页面的对象。

可通过`worker.terminate()`来提前终止worker

dedicated worker 外还有 shared work。shared worker不能直接向shared worker`postMessage`, 需要通过port来post，worker.js中通过`onconnect`而非`onmessage`来处理消息。`onconnect`的参数是一个事件，具有一个`ports`属性，通过调用`ports[i].postMessage()`来向第i个port传消息。

当然也存在其他worker，service workers， audio worklet <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#other_types_of_worker>

线程安全性：woker产生真正的操作系统级的线程。因为web workers 很小心的控制着与其他线程交流的点，不允许访问非线程安全的组件或DOM，通过序列化（值拷贝）来传入传出数据，很难造成并发问题。正常情况下无法访问dom（dom无法通过structeredClone拷贝），且直接通过`createElement`创建canvas元素获取不到gl context =》 也就是无法使用canvas API。但通过offscreenCanvas，我们可以使用canvas API, 做·离屏渲染。ssvg这篇paper有用到 <https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas>

worker通过strucuredClone来传递数据，注意不要传函数`worker.postMessage(uInt8Array.buffer, [uInt8Array.buffer])`会在背后调`strucutredClone(uInt8Array.buffer, [uInt8Array.buffer])`来迁移数据，性能更好 <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm>

embedded workers: 1. 添加一个无法被js引擎识别的script标签，在里面写worker的代码 2.在真正的主线程脚本中，通过 `new Blob`创建资源，再通过`window.URL.createObjectURL(blob)`来创建worker的url 3. 用url新建worker  <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#embedded_workers>

测试某个对象是否可以在worker中使用： <https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm>

<https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers>


> 更新: 2023-04-22 09:13:11  
> 原文: <https://www.yuque.com/viruspc/el3mi0/fkivq45ywyd4hv3u>