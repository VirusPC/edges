# 微前端

三种微前端方案

| <font style="color:rgb(0, 0, 0);">方案类型</font> | <font style="color:rgb(0, 0, 0);">典型技术</font> | <font style="color:rgb(0, 0, 0);">优点</font> | <font style="color:rgb(0, 0, 0);">缺点</font> | <font style="color:rgb(0, 0, 0);">共同点</font> |
| :--- | :--- | :--- | :--- | :--- |
| <font style="color:rgb(0, 0, 0);">接口协议</font> | <font style="color:rgb(0, 0, 0);">single-spa</font> | <font style="color:rgb(0, 0, 0);">比较自由，可自主封装</font> | <font style="color:rgb(0, 0, 0);">无法满足很多场景</font> | + <font style="color:rgb(0, 0, 0);">子应用</font><font style="color:rgb(0, 0, 0);">/</font><font style="color:rgb(0, 0, 0);">模块互不干涉   </font><br/>+ <font style="color:rgb(0, 0, 0);">技术栈无关</font> |
| <font style="color:rgb(0, 0, 0);">沙箱隔离</font> | <font style="color:rgb(0, 0, 0);">qiankun</font> | <font style="color:rgb(0, 0, 0);">开发思维简单直接</font> | <font style="color:rgb(0, 0, 0);">沙箱带来的性能等问题</font> | |
| <font style="color:rgb(0, 0, 0);">模块协议</font> | <font style="color:rgb(0, 0, 0);">webpack module federation</font> | <font style="color:rgb(0, 0, 0);">用模块思维理解引用</font> | <font style="color:rgb(0, 0, 0);">脱离构建工具无法使用</font> | |




ice.js采用沙箱隔离

优点：<font style="color:rgb(0, 0, 0);">开发思维简单直接</font>

缺点：<font style="color:rgb(0, 0, 0);">沙箱带来的性能等问题</font>



引出的问题：如何通信？





[腾讯CDC](https://cdc.tencent.com/2022/02/22/micro-frontend-framework/)



> 更新: 2023-07-17 15:37:26  
> 原文: <https://www.yuque.com/viruspc/el3mi0/dco9y520i3vm2tde>