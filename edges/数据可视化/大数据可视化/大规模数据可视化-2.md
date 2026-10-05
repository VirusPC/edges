# 大规模数据可视化

- [Data Storage and Query](#data-storage-and-query)
- [Data Processing](#data-processing)
- [Rendering](#rendering)
- [Interaction](#interaction)

---

## Data Storage and Query
+ M4
+ data cube => time lattice

## Data Processing
+ 先统计数据
    - bin-summarize-smooth-visualization
+ 展示部分数据
    - progressive
    - samplling
    - dimensionality reduction: PCA, t-sne,



## Rendering
+ word cloud
+ change visualization method (reduce clustring)
    - common: 
        * transparancy
        * density
    - scatter: continuous scatterplots, 
    - line (time series): enveloped curve,described by Miksch et al. [http://www.ifs.tuwien.ac.at/~silvia/pub/publications/mik_aimdm99.pdf](http://www.ifs.tuwien.ac.at/~silvia/pub/publications/mik_aimdm99.pdf)
    - node-link: edge bundling, FDP
+ optimize rendering speed:
    - webgl: stardust, P4, P5, P6
    - worker+dom: SSVG



## Interaction
1. common:
    - overview plus detail
    - pan and zoom
2. time series: timebox, kd-box, vector lens
3. scatter: kyrix, kyrix-s



> 更新: 2022-07-12 17:31:40  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vmpwyg>