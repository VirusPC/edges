# 大数据可视化

对于大规模数据，可视化方式需要转变：

1. 数据完整，数据按正常全部展示出来效果可能很差：
    1. 转变可视化方式：scatter plot / line chart -> density plot  -> smooth
    2. 只可视化部分：sampling
2. 数据可能无法一次性读入
3. 数据可能是逐渐到达的：stream data, online data, progressive
4. 数据渲染太慢：webgl, worker



> 更新: 2022-02-23 13:26:30  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ndx75v>