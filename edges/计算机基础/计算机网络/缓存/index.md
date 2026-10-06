# 缓存

1、HTTP缓存



A、强缓存：Expires,Cache-Control



B、协商缓存:Etag/If-None-Match、Last-Modified/If-Modified-Since



执行流程：1）强缓存未失效，从缓存中读取数据，cache-control优先级高于Expires。2）强缓存已失效，执行协商缓存，Etag的优先级高于last-Modified。3）缓存未失效从缓存中读取数据返回304状态码。4）缓存已失效返回资源和200状态码。



2、浏览器缓存



A、本地小容量缓存



LocalStorage：只要不手动清除就会一直存，限制最多5M。



SessionStorage：仅在当前窗口关闭前有效，限制最多5M。



Cookie：会在在同源的http请求中携带，不能超过4K，参与和服务器交互。设置过期时间之前一直有效，不设置过期时间窗口关闭则清除



B、本地大容量缓存



websql



IndexDB



3、应用程序缓存



应用缓存



PWA



1）是一个web网页应用



2）可以添加至主屏幕，点击主屏幕的图标可以实现启用动画以及隐藏地址栏



3）实现了离线缓存功能，即使手机没有网络，依然可以实现一些离线功能



4）实现了消息推送

————————————————

版权声明：本文为CSDN博主「KunQian_smile」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。

原文链接：[https://blog.csdn.net/qq_24892029/article/details/125643175](https://blog.csdn.net/qq_24892029/article/details/125643175)



> 更新: 2022-09-16 01:39:12  
> 原文: <https://www.yuque.com/viruspc/el3mi0/yoyr57>