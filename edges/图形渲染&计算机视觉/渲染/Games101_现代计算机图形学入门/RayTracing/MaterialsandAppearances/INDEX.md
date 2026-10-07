# Materials and Appearances

- [Summary](#summary)
- [What is Materials in Computer Graphics](#what-is-materials-in-computer-graphics)
  * [Diffuse/Lambertian Material (BRDF)](#diffuselambertian-material-brdf)
  * [Glossy Material (BRDF)](#glossy-material-brdf)
  * [Ideal Reflective/Refractive Material (BRDF)](#ideal-reflectiverefractive-material-brdf)
    + [Perfect Specular Reflection](#perfect-specular-reflection)
    + [Specular Refraction](#specular-refraction)
      - [Snell's Law](#snells-law)
      - [Total Internal Reflection](#total-internal-reflection)
      - [Snell's window/Circle](#snells-windowcircle)
    + [Fresnel Reflection / Term](#fresnel-reflection--term)
      - [Formulae](#formulae)
  * [Microfacet Material](#microfacet-material)
    + [Microfacet Model](#microfacet-model)
    + [Microfacet BRDF](#microfacet-brdf)
    + [Examples](#examples)
    + [More](#more)
  * [Isotropic/Anisotropic Materials (BRDFs)](#isotropicanisotropic-materials-brdfs)
    + [Anisotropic BRDFs](#anisotropic-brdfs)
- [Properties of BRDF](#properties-of-brdf)
- [Measuring BRDFs](#measuring-brdfs)
  * [Image-based BRDF Measurement (gonioreflectometer)](#image-based-brdf-measurement-gonioreflectometer)
  * [Challenges in Measuring BRDFs](#challenges-in-measuring-brdfs)
  * [Representing Measured BRDFs](#representing-measured-brdfs)
    + [Tabluar Representation](#tabluar-representation)
- [PBR材质总结](#pbr%E6%9D%90%E8%B4%A8%E6%80%BB%E7%BB%93)
- [References](#references)

---

# Summary

* Material == BRDF。描述材质就是描述光线如何和材质作用。
* 不同材质具有不同BRDF
  * DIffuse/Lambbertian Material![1683386826735-68c4d1bb-71d0-4344-b58d-0e9baef8da93.png](./img/BKU1UGeuTwkD4f-o/1683386826735-68c4d1bb-71d0-4344-b58d-0e9baef8da93-950039.png)
  * Gloasy Material
  * Ideal Reflective/Refractive Material（原始的whitted-style ray tracing 没有考虑折射）
  * Microfacet Material![1683386873674-6ab43afb-0115-4e32-877f-716beecdc06a.png](./img/BKU1UGeuTwkD4f-o/1683386873674-6ab43afb-0115-4e32-877f-716beecdc06a-474687.png)
  * Isotropic/Anisotropic Material
* Properties of BRDF
  * Non-negativity
  * Linearity
  * Reciprocity principle
  * Energy conservation
  * Isotropic vs anisotropic
* Measuring BRDFs
  * gonioreflectometer
  * MERL BRDB Database

# What is Materials in Computer Graphics

* Material == BRDF

![1683294661488-b130df3d-f2d8-4794-9793-719e3a7aebac.png](./img/BKU1UGeuTwkD4f-o/1683294661488-b130df3d-f2d8-4794-9793-719e3a7aebac-282857.jpg)

## Diffuse/Lambertian Material (BRDF)

A Lambertian surface for reflection is a surface that appears\*\* uniformly bright\*\* from\*\* all directions \*\*of view and reflects the entire incident light. Lambertian reflectance is  the property exhibited by an ideal matte or diffusely reflecting surface

![1683294958555-c7cbac48-2e58-4458-8120-0ddf9ae3cdbc.png](./img/BKU1UGeuTwkD4f-o/1683294958555-c7cbac48-2e58-4458-8120-0ddf9ae3cdbc-560872.jpg)

* 不考虑自身发光项 => 渲染方程去掉发光项。
* 假设入射光沿各个方向均匀分布=>$ L\_i(w\_i) $是常数；
* Lambertian材质只存在漫反射=>BRDF是常数
* 假设物体本身不吸收光，根据能量守恒=>接收多少就反射多少:
  * 各个方向的入射光之和为：$ \int\_\Omega L\_icos(w) dw\_i = \pi L\_i $
  * 根据能量守恒出射光之和为：$ L\_o(w\_o) = \pi f\_r L\_i $ => $ f\_r = 1/\pi $ （也是漫反射BRDF的上限）

然后，可以定义一个albedo(反射率,反照率)的概念，不同颜色具有不同的反射率

\=> 不同颜色的BRDF：$ f\_r = \frac{\rho}{\pi} $

![1683294972716-9d39f252-6dab-49b9-9cde-cf01e6f4171a.png](./img/BKU1UGeuTwkD4f-o/1683294972716-9d39f252-6dab-49b9-9cde-cf01e6f4171a-316135.png)

## Glossy Material (BRDF)

类似镜面反射，但又有点粗糙。

抛光的金属就是这种材质

![1683297515387-905e8cdc-c9fb-4a8d-8066-74449fcccd07.png](./img/BKU1UGeuTwkD4f-o/1683297515387-905e8cdc-c9fb-4a8d-8066-74449fcccd07-697192.jpg)

## Ideal Reflective/Refractive Material (BRDF)

有反射，也有折射（折射导致部分能量被吸收）

玻璃、水材质

原始的whitted style ray tracing 并没有考虑折射。

![1683297612519-dd1e38e6-ca71-45dd-8c28-fc4625939af6.png](./img/BKU1UGeuTwkD4f-o/1683297612519-dd1e38e6-ca71-45dd-8c28-fc4625939af6-518519.jpg)

### Perfect Specular Reflection

对于反射和折射，还可以研究的更深入

反射定律：入射角=出射角

三维空间，补充方位角（Phi）的概念（立体角中用到）。

如何根据入射角，算出射角？（三维空间的角用 theta 和 phi 来表示）：

![1683337777423-6ecb9568-60be-49b4-be5c-e0e52346b0f5.png](./img/BKU1UGeuTwkD4f-o/1683337777423-6ecb9568-60be-49b4-be5c-e0e52346b0f5-178948.png)

可以看到，出射角比较难算。blinn-phong相对phong的改进就是采用half vector来简化计算

如何用BRDF表示 specular reflection？这里不细讲。放下效果图：

![1683344936144-7c69ea96-d6ce-44c9-8a2d-6f427f9634b0.png](./img/BKU1UGeuTwkD4f-o/1683344936144-7c69ea96-d6ce-44c9-8a2d-6f427f9634b0-407936.jpg)

### Specular Refraction

In addition to reflecting off surface, light may be transmitted throught surface.

Light refracts when it enters a new medium.

右下角是caustics现象，中文名虽然叫焦散，事实上只有聚焦没有散射。

光打到海水表面，海水表面是凹凸不平的，光线会往不同方向折射。对于海底的一点，会接收到来自不同方向的光。 某些地方收到的光比较多，比较亮，形成条状光带。

![1683345161914-05869bd1-842c-4fdf-a7ec-89a09db20048.png](./img/BKU1UGeuTwkD4f-o/1683345161914-05869bd1-842c-4fdf-a7ec-89a09db20048-491953.jpg)

给定入射方向，如何算折射方向？

#### Snell's Law

折射定律

Transmitted angle depends on

* index of refraction (IOR) for incident ray
* index of refraction (IOR) for exiting ray

入射角的正弦*对应折射率 = 出射角的正弦*对应折射率

折射率越大，折射角（折射光线与法线的夹角）越小

![1683362944465-b8dd3f60-d9a1-4a94-bc79-e532d6ce87ed.png](./img/BKU1UGeuTwkD4f-o/1683362944465-b8dd3f60-d9a1-4a94-bc79-e532d6ce87ed-876534.png)

#### Total Internal Reflection

算折射角：

入射介质的折射率 大于 出射介质的折射率时，可能（入射角大于临界角时）不会发生折射，发生全反射现象（或称全内反射，Total internal reflection）。此当这种情况发生时，所有的光线都被反射回较高的折射率介质中。此时公式没有意义得不到实数解。

比如，光线从空气到水会发生折射，从水到空气、从玻璃到空气只会发生全内反射。

> 全内反射，又称全反射（total internal reflection，TIR），是一种光学现象。当光线从较高折射率的介质进入到较低折射率的介质时，如果入射角大于某一临界角θc（光线远离法线）时，折射光线将会消失，所有的入射光线将被反射而不进入低折射率的介质。

![1683363104885-db474acc-c148-4d9e-a5bc-f3308ce5bc96.png](./img/BKU1UGeuTwkD4f-o/1683363104885-db474acc-c148-4d9e-a5bc-f3308ce5bc96-983606.png)

#### Snell's window/Circle

受全反射现象影响。

斯涅耳窗口(也称为斯涅耳圆或optical man-hole)是一种现象，通过这种现象，水下观察者可以通过一个约96度的光锥看到水面以上的一切。这种现象是由光进入水中的折射引起的，受斯内尔定律支配。斯内尔窗户外面的区域要么是完全黑暗的，要么是水下物体的全内反射反射

![1683363947966-50ff41e3-864b-4cae-9d8c-65a9dcc293a9.png](./img/BKU1UGeuTwkD4f-o/1683363947966-50ff41e3-864b-4cae-9d8c-65a9dcc293a9-667772.jpg)

球体为什么不存在全反射现象？球非常对称，折射进来的光必定能折射出去。其他形状需要考虑全反射。

严格意义上，B**R**DF（Reflectance，反射率）用于反射，B**T**DF（Transmittance, 透光率）用于折射。二者统称为B**S**DF（Scattering，散射）。

平常BRDF就是指BSDF

### Fresnel Reflection / Term

一个有趣的性质

菲涅耳项，**<font style="color:rgb(18, 18, 18);">描述了物体在不同入射光角度下， 反射光线所占比例</font>**<font style="color:rgb(18, 18, 18);">，</font>

入射光进来的和法线角度，决定了有多少能量被反射

菲涅耳项可以解释有多少光发生了折射，有多少光发生了反射

如果入射光和法线几乎平行，那么大量能量被反射掉。入射角越大，反射能量越多。

现实中，当人坐在车后座并看向车窗，如果看向旁边的车窗（入射角小）则会看到外面的景象，而看向前排的车窗（入射角大）会更多地看到反射的司机/前排乘客的景象。

不同物质的菲涅耳项不同

![1683364786864-fc45ac7a-7e31-44b1-a1c6-73658c0e81ea.png](./img/BKU1UGeuTwkD4f-o/1683364786864-fc45ac7a-7e31-44b1-a1c6-73658c0e81ea-139666.png)

绝缘体的菲涅耳项：

注意红色的线。另外两个是极化的光，目前没有渲染器考虑。

![1683364922330-31f27195-5a26-4aeb-b86f-70ac0949ff2d.png](./img/BKU1UGeuTwkD4f-o/1683364922330-31f27195-5a26-4aeb-b86f-70ac0949ff2d-449907.png)

导体的菲涅耳项相差很多：

![1683365322814-a3606374-1ffa-42b0-ae46-0be05e52f38e.png](./img/BKU1UGeuTwkD4f-o/1683365322814-a3606374-1ffa-42b0-ae46-0be05e52f38e-364321.jpg)

#### Formulae

精确计算太麻烦，一般用近似解。认为曲线是0度的时候反射率为0，90度时为1（导体这种不考虑先下降再上升），然后用一条曲线去拟合真实曲线。

Schlick's approximation 不论对绝缘体还是导体都拟合的非常好。

R\_0是基准反射率

事实上，导体的反射率是负数。导体的折射率不仅需要n，还需要一个k，比较复杂

![1683365629575-22bca042-b900-4e60-af80-9cd99378683b.png](./img/BKU1UGeuTwkD4f-o/1683365629575-22bca042-b900-4e60-af80-9cd99378683b-694156.png)

## Microfacet Material

真正的，基于物理的材质：微表面材质/微表面模型

和菲涅耳项相关。

### Microfacet Model

state of art

微表面模型认为，对于一个粗糙的物体表面，从远处看看到的是材质，从近处看看到的是几何。（近处看是一堆几何，远处看几何消失变成材质）

Rough surface

* Macroscale: flat & rough
* Microscale: bumpy & **specular**

Individual elements of surface act like \*\*mirrors. \*\*每一个微表面都是一个微小的镜面，每个镜面有着自己的朝向。

* Known as Microfacets
* Each microfacet has its own normal

![1683366824984-bb2b595a-8f1f-4d6a-9259-9d1c72395f2f.png](./img/BKU1UGeuTwkD4f-o/1683366824984-bb2b595a-8f1f-4d6a-9259-9d1c72395f2f-246682.png)

研究这个有什么用？

研究微表面法线的分布

### Microfacet BRDF

glossy材质的法向量在方向上比较集中

diffuse材质的法向量在方向上比较分散

![1683384838086-38d6bbc8-5593-4d13-b3dd-3a3b9fdc08b4.png](./img/BKU1UGeuTwkD4f-o/1683384838086-38d6bbc8-5593-4d13-b3dd-3a3b9fdc08b4-717396.jpg)

基于上面的思想：

* `F(i,h)`: 菲涅耳项
* `D(h)`: 有多少微表面能够把入射方向的光反射到出射方向去？=》 D(h)的意思是，有多少微表面的法线向量与半程向量相同？
* `G(i, o, h)`: shadowing masking term又叫几何项。微表面之间可能互相遮挡，有一些微表面失去效果。
  * 什么情况下容易发生自遮挡/自投影？光线几乎是平着打过来时。这种入射方向被称为grazing angle（略射角， 接近90度的入射角，这种现象被称为掠射）.

Micorfacet Model的BRDF如下：

![1683384945519-5a5a03ce-1478-4a7a-aa37-1f2ea3dd30d3.png](./img/BKU1UGeuTwkD4f-o/1683384945519-5a5a03ce-1478-4a7a-aa37-1f2ea3dd30d3-411792.png)

### Examples

微表面模型可以描述的东西特别特别多，非常真实

![1683385790786-99935e74-23d5-40f6-bb52-6e9726a8dea3.png](./img/BKU1UGeuTwkD4f-o/1683385790786-99935e74-23d5-40f6-bb52-6e9726a8dea3-430526.jpg)

![1683385801655-a88cda7f-c362-44c0-bfde-4c54f22a6eab.png](./img/BKU1UGeuTwkD4f-o/1683385801655-a88cda7f-c362-44c0-bfde-4c54f22a6eab-404342.jpg)

但描述木头时，还需要在微表面模型上添加更多的东西

![1683385833589-7480bc46-7fbf-4685-a106-b41de5da0d69.png](./img/BKU1UGeuTwkD4f-o/1683385833589-7480bc46-7fbf-4685-a106-b41de5da0d69-813842.png)

### More

Microfacet Model 是一个统称，有很多微表面模型，但都遵守微表面这一套

## Isotropic/Anisotropic Materials (BRDFs)

区分材质的方式

电梯间内部有一盏灯，只考虑直接光照的前提下，为什么生成的高光区域是长条状而不是椭圆状？

原因：是磨过的金属。

![1683386219995-9b999828-c7fc-4856-8f5d-dcb2822b5867.png](./img/BKU1UGeuTwkD4f-o/1683386219995-9b999828-c7fc-4856-8f5d-dcb2822b5867-624428.jpg)

两种材质：

* Isotropic materials 各向同性材质
* Anisotropic materials 各向异性材质

![1683386444232-0c0ff660-6da0-4b8a-8035-ef028c1fa55e.png](./img/BKU1UGeuTwkD4f-o/1683386444232-0c0ff660-6da0-4b8a-8035-ef028c1fa55e-419799.png)

### Anisotropic BRDFs

各向异性材质：theta不变，同时旋转入射角和出射角的方位角。若得到的BRDF的值不同，就为各项异性材质。

![1683386499301-e2266f83-1911-4624-b3bc-1e8d6f261349.png](./img/BKU1UGeuTwkD4f-o/1683386499301-e2266f83-1911-4624-b3bc-1e8d6f261349-255420.jpg)

![1683387117592-055c5460-92a0-464b-ade5-90305ebaca15.png](./img/BKU1UGeuTwkD4f-o/1683387117592-055c5460-92a0-464b-ade5-90305ebaca15-452891.jpg)

尼龙这种针织物是各项异性，但很接近各项同性。

![1683387190789-12d85e5d-427b-445c-a215-7199ca7cfbad.png](./img/BKU1UGeuTwkD4f-o/1683387190789-12d85e5d-427b-445c-a215-7199ca7cfbad-955241.png)

天鹅绒看起来是各项同性，但也是各项异性：可以吧绒拨到一个方向

![1683387262262-5ed86120-46d2-4527-a47a-8748718c8268.png](./img/BKU1UGeuTwkD4f-o/1683387262262-5ed86120-46d2-4527-a47a-8748718c8268-464047.png)

![1683387320267-ac5f8c0c-6280-4f0b-b0c8-640cfbc6324b.png](./img/BKU1UGeuTwkD4f-o/1683387320267-ac5f8c0c-6280-4f0b-b0c8-640cfbc6324b-753234.png)

# Properties of BRDF

1. Non-negativity

![1683387442604-be33dcc3-ea38-4ebd-97fb-b9b3969b6367.png](./img/BKU1UGeuTwkD4f-o/1683387442604-be33dcc3-ea38-4ebd-97fb-b9b3969b6367-991992.png)

2. Linearity

   可以把一个物体拆成很多块，每块分别作光线传播，再把各快加起来

![1683387474465-b913e4d6-2176-4c9f-b8a0-cc037b05c3f4.png](./img/BKU1UGeuTwkD4f-o/1683387474465-b913e4d6-2176-4c9f-b8a0-cc037b05c3f4-034252.png)

3. Reciprocity principle 可逆性

交换入射方向和出射方向，得到的结果相同。

![1683387650776-f2a16ad3-53a3-486b-80d2-7cf30ea32ced.png](./img/BKU1UGeuTwkD4f-o/1683387650776-f2a16ad3-53a3-486b-80d2-7cf30ea32ced-484585.png)

4. Energy conservation

   BRDF不会让能量变多

![1683387713362-e3a6e535-75d4-47bd-8096-59c9b0e27ea8.png](./img/BKU1UGeuTwkD4f-o/1683387713362-e3a6e535-75d4-47bd-8096-59c9b0e27ea8-351299.png)

5. isotropic vs anisotropic

对于各向同性材质，参数少了一个。

从对称性讲，又不用考虑正负。

![1683387884532-9778e8ef-8d13-4ab1-99eb-d1afa8fb7029.png](./img/BKU1UGeuTwkD4f-o/1683387884532-9778e8ef-8d13-4ab1-99eb-d1afa8fb7029-505146.png)

# Measuring BRDFs

不建立模型了，直接测BRDF。测出的BRDF才是对的BRDF。

Avoid need to develop / derive models

* Automatically includes all of the scattering effects present

Can accurately render with real-world materials

* Useful for product design, special effects, .

Theory vs. practice (Fresnel term):

![1683388340696-f2107d12-15d4-4773-bb8d-a5612736e623.png](./img/BKU1UGeuTwkD4f-o/1683388340696-f2107d12-15d4-4773-bb8d-a5612736e623-936554.png)

## Image-based BRDF Measurement (gonioreflectometer)

![1683388410720-8a46cca1-0ecb-4b15-8a99-a8b833932f86.png](./img/BKU1UGeuTwkD4f-o/1683388410720-8a46cca1-0ecb-4b15-8a99-a8b833932f86-080000.png)

![1683388438882-b9632334-b95c-4d34-92a8-e60a1fe5c4ea.png](./img/BKU1UGeuTwkD4f-o/1683388438882-b9632334-b95c-4d34-92a8-e60a1fe5c4ea-941471.png)

![1683388505073-880b8210-1a51-48c6-b262-c2f59cf48955.png](./img/BKU1UGeuTwkD4f-o/1683388505073-880b8210-1a51-48c6-b262-c2f59cf48955-781580.png)

## Challenges in Measuring BRDFs

* Accurate measurements at grazing angles
  * Important due to Fresnel effects
* Measuring with dense enough sampling to capture high
* frequency specularities
* Retro-reflection
* Spatially-varying reflectance, ...

## Representing Measured BRDFs

BRDF的存储

Desirable qualities

* Compact representation
* Accurate representation of measured data
* Efficient evaluation for arbitrary pairs of directions
* Good distributions available for importance sampling

### Tabluar Representation

MERL BRDB Database

![1683388792256-febb9f88-5bcf-46a0-842d-e7ba63b176ca.png](./img/BKU1UGeuTwkD4f-o/1683388792256-febb9f88-5bcf-46a0-842d-e7ba63b176ca-760683.png)

#

# PBR材质总结

基于实验测，经验统计或是套用真实存在的物理公式

![1697476935799-bf82c82e-b865-45d5-a8bf-6c07010bdec1.png](./img/BKU1UGeuTwkD4f-o/1697476935799-bf82c82e-b865-45d5-a8bf-6c07010bdec1-470511.jpg)

# References

* [Lecture 17 Materials and Appearances\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=17\&vd_source=a637826c55b409b420b4b6584a6e8379)
* [全内反射\_百度百科](https://baike.baidu.com/item/%E5%85%A8%E5%86%85%E5%8F%8D%E5%B0%84/474139#:~:text=%E5%85%A8%E5%86%85%E5%8F%8D%E5%B0%84%EF%BC%8C%E5%8F%88%E7%A7%B0,%E4%BD%8E%E6%8A%98%E5%B0%84%E7%8E%87%E7%9A%84%E4%BB%8B%E8%B4%A8%E3%80%82)
* <https://en.wikipedia.org/wiki/Caustic_(optics)>
* 【【老奇】阴差阳错 撼动世界的游戏引擎-哔哩哔哩】 <https://b23.tv/ApdqICW>


> 更新: 2023-10-21 10:03:42  
> 原文: <https://www.yuque.com/viruspc/el3mi0/afr6d88deimo6z46>