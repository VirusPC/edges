# Ray Tracing (Light Transport and Global Illumination)

- [Summary](#summary)
- [Light Transport](#light-transport)
  * [Bidirectional Reflectance Distribution Function(BRDF)](#bidirectional-reflectance-distribution-functionbrdf)
    + [Reflection at a Point](#reflection-at-a-point)
  * [The Reflection Equation](#the-reflection-equation)
    + [Challenge Recursive Equation](#challenge-recursive-equation)
  * [The Rendering Equation](#the-rendering-equation)
  * [Limitations](#limitations)
- [Global Illumination](#global-illumination)
  * [Understanding the Rendering Equation](#understanding-the-rendering-equation)
  * [Integral Equation](#integral-equation)
  * [Linear Operator Equation](#linear-operator-equation)
  * [Ray Tracing and Extensions](#ray-tracing-and-extensions)
  * [Example Result](#example-result)
- [References](#references)

---

# Summary
本章核心：渲染方程

在考虑到反射/折射的情况下，光是如何弹射的，光线的能量是如何传播的，一个着色点上的不同源的光是如何累加的。

+ Light transport
    - BRDF。 定义反射的函数
    - The reflection equation. 考虑所有入射方向的光，结合BRDF作反射。
    - The rendering equation. Reflection equation 加上能量产生的一项。(只考虑上半球面，暂不考虑折射和散射)
        * 自身发出的radiance+所有角度的（入射radiance * 对应入射方向和反射方向的BRDF * cos(入射角)）
        * ![1683269936139-3cebace7-1137-47b3-8cd4-9e5863682e6c.png](./img/5OksXzii6zoKrLUz/1683269936139-3cebace7-1137-47b3-8cd4-9e5863682e6c-047374.png)
+ Global Illumination
    - ![1683208010097-fc55d79f-7296-4a13-80da-ab0db116de74.png](./img/5OksXzii6zoKrLUz/1683208010097-fc55d79f-7296-4a13-80da-ab0db116de74-511128.png)
    - 把光线的传播拆成多次
    - 最后会收敛



# Light Transport
## Bidirectional Reflectance Distribution Function(BRDF)
双向反射分布函数

### Reflection at a Point
用radiance理解反射是什么

BRDF定义了从一个方向进来的能量，如何分散到不同反射方向

一个表面对不同的光线入射角和反射角的组合，拥有不同的反射率。BRDF就是用来对这种反射性质进行定义的。

光线能量从一个方向进来，被物体吸收；然后物体再把能量从其他方向释放出去。

irradiance进来，转化成radiance后再出去

Radiance from direction w; turns into the power E that dA receives. Then power E will become the radiance to any other direction Wo

下图中，E代表irradiance，L代表radiance（luminance）,w代表单位立体角，x代表点

![1683173411769-2cc8dbab-b0cc-443c-8bee-561810ac4882.png](./img/5OksXzii6zoKrLUz/1683173411769-2cc8dbab-b0cc-443c-8bee-561810ac4882-567427.png)

The Bidirectional Reflectance Distribution Function (BRDF) represents how much light is reflected into each outgoing direction Wr from each incoming direction

![1683176649370-75749170-0f89-4882-a3c9-9342b994781f.png](./img/5OksXzii6zoKrLUz/1683176649370-75749170-0f89-4882-a3c9-9342b994781f-414533.png)

不同的材质有不同的BRDF

## The Reflection Equation
对一个着色点，把每个方向入射的光的irradiance，根据BRDF和出射方向（摄像机方向）加起来

![1683178699626-d7cc1ee3-93fb-4923-b5f2-13e4f1305d8b.png](./img/5OksXzii6zoKrLUz/1683178699626-d7cc1ee3-93fb-4923-b5f2-13e4f1305d8b-165605.png)

### Challenge Recursive Equation
需要考虑能够到达这个着色点的所有光线。不仅需要考虑光源的光线，还要考虑其他物体反射的光线。

![1683178966545-60e3fe56-86b6-42bc-8e3b-56c939f86491.png](./img/5OksXzii6zoKrLUz/1683178966545-60e3fe56-86b6-42bc-8e3b-56c939f86491-286236.png)

## The Rendering Equation
渲染方程/绘制方程

出射的光（radiance）有两种：自己发的光，反射的别人的光。(暂不考虑折射和散射)

同时考虑这两种光，直接把它们加起来，得到渲染方程。

H^2和Ω都表示半球（下半球看不到光）

![1683179167402-73b4ed48-710f-40bd-907e-0f89dc5a2ef4.png](./img/5OksXzii6zoKrLUz/1683179167402-73b4ed48-710f-40bd-907e-0f89dc5a2ef4-727158.png)

## Limitations
<font style="color:rgb(32, 33, 34);">Although the equation is very general, it does not capture every aspect of light reflection. Some missing aspects include the following:</font>

+ [Transmission](https://en.wikipedia.org/wiki/Transmission_(wave_propagation))<font style="color:rgb(32, 33, 34);">, which occurs when light is transmitted through the surface, such as when it hits a </font>[glass](https://en.wikipedia.org/wiki/Glass)<font style="color:rgb(32, 33, 34);"> object or a </font>[water](https://en.wikipedia.org/wiki/Water)<font style="color:rgb(32, 33, 34);"> surface, (只考虑上半球面)</font>
+ [Subsurface scattering](https://en.wikipedia.org/wiki/Subsurface_scattering)<font style="color:rgb(32, 33, 34);">, where the spatial locations for incoming and departing light are different. Surfaces rendered without accounting for subsurface scattering may appear unnaturally opaque — however, it is not necessary to account for this if transmission is included in the equation, since that will effectively include also light scattered under the surface,</font>
+ [Polarization](https://en.wikipedia.org/wiki/Polarization_(waves))<font style="color:rgb(32, 33, 34);">, where different light polarizations will sometimes have different reflection distributions, for example when light bounces at a water surface, （菲涅耳项brdf可以考虑极化）</font>
+ [Phosphorescence](https://en.wikipedia.org/wiki/Phosphorescence)<font style="color:rgb(32, 33, 34);">, which occurs when light or other</font><font style="color:rgb(32, 33, 34);"> </font>[electromagnetic radiation](https://en.wikipedia.org/wiki/Electromagnetic_radiation)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">is</font><font style="color:rgb(32, 33, 34);"> </font>[absorbed](https://en.wikipedia.org/wiki/Absorption_(electromagnetic_radiation))<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">at one moment and emitted at a later moment, usually with a longer</font><font style="color:rgb(32, 33, 34);"> </font>[wavelength](https://en.wikipedia.org/wiki/Wavelength)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">(unless the absorbed electromagnetic radiation is very intense),</font>
+ [Interference](https://en.wikipedia.org/wiki/Interference_(wave_propagation))<font style="color:rgb(32, 33, 34);">, where the wave properties of light are exhibited, （几何光学不考虑光的干涉）</font>
+ [Fluorescence](https://en.wikipedia.org/wiki/Fluorescence)<font style="color:rgb(32, 33, 34);">, where the absorbed and emitted light have different</font><font style="color:rgb(32, 33, 34);"> </font>[wavelengths](https://en.wikipedia.org/wiki/Wavelength)<font style="color:rgb(32, 33, 34);">,</font>
+ [Non-linear](https://en.wikipedia.org/wiki/Nonlinear_optics)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">effects, where very intense light can increase the</font><font style="color:rgb(32, 33, 34);"> </font>[energy level](https://en.wikipedia.org/wiki/Energy_level)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">of an</font><font style="color:rgb(32, 33, 34);"> </font>[electron](https://en.wikipedia.org/wiki/Electron)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">with more energy than that of a single</font><font style="color:rgb(32, 33, 34);"> </font>[photon](https://en.wikipedia.org/wiki/Photon)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">(this can occur if the electron is hit by two photons at the same time), and</font><font style="color:rgb(32, 33, 34);"> </font>[emission](https://en.wikipedia.org/wiki/Emission_(electromagnetic_radiation))<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">of light with higher frequency than the frequency of the light that hit the surface suddenly becomes possible, and</font>
+ [Doppler effect](https://en.wikipedia.org/wiki/Doppler_effect)<font style="color:rgb(32, 33, 34);">, where light that bounces off an object moving at a very high speed will get its wavelength changed: if the light bounces off an object that is moving towards it, the light will be</font><font style="color:rgb(32, 33, 34);"> </font>[blueshifted](https://en.wikipedia.org/wiki/Blueshift)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">and the</font><font style="color:rgb(32, 33, 34);"> </font>[photons](https://en.wikipedia.org/wiki/Photon)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">will be packed more closely so the photon flux will be increased; if it bounces off an object moving away from it, it will be</font><font style="color:rgb(32, 33, 34);"> </font>[redshifted](https://en.wikipedia.org/wiki/Redshift)<font style="color:rgb(32, 33, 34);"> </font><font style="color:rgb(32, 33, 34);">and the photon flux will be decreased. This effect becomes apparent only at speeds comparable to the</font><font style="color:rgb(32, 33, 34);"> </font>[speed of light](https://en.wikipedia.org/wiki/Speed_of_light)<font style="color:rgb(32, 33, 34);">, which is not the case for most rendering applications.</font>

<font style="color:rgb(32, 33, 34);">For scenes that are either not composed of simple surfaces in a vacuum or for which the travel time for light is an important factor, researchers have generalized the rendering equation to produce a </font>_<font style="color:rgb(32, 33, 34);">volume rendering equation</font>_[[5]](https://en.wikipedia.org/wiki/Rendering_equation#cite_note-5)<font style="color:rgb(32, 33, 34);"> suitable for </font>[volume rendering](https://en.wikipedia.org/wiki/Volume_rendering)<font style="color:rgb(32, 33, 34);"> and a </font>_<font style="color:rgb(32, 33, 34);">transient rendering equation</font>_[[6]](https://en.wikipedia.org/wiki/Rendering_equation#cite_note-6)<font style="color:rgb(32, 33, 34);"> for use with data from a </font>[time-of-flight camera](https://en.wikipedia.org/wiki/Time-of-flight_camera)<font style="color:rgb(32, 33, 34);">.</font>

# Global Illumination
**<font style="color:rgb(32, 33, 34);">Global illumination</font>**[[1]](https://en.wikipedia.org/wiki/Global_illumination#cite_note-wordpress-1)<font style="color:rgb(32, 33, 34);"> (</font>**<font style="color:rgb(32, 33, 34);">GI</font>**<font style="color:rgb(32, 33, 34);">), or </font>**<font style="color:rgb(32, 33, 34);">indirect illumination</font>**<font style="color:rgb(32, 33, 34);">, is a group of </font>[algorithms](https://en.wikipedia.org/wiki/Algorithm)<font style="color:rgb(32, 33, 34);"> used in </font>[3D computer graphics](https://en.wikipedia.org/wiki/3D_computer_graphics)<font style="color:rgb(32, 33, 34);"> that are meant to add more realistic </font>[lighting](https://en.wikipedia.org/wiki/Computer_graphics_lighting)<font style="color:rgb(32, 33, 34);"> to 3D scenes. Such algorithms take into account not only the light that comes directly from a light source (</font>_<font style="color:rgb(32, 33, 34);">direct illumination</font>_<font style="color:rgb(32, 33, 34);">), but also subsequent cases in which light rays from the same source are reflected by other surfaces in the scene, whether reflective or not (</font>_<font style="color:rgb(32, 33, 34);">indirect illumination</font>_<font style="color:rgb(32, 33, 34);">).</font>

## Understanding the Rendering Equation
点光源：

![1683204079526-5562d284-a0ec-45c7-9046-7f9e83285083.png](./img/5OksXzii6zoKrLUz/1683204079526-5562d284-a0ec-45c7-9046-7f9e83285083-914416.png)

多点光源：求和

![1683204138184-3b87707f-0fb2-4e27-a1b6-76c3c88c0b2a.png](./img/5OksXzii6zoKrLUz/1683204138184-3b87707f-0fb2-4e27-a1b6-76c3c88c0b2a-972903.png)

面光源：积分

  ![1683204157106-666d0cc3-db76-42d8-803e-7c675b00b756.png](./img/5OksXzii6zoKrLUz/1683204157106-666d0cc3-db76-42d8-803e-7c675b00b756-700629.png)

进一步考虑其他面反光到该着色点的光：

![1683204240232-28760066-759f-4fcc-bfed-123b0b46f873.png](./img/5OksXzii6zoKrLUz/1683204240232-28760066-759f-4fcc-bfed-123b0b46f873-547725.png)

## Integral Equation
两项蓝色的不知道，其他的都知道。可以简写成下式： 

![1683204333464-7c4caa2d-f186-441e-b094-f47e2a5abf51.png](./img/5OksXzii6zoKrLUz/1683204333464-7c4caa2d-f186-441e-b094-f47e2a5abf51-013220.png) 

## Linear Operator Equation
进一步简写，线性代数方程 ：

![1683204765158-a0b2b82e-1f8f-4144-b39a-ed24308f9a96.png](./img/5OksXzii6zoKrLUz/1683204765158-a0b2b82e-1f8f-4144-b39a-ed24308f9a96-237117.png) 

## Ray Tracing and Extensions
注意L是递归定义的

![1683204778173-bb4ec12d-f335-44af-bfe8-93d94b373403.png](./img/5OksXzii6zoKrLUz/1683204778173-bb4ec12d-f335-44af-bfe8-93d94b373403-784662.png)

光线多次弹射：

![1683204925358-a257af4c-65fc-44d6-b59c-30a118002780.png](./img/5OksXzii6zoKrLUz/1683204925358-a257af4c-65fc-44d6-b59c-30a118002780-173507.png)

上式所有不同弹射次数的光照加起来，就是**全局光照 **

从光栅化的角度看：

![1683205143119-8d510f4c-739d-44e5-a381-98638bc3ea98.png](./img/5OksXzii6zoKrLUz/1683205143119-8d510f4c-739d-44e5-a381-98638bc3ea98-606297.png)

## Example Result
![1683205366670-faa78d72-1540-4107-b0cb-e330948bbfc6.png](./img/5OksXzii6zoKrLUz/1683205366670-faa78d72-1540-4107-b0cb-e330948bbfc6-577792.png)

一次间接光照（两次弹射）：

![1683205381815-a8c8755d-f205-43a2-b23f-aabec412b537.png](./img/5OksXzii6zoKrLUz/1683205381815-a8c8755d-f205-43a2-b23f-aabec412b537-644049.png)

两次间接光照（三次弹射）：

![1683205396784-c993fa50-fb02-4324-b710-08ce869574f0.png](./img/5OksXzii6zoKrLUz/1683205396784-c993fa50-fb02-4324-b710-08ce869574f0-350445.png)

四次间接光照（五次弹射）：

![1683205416709-2c033473-6cab-4bd3-bf58-94df7f8d13a7.png](./img/5OksXzii6zoKrLUz/1683205416709-2c033473-6cab-4bd3-bf58-94df7f8d13a7-646726.png)

![1683205795795-ffc287f2-d224-4b1e-9253-fd8eac7db366.png](./img/5OksXzii6zoKrLUz/1683205795795-ffc287f2-d224-4b1e-9253-fd8eac7db366-959099.png)

为什么中间最上方的灯，弹射三次是黑的，弹射五次是透明的？弹射三次只够从摄像机进入物体，但出不来（玻璃本身是双层的，经过两次弹射才能进去，再经过两次才能出来）。——这里比较特殊考虑到了光的折射。

最后会收敛到某个固定亮度。

# References
+ [Lecture 15 Ray Tracing 3_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=15&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [Global Illumination](https://en.wikipedia.org/wiki/Global_illumination#:~:text=Global%20illumination%20(GI)%2C%20or,realistic%20lighting%20to%203D%20scenes.)
+ [wiki - Rendering Equation](https://en.wikipedia.org/wiki/Rendering_equation)
+ [1986 - The Rendering Equation](https://www.cs.cmu.edu/afs/cs/academic/class/15462-s13/www/lec_slides/86kajiyaRenderingEquation.pdf)



> 更新: 2023-07-08 04:49:25  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lgmlcdatupyzeb5r>