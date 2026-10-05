# 光、材质和 shader

- [Summary](#summary)
- [Introduction](#introduction)
- [The Rendering Equation](#the-rendering-equation)
  * [Complexity of Real Rendering](#complexity-of-real-rendering)
  * [Challenge](#challenge)
    + [Challenge1.a: Visibility to Lights](#challenge1a-visibility-to-lights)
    + [Challenge1.b: Light Source Complexity](#challenge1b-light-source-complexity)
    + [Challenge2: How to Integral Efficiently on Hardware](#challenge2-how-to-integral-efficiently-on-hardware)
    + [Challenge3: Any matter will be light source](#challenge3-any-matter-will-be-light-source)
    + [Summary](#summary-1)
- [Starting from Simple](#starting-from-simple)
  * [Simple Light Solution](#simple-light-solution)
  * [Blinn-Phong Materials](#blinn-phong-materials)
  * [Shadow](#shadow)
- [Pre-computed Global Illumination](#pre-computed-global-illumination)
  * [Spherical Harmonics](#spherical-harmonics)
  * [Lightmap](#lightmap)
  * [Light Probe](#light-probe)
- [Physical-Based Material](#physical-based-material)
  * [Microfacet Theory](#microfacet-theory)
  * [Disney Principled BRDF](#disney-principled-brdf)
  * [PBR Specular Glossiness](#pbr-specular-glossiness)
- [Image-Based Lighting](#image-based-lighting)
  * [Diffuse Irradiance Map](#diffuse-irradiance-map)
  * [Specular Approximation](#specular-approximation)
- [Classic Shadow Solution](#classic-shadow-solution)
- [Summarize of Poplular AAA Rendering](#summarize-of-poplular-aaa-rendering)
- [Moving Wave of High Quality](#moving-wave-of-high-quality)
- [Shader Management](#shader-management)
- [Pilot Engine](#pilot-engine)
- [References](#references)

---

Rendering on Game Engine -- Lighting Materials and Shaders

## Summary


<font style="color:rgb(34, 34, 34);">光照（包括环境光）+材质+ 阴影，组合到一起并且配合美术的精巧设计就可以实现一些不错的渲染效果了。</font>

<font style="color:rgb(34, 34, 34);"></font>

<font style="color:rgb(34, 34, 34);">光照部分，lightmap和light probe都会用，用于解决不同问题</font>

<font style="color:rgb(34, 34, 34);">材质部分，PBR一统江湖</font>

<font style="color:rgb(34, 34, 34);">环境光部分：IBL一统江湖</font>

<font style="color:rgb(34, 34, 34);">阴影部分：CSM + VSSM </font>

## Introduction
<font style="color:rgb(34, 34, 34);">在上一节课中我们介绍了渲染的概念，而本节课我们则会开始介绍游戏引擎中具体的渲染算法。渲染是研究光与材质相互作用的学科，因此本节课从光线、材质以及shader三个方面介绍现代游戏引擎中各种经典实时算法的原理。</font>

![1705150781972-ef1cf62b-88a2-4c6c-9059-0d1479731727.png](./img/me4ofe09qgq2JTFA/1705150781972-ef1cf62b-88a2-4c6c-9059-0d1479731727-783154.png)

## The Rendering Equation
<font style="color:rgb(34, 34, 34);">渲染的本质是求解</font>**<font style="color:rgb(34, 34, 34);">渲染方程(the rendering equation)</font>**<font style="color:rgb(34, 34, 34);">，它由James Kajiya于1986年提出。</font>

![1704633699930-bf3e18c4-26eb-4508-92ff-0b6f7ce0c0e3.png](./img/me4ofe09qgq2JTFA/1704633699930-bf3e18c4-26eb-4508-92ff-0b6f7ce0c0e3-328495.png)

![1704633708551-2e765abd-5307-426e-a567-055ce0cf549c.png](./img/me4ofe09qgq2JTFA/1704633708551-2e765abd-5307-426e-a567-055ce0cf549c-124744.png)

### Complexity of Real Rendering
<font style="color:rgb(34, 34, 34);">显然想要直接求解渲染方程是相当困难的。在现实的场景中光线会在物体表面经过多次反射，同时不同的材质也有着天差地别的反射行为。</font>

![1704633844415-0458eb04-5990-4ee5-8cf3-0a1bb16a3522.png](./img/me4ofe09qgq2JTFA/1704633844415-0458eb04-5990-4ee5-8cf3-0a1bb16a3522-742258.png)

### Challenge
#### Challenge1.a: Visibility to Lights
Rendering Equation 没有说，判断光的可见性并不简单

一个图形学大佬说过：shadow is a beach

任何游戏中，shadow都是非常难做好的，有大量的hack。你解决了一个情况，但在其他情况下可能出问题。

但阴影非常关键，不能没有



<font style="color:rgb(34, 34, 34);">渲染的难点之一在于阴影，或者说是光的可见性。如何做出合适的阴影效果远比想象中要难得多，在实践中往往需要通过大量的技巧才能实现符合人认知的阴影效果。</font>

![1704633871443-16c48d43-b214-4c3f-ad6e-4bffca0758d2.png](./img/me4ofe09qgq2JTFA/1704633871443-16c48d43-b214-4c3f-ad6e-4bffca0758d2-621505.png)

#### Challenge1.b: Light Source Complexity
<font style="color:rgb(34, 34, 34);">其次，场景中往往有着各种类型的光源需要考虑。常见的光源形式包括平行光、点光源、聚光灯、面光源等等。</font>

光源本身具有复杂度。方向光、点光源、锥光源都还好，到面光源就复杂了。。。

![1704634107845-4d63cac7-e9da-462a-a953-eba97f3b753b.png](./img/me4ofe09qgq2JTFA/1704634107845-4d63cac7-e9da-462a-a953-eba97f3b753b-191686.png)

#### Challenge2: How to Integral Efficiently on Hardware
<font style="color:rgb(34, 34, 34);">材质是渲染中最为复杂的因素之一。如何设计符合现实世界的材质模型并且满足</font>**<font style="color:rgb(34, 34, 34);">实时</font>**<font style="color:rgb(34, 34, 34);">计算的要求是实时渲染的一大难点。</font>

![1705151128284-cd0d0209-b2cb-455d-8f61-2ed306c8ed02.png](./img/me4ofe09qgq2JTFA/1705151128284-cd0d0209-b2cb-455d-8f61-2ed306c8ed02-931948.png)

#### Challenge3: Any matter will be light source
<font style="color:rgb(34, 34, 34);">最后，在渲染时需要考虑光线在场景中不断反射的行为。全局光照一直是渲染的终极目标。</font>

<font style="color:rgb(34, 34, 34);">康奈尔盒子告诉我们，光在多次bounce之后，会生成很复杂的光照效果</font>

![1705151213770-46320444-a45f-4250-80cb-e77c4b17188e.png](./img/me4ofe09qgq2JTFA/1705151213770-46320444-a45f-4250-80cb-e77c4b17188e-091789.png)

#### Summary
![1705163705743-8be448e6-95f7-427e-b9c3-8c2cb5b8ebbf.png](./img/me4ofe09qgq2JTFA/1705163705743-8be448e6-95f7-427e-b9c3-8c2cb5b8ebbf-508872.png)

## <font style="color:rgb(0, 0, 0);">Starting from Simple</font>
### <font style="color:rgb(0, 0, 0);">Simple Light Solution</font>
<font style="color:rgb(34, 34, 34);">光照分解：我们从最简单的情况开始考虑。首先考虑对光照进行分解，将反射光分解为漫反射和环境光两部分。这样已经可以实现一些简单的渲染效果。</font>

![1705151419645-e4c3641d-911d-4f03-8dba-df300fb2dbcd.png](./img/me4ofe09qgq2JTFA/1705151419645-e4c3641d-911d-4f03-8dba-df300fb2dbcd-643320.png)

<font style="color:rgb(34, 34, 34);">环境贴图：为了更好地模拟环境光照，我们可以使用环境贴图技术把环境光存储在一个立方体表面上。这样当需要计算入射光线时只要根据方向去进行查询即可。</font>

![1705151423836-ac3497b4-5d1b-49ee-925f-cd41f01c29bc.png](./img/me4ofe09qgq2JTFA/1705151423836-ac3497b4-5d1b-49ee-925f-cd41f01c29bc-638166.png)

<font style="color:rgb(34, 34, 34);">实际上这样的处理方法在数学上也是解释得通的，它相当于把入射光线分解为低频的漫反射和高频的环境光。</font>

![1705151433354-381bfd25-af42-4e5d-bd87-099e3f39056c.png](./img/me4ofe09qgq2JTFA/1705151433354-381bfd25-af42-4e5d-bd87-099e3f39056c-271536.png)

### <font style="color:rgb(0, 0, 0);">Blinn-Phong Materials</font>
<font style="color:rgb(34, 34, 34);">有了光照后我们开始考虑材质。材质理论五花八门，最新的已经到光的波动理论了。最经典的材质模型是</font>**<font style="color:rgb(34, 34, 34);">Blinn-Phong材质(Blinn-Phong materials)</font>**<font style="color:rgb(34, 34, 34);">，它把材质的反射行为分解为与方向无关的环境光、与入射和观察角度有关的漫反射以及高光。</font>

![1705151412654-48d076ee-3177-4a76-a377-23ae2d7eb113.png](./img/me4ofe09qgq2JTFA/1705151412654-48d076ee-3177-4a76-a377-23ae2d7eb113-353303.png)  
<font style="color:rgb(34, 34, 34);">当然Blinn-Phong模型也有很多问题，比如说它不遵循能量守恒，同时它也不能描述现实世界中丰富的材质外观，做什么看起来都很塑料。（但遵循光的叠加原理，光是可以线性叠加的）</font>

<font style="color:rgb(34, 34, 34);">下图中用blin-phong做光线追踪，由于能量不守恒，能量每次弹射都多一些，导致内部多次反弹后会变特别亮。</font>

![1705151399786-ebdb348f-9c96-4f98-af04-f7f1523fb282.png](./img/me4ofe09qgq2JTFA/1705151399786-ebdb348f-9c96-4f98-af04-f7f1523fb282-609043.png)

### <font style="color:rgb(0, 0, 0);">Shadow</font>
<font style="color:rgb(34, 34, 34);">对于阴影问题，早期的处理方法主要是shadow volume，而现代游戏引擎的主流方法则是shadow map。shadow map的处理流程是在光源位置设置一个新的相机并渲染出一张深度图，然后在实际相机进行渲染时对每个点检测它到光源处的深度。如果该深度大于深度图对应位置处的深度则说明该点对于光源是不可见的，即位于阴影中。</font>

![1705151459815-f278f9f4-f0a2-46db-9ee0-e32daccc993e.png](./img/me4ofe09qgq2JTFA/1705151459815-f278f9f4-f0a2-46db-9ee0-e32daccc993e-590588.png)

![1705151463887-1e4bb7be-8442-4901-ba11-a8285f136d44.png](./img/me4ofe09qgq2JTFA/1705151463887-1e4bb7be-8442-4901-ba11-a8285f136d44-136922.png)

<font style="color:rgb(34, 34, 34);">shadow map的主要缺陷在于它只能产生”硬阴影”而无法产生现实中渐变的”软阴影”。而且从光源和相机进行采样时往往会使用不同的采样率，这容易导致各种走样和自遮挡的问题。</font>

  
![1705151473243-a2386826-2641-4f76-9e26-8f811d627136.png](./img/me4ofe09qgq2JTFA/1705151473243-a2386826-2641-4f76-9e26-8f811d627136-119798.png)

<font style="color:rgb(34, 34, 34);">把上面介绍过的这些技巧组合到一起并且配合美术的精巧设计就可以实现一些不错的渲染效果了。基本解决了上面的几个challenge</font>

  
![1705151485262-5fe55d7a-c165-43ad-9b73-c65abb0da133.png](./img/me4ofe09qgq2JTFA/1705151485262-5fe55d7a-c165-43ad-9b73-c65abb0da133-663089.png)

![1705151489549-7ac98e30-c25a-4193-9715-e1f6fe541b08.png](./img/me4ofe09qgq2JTFA/1705151489549-7ac98e30-c25a-4193-9715-e1f6fe541b08-231467.png)

## <font style="color:rgb(0, 0, 0);">Pre-computed Global Illumination</font>
<font style="color:rgb(34, 34, 34);">全局光照可以显著地提升画面的渲染效果，而它的难点在于如何表示来自其它物体反射的间接光照以及如何计算光照与材质BRDF的积分(卷积)。</font>

<font style="color:rgb(34, 34, 34);">假设场景中大部分物体都是不动的，太阳的角度是固定的，就可以预计算光照信息。通过空间换时间的方法来加速。</font>

![1705151631664-9f2cf61c-8c2b-4960-9828-a5f6235854bc.png](./img/me4ofe09qgq2JTFA/1705151631664-9f2cf61c-8c2b-4960-9828-a5f6235854bc-459594.png)

![1705151631610-731d51ba-a146-48ce-9cd0-cd926078b570.png](./img/me4ofe09qgq2JTFA/1705151631610-731d51ba-a146-48ce-9cd0-cd926078b570-419905.png)

### <font style="color:rgb(0, 0, 0);">Spherical Harmonics</font>
**<font style="color:rgb(34, 34, 34);">球面谐波函数(spherical harmonics, SH)</font>**<font style="color:rgb(34, 34, 34);">是实时渲染中表示环境光照的经典方法，不过在介绍SH前我们先来回顾一下Fourier变换的相关理论。Fourier变换指出无限循环的时域信号可以分解为不同频率函数的叠加，同时时域信号的卷积等价于经过Fourier变换后频域信号的乘积。</font>

<font style="color:rgb(34, 34, 34);"></font>

<font style="color:rgb(34, 34, 34);">傅立叶变化可以高效地压缩数据，用几个参数就粗略地表达整个图像的信息。</font>

<font style="color:rgb(34, 34, 34);">受益于此，不需要在整个图像做卷积，只要在这几个参数上做卷积就可以了。</font>

![1705151631620-6cc9bf71-8a6b-4d37-b022-0d7a6efbcf65.png](./img/me4ofe09qgq2JTFA/1705151631620-6cc9bf71-8a6b-4d37-b022-0d7a6efbcf65-590985.png)

![1705151632062-db036409-01e0-4355-badf-8d78831e8a11.png](./img/me4ofe09qgq2JTFA/1705151632062-db036409-01e0-4355-badf-8d78831e8a11-552527.png)



<font style="color:rgb(34, 34, 34);">而SH可以看成是对球面上信号进行分解，可以证明任意的球面信号可以分解为无限多基函数信号的加权和，而且这些基函数是相互正交的。</font>

![1705205370966-0cbae344-a39f-4139-b399-61f1963af5c3.png](./img/me4ofe09qgq2JTFA/1705205370966-0cbae344-a39f-4139-b399-61f1963af5c3-395168.png)

![1705151987541-e09deeb7-119a-4c24-a056-4e2f4853aab9.png](./img/me4ofe09qgq2JTFA/1705151987541-e09deeb7-119a-4c24-a056-4e2f4853aab9-299459.png)

![1705151991447-118e4e6b-4fb2-43dd-9db7-1bbb7e957b84.png](./img/me4ofe09qgq2JTFA/1705151991447-118e4e6b-4fb2-43dd-9db7-1bbb7e957b84-269160.png)



<font style="color:rgb(34, 34, 34);">基于SH我们可以对场景中任意点接收到的环境光照进行分解，一般来说只需要使用1-2阶的低频信号就可以实现合理的渲染效果。（主光源之外的环境光往往是低频的）</font>

![1705151999331-e22fc0cc-be6c-44c3-b0b5-e5ebdc399236.png](./img/me4ofe09qgq2JTFA/1705151999331-e22fc0cc-be6c-44c3-b0b5-e5ebdc399236-802412.png)

下图用了一阶（四个参数），大致表达了该着色点下光的分布 。

可以快速通过线性运算得到任意一个方向的光强。

![1705152002196-24e53ed3-adb1-41c3-927a-2a9f3e5ffb56.png](./img/me4ofe09qgq2JTFA/1705152002196-24e53ed3-adb1-41c3-927a-2a9f3e5ffb56-419976.png)

<font style="color:rgb(34, 34, 34);">假设我们使用2阶的SH对环境光照进行分解，在RGB3个通道上只需要12（4个参数*3个通道）个参数即可表示任意点接收到的环境光。进行存储时可以对不同的系数使用不同的精度进行存储，这样任意点的环境光照可以使用RGBA的32bits来表示，换句话说每一点的光场相当于RGBA纹理图像上的一个像素。</font>

<font style="color:rgb(34, 34, 34);">L0/L1采用不同的压缩方法，以优化存储。L0 采用高精度，L1采用低精度。L0的权重大，L1的权重小。</font>

<font style="color:rgb(34, 34, 34);">32bit意味着什么？</font>**<font style="color:rgb(34, 34, 34);">用一个RGBA，就可以存储一个着色点的光场。</font>**

<font style="color:rgb(34, 34, 34);">  
</font><font style="color:rgb(34, 34, 34);">PS：2022年，Unity 每个 chanel 采用 9个 coefficents。之前只保存间接光照信息，不保存直接光照和直接阴影；2023年，支持保存直接光照。</font>

+ baked 模式下，会得到dir(uv), light(sh), cube map
    - ![1706351054549-cd3edc2e-2936-4138-b021-76022b9eb778.png](./img/me4ofe09qgq2JTFA/1706351054549-cd3edc2e-2936-4138-b021-76022b9eb778-387624.png)
+ mixed 模式下，额外会得到 shadowmask



<font style="color:rgb(34, 34, 34);">总之，球面上两个数的卷积怎么做？可以把两个函数分别投影到SH的积上去；而投影后参数的卷积，就等于原函数卷积的结果。</font>

![1705152008825-81989e31-9241-43f4-a7c0-9684919f62e7.png](./img/me4ofe09qgq2JTFA/1705152008825-81989e31-9241-43f4-a7c0-9684919f62e7-148780.png)

### <font style="color:rgb(0, 0, 0);">Lightmap</font>
lightmap最早不是为了全局光照发明的，最早用这个预先做shadow。

<font style="color:rgb(34, 34, 34);">lightmap正是基于这种思想而提出来的光照技术。我们可以将场景中每个点的光照离线烘焙到一张纹理图上，然后在渲染时读取纹理值来获得SH表达的环境光照。</font>

![1705152015957-b9ea4e21-4e8b-474b-b73e-6d11cebf0d18.png](./img/me4ofe09qgq2JTFA/1705152015957-b9ea4e21-4e8b-474b-b73e-6d11cebf0d18-843652.png)

<font style="color:rgb(34, 34, 34);">烘焙光照前，首先要进行几何的简化。当然在进行烘焙时不需要使用包含各种细节的网格，我们只需要使用一个精度相对较低的网格并进行参数化即可。</font>

![1705152019676-9d97ed53-9f18-4e82-b1e2-88e2b24b9e2c.png](./img/me4ofe09qgq2JTFA/1705152019676-9d97ed53-9f18-4e82-b1e2-88e2b24b9e2c-479063.png)

<font style="color:rgb(34, 34, 34);">当美术完成场景建模后就可以开始烘焙了。显然计算lightmap是非常耗时的，但通过lightmap可以实现非常逼真的场景效果，而且在实际渲染时lightmap可以实现场景的实时渲染。</font>

![1705152027758-3e628aea-e992-4a1f-b42a-8f7f29ea4985.png](./img/me4ofe09qgq2JTFA/1705152027758-3e628aea-e992-4a1f-b42a-8f7f29ea4985-470772.png)

![1705152031002-0975d9d3-3962-46d5-b29e-af123561a7a4.png](./img/me4ofe09qgq2JTFA/1705152031002-0975d9d3-3962-46d5-b29e-af123561a7a4-163953.png)![1705152034559-345aa89d-462f-480f-b31d-f0a2777bef3e.png](./img/me4ofe09qgq2JTFA/1705152034559-345aa89d-462f-480f-b31d-f0a2777bef3e-711206.png)

<font style="color:rgb(34, 34, 34);">当然lightmap也有一些缺陷，比如说离线烘焙时需要很长的时间、lightmap无法考虑动态的光源、同时存储lightmap也需要非常大的存储空间。</font>

![1705152039158-c59a0aac-4e34-43b7-9ada-736ed841042a.png](./img/me4ofe09qgq2JTFA/1705152039158-c59a0aac-4e34-43b7-9ada-736ed841042a-390105.png)

动态lightmap基本不能做。有的游戏中会做sampling猜移动后的环境光照，但效果有很多问题：人路过物体shadow，shadow会把人变黑。



lightmap可能会被逐渐淘汰掉。



两个很好用的思想：

1. 123
2. 把整个游戏场景参数化到texture上。

### <font style="color:rgb(0, 0, 0);">Light Probe</font>
把复杂空间拍平，参数化，太麻烦了

<font style="color:rgb(34, 34, 34);">除了lightmap外还可以在空间上设置一些</font>**<font style="color:rgb(34, 34, 34);">探针(probe)</font>**<font style="color:rgb(34, 34, 34);">来记录环境光照，而在计算物体的着色时只需要对附近probe进行插值即可估计该点的光照。</font>

![1705152045007-2f3a49ba-4ac9-4979-a9b0-19fc5d40000b.png](./img/me4ofe09qgq2JTFA/1705152045007-2f3a49ba-4ac9-4979-a9b0-19fc5d40000b-087119.png)

<font style="color:rgb(34, 34, 34);">当然如何设置这些probe是比较麻烦的。早期的实践中一般是由美术人工进行设置，而目前则可以使用一些自动化的工具来自动生成probe。</font>

![1705152056166-c89c5287-2c57-4872-878b-f48bcf3f24e5.png](./img/me4ofe09qgq2JTFA/1705152056166-c89c5287-2c57-4872-878b-f48bcf3f24e5-680603.png)

<font style="color:rgb(34, 34, 34);">一般 light probe 会采到非常密，但会用压缩算法把精度压的非常低。原因是做diffuse光照的话，不需要很高精度。</font>

<font style="color:rgb(34, 34, 34);">反射对光照的高频很敏感。如果要考虑材质的反射行为则需要设置专门的反射probe。一般来说这样的反射probe不需要设置很多，但每个probe则需要有更高的精度。</font>

![1705152061750-c491a607-e7f6-4006-ae3d-45fbf06e72c4.png](./img/me4ofe09qgq2JTFA/1705152061750-c491a607-e7f6-4006-ae3d-45fbf06e72c4-508858.png)

<font style="color:rgb(34, 34, 34);">light probe同样可以进行实时渲染。不同于lightmap，基于light probe可以实现动态的场景和物体渲染，而且现代计算机的计算性能也允许对probe进行动态更新。</font>

<font style="color:rgb(34, 34, 34);"></font>

<font style="color:rgb(34, 34, 34);">没法实现light map那种非常细节的感觉，物体交叠的感觉，color bleeding效果。</font>

<font style="color:rgb(34, 34, 34);">light map在地图上采样几百万个点，light probe几万个就已经不得了了，几百分之一的采样率肯定达不到light map的效果。</font>

![1705152066540-3217ab12-9187-4eee-8e2f-d8020c925c5e.png](./img/me4ofe09qgq2JTFA/1705152066540-3217ab12-9187-4eee-8e2f-d8020c925c5e-259406.png)

## <font style="color:rgb(0, 0, 0);">Physical-Based Material</font>
### <font style="color:rgb(0, 0, 0);">Microfacet Theory</font>
<font style="color:rgb(34, 34, 34);">有了光照后我们来考虑材质。基于物理的材质模型大量使用了</font>**<font style="color:rgb(34, 34, 34);">微表面理论(microfacet theory)</font>**<font style="color:rgb(34, 34, 34);">来模拟现实世界中材质，简单来说微表面理论认为材质的表面是由大量方向各异的光滑镜面组成，这些镜面的分布控制了不同材质的反射行为。</font>

<font style="color:rgb(34, 34, 34);">后续的 Disney Principled BRDF、SG模型、MR模型的本质都是微表面模型。</font>

![1705152072306-919b3ca2-5db7-43f4-938a-3b18fb0b6445.png](./img/me4ofe09qgq2JTFA/1705152072306-919b3ca2-5db7-43f4-938a-3b18fb0b6445-896204.png)

<font style="color:rgb(34, 34, 34);">光线在物体表面上的反射可以分解为</font>**<font style="color:rgb(34, 34, 34);">体反射(body reflection)</font>**<font style="color:rgb(34, 34, 34);">和</font>**<font style="color:rgb(34, 34, 34);">表面反射(surface reflection)</font>**<font style="color:rgb(34, 34, 34);">两种。在体反射中光子会进入到物体的内部进行反射然后从物体表面的另一个点射出；而在表面反射中光子则会直接被反射出去。实际上物体表面的漫反射行为对应着体反射，我们可以使用Lambert模型进行表示；而表面反射的行为则可以基于微表面理论使用Cook-Torrance模型来进行表达。将二者组合到一起就构成来材质的BRDF。</font>



金属的电子可以捕获光子，光子进去后就出不来了，不会出现体反射。

非金属的电子不能捕获光子。非金属中，光子会在物体表面下来回弹几次，然后再射出来（diffuse，体反射）。



DFG的含义：

+ D: Normal Distribution Function（法向分布的方程，normal分布的是更加发散还是聚集）
    - GGX分布特点：在高频更尖，高频到低频的过渡更平滑，且最低也不会为0。很像好的音响的标准：高音要脆，低音要沉。依赖于 roughness $ \alpha $
+ G：几何项（自遮挡）
    - GGX 从法向分布可以估计出 G项。设置好 roughness项后，就可以同时得到 D 和 G
+ F：菲涅耳项
    - 当视线接近于切线方向时，反射会急剧增加
    - <font style="color:rgb(34, 34, 34);">Schilick近似：</font>根据推导，可以近似于1-VoH的五次方
        * $ F = F_0 + (1-F_0)(1-(v \cdot h)^5) $



**<font style="color:#DF2A3F;">realtime的精神：看起来基本对了就拉倒。</font>**<font style="color:#000000;">可以做各种大胆的猜测和假设</font>

![1705152078542-0e5d7830-44ae-445a-9e0e-954b79946ae1.png](./img/me4ofe09qgq2JTFA/1705152078542-0e5d7830-44ae-445a-9e0e-954b79946ae1-660944.png)

![1705223116988-e53889ad-84ff-482d-9d6a-05d4c63f75ed.png](./img/me4ofe09qgq2JTFA/1705223116988-e53889ad-84ff-482d-9d6a-05d4c63f75ed-785992.png)

![1705223124135-2680c999-4415-4ddb-9012-34c8c605471b.png](./img/me4ofe09qgq2JTFA/1705223124135-2680c999-4415-4ddb-9012-34c8c605471b-183268.png)

<font style="color:rgb(34, 34, 34);">Cook-Torrance模型可以拆分为三项。首先是</font>**<font style="color:rgb(34, 34, 34);">法向分布函数(normal distribution function)</font>**<font style="color:rgb(34, 34, 34);">，它表示材质不同方向上镜面法向的分布情况。法向分布函数包含一个参数</font>$ \alpha $<font style="color:rgb(34, 34, 34);">来表示表面的粗糙度，</font>$ \alpha $<font style="color:rgb(34, 34, 34);">越大表示表面越粗糙反射行为越接近漫反射，</font>$ \alpha $<font style="color:rgb(34, 34, 34);">越小表示表面越光滑反射行为越接近理想镜面反射。</font>

![1705152085734-3288e975-5375-46a3-b040-d89e96d43ca2.png](./img/me4ofe09qgq2JTFA/1705152085734-3288e975-5375-46a3-b040-d89e96d43ca2-783343.png)

<font style="color:rgb(34, 34, 34);">Cook-Torrance模型中的另一项是</font>**<font style="color:rgb(34, 34, 34);">几何项(geometry attenuation term)</font>**<font style="color:rgb(34, 34, 34);">，它表示不同方向镜面的自遮挡行为。在Cook-Torrance模型中使用Smith模型将几何项分解为出射方向和入射方向两个方向上的可见性乘积，每个方向上的可见性使用GGX模型进行计算。</font>

![1705152093519-0690537e-45a0-438d-afcc-e554049741c0.png](./img/me4ofe09qgq2JTFA/1705152093519-0690537e-45a0-438d-afcc-e554049741c0-953096.png)

<font style="color:rgb(34, 34, 34);">Cook-Torrance模型中的最后一项是</font>**<font style="color:rgb(34, 34, 34);">Fresnel项(Fresnel equation)</font>**<font style="color:rgb(34, 34, 34);">，它表示不同材质光滑表面的理想反射行为。在实时渲染中一般使用Schilick近似来计算这一项。</font>

![1705152097746-36b1ffad-e592-4d04-a6e3-3be7a601203c.png](./img/me4ofe09qgq2JTFA/1705152097746-36b1ffad-e592-4d04-a6e3-3be7a601203c-946178.png)

<font style="color:rgb(34, 34, 34);">为了获得真实材质的光学参数我们还需要进行实际的测量。</font>[MERL BRDF数据库](https://cdfg.csail.mit.edu/wojciech/brdfdatabase)<font style="color:rgb(34, 34, 34);">给出了常见材质的BRDF测量结果。</font>

![1705152103123-fb74b0fe-79ea-4399-8b3e-015deb7af5e8.png](./img/me4ofe09qgq2JTFA/1705152103123-fb74b0fe-79ea-4399-8b3e-015deb7af5e8-309544.png)

### <font style="color:rgb(0, 0, 0);">Disney Principled BRDF</font>
<font style="color:rgb(34, 34, 34);">为了方便不同背景的从业者进行使用，Disney提出了著名的</font>**<font style="color:rgb(34, 34, 34);">Disney Principled BRDF</font>**<font style="color:rgb(34, 34, 34);">来设计不同的材质模型。它的思想是设计材质模型时要尽可能方便艺术家进行理解，而不要过多地使用物理上面的概念。</font>

<font style="color:rgb(34, 34, 34);">底层还是微表面模型。</font>

![1705152110123-245442f0-a83d-4cc1-b3fc-c71957dcd270.png](./img/me4ofe09qgq2JTFA/1705152110123-245442f0-a83d-4cc1-b3fc-c71957dcd270-014741.png)![1705152112204-d9b27194-cd63-4e0a-9c17-cdde16b86e25.png](./img/me4ofe09qgq2JTFA/1705152112204-d9b27194-cd63-4e0a-9c17-cdde16b86e25-738929.png)

### <font style="color:rgb(0, 0, 0);">PBR Specular Glossiness</font>
<font style="color:rgb(34, 34, 34);">目前在游戏引擎中最常用的材质模型是</font>**<font style="color:rgb(34, 34, 34);">specular glossiness模型(SG)</font>**<font style="color:rgb(34, 34, 34);">。在SG模型中物体的反射行为分解为三张图的叠加：diffuse用来控制漫反射、specular图用来控制Fresnel项、而glossiness图则控制金属材质的粗糙度。把三张图带入BRDF计算公式就可以渲染出非常漂亮的模型。</font>

<font style="color:rgb(34, 34, 34);">SG模型是微表面模型的一种特殊实现，允许艺术家和开发者通过符合直觉和艺术家友好的方式，来控制材质的反射属性。</font>

<font style="color:rgb(34, 34, 34);">存在的问题，太灵活了，参数调不好F项很容易炸掉</font>

![1705152122031-2273a850-e60b-4847-8127-ee7f87c8c44f.png](./img/me4ofe09qgq2JTFA/1705152122031-2273a850-e60b-4847-8127-ee7f87c8c44f-807013.png)![1705152125402-453780ff-14c0-438b-8f51-821054df6ece.png](./img/me4ofe09qgq2JTFA/1705152125402-453780ff-14c0-438b-8f51-821054df6ece-108476.png)

<font style="color:rgb(34, 34, 34);">在长期的实践中为了防止美术在设计时出错，人们还对SG模型进行了封装并得到了</font>**<font style="color:rgb(34, 34, 34);">metallic roughness模型(MR)</font>**<font style="color:rgb(34, 34, 34);">。MR模型同样包含三张图：一张base color图（类似SG中的diffuse）表示漫反射、一张roughness图（类似SG中的glossiness）表示粗糙度、还有一张metallic（类似SG中的specular）图表示材质的金属度。当metallic值很高时材质会更接近于金属材质产生大量的光泽反射，否则会接近于非金属材质以漫反射为主。</font>

<font style="color:rgb(34, 34, 34);">MR可以通过在SG函数外再包一层来实现。非金属specular只能那么多，金属specular允许多一些。这样虽然艺术家的灵活度降低了，但不容易出问题。图中程序会在base_color和specular_color之间，根据金属度metallic来差值，得到最终的specular。</font>

<font style="color:rgb(34, 34, 34);">Unity/Unreal也是这么实现的。</font>

<font style="color:rgb(34, 34, 34);"></font>

![1705152133119-9a14b278-c081-4685-9f79-d1575db2f5b4.png](./img/me4ofe09qgq2JTFA/1705152133119-9a14b278-c081-4685-9f79-d1575db2f5b4-875627.png)![1705152135247-abd7211e-faed-4a16-8f14-1ae65a55916c.png](./img/me4ofe09qgq2JTFA/1705152135247-abd7211e-faed-4a16-8f14-1ae65a55916c-932697.png)

<font style="color:rgb(34, 34, 34);">MR模型不太适合表示介于金属和非金属之间的材质，但大多数情况下仍然是工程中的首选。</font>

<font style="color:rgb(34, 34, 34);">MR存在的问题：非金属和金属之间的过渡会出现白边，目前没有好的解决方案。（有人增加了一个控制菲涅耳项的参数，半金属/非金属不想产生亮边时，压低菲涅耳效果。不知道会不会有其他问题）</font>

![1705152143235-bb6a7c10-c728-4241-9580-f2b8f005bf69.png](./img/me4ofe09qgq2JTFA/1705152143235-bb6a7c10-c728-4241-9580-f2b8f005bf69-967826.png)

## <font style="color:rgb(0, 0, 0);">Image-Based Lighting</font>
<font style="color:rgb(34, 34, 34);">IBR本身是使用真实图像作为光照的方法，但结合PBR材质可以实现非常逼真的实时渲染效果。</font>

![1705152151088-9f3ef92d-065e-4c5a-868c-3440a57117ae.png](./img/me4ofe09qgq2JTFA/1705152151088-9f3ef92d-065e-4c5a-868c-3440a57117ae-092062.png)

<font style="color:rgb(34, 34, 34);">根据前面介绍过的PBR材质，物体表面的BRDF可以分解为漫反射以及镜面反射两项。我们对这两项分别进行处理在累加起来就可以实现IBR。</font>

![1705152154730-f6d0c69f-ee45-46a7-bfda-fb0b5df5ecb9.png](./img/me4ofe09qgq2JTFA/1705152154730-f6d0c69f-ee45-46a7-bfda-fb0b5df5ecb9-309821.png)

### <font style="color:rgb(0, 0, 0);">Diffuse Irradiance Map</font>
<font style="color:rgb(34, 34, 34);">对于漫反射项比较简单，我们首先通过预计算的方法对环境光照按照余弦进行积分，接着把积分后的值存储在一个表格中。实际渲染时进行查表并和漫反射系数进行相乘即可。</font>

<font style="color:rgb(34, 34, 34);">（Split Sum 的 </font>**Prefiltering **步骤，用mipmap存储不同diffuse的光照积分<font style="color:rgb(34, 34, 34);">）</font>

![1705152160719-c82280f1-0c8d-4bf2-a4c0-f25238c756e7.png](./img/me4ofe09qgq2JTFA/1705152160719-c82280f1-0c8d-4bf2-a4c0-f25238c756e7-430334.png)

### <font style="color:rgb(0, 0, 0);">Specular Approximation</font>
<font style="color:rgb(34, 34, 34);">对镜面反射的处理要相对复杂一些。我们首先需要将镜面反射的积分利用split-sum拆分成</font>**<font style="color:rgb(34, 34, 34);">光照项(lighting term)</font>**<font style="color:rgb(34, 34, 34);">和</font>**<font style="color:rgb(34, 34, 34);">BRDF项(BRDF term)</font>**<font style="color:rgb(34, 34, 34);">两部分，而这两项都可以通过预计算的方法事先存储在一个表格中。</font>

![1705152166642-90d7cf52-a304-4a4f-8e17-2dfbc7c1cb25.png](./img/me4ofe09qgq2JTFA/1705152166642-90d7cf52-a304-4a4f-8e17-2dfbc7c1cb25-225516.png)![1705152168123-40a68e78-8d13-4d31-8bdf-5192eeff0ee8.png](./img/me4ofe09qgq2JTFA/1705152168123-40a68e78-8d13-4d31-8bdf-5192eeff0ee8-786399.png)![1705152169938-063f7c83-2256-46c5-a1e6-a49098f60672.png](./img/me4ofe09qgq2JTFA/1705152169938-063f7c83-2256-46c5-a1e6-a49098f60672-541329.png)

<font style="color:rgb(34, 34, 34);">最后把漫反射项和镜面反射项加起来就得到了完整的环境光照。</font>

![1705152176269-8e276ca0-8159-4723-bfb5-e1c85227efda.png](./img/me4ofe09qgq2JTFA/1705152176269-8e276ca0-8159-4723-bfb5-e1c85227efda-465493.png)

<font style="color:rgb(34, 34, 34);">在现代3A游戏中基于IBR和PBR可以实现非常逼真的图像效果。</font>

![1705152178941-69a53ef2-b54b-4cae-9a7f-492f3926cb70.png](./img/me4ofe09qgq2JTFA/1705152178941-69a53ef2-b54b-4cae-9a7f-492f3926cb70-021826.png)

## <font style="color:rgb(0, 0, 0);">Classic Shadow Solution</font>
<font style="color:rgb(34, 34, 34);">cascade shadow是实时渲染中阴影的经典处理方法，是经典3A游戏中最常见的shadow解决方法（现在天下已经大乱了）。它的思想是根据距离来调整shadow map的精度，近处的精度高远处的精度低。</font>

![1705152185046-c9d1de68-a6ae-4b82-970f-8e07bd601dd9.png](./img/me4ofe09qgq2JTFA/1705152185046-c9d1de68-a6ae-4b82-970f-8e07bd601dd9-196849.png)![1705152187179-68765733-c199-47d9-97d4-8361121c1858.png](./img/me4ofe09qgq2JTFA/1705152187179-68765733-c199-47d9-97d4-8361121c1858-911694.png)

<font style="color:rgb(34, 34, 34);">当然想要得到合理的阴影效果需要大量的技巧，而且cascade shadow需要大量的存储空间在计算上也需要大量的时间。</font>

<font style="color:rgb(34, 34, 34);">需要在过渡地方做插值，不然相机移动时，shadow有些地方会破掉</font>

<font style="color:rgb(34, 34, 34);">优点：</font>

<font style="color:rgb(34, 34, 34);">缺点：</font>

1. 存储空间大。空间换时间。
2. 生成远处的shadow map相当于把场景绘制一遍，成本并不低。

shadow非常吃时间，很少能做到2ms一下。

![1705152191338-6c331660-9482-4b5b-b000-bc7faf99b91f.png](./img/me4ofe09qgq2JTFA/1705152191338-6c331660-9482-4b5b-b000-bc7faf99b91f-431909.png)![1705152193927-30defb24-ad80-4932-a80f-c429d24f3cc8.png](./img/me4ofe09qgq2JTFA/1705152193927-30defb24-ad80-4932-a80f-c429d24f3cc8-732552.png)

<font style="color:rgb(34, 34, 34);">现代实时渲染中会更多地使用PCF和PCSS等算法，它们的特点是可以实现更加自然的软阴影效果。PCSS在很多引擎里是标配。</font>

<font style="color:rgb(34, 34, 34);">PCSS想法很简单：算出方差和均值。当给定一个深度，可以快速利用数学方法估计出阴影程度。</font>

![1705152203188-e1c467f6-0f49-4bbd-85ad-0ab82d989cb9.png](./img/me4ofe09qgq2JTFA/1705152203188-e1c467f6-0f49-4bbd-85ad-0ab82d989cb9-265569.png)![1705152204468-9bcb1554-8910-430f-8fe4-b73483361234.png](./img/me4ofe09qgq2JTFA/1705152204468-9bcb1554-8910-430f-8fe4-b73483361234-020212.png)![1705152206090-2604251d-5a47-4651-95d4-c95db219d01a.png](./img/me4ofe09qgq2JTFA/1705152206090-2604251d-5a47-4651-95d4-c95db219d01a-941169.png)

<font style="color:rgb(34, 34, 34);">另一种生成软阴影的方法是VSSM，它基于Chebyshev不等式来估计像素上的阴影比例。</font>

![1705152213798-59623fb0-e283-456a-bc0d-f2a199ce53c5.png](./img/me4ofe09qgq2JTFA/1705152213798-59623fb0-e283-456a-bc0d-f2a199ce53c5-853679.png)

## <font style="color:rgb(34, 34, 34);">Summarize of Poplular AAA Rendering</font>
<font style="color:rgb(34, 34, 34);">把上面介绍过的技术全部结合到一起就可以实现上个世代3A游戏的渲染效果。</font>

<font style="color:rgb(34, 34, 34);">光照部分，lightmap和light probe都会用，用于解决不同问题</font>

<font style="color:rgb(34, 34, 34);">材质部分，PBR一统江湖</font>

<font style="color:rgb(34, 34, 34);">环境光部分：IBL一统江湖</font>

<font style="color:rgb(34, 34, 34);">阴影部分：CSM + VSSM </font>

<font style="color:rgb(34, 34, 34);"></font>

![1705152218567-e5fd270e-0d89-41fc-8bf5-89d375aeb641.png](./img/me4ofe09qgq2JTFA/1705152218567-e5fd270e-0d89-41fc-8bf5-89d375aeb641-289745.png)

## <font style="color:rgb(0, 0, 0);">Moving Wave of High Quality</font>
<font style="color:rgb(34, 34, 34);">随着各种shader模型的提出以及硬件计算性能的进步，上面介绍的实时渲染算法已经不能完全满足人们对画质的需求。</font>

![1705152224636-d43152ce-7dfb-4a29-a3bc-54d1eb127306.png](./img/me4ofe09qgq2JTFA/1705152224636-d43152ce-7dfb-4a29-a3bc-54d1eb127306-831059.png)

<font style="color:rgb(34, 34, 34);">GPU开放了更多的底层硬件能力，我们可以做更多的事情。</font>

**<font style="color:rgb(34, 34, 34);">实时光线追踪(real-time ray tracing)</font>**<font style="color:rgb(34, 34, 34);">就是一个很好的案例。GPU提供了ray casting模块。现在游戏没有实时光追，都不好意思说自己是现代游戏了。</font>

<font style="color:rgb(34, 34, 34);">随着显卡性能的提升我们可以把光线追踪算法应用在实时渲染中从而获得更加真实的光照和反射效果。</font>

<font style="color:rgb(34, 34, 34);">实时光追最多被用来做反射。</font>

![1705152229088-c0fe1fc2-44e5-4e36-b325-cd97bf88b184.png](./img/me4ofe09qgq2JTFA/1705152229088-c0fe1fc2-44e5-4e36-b325-cd97bf88b184-809468.png)

<font style="color:rgb(34, 34, 34);">另一方面</font>**<font style="color:rgb(34, 34, 34);">实时全局光照(real-time global illumination)</font>**<font style="color:rgb(34, 34, 34);">也取得了很大的进步。这几年各种实时全局光照算法层出不穷，基于全局光照可以给游戏画面带来质的飞跃。</font>

![1705152233710-3eff6ea0-8e36-4623-8bf1-0f443049d496.png](./img/me4ofe09qgq2JTFA/1705152233710-3eff6ea0-8e36-4623-8bf1-0f443049d496-078669.png)

<font style="color:rgb(34, 34, 34);">在材质渲染方面，随着geometry shader的出现人们可以获得几乎无限的几何细节。同时大量基于BSSDF的shader使得人们更准确地描述物理材质与光线的相互作用。</font>

![1705152238882-bd24cd0a-c869-41a7-8bbb-ffac92371367.png](./img/me4ofe09qgq2JTFA/1705152238882-bd24cd0a-c869-41a7-8bbb-ffac92371367-452584.png)

<font style="color:rgb(34, 34, 34);">在虚幻5引擎中还使用了virtual shadow map来生成更加逼真的阴影。</font>

<font style="color:rgb(34, 34, 34);">与 Virtual Texture 类似。</font>

<font style="color:rgb(34, 34, 34);">可以知道哪些地方真的需要生成shadowmap，shadowmap的密度是多少。在一个庞大的虚拟shadowmap上分配空间，一小块一小块tile地去生成 shadowmap。</font>

<font style="color:rgb(34, 34, 34);">能够解决 CSM 空间利用率不高的问题。</font>

![1705152245141-88ce54f2-417a-4b7f-bd82-de205c1fc2ad.png](./img/me4ofe09qgq2JTFA/1705152245141-88ce54f2-417a-4b7f-bd82-de205c1fc2ad-008950.png)

## <font style="color:rgb(0, 0, 0);">Shader Management</font>
<font style="color:rgb(34, 34, 34);">本节课最后讨论了游戏引擎中的shader管理问题。在现代3A游戏中每一帧的画面上可能都有上千个shader在运行。</font>

![1705152253483-f3ad98ed-a3dd-4350-91cd-914d74fe63c7.png](./img/me4ofe09qgq2JTFA/1705152253483-f3ad98ed-a3dd-4350-91cd-914d74fe63c7-375995.png)![1705152255248-c7f82e06-c38a-4593-98ad-83993e74c0cf.png](./img/me4ofe09qgq2JTFA/1705152255248-c7f82e06-c38a-4593-98ad-83993e74c0cf-649521.png)

<font style="color:rgb(34, 34, 34);">这些大量的shader一方面来自于美术对场景和角色的设计，另一方面不同材质在不同光照条件下的反应也使得程序员需要将不同情况下的shader组合到一起，并通过宏的方式让程序自行选择需要执行的代码。</font>

<font style="color:rgb(34, 34, 34);"></font>

<font style="color:rgb(34, 34, 34);">Ubers hader，也叫全能着色器。在Shader中使用宏定义来区别执行分支，以</font>**<font style="color:rgb(34, 34, 34);">提高着色器复用率，降低分支带来的性能开销</font>**<font style="color:rgb(34, 34, 34);">（GPU是SIMD架构，希望同一批次的每条指令执行时间相同）。</font>

<font style="color:rgb(34, 34, 34);"></font>

<font style="color:rgb(34, 34, 34);">具体如何复用：通过宏定义不同情况下的Shader组合，在编译时生成大量独立的Shader代码。当Shader发生变化时，只需修改组合Shader后重新编译。</font>

![1705152260871-f5e7a25c-84ce-4bd8-ae6b-098d3d4e7479.png](./img/me4ofe09qgq2JTFA/1705152260871-f5e7a25c-84ce-4bd8-ae6b-098d3d4e7479-502572.png)![1705152262542-dc18dc17-ce66-4fbd-9e02-5d3bc784a1c2.png](./img/me4ofe09qgq2JTFA/1705152262542-dc18dc17-ce66-4fbd-9e02-5d3bc784a1c2-348730.png)![1705152264355-b7392fd6-5e12-487f-bffb-10d2549ea3fa.png](./img/me4ofe09qgq2JTFA/1705152264355-b7392fd6-5e12-487f-bffb-10d2549ea3fa-242473.png)

<font style="color:rgb(34, 34, 34);">除此之外不同的平台上往往使用了不同的图形库，在编写shader的时候需要考虑跨平台的问题。</font>

![1705152268108-6ad03f67-9608-4de6-ac6e-21d751ed21e3.png](./img/me4ofe09qgq2JTFA/1705152268108-6ad03f67-9608-4de6-ac6e-21d751ed21e3-098494.png) 



## Pilot Engine


## References
+ [Lecture 05：Rendering on Game Engine](https://www.bilibili.com/video/BV1J3411n7WT)
+ [GAMES202 Lecture 03：Real-time Shadows 1](https://www.bilibili.com/video/BV1YK4y1T7yY?p=3)
+ [GAMES202 Lecture 04：Real-time Shadows 2](https://www.bilibili.com/video/BV1YK4y1T7yY?p=4)
+ [GAMES202 Lecture 05：Real-Time Environment Mapping 1](https://www.bilibili.com/video/BV1YK4y1T7yY?p=5)
+ [GAMES202 Lecture 06：Real-Time Environment Mapping 2](https://www.bilibili.com/video/BV1YK4y1T7yY?p=6)
+ [GAMES202 Lecture 10：Real-Time Physically-Based Materials 1](https://www.bilibili.com/video/BV1YK4y1T7yY?p=10)
+ [GAMES202 Lecture 11：Real-Time Physically-Based Materials 2](https://www.bilibili.com/video/BV1YK4y1T7yY?p=11)
+ [Unity - Manual: Baked lighting](https://docs.unity3d.com/2019.1/Documentation/Manual/LightMode-Baked.html)



> 更新: 2024-01-28 09:59:54  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pyaicwilnsg3n5h2>