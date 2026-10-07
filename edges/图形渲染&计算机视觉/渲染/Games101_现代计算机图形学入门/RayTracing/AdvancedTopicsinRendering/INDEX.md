# Advanced Topics in Rendering

- [Summary](#summary)
- [Advanced Light Transport](#advanced-light-transport)
  * [Unbiased light transport methods](#unbiased-light-transport-methods)
    + [Biased vs. Unbiased Monte Carlo Estimators](#biased-vs-unbiased-monte-carlo-estimators)
    + [Bidirectional path tracing (BDPT)](#bidirectional-path-tracing-bdpt)
    + [Metropolis Light Transport (MLT)](#metropolis-light-transport-mlt)
  * [Biased light transport methods](#biased-light-transport-methods)
    + [Photon Mapping](#photon-mapping)
    + [Vertex Connection and Merging](#vertex-connection-and-merging)
    + [Instant Radiosity (IR)](#instant-radiosity-ir)
- [Advanced Appearance Modeling](#advanced-appearance-modeling)
  * [Non-surface models](#non-surface-models)
    + [Participating media](#participating-media)
    + [Hair / fur / fiber (BCSDF)](#hair--fur--fiber-bcsdf)
      - [Kajiya-Kay Model](#kajiya-kay-model)
      - [Marschner Model](#marschner-model)
      - [Fur Appearance](#fur-appearance)
      - [Double Cilinder Model](#double-cilinder-model)
    + [![1683440495027-3855b84d-d01f-4e22-94ec-5383f558f2f0.png](./img/TgQWNctLwySWGUa_/1683440495027-3855b84d-d01f-4e22-94ec-5383f558f2f0-111265.jpg)](#1683440495027-3855b84d-d01f-4e22-94ec-5383f558f2f0pngimgtgqwnctlwyswgua_1683440495027-3855b84d-d01f-4e22-94ec-5383f558f2f0-111265png)
    + [Granular material](#granular-material)
  * [Surface models](#surface-models)
    + [Translucent material (BSSRDF)](#translucent-material-bssrdf)
      - [Subsurface Scattering](#subsurface-scattering)
      - [Scattering Function](#scattering-function)
      - [Diphole Approximation](#diphole-approximation)
    + [Cloth](#cloth)
      - [Physical Feature](#physical-feature)
      - [Rendering as Surface](#rendering-as-surface)
      - [Rendering as Participating Media](#rendering-as-participating-media)
      - [Render as Actual Fibers](#render-as-actual-fibers)
    + [Detailed material (non-statistical BRDF)](#detailed-material-non-statistical-brdf)
      - [Motivation](#motivation)
      - [Add Details](#add-details)
      - [Difficult Path Sampling Problem](#difficult-path-sampling-problem)
      - [Recent Trend: Wave Optics](#recent-trend-wave-optics)
  * [Procedural appearance](#procedural-appearance)
- [References](#references)

---

# Summary
+ Advanced Light Transport
    - Unbiased light transport methods
        * Path tracing
        * Bidirectional path tracing (BDPT)
        * Metropolis light transport (MLT)
    - Biased light transport methods
        * Photon mapping
        * Vertex Connection and Merging
        * Instant Radiosity (IR): 实时辐射度, many light method
+ Advanced Appearance Modeling
    - Non-surface models 非表面模型
        * Participating media
        * Hair / fur / fiber (BCSDF)
        * Granular material
    - Surface models
        * Translucent material (BSSRDF)
        * Cloth
        * Detailed material (non-statistical BRDF)
    - Procedural appearance

# Advanced Light Transport
+ Unbiased light transport methods
    - Path Tracing （最可靠，工业界最常用）
    - Bidirectional path tracing (BDPT)
    - Metropolis light transport (MLT)
+ Biased light transport methods
    - Photon mapping
    - Vertex connection and merging (VCM)
+ Instant radiosity (VPL / many light methods)

## Unbiased light transport methods
### Biased vs. Unbiased Monte Carlo Estimators
用蒙特卡洛积分估计出来的值，和数学期望是否一致

+ An **unbiased** Monte Carlo technique does not have any systematic error
    - The expected value of an unbiased estimator will always be the correct value, no matter how many samples are used
+ Otherwise, **biased**
    - One special case, the expected value converges to the correct value as infinite #samples are used —— **consistent. **极限情况下，无限样本时结果会收敛到数学期望。这种情况称为consistent（一致的）。

### Bidirectional path tracing (BDPT)
+ Recall: a path connects the camera and the light
+ BDPT
    - Traces sub-paths from both the camera and the light  两个半路径
    - Connects the end points from both sub-paths 半路径汇合

![1683431039652-5e9e6aba-1b6d-4ed3-8c67-38846da7cec0.png](./img/TgQWNctLwySWGUa_/1683431039652-5e9e6aba-1b6d-4ed3-8c67-38846da7cec0-272329.png)

+ **Pros:** Suitable if the light transport is complex on the light's side（下面这个场景有一个特点，所有的物体都是被间接光照）
+ **Cons:** Difficult to implement & quite slow 

![1683431121717-e6023c93-6955-4b72-b721-8fb4962f44d2.png](./img/TgQWNctLwySWGUa_/1683431121717-e6023c93-6955-4b72-b721-8fb4962f44d2-925073.jpg)

### Metropolis Light Transport (MLT)
 Metropolis 是人名

用统计学上一个采样工具：马尔可夫链 

之前均匀采样的做法是，每次根据均匀分布选取一个样本，两次选取之间毫无关系。

现在的做法是，每次根据上次选择的样本来进行选择。

这样做的好处：给定足够的时间，可以生成以任意函数的形状为pdf 生成的样本。

采样的pdf（p(x)）和被积分的函数形状(f(x))一致时，得到的variance最小。

给定任意一个路径，可以生成与这个路径相似的路径

+ A Markov Chain Monte Carlo (MCMC) application
    - Jumping from the current sample to the next with some PDF
+ Very good at locally exploring difficult light paths
+ Key idea
    - Locally perturb an existing path to get a new path

![1683432026492-25325939-c84a-4cce-b7e9-5b814c75ccfd.png](./img/TgQWNctLwySWGUa_/1683432026492-25325939-c84a-4cce-b7e9-5b814c75ccfd-540279.png)

+ Pros
    - Works great with difficult light paths. 特别适合做复杂的光路传播。以一条光路为种子，可以找到更多。
    - Also unbiased

下面左图中，半开的门中传来光源，场景中的物体都被间接光照。

下面右图中，是caustic现象光路为水面->泳池->水面。水面是specular，泳池底部假设是diffuse，得到SDS Path， Specular-Diffuse-Specular Path。SDS Path非常难渲染。

![1683432135259-f0c1a5cd-2967-4d16-9332-a47ed78cdb3b.png](./img/TgQWNctLwySWGUa_/1683432135259-f0c1a5cd-2967-4d16-9332-a47ed78cdb3b-318152.jpg)

+ Cons 
    - Difficult to estimate the convergence rate 渲染多久可以收敛？不知道。（之前的Path Tracing是可以估计的）
    - Does not guarantee equal convergence rate per pixel。使得图片比较脏
    - So, usually produces "dirty" results
    - Therefore, usually not used to render animations （同一个像素，在一帧收敛，另一帧不收敛，画面抖动大）

![1683433406077-48c96107-87fe-4a23-a882-277f16f7e0e5.png](./img/TgQWNctLwySWGUa_/1683433406077-48c96107-87fe-4a23-a882-277f16f7e0e5-379575.jpg)

## Biased light transport methods
### Photon Mapping
光子映射

+ A biased approach & A two-stage method
+ Very good at handling Specular-Diffuse-Specular (SDS) paths and generating **caustics**

![1683433570407-7a5a83d1-2261-4d8a-b76a-33f07f533c1f.png](./img/TgQWNctLwySWGUa_/1683433570407-7a5a83d1-2261-4d8a-b76a-33f07f533c1f-693526.jpg)

光子映射的实现方式有非常多，下面介绍其中一种

1. Stage 1 - photon tracing
    - Emitting photons from the light source, bouncing them around, then recording photons on diffuse surfaces。打到diffuse材质上后停止。
    - 这一步之后，知道所有光子都停在哪里

![1683433677245-866b4607-fce3-44ed-9309-ede598466a23.png](./img/TgQWNctLwySWGUa_/1683433677245-866b4607-fce3-44ed-9309-ede598466a23-848048.png)

2. Stage 2 - photon collection (final gathering)
    - Shoot sub-paths from the camera, bouncing them around, until they hit diffuse surfaces
    - 这一步得到从反方向（相机）出发，光子都停在哪里
3. Calculation - local density estimation 局部密度估计
    - Idea: areas with more photons should be brighter 光子分布越集中的地方越亮。
    - For each shading point, find the nearest N photons. Take the surface area they over。得到近n个光子的面积（面积有各种各样的做法。比如，对光子求包围盒，然后与做色点面相交求相交面积）
    - 面积除以N，就是光子的密度。 

![1683433886076-2817d396-cd4a-42c7-a87d-2a49d1c5f320.png](./img/TgQWNctLwySWGUa_/1683433886076-2817d396-cd4a-42c7-a87d-2a49d1c5f320-339488.png)

N如何选取？在光子数量不变的情况下：

Small N => noisy

Large N => blurry

![1683434345852-55ebd3fd-2fb4-4641-879e-f8a1b365e69f.png](./img/TgQWNctLwySWGUa_/1683434345852-55ebd3fd-2fb4-4641-879e-f8a1b365e69f-511472.jpg)

Why biased?

光子数量不够，采样率太低

![1683434407641-a2ba1bb8-faf3-45e1-8011-7ae32b1cbd98.png](./img/TgQWNctLwySWGUa_/1683434407641-a2ba1bb8-faf3-45e1-8011-7ae32b1cbd98-571302.png)

![1683434600435-04591435-98f8-4475-91b1-147a077b1c81.png](./img/TgQWNctLwySWGUa_/1683434600435-04591435-98f8-4475-91b1-147a077b1c81-728225.png)

光子无限多时会收敛。So, biased but consistent. 



+ An easier understanding bias in rendering
    - Biased == blurry
    - Consistent == not blurry with infinite #samples
+ Why not do a "const range" search for density estimation?
    - 越多光子，应该用越大的N

### Vertex Connection and Merging
+ A combination of BDPT and Photon Mapping
+ Key idea
    - Let's not waste the sub-paths in BDPT if their end points cannot be connected but can be merged  虽然不相连，但终点在同一个面上，这样的path也不要浪费
    - Use photon mapping to handle the merging of nearby photons" 使用光子映射来合并相邻光子

![1683435001694-fa890397-0ca0-4d24-bee1-cad0e944fab3.png](./img/TgQWNctLwySWGUa_/1683435001694-fa890397-0ca0-4d24-bee1-cad0e944fab3-063648.png)

### Instant Radiosity (IR)
实时辐射度

+ Sometimes also called many-light approaches 有时称为 many light方法
+ Key idea
    - Lit surfaces can be treated as light sources 一般不区分光线是反射来的还是自己发出来的
+ Approach
    - Shoot light sub-paths and assume the end point of each sub-path is a Virtual Point Light (VPL)。已经被照亮的面，都认为是光源，然后用它们来进一步照亮别人。先从光源打出很多light sub-path，光停住的地方就认为是新的光源
    -  Render the scene as usual using these VPLs。当看向一个点，用所有新的光源来照亮这一点。

![1683435272273-689e7f80-e04c-4b0c-873a-5abcacd1b179.png](./img/TgQWNctLwySWGUa_/1683435272273-689e7f80-e04c-4b0c-873a-5abcacd1b179-364868.png)

+ Pros: fast and usually gives good results on diffuse scenes
+ Cons: 
    - Spikes will emerge when VPLs are close to shading points 光源和shading点极近的地方会某名发光，和渲染方程有关。见右图
    - Cannot handle glossy materials 

![1683435692037-4bd28de4-54e1-4ca8-a05e-6515aebfdd30.png](./img/TgQWNctLwySWGUa_/1683435692037-4bd28de4-54e1-4ca8-a05e-6515aebfdd30-094117.png)

# Advanced Appearance Modeling
+ Non-surface models 非表面模型
    - Participating media
    - Hair / fur / fiber (BCSDF)
    - Granular material
+ Surface models
    - Translucent material (BSSRDF)
    - Cloth
    - Detailed material (non-statistical BRDF)
+ Procedural appearance



## Non-surface models 
### Participating media
散射介质，颗粒介质，参与介质

![1683436986777-441e5aa7-63b3-44f1-ae39-93856ff48a55.png](./img/TgQWNctLwySWGUa_/1683436986777-441e5aa7-63b3-44f1-ae39-93856ff48a55-070071.png)![1683437000801-1d720755-d6db-4023-9626-ebe13f385271.png](./img/TgQWNctLwySWGUa_/1683437000801-1d720755-d6db-4023-9626-ebe13f385271-073165.jpg)

At any point as light travels through a participating medium, it can  be (partially) absorbed and scattered. 被吸收或被散射

![1683437061648-9c7c3ccf-2e52-4cb6-8bc9-ed98cc4b0687.png](./img/TgQWNctLwySWGUa_/1683437061648-9c7c3ccf-2e52-4cb6-8bc9-ed98cc4b0687-627886.png)

Use Phase Function to describe the angular distribution of light scattering at any point x within participating media. 相位函数决定光线如何散射（往哪个方向散的多）

![1683437901469-4dfc1df0-2e3c-4d97-b6e1-5f1bef12c6b4.png](./img/TgQWNctLwySWGUa_/1683437901469-4dfc1df0-2e3c-4d97-b6e1-5f1bef12c6b4-739055.png)

Rendering：

+ Randomly choose a direction to bounce
+ Randomly choose a distance to go straight 光线能走多远
+ At each 'shading point', connect to the light

![1683438024302-b2ad4a6a-571e-487f-aa08-72cdf24b946d.png](./img/TgQWNctLwySWGUa_/1683438024302-b2ad4a6a-571e-487f-aa08-72cdf24b946d-715273.png)

渲染实例（超能特工队）：

![1683438106540-9329fd15-d048-446a-9ff7-108bb13fea67.png](./img/TgQWNctLwySWGUa_/1683438106540-9329fd15-d048-446a-9ff7-108bb13fea67-005380.jpg)

渲染实例（刺客信条）：

![1683438125173-f12e52fa-e765-4c74-92c0-eb95f0d79bab.png](./img/TgQWNctLwySWGUa_/1683438125173-f12e52fa-e765-4c74-92c0-eb95f0d79bab-041229.jpg)

### Hair / fur / fiber (BCSDF)
一个头发不能简单视为一个面

考虑光线如何和曲线做作用

![1683438605432-4686fc71-ecf3-4965-adf2-8ed165b8311b.png](./img/TgQWNctLwySWGUa_/1683438605432-4686fc71-ecf3-4965-adf2-8ed165b8311b-992100.jpg)

#### Kajiya-Kay Model
头发会散射出圆柱

效果较差，不常用

![1683438628950-508206d2-ed38-4db1-8137-cf6d71120aae.png](./img/TgQWNctLwySWGUa_/1683438628950-508206d2-ed38-4db1-8137-cf6d71120aae-200252.png)

![1683438752865-4d822420-d09e-43ce-9b10-8daf80af9e14.png](./img/TgQWNctLwySWGUa_/1683438752865-4d822420-d09e-43ce-9b10-8daf80af9e14-334595.jpg)

#### Marschner Model
效果更好，被广泛应用



光照到圆柱上，一部分被反射，**另一部分会穿透（折射）**

R：反射

TT: 一束光穿透头发需要穿两次，TT的传播方式

TRT：穿透后，发生一次内部反射，再往回走





![1683438820379-400247b8-93fc-4695-8e44-5f206fc8f51c.png](./img/TgQWNctLwySWGUa_/1683438820379-400247b8-93fc-4695-8e44-5f206fc8f51c-356543.png)



把头发当成玻璃圆柱。外层：cuticle，表皮。内层：cortex，皮质，皮层。

![1683439110625-63724037-50ff-4e08-9ab1-9918d88ec08f.png](./img/TgQWNctLwySWGUa_/1683439110625-63724037-50ff-4e08-9ab1-9918d88ec08f-214764.png)



Marschner Model考虑了三种光线和圆柱的作用

![1683439368194-cddef083-0f1f-4338-bcea-2c5bf1361e4d.png](./img/TgQWNctLwySWGUa_/1683439368194-cddef083-0f1f-4338-bcea-2c5bf1361e4d-260896.png) ![1683439382782-c91e4647-56ef-4e48-844b-0a8902a60ae6.png](./img/TgQWNctLwySWGUa_/1683439382782-c91e4647-56ef-4e48-844b-0a8902a60ae6-614085.png)![1683439408028-77e0761e-6a3a-4d70-b14c-f98308981555.png](./img/TgQWNctLwySWGUa_/1683439408028-77e0761e-6a3a-4d70-b14c-f98308981555-675679.png)

渲染结果：

![1683439442213-692c526b-7989-4c0b-ac8a-ba45e96a1ff2.png](./img/TgQWNctLwySWGUa_/1683439442213-692c526b-7989-4c0b-ac8a-ba45e96a1ff2-906312.jpg)

最终幻想15![1683439650749-a0bb571b-889d-48b0-99dc-3dc34bfff1ad.png](./img/TgQWNctLwySWGUa_/1683439650749-a0bb571b-889d-48b0-99dc-3dc34bfff1ad-418010.jpg)

疯狂动物城

![1683439705995-fcb7ff2d-b6b1-44cd-accf-bfa5a7f35b85.png](./img/TgQWNctLwySWGUa_/1683439705995-fcb7ff2d-b6b1-44cd-accf-bfa5a7f35b85-576549.jpg)

#### Fur Appearance
人的头发能不能用来描述动物的毛发？不能

Cannot represent diffusive and saturated appearance

![1683439773894-2faa7c7a-899a-4150-a3cd-9eb300e61027.png](./img/TgQWNctLwySWGUa_/1683439773894-2faa7c7a-899a-4150-a3cd-9eb300e61027-139681.jpg)

相比于人类的头发，动物的毛发Medulla（髓质）较大，更容易发生散射

![1683439843882-99c98f54-0a61-4b83-b5c3-8639822a7a27.png](./img/TgQWNctLwySWGUa_/1683439843882-99c98f54-0a61-4b83-b5c3-8639822a7a27-725638.jpg)

Importance of Medulla 模拟髓质非常有必要

![1683439955676-04ac9a00-671c-49bf-98ab-441a4e85bb25.png](./img/TgQWNctLwySWGUa_/1683439955676-04ac9a00-671c-49bf-98ab-441a4e85bb25-336327.jpg)

![1683440053458-262aea15-78e7-4141-b238-6451841a0f1e.png](./img/TgQWNctLwySWGUa_/1683440053458-262aea15-78e7-4141-b238-6451841a0f1e-578267.jpg)

#### Double Cilinder Model
![1683440083828-285ef2fd-327d-470b-91db-f445b8aa4809.png](./img/TgQWNctLwySWGUa_/1683440083828-285ef2fd-327d-470b-91db-f445b8aa4809-622586.png)

新增TTs和TRTs （紫色部分，考虑到髓质的散射）

![1683440239082-1186e8df-8ce8-47e4-986e-017926d48e03.png](./img/TgQWNctLwySWGUa_/1683440239082-1186e8df-8ce8-47e4-986e-017926d48e03-901555.png)

之前的Blin-Phong模型、头发模型考虑了R、TT和TRT，这里又加了两个散射相关的TTs和TRTs

![1683440258785-e5f2dedb-d473-44f2-8661-49eee88508fb.png](./img/TgQWNctLwySWGUa_/1683440258785-e5f2dedb-d473-44f2-8661-49eee88508fb-386302.jpg) 应用：猩球崛起/狮子王

### ![1683440495027-3855b84d-d01f-4e22-94ec-5383f558f2f0.png](./img/TgQWNctLwySWGUa_/1683440495027-3855b84d-d01f-4e22-94ec-5383f558f2f0-111265.jpg)
![1683440533473-2bfa6692-2ecb-4756-8cb8-5e357aa4222c.png](./img/TgQWNctLwySWGUa_/1683440533473-2bfa6692-2ecb-4756-8cb8-5e357aa4222c-503120.jpg)

### Granular material
颗粒材质

![1683440829922-55d46d20-3015-4567-9867-b8523e009b1e.png](./img/TgQWNctLwySWGUa_/1683440829922-55d46d20-3015-4567-9867-b8523e009b1e-131354.jpg)

![1683440887363-b3c17ecf-0dbe-43b3-867e-3ebe28280298.png](./img/TgQWNctLwySWGUa_/1683440887363-b3c17ecf-0dbe-43b3-867e-3ebe28280298-324308.jpg)

应用：

![1683440970953-03f1dc3f-3aec-40dc-99c6-a3be37d13734.png](./img/TgQWNctLwySWGUa_/1683440970953-03f1dc3f-3aec-40dc-99c6-a3be37d13734-879990.jpg) 

## Surface models
### Translucent material (BSSRDF)
半透明材质（国内翻译有问题。Semi-Transparent才是半透明）

Translucent是光线在穿过过程中，除了折射还会发生吸收，还涉及散射。semi-transparent只考虑折射和吸收，不考虑散射。

光线从一个表面进入，还会从另一个表面出去

Jade/Jellyfish：

![1683441019037-763edfa7-2c3d-4e9b-8ccb-6d48641214fc.png](./img/TgQWNctLwySWGUa_/1683441019037-763edfa7-2c3d-4e9b-8ccb-6d48641214fc-414967.jpg)![1683441304049-9a05dd78-2e46-46a6-a506-b07ab5801407.png](./img/TgQWNctLwySWGUa_/1683441304049-9a05dd78-2e46-46a6-a506-b07ab5801407-174529.jpg)

反映到物理上，说明什么问题？

#### Subsurface Scattering
次表面散射

光线从一点进入表面，在下面发生大量的散射后，再从另一点出来

Visual characteristics of many surfaces caused by light** exiting **at different points than it enters

• Violates a fundamental assumption of the BRDF 违背了BRDF的基本假设

![1683441368786-2210bade-ef51-4af7-a111-a914ca41f84d.png](./img/TgQWNctLwySWGUa_/1683441368786-2210bade-ef51-4af7-a111-a914ca41f84d-168752.png)

#### Scattering Function
BSSRDF可以认为是BRDF的延伸：任意一个点进来，不从这个点出去，而是从任意一点出去

需要修改渲染方程的积分方式。对于一点，由于其他点的光也可能从这点出来，所以不仅要考虑从各个方向进来这点的光，还要考虑从各个方向进来其他点点的光。=> 不仅要对方向积分，还要对面积进行积分。

![1683448790563-ac9b84b4-fdd6-4f00-869b-85a5f86ef59b.png](./img/TgQWNctLwySWGUa_/1683448790563-ac9b84b4-fdd6-4f00-869b-85a5f86ef59b-957942.png)

#### Diphole Approximation
[Jenson et al. 2001]

Approximate light diffusion by introducing two point sources

半透明介质就好像是物体底下出现了一个光源，会从底下照亮着色点周围的一片。

为了物理上的真实，物体上方也要有一个光源。

总共两个光源。来模拟次表面散射的结果。

![1683449121512-1651fc21-3232-4fb0-a832-2c6a3844a399.png](./img/TgQWNctLwySWGUa_/1683449121512-1651fc21-3232-4fb0-a832-2c6a3844a399-048967.png)

BSSRDF 产生了大理石的效果：

![1683449367129-c9b030ec-72dc-45aa-8195-b7dcebfc50c2.png](./img/TgQWNctLwySWGUa_/1683449367129-c9b030ec-72dc-45aa-8195-b7dcebfc50c2-378420.png)![1683449383263-8d0c2076-45db-446c-8272-79ec5741097b.png](./img/TgQWNctLwySWGUa_/1683449383263-8d0c2076-45db-446c-8272-79ec5741097b-622320.png)

BSSRDF渲染人脸看起来很干。BSSRDF渲染，由于光线能进入人的皮肤，看起来圆润很多。

![1683449443111-b9fd6103-d817-4fd3-a5de-bbe202e797bb.png](./img/TgQWNctLwySWGUa_/1683449443111-b9fd6103-d817-4fd3-a5de-bbe202e797bb-193602.png)

![1683449564259-53f64bd3-99f6-4080-97df-90bc3fa236fd.png](./img/TgQWNctLwySWGUa_/1683449564259-53f64bd3-99f6-4080-97df-90bc3fa236fd-693595.png)  

### Cloth
#### Physical Feature
布料是一系列缠绕的纤维

缠绕有两个级别：

1. fiber经过第一次缠绕，可以缠绕成不同的股（ply）
2. 多股缠绕，会形成线（yarn）

有了线后，再woven或knitted成布（cloth）

![1683449739165-ecf757fd-43f4-4b45-9dae-4e3b828160ca.png](./img/TgQWNctLwySWGUa_/1683449739165-ecf757fd-43f4-4b45-9dae-4e3b828160ca-785240.jpg)

cloth的渲染方法主要有三种，都有人用：

+ Rendering as surface
+ Rendering as participating
+ Rendering as actual fibers

#### Rendering as Surface
渲染和针织的方式、图案有关。

![1683450020789-1d261ba5-0730-416b-8843-06cd29a56ce5.png](./img/TgQWNctLwySWGUa_/1683450020789-1d261ba5-0730-416b-8843-06cd29a56ce5-467000.jpg)

limitation：没有考虑体积

![1683450123969-59c5d0ca-9a11-4b0e-8a70-0fd06f170223.png](./img/TgQWNctLwySWGUa_/1683450123969-59c5d0ca-9a11-4b0e-8a70-0fd06f170223-156704.jpg)

#### Rendering as Participating Media
把空间分成很多格子，不把布料当成面，而是当成云、雾之类的来渲染。

+ Properties of individual fibers & their distribution ->scattering parameters
+ Render as a participating medium

![1683450190336-7b59f111-7280-466e-8397-ccdaf2e488ad.png](./img/TgQWNctLwySWGUa_/1683450190336-7b59f111-7280-466e-8397-ccdaf2e488ad-778734.jpg)

#### Render as Actual Fibers
就像是人的头发

Render every fiber explicitly

![1683450295589-3a2e6a43-4451-4b5f-b8fe-7f9a1cf2b42c.png](./img/TgQWNctLwySWGUa_/1683450295589-3a2e6a43-4451-4b5f-b8fe-7f9a1cf2b42c-512177.jpg)

### Detailed material (non-statistical BRDF)
#### Motivation
看起来不真实。原因是太完美，没有划痕之类的细节。

![1683450481488-bc38a76d-4851-41f1-bad7-689d5948da57.png](./img/TgQWNctLwySWGUa_/1683450481488-bc38a76d-4851-41f1-bad7-689d5948da57-767717.png)

![1683450587268-2ed3cf13-246f-4a59-b0e7-3b1f0e5ca9d7.png](./img/TgQWNctLwySWGUa_/1683450587268-2ed3cf13-246f-4a59-b0e7-3b1f0e5ca9d7-707323.png)

![1683450656304-5d6deb9f-84b0-4f5c-ba64-9c7149d908f7.png](./img/TgQWNctLwySWGUa_/1683450656304-5d6deb9f-84b0-4f5c-ba64-9c7149d908f7-407611.png)![1683450675971-08a0b863-5860-4fd8-8e7c-de5d82a1f33b.png](./img/TgQWNctLwySWGUa_/1683450675971-08a0b863-5860-4fd8-8e7c-de5d82a1f33b-385134.png)![1683450715437-a41ee67b-e5cb-4de1-a65f-3e46a4488986.png](./img/TgQWNctLwySWGUa_/1683450715437-a41ee67b-e5cb-4de1-a65f-3e46a4488986-313795.png)

#### Add Details
微表面模型最重要的是什么？是表面法线的分布

![1683450795295-b7dc0c93-2b58-4eca-9555-35958e83d18d.png](./img/TgQWNctLwySWGUa_/1683450795295-b7dc0c93-2b58-4eca-9555-35958e83d18d-593359.png)

让D(h)法线分布，既考虑统计规律，又有自己带的细节。

![1683450972135-e90b116c-57d6-4ae3-ae18-bb7a42bb0420.png](./img/TgQWNctLwySWGUa_/1683450972135-e90b116c-57d6-4ae3-ae18-bb7a42bb0420-744954.png)

![1683451053287-643e10fd-f656-408d-8495-0a5858848e78.png](./img/TgQWNctLwySWGUa_/1683451053287-643e10fd-f656-408d-8495-0a5858848e78-540905.png)![1683451099356-a491aad9-dba5-4ac6-bb54-db23176f3fbb.png](./img/TgQWNctLwySWGUa_/1683451099356-a491aad9-dba5-4ac6-bb54-db23176f3fbb-049169.png)

#### Difficult Path Sampling Problem
虽然可以定义各种各样的细节，但渲染起来很困难。下图渲染了一个月

![1683451140744-f9b6fb91-c642-4278-a8ff-a0c505bbd235.png](./img/TgQWNctLwySWGUa_/1683451140744-f9b6fb91-c642-4278-a8ff-a0c505bbd235-032456.png)

困难的根本原因是，我们认为每一个微表面是一个镜面，有着不同的法向量=》随机采样导致镜面难将光打到光源/摄像机

![1683451333743-a2b4715d-b085-425b-b98a-971647874725.png](./img/TgQWNctLwySWGUa_/1683451333743-a2b4715d-b085-425b-b98a-971647874725-905873.png)

解决方案：BRDF over a pixel 

每个像素包含很多微表面。如果能够把覆盖范围的微表面的法线分布算出来，就可以替代原来的光滑的分布，并且用到微表面模型里。 

![1683451407910-36736f40-f585-44d4-b138-63ea14000a9f.png](./img/TgQWNctLwySWGUa_/1683451407910-36736f40-f585-44d4-b138-63ea14000a9f-088148.png)

像素覆盖范围小，会得到一些特殊的特征

![1683451580882-952242d4-6c33-494f-86ec-3b490b0d3511.png](./img/TgQWNctLwySWGUa_/1683451580882-952242d4-6c33-494f-86ec-3b490b0d3511-942263.jpg)

![1683451641969-d6680fa1-22f4-427c-81ed-adcac82ab25a.png](./img/TgQWNctLwySWGUa_/1683451641969-d6680fa1-22f4-427c-81ed-adcac82ab25a-320726.png)

![1683451680586-143b64b2-5b7e-4b58-b14a-d237610ca39f.png](./img/TgQWNctLwySWGUa_/1683451680586-143b64b2-5b7e-4b58-b14a-d237610ca39f-150214.png)

![1683451741146-85b67c5d-d582-4fdb-ab8b-7f5123018594.png](./img/TgQWNctLwySWGUa_/1683451741146-85b67c5d-d582-4fdb-ab8b-7f5123018594-658000.jpg)

![1683451751296-33de6606-9c2d-478a-b3cf-add99b075ae0.png](./img/TgQWNctLwySWGUa_/1683451751296-33de6606-9c2d-478a-b3cf-add99b075ae0-388199.jpg)

#### Recent Trend: Wave Optics
当引入细节时，还几何光学来解释就不对。当物体非常小时，不应该假设物体沿直线传播，应该假设物体以波的形式传播

![1683451785922-f2263742-7102-4250-938a-f893bed5f4dc.png](./img/TgQWNctLwySWGUa_/1683451785922-f2263742-7102-4250-938a-f893bed5f4dc-759848.png)

用光照射一个白色物体，却看到很多五颜六色的点。

![1683451939259-714fdc6a-4b9e-4373-bbe7-e12326667c50.png](./img/TgQWNctLwySWGUa_/1683451939259-714fdc6a-4b9e-4373-bbe7-e12326667c50-564343.png)

![1683451961535-b60a804e-39a1-4635-8cb5-d974146a7e20.png](./img/TgQWNctLwySWGUa_/1683451961535-b60a804e-39a1-4635-8cb5-d974146a7e20-064201.png)

波动光学得到的BRDF，跟几何光学得到的BRDF很像，但有不连续的特点（光的干涉，有些地方加强，有些地方减弱）。

![1683452001816-a014cb73-4f6c-4a58-998c-bbb616bc7964.png](./img/TgQWNctLwySWGUa_/1683452001816-a014cb73-4f6c-4a58-998c-bbb616bc7964-770197.png)

渲染结果：

![1683452091136-9bc674e6-204f-4cdd-8c76-291d1f774fa4.png](./img/TgQWNctLwySWGUa_/1683452091136-9bc674e6-204f-4cdd-8c76-291d1f774fa4-391868.jpg)

![1683452122359-7496b789-1a14-47f7-ae1d-5a88df1d3dbc.png](./img/TgQWNctLwySWGUa_/1683452122359-7496b789-1a14-47f7-ae1d-5a88df1d3dbc-993597.png)

## Procedural appearance
节约存储空间

噪声函数

![1683460835416-7e6c9c13-0a2b-4e08-99ff-c0e4d7f94b2b.png](./img/TgQWNctLwySWGUa_/1683460835416-7e6c9c13-0a2b-4e08-99ff-c0e4d7f94b2b-303847.png)

![1683460879130-30d0ee6d-977f-4230-9351-d585fb02ffc3.png](./img/TgQWNctLwySWGUa_/1683460879130-30d0ee6d-977f-4230-9351-d585fb02ffc3-783190.png)

噪声函数有很多种，最常用的是Perlin Noise(“classic” noise)

例子：



![1683461004104-a4fc5f07-0c23-472e-ba93-a77cf63fdcdc.png](./img/TgQWNctLwySWGUa_/1683461004104-a4fc5f07-0c23-472e-ba93-a77cf63fdcdc-172902.png)![1683461016184-0a418bd1-411c-4e5a-9bd7-05768809d036.png](./img/TgQWNctLwySWGUa_/1683461016184-0a418bd1-411c-4e5a-9bd7-05768809d036-384081.jpg)

![1683461051507-dbccd051-fc50-4b70-85bc-9b49ce681abe.png](./img/TgQWNctLwySWGUa_/1683461051507-dbccd051-fc50-4b70-85bc-9b49ce681abe-595431.png)![1683461068240-d2037bb2-218b-46fe-844a-857f274577af.png](./img/TgQWNctLwySWGUa_/1683461068240-d2037bb2-218b-46fe-844a-857f274577af-284590.png)

# References
+ [Lecture 18 Advanced Topics in Rendering_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=18&vd_source=a637826c55b409b420b4b6584a6e8379)



> 更新: 2023-05-20 05:30:00  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lw60e6f74ugsu28v>