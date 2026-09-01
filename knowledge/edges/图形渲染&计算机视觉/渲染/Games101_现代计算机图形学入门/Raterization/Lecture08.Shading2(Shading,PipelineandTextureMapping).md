# Lecture 08. Shading 2 (Shading, Pipeline and Texture Mapping)

- [Summary](#summary)
- [Blinn-Phong Reflectance Model](#blinn-phong-reflectance-model)
  * [Recap: Lamberitan (Diffuse) Term](#recap-lamberitan-diffuse-term)
  * [Specular Term (Blinn-Phong)](#specular-term-blinn-phong)
    + [Phong](#phong)
  * [Ambient Term](#ambient-term)
  * [Blinn-Phong Reflection Model](#blinn-phong-reflection-model)
- [Shading Frequencies (着色频率)](#shading-frequencies-%E7%9D%80%E8%89%B2%E9%A2%91%E7%8E%87)
  * [问题引出](#%E9%97%AE%E9%A2%98%E5%BC%95%E5%87%BA)
  * [Shading each triangle (Flat shading)](#shading-each-triangle-flat-shading)
  * [Shade each vertex (Gouraud shading)](#shade-each-vertex-gouraud-shading)
  * [Shade each pixel (Phong shading)](#shade-each-pixel-phong-shading)
  * [Shading Frequency: Face, Vertex or Pixel](#shading-frequency-face-vertex-or-pixel)
  * [Defining Per-Vertex Normal Vectors](#defining-per-vertex-normal-vectors)
  * [Defining Per-Pixel Normal Vectors](#defining-per-pixel-normal-vectors)
- [Graphics (Real-time Rendering) Pipeline](#graphics-real-time-rendering-pipeline)
  * [Graphics Pipeline](#graphics-pipeline)
  * [Shader Programs](#shader-programs)
- [Texture Mapping](#texture-mapping)
  * [Texture](#texture)
  * [Interpolation Across Triangles: Barycentric Coordinates](#interpolation-across-triangles-barycentric-coordinates)
- [Blinn Phong VS Phong](#blinn-phong-vs-phong)
- [附录](#%E9%99%84%E5%BD%95)

---

# Summary
1. Blinn-Phong Reflectance Model
    1. DIffuse: Lambertian (Diffuse) Shading
        1. lambert shading只考虑入射角和法线不考虑出射角（假设颜色与出射角无关）
        2. 当光源方向与法线方向一致时，各个方向反射的颜色最深
        3. ![1727518097485-d87d0d3a-5e4e-4dc3-b412-12d868e17d2c.png](./img/yaD8bcDMM5CdwVFu/1727518097485-d87d0d3a-5e4e-4dc3-b412-12d868e17d2c-737504.png)
        4. 漫反射颜色与几个参数的关系：color = 1/ (入射角与法线夹角*距离)
        5. 从brdf的视角来看，Lambert材质的brdf为c/PI
    2. Specular
        1. phong shading 只考虑考虑入射角的镜面反射角和出射角不考虑法线；binn-phong把入射角的反射角替换为入射角，且考虑法线，更容易计算。
        2. 当视角方向v 和镜面反射方向R 相近的时候，可以看到镜面反射光。
        3. Phong比较视角方向和出射方向，存在光照不连续和计算量大的问题
        4. 为了解决上述问题，Blin-Phong比较半程向量（normalize(视角方向+入射方向)）和法向量
        5. 高光颜色与几个参数的关系：color = 1/ (（（入射角与出射角半程向量）与法线夹角） * 距离)
        6. ![1727519342019-51876543-30da-4c57-8200-640fae5ffa78.png](./img/yaD8bcDMM5CdwVFu/1727519342019-51876543-30da-4c57-8200-640fae5ffa78-106456.png)
    3. Ambient
2. Shading frequencies
    1. Flat(Face)/Gouraud(Vertex)/Phong(Pixel) shading
    2. Per-Vertex/Per-Pixel Normal Vectors
3. Graphics pipeline
    1. Vertex Processing
    2. Triangle Processing
    3. Rasterization
    4. Fragment Processing
    5. Framebuffer Operations
4. Texture



webgl代码：[https://github.com/VirusPC/webgl-test/tree/master/src/webgl2/lighting](https://github.com/VirusPC/webgl-test/tree/master/src/webgl2/lighting)

# Blinn-Phong Reflectance Model
## Recap: Lamberitan (Diffuse) Term
![1673523184864-fc5e4d63-3e42-446c-a521-9dfeb02b5724.png](./img/yaD8bcDMM5CdwVFu/1673523184864-fc5e4d63-3e42-446c-a521-9dfeb02b5724-568078.png)

![1673523280580-8998bf8b-7285-4835-bfda-b06c19719e6e.png](./img/yaD8bcDMM5CdwVFu/1673523280580-8998bf8b-7285-4835-bfda-b06c19719e6e-062108.png)

从brdf的视角来看，Lambert材质的brdf为c/PI

![1697476792718-f9518d37-4519-416a-b65f-acc069388323.png](./img/yaD8bcDMM5CdwVFu/1697476792718-f9518d37-4519-416a-b65f-acc069388323-690702.png)



## Specular Term (Blinn-Phong)
Intensity depends on view direction

+ Bright near mirror reflection direction
+ 当视角方向v 和镜面反射方向R 相近的时候，可以看到镜面反射光。
+ lambert shading只考虑入射角和法线不考虑出射角（假设颜色与出射角无关），这里考虑入射角和出射角不考虑法线。



![1673523366990-501d7072-bdaa-44bf-8808-a439fe8c048b.png](./img/yaD8bcDMM5CdwVFu/1673523366990-501d7072-bdaa-44bf-8808-a439fe8c048b-186441.png)



V close to mirror direction <=><font style="color:#DF2A3F;"> </font>**<font style="color:#DF2A3F;">half vector </font>**<font style="color:#DF2A3F;">near normal</font>

+ measure "near" by dot product of unit vectors

高光 Ks 通常认为都是白的

![1673525182319-f7ce0585-d820-46af-997f-a7660171d921.png](./img/yaD8bcDMM5CdwVFu/1673525182319-f7ce0585-d820-46af-997f-a7660171d921-295512.png)

也可以不用 n和h，直接用R和v，被称作 Phong reflection model. 

此处是n和h是Blinn-Phong reflection model的改进：n和h更好乘。R这个反射反向不好算。

为什么右上角要加个指数p？直接cos alpha拿来用，容忍度太高了，整个正面都能看到高光。通过加个指数p，降低容忍度。通常p的值取100到200.

p: shininess

![1673525902683-ffbfd1ff-a0a8-4612-9c4e-6fb91317f3a8.png](./img/yaD8bcDMM5CdwVFu/1673525902683-ffbfd1ff-a0a8-4612-9c4e-6fb91317f3a8-415328.png)



![1673525990302-eafb4fb3-af29-4691-89da-2d0af92d2416.png](./img/yaD8bcDMM5CdwVFu/1673525990302-eafb4fb3-af29-4691-89da-2d0af92d2416-632651.png)

### Phong
Phong reflection model 不用半程向量，直接用R和v 。

除了计算量大外，Phong反射模型在处理高光时会出现光照不连续的情况。我们知道高光跟观察位置密切相关，当观察方向和反射光线夹角大于90度时(如下图所示)，Phong模型会出现镜面反射分量被消除的情况，所以出现高光不连续的现象。

![1684259507838-3497f5a4-b8a7-4dcb-85c2-ff3217d3f137.jpeg](./img/yaD8bcDMM5CdwVFu/1684259507838-3497f5a4-b8a7-4dcb-85c2-ff3217d3f137-198264.jpeg)

![1684259425983-3ca1fe90-45d2-409e-bfb5-d3f23e2c04c4.jpeg](./img/yaD8bcDMM5CdwVFu/1684259425983-3ca1fe90-45d2-409e-bfb5-d3f23e2c04c4-324912.jpeg)

![1697476810242-cd3ccd9c-e0f6-4448-a4c5-bb88f059a506.png](./img/yaD8bcDMM5CdwVFu/1697476810242-cd3ccd9c-e0f6-4448-a4c5-bb88f059a506-216360.png)



## Ambient Term
Shading that does not dpend on anything 跟实际光照的方向没有任何关系。

+ Add **constant color** to acount for disregarded illumination and fill in black shadows
+ This is approximate /fake!
+ 保证没有地方完全是黑的。 不加环境光，可能会导致物体上的某些地方是全黑的。把所有地方加一个常量，提升一个亮度。
+ ![1673526406285-5e8d8dc6-dc63-468a-8551-8319fea6e40f.png](./img/yaD8bcDMM5CdwVFu/1673526406285-5e8d8dc6-dc63-468a-8551-8319fea6e40f-400599.png)



## Blinn-Phong Reflection Model


![1673526374817-e7e41d59-cba8-4629-8597-a10ef78bcff2.png](./img/yaD8bcDMM5CdwVFu/1673526374817-e7e41d59-cba8-4629-8597-a10ef78bcff2-388785.png)



# Shading Frequencies (着色频率)
## 问题引出
图中三个球体用到的面相同，而 shading frequencies 不同，导致渲染结果不同。

![1673526903139-77334ea5-cdc6-4a9e-94f7-e4f621d4dd7b.png](./img/yaD8bcDMM5CdwVFu/1673526903139-77334ea5-cdc6-4a9e-94f7-e4f621d4dd7b-513223.png)



## Shading each triangle (Flat shading)
Shading each triangle (**flat **shading)

+ Triangle face is flat - one normal vector
+ Not good for smooth surfaces

![1673535968264-bc7379e8-cbd8-4d94-b8a7-45ee3f83c8db.png](./img/yaD8bcDMM5CdwVFu/1673535968264-bc7379e8-cbd8-4d94-b8a7-45ee3f83c8db-197737.png)



## Shade each vertex (Gouraud shading)
+ Interpolate colors from vertices across triangle
+ Each vertext has a normal vector (how?)

![1673536057134-b70ede50-76e3-4a2e-bcdf-e4be0d8dbc55.png](./img/yaD8bcDMM5CdwVFu/1673536057134-b70ede50-76e3-4a2e-bcdf-e4be0d8dbc55-034399.png)

除了不够真实外，Gouraud 着色 还有一个问题，就是当我们把点光源挪近的时候，我们当然期待物体会更亮，因为靠近了，但问题是物体反而变暗了。

原因是因为我们计算的是每个顶点上面的亮度，然后根据再根据顶点来做线性插入：

![1697476526440-d1af58f8-dac2-4edf-b13c-46ceac3f5bd2.png](./img/yaD8bcDMM5CdwVFu/1697476526440-d1af58f8-dac2-4edf-b13c-46ceac3f5bd2-869078.png)



是因为点的法向量和点光源之间的角度 ɑ 会趋近于90°，然后 cos ɑ 会趋近于0，这样导致的结果是我们做线性插入会整个把三角形变暗，而不是按照点的真正的法向量和点光源之间夹角变小，变得更亮。

## Shade each pixel (Phong shading)
+ interpolate normal vectors across each triangle
+ Compute full shading model at each pixel
+ Not the Blinn-Phong Reflectance Model



![1673536216269-a5aa336c-c0e5-42ff-8088-0611aadc96a8.png](./img/yaD8bcDMM5CdwVFu/1673536216269-a5aa336c-c0e5-42ff-8088-0611aadc96a8-367397.png)



## Shading Frequency: Face, Vertex or Pixel
应采用的着色频率取决于点数

![1673536323947-c18f6981-f715-4881-954d-6bc990422ee0.png](./img/yaD8bcDMM5CdwVFu/1673536323947-c18f6981-f715-4881-954d-6bc990422ee0-295184.png)



## Defining Per-Vertex Normal Vectors
Best to get vertex normals from the underlying geometry

+ e.g. consider a sphere

![1673536561568-6673533e-ce0c-44d6-8a5c-ee74c41d0a41.png](./img/yaD8bcDMM5CdwVFu/1673536561568-6673533e-ce0c-44d6-8a5c-ee74c41d0a41-314948.png)

Otherwise have to infer vertex normals from triangle faces

+ Simple scheme: average surrounding face normals. 
+ 更复杂的会做加权平均。比如根据三角形面积设置全汇总给你



![1673536578229-c45c6283-9fcc-49d2-83bc-48c7f2cdfec8.png](./img/yaD8bcDMM5CdwVFu/1673536578229-c45c6283-9fcc-49d2-83bc-48c7f2cdfec8-695871.png)

![1673536587583-0cb5fb9c-b0b0-42a2-8d31-ec1694e097fe.png](./img/yaD8bcDMM5CdwVFu/1673536587583-0cb5fb9c-b0b0-42a2-8d31-ec1694e097fe-280091.png)



## Defining Per-Pixel Normal Vectors
Barycentric interpolation (introducing soon) of vertex normals

+ Don't forget to normalize the interpolated directions



![1673536763898-d2bfc663-0dca-4b3b-be48-f10cad1405ad.png](./img/yaD8bcDMM5CdwVFu/1673536763898-d2bfc663-0dca-4b3b-be48-f10cad1405ad-461966.png)



# Graphics (Real-time Rendering) Pipeline
## Graphics Pipeline
1. Vertex Processing: （Vertex Shader）
    1. Model, View, Projection transforms
    2. Shading (Gouraud shading，顶点如何着色)
    3. Texture mapping
2. Triangle Processing
3. Rasterization
    1. Sampling triangle coverage
4. Fragment Processing (Fragment Shader)
    1. Z-Buffer Visibility Tests (严格意义上，也是光栅化的一部分。这里分的比较细)
    2. Shading (Phong shading， 像素如何着色，像素都产生后才能做 )
    3. Texture mapping
5. Framebuffer Operations:



![1673537093585-dd9bc136-fee0-43d8-b45d-9ba2e945d54f.png](./img/yaD8bcDMM5CdwVFu/1673537093585-dd9bc136-fee0-43d8-b45d-9ba2e945d54f-395011.png)





## Shader Programs
+ Program **vertex** and **fragment** processing stages
+ Describe operation on a single vertex (or fragment)
+ shaders
    - vertex shader
    - fragment shader
    - geometry shader (new), 定义几何操作，产生更多三角形
    - compute shader (new), 不用做任何形式的计算， GPGPU

![1673537871251-a001e7bb-b819-4b8b-a2ad-f660be85397a.png](./img/yaD8bcDMM5CdwVFu/1673537871251-a001e7bb-b819-4b8b-a2ad-f660be85397a-769432.png)



# Texture Mapping
## Texture
根本目的：定义物体任意一个点的属性。

三维物体的表面是二维的 => 空间几何可以映射到二维纹理 => 三角面每个顶点都对应一个纹理处的一点

uv坐标系，一般令u/v范围都在[0, 1]内

![1673545222087-63689dc5-c14a-43ba-bc11-3e304a451011.png](./img/yaD8bcDMM5CdwVFu/1673545222087-63689dc5-c14a-43ba-bc11-3e304a451011-200794.png)

![1673545317158-08599208-3cdf-4dc2-92be-cef96f6b16f0.png](./img/yaD8bcDMM5CdwVFu/1673545317158-08599208-3cdf-4dc2-92be-cef96f6b16f0-103394.png)

![1673545467480-a490fd54-15de-4d1e-b543-2c0bd96b05b4.png](./img/yaD8bcDMM5CdwVFu/1673545467480-a490fd54-15de-4d1e-b543-2c0bd96b05b4-995133.png)



![1673545658312-80d56930-09fe-403b-a6dd-93a68c5a6afb.png](./img/yaD8bcDMM5CdwVFu/1673545658312-80d56930-09fe-403b-a6dd-93a68c5a6afb-906327.png)



## Interpolation Across Triangles: Barycentric Coordinates
如果知道三角形三个顶点对应在texture上的(u, v)，如何知道三角形内部的任何一个点对应的纹理坐标，如何在三角形内部做插值？



# Blinn Phong VS Phong
二者的区别在于高光项。

Phong模型在处理高光时会出现光照不连续的情况，会出现不自然的过渡。这是因为当观察方向和反射光线夹角大于90度时，Phong模型会出现镜面反射分量被消除的情况

BlinnPhong 使用半程向量，这样使得任何情况下镜面反射都不会小于0，解决了过渡不自然的问题

# 附录
+ [https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_reflection_model](https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_reflection_model)
+ binn phong model webgl2代码实现[https://web3d-demos.vercel.app/gallery/blinn-phong-model](https://web3d-demos.vercel.app/gallery/blinn-phong-model)
+ shading frequency的webgl代码：[https://github.com/VirusPC/webgl-test/tree/master/src/webgl2/lighting/shading-frequency](https://github.com/VirusPC/webgl-test/tree/master/src/webgl2/lighting/shading-frequency)
+ 【【老奇】阴差阳错 撼动世界的游戏引擎-哔哩哔哩】 [https://b23.tv/ApdqICW](https://b23.tv/ApdqICW)

[[从零开始计算机图形学]之十八Gouraud着色](https://zhuanlan.zhihu.com/p/64523601?utm_psn=1697420308812775425)

![1681564024866-5b698cff-1f1d-4f29-9311-4f4bf8a0b784.png](./img/yaD8bcDMM5CdwVFu/1681564024866-5b698cff-1f1d-4f29-9311-4f4bf8a0b784-449324.png)



> 更新: 2024-09-28 10:34:53  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lvabncnzpcb7z0eg>