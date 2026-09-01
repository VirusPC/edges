# 架构模式





多层架构？



web应用三层架构: 表现层 服务层 持久层。表示层负责接收用户请求、转发请求、显示数据等；业务层负责组织业务逻辑；持久层负责持久化业务对象。



这三个分层，每一层都有不同的模式，就是架构模式



表现层架构模式: MVC MVP MVVP。  
业务层的架构模式: 事务脚本模式、领域模型模式、CQRS 等等（另一种说法是贫血、失血、充血、胀血...）。  
持久层架构模式: 入口模式、数据映射器模式(hibernate)等等。



最开始，MVC是后端的一种设计模式。后面前后端分离，后端不需要输出html，mvc就变成了前端的设计模式。但前后端分离产生了seo的相关问题。。。中台，SSR。。。



backbone.js是MVC(不完全是)  
angular.js 是MVC  
vue是MVVM(不完全是)  
react只是个V



框架 > 架构模式> 设计模式 > 设计原则。打个比方，Hibernate是一个持久层框架，是数据映射器模式的具体实现，实现时用到了工厂模式等很多设计模式，体现了什么依赖倒转原则、开闭原则、里氏替换原则等等设计原则。AngularJS是一个客户端 MVC 框架，是 MVC架构模式的一种实现，实现时用到。。。。设计模式，体现了。。。。等设计原则。Struts/[http://ASP.NET](http://ASP.NET) MVC是表示层框架。。。。。诸如此类。



MVC: 可视化中的Reference Model（的表现层的位置）也用到了MVC。（虚线表示UML图中的依赖关系，Controller和view都依赖于Model）



MVC, MVP, MVVM [https://www.zhihu.com/question/20148405/answer/23813147](https://www.zhihu.com/question/20148405/answer/23813147)

阮一峰 MVC MVP MVVM [http://www.ruanyifeng.com/blog/2015/02/mvcmvp_mvvm.html](http://www.ruanyifeng.com/blog/2015/02/mvcmvp_mvvm.html) （mvc模型好像不太对）  
react mvvm [https://www.zhihu.com/answer/609321144](https://www.zhihu.com/answer/609321144)  
三层框架和MVC [https://www.zhihu.com/answer/27339010](https://www.zhihu.com/answer/27339010)  
前后端分离与MVC [https://blog.csdn.net/dianqiaocu5692/article/details/101278106](https://blog.csdn.net/dianqiaocu5692/article/details/101278106)  
Model-View-Controller [https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff649643(v=pandp.10)?redirectedfrom=MSDN](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff649643(v=pandp.10)?redirectedfrom=MSDN)



> 更新: 2022-03-04 12:49:21  
> 原文: <https://www.yuque.com/viruspc/el3mi0/td7t09>