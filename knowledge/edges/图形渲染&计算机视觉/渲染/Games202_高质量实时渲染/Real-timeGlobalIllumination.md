# Real-time  Global Illumination

- [Summary](#summary)
- [Introduction](#introduction)
  * [Key Obervations](#key-obervations)
- [Real-Time Global Illumination (in Image Space)](#real-time-global-illumination-in-image-space)
  * [RSM: Reflective Shadow Maps](#rsm-reflective-shadow-maps)
    + [Q1: Which surface patches are directly lit](#q1-which-surface-patches-are-directly-lit)
    + [Q2: What is the contribution from each surface patch to p](#q2-what-is-the-contribution-from-each-surface-patch-to-p)
    + [Acceleartion](#acceleartion)
    + [What is needed to record in an RSM?](#what-is-needed-to-record-in-an-rsm)
    + [整体计算流程](#%E6%95%B4%E4%BD%93%E8%AE%A1%E7%AE%97%E6%B5%81%E7%A8%8B)
    + [效果](#%E6%95%88%E6%9E%9C)
    + [Pros and Cons](#pros-and-cons)
- [Real-Time Global Illumination (in 3D Space)](#real-time-global-illumination-in-3d-space)
  * [LPV: Light Propogation Volumes](#lpv-light-propogation-volumes)
    + [Introduction](#introduction-1)
    + [Steps](#steps)
      - [Step1: Generation](#step1-generation)
      - [Step2: Injection](#step2-injection)
      - [Step3: Propagation](#step3-propagation)
      - [Step4: Rendering](#step4-rendering)
    + [Any Problems?](#any-problems)
  * [VXGI: Voxel Global Illumination](#vxgi-voxel-global-illumination)
    + [Introduction](#introduction-2)
    + [Steps](#steps-1)
- [Real-Time Global Illumination (in Screen Space)](#real-time-global-illumination-in-screen-space)
  * [SSAO: Screen Space Ambient Occlusion](#ssao-screen-space-ambient-occlusion)
    + [Introduction](#introduction-3)
    + [Key ideas](#key-ideas)
      - [Key idea1](#key-idea1)
      - [Key idea2](#key-idea2)
      - [Key idea3](#key-idea3)
    + [Theory](#theory)
      - [Understanding](#understanding)
      - [A deeper understanding1](#a-deeper-understanding1)
      - [A deeper understanding2](#a-deeper-understanding2)
      - [A much simpler understanding](#a-much-simpler-understanding)
    + [How to compute the occlusion values $ k_a(p) $in real time?](#how-to-compute-the-occlusion-values--k_ap-in-real-time)
      - [Ambient occlusion approximation: limited radius](#ambient-occlusion-approximation-limited-radius)
    + [Problems](#problems)
    + [Choosing samples](#choosing-samples)
  * [HBAO: Horizon based ambient occlusion](#hbao-horizon-based-ambient-occlusion)
  * [SSDO: Screen Space Directional Occlusion](#ssdo-screen-space-directional-occlusion)
    + [What is SSDO?](#what-is-ssdo)
    + [Key idea](#key-idea)
    + [SSDO VS SSAO](#ssdo-vs-ssao)
    + [Theory](#theory-1)
    + [Pros and Cons](#pros-and-cons-1)
  * [SSR: Screen Space Reflection](#ssr-screen-space-reflection)
    + [观察](#%E8%A7%82%E5%AF%9F)
    + [可以做的事情](#%E5%8F%AF%E4%BB%A5%E5%81%9A%E7%9A%84%E4%BA%8B%E6%83%85)
    + [Basic SSR Algrithom - Mirror Reflection](#basic-ssr-algrithom---mirror-reflection)
      - [相交判断](#%E7%9B%B8%E4%BA%A4%E5%88%A4%E6%96%AD)
        * [简单相交判断](#%E7%AE%80%E5%8D%95%E7%9B%B8%E4%BA%A4%E5%88%A4%E6%96%AD)
        * [加速相交判断 - depth mipmap](#%E5%8A%A0%E9%80%9F%E7%9B%B8%E4%BA%A4%E5%88%A4%E6%96%AD---depth-mipmap)
        * [存在的问题](#%E5%AD%98%E5%9C%A8%E7%9A%84%E9%97%AE%E9%A2%98)
      - [Shading](#shading)
    + [Summary](#summary-1)
- [References](#references)

---

<font style="color:#DF2A3F;">TODO：补上光照探针部分</font>

# Summary
+ Real-Time Global Illumination
    - 核心思想：计算一次直接光照+一次间接光照
    - Image space
        * **RSM: Reflective Shadow Maps**
            + 解决问题：得到次级光源
            + 核心思想：把每个被直接光源照脸的区域（reflector）作为次级光源，来计算间接光照
            + 算法步骤：
                1. <font style="color:rgb(18, 18, 18);">第一趟：从光源向场景看，渲染得到：</font>
                    1. <font style="color:rgb(18, 18, 18);">深度图</font>
                    2. <font style="color:rgb(18, 18, 18);">次级光源 patch，记录每个patch的空间位置和光照信息和法线信息：</font>
                        1. <font style="color:rgb(18, 18, 18);">世界坐标图</font>
                        2. <font style="color:rgb(18, 18, 18);">法线图</font>
                        3. <font style="color:rgb(18, 18, 18);">光通量（flux）图 （存储次级光源颜色信息）</font>
                            1. <font style="color:rgb(18, 18, 18);">如何计算？假设每个次级光源都是diffuse的。所以这里的flux 就是直接光照的radiance 乘以颜色 再乘以 某个系数（1/PI）</font>
                2. <font style="color:rgb(18, 18, 18);">第二趟：逐像素渲染，对每个像素：</font>
                    1. <font style="color:rgb(18, 18, 18);">计算直接光照信息。结合深度图来判断阴影。</font>
                    2. <font style="color:rgb(18, 18, 18);">计算间接光照信息。从相机向场景看，利用上一趟的信息，计算每个 shading point 接收到的间接光照信息 </font>
                        1. ![1698422196177-f446a5e7-e31c-4c7e-b05b-e8c43f16840c.png](./img/aBVvL0MKXR_cfwuO/1698422196177-f446a5e7-e31c-4c7e-b05b-e8c43f16840c-437027.png)
                        2. <font style="color:rgb(18, 18, 18);">两个加速方案：</font>
                            1. <font style="color:rgb(18, 18, 18);">类似path tracing直接从光源采样。（公式中分式的左半部分）</font>
                            2. <font style="color:rgb(18, 18, 18);">不计算所有次级光源对shading point的贡献，只计算附近次级光源对贡献。</font>
                                1. <font style="color:rgb(18, 18, 18);">如何确定“附近”？在shadow map 上越近，在3D场景中越近。</font>
                    3. <font style="color:rgb(18, 18, 18);">将间接光照和直接光照融合起来（直接相加即可）。</font>
            + 优点
                - Easy to implement
            + 缺点
                - Performance scales linearly w/#lights。有多少直接光源，就要做多少RSM。只要用 Shaowmap 就会存在的问题。
                - No visibility check for indirect illumination 这个也真做不了
                - Many assumptions: diffuse reflectors, depth as distance, etc.
                - Sampling rate / quality tradeoff
            + 应用：
    - 3D space
        * **LPV: LIght Propogation Volumes**
            + 解决问题：基于RSM解决间接光照的传播问题
            + 核心思想：用均匀三维网格来传播间接光照的传播。间接光照通过RSM来计算。
            + 步骤：
                1. 知道哪些点可以作为次级光源，可以利用 RSM 来做
                    1. PS: RSM 有多少**直接**光源，就要做多少RSM的问题这里没有解决
                2. 把这些次级光源注入到场景中的三维网格中
                    1. 工业界的做法是直接用一个三维纹理
                    2. 只用SH的前两阶来表示
                3. 在网格中传播radiance
                    1. 上下左右前后传播，迭代直至收敛
                4. 传播完成之后，就知道整个场景的radiance了，直接拿去渲染
            + 优点：
                - 用SH来存储 radiance，适合diffuse材质
            + 缺点：
                - 需要注意网格粒度问题，
                    * 粒度太大会导致 light leaking。
                    * 格子粒度太小也会有问题：存储空间大和光线传播的计算慢。
                    * 格子粒度如何确定？一般是比像素数量少一个数量级。
        * **VXGI :Voxel Global Illumination**
            + 解决问题：比LVP间接光照计算更准（但更慢）
            + 步骤：
                1. 处理场景：
                    1. 把整个场景拆分成体素 Voxel
                    2. 构建层次结构（BVH树、KD树等）
                2. 从光源开始，做第一趟：看哪些voxel会被照亮，在每个voxel存储入射光（incident lighting）和法线分布。
                    1. 可以利用RSM的patch来算，和LPV的注入很像，记录raidance的分布。不同之处在于，这里不再认为材质都是diffsue的，触射光都是半球形，支持反射物也是glossy的。
                    2. 一个voxel里记录incident lighting的分布（绿色），表面normal的分布（红色），进而可以算出出射分布。比LPV的方法更准。
                    3. 父格子会把子格子的 incident lighting 和 normal 都加起来。
                3. 从相机开始，做第二趟：
                    1. 对每个像素对应的shading point，射出一个cone，统计与光锥相交的所有格子里的数据。
                        1. 不同距离查询不同层级的voxel，越远查越高层级的。随着cone的范围增大，采用更高的层次的网格。不必每次都查最小voxel。（LOD）
                    2. 更新层次结构
                4. 拿去渲染
            + 与RSM/LPV的对比
                - Directly illuminated pixels -> (hierarchical) voxels 
                    * 场景中的任何一个次级光源，从之前的像素变成了层次的体素
                - Sampling on RSM -> tracing reflected cones in 3D (Note the inaccuaracy in sampling RSM) **计算间接光照的逻辑，从从RSM采样，到从camra光线追踪。**
                    * RSM/LPV：从次级光源出发，整个场景传播一次radiance，根据radiance渲染场景。只需**一遍**。
                    * VXGI：还是从camera出发，向每个像素发射光线，打到glossy材质后，射出一个光锥，统计光锥内的次级光源。需要**多遍**。
                - 不假设反射物是diffuse的，支持glossy。不用SH存储。
            + 优点：
                - 适合glossy材质，diffuse材质麻烦些
                - 比LPV更准，接近光线追踪。
            + 缺点：
                - 四趟的
                - 比LPV更慢。LPV 传播只需做一次，VXGI需要做多次。
                - 场景体素化是一个问题。可能需要预处理，动态场景需要实实时体素化，实时体素化又会非常慢。
    - Screen space
        * **SSAO: Screen Space Ambient Occlusiion**
            + 解决问题：只根据屏幕空间做GI。相当于在Blin-Phong模型 ambient light 的基础上考虑 Visibility。
            + 核心思想：
                - 任何一个 shading point，会接收到来自任意一个方向的相同的间接光照
                - 但是不见得所有地方都可以接收到这个光照（Visibility在各个方向不同）
                - 假设次级光源都是diffuse的
            + 步骤：
                - 计算每个shading point的Visibility，得到阴影图
                    1. 在shading point 周围划定一个球形区域，采样一些点
                    2. 每个点与z buffer中的最浅深度做比较，若小于则认为被遮挡，若大于则认为不被遮挡
                    3. 把max( (红点数量- 1/2 点总数量)/绿点数量, 0 )作为平均visibility
                1. 将阴影图与直接光照图叠加
            + 优点：
                - 容易实现
                - 增强了相对位置的感觉
            + 缺点：
                - 可能存在错误的遮挡关系。
                - 存在采样问题。如何选取采样？和PCSS一样，用少量的sample先得到一个noisy的AO结果，再做一遍denoising。
            + 应用：
        * **HBAO:Horizon based ambient occlusion**
            + 解决问题：SSAO计算visibility时采用整球，实际上一个点只有半球可以接收到光
            + 方法：多获取一个法线贴图。根据法线选取合适的半球来求visibility
        * **SSDO: Screen Space Directional Occlusion**
            + 解决问题：对SSAO的提升。考虑更加真实的间接光照。
            + 对比：SSDO做法与SSAO完全相反。AO考虑间接光照来自非常远的情况，DO考虑间接光照来自非常近的地方。二者考虑的间接光照的来源不同，所以造成了截然不同的情况。
                - AO: indirect illumination + no indirect illumination. p2看不到红色框，能接收到红色的光。考虑一个小范围内间接光照的影响。
                - DO: no indirect illumination + indirect illumination (same as path tracing). p2打不到红色的框，不会有红色的间接光照过来。考虑一个远范围间接光照的影响。
                - 
        * SSR: 



# Introduction
Global Illumination (GI) is important but complex

![1697894267354-c78cd20d-1880-44e1-9ba1-2009afd89506.png](./img/aBVvL0MKXR_cfwuO/1697894267354-c78cd20d-1880-44e1-9ba1-2009afd89506-735492.png)

Blin-Phong模型中，简单通过环境光照整体提升下亮度是做不到这种效果的。



![1697894420538-b1facd1b-1317-4c70-b583-dd60f1365d9b.png](./img/aBVvL0MKXR_cfwuO/1697894420538-b1facd1b-1317-4c70-b583-dd60f1365d9b-105706.png)

直接光照好做，光线弹射越多次越难解。RTR中，GI通常是指比直接光照多考虑一次间接光照。

## Key Obervations
What are needed to illuminate any point p with indirect illumination?

+ Q1: Which surface patches are directly lit
    - Hint: what technique tells you this? shadow mapping .
+ Q2: What is the contribution from each surface patch to p
    - Then sum up all the surface pathces's contrituions
    - Hint each surface patch is like an area light

# Real-Time Global Illumination (in Image Space)
## RSM: Reflective Shadow Maps
一个2趟的算法

### Q1: Which surface patches are directly lit
场景中哪些是次级光源，每个次级光源反射出多少能量？

Q1: Which surface patches are directly lit

+ Perfectly solved with a classic shadow map
+ Each pixel on the shadow map is a small surface patch

The exact outgoing radiance for each pixel is known

+ But only for the direction to the camera 
+ 应该把接收间接光照的点p作为camera，记录shadowmap，但p点camera方向（接收直接光照的点的出射方向）不知道。 
+ 怎么不依赖这个方向？一个经典的假设：

Assumption

+ **Any reflector is diffuse **接收到直接光照的次级光源表面都假设为diffuse的（真正的shading point还是看具体材质）
+ Therefore, outgoing radiance is uniform toward all directions



自此，知道了场景中哪些是次级光源，并且光源反射出多少能量。

### Q2: What is the contribution from each surface patch to p
Recal: Light Measurements of interest

![1697897223217-e245c430-5f27-435e-802e-0b11244f457f.png](./img/aBVvL0MKXR_cfwuO/1697897223217-e245c430-5f27-435e-802e-0b11244f457f-474258.png)

What is the contribution from each surface patch to p

+  An integration over the solid angle covered by the patch
+  Can be converted to the integration on the area of the patch。利用类似 path tracing里提到的方法，直接从光源采样来避免不必要的积分。

![1697897736223-987c3c16-63fd-4cf2-bd0a-27e9b842b121.png](./img/aBVvL0MKXR_cfwuO/1697897736223-987c3c16-63fd-4cf2-bd0a-27e9b842b121-347688.png)

![1697897877356-55780b50-a6b3-4696-b130-4945cc0fb999.png](./img/aBVvL0MKXR_cfwuO/1697897877356-55780b50-a6b3-4696-b130-4945cc0fb999-381444.png)

patch很小时，甚至都不用积分，直接把 dA 乘上去。（黎曼积分）



怎么解？

+ For a diffuse reflective patch
    - $ - f_r =\rho /pi $ 
    - $ L_i = f_r * \frac{\phi}{dA} $存flux就可以。不需要考虑dA的面积问题，可以消掉
    - ![1697898447348-d06d5418-6af5-47cc-a39a-36df84e2fc70.png](./img/aBVvL0MKXR_cfwuO/1697898447348-d06d5418-6af5-47cc-a39a-36df84e2fc70-485192.png)



问题:任意一个次级光源到shading point 的 Visibility term 怎么解决？

+ 处处都是次级光源，每个次级光源再生成一个 shadow map，计算量存储量爆炸
+ 算不了，干脆就不算了



自此，知道了任何一个次级光源，怎样照亮一个shading point

![1697898922126-cf160a09-4a42-4964-a0bf-645224ccff57.png](./img/aBVvL0MKXR_cfwuO/1697898922126-cf160a09-4a42-4964-a0bf-645224ccff57-331988.png)

p照亮 x_1, x_2, x_-1, x_-2 （不考虑遮挡）

 x_1, x_2, x_-1, x_-2 照亮 x

### Acceleartion  
![1697899815543-39a2a079-e09a-4572-9d0f-e67311ecfcd5.png](./img/aBVvL0MKXR_cfwuO/1697899815543-39a2a079-e09a-4572-9d0f-e67311ecfcd5-291870.png)
观察，光源越远贡献越低。对于一个shading point，只需看距离它比较近的次级光源就可以了。

如何判断哪些次级光源近？paper里提出了一个巨大的假设：shadow map 上离得比较近，世界坐标内离得就比较近。基于这个假设可以做加速，类似PCSS的第一步和第二步。

对任何一个 shading point，取20^2个次级光源，总比512^2个好太多。

### What is needed to record in an RSM?
为每个直接光源，生成一个RSM。RSM 中存储所有次级光源的信息。

+ 阴影信息
    - depth: shadow map：shadow map，用于计算阴影
+ 次级光源信息
    - world coordinate: 实际的世界坐标，用于判断实际两个点的距离，算shading时要用
    - normal：反射物（次级光源）的法线。用于计算$ cos\theta' $，可以用于加速求次级光源对shading point的贡献。（直接从光源采样）
    - flux：光源相关的属性，和发线等没关系。结果像是flux shading。

 ![1697899960360-287ef096-32b2-49a8-9091-37da0f82a774.png](./img/aBVvL0MKXR_cfwuO/1697899960360-287ef096-32b2-49a8-9091-37da0f82a774-655614.png)



### 整体计算流程
<font style="color:rgb(18, 18, 18);">RSM的核心思想是把直接光源照亮的区域又作为发光物（虚拟点光源）来进行计算。</font>

+ <font style="color:rgb(18, 18, 18);">第一步：先单独计算直接光照对环境的影响。</font>
+ <font style="color:rgb(18, 18, 18);">第二步：要获得直接光照亮的区域，那么该如何获得这块区域呢？其实有个很简单的办法，</font>**<font style="color:rgb(18, 18, 18);">从光源的视角进行一次渲染就可以得到从光源视角看的区域</font>**<font style="color:rgb(18, 18, 18);">（渲染之后我们保存位置信息，法线信息和颜色信息到纹理中）。</font>
+ <font style="color:rgb(18, 18, 18);">第三步：用第二步保存的信息用于计算间接光照，</font>**<font style="color:rgb(18, 18, 18);">RSM的核心就是把这个发光区域的每一个像素都看成一个光源叫做虚拟点光源</font>**<font style="color:rgb(18, 18, 18);">（Virtual point light：VPL），然后用这所有的虚拟点光源来计算间接光照，那我们计算的时候就把每一个虚拟成点光源用下面的公式1计算即可。</font>
+ <font style="color:rgb(18, 18, 18);">第四步：将间接光照和直接光照融合起来（直接相加即可）。</font>



![1698419622555-8d7bcdaa-d1f1-46ce-b8dc-19fbc4d01d04.png](./img/aBVvL0MKXR_cfwuO/1698419622555-8d7bcdaa-d1f1-46ce-b8dc-19fbc4d01d04-262019.png)

注：

+ 这里没考虑直接从光源采样做加速，所以没用到 normal 贴图
+ $ \frac{max(n \cdot (x_p-x), 0)}{\|v-x_p \| ^2} = cos \theta $
+ $ x_p $: 从 word coordinate 贴图中取得
+ $ L(x_p) $：从 flux 贴图中取得
+ 

### 效果
 ![1697900557247-1ae862c7-4eb1-4bad-ae11-a5ba9a45304a.png](./img/aBVvL0MKXR_cfwuO/1697900557247-1ae862c7-4eb1-4bad-ae11-a5ba9a45304a-267037.png)

对于手电筒效果特别好。下面开启后，可以看到屋顶上反射出藤蔓。一点点变化会让效果看起来好很多。

使用手电筒的游戏，基本都用RSM。 为什么？手电筒范围小，不需要一个特别大的RSM，快。

The last of us，战争机器4，神秘海域4 都在用 RSM 来做手电筒。

### Pros and Cons
Pros

+ Easy to implement

Cons

+ Performance scales linearly w/#lights。有多少直接光源，就要做多少RSM。只要用 Shaowmap 就会存在的问题。
+ No visibility check for indirect illumination 这个也真做不了
+ Many assumptions: diffuse reflectors, depth as distance, etc.
+ Sampling rate / quality tradeoff



RSM里用到一个概念，相当于把shadow map里的任何一个小的像素，当作surface patch来看。这个概念和离线渲染中的 Virtual Point Light方法非常接近。光栅化版本的，硬件加速版本的 VPL。

更广义的来说， VPL 这种方法属于更久远的20年前的 instant radiosity （UE5 lumen！！！）。



一般来说，shadow map是图像空间的做法，在第一个pass的时候已经把场景变成一张图了，之后渲染再从图中获取信息。RSM其实也是一样的。

这里归类到3D，是因为：

1. 这种方法，最终不会到camera path是否可见的影响。不存在一开始就记录不到，丢失信息的影响。图像空间的方法往往会存在这种问题，而RSM可以认为是记录到所有信息了。
2. 后续的LPV方法建立在RSM基础之上。

# Real-Time Global Illumination (in 3D Space)
## LPV: Light Propogation Volumes
![1697977009837-e928c4ea-467c-4ee2-876c-b91d408f8f56.png](./img/aBVvL0MKXR_cfwuO/1697977009837-e928c4ea-467c-4ee2-876c-b91d408f8f56-418119.png)

高性能高质量。LPV一定程度上能解决RSM的问题

一个4趟的算法

LPV现在用的还是很多。后面基于probe的方法也用的很多。

### Introduction
Key problem：

+ Query the radiance from any direction at any shading point
+ 所有间接光照到shading point的radiance
+ 看似废话，但明确了这个问题，就可以对这个问题做单独的优化

Key idea：

+ Radiance travels in a straight line and does not change radiance
+ radiance 在空间传播过程中是不变的。会平方衰减的是 intansity。

Key solution：

+ Use a 3D grid to propagate radiance from directly illuminated surfaces to anywhere else
+ 每个 3D 格子被称为 voxel
+ 用格子来传播间接光照的传播。间接光照通过RSM来计算。

![1697980611382-a16fce42-3a50-43fd-86fd-3fb2493c8aed.png](./img/aBVvL0MKXR_cfwuO/1697980611382-a16fce42-3a50-43fd-86fd-3fb2493c8aed-274048.png)

### Steps
1. Generation of radiance point set scene representation 知道哪些点可以作为次级光源，可以利用 RSM 来做
2. Injection of point cloud of virtual light sources into raidance volume 把这些次级光源注入到场景中的三维网格中
3. Volumetric raidance propagation 在网格中传播radiance
4. Scene lighting with final light propagation volume 传播完成之后，就知道整个场景的radiance了，直接拿去渲染



#### Step1: Generation
+ This is to find directly lit surfaces
+ Simply applying RSM would suffice!
+ May use a reduced set of diffuse patches (virtual light sources)

RSM 有多少**直接**光源，就要做多少RSM的问题这里没有解决



第一步后，得到一些次级光源。

![1697981735945-80287f49-8f0b-4be4-ba38-9d6e8caff9ab.png](./img/aBVvL0MKXR_cfwuO/1697981735945-80287f49-8f0b-4be4-ba38-9d6e8caff9ab-836562.png)

#### Step2: Injection
+ Pre-subdivide the scene into a 3D grid 工业界的做法是直接用一个三维纹理
+ For each grid cell, find enclosed virutal light sources 找到格子里的所有虚拟光源
+ Sum up their directional radiance distribution 任意一个空间，往四面八方的 raidance 都是多少，得到一个radiance 在空间中的分布
+ Project to first 2 orders of SHs (4 in total) 工业界用 SHs 前两阶（4个）来做压缩这个分布。之前PRT论文中认为需要前三阶才能比较好的表示diffuse材质，工业界只用前两阶

![1697981776339-e8fa18b3-ad91-4528-a86f-31a9caaad54b.png](./img/aBVvL0MKXR_cfwuO/1697981776339-e8fa18b3-ad91-4528-a86f-31a9caaad54b-422876.png)

#### Step3: Propagation
同样不考虑 visibility

一个格子里的radiance，怎么传播到不同的网格？

+ For each grid cell, collect the radiance received from each of its 6 faces. (每个格子像它周围的面传播，上下左右前后，斜对角的格子不计算传播。右上角可以认为先传播右边，再传播上边，一个道理)
+ Sum up, and agian use SH to represent 知道其他格子里的raidance是多少 (SH 表示)
+ Repeat this propagation several times till the volume becomes stable 迭代若干次，直到收敛

![1697982332086-2a82b227-84a4-4222-a074-35d4db2d2379.png](./img/aBVvL0MKXR_cfwuO/1697982332086-2a82b227-84a4-4222-a074-35d4db2d2379-549578.png)

#### Step4: Rendering
+ For any shading point, find the grid cell it is located in
+ Grab the incident radiance in the grid cell (from all diretions) 利用每个格子里的SHs来渲染
+ Shade

### Any Problems?
p点不可能照亮右侧，但图中认为格子中的总radiance就是p点的radiance。

p点会照亮其背面。

![1697982713025-b8e93d3f-5837-4124-bd91-036931bd1b17.png](./img/aBVvL0MKXR_cfwuO/1697982713025-b8e93d3f-5837-4124-bd91-036931bd1b17-557220.png)

这一问题就是 Light leaking （图中棚子的底部不应该被照亮）

![1697982831809-da548a27-6226-4782-8814-90361a8a282b.png](./img/aBVvL0MKXR_cfwuO/1697982831809-da548a27-6226-4782-8814-90361a8a282b-237230.png)

根本原因是，几何比格子的粒度还要小。

格子粒度太小会有问题：存储空间大和光线传播的计算慢。

格子粒度如何确定？一般是比像素数量少一个数量级。

## VXGI: Voxel Global Illumination
### Introduction
一个4趟的算法

Two main differences with RSM:

+ Directly illuminated pixels -> (hierarchical) voxels 
    - 场景中的任何一个次级光源，从之前的像素变成了层次的体素
+ Sampling on RSM -> tracing reflected cones in 3D (Note the inaccuaracy in sampling RSM)
    - RSM/LPV：从次级光源出发，整个场景传播**一次**radiance，根据radiance渲染场景。只需**一遍**。
    - VXGI：还是从camera出发，向每个**像素**发射光线，打到glossy材质后，射出一个光锥，统计光锥内的次级光源。需要**多遍**。



### Steps
处理场景：

1. Voxelize the entire scene 把整个场景拆分成体素
2. Build a hierarchy （BVH树、KD树等）

![1697984681122-d062652f-fc52-405c-a116-03b9cdd7ce1f.png](./img/aBVvL0MKXR_cfwuO/1697984681122-d062652f-fc52-405c-a116-03b9cdd7ce1f-329396.png)



Two pass：

Pass 1 from the light

+ Store the incident and normal distributions in each voxel 哪些voxel会被照亮。可以利用RSM的patch来算，和LPV的注入很像，记录raidance的分布。不同之处在于，这里不再认为材质都是diffsue的，触射光都是半球形，支持反射物也是glossy的。
    - 一个voxel里记录incident lighting的分布（绿色），表面normal的分布（红色），进而可以算出出射分布。比LPV的方法更准。
    - 父格子会把子格子的 incident lighting 和 normal 都加起来。
+ Update on the hierarchy
+ 与RSM和LPV假设反射物都是diffuse的不同，支持反射物也是glossy的。（LPV用SH，就注定了不太好支持glossy）

![1697984234246-fb0f4426-a93b-4684-a3eb-4ba30ae64a92.png](./img/aBVvL0MKXR_cfwuO/1697984234246-fb0f4426-a93b-4684-a3eb-4ba30ae64a92-851552.png)

Pass 2 from the camera

+ For glossy surfaes, trace 1 cone toward the reflected direction 对每个像素对应的shading point，射出一个cone，统计与光锥相交的所有格子里的数据。
+ Query the hierachy based on the (growing) size of the cone  不必每次都查最小voxel。不同距离查询不同层级的voxel，越远查越高层级的。

![1697984437561-39cbac40-b248-480f-a719-071249e5406e.png](./img/aBVvL0MKXR_cfwuO/1697984437561-39cbac40-b248-480f-a719-071249e5406e-584897.png)



Problem？

glossy材质可以统计光锥内的voxel。diffsue物体怎么做？可以考虑成一个超大的光锥，但不如用若干小一些的圆锥来近似。图中用了8个光锥来近似半球。光锥之间的缝隙和overlap都可以接受。

![1697985372652-497cf1d6-1a46-48dc-9260-e497823bb79a.png](./img/aBVvL0MKXR_cfwuO/1697985372652-497cf1d6-1a46-48dc-9260-e497823bb79a-057369.png)



LPV 把所有的次级光源发出的radiance传播到场景的任意地方去，这样传播只需做一次。用到格子和SH表示。不怎么准，但是快。

VXGI 慢一些，但更准，接近光线追踪。Pretty good results, close to ray tracing. 

开销大导致应用得到了一些限制。更重要的一个原因：场景体素化是一个问题。可能需要预处理，动态场景需要实实时体素化，实时体素化又会非常慢。

![1697985600244-891e25dd-670e-4013-b196-9a8f78899975.png](./img/aBVvL0MKXR_cfwuO/1697985600244-891e25dd-670e-4013-b196-9a8f78899975-767270.png)直接

![1697985626003-db13b1aa-7cdd-4d0e-9134-cd649f2e30b7.png](./img/aBVvL0MKXR_cfwuO/1697985626003-db13b1aa-7cdd-4d0e-9134-cd649f2e30b7-160251.png)

![1697985669373-570cd3b7-5dd0-452f-8af6-7908fec6f319.png](./img/aBVvL0MKXR_cfwuO/1697985669373-570cd3b7-5dd0-452f-8af6-7908fec6f319-196154.png)

![1697985711406-d17d80f1-80a7-4042-ac23-28fe355674bd.png](./img/aBVvL0MKXR_cfwuO/1697985711406-d17d80f1-80a7-4042-ac23-28fe355674bd-438428.png) 间接

![1697985735232-44a5f271-8c22-411e-9a49-88ae78869bfc.png](./img/aBVvL0MKXR_cfwuO/1697985735232-44a5f271-8c22-411e-9a49-88ae78869bfc-018972.png)间接+直接

PS4蜘蛛侠游戏用的VXGI

VXGI 每个像素trace 一条光线的操作已经很像离线渲染技术的photon mapping了，自然而然也更真实些。

# Real-Time Global Illumination (in Screen Space)
What is "screen space"?

+  Using information only from "the screen"
+  In other words, post processing on existing renderings

![1698232121987-4eb87728-9567-422c-a041-cc103463166d.png](./img/aBVvL0MKXR_cfwuO/1698232121987-4eb87728-9567-422c-a041-cc103463166d-612795.png)



只根据直接光照渲染出的图像，对其做后处理，来做全局光照。

根据直接光照猜全局光照。



AO在工业界非常常用，甚至有些时候做完一遍GI后，会继续往上叠一层AO



核心思想：任何一个 shading point，会接收到来自任意一个方向的相同的间接光照

## SSAO: Screen Space Ambient Occlusion
### Introduction
First introduced by Crytek again

Why AO?

+ Cheap to implement
+ But enhances the sense of relative positions

![1698232476365-9ed122da-2d29-40bb-8205-8dd6cf79b847.png](./img/aBVvL0MKXR_cfwuO/1698232476365-9ed122da-2d29-40bb-8205-8dd6cf79b847-021132.png)

左：有AO；右：无AO

环境光遮蔽，通过 context shadow 来让物体的相对位置感更强。



What is SSAO?

+ An approximation of global illumination  是全局光照的近似
+ In screen space

### Key ideas
#### Key idea1
+ we don't know the incident indirect lighting 不知道间接光照是什么
+ Let‘s assume it is constant (for all shading points, from all directions) 设为常数。任何一个点可以接收到来自任何一个地方的光照，且光照都是一样的。
+ Sounds familiar to you? 与 Blin-Phong 着色模型中的环境光一样

![1698232672327-4c3d0b98-c345-4453-bea8-36c88c91539b.png](./img/aBVvL0MKXR_cfwuO/1698232672327-4c3d0b98-c345-4453-bea8-36c88c91539b-442037.png)

#### Key idea2
1. Considering different visibility (towards all directions) at different shading points (why?) 但是不见得所有地方都可以接收到这个光照（Visibility在各个方向不同）。在Blin-Phong模型的基础上考虑 Visibility。

离线渲染中也用。AO 在3D建模软件中被称为天光。

![1698232896647-8ea67eab-2d01-468b-b849-c98cf20e553f.png](./img/aBVvL0MKXR_cfwuO/1698232896647-8ea67eab-2d01-468b-b849-c98cf20e553f-040926.png)

#### Key idea3
1. Also assuming **diffuse **materials. 都当作 diffuse 材质

![1698233003939-db9790bc-8838-4613-b557-a8d835c3e838.png](./img/aBVvL0MKXR_cfwuO/1698233003939-db9790bc-8838-4613-b557-a8d835c3e838-912954.png)

### Theory
#### Understanding
![1698233081348-bdc3682b-a178-4e7a-a981-3a014af19798.png](./img/aBVvL0MKXR_cfwuO/1698233081348-bdc3682b-a178-4e7a-a981-3a014af19798-773867.png)

And again, from "the RTR approximation / equation"!

![1698233118651-84095db3-4fd3-45ee-b9cd-401a560fe7fe.png](./img/aBVvL0MKXR_cfwuO/1698233118651-84095db3-4fd3-45ee-b9cd-401a560fe7fe-230360.png)



![1698233482732-2e6de39b-3fc9-47de-b318-594650bf99b2.png](./img/aBVvL0MKXR_cfwuO/1698233482732-2e6de39b-3fc9-47de-b318-594650bf99b2-527046.png)

蓝色：Visibility部分拆出来。加权平均的visibility 。

黄色：间接光照。对diffuse材质做简化。

常数乘以平均visibility，就得到间接光照结果。



#### A deeper understanding1
直接从积分可以看出，相当于直接将Visibility项取出做加权平均。

![1698234176190-0a8b8417-3d2b-41bb-9930-fe13abbd483e.png](./img/aBVvL0MKXR_cfwuO/1698234176190-0a8b8417-3d2b-41bb-9930-fe13abbd483e-525277.png)

recall：积分区域小，且被积函数平滑时，这个式子更准。

在AO中，这样拆分是绝对准确的。

#### A deeper understanding2
上一个积分缺了cos项。实际上是吧cos和dw合并了。合并后cos dw 表示投影后的立体角。

从在半球积分，变为在圆面上积分。

![1698234236933-b5beeb89-8892-4da1-a5f0-3dae4e63d5f7.png](./img/aBVvL0MKXR_cfwuO/1698234236933-b5beeb89-8892-4da1-a5f0-3dae4e63d5f7-761825.png)

![1698234411788-4514e041-d806-4f9e-b5e4-c2f212ae718a.png](./img/aBVvL0MKXR_cfwuO/1698234411788-4514e041-d806-4f9e-b5e4-c2f212ae718a-309930.png)

#### A much simpler understanding
![1698234647038-f932abd9-f899-4cd2-b547-b9cfa56392cf.png](./img/aBVvL0MKXR_cfwuO/1698234647038-f932abd9-f899-4cd2-b547-b9cfa56392cf-113478.png)

### How to compute the occlusion values $ k_a(p) $in real time?
如何实时计算平均Visibility $ k_a(p)
 $？

![1698245076185-7b8aef14-9bd2-4bba-84ab-d1231a6ef8b5.png](./img/aBVvL0MKXR_cfwuO/1698245076185-7b8aef14-9bd2-4bba-84ab-d1231a6ef8b5-465672.png)

#### Ambient occlusion approximation: limited radius
一个封闭屋子，一个 shading point 往四面八方看，肯定会被挡住。所以需要设置一个距离R，只看R范围内是否被挡住。

Limit to local occlusion in a hemisphere of radius R.

More efficient and works better in enclosed areas such as indoors, that would be fully occluded otherwise.

![1698245195394-5c9d30ea-e5fa-404b-a460-85db32091372.png](./img/aBVvL0MKXR_cfwuO/1698245195394-5c9d30ea-e5fa-404b-a460-85db32091372-757282.png)

屏幕空间不可以在3D空间从 shading point 往四面八方发射光线，怎么办？

工业界的一个聪明的做法：

1. 在shading point 周围划定一个球形区域，采样一些点
2. 每个点与z buffer中的最浅深度做比较，若小于则认为被遮挡，若大于则认为不被遮挡
3. 把max( (红点数量- 1/2 点总数量)/绿点数量, 0 )作为平均visibility

![1698246270525-eeccbd24-d371-493f-8f75-bdd8071a51ff.png](./img/aBVvL0MKXR_cfwuO/1698246270525-eeccbd24-d371-493f-8f75-bdd8071a51ff-935383.png)

为什么这里visibility用整球来判断，不用半球来判断？因为无法假设法线方向。

只有当红点过半时，才开始考虑AO问题。

![1698246890660-75acec55-7fb0-4e70-a752-6782f5ee6fae.png](./img/aBVvL0MKXR_cfwuO/1698246890660-75acec55-7fb0-4e70-a752-6782f5ee6fae-888202.png)

这个假设时visibility的平均，显然没有考虑cos项，所以只是个近似。

![1698247823990-eab44133-6e84-44a7-a6ce-0bc40a30ba47.png](./img/aBVvL0MKXR_cfwuO/1698247823990-eab44133-6e84-44a7-a6ce-0bc40a30ba47-196793.png)



### Problems
可能存在错误的遮挡关系。石凳不该在地面周围出现阴影，这里出现了。

![1698247911655-89337b7a-619d-46cc-aee4-4cecbae35f74.png](./img/aBVvL0MKXR_cfwuO/1698247911655-89337b7a-619d-46cc-aee4-4cecbae35f74-398660.png)

### Choosing samples
如何选取采样？和PCSS一样，用少量的sample先得到一个noisy的AO结果，再做一遍denoising。

+ More samples -> greater accuracy
+ Many samples are needed for a good result, but for performance only about 16 samples
+ are used.
+ Positions from randomized texture to avoid banding.
+ Noisy result, blurred with edge preserving blur.

![1698248268927-a52fa222-0895-4e1e-8bda-17305bcb3f3c.png](./img/aBVvL0MKXR_cfwuO/1698248268927-a52fa222-0895-4e1e-8bda-17305bcb3f3c-263611.png)

![1698248285421-85484d94-3a89-438e-9391-9adb8e1bdff8.png](./img/aBVvL0MKXR_cfwuO/1698248285421-85484d94-3a89-438e-9391-9adb8e1bdff8-737994.png)

## HBAO: Horizon based ambient occlusion
上一个做法不知道normal vector。现代人们可以获取到normal vector，可以做的更准确一些：

1. 在法线的半球上采样。不必在整个球上采样。
2. 可以考虑cosine项。法线方向的采样点的贡献大。

此外，只考虑一定范围内的遮挡物，而不是考虑半径R内的遮挡物。

Also done in screen space.

Aprroximates ray-tracing the depth buffer.

Requires that the normal is known, and only samples in a hemisphere.

![1698248419004-884b6b9d-27b1-46a1-85ec-b06b475e4ed6.png](./img/aBVvL0MKXR_cfwuO/1698248419004-884b6b9d-27b1-46a1-85ec-b06b475e4ed6-122632.png)



接触部分AO效果好。



![1698248876615-b02b4720-0ded-4995-8a84-afc4808284eb.png](./img/aBVvL0MKXR_cfwuO/1698248876615-b02b4720-0ded-4995-8a84-afc4808284eb-413025.png)![1698249020193-39dd35e0-2771-4549-a73a-91c7bd5471d0.png](./img/aBVvL0MKXR_cfwuO/1698249020193-39dd35e0-2771-4549-a73a-91c7bd5471d0-798628.png)![1698249045344-dba13ebe-d134-43a2-8dce-75a53ee80333.png](./img/aBVvL0MKXR_cfwuO/1698249045344-dba13ebe-d134-43a2-8dce-75a53ee80333-251518.png)

## SSDO: Screen Space Directional Occlusion
### What is SSDO?
+ An improvement over SSAO
+ Considering (more) actual indirect illumination

### Key idea
+ Why do we have to assume uniform incident indirect lighting?
+ Some information of indirect lighting is already known!
+ Sounds familiar to you?

间接光照可以一定程度通过RSM知道，但这里从另一个角度考虑：

屏幕上被直接光照照亮的像素，也都是被直接光照照亮的，也都是次级光源



![1698336194384-36e31e29-4e8a-4e99-bf19-77d7af80f1fb.png](./img/aBVvL0MKXR_cfwuO/1698336194384-36e31e29-4e8a-4e99-bf19-77d7af80f1fb-105345.png)



SSAO 做法类似于path tracing

Very similar to path tracing

+ At shading point p, shoot a random ray
+ If it does not hit an obstacle, direct illumination
+ If it hits one, indirect illumination

![1698336603582-48bdcc65-d414-4769-a511-1cfea6cc6778.png](./img/aBVvL0MKXR_cfwuO/1698336603582-48bdcc65-d414-4769-a511-1cfea6cc6778-792999.png)

### SSDO VS SSAO
SSAO做法与SSDO完全相反

+ AO: indirect illumination + no indirect illumination. p2看不到红色框，能接收到红色的光。考虑一个小范围内间接光照的影响。
+ DO: no indirect illumination + indirect illumination (same as path tracing). p2打不到红色的框，不会有红色的间接光照过来。考虑一个远范围间接光照的影响。

AO假设间接光照来自非常远的情况，DO假设间接光照来自非常近的地方。二者考虑的间接光照的来源不同，所以造成了截然不同的情况。

理论上二者应该一起用，不知道工业界是不是真的有人这么用。

![1698336652890-3dd8af23-b576-4d7b-a327-87b4d2c206fd.png](./img/aBVvL0MKXR_cfwuO/1698336652890-3dd8af23-b576-4d7b-a327-87b4d2c206fd-817371.png)

### Theory
consider unoccluded and occluded directions separately

V=1时的直接光照

V=0时的间接光照

![1698418207253-e37ec5a7-a26b-48d9-ae2f-298fe898cd77.png](./img/aBVvL0MKXR_cfwuO/1698418207253-e37ec5a7-a26b-48d9-ae2f-298fe898cd77-706886.png)

间接光源很容易得到，采用和前几个方法相同的方法即可。



![1699271204779-fa763950-45da-4f33-bf15-4db1b3b02ddd.png](./img/aBVvL0MKXR_cfwuO/1699271204779-fa763950-45da-4f33-bf15-4db1b3b02ddd-258651.png)

核心是：怎样做SSDO，**哪些面会被挡住**，会对 shading point 产生贡献。

****

**（图1）哪些面会被挡住，会作为次级光源？**方法和 AO 一样。以shading point P为中心，半球内随机撒点（图中 A/B/C/D） 。如果点到相机之间有障碍物（A被挡住），那么就认为点到shading point中间有障碍物（shading point被挡住）。ABD被挡住，为P点提供间接光照。



**（图2）次级光源如何对 shading point 做贡献**？把ABD的贡献加起来（显然A点的贡献为0）



**（图3）**什么情况会出现问题？

1. 误认A方向被挡住：图中P和A之间没有被挡住，但会认为被挡住了，是次级光源。（显然A点悬空，不是次级光源）
2. 误认B方向不被挡住：Camera可以看到B点，但B方向是有其他遮挡物的，Visibility 应该为0.

问题原因：Camera-P的遮挡关系，不能代表A-P的遮挡关系。

怎么解决：直接判断 A-P 遮挡关系。也就是后面的 SSR。



### Pros and Cons
SSDO: quality closer to offline rendering. 和AO相比，采用了类似光线追踪的方法，质量更好。

Issues?

+ Still, GI in a short range。半球。
+ Visibility。根据Camera-P的可见性，来判断A-P的可见性。
+ Screen space issue: missing information from unseen surfaces



![1699272158121-a107a78a-2fff-49fc-8427-dac35abf8939.png](./img/aBVvL0MKXR_cfwuO/1699272158121-a107a78a-2fff-49fc-8427-dac35abf8939-404494.png)

接收不到绿墙的光照



![1699272005761-3d252441-f472-470a-b601-25ae15e5eb9b.png](./img/aBVvL0MKXR_cfwuO/1699272005761-3d252441-f472-470a-b601-25ae15e5eb9b-831903.png)

图中，渲染出了物体打到地面的一点光照。



## SSR: Screen Space Reflection
其实是 Screen Space Ray Tracing。不像其他方法只考虑反射光，考虑的是任何光线（直接光+间接光同时考虑）



What is SSR? 在屏幕空间做光线追踪。屏幕信息就是从camera看过去的一个壳，在这个壳上做光线追踪，这就是SSR做的第一个事情。

+ Still, one way to introduce Global Lllumination in RTR
+ Performing ray tracing
+ But does not require 3D primitives (triangles, etc.)

Two fundamental tasks of SSR

+ Intersectoin: between any ray and the scene. 光线和这层壳求交。
+ Shading：contribution from intersected pixels to the shading point. 相交点对shading point的贡献。



反射这个东西，从本质上来说就是全局光照。



![1699456207505-50ff1cc1-b70f-4241-b3a0-165068cb5d43.png](./img/aBVvL0MKXR_cfwuO/1699456207505-50ff1cc1-b70f-4241-b3a0-165068cb5d43-149188.png)

![1699456256917-1b396923-e85a-4352-9a86-0e1a36768108.png](./img/aBVvL0MKXR_cfwuO/1699456256917-1b396923-e85a-4352-9a86-0e1a36768108-077995.png)



### 观察
![1699456279682-5e257495-c8aa-4dd7-bf65-85b299a13a04.png](./img/aBVvL0MKXR_cfwuO/1699456279682-5e257495-c8aa-4dd7-bf65-85b299a13a04-506806.png)

假设地面上没有反射，希望把反射加进去。为了把反射加进去，需要知道任何一个点反射的什么东西。

![1699456331579-6e720beb-cc5d-4032-a3ce-a9193490db32.png](./img/aBVvL0MKXR_cfwuO/1699456331579-6e720beb-cc5d-4032-a3ce-a9193490db32-096439.png)

反射出来的（白色区域的）东西，大都是屏幕中已经有的（红色区域的）东西。

### 可以做的事情
![1699456449134-e822f653-3104-4bbc-8075-0c328e195ef2.png](./img/aBVvL0MKXR_cfwuO/1699456449134-e822f653-3104-4bbc-8075-0c328e195ef2-543455.png)

For each fragment

+ Compute reflection ray
+ Trace along ray direction (using depth buffer)
+ Use color of intersection point as reflection color



可以做镜面反射，也可以做glossy材质的反射

![1699456554955-1790ef0b-49d9-4857-88d8-9b53b9c354ad.png](./img/aBVvL0MKXR_cfwuO/1699456554955-1790ef0b-49d9-4857-88d8-9b53b9c354ad-671341.png)

![1699456569123-0b786bd8-d445-461a-9f7e-50801cb41e4c.png](./img/aBVvL0MKXR_cfwuO/1699456569123-0b786bd8-d445-461a-9f7e-50801cb41e4c-515429.png)





![1699543349792-3a8243b5-401e-46ab-9ce7-b893949e24d3.png](./img/aBVvL0MKXR_cfwuO/1699543349792-3a8243b5-401e-46ab-9ce7-b893949e24d3-467875.png)

光滑材质只需一根光线，越不光滑需要的光线越多

![1699543404758-549d547c-89c5-4d09-8c6b-5d731621d38e.png](./img/aBVvL0MKXR_cfwuO/1699543404758-549d547c-89c5-4d09-8c6b-5d731621d38e-081826.png)  

SSR不要求平面，可以做任何光线追踪，地面不平也可以做。



![1699543488803-a794cb78-01c9-4f1e-bb35-19455dc2dc77.png](./img/aBVvL0MKXR_cfwuO/1699543488803-a794cb78-01c9-4f1e-bb35-19455dc2dc77-957576.png)



### Basic SSR Algrithom - Mirror Reflection
![1699543546276-f57ea19f-3b14-4100-94c2-0bf7015e714d.png](./img/aBVvL0MKXR_cfwuO/1699543546276-f57ea19f-3b14-4100-94c2-0bf7015e714d-125475.png)

#### 相交判断
##### 简单相交判断
假设地面是光滑的，那么反射光（3D）是固定的可计算的一条，那么地面上任何一点的反射光会与场景中哪个像素相交？

![1699543704102-03be2c68-69e0-49d8-a45f-6a56cc2afbf3.png](./img/aBVvL0MKXR_cfwuO/1699543704102-03be2c68-69e0-49d8-a45f-6a56cc2afbf3-371911.png) 

利用深度做可见性判断。从相交点向反射方向一步步前进，与场景深度值比较，看是否相交。



![1699543925881-2e07de2e-7110-483f-b7ec-b791fd266d10.png](./img/aBVvL0MKXR_cfwuO/1699543925881-2e07de2e-7110-483f-b7ec-b791fd266d10-629958.png)

步长如何选取？可以一个像素一个像素的前进

##### 加速相交判断 - depth mipmap 
![1699543969832-367ab92f-1635-4f0a-ba0f-5b11d006de1b.png](./img/aBVvL0MKXR_cfwuO/1699543969832-367ab92f-1635-4f0a-ba0f-5b11d006de1b-515139.png)

但更快的是，动态决定步长。利用 depth mipmap 可以一次前进多个步长。

这里的mipmap和平常说的不一样，采用深度最小值（距离相机最近点）而不是均值。和深度学习里的 min pooling 操作一样。



![1699544145089-0e93b976-e4b9-4526-bfd8-f21eee209968.png](./img/aBVvL0MKXR_cfwuO/1699544145089-0e93b976-e4b9-4526-bfd8-f21eee209968-036401.png)

mipmap中每一层的每个纹素都是一个结点，上下层对应节点构成父子关系。如果光线不和父节点相交，也必定不和子结点相交。

类似用 mipmap 构造了 BVH、KD tree、线段树



怎么用这个 depth mipmap 来加速求交？

![1699544535765-743d3b6f-a92b-480b-add0-3d010399b8af.png](./img/aBVvL0MKXR_cfwuO/1699544535765-743d3b6f-a92b-480b-add0-3d010399b8af-164095.png)

![1699545126700-e93bb28f-c075-46df-ba22-354ce0ca9ac0.png](./img/aBVvL0MKXR_cfwuO/1699545126700-e93bb28f-c075-46df-ba22-354ce0ca9ac0-653174.png)![1699545135859-61ff54ca-9469-4bd8-b811-37ff743fab50.png](./img/aBVvL0MKXR_cfwuO/1699545135859-61ff54ca-9469-4bd8-b811-37ff743fab50-227701.png)

![1699545162895-0c20be61-4cbe-4761-852e-c4909c807dbf.png](./img/aBVvL0MKXR_cfwuO/1699545162895-0c20be61-4cbe-4761-852e-c4909c807dbf-250474.png)![1699545176365-daa4e423-166a-4f82-a134-7da257e6e90a.png](./img/aBVvL0MKXR_cfwuO/1699545176365-daa4e423-166a-4f82-a134-7da257e6e90a-982681.png)

![1699545213948-cd5efd06-45f9-43d1-afed-fb9395900dcd.png](./img/aBVvL0MKXR_cfwuO/1699545213948-cd5efd06-45f9-43d1-afed-fb9395900dcd-166987.png)![1699545256747-f6750691-d8c3-4b09-89ce-a34c3856e974.png](./img/aBVvL0MKXR_cfwuO/1699545256747-f6750691-d8c3-4b09-89ce-a34c3856e974-110260.png)

![1699545276935-32540fef-fa15-4e3d-bdba-a4d29fe97f54.png](./img/aBVvL0MKXR_cfwuO/1699545276935-32540fef-fa15-4e3d-bdba-a4d29fe97f54-749622.png)

类似HTTP拥塞窗口，试探步。上图代码不准确。工业界的实现比较混乱

1. 先最精细层（level 1）走1步，之后：
    1. 若没有相交。准备向上层走。
        1. 若有更高层，去更高一层走一步。
        2. 若没有更高层，输出没有相交。
    2. 若有相交。准备向下层**重新**走。
        1. 若有更低层，去更低一层的**合适的（根据相交情况去左或右）子结点**重新走一步。
        2. 若没有更低层，输出该点。

有点像跳表。



存在的问题：

起点必须在 2^k 格子上



##### 存在的问题
1. Hidden Geometry Problem 不知道壳背后的几何，只能反射屏幕中出现的这层壳
2. Edge Cutoff 不知道屏幕外的几何

![1699546332292-7ab6b21c-bf52-4390-bf80-eb72f8c57d5f.png](./img/aBVvL0MKXR_cfwuO/1699546332292-7ab6b21c-bf52-4390-bf80-eb72f8c57d5f-038932.png)

![1699546408416-10f669c4-8d3b-4b7f-85e8-d8e0028d6586.png](./img/aBVvL0MKXR_cfwuO/1699546408416-10f669c4-8d3b-4b7f-85e8-d8e0028d6586-078821.png)



Edge Cutoff 如何解决？根据反射光的距离，做衰减。反射光的距离长了，就认为反射不太到了

![1699546504621-a986bf02-266e-4ffb-8bf2-ae9285eb0aef.png](./img/aBVvL0MKXR_cfwuO/1699546504621-a986bf02-266e-4ffb-8bf2-ae9285eb0aef-110179.png)

#### Shading
光线与场景求交，从传统的三维的与BVH求交，变成了与屏幕的壳求交。其他 path tracing 的任何方法都可以拿来用。

但仍然假设反射物是diffuse的。

![1699546821934-344b6405-3fd4-424e-8a6b-b74675e0e5fc.png](./img/aBVvL0MKXR_cfwuO/1699546821934-344b6405-3fd4-424e-8a6b-b74675e0e5fc-553160.png)



问题1：是否需要引入距离平方衰减？不需要。

问题2：有没有处理好 shading point 与 camera 的可见性问题？处理好了。所考虑的能够对shading point产生贡献的东西，都是有可见性的。

BRDF sampling 不会有可见性和距离平方衰减两个问题，light sampling 一定会存在这一问题，并且都不好做。



其实就是在做 path tracing，所以很多现象是直接可以做得到的。

![1699547305942-5e37a764-4c86-43db-b2b6-0d0ff8244e0b.png](./img/aBVvL0MKXR_cfwuO/1699547305942-5e37a764-4c86-43db-b2b6-0d0ff8244e0b-177173.png)

Contact hardening: 爪子部分的反射更加锐利，远处翅膀的反射更加模糊

Specular elongation: 雨天看红绿灯，会觉得红绿灯被拉长。如何解释？地面是各相同性的。

Per-pixel roughness and normal：任何一个点的粗糙度和法线不同



![1699547872384-96f18ca2-ba45-4361-950c-a93c8c12a76d.png](./img/aBVvL0MKXR_cfwuO/1699547872384-96f18ca2-ba45-4361-950c-a93c8c12a76d-201823.png)

重要性采样，用一种和lobe类似的分布来采样

diffuse的材质，即是最简单的，又是最难的。

![1699548158920-3f978ae8-965d-4c28-9488-de2323b1f6e8.png](./img/aBVvL0MKXR_cfwuO/1699548158920-3f978ae8-965d-4c28-9488-de2323b1f6e8-023331.png)

时间和空间的复用。

空间：每个点trace一条线，但计算shading时不仅考虑自己trace的，还考虑周围像素trace的



一切实时渲染，背后都有离线渲染的内功在



![1699548373614-569a6480-32c1-45c7-9176-70f4047cd173.png](./img/aBVvL0MKXR_cfwuO/1699548373614-569a6480-32c1-45c7-9176-70f4047cd173-590812.png)

预先filter，再query，只要查一次



### Summary
Pros

+ Fast performance for glossy and specular reflections 之前的画面为什么看起来油？glossy的多了些，diffuse的少了些
+ Good quality
+ No spikes and occlusion issues

Cons

+ Not as efficient in the diffuse case*
    - 但事实上，随着RTR的发展，时间和空间要求没那么高了，可以做diffuse
    - 本质都是在解决快速做光线追踪这件事。如果SSR可以在screen space做diffuse材质上的光线追踪，那么用起来也是可以的
+ Missing information outside the screen



# References
+ [Lecture7 Real-time GLobal Illumination (in 3D)_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1YK4y1T7yY/?p=7&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [Lecture8 Real-time GLobal Illumination (screen space)_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1YK4y1T7yY?p=8&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [Lecture9 Real-time GLobal Illumination (screen space cont.)_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1YK4y1T7yY/?p=9&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [【论文复现】Reflective Shadow Maps](https://zhuanlan.zhihu.com/p/357259069)



> 更新: 2024-01-07 10:20:37  
> 原文: <https://www.yuque.com/viruspc/el3mi0/oxeqkqemkd0cffv0>