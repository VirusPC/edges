# 页面加载时触发的事件

事件触发流程总结

1. HTML 文档加载和解析：
+ readystatechange (loading)：文档开始加载。readystatechange (interactive)：DOM 树构建完成。
+ DOMContentLoaded：HTML 文档解析完成（不包括资源）。
+ readystatechange (complete)：文档和资源完全加载。
2. 资源加载完成：
+ load：页面及所有资源加载完成。
3. 页面卸载：
+ beforeunload：页面即将卸载。
+ unload：页面卸载完成。



```jsx
graph LR
A[开始请求] --> B[readystatechange: loading]
B --> C[DOM 解析中]
C --> D[readystatechange: interactive]
D --> E[DOMContentLoaded]
E --> F[资源加载中]
F --> G[img/script/link onload]
G --> H[readystatechange: complete]
H --> I[window.onload]
I --> J[页面完全加载]
J --> K[用户离开时 beforeunload]
K --> L[unload]
```



> 更新: 2025-06-07 18:34:10  
> 原文: <https://www.yuque.com/viruspc/el3mi0/qgmiffnypq8b09ec>