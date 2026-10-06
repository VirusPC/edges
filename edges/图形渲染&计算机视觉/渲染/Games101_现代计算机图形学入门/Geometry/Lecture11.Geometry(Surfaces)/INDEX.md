# Lecture 11. Geometry (Surfaces)

- [Summary](#summary)
- [Bezier Surfaces](#bezier-surfaces)
  * [Bicubic Bezier Surface Patch](#bicubic-bezier-surface-patch)
  * [Visualizing Bicubic Bezier Surface Patch](#visualizing-bicubic-bezier-surface-patch)
  * [Evaluating Bezier Surfaces](#evaluating-bezier-surfaces)
- [Mesh Operations](#mesh-operations)
- [Mesh Subdivision (upsampling)](#mesh-subdivision-upsampling)
  * [Loop Subdivision](#loop-subdivision)
    + [Procedure](#procedure)
    + [Update](#update)
    + [Results](#results)
  * [Catmull-Clark Subdivision (General Mesh)](#catmull-clark-subdivision-general-mesh)
    + [一些定义](#%E4%B8%80%E4%BA%9B%E5%AE%9A%E4%B9%89)
    + [Procudure](#procudure)
    + [结果展示](#%E7%BB%93%E6%9E%9C%E5%B1%95%E7%A4%BA)
- [Mesh Simplification (downsampling)](#mesh-simplification-downsampling)
  * [Edge collapsing](#edge-collapsing)
    + [Quadric Error Metrics (二次误差度量)](#quadric-error-metrics-%E4%BA%8C%E6%AC%A1%E8%AF%AF%E5%B7%AE%E5%BA%A6%E9%87%8F)
    + [Quadric Error of Edge Collapsing](#quadric-error-of-edge-collapsing)
    + [结果展示](#%E7%BB%93%E6%9E%9C%E5%B1%95%E7%A4%BA-1)
- [Mesh Simplification (same #triangles)](#mesh-simplification-same-%23triangles)
- [References](#references)

---

# Summary
+ Besier surfaces
    - 核心思想：贝塞尔曲线加双线性插值。
+ Mesh Operations
    - Mesh subdivision，网格细分，用更多的三角形描述几何 
        * 通用步骤：1) create more triangles (vertices); 2) tune their positions 
        * Loop subdivision （支持三角网格）
            1. 对一个三角形，取每条边的中点，并相连。
            2. 对第一步之后的结果，区分新旧结点，新旧节点根据不同规则来更新位置。先更新new point，再利用new point和自己的位置来更新old point的位置。
        * Catmull-Clark subdivision（支持任意形状网格）
            1. 先每条边取一个中点，再每个面取一个中点，最后把这些点连接起来。一次划分后，得到的结果不存在奇异点，非四边形面全部消失变为四边形面。
            2. 新节点进一步分为face point和edge point。依次更新face point, edge point 和 old point。
    - Mesh simplification，网格简化，用更少的三角形描述几何 
        * Edge collapsing
            + 边坍缩成点。
            + 用二次误差度量来衡量化简后的误差。
            + 步骤：
                1. 首先，对于每条边，计算该边坍缩时的二次误差。
                2. 然后，选取二次误差最小的边，坍缩
                3. 更新受影响的相邻边的误差，回到2.
    - Mesh regularization
        * 简单提了下，没有展开讲

# Bezier Surfaces
Extend Bezier curves to surfaces

核心思想：贝塞尔曲线加双线性插值。

![1682844061951-9774fe45-6a28-4b2e-9a2b-2174f4301ad9.png](./img/GsIlUxq1EUOhOjyf/1682844061951-9774fe45-6a28-4b2e-9a2b-2174f4301ad9-740986.jpg)

## Bicubic Bezier Surface Patch
![1682844121620-81b937fb-0734-45eb-8aa4-2010185c58a1.png](./img/GsIlUxq1EUOhOjyf/1682844121620-81b937fb-0734-45eb-8aa4-2010185c58a1-857706.png)



## Visualizing Bicubic Bezier Surface Patch
![1682844256695-11e06561-6def-45c8-87ce-f502184c09e9.png](./img/GsIlUxq1EUOhOjyf/1682844256695-11e06561-6def-45c8-87ce-f502184c09e9-950966.png)

![1682844280786-074f3a6b-8aac-4449-8057-d5589b55570b.png](./img/GsIlUxq1EUOhOjyf/1682844280786-074f3a6b-8aac-4449-8057-d5589b55570b-016850.png)

不同贝塞尔曲面如何拼在一起，使得它平滑？有方法。

## Evaluating Bezier Surfaces
![1682912179302-226c908b-7d8c-4c98-981b-3e9dd4b585b6.png](./img/GsIlUxq1EUOhOjyf/1682912179302-226c908b-7d8c-4c98-981b-3e9dd4b585b6-451757.jpg)

![1682912197043-e0c230f4-5606-4d57-a442-0d0bda2a4553.png](./img/GsIlUxq1EUOhOjyf/1682912197043-e0c230f4-5606-4d57-a442-0d0bda2a4553-632154.png)

（为什么贝塞尔曲线是显式表示？他是通过参数t/uv映射过去的）

# Mesh Operations
+ Mesh subdivision，网格细分，用更多的三角形描述几何 （图3）
+ Mesh simplification，网格简化，用更少的三角形描述几何 （图4）
+ Mesh regularization，网格正规化，不希望出现特别长的三角形，希望所有三角形都和正三角形相似 （图

5）



![1682912509981-e3b4da39-33fe-48c9-bd39-4b2854dfb5b0.png](./img/GsIlUxq1EUOhOjyf/1682912509981-e3b4da39-33fe-48c9-bd39-4b2854dfb5b0-931971.png)

# Mesh Subdivision (upsampling)
Increase resolution



Common subdivison rule for triangle meshes

First, create more triangles (vertices)

Second, tune their positions 

![1682932356768-9bee834c-978d-4699-abba-0e8380a86b96.png](./img/GsIlUxq1EUOhOjyf/1682932356768-9bee834c-978d-4699-abba-0e8380a86b96-783777.png)

## Loop Subdivision
(该算法和循环没有任何关系，起这个名字是因为算法作者的family name是Loop)

算法核心思想：对第一步之后的结果，区分新旧结点，新旧节点根据不同规则来更新位置。

### Procedure
1. Split each triangle into four
2. Assign new vertex positions according to weights。移动新节点，使表面更加光滑。
    1. **New/old vertices updated differently**

![1682932714768-635a4707-a74f-41ad-92d3-50dd4770abaa.png](./img/GsIlUxq1EUOhOjyf/1682932714768-635a4707-a74f-41ad-92d3-50dd4770abaa-095198.png)

### Update
1. 对于新的顶点，根据旧节点的位置来计算自己的位置。一定在两个三角形的边界（不考虑边界情况）。将共享边两个旧点命名为A/B，剩下两个旧点命名为C/D。然后进行加权平均。（论文中认为，n越大，原来的点越重要）
2. 对于旧的顶点，不止考虑周围旧节点的位置，也考虑自己本身的位置。

![1682932845011-d6298ff7-3942-4971-8e99-050b1ed113b5.png](./img/GsIlUxq1EUOhOjyf/1682932845011-d6298ff7-3942-4971-8e99-050b1ed113b5-713220.png)



![1682932982995-2dab635b-4409-4301-be46-c60a4d6d9755.png](./img/GsIlUxq1EUOhOjyf/1682932982995-2dab635b-4409-4301-be46-c60a4d6d9755-649787.png) 

### Results
![1682933407554-5ba6a0cf-2dcc-496f-933f-6087dd4ae6ef.png](./img/GsIlUxq1EUOhOjyf/1682933407554-5ba6a0cf-2dcc-496f-933f-6087dd4ae6ef-250747.jpg)

## Catmull-Clark Subdivision (General Mesh)
Loop Subdivision只支持三角形网格，Catmull-Clark Subdivision支持任意形状网格。

### 一些定义
1. quad face and non-quad face：将面分为四边形面和非四边形面
2. extraordinary vertex（奇异点）（degre!=4）：

![1682936644789-e60936e6-b9bb-4fa6-8d27-779e4e033373.png](./img/GsIlUxq1EUOhOjyf/1682936644789-e60936e6-b9bb-4fa6-8d27-779e4e033373-239913.png)

### Procudure
第一步：先每条边取一个中点，再每个面取一个中点，最后把这些点连接起来。

![1682936884030-df7a44d1-0f36-4819-9a13-a1c0b77e5187.png](./img/GsIlUxq1EUOhOjyf/1682936884030-df7a44d1-0f36-4819-9a13-a1c0b77e5187-313245.png)

在非四边形面中引入的中点，一定是奇异点。

引入的新的奇异点的度数等于非四边形面的边数。

非四边形面全部消失，全部变为四边形面。

—— 在第一次细分后，得到了非四边形面数量的奇异点。之后再也不会增加 

![1682937235351-9fa97f01-7dff-458c-8f81-d423ec38d7e5.png](./img/GsIlUxq1EUOhOjyf/1682937235351-9fa97f01-7dff-458c-8f81-d423ec38d7e5-187359.png)

![1682937248568-1acc1300-6029-489b-8fe1-f3da2e44cca3.png](./img/GsIlUxq1EUOhOjyf/1682937248568-1acc1300-6029-489b-8fe1-f3da2e44cca3-926538.png)

第二步：更新点的位置（new point进一步分为face point和edge point）

1. 引入的 face point 利用周围**4**个旧点更新
2. 引入的 edge point 利用边上2个旧点加相邻面的2个face point共**4**个点更新
3. 旧点利用周围的4个face point、4个edge point和8个旧点共**16**个点更新 （会利用新点来更新旧点。Loop subdivision不会用新点更新旧点）

![1682937302139-f5d2d32e-e42b-4f86-aaeb-5a9ae1e66b5d.png](./img/GsIlUxq1EUOhOjyf/1682937302139-f5d2d32e-e42b-4f86-aaeb-5a9ae1e66b5d-057470.png)

![1682937577026-3235725a-edb1-4954-a5d6-500dcaef453c.png](./img/GsIlUxq1EUOhOjyf/1682937577026-3235725a-edb1-4954-a5d6-500dcaef453c-859051.png)

### 结果展示
![1682938008715-308eca9b-42c2-4c8a-bc8f-2ba00f565cde.png](./img/GsIlUxq1EUOhOjyf/1682938008715-308eca9b-42c2-4c8a-bc8f-2ba00f565cde-532365.png)



# Mesh Simplification (downsampling)
Decrease resolution. Try to preserve shape/appearance.

Reduce number of mesh elements, while maintaining the overall shape

![1682939462298-1cc493ba-87bf-4e29-a819-404602286638.png](./img/GsIlUxq1EUOhOjyf/1682939462298-1cc493ba-87bf-4e29-a819-404602286638-236854.png)

应用：

1. 计算能力的妥协
2. 有些时候必须用，如远处物体结构的简化。可以做几何的层次结构，但不好做（类比mipmap的LOD）

## Edge collapsing
![1682939738894-f88cb45d-f10c-4824-a60e-b62afbc6f405.png](./img/GsIlUxq1EUOhOjyf/1682939738894-f88cb45d-f10c-4824-a60e-b62afbc6f405-168579.png)

### Quadric Error Metrics (二次误差度量)
边坍缩成点。如何确定新点的位置？令二次误差最小的点作为这条边坍缩后的点。

+ How much geometric error is in introduced by simplification?
+ Not a good ideas to perform averaging of vertices
+ Quadric error: new vertex should minimize its **sum of square distance** (L2 distance)

 

![1682939971016-b1f00574-5b0d-4a30-9ec3-749529c3014a.png](./img/GsIlUxq1EUOhOjyf/1682939971016-b1f00574-5b0d-4a30-9ec3-749529c3014a-685673.png)

### Quadric Error of Edge Collapsing
1. 首先，对于每条边，计算该边坍缩时的二次误差。
2. 然后，选取二次误差最小的边，坍缩
3. 更新受影响的相邻边的误差，回到2.



优先队列（堆） 可以为这一算法提供支持：能够迅速找到最小值，又可以动态以最小代价更新其他受影响的边。

### 结果展示
![1682940951053-3533121e-10d3-425f-b46b-ca812a6a248d.png](./img/GsIlUxq1EUOhOjyf/1682940951053-3533121e-10d3-425f-b46b-ca812a6a248d-540261.png)



# Mesh Simplification (same #triangles)
Modify sample distribution to improve quality.

# References
[https://www.bilibili.com/video/BV1X7411F744/?p=11&vd_source=a637826c55b409b420b4b6584a6e8379](https://www.bilibili.com/video/BV1X7411F744/?p=11&vd_source=a637826c55b409b420b4b6584a6e8379)





> 更新: 2023-05-12 04:00:55  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gilenoqiuhomdalc>