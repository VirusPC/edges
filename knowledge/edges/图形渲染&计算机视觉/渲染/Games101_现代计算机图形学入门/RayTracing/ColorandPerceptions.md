# Color and Perceptions

- [Summary](#summary)
- [Physical Basis of Color](#physical-basis-of-color)
  * [The fundamentals of light](#the-fundamentals-of-light)
  * [The Visible Spectrum of Light](#the-visible-spectrum-of-light)
  * [Spectral Power Distribution (SPD)](#spectral-power-distribution-spd)
    + [Examples](#examples)
      - [Daylight Spectral Power Distributions Vary](#daylight-spectral-power-distributions-vary)
      - [Spectral Power Distribution of Light Sources](#spectral-power-distribution-of-light-sources)
    + [Linearity of Spectral Power Distributions](#linearity-of-spectral-power-distributions)
  * [What is Color?](#what-is-color)
- [Biological Basis of Color](#biological-basis-of-color)
  * [Anatomy of the Human Eye](#anatomy-of-the-human-eye)
  * [Retianl Photoreceptor Cells](#retianl-photoreceptor-cells)
    + [Rods and Cones](#rods-and-cones)
    + [Fraction of Three Cone Cell Types Varies Widely](#fraction-of-three-cone-cell-types-varies-widely)
    + [Spectral Response of Human Cone Cells](#spectral-response-of-human-cone-cells)
    + [The Human Visual System](#the-human-visual-system)
- [Metamerism](#metamerism)
- [Color Reproduction/Matching](#color-reproductionmatching)
  * [Additive Color](#additive-color)
  * [Additive Color Mathing Experiment](#additive-color-mathing-experiment)
    + [Basis](#basis)
    + [CIE Color Matching Experiment](#cie-color-matching-experiment)
    + [CIE Color Matching Functions](#cie-color-matching-functions)
  * [Color Reproduction with Mathcing Functions](#color-reproduction-with-mathcing-functions)
- [Color Spaces](#color-spaces)
  * [Standard Color Spaces](#standard-color-spaces)
  * [A universal Color Space: CIE XYZ](#a-universal-color-space-cie-xyz)
  * [Seperating Luminance, Chromaticity](#seperating-luminance-chromaticity)
  * [CIE Chromaticily Diagram](#cie-chromaticily-diagram)
  * [Gamut](#gamut)
- [Perceptually Organized Color Space](#perceptually-organized-color-space)
  * [HSV Color Space (Hue-Saturation-Value)](#hsv-color-space-hue-saturation-value)
  * [CIELAB Space (AKA *L*a*b*)](#cielab-space-aka-lab)
    + [Opponent Color Theory](#opponent-color-theory)
- [CMYK: A Substractive Color Space](#cmyk-a-substractive-color-space)
- [References](#references)

---

# Summary
+ Basis
    - Spectral Power Distribution (SPD)
    - Retianl Photoreceptor Cells: Rods and Cones
    - CIE Color Matching Functions
    - Gamut (色域)
+ Color Space
    - sRGB: 直观
    - XYZ：色域光
    - HSV：方便调色 
    - CMYK：减色系统， 适合打印

# Physical Basis of Color
## The fundamentals of light
Newton showed sunlight can be subdivided into a rainbow with a prism

Resulting light cannot be further subdivided with a second prism

![1683795613118-7b93be14-3109-4f05-9ea5-1b729f93c301.png](./img/u4B69j8D3pxtgnzb/1683795613118-7b93be14-3109-4f05-9ea5-1b729f93c301-206373.png)

## The Visible Spectrum of Light
为什么光线可以被折射成不同的颜色？不同波长对应不同折射率。

光谱：光线的能量在不同波长上的分布。

可见光谱范围：400nm到700nm

![1683795549032-5159303b-6051-459e-aedb-fe1da691c4bf.png](./img/u4B69j8D3pxtgnzb/1683795549032-5159303b-6051-459e-aedb-fe1da691c4bf-528531.png)

## Spectral Power Distribution (SPD)
SPD，谱功率密度用来描述光在各个波长的分布是多少。

Salient property in measuring light

+ The amount of light present at each wavelength
+ Units:
    - radiometric units / nanometer (e.g. watts / nm)
    - Can also be unit-less
+ Often use "relative units" scaled to maximum wavelength for comparison across wavelengths when absolute units are not important

### Examples
#### Daylight Spectral Power Distributions Vary
蓝天和日光的SPD不同

![1683795881651-6588fe7e-199a-4643-aa46-f96f039c71c2.png](./img/u4B69j8D3pxtgnzb/1683795881651-6588fe7e-199a-4643-aa46-f96f039c71c2-424940.png)

#### Spectral Power Distribution of Light Sources
下图中，日光灯和LED灯的SPD就不同

![1683795960385-b2ade650-71a1-4d7f-942d-c9426b614fc1.png](./img/u4B69j8D3pxtgnzb/1683795960385-b2ade650-71a1-4d7f-942d-c9426b614fc1-660826.png)

### Linearity of Spectral Power Distributions
直接对两个光的SPD求和，得到混合光的SPD

 ![1683796100084-ddcab1d9-373e-4b61-858d-9f8a4f827ccf.png](./img/u4B69j8D3pxtgnzb/1683796100084-ddcab1d9-373e-4b61-858d-9f8a4f827ccf-065770.png)

## What is Color?
颜色和人的感知有关，并不直接是光谱

+ Color is a phenomenon of **human perception**; it is not a universal property of light
+ Different wavelengths of light are not "colors"

# Biological Basis of Color
## Anatomy of the Human Eye
人眼就是一个相机：

+ 瞳孔：光圈
+ 晶状体：透镜。通过肌肉调节焦距。
+ 传感器：视网膜。

![1683796292988-4c68de94-2291-4c7d-9ed3-7833d960a891.png](./img/u4B69j8D3pxtgnzb/1683796292988-4c68de94-2291-4c7d-9ed3-7833d960a891-673630.png)

## Retianl Photoreceptor Cells
### Rods and Cones
Photoreceptor Cells: 感光细胞。根据形状分为两类：

+ Rods：棒状细胞，用于感知光线强度。通过Rods可以得到一个灰度图。
+ Cone：锥形细胞，用于感知颜色。数量少很多。分为三类：
    - S。Peak response at **short** wavelengths
    - M。Peak response at **medium** wavelengths
    - L。Peak response at **long** wavelengths

![1683796533571-934bc097-eb01-48e1-b9cd-4cdcd93adfd3.png](./img/u4B69j8D3pxtgnzb/1683796533571-934bc097-eb01-48e1-b9cd-4cdcd93adfd3-059975.png)

![1683796604577-bb723caf-a417-4516-a74b-e02dbb80dd88.png](./img/u4B69j8D3pxtgnzb/1683796604577-bb723caf-a417-4516-a74b-e02dbb80dd88-411527.png)

### Fraction of Three Cone Cell Types Varies Widely
![1683797726369-074e5009-acad-4b9a-9cf9-ad0fa6cbbeef.png](./img/u4B69j8D3pxtgnzb/1683797726369-074e5009-acad-4b9a-9cf9-ad0fa6cbbeef-464971.png)

### Spectral Response of Human Cone Cells
结合SPD做积分

![1683797802938-03a109e5-36b8-4a67-b9de-f5e3636b44f9.png](./img/u4B69j8D3pxtgnzb/1683797802938-03a109e5-36b8-4a67-b9de-f5e3636b44f9-092968.png)

###  The Human Visual System
+ Human eye does not measure and brain does not receive information about each wavelength of light
+ Rather, the eye "sees" only three response values (S, M, L), and this is only info available to brain

![1683798023384-5d1cebab-f20e-4c67-8984-c8686d45bd6c.png](./img/u4B69j8D3pxtgnzb/1683798023384-5d1cebab-f20e-4c67-8984-c8686d45bd6c-089510.png)

# Metamerism
同色异谱。人看到的同样的颜色来自不同的光谱。



Metamers

对于两个颜色，不要求光谱一样，只要求看起来颜色一样就可。

Metamers are two different spectra (∞-dim) that project to the same (S,M,L) (3-dim) response.

+ These will appear to have the same color to a human

The existence of metamers is critical to color reproduction

+ **Don't have to reproduce the full spectrum of a real world scene**
+ Example: A metamer can reproduce the perceived color of a real-world scene on a display with pixels of only three colors



下图左右光谱不通，但积分后人感知到的颜色基本相同

![1683798300255-e1b60b3e-47e1-49c4-86e2-147a84dfc31b.png](./img/u4B69j8D3pxtgnzb/1683798300255-e1b60b3e-47e1-49c4-86e2-147a84dfc31b-644492.png)

拍的照片和显示器上显示的照片，光谱不同，看起来颜色相同。

![1683798348295-004b3926-f52a-4b14-b632-c93c1826182f.png](./img/u4B69j8D3pxtgnzb/1683798348295-004b3926-f52a-4b14-b632-c93c1826182f-467893.png)

# Color Reproduction/Matching
## Additive Color
我们认为计算机的成像系统是加色系统。

绘画中，颜色越加越黑，是减色系统。

![1683798724867-dceebed6-523b-40d8-9875-c7f8da2cfbc9.png](./img/u4B69j8D3pxtgnzb/1683798724867-dceebed6-523b-40d8-9875-c7f8da2cfbc9-292861.png)

## Additive Color Mathing Experiment
### Basis
![1683798793622-168b0f58-2be6-4061-b912-a0435f29f70a.png](./img/u4B69j8D3pxtgnzb/1683798793622-168b0f58-2be6-4061-b912-a0435f29f70a-379346.png)

有些颜色可以直接加出来

![1683798837923-7fed568a-d9c8-41d3-81de-e1a37b5c9a98.png](./img/u4B69j8D3pxtgnzb/1683798837923-7fed568a-d9c8-41d3-81de-e1a37b5c9a98-847126.png)

![1683798826694-b8b808b5-0a09-453e-a063-30ccf2342d21.png](./img/u4B69j8D3pxtgnzb/1683798826694-b8b808b5-0a09-453e-a063-30ccf2342d21-144100.png)

有些颜色不可以直接加出来（加色系统只能加，不能减）。但可以通过左边加一个颜色得到。

![1683798901625-6c54e32b-0b83-4e65-b498-6393932f504f.png](./img/u4B69j8D3pxtgnzb/1683798901625-6c54e32b-0b83-4e65-b498-6393932f504f-212537.png) 

![1683798927448-9c818089-674b-425d-bd2e-d2f1c05be0ba.png](./img/u4B69j8D3pxtgnzb/1683798927448-9c818089-674b-425d-bd2e-d2f1c05be0ba-962085.png)

### CIE Color Matching Experiment
CIE是一个组织名

用三种单色光，混合得到测试光。

![1683799065650-5dd431cf-0276-4dd8-89a1-67fd3f4b4544.png](./img/u4B69j8D3pxtgnzb/1683799065650-5dd431cf-0276-4dd8-89a1-67fd3f4b4544-018349.png)

### CIE Color Matching Functions 
如何混合不同单色光，来得到某一颜色（波长）的光： 在改波长位置画一条竖线取交点。

注意改函数只能表达如何通过混合得到**单色**光。

![1683799204277-32349787-0899-49e4-96df-93ff5bda607b.png](./img/u4B69j8D3pxtgnzb/1683799204277-32349787-0899-49e4-96df-93ff5bda607b-788990.png)

## Color Reproduction with Mathcing Functions
给定任意颜色光谱，如何做匹配？ 

上面实验只是如何匹配单色光。如何匹配任何SPD的光？

给定任意颜色，都可以用这么多的红绿蓝来表示。=》这里和平常讲的rgb系统不同 

![1683799378174-23652885-808a-4816-af4f-ad931aa83cdf.png](./img/u4B69j8D3pxtgnzb/1683799378174-23652885-808a-4816-af4f-ad931aa83cdf-154608.png)



# Color Spaces
## Standard Color Spaces
Standardized RGB (sRGB). 简称RGB.

+ makes a particular monitor GB standard
+ other color devices simulate that monitor by calibration
+ widely adopted today
+ gamut (色域) is limited. sRGB能表示的颜色是有限的。

## A universal Color Space: CIE XYZ
科学中比较常用

人造的颜色系统，颜色匹配函数是虚拟的不是通过实验测得的。

和sRGB的区别仅在于匹配函数。

Y：一定程度上代表颜色的亮度。

![1683800092682-695dbd91-f35e-43ee-983c-c36e68e21096.png](./img/u4B69j8D3pxtgnzb/1683800092682-695dbd91-f35e-43ee-983c-c36e68e21096-011891.png)

## Seperating Luminance, Chromaticity
可视化XYZ系统能表达的颜色范围（色域）。

1. 先归一化。目的：不必可视化X/Y/Z三个变量，只需可视化x/y/z中的两个（x+y+z=1, 确定两个后，剩下一个也就确定了）。
2. 接着，固定Y，可视化x和y。Y变大变小并不影响可视化后的色域颜色的分布，只影响亮度而已。

![1683800330640-1431cf50-f3bf-4dff-8a6b-ff772bb32351.png](./img/u4B69j8D3pxtgnzb/1683800330640-1431cf50-f3bf-4dff-8a6b-ff772bb32351-354112.png)

## CIE Chromaticily Diagram
边缘处颜色最纯，中间颜色最不纯（白色）

![1683814354167-4a2ecc3f-010a-4380-9cff-dea49b9bc45f.png](./img/u4B69j8D3pxtgnzb/1683814354167-4a2ecc3f-010a-4380-9cff-dea49b9bc45f-052387.png)

## Gamut
色域

+ Gamut is the set of chromaticities generated by a set of color primaries
+ Different color spaces represent different ranges of colors
+ So they have different gamuts, i.e. they cover different regions on the chromaticity diagram

sRGB能表达的颜色空间较小



![1683814537227-157a6642-2593-4f6a-96c6-8cd46c3d7823.png](./img/u4B69j8D3pxtgnzb/1683814537227-157a6642-2593-4f6a-96c6-8cd46c3d7823-523225.png)





# Perceptually Organized Color Space
## HSV Color Space (Hue-Saturation-Value)
HSV是给艺术家们定义的

Hue：色调，不同类型的颜色

Saturation：饱和度，更接近白色还是更接近颜色本身的纯色。越饱和越接近纯色。

Value：亮度，决定偏黑还是偏这个颜色。

![1683814961390-fe3df892-e71d-4383-b85f-1e36ce3e7bc7.png](./img/u4B69j8D3pxtgnzb/1683814961390-fe3df892-e71d-4383-b85f-1e36ce3e7bc7-035249.png)

## CIELAB Space (AKA *L*a*b*)
LAB空间也和感知有关

LAB认为任何一个轴的两端为互补色



L：亮度。0时为黑，100时为白。

a和b是两对互补色

a：红-绿 

b：蓝-黄



![1683815019746-15c8b034-9e68-41ec-afa0-571b6443a079.png](./img/u4B69j8D3pxtgnzb/1683815019746-15c8b034-9e68-41ec-afa0-571b6443a079-063074.png)

### Opponent Color Theory
There's a good neurological basis for the color space dimensions in CIELAB

+ the brain seems to encode color early on using three axes:
    - white- black, red- green, yellow - blue
+ the white-black axis is lightness; the others determine hue and saturation 
+ one piece of evidence: you can have a light green, a dark green, a yellow-green, or a blue-green, but you can't have a reddish green (just doesn't make sense)
    - thus red is the opponent to green
+ another piece of evidence: afterimages (following slides)

人眼的视觉暂留现象可以观察到互补色。

人感知颜色是相对的

![1683818520372-c2408130-b1ba-418d-bd6c-6e82a8765744.png](./img/u4B69j8D3pxtgnzb/1683818520372-c2408130-b1ba-418d-bd6c-6e82a8765744-647098.png)![1683818541095-69491027-b2d2-40d1-9216-296745d6f184.png](./img/u4B69j8D3pxtgnzb/1683818541095-69491027-b2d2-40d1-9216-296745d6f184-478187.png)

![1683818506711-923041fd-a77f-4761-b39c-b090d9c3118f.png](./img/u4B69j8D3pxtgnzb/1683818506711-923041fd-a77f-4761-b39c-b090d9c3118f-883509.png)![1683818474136-6704e5cb-c613-4ad7-b6ff-46e039f54b96.png](./img/u4B69j8D3pxtgnzb/1683818474136-6704e5cb-c613-4ad7-b6ff-46e039f54b96-140807.png)

# CMYK: A Substractive Color Space
减色系统，颜色越混越黑。

典型的减色系统：CMYK系统

Cyan 蓝绿色, Magenta 品红色, Yello 黄色, Key 黑色

打印机墨水，越混越黑

本来CMY三个就够了，之所以加上K（黑色）是考虑到打印成本：黑色墨水比较便宜，直接拿来用比混用更节省成本

![1683818605512-633e0f7e-2fa1-41bd-adbb-d51a93c5699f.png](./img/u4B69j8D3pxtgnzb/1683818605512-633e0f7e-2fa1-41bd-adbb-d51a93c5699f-334564.png)







# References
+ [Lecture 20 Color and Perception_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=20&vd_source=a637826c55b409b420b4b6584a6e8379)



> 更新: 2023-05-11 15:32:45  
> 原文: <https://www.yuque.com/viruspc/el3mi0/oh8n20aceedkwtpw>