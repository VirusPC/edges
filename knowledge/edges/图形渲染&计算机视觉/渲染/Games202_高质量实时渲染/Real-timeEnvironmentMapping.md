# Real-time Environment Mapping

- [Summary](#summary)
- [Shading from Environment Lighting](#shading-from-environment-lighting)
  * [Recap: Environment Lighting](#recap-environment-lighting)
  * [The Split Sum Approximation](#the-split-sum-approximation)
    + [Rendering Equation Approximation](#rendering-equation-approximation)
    + [The Split Sum: 1st Stage](#the-split-sum-1st-stage)
    + [The Split Sum: 2nd Stage](#the-split-sum-2nd-stage)
      - [Avoid Sampling](#avoid-sampling)
      - [Recall: Microfacet BRDF](#recall-microfacet-brdf)
      - [Dimensionality Reduction and Precomputing](#dimensionality-reduction-and-precomputing)
    + [The Split Sum Approximation](#the-split-sum-approximation-1)
- [Shadow from Environment Lighting](#shadow-from-environment-lighting)
  * [PRT: Precomputed Radiance Transfer](#prt-precomputed-radiance-transfer)
    + [Background knowledge](#background-knowledge)
      - [Frequency and filtering](#frequency-and-filtering)
        * [Fourier Transform，傅里叶级数展开](#fourier-transform%E5%82%85%E9%87%8C%E5%8F%B6%E7%BA%A7%E6%95%B0%E5%B1%95%E5%BC%80)
        * [Visualizing Image Frequency Content](#visualizing-image-frequency-content)
        * [A general understanding](#a-general-understanding)
      - [Basis functions](#basis-functions)
    + [Real-time environment lighting (& global illumination， no shadow)](#real-time-environment-lighting--global-illumination-no-shadow)
      - [Spherical Harmonics (SH)](#spherical-harmonics-sh)
      - [Prefiltered env. lighting](#prefiltered-env-lighting)
      - [A Brief Summarization](#a-brief-summarization)
    + [Precomputed Radiance Transfer (PRT)](#precomputed-radiance-transfer-prt)
      - [Basic Idea](#basic-idea)
      - [SH for diffuse transport](#sh-for-diffuse-transport)
      - [SH for glossy transport](#sh-for-glossy-transport)
      - [Interflections and Caustics](#interflections-and-caustics)
      - [Summary](#summary-1)
      - [Limitations](#limitations)
      - [Follow up works](#follow-up-works)
    + [More Basics Functions](#more-basics-functions)
      - [Wavelet](#wavelet)
- [Others](#others)
- [References](#references)

---

# Summary
给定一个环境光照，如何计算环境光照下任一点的着色(不考虑阴影，现阶段没有方法可以在环境光照下考虑阴影)。

+ Shading from environment lighting （环境光照着色，不考虑shadow）
    - <font style="color:rgb(18, 18, 18);">蒙特卡罗方法采样。但太慢。</font>
    - The Split Sum Approximation
        * 问题：不考虑遮挡的情况下，如何根据环境光照计算 shading？蒙特卡洛方法采样的速度太慢，怎么加速？
            + ![1697867989132-5fa05048-9cb4-4434-a8f1-0ea17c594a55.png](./img/v0j3wh2ck-YyEO68/1697867989132-5fa05048-9cb4-4434-a8f1-0ea17c594a55-574754.png)
        * 方法：The split sum approximation。快速计算环境光下的shading（不考虑阴影）
            + 为了避免采样，需要先将渲染方程拆成两部分，再分开解决
                - ![1697868241870-d9a53c9e-63ae-43f9-aae4-0b90d35d5775.png](./img/v0j3wh2ck-YyEO68/1697868241870-d9a53c9e-63ae-43f9-aae4-0b90d35d5775-704623.png)
                - 第一部分：环境光预处理，对环境光做滤波，相当于对 brdf 区域上的光做 normalize（**filtering**）。**Prefiltering** of the environment lighting
                    * ![1697868438632-2dbc830f-3149-4cca-ab91-f033320bb53a.png](./img/v0j3wh2ck-YyEO68/1697868438632-2dbc830f-3149-4cca-ab91-f033320bb53a-787132.png)
                - 第二部分：预计算所有可能的入射角出射角可能性，避免采样。存在维度过高的问题，继续通过一些方法降维，最终存成二维表（基于 microfacet BRDF）
                    * ![1697868425976-07918588-2547-4ecf-811f-3fb792f17343.png](./img/v0j3wh2ck-YyEO68/1697868425976-07918588-2547-4ecf-811f-3fb792f17343-049805.png)
        * 优点：
            + Completely avoided sampling，Very fast and almost identical results
            + 不管在 diffuse 还是 glossy 材质上，都取得与 ray tracing 几乎一致的渲染结果
        * 缺点：
            + 
+ Shadow from Environment Lighting（环境光照阴影）
    - PRT (考虑shadow)
        * 解决问题：真的给你环境光了，如何把shading和shadow都算对？
        * 又可以做 environment mapping，又可以做global illumination（全局光照）。
        * 核心思想：Precompute lighting and light transport for each individual shading point (这里的shading point指的是顶点，后续再用per vertex/per pixel等方法来插值)。**假设场景中的只有光照会发生变化**，将绘制方程的被积函数拆分成光照（lighting）和光线传输（light transport）这两部分，并分别预计算两者的纹理图像，再把图像从空间域转换到频域，最终把着色时绘制方程中的定积分计算转换成向量的点积，或者转换成向量与矩阵的乘法。
        * diffuse材质：
            + 最后每个shading point只需要计算简单的点乘。
            + 原渲染方程：![1697557485781-8ddc2998-0f3d-400e-91ad-634db3c5e9f8.png](./img/v0j3wh2ck-YyEO68/1697557485781-8ddc2998-0f3d-400e-91ad-634db3c5e9f8-187805.png)
            + 球面谐波函数对光照进行处理，得到可预计算的渲染方程：
                - ![1697866781645-a78345c6-849d-4060-8889-eb9ad968a622.png](./img/v0j3wh2ck-YyEO68/1697866781645-a78345c6-849d-4060-8889-eb9ad968a622-731557.png)
                - 预计算 lighting 和 light transport
                    * lighting：投影到 SH 基函数，从二维变成了一维，所有shading point共用。 diffuse选取3阶足够，glossy 要16阶。
                    * light transport：投影到SH基函数，从二维变成了一维（diffuse材质下为常数），不同shading point分开计算。
                        + f_r：常数（diffuse材质）
                        + Visibility：可通过R树等预计算（静态场景）
                        + max(0, n*i)：可预计算（静态场景几何定点的法线固定）
                - light transport 部分不可变， lighting可旋转。SH 对旋转操作的支持很友好。
                - 预计算精度取决于选取的 SH 的阶数。SH 阶数和频率有关，前n阶相当于一个低通滤波器。
            + 预计算要求：
                - diffuse材质：brdf为常数
                - 静态场景：允许预计算 Visibility 项
                - 只考虑直接光照，不考虑间接光照。
            + 环境光或场景整体可旋转，SH可以很好的支持旋转后的参数重计算。
            + 为什么要把lighting部分拆开分开预计算？拆后light部分变成。
        * glossy材质
            + 最后每个shading point只需要计算简单的向量乘。
            + 由于BRDF不为常数，light transport部分的存储/时间复杂度从常数变成了平方。
            + 显然，glossy非常高频，接近镜面反射时，不能用PRT。SH 不好描述高频。
            + 当然，非常高频时，知道光线如何传播，直接做 ray tracing 就行，都不用 path tracing
            + 可以把多次光线弹射，看作light transport的一部分
            + diffuse材质，需要投影到SH的只有light部分，light transport部分不需要。用一维向量存储参数。渲染时做向量乘向量运算。
            + glossy材质，light 和 light transport 都要投影到SH。用二维矩阵存储参数。渲染时做向量乘矩阵运算。
        * interreflections and caustics
            + 可以支持全局光照。可以对任意复杂的transport path利用PRT的思想预计算。
            + 预计算的时间可以任意长。
            + Light transport的预计算可以看作一个普通渲染过程。![1697884661343-4d66a58f-4aae-4a3a-bcd8-187f8ccb8032.png](./img/v0j3wh2ck-YyEO68/1697884661343-4d66a58f-4aae-4a3a-bcd8-187f8ccb8032-513891.png)
        * Limitation
            + 适合表示低频
            + 动态光照，静态场景
            + 巨大的预计算数据
        * wavelet
            + 采用哈尔小波做基函数
            + 优点：相比SH，能很好的保留高频信息。
            + 缺点：不支持光的快速旋转。



IBL：环境光照

SH：环境阴影

# Shading from Environment Lighting
环境光照下的 shading（不考虑 shadow）

Split Sum 基于 microfacet BRDF 

## Recap: Environment Lighting
+ An image representing distant lighting from all directions
+ Spherical map vs. cube map
+ 隐含条件：光照来自无限远处

![1688731829546-9526640e-d47e-4115-ab48-26c5c93cd127.png](./img/v0j3wh2ck-YyEO68/1688731829546-9526640e-d47e-4115-ab48-26c5c93cd127-371053.png)





+ environment light 有时也被称为 Image-based lighting （IBL）



+ How to use it to shade a point (without shadows)?
    - 不考虑遮挡的情况下，如何根据环境光照计算 shading？（games101中path tracing 最后考虑了遮挡）
    - Solving the rendering equation
        * ![1688732076675-73ba1023-ccb5-4567-a9fb-5ad9ed6ebda5.png](./img/v0j3wh2ck-YyEO68/1688732076675-73ba1023-ccb5-4567-a9fb-5ad9ed6ebda5-503492.png)
        * 不考虑 visibility



+ General Solution (of the rendering equation) - Monte Carlo integration
    - Numerical
    - Large amount of samples required
    - Problem：**Can be slow**
        * In general, sampling is not preferred in shaders*. （以前认为最好不采样。但由于 temperal denoising 方法的提出，现在不一定）
        * Games101中path tracing，通过每次弹射只追踪一条光线来解决光线数量的指数爆炸问题，通过每个像素追踪多条光路来解决只追踪一条光线带来的噪声，通过俄罗斯轮盘赌来尽早结束递归，通过将半球分为光源部分和非光源部分，光源部分直接从光源采样来解决直接直接光照的采样效率低的问题。
        * 环境光照不可以用从光源采样的方法来加速直接光照的计算。
        * **Can we avoid sampling**?

<font style="color:#DF2A3F;">Split sum只考虑环境光照的直接光照</font>



## The Split Sum Approximation
Why? 采样太慢，需要考虑如何避免采样。

### Rendering Equation Approximation
为了避免采样，需要先将渲染方程拆成两部分，再分开解决

第一部分：环境光预处理，对环境光做滤波。**Prefiltering** of the environment lighting

第二部分：预计算所有可能的入射角出射角可能性。

然后二者相乘。

+ Obervation
    - If the BRDF is glossy - small support!
    - If the BRDF is diffuse - smooth!
    - Does the observation remind you of something?
    - ![1688740837467-febda9ce-5088-4d92-a101-024720cd1763.png](./img/v0j3wh2ck-YyEO68/1688740837467-febda9ce-5088-4d92-a101-024720cd1763-510066.png)
+ Recall: the approximation
    - ![1688738196534-16f74838-da58-42f9-99f7-f31a5513dbe7.png](./img/v0j3wh2ck-YyEO68/1688738196534-16f74838-da58-42f9-99f7-f31a5513dbe7-501804.png)
+ BRDF satisfies the accuracy condition in any case
    - We can safely take the lighting term out!
    - ![1688738294935-ce09b21c-9f48-49cb-b6dd-e28209549a1b.png](./img/v0j3wh2ck-YyEO68/1688738294935-ce09b21c-9f48-49cb-b6dd-e28209549a1b-156294.png)
    - 为什么把 Light 拆出来？不拆的话，brdf 和 light 混在一起比较难考虑。拆开后，左侧就是对 brdf 区域上的光做 normalize（**filtering**）。
    - 黄框里的含义：把某个区域
    - $ \Omega_{fr}
 $是指球面上的某个立体角范围。对于光滑平面范围就是一点；对于glossy材质范围是一小块范围；对于diffuse材质是整个半球。
    - ![1688740857506-14b2cc30-e2e3-4df4-b384-d06b91c47c52.png](./img/v0j3wh2ck-YyEO68/1688740857506-14b2cc30-e2e3-4df4-b384-d06b91c47c52-299225.png)
+ Note: Different usage in shadows (taking vis. out)
    - ![1688738375446-26a85282-96d5-45bb-bd84-48b7a84bbaa8.png](./img/v0j3wh2ck-YyEO68/1688738375446-26a85282-96d5-45bb-bd84-48b7a84bbaa8-050982.png)



接下来，对拆分后的两部分，考虑如何在不采样的前提下解决它们。

### The Split Sum: 1st Stage
![1688738294935-ce09b21c-9f48-49cb-b6dd-e28209549a1b.png](./img/v0j3wh2ck-YyEO68/1688738294935-ce09b21c-9f48-49cb-b6dd-e28209549a1b-156294.png)

在不采样（一般认为最好不要采样）的前提下解决渲染方程的前半部分

+ **Prefiltering** of the environment lighting
    - Pre-generating a set of differentlv filtered environment lighting
    - Filter size in-between can be approximated via trilinear interp.
    - 在渲染前提前生成好（黄色部分积分）‘
    - ![1688738716158-5514001b-ac3e-4f8e-893f-91ced8a40367.png](./img/v0j3wh2ck-YyEO68/1688738716158-5514001b-ac3e-4f8e-893f-91ced8a40367-407650.png)
+ Then query the pre-filtered environment lighting at the <font style="color:#DF2A3F;">r (mirror refected) direction</font>! 沿着反射光的镜像方向（$ \Omega_{fr}
 $的中心），在 pre-filtered 的环境贴图上找到对应的点，就是这点收到的所有环境光（公式黄色部分）

![1688740444348-dacbf3b7-e001-47f3-97cf-e92eec0bfec7.png](./img/v0j3wh2ck-YyEO68/1688740444348-dacbf3b7-e001-47f3-97cf-e92eec0bfec7-297082.png)



如此一来，就在不采样的前提下解决了渲染方程中的前半部分。

### The Split Sum: 2nd Stage
#### Avoid Sampling
第一部分解决。如何在不采样的前提下，解决第二部分？

The second term is still an integral. How to avoid sampling this term?

![1688740974763-d3406e04-0580-4176-be52-2bfc49aa091d.png](./img/v0j3wh2ck-YyEO68/1688740974763-d3406e04-0580-4176-be52-2bfc49aa091d-982819.png)

**Idea**: 

+ recompute its value for all possible combinations of variables roughness, color (Fresnel term), etc. **通过预计算每种可能的组合，消除采样。（预计算的思想在图形学中非常重要和常见）**
+ But we'll need a huge table with extremely high dimemsions **但是，这样做维度过高，预计算需要的存储空间过大。需要降维。**

#### Recall: Microfacet BRDF
![1688746569110-7e45fc5d-9ecb-43c9-8dd9-1756c6010041.png](./img/v0j3wh2ck-YyEO68/1688746569110-7e45fc5d-9ecb-43c9-8dd9-1756c6010041-026216.png)

菲涅耳项的近似：Schilick's approximation

+ $ R_0
 $：基础反射率
+ $ \theta $：入射角，或其他近似

NDF的近似：Beckmann distribution （定义在斜率空间的高斯分布，见后续PBR章节）

+ $ \alpha
 $: roughness, 定义了反射的角度范围（diffuse材质和glossy材质的反射范围不一样）
+ $ \theta
 $：半程向量角度，或其他近似

![1688746939129-8782ff13-520d-4d7e-abad-80676de7fef6.png](./img/v0j3wh2ck-YyEO68/1688746939129-8782ff13-520d-4d7e-abad-80676de7fef6-201750.png)



#### Dimensionality Reduction and Precomputing
**维度过高，预计算需要的存储空间过大怎么办？降维。继续用 Schlick's approximation 来拆, 以实现降维。**

Idea & Observation

+ Try to split the variables again!
+ The Schlick approximated Fresnel term is much simpler: 
    - Just the "base color" $ R_0 $ and the half angle $ \theta $
+ Taking the Schlick's approximation into the 2nd term
    - The "base color" is extracted! 把原始积分对基础反射率的依赖拆出来了
    - ![1688747362116-bf915eb1-e494-4b61-9944-1f3073d60373.png](./img/v0j3wh2ck-YyEO68/1688747362116-bf915eb1-e494-4b61-9944-1f3073d60373-074607.png)
    - 注意，这里$ f_r $本身就包含F，和分母可以消掉
    - Both Integrals can be precomputed
    - Each integral produces one value for each (roughness, incident angle) pair
        * Therefore, each integral results (_F_) in a 2D table (texture)
        * ![1688748002833-bf21087d-470a-4a06-92be-048161f5604c.png](./img/v0j3wh2ck-YyEO68/1688748002833-bf21087d-470a-4a06-92be-048161f5604c-441828.png)

**通过预计算（加速）低维（降低存储空间）表格，消除了采样。**

****

### The Split Sum Approximation
+ Finally, completely avoided sampling
+ Very fast and almost identical results

不管在 diffuse 还是 glossy 材质上，都取得与 ray tracing 几乎一致的渲染结果

![1688748610733-1f6ee097-cd42-4a5e-88a0-867843f81865.png](./img/v0j3wh2ck-YyEO68/1688748610733-1f6ee097-cd42-4a5e-88a0-867843f81865-802327.png)



+ In industry
    - Integral => Sum
    - 工业界常用 Sum（求和）来代替 Integral（积分），因此该方法被称为 “Split Sum” 而不是 “Split Integral”

![1688748729986-23216c94-c2dd-4d2d-9615-8b7e97e4d72e.png](./img/v0j3wh2ck-YyEO68/1688748729986-23216c94-c2dd-4d2d-9615-8b7e97e4d72e-813646.png)



The Split Sum 是虚幻引擎 PBR 做的这么牛的基础

+ 没有采样 => 没有 noise => high quality

又快又好，state  of the art。(比LTC更好，PBR章节中会讲LTC)



# 
# Shadow from Environment Lighting
+ 实时渲染环境光照下无法考虑阴影。In general, very difficult for real-time rendering
+ 如何理解环境光照？DIfferent perspectives of view 
    - As a many-light problem: Cost of SM is linearly to #light 视为多光源问题，每个光源生成一个shadow map代价太高
    - As a sampling problem: 作为采样问题，难点在于获取每个shading point在所有方向的Visibility。
        * Visibility term V can be arbitrarily complex 
        * And V cannot be easily separatd from the environment
+ Industrial solution
    - 找环境光照中最具代表性的光源（如太阳）
    - Generatte one (or a little bit more) shadows from the brightest  light sources
+ Related research
    - Imperfect shadow maps
    - Light cuts
    - RTRT (**might be the ultimate solution**) path tracing + denoising
    - Precomputed radiance transfer 可以得到非常准确的，从环境光中的阴影，但是代价是什么？

## PRT: Precomputed Radiance Transfer
又可以做 environment mapping，又可以做global illumination（全局光照）。



真的给你环境光了，如何把shading和shadow都算对？

### Background knowledge
#### Frequency and filtering
##### Fourier Transform，傅里叶级数展开
![1697456077249-f9119adb-adf4-44e9-a1be-0560e2d543d8.png](./img/v0j3wh2ck-YyEO68/1697456077249-f9119adb-adf4-44e9-a1be-0560e2d543d8-729646.png)

任何函数都能写成sin和cos的组合。

PS：这个函数刚好是偶函数，只有cos没有sin



##### Visualizing Image Frequency Content
![1697456220931-04d9c517-684a-4fa4-81e9-16ec076aa6aa.png](./img/v0j3wh2ck-YyEO68/1697456220931-04d9c517-684a-4fa4-81e9-16ec076aa6aa-126396.png)

变化非常剧烈还是平缓。

频谱：中心低频，外面高频。自然图片大都是低频内容。

![1697456334927-a94ff70e-0584-42da-b45f-b16db46f5ffe.png](./img/v0j3wh2ck-YyEO68/1697456334927-a94ff70e-0584-42da-b45f-b16db46f5ffe-562462.png)

![1697456349612-5c34a6df-8eaa-4c41-9694-9b9bebd5b3f4.png](./img/v0j3wh2ck-YyEO68/1697456349612-5c34a6df-8eaa-4c41-9694-9b9bebd5b3f4-341109.png)

时域卷积 = 频域乘积

##### A general understanding
![1697456582849-588a5dd7-b596-48d9-9fc1-53a109721606.png](./img/v0j3wh2ck-YyEO68/1697456582849-588a5dd7-b596-48d9-9fc1-53a109721606-543094.png)

两个函数乘起来，再做积分，可以被认为是滤波操作。

两个信号只要有一个是低频的，那得到的结果就是低频的。The frequency of the integral is the lowest of any individuals。

什么是低频？smooth

为什么得到的不是一个值？f(x) * g 再对 x做积分。

#### Basis functions
基函数

傅立叶系列可以是一组基函数。

多项式系列也可以是基函数（泰勒之外）。

![1697456793117-0a95d19e-fc26-46e9-8a5e-90090c9388dc.png](./img/v0j3wh2ck-YyEO68/1697456793117-0a95d19e-fc26-46e9-8a5e-90090c9388dc-865270.png)



### Real-time environment lighting (& global illumination， no shadow)
先考虑，给你一个diffuse的材质，给你环境光，如何把shading算出来，先不考虑shadow。

#### Spherical Harmonics (SH)
![1697457101684-a9aa983b-aff1-4997-b4f4-df73700efa3d.png](./img/v0j3wh2ck-YyEO68/1697457101684-a9aa983b-aff1-4997-b4f4-df73700efa3d-550720.png)

SH是一系列的基函数，每一个基函数都是在球面上的对方向的一个二维函数。（三维空间，两个数可以表示一个反向）（蓝色代表正值，黄色代表正值）

单位球面上的一个点就是一个方向。

类似一维情况下的傅立叶级数。

第l阶的SH，有2l+1个不同的基函数，编号从-l到l

前l阶有2^l个基函数



**SH是一系列的函数，每一阶有一定频率，阶越高频率越高，对应的基函数数量也多。（显然阶数越高，越不规则，函数变化越大）**



为什么用SH，不用2D的傅立叶变换？傅立叶相当于地球仪展开成2维的图。

因为渲染中用到很多球面的函数，如果展开成2维傅立叶再转回球面，球面可能会出现一条缝。



SH基函数如何表达？每个基函数都是用[勒让德多项式](http://www.baidu.com/link?url=rAcRnqHS9IhgRZ0PoStwjmWisx2-oP9GFscsxLiyAjBTRiFE4j87LWLV2XfL4ZIA94QqqNa2_8rBTaaz_R5z8Z2vfbjynRyNzpAbQna-NVmEKTU4QhAWJhPHDIKHELFpQYShUQPevXCENHjNMwADk_)（Legendre）来表达的。公式很复杂，没必要理解。



c_i是什么？有个不错的性质，可以直接计算c_i：

![1697466324782-85c049e6-f5c2-4fb7-b7ea-0c9be98a5037.png](./img/v0j3wh2ck-YyEO68/1697466324782-85c049e6-f5c2-4fb7-b7ea-0c9be98a5037-595539.png)

这个计算c_i的过程，在数学上叫投影。（f(w)在球面谐波函数基函数上的投影）

不想用那么多基函数来描述它，希望只选取前m阶的全部基函数。m怎么取？最低频最重要，参考滤波。



f(w)最常见的应用：环境光照，环境光照就是一个二维函数。通过投影把环境光照投影到基函数上。



**相比傅立叶还有一个好处，从低到高可以把频率给描述出来，从最低频到最高频。**

****

环境光一般都是低频，SH很适合描述低频光照。



基函数：类比普通三维空间中如何表达一个向量？向x/y/z轴投影，用3个投影值表示向量。球面谐波函数这里原理相通。

投影：普通三维空间，投影是做点乘，这里为什么做积分？product integral 的本质就是点乘（离散化后就是两两相乘加一块）。把一个基函数投影到另一个基函数得到的结果是0，两个基函数正交。

#### Prefiltered env. lighting
先利用基函数解决一个最简单的问题：环境光照下如何做diffuse物体的shading问题（不考虑shadow）。

（原论文只做了diffuse，也可以做specular）



diffuse物体的BRDF，可以用3阶球谐函数来表示（相当于低频滤波器，失去了高频信息） =》 环境光照也可以用3阶来表示

![1697551539110-72264ac4-3ef3-4ea9-b062-2f4d77d8d5a0.png](./img/v0j3wh2ck-YyEO68/1697551539110-72264ac4-3ef3-4ea9-b062-2f4d77d8d5a0-975434.png)

![1697551551824-6762cbbe-2889-49a3-aa99-6f4241053da8.png](./img/v0j3wh2ck-YyEO68/1697551551824-6762cbbe-2889-49a3-aa99-6f4241053da8-290711.png)

![1697551589694-76e02260-b6f1-4132-9a86-097203a9ee4d.png](./img/v0j3wh2ck-YyEO68/1697551589694-76e02260-b6f1-4132-9a86-097203a9ee4d-373289.png)



如果SH只用前三阶，那么他就可以写成平方的形式的一个，和法线相关的算式。

算shading的代码只有两行。

![1697551691456-bae90e00-fb7d-4a69-85f2-4aa0341cd2aa.png](./img/v0j3wh2ck-YyEO68/1697551691456-bae90e00-fb7d-4a69-85f2-4aa0341cd2aa-119118.png)



#### A Brief Summarization
PRT不要求diffuse，可以产生shadow。但也是有代价的。

![1697553184218-c8a63d35-b759-47a6-b69b-02f054427553.png](./img/v0j3wh2ck-YyEO68/1697553184218-c8a63d35-b759-47a6-b69b-02f054427553-391230.png)

### Precomputed Radiance Transfer (PRT)
#### Basic Idea
这块写成max(0,costheta)，是为了把积分弄到整个球面上，好像是因为球谐函数在半球上不是正交的



lighting,visibility,BRDF都可以描述成球谐函数

如何求积分？最简单的方法是把每个相同位置的点乘起来。

下图中是只看一个shading point的可视化。

![1697553230375-749bd642-d90c-495f-aa29-7c260bf61320.png](./img/v0j3wh2ck-YyEO68/1697553230375-749bd642-d90c-495f-aa29-7c260bf61320-229057.png)



挨个乘太慢。PRT会利用基函数的性质，预计算一些东西，来加速。

![1697553810369-eedcc481-551b-4da6-b899-6960e0cd9df5.png](./img/v0j3wh2ck-YyEO68/1697553810369-eedcc481-551b-4da6-b899-6960e0cd9df5-212400.png)

![1697553893528-b78257ce-1dc7-4e8f-b170-b2e297c9578d.png](./img/v0j3wh2ck-YyEO68/1697553893528-b78257ce-1dc7-4e8f-b170-b2e297c9578d-192258.png)

认为渲染的时候，整个场景只有光照发生变化，其他的不发生变化。

light transport 可以认为是shading point自己的一个性质。这就是烘焙。

light transport 是 i 的函数，可以整体写作一个球谐函数。



DIffuse场景和Glossy场景分开看。

#### SH for diffuse transport
![1697554710977-94ee0f14-406b-4e94-8070-647fad9830c3.png](./img/v0j3wh2ck-YyEO68/1697554710977-94ee0f14-406b-4e94-8070-647fad9830c3-568864.png)

PRT 场景下可以交换积分与求和

与计算 light transport 到基函数B_i(i)的投影



diffuse材质，需要投影到SH的只有light部分，light transport部分不需要。用一维向量存储参数。渲染时做向量乘向量运算。

glossy材质，light 和 light transport 都要投影到SH。用二维矩阵存储参数。渲染时做向量乘矩阵运算。



$ \rho $: diffuse 材质brdf为常数

B_i(i)：固定的二维基函数。（i是一个二维方向向量）

V(i)：从shading point向四周发射光线，很容易利用R树等计算遮挡关系。

max(0, n*i)：shading point的法线n固定，这部分更容易预计算。

$ l_i $: env. light

$ T_i $: light transport. 



代价是什么？Visibility定下来，**意味着场景是不能动的。**

旋转光照的问题可以根据球谐函数的性质来解决（球谐函数支持旋转）。

 ![1697554881268-041aecc9-9dc0-4a93-af88-e364b1262c15.png](./img/v0j3wh2ck-YyEO68/1697554881268-041aecc9-9dc0-4a93-af88-e364b1262c15-170864.png)

![1697555212341-78be6d69-2f53-470e-ab9e-2a7a18e33e61.png](./img/v0j3wh2ck-YyEO68/1697555212341-78be6d69-2f53-470e-ab9e-2a7a18e33e61-267629.png)

![1697555318122-6dca4d30-5d6e-42d5-bef5-e6e87ee02326.png](./img/v0j3wh2ck-YyEO68/1697555318122-6dca4d30-5d6e-42d5-bef5-e6e87ee02326-694471.png)

![1697555342270-2ba767f9-5678-47f5-9964-6d9b8565403a.png](./img/v0j3wh2ck-YyEO68/1697555342270-2ba767f9-5678-47f5-9964-6d9b8565403a-534944.png)

![1697555549445-17827d9d-e3b0-40a4-a464-0f9057de91f7.png](./img/v0j3wh2ck-YyEO68/1697555549445-17827d9d-e3b0-40a4-a464-0f9057de91f7-263350.png)

![1697556311854-47ed8ebb-40ee-41e0-828e-fe05d22e2ffd.png](./img/v0j3wh2ck-YyEO68/1697556311854-47ed8ebb-40ee-41e0-828e-fe05d22e2ffd-233067.png)

Inter：考虑light的多次bounce



自此，解决了两个问题：

1. Visibility 考虑进来了
2. 不止支持diffuse，还支持glossy

但还是只考虑一次bounce，只考虑EM不考虑GI。



Real Time Ray Tracing 普及之后，PRT应该不会被淘汰，应该会让PRT有更多表现。





#### SH for glossy transport
利用球谐函数的另一种拆分方式：（不假设brdf是常数，把 light transport 也投影到 SH 上）

![1697879667817-a31d172c-f1c9-4a9d-a39a-2c761c32c612.png](./img/v0j3wh2ck-YyEO68/1697879667817-a31d172c-f1c9-4a9d-a39a-2c761c32c612-913779.png)

为什么时间复杂度是O(n)不是O(n^2)？只有两个基函数（p===q）相同时，左侧才为1。看作一个二维矩阵的话，只有对角线有值。



![1697879905476-6d79e34a-7365-47a5-9f8f-e39e9264045d.png](./img/v0j3wh2ck-YyEO68/1697879905476-6d79e34a-7365-47a5-9f8f-e39e9264045d-948351.png)

glossy情况下存在的问题：brdf从常数变成四维函数，light transport 从T变成T(o)，存储起来问题很大。

T(o)继续投影

![1697882723549-9f7048a2-81d2-48e0-b0d7-5c708fb5690a.png](./img/v0j3wh2ck-YyEO68/1697882723549-9f7048a2-81d2-48e0-b0d7-5c708fb5690a-086432.png)

一般用几阶SH? 

![1697882935145-7327ea88-4360-458b-aad2-ea1c4a9f0581.png](./img/v0j3wh2ck-YyEO68/1697882935145-7327ea88-4360-458b-aad2-ea1c4a9f0581-158242.png)

![1697883001608-1a03aad6-534f-4a7a-ad87-11af8692b5fa.png](./img/v0j3wh2ck-YyEO68/1697883001608-1a03aad6-534f-4a7a-ad87-11af8692b5fa-669193.png)

显然，glossy非常高频，接近镜面反射时，不能用PRT

#### Interflections and Caustics
为什么可以把多次光线弹射，看作light transport的一部分？



![1697884357997-00d7626c-a6ed-44d6-8507-df13af652fef.png](./img/v0j3wh2ck-YyEO68/1697884357997-00d7626c-a6ed-44d6-8507-df13af652fef-852855.png)



实时光线追踪中一般把material分三种：

1. diffuse
2. specular
3. glossy



途中展示了四种典型的 Transport Path：

1. LE：Light => Eye，光源直接到眼睛
2. LGE：Light => glossy => Eye，1次弹射，光源通过glossy材质到眼睛。壶身出现了壶嘴的样子。
3. L(D|G)*E：无限次弹射
4. LS*(D|G)E：内壁是specular的。光=>光滑内壁=>diffuse桌面=>眼睛。国内一般称为焦散。



不管什么路径，L和E中间的所有东西都是light transport。可以把任意复杂的transport path通过任意方式任意时间去预计算

![1697884448220-6e43e8d7-79db-4adc-b91e-91701613ce5b.png](./img/v0j3wh2ck-YyEO68/1697884448220-6e43e8d7-79db-4adc-b91e-91701613ce5b-535227.png)

light transport 本身也可以视作一个新的rendering equation。B_i 代替 L_i。Light transport的预计算就是一个渲染过程。



![1697884740716-b04aab99-2e4e-4372-9181-fe879bc482a6.png](./img/v0j3wh2ck-YyEO68/1697884740716-b04aab99-2e4e-4372-9181-fe879bc482a6-896523.png)

Spatially Varing：相同材质在物体不同地方有着不同的BRDF（比如生锈的物体），BRDF从普通的4维变成了6维

####   Summary
![1697884912001-6996c4fa-ba71-423b-9944-48793b358b89.png](./img/v0j3wh2ck-YyEO68/1697884912001-6996c4fa-ba71-423b-9944-48793b358b89-291487.png)

#### Limitations
![1697884927924-d9916fc6-e5d5-4b92-8f48-980fb28747bb.png](./img/v0j3wh2ck-YyEO68/1697884927924-d9916fc6-e5d5-4b92-8f48-980fb28747bb-383207.png)

#### Follow up works
![1697885368213-889b7d2d-66df-4f05-89bd-9bf7390c73c6.png](./img/v0j3wh2ck-YyEO68/1697885368213-889b7d2d-66df-4f05-89bd-9bf7390c73c6-452442.png)

### More Basics Functions
+ Spherical Harmoniscs (SH)
+ Wavelet
+ ZOnal Harmonics
+ Spherical Gaussian (SG)
+ Piecewise Constant

#### Wavelet
![1697886119408-b425f33c-030c-4840-8570-063b1ba7f7f0.png](./img/v0j3wh2ck-YyEO68/1697886119408-b425f33c-030c-4840-8570-063b1ba7f7f0-590966.png)

SH是定义在球上的，wavelet是定义在图像块上的。

不同的小波，定义域还不同（黑白的地方才是定义域）

小波有很多种，这里讲哈尔小波。

要关心两个事：

1. 给人任意一个函数，可以投影到基函数
    1. SH的压缩方式：取前n阶基函数，做投影
    2. wavelet的压缩方式：投影到所有基函数，很多基函数的系数都接近0，取系数最大的n个

相比wavelet最大的好处：全频率的表示，可以表达低频，也可以表达高频。

![1697893163211-84414a8c-6c47-41d6-baf7-854f117abfd2.png](./img/v0j3wh2ck-YyEO68/1697893163211-84414a8c-6c47-41d6-baf7-854f117abfd2-711257.png)

小波是定义在平面上的，用来描述一个2D的球面上的函数的时候不会出现缝吗？

不用 spherical map 表示环境光了，用 cube map 表示，每个面单独做小波变换。

![1697893163211-84414a8c-6c47-41d6-baf7-854f117abfd2.png](./img/v0j3wh2ck-YyEO68/1697893163211-84414a8c-6c47-41d6-baf7-854f117abfd2-711257.png)![1697893302002-b0f9673a-915a-48bf-97b8-3c84b7d79cbe.png](./img/v0j3wh2ck-YyEO68/1697893302002-b0f9673a-915a-48bf-97b8-3c84b7d79cbe-148085.png)![1697893338508-aff45301-7812-4271-bfc3-d1576ee2ccf8.png](./img/v0j3wh2ck-YyEO68/1697893338508-aff45301-7812-4271-bfc3-d1576ee2ccf8-315709.png)![1697893377018-8591c87a-c844-4b8d-a26d-cbbfa67c7318.png](./img/v0j3wh2ck-YyEO68/1697893377018-8591c87a-c844-4b8d-a26d-cbbfa67c7318-462501.png)![1697893419656-6986c458-571b-4337-9aa5-1dc251e4ca1e.png](./img/v0j3wh2ck-YyEO68/1697893419656-6986c458-571b-4337-9aa5-1dc251e4ca1e-134069.png)

不断把低频信息聚集到左上角去。

jpeg就是用类似小波变换的离散余弦变换来做压缩。

![1697893585012-8cc4b365-0aba-40cd-bdb9-e21dd6dcd569.png](./img/v0j3wh2ck-YyEO68/1697893585012-8cc4b365-0aba-40cd-bdb9-e21dd6dcd569-897716.png)

从效果可以看出，小波可以渲染出非常高频的阴影，说明把高频的光保留下来了。

小波严重的问题：不支持快速旋转。

# Others
实时渲染中很少用深度学习，因为跑一遍神经网络太慢了

# References
+ [Lecture4 Real-time Shadows 2_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1YK4y1T7yY?p=4&vd_source=a637826c55b409b420b4b6584a6e8379)



> 更新: 2024-01-14 08:53:19  
> 原文: <https://www.yuque.com/viruspc/el3mi0/rfhnw8vw9s2b7cr2>