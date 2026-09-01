# 大规模数据可视化

- [问题](#%E9%97%AE%E9%A2%98)
- [存储](#%E5%AD%98%E5%82%A8)
- [数据处理](#%E6%95%B0%E6%8D%AE%E5%A4%84%E7%90%86)
- [可视化形式](#%E5%8F%AF%E8%A7%86%E5%8C%96%E5%BD%A2%E5%BC%8F)
- [加速渲染](#%E5%8A%A0%E9%80%9F%E6%B8%B2%E6%9F%93)
- [交互](#%E4%BA%A4%E4%BA%92)
- [加速交互](#%E5%8A%A0%E9%80%9F%E4%BA%A4%E4%BA%92)

---

## 问题
1. 视觉混乱
    1. 展示部分数据
    2. 展示数据的部分维度
    3. 展示全部数据的统计结果
    4. 展示全部数据，解决遮挡问题
2. 渲染速度慢
    1. 特殊数据结构
    2. 并行
    3. GPU
    4. 。。。
3. 查询速度慢
    1. 



会进一步导致：

1. impeding interaction
2. preventing exploration
3. delaying the extraction of insights



## 存储
+ 分布式
+ data cube => time lattice (time series)
+ 线段KD-Tree/ball-tree/bvh-tree/segment-tree ...

## 数据处理
+ data reduction
    - progressive
    - samplling. approximate, 不能防止overplot, 可能丢掉重要的outlier.
    - aggregation
    - bin-summarize-smooth-visualization
    - m4(time series)
    - rdp(time series)
    - P4, 利用webgl做map/reduce/derive/filter数据处理
+ dimensionality reduction: 
    - PCA
    - t-sne



## 可视化形式
1. common: 
    1. transparancy
    2. density
2. scatter: continuous scatterplots
3. line (time series), 平行坐标系: 
    1. hali
    2. 无视渲染顺序,按线的重要程度来blending,使得线有层次 =>opacity optimization 线的重要程度: 曲线长度/复杂度/类的覆盖面积
    3. enveloped curve,described by Miksch et al. [http://www.ifs.tuwien.ac.at/~silvia/pub/publications/mik_aimdm99.pdf](http://www.ifs.tuwien.ac.at/~silvia/pub/publications/mik_aimdm99.pdf)
4. node-link: edge bundling, FDP

## 加速渲染
1. webgl: stardust, P4, P5, P6
    1. instancing
    2. data texture
    3. buffer顺序
    4. lazy evluation
2. worker+dom: 多线程离屏渲染 SSVG
3. 表格: 虚拟滚动
4. css: will-change
5. animation: z-index





## 交互
1. common:
    - overview + detail
    - drill down(details on demand)
    - pan + zoom
    - focus + context -> fish eye, edge lens
    - query
2. scatter: kyrix, kyrix-s
3. time series: timebox, vector lens, relaxed selection



## 加速交互
1. webgl picking texture
2. time serirs: kd-box, shape search



> 更新: 2023-01-02 11:16:01  
> 原文: <https://www.yuque.com/viruspc/el3mi0/svb8n4>