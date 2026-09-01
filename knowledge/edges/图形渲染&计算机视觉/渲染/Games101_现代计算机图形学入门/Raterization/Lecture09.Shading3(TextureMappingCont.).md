# Lecture 09. Shading 3 (Texture Mapping Cont.)

- [Summary](#summary)
- [Barycentric coordinates (重心坐标)](#barycentric-coordinates-%E9%87%8D%E5%BF%83%E5%9D%90%E6%A0%87)
- [![1673580701254-11479014-7732-4644-a253-352f548ba4d2.png](./img/wUjE88pIvvLfspzr/1673580701254-11479014-7732-4644-a253-352f548ba4d2-353093.png)](#1673580701254-11479014-7732-4644-a253-352f548ba4d2pngimgwuje88pivvlfspzr1673580701254-11479014-7732-4644-a253-352f548ba4d2-353093png)
- [Texture anti-aliasing](#texture-anti-aliasing)
  * [Texture query](#texture-query)
  * [Texture Magnufication (texure is too small)](#texture-magnufication-texure-is-too-small)
    + [Nearest](#nearest)
    + [Bilinear](#bilinear)
    + [Bicubic](#bicubic)
  * [Texture Magnification (texture is too large)](#texture-magnification-texture-is-too-large)
    + [Supersampling](#supersampling)
    + [Mipmap](#mipmap)
    + [Anisotropic Filtering （Ripmap）](#anisotropic-filtering-ripmap)
    + [EWA filtering](#ewa-filtering)
- [Applications of textures](#applications-of-textures)
  * [Environment Lighting](#environment-lighting)
    + [Spherical map](#spherical-map)
    + [Cube map](#cube-map)
  * [Affect Shading](#affect-shading)
    + [Bump Mapping](#bump-mapping)
      - [How to perturb the normal (in flatland)](#how-to-perturb-the-normal-in-flatland)
      - [How to perturb the normal (in 3D)](#how-to-perturb-the-normal-in-3d)
    + [Displacement mapping](#displacement-mapping)
    + [![1682694265518-981c4161-2dc0-48a8-a2ea-fced258535f6.png](./img/wUjE88pIvvLfspzr/1682694265518-981c4161-2dc0-48a8-a2ea-fced258535f6-794496.png)](#1682694265518-981c4161-2dc0-48a8-a2ea-fced258535f6pngimgwuje88pivvlfspzr1682694265518-981c4161-2dc0-48a8-a2ea-fced258535f6-794496png)
  * [3D Procedual Noise + Solid Modeling](#3d-procedual-noise--solid-modeling)
  * [Provide Precomputed Shading](#provide-precomputed-shading)
  * [3D Textures and Volume rendering](#3d-textures-and-volume-rendering)
- [References](#references)

---

# Summary
1. 重心坐标
    1. 三维三角面的三个顶点得属性插值需要用重心坐标来做。(Perspetive-Correct-Interpolation)
    2. opengl渲染管线中不同顶点间自动采用重心坐标插值。
2. 纹理反走样
    1. 纹理太小会导致查询坐标非整数
        1. 插值
    2. 纹理过大可能会引起更严重的问题(同时存在摩尔纹和锯齿）
    3. 反走样
        1. supersampling(SSMA)。局限性：计算量和存储空间需求大。
        2. mipmap。加速纹理查询(纹理过大，一个pixel对应多个texel时)；通过逐步降采样来近似超采样的结果来反走样（插值解决锯齿，多级+插值解决摩尔纹，多层之间插值解决lod断层）。局限性：ovetblur，远处都糊掉。
        3. ripmap（各向异性过滤）。宽高非等比变化，比 Mipmap 效果更好。占用空间是mipmap的三倍。局限性：对于横着或竖着的长条形很有效，但对斜着的长条形效果仍然不好。
        4. SSMA是增加采样频率，后两者是采样前模糊，以实现反走样。（参考第六章）
3. 纹理应用
    1. **texture = memory + range query (filtering)**
        1. Environment lighting
        2. Bump mapping （凹凸贴图）
        3. Displacement mapping （位移贴图）
        4. Procedual textures
        5. Solid modeling
        6. Provide precompted shading
        7. Volume rendering

# Barycentric coordinates (重心坐标)
Interpolation Across Triangles

Why do we want to interpolate

+ Specify values at vertices. 对三角形顶点的任意属性，在三角内插值
+ Obtain smoothly varying values across triangles

What do we want to interpolate

+ Texture coordinates, colors, normal vectors, ...

只要一个点在ABC所围成的面上，面上任意一点都可以用这三个点的组合来表达。这个组合被称为重心坐标。

# ![1673580701254-11479014-7732-4644-a253-352f548ba4d2.png](./img/wUjE88pIvvLfspzr/1673580701254-11479014-7732-4644-a253-352f548ba4d2-353093.png)
重心坐标还可以通过面积来表达:

![1674396447135-d1c49860-f0ac-4760-8dd3-031bced23293.jpeg](./img/wUjE88pIvvLfspzr/1674396447135-d1c49860-f0ac-4760-8dd3-031bced23293-185392.jpeg)

三角形重心的重心坐标:

![1674396696575-92bc3c1c-8581-4142-a326-74dd02fab543.jpeg](./img/wUjE88pIvvLfspzr/1674396696575-92bc3c1c-8581-4142-a326-74dd02fab543-059175.jpeg)

任意一点的重心坐标计算公式:

![1674396816710-181d166a-fbfb-4d6d-8e8b-bc3996cacaa1.jpeg](./img/wUjE88pIvvLfspzr/1674396816710-181d166a-fbfb-4d6d-8e8b-bc3996cacaa1-207602.jpeg)

利用重心坐标做插值以及重心坐标在投影下存在的问题: 先投影再根据投影后的顶点所计算的重心坐标是错误的(投影前三维，投影后变二维，这少的一个纬度带来了误差)。

对于3d三角图元的贴图（或其他3d需要插值的属性），直接在vertex shader里设置颜色，然后直接利用pipeline自带插值过程进行插值得到的结果是正确的！这是因为opengl自动采用重心坐标插值。

![1684258447353-73746688-8461-4517-b72f-072db14f9d75.jpeg](./img/wUjE88pIvvLfspzr/1684258447353-73746688-8461-4517-b72f-072db14f9d75-244582.jpeg)



对于删格化后的每个像素，找到像素中心点，做逆变换变回三维空间，而后计算重心坐标进行插值。



**总之，3d三角形图元的属性，应该利用重心坐标做插值！**

![1674396942362-05e076b2-0282-4c9e-89b2-3f8b15fe38d2.jpeg](./img/wUjE88pIvvLfspzr/1674396942362-05e076b2-0282-4c9e-89b2-3f8b15fe38d2-232430.jpeg)



# Texture anti-aliasing
## Texture query
如何使用texture？

计算重心坐标，插值后得到uv，再从texture里查属性

![1674401752093-f9094b00-f802-4118-a568-fceb647b4ffe.jpeg](./img/wUjE88pIvvLfspzr/1674401752093-f9094b00-f802-4118-a568-fceb647b4ffe-696232.jpeg)

## Texture Magnufication (texure is too small)
What if texture is too small?

当查询所给的坐标不是整数，如何得到他的值？我们希望得到的值连续一点。

![1674402042755-d177e8c6-1379-40bd-887c-0822f5ee7261.jpeg](./img/wUjE88pIvvLfspzr/1674402042755-d177e8c6-1379-40bd-887c-0822f5ee7261-936636.jpeg)

### Nearest
取最近的一个texel

### Bilinear
双线性插值

取周围四个点

![1674402408627-21b99ce5-5ba6-4758-b377-0e2de2fabd1a.jpeg](./img/wUjE88pIvvLfspzr/1674402408627-21b99ce5-5ba6-4758-b377-0e2de2fabd1a-521176.jpeg)

![1674402410027-a326de0f-51a9-4ee3-9b30-8c772f70af0f.jpeg](./img/wUjE88pIvvLfspzr/1674402410027-a326de0f-51a9-4ee3-9b30-8c772f70af0f-119859.jpeg)

![1674402546429-2879200e-7ab3-43d6-b3c0-eef43349b374.jpeg](./img/wUjE88pIvvLfspzr/1674402546429-2879200e-7ab3-43d6-b3c0-eef43349b374-091721.jpeg)

![1674402623561-c6ed97ea-5aee-4b87-8fea-fbd570344447.jpeg](./img/wUjE88pIvvLfspzr/1674402623561-c6ed97ea-5aee-4b87-8fea-fbd570344447-106067.jpeg)

### Bicubic
取周围十六个点。比起bilinear效果更好，计算量更大。



## Texture Magnification (texture is too large)
What if the texture is too large?

纹理大会引起更严重的问题！



什么问题？走样问题。对于包含大量重复图案的texture，上采样产生锯齿，下采样（常简称为采样）产生摩尔纹。对于简单不重复图案一般只产生锯齿。



产生原因？

从几何到渲染的流程：

1. 连续几何 =第一次采样=> texture
2. texture =texture query（第二次采样）=> 具体像素的颜色

远处一个像素覆盖多个texel，近处多个像素才对应一个texel。远处产生摩尔纹是因为图案密集且第二次采样率太低（第二次采样是下采样）。近处产生锯齿是因为第二次采样频率高于第一次采样频率（第二次采样是上采样），不产生摩尔纹是因为近处图案不那么密集。

所以，当texture太小时，会放大第一次采样的问题，出现锯齿。当texture太大时，不仅有着第一次采样导致的走样问题，还会叠加第二次采样的走样问题，走样两次，所以问题更严重。



![1674403222233-04af940f-245b-492c-ae01-5a5c11d20ceb.jpeg](./img/wUjE88pIvvLfspzr/1674403222233-04af940f-245b-492c-ae01-5a5c11d20ceb-853507.jpeg)

![1674403521964-42f3390c-3647-4484-a7ff-c4bf9bfa4eee.jpeg](./img/wUjE88pIvvLfspzr/1674403521964-42f3390c-3647-4484-a7ff-c4bf9bfa4eee-891019.jpeg)



### Supersampling
可以在一定程度上解决问题，但计算量和存储空间需求非常大。

属于第六讲中的第一种反走样方法：增加采样频率。

![1674438900138-6c2c085b-5e3f-4ca8-a563-bcdbc96fc650.png](./img/wUjE88pIvvLfspzr/1674438900138-6c2c085b-5e3f-4ca8-a563-bcdbc96fc650-107950.png)



Will supersampling work?

+ Yes, high quality, but costly
+ When highliy minified, many texels in pixel footprint
+ Signal frequency too large in a pixel
+ Need even higher sampling frequency

超采样可以增加第一次采样的采样率。

可以实现反走样：

+ 显然，细节更丰富，物体更平滑，可以抗锯齿。
+ 细节更丰富，可以捕捉更多物体细节。降采样时更加平滑，更不容易出现摩尔纹。



### Mipmap
从另一个角度理解问题，采样会引起走样，那我们不采样呢？

上采样时，texel<pixel，pixel在texture上的footprint较大。一个pixel覆盖多个texel，只取一个texel是不够的，会产生摩尔纹现象。此时，一个pixel的颜色应该综合多个texel得到。可以取平均。

通过降采样模拟supersampling的结果。属于第六讲中的第二种反走样方法：采样前先模糊。

之前nearest/supersampling都是在做point query， 这里从 point query 转向 range query.

一个pixel对应texture上的一块区域。我们希望给出一个区域，立刻知道区域中的**平均值**是多少。

Mipmap可以加速的范围查询并求均值的过程。Mipmap allowing (fast, approx., square) range queries.  快的，近似的，正方形的范围查询。

![1674467049288-71416d0b-bbe0-44ed-bdf8-008149e3e801.png](./img/wUjE88pIvvLfspzr/1674467049288-71416d0b-bbe0-44ed-bdf8-008149e3e801-499285.png)

由无穷级数可以求得，多出1/3的存储空间



computing Mipmap Level D:

1. 确定要查询的的屏幕空间范围（方形）
2. 范围映射到uv空间，用一个方形来近似映射后的范围（考虑到3d面利用重心坐标投影的过程，像素上的正上方/正右方的点在三维面的纹理上并不一定还是正上方/正右方）。映射后方形的边长为L。
3. 在 log_2(L)层级mipmap上做查询

![1674473321629-e432259b-86b2-47ed-a612-7f7f75adc0bd.png](./img/wUjE88pIvvLfspzr/1674473321629-e432259b-86b2-47ed-a612-7f7f75adc0bd-925074.png)



存在的问题：同一张图片，不同远近的地方采用不同级别的mipmap，这些地方的交接处会发生颜色不连续的问题。

解决方案：可以查非整数层的mipmap：在两层mipmap之间做三线性插值。开销不大，两次范围查询加一次插值而已。

![1674473748429-4b3f476f-e69a-455a-b0c0-b9918adf0abc.png](./img/wUjE88pIvvLfspzr/1674473748429-4b3f476f-e69a-455a-b0c0-b9918adf0abc-779374.png)

Mipmap的局限性：Overlur。 远处都糊掉。因为查询方块/三线性插值等都是在做近似

![1674474077116-9e0d1d3d-d779-4fc6-a41d-6ac57a0e174b.png](./img/wUjE88pIvvLfspzr/1674474077116-9e0d1d3d-d779-4fc6-a41d-6ac57a0e174b-001569.png)

### Anisotropic Filtering （Ripmap）
各向异性过滤。比 Mipmap 效果更好。

各向异性是指，宽高两个方向上表现不同。

![1674474192168-fa7d38ab-f62d-4208-bf99-35f660aa9a64.png](./img/wUjE88pIvvLfspzr/1674474192168-fa7d38ab-f62d-4208-bf99-35f660aa9a64-110389.png)



比mipmap多了非宽高等比例缩放的部分。mipmap只有途中主对角线的图像。

Ripmaps and summed area tables

+ Can look up axis-aligned rectangular zones
+ Diagonal frootprints still a problem

![1674474356525-71e642d7-effe-439f-a9bc-9bb40cfee1d5.png](./img/wUjE88pIvvLfspzr/1674474356525-71e642d7-effe-439f-a9bc-9bb40cfee1d5-929814.png)



为什么比mipmap多出来的这些图使得效果更好？

对于下图中 texture space上的一些查询范围，mipmap必须用正方形来做近似，而各向异性过滤可以用宽高非等比的长条形来做近似。

仍然存在的问题：各项异性过滤，对于横着或竖着的长条形很有效，但对斜着的长条形效果仍然不好。

![1674474512555-04fae1a8-c3e9-4ec8-98c3-c65f811aedfc.png](./img/wUjE88pIvvLfspzr/1674474512555-04fae1a8-c3e9-4ec8-98c3-c65f811aedfc-097670.png)

### EWA filtering
各项异性过滤相对mipmap做了一些改进，但仍然存在问题：但对斜着的长条形效果仍然不好。

解决方案方案：

+ Use multiple lookups
+ Weighted average
+ Mipmap hierarchy still helps
+ Can handle irregular footprints



采用多个圆形而不是单个矩形做查询范围的近似。

![1674474874034-30762978-4a43-43b2-97a1-8b2907e824c0.png](./img/wUjE88pIvvLfspzr/1674474874034-30762978-4a43-43b2-97a1-8b2907e824c0-127173.png)





# Applications of textures
In modern GPUs, texture = memory + range query (filtering)

+ General method to bring data to fragment calculations



## Environment Lighting
Environment map借助texture存储下任意方向的**环境光**，用来做渲染。

蕴含一个假设：环境光无限远，不考虑光源距离。

![1682691425840-d5dc0d1b-114c-43f8-8020-38822cf15ed7.png](./img/wUjE88pIvvLfspzr/1682691425840-d5dc0d1b-114c-43f8-8020-38822cf15ed7-052824.png)

所有方向的环境光的两种描述方式：spherical map 和 cube map。

### Spherical map
environment map怎么来的？在屋子里放上一个非常光滑的球，球反射出的东西就是完整的环境光。

![1682691691026-61b6a524-df4d-4f84-8d29-251dfff1db20.png](./img/wUjE88pIvvLfspzr/1682691691026-61b6a524-df4d-4f84-8d29-251dfff1db20-285246.png)

把环境光记录在球上，然后展开存储在texture里。这种被称为spherical environment map。

![1682691897729-d33e1dfb-0838-4c2d-ae58-56a45b4f32bc.png](./img/wUjE88pIvvLfspzr/1682691897729-d33e1dfb-0838-4c2d-ae58-56a45b4f32bc-483401.png)

Spherical map 展开时遇到的问题：distortion，扭曲，特别是上面和下面

![1682691988156-1660f8b5-0956-4325-bf4a-641b881e9c30.png](./img/wUjE88pIvvLfspzr/1682691988156-1660f8b5-0956-4325-bf4a-641b881e9c30-398731.png)

### Cube map
减少了spherical map的distortion问题

![1682692172763-ff23ae1b-002a-4ed6-8ff2-8b5b017287fe.png](./img/wUjE88pIvvLfspzr/1682692172763-ff23ae1b-002a-4ed6-8ff2-8b5b017287fe-534551.png)

![1682692234735-a8faef65-7ce4-470b-bbdc-e2906084a6bf.png](./img/wUjE88pIvvLfspzr/1682692234735-a8faef65-7ce4-470b-bbdc-e2906084a6bf-276051.png)

引入新的问题：想要某一个方向的光照时，球体可以很容易得到，而立方体需要先判断光线记录在哪一个面上。虽然多了额外的计算，但这计算过程非常快。

## Affect Shading
besides colors, textures can also represent

+ height/normal (沿着法线方向存在一定高度)
+ bump/normal mapping (凹凸/法线贴图)
+ fake the detailed geometry (不把几何形体变复杂的前提下，通过应用一个复杂纹理，使得法线变复杂，产生凹凸效果 e.g. )

存相对高度或直接重新定义法线。

**Add surface detail without adding more triangles**

![1682692608709-e474505d-e5cd-4bcd-b807-e2bf3490dcbd.png](./img/wUjE88pIvvLfspzr/1682692608709-e474505d-e5cd-4bcd-b807-e2bf3490dcbd-643435.png)

### Bump Mapping
**Add surface detail without adding more triangles**

![1682693692036-5dd0d673-2605-447c-a93c-0cdacede5b27.png](./img/wUjE88pIvvLfspzr/1682693692036-5dd0d673-2605-447c-a93c-0cdacede5b27-019428.png)

#### How to perturb the normal (in flatland)
先利用凹凸贴图上相邻点找切线，再利用切线求法线

假设原本法线朝上：

![1682693895774-54478247-71c3-4c24-9c71-89f13adb2bee.png](./img/wUjE88pIvvLfspzr/1682693895774-54478247-71c3-4c24-9c71-89f13adb2bee-658548.png)

#### How to perturb the normal (in 3D)
注意是局部坐标：假设原本法线都是（0, 0, 1）。法线使用前注意做坐标变换。

![1682694179449-733f2d3a-db68-4530-b263-890ab10928fc.png](./img/wUjE88pIvvLfspzr/1682694179449-733f2d3a-db68-4530-b263-890ab10928fc-488262.png)

### Displacement mapping
比起bump mapping更现代化的做法，位移贴图

不移动法线高度，而是真的移动顶点，

解决了凹凸贴图存在的两个问题：1. 边缘光滑 2. 自己的阴影无法投影到自己

引入的问题：要求模型本身三角形顶点足够细。希望模型能完整的反应纹理定义的高度变化，要求贴图跟的上模型三角形的变化速度，要求三角形的变化频率大于贴图变化频率。

DirectX的做法：Dynamic  tessellation，动态曲面细分。开始先用粗糙的模型+凹凸贴图，然后在应用位移贴图的过程中检测是否需要把三角形变得更小更细。

### ![1682694265518-981c4161-2dc0-48a8-a2ea-fced258535f6.png](./img/wUjE88pIvvLfspzr/1682694265518-981c4161-2dc0-48a8-a2ea-fced258535f6-794496.png)
## 3D Procedual Noise + Solid Modeling
前面都假定纹理是二维的，然而，纹理也可以是三维的（定义了3维空间每一点的属性。例如，图中把球砍一半也可以看到颜色）。

三维贴图通过三维空间的噪声函数来定义。贴图里存的是procedure（程序）。

图中两个例子采用了perlin noise，这一噪声函数也可用于山脉。

![1682695005603-2353e566-5412-4db3-adc5-e8ba092df044.png](./img/wUjE88pIvvLfspzr/1682695005603-2353e566-5412-4db3-adc5-e8ba092df044-190453.png)

## Provide Precomputed Shading
Simple shading 没考虑 Ambient occlusion（环境光遮蔽，比如眉骨会投影到眼睛上侧）

提前计算好ambient occulsion， 然后与simple shading想加

![1682695394734-5d1a0c77-59ed-40ec-b1bd-8a3c1415a4c3.png](./img/wUjE88pIvvLfspzr/1682695394734-5d1a0c77-59ed-40ec-b1bd-8a3c1415a4c3-898637.png)

## 3D Textures and Volume rendering
![1682695918903-58385341-d8a2-41fc-aa40-dcff680d9b2a.png](./img/wUjE88pIvvLfspzr/1682695918903-58385341-d8a2-41fc-aa40-dcff680d9b2a-696880.png)

# References
+ [How do mipmapping, anti-aliasing and anisotropic filtering contribute to rendering quality?](https://gamedev.stackexchange.com/questions/100985/how-do-mipmapping-anti-aliasing-and-anisotropic-filtering-contribute-to-renderi)
+ [Lecture 09 Shading 3 (Texture Mapping Cont.)_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=9&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [Lecture 10 Geometry 1 (Introduction)_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=10&vd_source=a637826c55b409b420b4b6584a6e8379)

[细说图形学渲染管线](https://zhuanlan.zhihu.com/p/79183044)



> 更新: 2023-05-16 17:34:32  
> 原文: <https://www.yuque.com/viruspc/el3mi0/foyrm10dwlq1f8ug>