# Registration

- [Summary](#summary)
- [Motivation](#motivation)
- [Task Classification](#task-classification)
- [Outline](#outline)
- [Pairwise Registration](#pairwise-registration)
  * [Local Matching](#local-matching)
    + [ICP (Iterative Closest Point Algorithm)](#icp-iterative-closest-point-algorithm)
    + [从优化的角度来理解为什么能work：](#%E4%BB%8E%E4%BC%98%E5%8C%96%E7%9A%84%E8%A7%92%E5%BA%A6%E6%9D%A5%E7%90%86%E8%A7%A3%E4%B8%BA%E4%BB%80%E4%B9%88%E8%83%BDwork)
    + [Partial Overlap](#partial-overlap)
    + [适用场景](#%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF)
    + [ICP 被认为是一种 local matching 的方法](#icp-%E8%A2%AB%E8%AE%A4%E4%B8%BA%E6%98%AF%E4%B8%80%E7%A7%8D-local-matching-%E7%9A%84%E6%96%B9%E6%B3%95)
  * [Global Matching](#global-matching)
    + [整体做法](#%E6%95%B4%E4%BD%93%E5%81%9A%E6%B3%95)
    + [特征提取 - Feature Descriptor](#%E7%89%B9%E5%BE%81%E6%8F%90%E5%8F%96---feature-descriptor)
    + [对应关系的一致性（Consistency），筛选对应关系的方法](#%E5%AF%B9%E5%BA%94%E5%85%B3%E7%B3%BB%E7%9A%84%E4%B8%80%E8%87%B4%E6%80%A7consistency%E7%AD%9B%E9%80%89%E5%AF%B9%E5%BA%94%E5%85%B3%E7%B3%BB%E7%9A%84%E6%96%B9%E6%B3%95)
      - [RANSAC](#ransac)
      - [Rigid matching](#rigid-matching)
        * [霍夫变换（Hough Transform）](#%E9%9C%8D%E5%A4%AB%E5%8F%98%E6%8D%A2hough-transform)
        * [Rigid matching](#rigid-matching-1)
      - [Spectral Approach（基于谱的匹配方法）](#spectral-approach%E5%9F%BA%E4%BA%8E%E8%B0%B1%E7%9A%84%E5%8C%B9%E9%85%8D%E6%96%B9%E6%B3%95)
      - [混合方法（Hybrid Method）](#%E6%B7%B7%E5%90%88%E6%96%B9%E6%B3%95hybrid-method)
      - [Learning-based methods](#learning-based-methods)
- [Multiple Registration](#multiple-registration)
  * [Joint pairwise registration](#joint-pairwise-registration)
  * [Simultaneous regisgtration and reconstruction](#simultaneous-regisgtration-and-reconstruction)
- [Topics that are not covered](#topics-that-are-not-covered)
- [Combining Local and Global Matching](#combining-local-and-global-matching)
- [References](#references)

---

## Summary
上节讲了许多 scanning 技术可以得到点云，这节讲点云的注册问题

也就是解决不同视角或不同扫描源的点云如何合并到同一坐标系下问题。

更具体地说，点云注册的目标是通过几何变换（如旋转、平移或缩放）将多个点云对齐，使得它们能够形成一个完整的、统一的3D模型。



注册问题是一个很大的问题，有很多特定的场景。需要注意不同场景用不同方法。主要需要注意以下三个方向（Axis）：

1. Fully overlap（易） VS partial overlap（难）
    1. fully overlap：一个完全覆盖另一个。应用场景：工厂中，对生产好的零件做扫描，与真实模型（ground truth）做对比，以判断误差。
    2. <font style="color:#DF2A3F;">partial overlap</font>：三维重建，合并多个视角时通常是 partial overlap，不可能每个点在所有视角都出现。
2.  Local（易）VS Global（难）
    1. local: 两个点云已经 roughly 匹配好了，差别不大。如扫描的第一帧和第二帧有连续性问题。
    2. global：室外扫描时，换不同camera的位置去做扫描，扫描结果差别很大。比较难做。
3. Pairwise（易）VS Multiple（难） 
    1. Pairwise：两片点云做注册。
    2. Multiple：多片点云做注册。显然做重建是要多片点云，两片是不够的。

| | | **Fully overlap** | **Parital Overlap** |
| --- | --- | --- | --- |
| **Pairwise** | **Local** | ICP<br/>+ Assume: Closest points as corresponding。<br/>+ 目标：<br/>    - 通过优化的方法，寻找一个相对Rotation和一个相对Translation，使得两个点云的点之间的距离最小。（标准的ICP，不考虑scale）<br/>+ 方法：<br/>    - 不断重复 <br/>        * 找最近点 <br/>        * 优化 squared error 寻找刚体变换。<br/>+ 扩展到 parital overlap的一些方法<br/>    - 不用 L2 norm，用一种 robust norm。还是用高斯-牛顿算法求解。<br/>    - 用得比较多的，更易于解释的方法是用 IRLS（iteratively reweighted least squares，迭代重加权最小二乘）求解。 原本的 ICP 算法可看作所有最近邻点对的权重都是 1，而 IRLS 在每次迭代后，根据残差调整每个点对的权重，当前残差越大，即当前点与它的最近点的距离越远，则令该点对的权重越小<br/>    - 也有做法是通过双向修剪（bi-directional pruning），剔除不重叠部分的那些多余的点： 计算点v的最近邻 q，再计算 q 的最近邻 r，如果 v 和 r 距离太远则剔除 q，否则认为 v 和 q 对应。<br/>+ tricks<br/>    - 最近邻点使用kd tree等数据加速<br/>    - 有些表达方式不需要找最近邻，如平方距离场<br/>    - 一般不会让所有的点都参与计算，会做采样 | |
| | **Global** | 特征提取：<br/>1. 大都用neural network<br/>2. 也会用人工设计的特征算子<br/>筛选对应关系：<br/>1. RANSAC<br/>    1. 3对确定一个transform<br/>    2. 知道法向可以简化为2对<br/>2. Rigid Matching <br/>    1. 对所有可能的pair，参考 hough transform 的vote思想来vote出最可能的transofrm<br/>3. Spectral Approach<br/>4. Hybrid Method<br/>5. Learning-based methods<br/> | |
| **Multiple** | 1. Joint pairwise registration<br/>    1. 联合优化多个 pairwise registration 问题<br/>    2. 特点：<br/>        1. 同时配准多个点云：而不是单独配准每一对点云，方法会联合优化所有点云的配准参数。 <br/>        2. 全局一致性：通过优化多个点云之间的相对变换，确保最终的配准结果在全局范围内是一致的，避免了局部最小值问题。 <br/>        3. 利用多个对之间的信息：通过同时处理多个点云对之间的重叠区域，算法可以利用不同点云对之间的互补信息，提高配准的准确性。<br/>    3. 问题<br/>        1. 会产生累积误差，特别是当点云之间的重叠较少或没有全局一致性时，每次配准的误差会影响到后续的配准步骤，导致最终结果的质量下降。<br/>        2. 需要determine overlapping<br/>        3. 且慢。<br/>2. Simultaneous registration and reconstruction<br/>    1. 配准和重建同时进行。在没有完全对齐数据的情况下，通过同步进行数据的配准和重建，逐步生成高质量的3D模型。<br/>    2. 找 latent surface，去 fit scan, iterate<br/>    3. 这种方法特别适用于在扫描过程中，传感器数据本身就包含噪声、部分遮挡、误差和不完全对齐的情况。 | | |
| | | | |




## Motivation
Registration：上节课中讲了扫描仪。扫描仪从不同视角扫描物体，会得到不同**点云**。如果不知道视角，不知道这些点云的相对变换的话，需要想办法找到，把他们匹配上。

从一个视角只能得到一部分，registration考虑如何把多个部分融合到一起.

![1719033922957-eef6074a-1b12-4686-8136-cdc5845c448c.png](./img/ms3xNs1Ail6CxiNe/1719033922957-eef6074a-1b12-4686-8136-cdc5845c448c-954274.png)![1719033932821-5f2f7df9-eacf-416a-95a6-31890e1c3e66.png](./img/ms3xNs1Ail6CxiNe/1719033932821-5f2f7df9-eacf-416a-95a6-31890e1c3e66-480560.png)

## Task Classification
注册问题是一个很大的问题，有很多特定的场景。需要注意不同场景用不同方法。

主要需要注意以下三个方向（Axis）：

1. Fully overlap VS partial overlap
    1. fully overlap：一个完全覆盖另一个。工业场景中会出现。工厂中，对生产好的零件做扫描，与真实模型（ground truth）做对比，以判断误差。
    2. partial overlap：三维重建，合并多个视角时通常是 partial overlap，不可能每个点在所有视角都出现。
2. Global VS Local
    1. local: 两个点云已经 roughly 匹配好了，差别不大。如扫描的第一帧和第二帧有连续性问题。
    2. global：室外扫描时，换不同camera的位置去做扫描，扫描结果差别很大。比较难做。
3. Pairwise VS multiple
    1. Pairwise：两片点云做注册。
    2. Multiple：多片点云做注册。显然做重建是要多片点云，两片是不够的。

![1719034634743-d4feef26-4ab6-44be-9d4b-85b0752bb3d9.png](./img/ms3xNs1Ail6CxiNe/1719034634743-d4feef26-4ab6-44be-9d4b-85b0752bb3d9-620490.png)

## Outline
1. Pairwise registration
    1. Full overlap
    2. Partial overlap
    3. Global methods
    4. Learning-based
2. Multiple registration
    1. Joint pairwise registration
    2. Simutaneous registration and reconstruction

## Pairwise Registration
### Local Matching
#### ICP (Iterative Closest Point Algorithm)
pairwise registration 中最重要的一个算法是 ICP。（且要求local，可扩展到 partial overlap）



前提：<font style="color:rgb(25, 27, 31);">假设点云的区域 fully overlap，是刚性形状（rigid shapes），能通过刚体变换相联系，初始时位姿相近（local matching），基本对准了，此时可使用 </font>**<font style="color:rgb(25, 27, 31);">ICP 算法（iterative closest point，迭代最近点）</font>**<font style="color:rgb(25, 27, 31);">进行配准</font>

<font style="color:rgb(25, 27, 31);"></font>

问题定义：通过优化的方法，寻找一个相对Rotation和一个相对Translation，使得两个点云的点之间的距离最小（标注的 ICP 不考虑 scale）



ICP核心思想：If the correct correspondences are known, the correct relative rotation/translation can be calculated in closed form。

即，假设有红蓝两片点云，且已知两个点云的一些点的对应点。通过优化这些对应点的距离，来找到相对rotation和相对translation。



如何找到对应点？<font style="color:#DF2A3F;">Assume: Closest points as corresponding</font>。一个假设：离得近的点是相关的。



显然这个假设是有问题的，计算后得不到正确的 R 和 T。怎么办？继续迭代，直到收敛。



得到最终ICP的流程：不断重复 

1. 找最近点 

2.优化 squared error 寻找刚体变换。



<font style="color:rgb(25, 27, 31);">tricks（from 知乎）：</font>

1. <font style="color:rgb(25, 27, 31);">计算点的最近邻：</font>
    1. <font style="color:rgb(25, 27, 31);">现在有很多优秀的软件库，调用相关算法能方便地得到两片点云之间的最近点对，以前则手动构建一些层次化的数据结构（例如 kd tree）以计算点的最近邻；</font>
    2. <font style="color:rgb(25, 27, 31);">有些算法不需要寻找最近邻，例如有的算法直接构建了平方距离场（squared distance field）；</font>
2. **<font style="color:rgb(25, 27, 31);">一般不会让点云中的所有点都参与配准计算，而是从中抽样一些点</font>**<font style="color:rgb(25, 27, 31);">，于是，抽样的方式也会影响配准的效果。比起均匀抽样，更多地抽样那些制约潜在不稳定变换的样本点，配准的效果会更好，参见 </font>[Gelfand](https://link.zhihu.com/?target=http%3A//graphics.stanford.edu/~ngelfand/)<font style="color:rgb(25, 27, 31);"> 等人的论文</font>[《Geometrically Stable Sampling for the ICP Algorithm》](https://link.zhihu.com/?target=https%3A//graphics.stanford.edu/papers/stabicp/)<font style="color:rgb(25, 27, 31);">。</font>



![1719035791193-ae6abff2-6cba-46e4-a5b2-723d3cbe45c4.png](./img/ms3xNs1Ail6CxiNe/1719035791193-ae6abff2-6cba-46e4-a5b2-723d3cbe45c4-098977.png)

![1719035498807-a33a4cf2-b856-4775-a1ce-7f7c6323e228.png](./img/ms3xNs1Ail6CxiNe/1719035498807-a33a4cf2-b856-4775-a1ce-7f7c6323e228-758657.png)

![1719037084682-54f2a9de-1d28-4dc2-a328-a83fa83fa5f2.png](./img/ms3xNs1Ail6CxiNe/1719037084682-54f2a9de-1d28-4dc2-a328-a83fa83fa5f2-928334.png)

![1719037255015-220573f1-18bd-4bb9-8207-6708d0a042c2.png](./img/ms3xNs1Ail6CxiNe/1719037255015-220573f1-18bd-4bb9-8207-6708d0a042c2-676307.png)

![1719046808684-2b66a3fb-9212-46fd-a72d-606ed9b59e96.png](./img/ms3xNs1Ail6CxiNe/1719046808684-2b66a3fb-9212-46fd-a72d-606ed9b59e96-349000.png)

![1719046889532-24febcea-e399-4868-af7a-63dd723d2925.png](./img/ms3xNs1Ail6CxiNe/1719046889532-24febcea-e399-4868-af7a-63dd723d2925-707729.png)



#### 从优化的角度来理解为什么能work：
![1719037287117-c2d72272-4cba-4685-8096-dfb5a2ca8c5c.png](./img/ms3xNs1Ail6CxiNe/1719037287117-c2d72272-4cba-4685-8096-dfb5a2ca8c5c-926194.png)

$ x_i^0 $：红色表面点云的一些点

$ \alpha $：transformation函数（R、T）

$ \Phi $：蓝色表面

$ d $：距离函数



由于刚体变换中的旋转分量 的行列之间满足正交性质，所以该问题是一个受限非线性最优化问题（constrained nonlinear optimization problem）；



1. alternative minimization：先优化transformation，再优化closest point。会不断收敛。从这个角度来看不一定得到最优。
2. linear convergence：是线性收敛的，收敛的比较快，一般可以converge到一个local minumum（最优）。(由于是局部最优，也限制了ICP是一种local的方法)

当然，也不一定保证 converge到一个local minimum。

![1719037782867-0030f715-9ed6-41d8-b6bc-e1ca83d91772.png](./img/ms3xNs1Ail6CxiNe/1719037782867-0030f715-9ed6-41d8-b6bc-e1ca83d91772-552782.png)





<font style="color:rgb(25, 27, 31);">一般采用高斯-牛顿算法求解非线性最小二乘问题；</font>

+ <font style="color:rgb(25, 27, 31);">极小化点与面之间距离的算法变体参见 Chen 和 Medioni 的论文</font>[《Object modeling by registration of multiple range images》](https://link.zhihu.com/?target=https%3A//graphics.stanford.edu/courses/cs348a-17-winter/Handouts/chen-medioni-align-rob91.pdf)
+ <font style="color:rgb(25, 27, 31);">点与面之间距离的计算可参考 Pottmann 和 Hofer 的论文</font>[《Geometry of the Squared Distance Function to Curves and Surfaces》](https://link.zhihu.com/?target=https%3A//graphics.stanford.edu/courses/cs468-03-fall/Papers/pottmann_geoSquaredDistance.pdf)<font style="color:rgb(25, 27, 31);">；</font>

![1719038036955-42838919-4a3a-4d69-a8d0-f19114e0027b.png](./img/ms3xNs1Ail6CxiNe/1719038036955-42838919-4a3a-4d69-a8d0-f19114e0027b-954835.png)

![1719045526069-5c908b8a-9e90-4070-86fa-b59073565fb1.png](./img/ms3xNs1Ail6CxiNe/1719045526069-5c908b8a-9e90-4070-86fa-b59073565fb1-780567.png)

![1719045613970-898c8440-f843-4c90-ba3c-f5e6118e989b.png](./img/ms3xNs1Ail6CxiNe/1719045613970-898c8440-f843-4c90-ba3c-f5e6118e989b-904862.png)

![1719045779472-448a7209-3ec5-434a-a215-f503ac2bc856.png](./img/ms3xNs1Ail6CxiNe/1719045779472-448a7209-3ec5-434a-a215-f503ac2bc856-505748.png)

![1719046749448-9d6f2e60-2235-4fa6-b13a-ad0f61ebb462.png](./img/ms3xNs1Ail6CxiNe/1719046749448-9d6f2e60-2235-4fa6-b13a-ad0f61ebb462-380777.png)

#### Partial Overlap
之前都是假设fully overlap，partial overlap 怎么做？

1. 不用 L2 norm，用一种 robust norm。<font style="color:rgb(25, 27, 31);">还是用高斯-牛顿算法求解。</font>
2. <font style="color:rgb(25, 27, 31);">用得比较多的，更易于解释的方法是用 IRLS（iteratively reweighted least squares，迭代重加权最小二乘）求解。 原本的 ICP 算法可看作所有最近邻点对的权重都是 </font><font style="color:rgb(25, 27, 31);">1</font><font style="color:rgb(25, 27, 31);">，而 IRLS 在每次迭代后，根据残差调整每个点对的权重，当前残差越大，即当前点与它的最近点的距离越远，则令该点对的权重越小。</font>
+ <font style="color:rgb(25, 27, 31);">也有做法是通过双向修剪（bi-directional pruning），剔除不重叠部分的那些多余的点： 计算点v的最近邻 </font><font style="color:rgb(25, 27, 31);">q</font><font style="color:rgb(25, 27, 31);">，再计算 </font><font style="color:rgb(25, 27, 31);">q</font><font style="color:rgb(25, 27, 31);"> 的最近邻 </font><font style="color:rgb(25, 27, 31);">r</font><font style="color:rgb(25, 27, 31);">，如果 </font><font style="color:rgb(25, 27, 31);">v</font><font style="color:rgb(25, 27, 31);"> 和 </font><font style="color:rgb(25, 27, 31);">r</font><font style="color:rgb(25, 27, 31);"> 距离太远则剔除 </font><font style="color:rgb(25, 27, 31);">q</font><font style="color:rgb(25, 27, 31);">，否则认为 </font><font style="color:rgb(25, 27, 31);">v</font><font style="color:rgb(25, 27, 31);"> 和 </font><font style="color:rgb(25, 27, 31);">q</font><font style="color:rgb(25, 27, 31);"> 对应。</font>

<font style="color:rgb(25, 27, 31);">  
</font>

Robust functions:

reweighted的思想，降低无效点权重

![1719047074257-98871f25-4d48-4a6a-b596-094a0a4a4739.png](./img/ms3xNs1Ail6CxiNe/1719047074257-98871f25-4d48-4a6a-b596-094a0a4a4739-757060.png)

![1719047186055-38e70e6c-ac98-4528-96c8-7bbf970fb12d.png](./img/ms3xNs1Ail6CxiNe/1719047186055-38e70e6c-ac98-4528-96c8-7bbf970fb12d-682035.png)

![1719049274950-e9021e4f-afa5-4a8d-973a-3cb9b2f797e8.png](./img/ms3xNs1Ail6CxiNe/1719049274950-e9021e4f-afa5-4a8d-973a-3cb9b2f797e8-210760.png)

![1719050358466-d1535279-2309-410a-94d9-282d65ba4d23.png](./img/ms3xNs1Ail6CxiNe/1719050358466-d1535279-2309-410a-94d9-282d65ba4d23-868230.png)

median 不太受outlier影响，比mean更robust



Bi-directional pruning

删除无效点。和reweighted的思想互补。

![1719050425631-8bff7934-d860-40d7-8b46-49b341195dee.png](./img/ms3xNs1Ail6CxiNe/1719050425631-8bff7934-d860-40d7-8b46-49b341195dee-351705.png)

推荐文章：

![1719050659597-0b3ad553-e0d4-4919-b5ec-83b13edb0a9e.png](./img/ms3xNs1Ail6CxiNe/1719050659597-0b3ad553-e0d4-4919-b5ec-83b13edb0a9e-562952.png)



#### 适用场景
+ <font style="color:rgb(25, 27, 31);">当误差函数的初始值较小，即两片点云在初始状态已经粗略匹配了时，ICP 算法使用高斯-牛顿算法（point-plane）进行迭代的收敛速度会非常快，接近于二阶收敛，而当误差函数的初始值较大时，一般也会比基础的 ICP 算法收敛速度略微好一点，但基础的 ICP 算法会更稳健（robust）；</font>
+ <font style="color:rgb(25, 27, 31);">当误差函数的初始值较大时，一般需要对迭代中黑塞矩阵等的计算做一些特别的处理，例如 BFGS 算法。</font>

#### <font style="color:rgb(25, 27, 31);">ICP 被认为是一种 local matching 的方法</font>
ICP is considered a local matching technique because:

+ It aligns point clouds pairwise, focusing on local correspondences.
+ It requires an initial guess and iteratively refines the alignment based on local point-to-point distances.
+ It converges to local minima and may not handle large misalignments or global inconsistencies well on its own.
+ It is often used as a preliminary step before applying global optimization methods to achieve consistent overall alignment.

### Global Matching
#### 整体做法
不需要特别好的初始pose。<font style="color:rgb(25, 27, 31);">不能假设点云之间最近点是对应的。</font>

<font style="color:rgb(25, 27, 31);"></font>

<font style="color:rgb(25, 27, 31);">传统做法：</font>

首先，找 invariant feature（<font style="color:rgb(25, 27, 31);">在刚体变换下保持不变的几何特征量</font>），然后认为几何特征相同的点是对应点，在feature间构建 correspondence。最后，<font style="color:rgb(25, 27, 31);">根据一些刚性约束，筛选出好的一致的对应关系，拟合刚体变换。</font>

![1719051136840-5949c7ae-1a07-494d-b1ea-b78a17bcdc95.png](./img/ms3xNs1Ail6CxiNe/1719051136840-5949c7ae-1a07-494d-b1ea-b78a17bcdc95-629930.png)

Deep learning 的做法（现在的做法）：

feature extraction 步骤用 neural network 来做，matching 用一种 corelation 的module来代替。

![1719051175608-5231d1ef-0f82-4c9a-a162-bb3a75a9ff89.png](./img/ms3xNs1Ail6CxiNe/1719051175608-5231d1ef-0f82-4c9a-a162-bb3a75a9ff89-081885.png)

#### 
#### 特征提取 - Feature Descriptor
全局匹配算法首先根据特征描述子（feature descriptor）提取特征。

核心思想是找一种invaraint的description。现在大都用neural network来做。

但不是所有的场景都适合用neural network来做，neural network不够鲁棒。



<font style="color:rgb(25, 27, 31);">一些人工设计的特征描述子举例：</font>

+ <font style="color:rgb(25, 27, 31);">自旋图像（spin images），参见 Johnson 的论文</font>[《Spin-Images: A Representation for 3-D Surface Matching》](https://link.zhihu.com/?target=https%3A//www.ri.cmu.edu/publications/spin-images-a-representation-for-3-d-surface-matching/)<font style="color:rgb(25, 27, 31);">；</font>
    - <font style="color:rgb(25, 27, 31);">是对该点几何信息的详细描述，编码了当前点与所在曲面片（patch）内其它点的距离，以及两者间连线与当前点表面法线的相对角度，记录为附近点到当前点法线的距离和到当前点所在切平面的距离，</font>
    - <font style="color:rgb(25, 27, 31);">区分度大，但计算和存储的开销也较大；</font>
+ <font style="color:rgb(25, 27, 31);">积分不变量（integral invariants），参见 Pottmann 等人的论文</font>[《Integral Invariants for Robust Geometry Processing》](https://link.zhihu.com/?target=http%3A//www.geometrie.tugraz.at/wallner/iirgp.pdf)<font style="color:rgb(25, 27, 31);">；</font>
    - <font style="color:rgb(25, 27, 31);">记录了一个以当前点为球心的一定大小的球中，有多大比例的面积（体积）是在模型内部；</font>
    - <font style="color:rgb(25, 27, 31);">对尺度变换、噪声不敏感；</font>
+ <font style="color:rgb(25, 27, 31);">其他</font>
    - <font style="color:rgb(25, 27, 31);">3D SIFT</font>
    - <font style="color:rgb(25, 27, 31);">Patch features</font>
    - <font style="color:rgb(25, 27, 31);">...  
</font>

![1719051321399-bb8ff43b-c7c3-418e-9cc2-a842c8074e0c.png](./img/ms3xNs1Ail6CxiNe/1719051321399-bb8ff43b-c7c3-418e-9cc2-a842c8074e0c-141555.png)

![1719051571307-363509d7-f017-4579-8077-bd28052625e2.png](./img/ms3xNs1Ail6CxiNe/1719051571307-363509d7-f017-4579-8077-bd28052625e2-403090.png)

![1719051647094-eea200a2-da44-46f2-8cc5-57aab4381696.png](./img/ms3xNs1Ail6CxiNe/1719051647094-eea200a2-da44-46f2-8cc5-57aab4381696-393470.png)

#### 对应关系的一致性（Consistency），筛选对应关系的方法
##### RANSAC
**<font style="color:rgb(25, 27, 31);">RANSAC（random sample consensus）算法</font>**<font style="color:rgb(25, 27, 31);">的基本原理是反复抽样数据、拟合变换，筛选出能拟合尽可能多的样本数据的变换，忽略那些异常值的影响。它的基本步骤如下：</font>

1. 预处理
    1. 在每个物体上采样feature point
2. 不断重试
    1. <font style="color:rgb(25, 27, 31);">随机采样三个</font>**<font style="color:rgb(25, 27, 31);">特征点对</font>**<font style="color:rgb(25, 27, 31);">的位置，检查是否满足距离约束；（2维只要2个点就可以确定transformation，3维要3个点）</font>
    2. <font style="color:rgb(25, 27, 31);">如果满足距离约束条件，则拟合一个刚体变换；</font>
    3. <font style="color:rgb(25, 27, 31);">做刚体变换，并检查有多少其它的特征点能够配对。如果足够多，则停止迭代，否则回到第一步继续抽样；</font>

试多少次成功？不一定，是个概率问题。显然特征点越少越容易成功。



**<font style="color:rgb(25, 27, 31);">如果既知道特征点的位置，又知道点所在表面的法线方向，则可略微修改 RANSAC 算法，一次抽样两个对应关系的数据，即可拟合一个刚体变换。</font>**<font style="color:rgb(25, 27, 31);">显然成功的概率更大。（</font>![1719053214496-1253a3f6-8b79-4595-97b7-79bffed44122.png](./img/ms3xNs1Ail6CxiNe/1719053214496-1253a3f6-8b79-4595-97b7-79bffed44122-678156.png)<font style="color:rgb(25, 27, 31);">中，3次方变成2次方）</font>

<font style="color:rgb(25, 27, 31);">此时除了检查距离约束之外，还需要检查角度约束。</font>

  


![1719052239962-f21d0092-5675-4b42-b3ce-5125985d3fac.png](./img/ms3xNs1Ail6CxiNe/1719052239962-f21d0092-5675-4b42-b3ce-5125985d3fac-052686.png)



![1719052591931-68c413b6-b49d-4b94-a4a6-1ccd8f29aeb7.png](./img/ms3xNs1Ail6CxiNe/1719052591931-68c413b6-b49d-4b94-a4a6-1ccd8f29aeb7-185538.png)

![1719052512248-8df7e17c-cda1-4e45-ab45-43b48774ea6a.png](./img/ms3xNs1Ail6CxiNe/1719052512248-8df7e17c-cda1-4e45-ab45-43b48774ea6a-632038.png)

p: 找对一个feature pair的概率

(1-p^3)：step1 找错的概率

N: 实验次数

![1719053097944-5548b752-3f20-4853-9f24-05332453b84c.png](./img/ms3xNs1Ail6CxiNe/1719053097944-5548b752-3f20-4853-9f24-05332453b84c-552692.png)

##### Rigid matching
###### 霍夫变换（Hough Transform）
hough transform 用于从image中提取简单几何特征，如直线和圆。<font style="color:rgb(25, 27, 31);">广义上的</font>[霍夫变换](https://www.zhihu.com/search?q=%E9%9C%8D%E5%A4%AB%E5%8F%98%E6%8D%A2&search_source=Entity&hybrid_search_source=Entity&hybrid_search_extra=%7B%22sourceType%22%3A%22article%22%2C%22sourceId%22%3A%22203292567%22%7D)<font style="color:rgb(25, 27, 31);">可以找到你想要的任何你可以描述的特征（只要这个形状可以用简单的参数方式表示）。</font>

The basic idea behind the Hough Transform is to represent shapes in a parameter space and then use a voting mechanism to detect the presence of these shapes in the image space. 



> Hough transform is a feature extraction method for detecting simple shapes such as circles, lines etc in an image.
>
> A “simple” shape is one that can be represented by only a few parameters. For example, a line can be represented by two parameters (slope, intercept) and a circle has three parameters — the coordinates of the center and the radius (x, y, r). Hough transform does an excellent job in finding such shapes in an image.
>

一般，先用canny等算子做边缘检测，再用hough transform找几何特征。

![1719055275943-40507ee0-5187-4ae0-a529-f86106fe0b95.png](./img/ms3xNs1Ail6CxiNe/1719055275943-40507ee0-5187-4ae0-a529-f86106fe0b95-832125.png)

以寻找直线为例：

1. 定义参数方程。直线方程转为极坐标系（原因：image是有边界的，$ \rho $和$ \theta $就是有边界的，方便后续投票累加）![1719056368916-59bef362-b1e5-4f2e-a2fb-e52cc9a2ec40.png](./img/ms3xNs1Ail6CxiNe/1719056368916-59bef362-b1e5-4f2e-a2fb-e52cc9a2ec40-470381.png)![1719056335560-913625c5-3917-4454-a33e-b03b61af3fe2.png](./img/ms3xNs1Ail6CxiNe/1719056335560-913625c5-3917-4454-a33e-b03b61af3fe2-752619.png)
2. 初始化霍夫空间/累加器。霍夫空间就是参数空间。这里将霍夫空间离散化，每个格子代表一种可能的$ \rho $和$ \theta $的组合，每个格子的值代表这种组合的票数。
    1. 票数初始化为0. 
    2. 由于$ \rho $和$ \theta $是有边界的，比较方便累加器的初始化
    3. 注意，因为投票过程往往有某个极大值超过阈值，多达几千，不能直接用灰度图来记录投票信息
    4. ![1719056620631-9c5031bb-3a67-4245-8c95-ee461217b791.png](./img/ms3xNs1Ail6CxiNe/1719056620631-9c5031bb-3a67-4245-8c95-ee461217b791-045734.png)
3. 灰度化。从彩色图像得到灰度图。
4. 边缘检测。如用 拉普拉斯算子、canny、sobel，从灰度图得到边缘点（255）的数组。
5. 映射到霍夫空间。由于经过点的直线有无数条，因此对于每个边缘点，可以得到一系列参数$ \rho $和$ \theta $，这些参数值在霍夫空间构成曲线。
    1. 离散化后的霍夫空间下的每个点的票数初始化为0。
6. 投票（Voting）。对于一个边缘点，如果对应曲线经过霍夫空间的一个点，则这个点的票数+1。
    1. ![1719056702924-7708e162-1c0a-4ea3-961d-b836d15057f1.png](./img/ms3xNs1Ail6CxiNe/1719056702924-7708e162-1c0a-4ea3-961d-b836d15057f1-046751.png)
7. 取数量最高的几个$ \rho $和$ \theta $（直线）
    1. ![1719055364943-dd927a6a-22d2-40dc-a56b-dde0d7217111.png](./img/ms3xNs1Ail6CxiNe/1719055364943-dd927a6a-22d2-40dc-a56b-dde0d7217111-855520.png)



1. 彩色图像->灰度图；
2. 去噪（高斯核）；
3. 边缘提取（梯度算子、拉普拉斯算子、canny、sobel)；
4. 二值化（判断此处是否为边缘点，就看灰度度值==255）
5. 映射到霍夫空间（准备两个容器，一个用来展示hough-space概况，一个数组hough-space用来储存voting的值，因为投票过程往往有某个极大值超过阈值，多达几千，不能直接用灰度图来记录投票信息
6. 取局部极大值，设定阈值，过滤干扰直线
7. 绘制直线、标定角点。

###### Rigid matching
学习hough transform的voting的思想。不断的找pair，满足条件就vote



![1719055426413-c5d5f291-08a9-4004-ba65-92da6c64b73d.png](./img/ms3xNs1Ail6CxiNe/1719055426413-c5d5f291-08a9-4004-ba65-92da6c64b73d-270310.png)

![1719058634791-c19de35c-beb2-40b9-a4a7-21b6e2d2997d.png](./img/ms3xNs1Ail6CxiNe/1719058634791-c19de35c-beb2-40b9-a4a7-21b6e2d2997d-544921.png)

可以用到几何模型本身找对称模型。真正对称的结构会被很多pair vote。

![1719058726104-5c3e1b86-0f2b-485b-bb90-f3b9f690192d.png](./img/ms3xNs1Ail6CxiNe/1719058726104-5c3e1b86-0f2b-485b-bb90-f3b9f690192d-551000.png)



##### Spectral Approach（基于谱的匹配方法）
> 基于谱的方法的基本思想是建立一个图的邻接矩阵，它的节点代表潜在的对应关系，而边上的权重代表潜在的对应关系之间是否一致。正确的特征对应关系之间理应两两一致，能形成一个强连接的聚类簇，而不正确的对应关系应该只会恰巧与其它对应关系一致，不太可能建立强连接的聚类簇。提取最大团（clique），拟合刚体变换完成配准。
>



两边各找一些点，变换后每边的点之间的距离保持不变。

转化成 correspondences 的问题。

![1719058931208-79f87095-acaf-4b9f-8c21-26fc6187c2d9.png](./img/ms3xNs1Ail6CxiNe/1719058931208-79f87095-acaf-4b9f-8c21-26fc6187c2d9-854203.png)

1. 采样
2. 建立correspondence （1，2，3，4，5）
3. 找出好的correspondence（1，3，5）
    1. 建立 consistency matrix。
        1. 如果两个correspondence保距，则置1。否则置0.
    2. 找sub matrix（2和4的correspondence不够强）（找极大团 clique，极大完全子图）

![1719059136881-ceb6c0d8-ab96-4e22-8803-9c3a3ad851ff.png](./img/ms3xNs1Ail6CxiNe/1719059136881-ceb6c0d8-ab96-4e22-8803-9c3a3ad851ff-118134.png)

![1719059554461-81979059-ebf7-4629-8598-f047317baadc.png](./img/ms3xNs1Ail6CxiNe/1719059554461-81979059-ebf7-4629-8598-f047317baadc-292603.png)

找极大团：

![1719059963186-c07d8ba4-c17a-4676-ba68-50be63e0f022.png](./img/ms3xNs1Ail6CxiNe/1719059963186-c07d8ba4-c17a-4676-ba68-50be63e0f022-679795.png)

![1719060683308-86c38751-a301-4a09-bdcb-1eac3ec49e1b.png](./img/ms3xNs1Ail6CxiNe/1719060683308-86c38751-a301-4a09-bdcb-1eac3ec49e1b-939539.png)

##### <font style="color:rgb(25, 27, 31);">混合方法（Hybrid Method）</font>
解优化

![1719060708168-c30828ab-3f55-415f-94ba-a91a48efaac9.png](./img/ms3xNs1Ail6CxiNe/1719060708168-c30828ab-3f55-415f-94ba-a91a48efaac9-830352.png)

混合spectral matching和robust norm：

![1719060730738-0857a961-26c9-4630-9fc4-ccfab6ce5304.png](./img/ms3xNs1Ail6CxiNe/1719060730738-0857a961-26c9-4630-9fc4-ccfab6ce5304-522484.png)

![1719061052252-94b41983-705d-40dd-b288-eeac05951035.png](./img/ms3xNs1Ail6CxiNe/1719061052252-94b41983-705d-40dd-b288-eeac05951035-534810.png)  

##### Learning-based methods
例如，[Yue Wang](http://link.zhihu.com/?target=https%3A//people.csail.mit.edu/yuewang/) 和 [Solomon](http://link.zhihu.com/?target=http%3A//people.csail.mit.edu/jsolomon/) 提出了一种基于深度学习的配准算法，基本流程是首先用动态图卷积神经网络（DGCNN）将未对齐的点云数据嵌入（embed）到一个共同的空间之中，然后用一个基于注意力的模块结合指针网络（pointer network）预测两片点云的近似匹配，最后用一个奇异值分解模块提取刚体变换，得到最终的结果，参见[《Deep Closest Point: Learning Representations for Point Cloud Registration》](http://link.zhihu.com/?target=https%3A//openaccess.thecvf.com/content_ICCV_2019/papers/Wang_Deep_Closest_Point_Learning_Representations_for_Point_Cloud_Registration_ICCV_2019_paper.pdf)。  
链接：https://zhuanlan.zhihu.com/p/462813029

![1719061364035-770c3ff7-e959-467c-aad5-50e31d5f32fb.png](./img/ms3xNs1Ail6CxiNe/1719061364035-770c3ff7-e959-467c-aad5-50e31d5f32fb-066900.png)

## Multiple Registration
### Joint pairwise registration
多个 pairwise registration，还是解高斯牛顿。但需要determine overlapping，且慢。

![1719061642847-298b7e29-1775-4409-9eec-ada8f8cf4737.png](./img/ms3xNs1Ail6CxiNe/1719061642847-298b7e29-1775-4409-9eec-ada8f8cf4737-065287.png)

![1719061763747-94723d07-b20e-4547-8a0f-93ac11108b8f.png](./img/ms3xNs1Ail6CxiNe/1719061763747-94723d07-b20e-4547-8a0f-93ac11108b8f-289897.png)

![1719061821163-66cee29f-6fe9-473e-90fb-7740baa53692.png](./img/ms3xNs1Ail6CxiNe/1719061821163-66cee29f-6fe9-473e-90fb-7740baa53692-748919.png)

![1719061827301-6b43b500-fd3b-4723-89e5-b21c8ba14911.png](./img/ms3xNs1Ail6CxiNe/1719061827301-6b43b500-fd3b-4723-89e5-b21c8ba14911-828733.png)

### Simultaneous regisgtration and reconstruction
找 latent surface，去 fit scan, iterate

![1719062060585-f74268db-754d-48dd-81a7-cfb27b2a7404.png](./img/ms3xNs1Ail6CxiNe/1719062060585-f74268db-754d-48dd-81a7-cfb27b2a7404-383575.png)

![1719062116989-032c26d4-35f3-468f-94fe-f84df5e07e69.png](./img/ms3xNs1Ail6CxiNe/1719062116989-032c26d4-35f3-468f-94fe-f84df5e07e69-264117.png)

![1719062179702-d045bcff-6f85-4550-ac47-fe21756af75a.png](./img/ms3xNs1Ail6CxiNe/1719062179702-d045bcff-6f85-4550-ac47-fe21756af75a-122881.png)

![1719062239720-0ec3c344-9cf2-483b-83cf-57634da63fe8.png](./img/ms3xNs1Ail6CxiNe/1719062239720-0ec3c344-9cf2-483b-83cf-57634da63fe8-548735.png)

好处：

1. 不需要 determine overlapping
2. scan 和 surface alignment 是 linear 的

![1719062330217-da11d9c4-0ab7-4b04-87db-62f908b319ad.png](./img/ms3xNs1Ail6CxiNe/1719062330217-da11d9c4-0ab7-4b04-87db-62f908b319ad-069899.png)

![1719062370875-07657601-be0a-4c2d-bdfa-d87ab21550d1.png](./img/ms3xNs1Ail6CxiNe/1719062370875-07657601-be0a-4c2d-bdfa-d87ab21550d1-042205.png)



## Topics that are not covered
dynamic reconstruciton 最近很火

![1719062404008-7cf732c4-fd52-4c0f-b31d-9a6b986a3323.png](./img/ms3xNs1Ail6CxiNe/1719062404008-7cf732c4-fd52-4c0f-b31d-9a6b986a3323-462805.png)

## Combining Local and Global Matching
![1719053832094-a8c8fb5b-23a3-4458-86ba-0a91c062152a.png](./img/ms3xNs1Ail6CxiNe/1719053832094-a8c8fb5b-23a3-4458-86ba-0a91c062152a-350301.png)



## References
1. [ICP](https://cs.gmu.edu/~kosecka/cs685/cs685-icp.pdf)
2. [特征分解、SVD分解](https://zhuanlan.zhihu.com/p/686369938)
3. PCA和SVD的联系和区别？ - Alex的文章 - 知乎[https://zhuanlan.zhihu.com/p/78193297](https://zhuanlan.zhihu.com/p/78193297)
4. 高斯-牛顿优化算法 & L-M优化算法逐行推导 - 无疆WGH的文章 - 知乎[https://zhuanlan.zhihu.com/p/372136565](https://zhuanlan.zhihu.com/p/372136565)
5. 《GAMES203：三维重建和理解》2 配准（Registration） - zhiwei的文章 - 知乎 [https://zhuanlan.zhihu.com/p/462813029](https://zhuanlan.zhihu.com/p/462813029)
+ <font style="color:rgb(25, 27, 31);">极小化点与面之间距离的算法变体参见 Chen 和 Medioni 的论文</font>[《Object modeling by registration of multiple range images》](https://link.zhihu.com/?target=https%3A//graphics.stanford.edu/courses/cs348a-17-winter/Handouts/chen-medioni-align-rob91.pdf)
+ <font style="color:rgb(25, 27, 31);">点与面之间距离的计算可参考 Pottmann 和 Hofer 的论文</font>[《Geometry of the Squared Distance Function to Curves and Surfaces》](https://link.zhihu.com/?target=https%3A//graphics.stanford.edu/courses/cs468-03-fall/Papers/pottmann_geoSquaredDistance.pdf)<font style="color:rgb(25, 27, 31);">；</font>
+ ![1719050650575-8af3da93-bc37-49a0-9c5d-ae988b77a68e.png](./img/ms3xNs1Ail6CxiNe/1719050650575-8af3da93-bc37-49a0-9c5d-ae988b77a68e-339367.png)
+ [Hough Transform using OpenCV | LearnOpenCV](https://learnopencv.com/hough-transform-with-opencv-c-python/)
+ [霍夫变换(Hough Transform)-CSDN博客](https://blog.csdn.net/crossoverpptx/article/details/131152956)



> 更新: 2024-11-09 13:37:45  
> 原文: <https://www.yuque.com/viruspc/el3mi0/fmtubozgm9xztez8>