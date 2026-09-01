# Ray Tracing (Radiometry)

- [Summary](#summary)
- [Motivation](#motivation)
- [Radiometry](#radiometry)
  * [Radiant Energy and Flux (Power)](#radiant-energy-and-flux-power)
  * [Important measures of interest](#important-measures-of-interest)
    + [Radiant Intensity](#radiant-intensity)
      - [Angles and Solid Angles](#angles-and-solid-angles)
      - [Differential Solid Angles (微分立体角)](#differential-solid-angles-%E5%BE%AE%E5%88%86%E7%AB%8B%E4%BD%93%E8%A7%92)
      - [Isotropic Point Source](#isotropic-point-source)
    + [Irradiance](#irradiance)
    + [Radiance](#radiance)
      - [Incident Radiance](#incident-radiance)
      - [Exiting Radiance](#exiting-radiance)
      - [Radiance VS Irradiance](#radiance-vs-irradiance)
- [References](#references)

---

# Summary
+ Concepts
    - **Radiant energy**
        * the energy of electromagnetic radiation
        * Symbol: _Q(e)_
        * Unit: Joule/焦耳
        * ![1683131063640-f39c6c48-c05a-430d-ba4e-e0b68ec954a7.png](./img/B5TWuGymIOFW4Cdy/1683131063640-f39c6c48-c05a-430d-ba4e-e0b68ec954a7-552307.png)
    - **Radiant flux 辐射通量**
        * energy per unit time
        * Symbol: _Φ(e)_
        * Unit: Watt/lumen/流明
        * ![1683176971109-4644c57c-8eb4-4342-b4ed-27423be72d51.png](./img/B5TWuGymIOFW4Cdy/1683176971109-4644c57c-8eb4-4342-b4ed-27423be72d51-250136.png)
    - **Radiant intensity 辐射强度**
        * power per unit solid angle
        * Symbol: _I(e,Ω)_
        * Unit: candela/坎德拉
        * ![1683131123099-18665f21-6931-4b10-90f0-6238b1df3377.png](./img/B5TWuGymIOFW4Cdy/1683131123099-18665f21-6931-4b10-90f0-6238b1df3377-225379.png)
    - **Solid Angle 立体角**
        * ratio of subtended area on sphere to radius squared
        * Symbol: _Ω_
        * ![1683131138825-c8241cde-704d-41e5-ada5-7bde7daf14fa.png](./img/B5TWuGymIOFW4Cdy/1683131138825-c8241cde-704d-41e5-ada5-7bde7daf14fa-735961.png)
    - **Irradiance 辐照度**
        * power per (**perpendicular**/projected) unit area incident on a surface point.
        * Symbol: E
        * ![1683132232789-5be6c0d6-69e6-4845-9a4a-c415c2f7cb9e.png](./img/B5TWuGymIOFW4Cdy/1683132232789-5be6c0d6-69e6-4845-9a4a-c415c2f7cb9e-347481.png)
    - **Radiance/Luminance  辐射或辐亮度**
        * The radiance (luminance) is the power emitted, reflected, transmitted or received by a surface, per unit solid angle, per projected unit area.
        * Symbol: L(e,Ω)
        * ![1683177530998-cde5e6d2-49c3-4c03-82b6-439d0d2f9a08.png](./img/B5TWuGymIOFW4Cdy/1683177530998-cde5e6d2-49c3-4c03-82b6-439d0d2f9a08-185176.png)![1683177556011-39c0f7e0-cbf1-4d63-840b-25ee4883c602.png](./img/B5TWuGymIOFW4Cdy/1683177556011-39c0f7e0-cbf1-4d63-840b-25ee4883c602-013790.png)![1683177575765-19c233dd-f8ee-40c3-8850-ae275c2824fb.png](./img/B5TWuGymIOFW4Cdy/1683177575765-19c233dd-f8ee-40c3-8850-ae275c2824fb-351079.png)

# Motivation
精准地描述光这一物理量

也是 Path Tracing 的基础

# Radiometry
Measurement system and units for illumination。如何描述光照。

+ Accurately measure the spatial properties of light 只考虑光的空间属性，不考虑时间属性
+ 仍然是是基于几何光学来做的（满足三条性质：光沿直线传播，光不相交，光的可逆性）

New terms: Radiant flux(辐射通量), intensity, irradiance, radiance

## Radiant Energy and Flux (Power)
Definition: **Radiant energy** is the energy of electromagnetic radiation. It is measured in units of joules, and denoted by the symbol:

![1683109156112-12b89cfd-f281-4857-bb35-5536625e66a3.png](./img/B5TWuGymIOFW4Cdy/1683109156112-12b89cfd-f281-4857-bb35-5536625e66a3-709961.png) (J=焦耳)

Definition: **Radiant flux** (power，有时称为能量，实际不是能量，而是单位时间能量) is the energy emitted, reflected, transmitted or received, per unit time.

![1683109229868-00248683-0a43-45ba-af2d-5b19737108a7.png](./img/B5TWuGymIOFW4Cdy/1683109229868-00248683-0a43-45ba-af2d-5b19737108a7-715264.png)（W=瓦特, lm=流明）

从另一个角度讲，flux（通量）也是单位时间内通过一个平面的能量

![1683109444731-51b6634b-8062-41a9-bc1e-3c4456b015dd.png](./img/B5TWuGymIOFW4Cdy/1683109444731-51b6634b-8062-41a9-bc1e-3c4456b015dd-851449.png)

## Important measures of interest
![1683109695254-45edb644-d7d0-4f57-923b-0410e73d6c22.png](./img/B5TWuGymIOFW4Cdy/1683109695254-45edb644-d7d0-4f57-923b-0410e73d6c22-835502.png)

### Radiant Intensity
Defination：The** radiant (luminous) intensity **is the power per **unit solid angle** (立体角) emitted by a point light source 

均匀点光源： intensity = 流明除以4PI

![1683109732260-c5bc0c53-fb57-479c-8a31-22e2e9e11609.png](./img/B5TWuGymIOFW4Cdy/1683109732260-c5bc0c53-fb57-479c-8a31-22e2e9e11609-731009.png)

#### Angles and Solid Angles
angle（弧度）：弧长除以半径。半径为1的整个圆弧度为2PI

solid angle (立体角)：弧度在三维的扩展：球面面积除以半径的平方。半径为1的整个球面面积为4PI



![1683110180787-4309795b-a99b-487a-ad38-be5a5523f06a.png](./img/B5TWuGymIOFW4Cdy/1683110180787-4309795b-a99b-487a-ad38-be5a5523f06a-476282.png)

#### Differential Solid Angles (微分立体角)
![1683110605927-c58ab135-c024-4384-8c5e-5a8364f2ddd9.png](./img/B5TWuGymIOFW4Cdy/1683110605927-c58ab135-c024-4384-8c5e-5a8364f2ddd9-169928.png)

![1683110631715-b65b1393-efc5-478e-bc60-4a890644fa72.png](./img/B5TWuGymIOFW4Cdy/1683110631715-b65b1393-efc5-478e-bc60-4a890644fa72-157441.png)

#### Isotropic Point Source
均匀点光源 intensity和距离无关

![1683110731125-2bfdd84c-5268-4df6-afae-d0fbefb7ec40.png](./img/B5TWuGymIOFW4Cdy/1683110731125-2bfdd84c-5268-4df6-afae-d0fbefb7ec40-262726.png)

### Irradiance
Definition: The **irradiance** is the power per (**perpendicular**/projected) unit area incident on a surface point.

与intensity作区分。intensity是power per unit solid angle

光落在一个表面上的能量

![1683131953111-d1e835fd-9f23-467b-a3bc-107c5700b30e.png](./img/B5TWuGymIOFW4Cdy/1683131953111-d1e835fd-9f23-467b-a3bc-107c5700b30e-482537.png)

衰减的是Irradiance

![1683132315628-874a0e8d-adae-4a2d-9e52-dadf08f4a4ab.png](./img/B5TWuGymIOFW4Cdy/1683132315628-874a0e8d-adae-4a2d-9e52-dadf08f4a4ab-627432.png)

### Radiance
光沿光线传播的能量

Radiance is the fundamental field quantity that describes the distribution of light in an environment

+ Radiance is the quantity associated with a ray
+ Rendering is all about computing radiance



Definition: The **radiance (luminance)** is the power emitted, reflected, transmitted or received by a surface, **per unit solid angle**, **per projected unit area**.

两次微分。单位立体角+单位面积。某一个确定的微小的面和某一个确定的方向

![1683132580617-c1e60a4e-df43-4b45-8fd7-71990673b7c0.png](./img/B5TWuGymIOFW4Cdy/1683132580617-c1e60a4e-df43-4b45-8fd7-71990673b7c0-043209.png)

Recall

+ Irradiance: power per projected unit area
+ Intensity: power per solid angle

So

+ Radiance: Irradiance per solid angle
+ Radiance: Intensity per projected unit area

#### Incident Radiance
从radiance角度解释irridiance

入射方向的irridiance

![1683133062624-3e0ff3ff-691d-4c81-8348-075d4cedd10f.png](./img/B5TWuGymIOFW4Cdy/1683133062624-3e0ff3ff-691d-4c81-8348-075d4cedd10f-785223.png)

#### Exiting Radiance
从intensity角度解释irridiance

![1683133267451-2f57c90e-39bc-4681-98f7-6bbc5171fa76.png](./img/B5TWuGymIOFW4Cdy/1683133267451-2f57c90e-39bc-4681-98f7-6bbc5171fa76-733462.png)

#### Radiance VS Irradiance
Irradiance: total power received by area dA

Radiance: power received by area dA from "direction" dw

![1683133523391-99ee6802-7cca-44b4-9478-2f3a389edfa9.png](./img/B5TWuGymIOFW4Cdy/1683133523391-99ee6802-7cca-44b4-9478-2f3a389edfa9-019436.png)  

# References
+ [Lecture 14 Ray Tracing 2_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744/?p=14&vd_source=a637826c55b409b420b4b6584a6e8379)





> 更新: 2023-07-08 04:54:31  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gk4lv415pr2oahxy>