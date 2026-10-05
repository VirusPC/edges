# 居中

- [水平居中](#%E6%B0%B4%E5%B9%B3%E5%B1%85%E4%B8%AD)
- [垂直居中](#%E5%9E%82%E7%9B%B4%E5%B1%85%E4%B8%AD)

---

flex, 盒模型，transform，绝对定位

# 水平居中
1. 行内元素: text-align: center;
2. 块级元素: margin: 0 auto; (需要指定with或绝对定位加left/right)
3. flex
4. position: absolute; left:50%; 
    1. transform: translateX(50%)
    2. width: @width ; margin-left: 0.5 * @width; 
5. 

# 垂直居中
1. 若元素是单行文本, 则可设置 line-height 等于父元素高度
2. vertical-align



> 更新: 2022-09-20 18:46:25  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ob1p0e>