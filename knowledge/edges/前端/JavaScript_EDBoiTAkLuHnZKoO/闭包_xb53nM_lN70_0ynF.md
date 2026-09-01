# 闭包

- [什么是闭包](#%E4%BB%80%E4%B9%88%E6%98%AF%E9%97%AD%E5%8C%85)
- [使用场景](#%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF)
- [优缺点:](#%E4%BC%98%E7%BC%BA%E7%82%B9)

---

## 什么是闭包
<font style="color:rgb(18, 18, 18);"></font>

<font style="color:rgb(18, 18, 18);">一个函数和对其周围状态（lexical environment，词法环境）的引用捆绑在一起（或者说函数被引用包围），这样的组合就是闭包（closure）. 在</font>**<font style="color:rgb(18, 18, 18);">内部函数使用外部函数的变量</font>**<font style="color:rgb(18, 18, 18);">, 就会形成闭包, 闭包是当前作用域的延伸</font>



<font style="color:rgb(18, 18, 18);"></font>

## <font style="color:rgb(18, 18, 18);">使用场景</font>
1. 私有变量, (暴露函数内部的变量)
2. throttle, debounce



## 优缺点:
1. 优点:
    1. 减少全局变量
    2. 私有变量
    3. 减少传递函数的参数量
    4. 封装
2. 缺点:
    1. 内存的不到释放,多过的闭包会导致内存溢出. 可以把不需要的变量, 但是垃圾回收又收不走的赋值为null,让垃圾回收机制可以回收掉.



> 更新: 2022-03-09 07:08:45  
> 原文: <https://www.yuque.com/viruspc/el3mi0/negwg4>