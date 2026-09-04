# Cameras, Lenses and Light Fields

- [Summary](#summary)
- [What's Happening Inside Camera?](#whats-happening-inside-camera)
  * [Pinholes & Lenses From Image on Sensor](#pinholes--lenses-from-image-on-sensor)
  * [Pinhole Image Formulation](#pinhole-image-formulation)
- [Field of View (FOV)](#field-of-view-fov)
  * [Effect of Focal Length on FOV](#effect-of-focal-length-on-fov)
  * [Effects of Sensor Size on FOV](#effects-of-sensor-size-on-fov)
  * [Sensor Sizes](#sensor-sizes)
  * [Maintain FOV on Smaller Sensor?](#maintain-fov-on-smaller-sensor)
- [Exposure](#exposure)
  * [Introduction](#introduction)
  * [Exposure Controls in Photography](#exposure-controls-in-photography)
  * [Aperture, Shutter, Gain(ISO)](#aperture-shutter-gainiso)
  * [ISO (Gain)](#iso-gain)
  * [F-Number (F-Stop): Exposure Levels](#f-number-f-stop-exposure-levels)
  * [Shutter](#shutter)
    + [Physical Shutter](#physical-shutter)
    + [Side Effect of Shutter Speed](#side-effect-of-shutter-speed)
  * [Constant Exposure](#constant-exposure)
  * [Fast and Slow Photography](#fast-and-slow-photography)
- [Thin Lens Approximation](#thin-lens-approximation)
  * [The Thin Lens Equation](#the-thin-lens-equation)
  * [Defocus Blur](#defocus-blur)
    + [Circle of Confusion](#circle-of-confusion)
    + [Revisiting F-number (aka. F-stop)](#revisiting-f-number-aka-f-stop)
      - [Example of F-stop calculations](#example-of-f-stop-calculations)
    + [Size of CoC is Inversely Propotional to F-Stop](#size-of-coc-is-inversely-propotional-to-f-stop)
  * [Ray Tracing Idea Thin Lenses](#ray-tracing-idea-thin-lenses)
    + [Examples of Rendering with Lens Focus](#examples-of-rendering-with-lens-focus)
    + [Ray Tracing for Defocus Blur (Thin Lens)](#ray-tracing-for-defocus-blur-thin-lens)
  * [Depth of Field](#depth-of-field)
    + [Circle of Confusion for Depth of Field](#circle-of-confusion-for-depth-of-field)
    + [Depth of Field(FYI)](#depth-of-fieldfyi)
- [Light Field/Lumigraph](#light-fieldlumigraph)
  * [The Plenoptic Function](#the-plenoptic-function)
    + [Grayscale snapshot](#grayscale-snapshot)
    + [Color Snapshot](#color-snapshot)
    + [A movie](#a-movie)
    + [Holographic movie](#holographic-movie)
    + [The Plenoptic Function](#the-plenoptic-function-1)
    + [Sampling Plenoptic Function (top view)](#sampling-plenoptic-function-top-view)
  * [Light Field/Lumigarph](#light-fieldlumigarph)
    + [Ray](#ray)
      - [Only need Plenoptic Surface](#only-need-plenoptic-surface)
    + [Synthesizing Novel Views](#synthesizing-novel-views)
    + [Lunigraph/Light FIeld](#lunigraphlight-field)
    + [Lunigraph-Organization](#lunigraph-organization)
  * [Light Field Camera](#light-field-camera)
    + [Stanford Camera Array](#stanford-camera-array)
    + [Itegral Images ("Fly's Eye" Lenslets)](#itegral-images-flys-eye-lenslets)
      - [The Lytro Light Field Camera](#the-lytro-light-field-camera)
    + [Light Field Camera](#light-field-camera-1)
- [References](#references)

---

# Summary
Imaging = Synthesis + Capture

+ Camera
    - 对于传感器上的一个点，记录的是irradiance。
    - 针孔相机 VS 透镜相机：针孔相机没有深度的概念，远处没有虚化的地方，都是实的。
+ FOV（Field of View，视场）
    - 一般认为传感器大小为36*24mm。在此基础上，根据透镜距离传感器的距离（也是焦距）来间接定义FOV
    - ![1683790476558-fba0308f-26b6-48d8-9d9e-0d72e392b820.png](./img/a9tEKfXFO2k0Y0Od/1683790476558-fba0308f-26b6-48d8-9d9e-0d72e392b820-614613.png)h：传感器宽（高）度，f：焦距
    - ![1683790420598-4e5c6ef8-5381-47b9-a5e4-91e93bea8a7f.png](./img/a9tEKfXFO2k0Y0Od/1683790420598-4e5c6ef8-5381-47b9-a5e4-91e93bea8a7f-579392.png)
    - 买相机，机身（传感器）越大越好，镜头（焦距）越长越好
+ Exposure（曝光度）
    - Exposure = time x irradiance 
        * Exposure time (T)
            + Controlled by **shutter**
        * Irradiance (E)
            + Power of light falling on a unit area of sensor
            + Controlled by lens **aperture** (光圈) and **focal len**
    - Photography 中 Exposure 的控制
        * F-Number (F-Stop)。
            + **控制irradiance。**
            + f-number = 焦距 / 光圈半径
            + 写作 FN 或 F/N. N是 f-number。如: F2，F/2
            + F数越小，Aperture（光圈）越大。
            + 光圈大小会带来side effect：Defocus Blur (散焦模糊) ——Circle of Confusion。光圈越大CoC越严重；F number越小CoC越严重。
        * Shutter。
            + **控制exposure time。**
            + 用分数表示。单位秒。如：1/8
            + 快门下落过程带来的两个side effect：Motion bluer（运动模糊） 和 Rolling shutter（果冻效应）
        * ISO Gain。
            + **放大irradiance。**
            + 如：ISO 400
            + irradiance扩大相应倍数。增大ISO会放大噪声的程度。
    - Fast and Slow Photography
        * 高速摄影：Normal exposure extremely fast shutter speed x (large aperture and/or high ISO)
        * 延时摄影：与高速摄影相反
+ Thin Lens Approximatin
    - Thin lens equation: ![1683792252544-c8a0c7d6-ab0a-4c94-8bcf-e9b87c3cce66.png](./img/a9tEKfXFO2k0Y0Od/1683792252544-c8a0c7d6-ab0a-4c94-8bcf-e9b87c3cce66-842637.png) f：焦距，zi：相距，zo：物距
    - Defocus Blur (散焦模糊) 
        * CoC, Circle of Confusion. 在光学中，CoC是在对点光源成像时，由于透镜发出的光线锥没有完全聚焦而造成的光点。
        * 光圈缩小到一点时，不存在CoC —— 小孔成像不存在深度概念，所有地方都清晰。
        * Circle of Confusion的大小代表着图像中defocus blur的程度。 较大的CoC将导致更明显的defocus blur，而较小的CoC将导致不太明显的defocus blur。
        * CoC 大小与光圈成正比，与 F-Stop成反比。![1683792571887-bedb1181-f902-4f71-8cda-937722cb2742.png](./img/a9tEKfXFO2k0Y0Od/1683792571887-bedb1181-f902-4f71-8cda-937722cb2742-037839.png)
    - Ray Tracing for Defocus Blur 
    - Depth of Field（FYI，景深）。
        * 成像清晰的一段范围。
        * 景深通过CoC来定义，与CoC大小阈值有关。
        * 景深是场景中的某一段深度，使得光线经过透镜到达成像平面附近后，在这个深度范围内CoC都比较小。
+ Light Field/Lumigraph （光场）
    - The plenoptic function![1683793038103-80a44c09-e4d4-4c52-9a3c-e319b3dfd6db.png](./img/a9tEKfXFO2k0Y0Od/1683793038103-80a44c09-e4d4-4c52-9a3c-e319b3dfd6db-154473.png)
    - 光场是物体在任何一个位置往任何一个方向去的函数
    - 可以用uv平面和st平面两个平面来定义任何一个光场。两个平面分别取一点相连就是一道光。
    - 通过光场，用户可以知道从任意方向观测物体的结果。 
    - Light field camera: 把每个像素替换成一个透镜，把经过透镜的不同方向的光区分开再记录下来。
        * 取不同方向的光线，就像是虚拟移动摄像机的位置。
        * 作用：支持后期重新聚焦。（Computational Refocusing）
        * 问题：1）分辨率不足。对相片的分辨率要求高。2）制造成本高。

# What's Happening Inside Camera?
![1683464896889-f39bd4dd-f18e-4749-9574-ad064d55d36e.png](./img/a9tEKfXFO2k0Y0Od/1683464896889-f39bd4dd-f18e-4749-9574-ad064d55d36e-275064.jpg)

## Pinholes & Lenses From Image on Sensor
针孔相机和透镜相机都可以拍照。





![1683464941291-8ab0d43b-dfbf-4901-8b75-3cab9596949a.png](./img/a9tEKfXFO2k0Y0Od/1683464941291-8ab0d43b-dfbf-4901-8b75-3cab9596949a-006861.jpg)



![1683465111000-84bae38d-e6ed-42ce-b7cc-11443263e751.png](./img/a9tEKfXFO2k0Y0Od/1683465111000-84bae38d-e6ed-42ce-b7cc-11443263e751-180039.jpg)

![1683465083774-7903273e-ec1d-41bc-8a83-f432d8acda54.png](./img/a9tEKfXFO2k0Y0Od/1683465083774-7903273e-ec1d-41bc-8a83-f432d8acda54-827809.png)

对于传感器上的一个点，记录的是irradiance。一般认为现在的传感器记录不了radiance。

![1683465163481-c0279b77-e34a-4a02-a535-abb6541e76dd.png](./img/a9tEKfXFO2k0Y0Od/1683465163481-c0279b77-e34a-4a02-a535-abb6541e76dd-114577.png)

## Pinhole Image Formulation 
针孔相机没有深度的概念，远处没有虚化的地方，都是实的。

# Field of View (FOV)
## Effect of Focal Length on FOV
焦距决定视场

（h，竖直方向，正常只考虑竖直方向）

![1683465489766-9bd060b9-3464-460c-85a2-846f174c2dec.png](./img/a9tEKfXFO2k0Y0Od/1683465489766-9bd060b9-3464-460c-85a2-846f174c2dec-959791.png)

一般认为传感器大小为36*24mm

+ 17mm是广角镜头
+ FOV越小，看的越远

对于手机，所谓的焦距参数也是以36*24mm为基准，来描述FOV



![1683465940260-e72bf08e-a1ce-4200-b979-6401933fad8f.png](./img/a9tEKfXFO2k0Y0Od/1683465940260-e72bf08e-a1ce-4200-b979-6401933fad8f-082050.png)



![1683466105852-7563635c-f0d9-4e04-aa85-491fcce9d6e4.png](./img/a9tEKfXFO2k0Y0Od/1683466105852-7563635c-f0d9-4e04-aa85-491fcce9d6e4-272758.jpg)

## Effects of Sensor Size on FOV
![1683466163957-a3f4b13f-aec1-428f-8225-398f23cc8f29.png](./img/a9tEKfXFO2k0Y0Od/1683466163957-a3f4b13f-aec1-428f-8225-398f23cc8f29-332905.jpg)



传感器（sensor）和胶片（film）不一样，但经常混淆用

## Sensor Sizes
买相机，机身越大越好，镜头越长越好

![1683466331882-58fa7088-faf7-4eac-b697-6076fbf9bfc2.png](./img/a9tEKfXFO2k0Y0Od/1683466331882-58fa7088-faf7-4eac-b697-6076fbf9bfc2-616474.png)

## Maintain FOV on Smaller Sensor?
![1683466442671-ab15c59e-1e56-48db-a55f-92ba4ca9b23c.png](./img/a9tEKfXFO2k0Y0Od/1683466442671-ab15c59e-1e56-48db-a55f-92ba4ca9b23c-598055.jpg)

# Exposure
## Introduction
曝光度

H= TxE  快门按的时间越长，结果越亮

+ Exposure = time x irradiance
+ Exposure time (T)
    - Controlled by shutter
+ Irradiance (E)
    - Power of light falling on a unit area of sensor
    - Controlled by lens aperture (光圈) and focal length

## Exposure Controls in Photography
+ Aperture size
    - 光圈大小
    - 光圈最大大小为镜头大小
    - 仿生学设计，人的瞳孔在黑暗时会放大，接收更多的光；在明亮时会缩小，保护眼睛。
    - 有的相机可通过f-stop来调节大小 Change the f-stop by opening / closing the aperture (if camera has iris control)
+ Shutter speed
    - 快门速度
    - Change the duration the sensor pixels integrate light
+ ISO gain 
    - ISO 增益/感光度
    - 后处理。后期给光乘个数 
    - Change the amplification (analog and/or digital) between sensor values and digital image values

## Aperture, Shutter, Gain(ISO)
+ 第一行，光圈大小。F数越小，光圈越大。（欧洲把点写成逗号）
+ 第二行，快门速度。用分数表示，开放多少时间，单位秒。
+ 第三行，ISO。乘以的数。增大ISO，也会放大噪声的程度。简单放大信号会同时放大噪声。

![1683467148972-a47a8442-4b1b-4965-91fa-1cc43562829a.png](./img/a9tEKfXFO2k0Y0Od/1683467148972-a47a8442-4b1b-4965-91fa-1cc43562829a-251216.jpg)

## ISO (Gain)
Third variable for exposure

Film: trade sensitivity for grain

Digital: trade sensitivity for noise

+ Multiply signal before analog-to-digital conversion
+ Linear effect (ISO 200 needs half the light as ISO 100)

![1683467646108-d1502bc1-48e6-43d6-97d6-c95131f3acae.png](./img/a9tEKfXFO2k0Y0Od/1683467646108-d1502bc1-48e6-43d6-97d6-c95131f3acae-476863.jpg)

## F-Number (F-Stop): Exposure Levels
更专业的摄像领域会区分F Number和F Stop.

The f-number of a lens is defined as <font style="color:#DF2A3F;">the focal length divided by the diameter of the aperture</font>

Written as FN or F/N. N is the f-number. 

焦距不变的情况下，N越大，直径越小。

inform understanding: the inverse-diameter of a round aperture.

![1683467801984-1efe8cc4-72bd-4cfb-810a-d005afc122eb.png](./img/a9tEKfXFO2k0Y0Od/1683467801984-1efe8cc4-72bd-4cfb-810a-d005afc122eb-270936.jpg)

## Shutter
### Physical Shutter
一开始，有个镜子挡在最前面，

然后，镜子翻起，

然后，快门会突然落下来，

然后，一个挡板再落下挡住快门

然后，镜子翻下来

下图为快门落下过程。这个过程会造成一定影响

![1683468056746-530e3ab6-327b-4e52-8c7d-fb02dfbecd31.png](./img/a9tEKfXFO2k0Y0Od/1683468056746-530e3ab6-327b-4e52-8c7d-fb02dfbecd31-926057.jpg)

### Side Effect of Shutter Speed
两个side effect：Motion blur 和 Rolling shutter



**Motion blur**(运动模糊): handshake, subject movement.

在快门打开的过程中，物体发生运动，产生运动模糊。

更长的曝光时间会产生更严重的运动模糊。

![1683468326901-e55650f9-fcfc-4fc9-8cf4-02b90ad58104.png](./img/a9tEKfXFO2k0Y0Od/1683468326901-e55650f9-fcfc-4fc9-8cf4-02b90ad58104-805572.jpg)

Note: motino blur is not always bad!

比如，赛车游戏中，运动模糊会让人觉得快

![1683468483041-2e63a1ff-d443-4441-933f-cf0f49afb1ec.png](./img/a9tEKfXFO2k0Y0Od/1683468483041-2e63a1ff-d443-4441-933f-cf0f49afb1ec-620733.jpg)

**Rolling shutter（果冻效应）**: different parts of photo taken at different times

![1683468678342-aefd4556-3abd-473a-9314-3bfefccec1c2.png](./img/a9tEKfXFO2k0Y0Od/1683468678342-aefd4556-3abd-473a-9314-3bfefccec1c2-329344.jpg)

## Constant Exposure
两两组合可以达到相同的曝光度

![1683468843274-d2dccfd8-f94a-441e-8777-3553e4ca7b56.png](./img/a9tEKfXFO2k0Y0Od/1683468843274-d2dccfd8-f94a-441e-8777-3553e4ca7b56-478973.png)

曝光度相同，得到的图片相同吗？No。

光圈会引起景深问题，曝光度会引起运动模糊问题。

## Fast and Slow Photography
高速摄影

![1683468963550-c9fa3b20-608d-4ae4-8df8-9f6090fa45d4.png](./img/a9tEKfXFO2k0Y0Od/1683468963550-c9fa3b20-608d-4ae4-8df8-9f6090fa45d4-912073.jpg)

延时摄影：

![1683469045793-230ba778-6ddf-4f9b-8788-8a35bcac8b6a.png](./img/a9tEKfXFO2k0Y0Od/1683469045793-230ba778-6ddf-4f9b-8788-8a35bcac8b6a-436077.jpg)



# Thin Lens Approximation
现实中用一组透镜来做成像

![1683469270505-b81b0cda-9434-4c5b-9cdf-89ce5a049bb6.png](./img/a9tEKfXFO2k0Y0Od/1683469270505-b81b0cda-9434-4c5b-9cdf-89ce5a049bb6-321143.png)

现实中的透镜并不理想

![1683469301378-09ef5699-ada3-4b2c-99fb-232a3e014ef7.png](./img/a9tEKfXFO2k0Y0Od/1683469301378-09ef5699-ada3-4b2c-99fb-232a3e014ef7-567683.png)

理想的透镜，光线会聚焦到一点：

透镜组共同表现为一个可以改变焦距的透镜。

![1683469385543-bce3aa40-5a8a-4296-a6d7-418f850ab5c4.png](./img/a9tEKfXFO2k0Y0Od/1683469385543-bce3aa40-5a8a-4296-a6d7-418f850ab5c4-509706.jpg)

## The Thin Lens Equation
f: 焦距

z_o: 物距

z_i: 相距

guaussian thin lens equation: 1/f = 1/z_o + 1/z_i

平行光过焦点；过焦点的光会变成平行光



![1683469470209-48bba1e8-6721-418d-920d-82285d59df59.png](./img/a9tEKfXFO2k0Y0Od/1683469470209-48bba1e8-6721-418d-920d-82285d59df59-105990.png)

![1683470332845-a9227e32-ff49-4c87-9137-0e6bc2d89bc9.png](./img/a9tEKfXFO2k0Y0Od/1683470332845-a9227e32-ff49-4c87-9137-0e6bc2d89bc9-990681.png)

## Defocus Blur
薄透镜可以解释景深问题

Defocus Blur (散焦模糊) 是指物体没有聚焦时发生的模糊。 当镜头没有正确聚焦在拍摄对象上，或者景深太浅时，就会发生这种情况。

### Circle of Confusion
In optics, a circle of confusion (CoC) is an optical spot caused by a cone of light rays from a lens not coming to a perfect focus when imaging a point source.



Circle of Confusion的大小代表着图像中defocus blur的程度。 较大的CoC将导致更明显的defocus blur，而较小的CoC将导致不太明显的defocus blur。



Focal Plane: 当物体放在focal plane上时，sensor plane上成像最清晰。

Image: Object 最锐利的成像平面。可根据Thin Lens Equation算出。

若物体不在Focal Plane，会模糊。

图中，一点（Object）放在比focal plane更远的地方，会成像成一个圆，这个圆被称为Circle of confusion。

CoC的大小和透镜本身的大小成正比。光圈越大，CoC越大。

当光圈缩小到一点时，不存在CoC —— 小孔成像不存在深度概念，所有地方都清晰。

![1683470551384-1da21c4a-d288-4186-a056-1ffed134ed4f.png](./img/a9tEKfXFO2k0Y0Od/1683470551384-1da21c4a-d288-4186-a056-1ffed134ed4f-390188.png)

### Revisiting F-number (aka. F-stop)
+ Formal definition: The f-number of a lens is defined as <font style="color:#DF2A3F;">the focal length divided by the diameter of the aperture</font>
+ Common f-stops on real lenses: 1.4, 2, 2.8, 4.0, 5.6, 8, 11, 16, 22, 32
+ An f-stop of 2 is sometimes written f/2, reflecting the fact that the absolute aperture diameter (A) can be computed by dividing focal length (f) by the relative aperture (N).

#### Example of F-stop calculations
f数，光圈的实际大小D与焦距f的关系。

![1683642848931-87195f65-6a00-4605-b98c-541340945cba.png](./img/a9tEKfXFO2k0Y0Od/1683642848931-87195f65-6a00-4605-b98c-541340945cba-077399.png)

### Size of CoC is Inversely Propotional to F-Stop
![1683642984938-699080f6-b850-4830-af98-188a906ae55e.png](./img/a9tEKfXFO2k0Y0Od/1683642984938-699080f6-b850-4830-af98-188a906ae55e-765344.png)

## Ray Tracing Idea Thin Lenses
### Examples of Rendering with Lens Focus
![1683643087883-4b72a02b-5846-493c-b764-4c6e0fb0358e.png](./img/a9tEKfXFO2k0Y0Od/1683643087883-4b72a02b-5846-493c-b764-4c6e0fb0358e-052044.png)

### Ray Tracing for Defocus Blur (Thin Lens)
![1683643706167-abf42fd4-2a41-4508-8320-21dfa5f43c8e.png](./img/a9tEKfXFO2k0Y0Od/1683643706167-abf42fd4-2a41-4508-8320-21dfa5f43c8e-513455.png)

![1683643967534-f49ad319-a365-405f-8d6d-e686aa840ecb.png](./img/a9tEKfXFO2k0Y0Od/1683643967534-f49ad319-a365-405f-8d6d-e686aa840ecb-806056.png)

渲染时，如何确定每个像素的颜色？

+ 像素向透镜均匀地射出多条光线，累加所有光线的能量。
    - 根据lens equation来得到折射的光线

![1683644027117-ee3b0b08-a72e-49b2-9308-496f9c948e83.png](./img/a9tEKfXFO2k0Y0Od/1683644027117-ee3b0b08-a72e-49b2-9308-496f9c948e83-127168.png)

## Depth of Field
用defocus blur来定义depth of field (景深)

![1683644289216-a031008b-a983-4a40-a6f5-101de6a5c9a2.png](./img/a9tEKfXFO2k0Y0Od/1683644289216-a031008b-a983-4a40-a6f5-101de6a5c9a2-156294.png)

### Circle of Confusion for Depth of Field
景深与CoC阈值有关。

![1683644312384-72f90e19-18ab-4858-847c-b32ce7fc5635.png](./img/a9tEKfXFO2k0Y0Od/1683644312384-72f90e19-18ab-4858-847c-b32ce7fc5635-643859.png)

### Depth of Field(FYI)
景深是场景中的某一段深度，使得光线经过透镜到达成像平面附近后，在这个深度范围内CoC都比较小

成像清晰的一段范围

![1683644641645-57e2a62e-4d57-40e7-a98b-70d38bad6890.png](./img/a9tEKfXFO2k0Y0Od/1683644641645-57e2a62e-4d57-40e7-a98b-70d38bad6890-198598.png)

光圈越小，景深越大

![1683644934928-8c91c635-088e-4376-8be1-5666b585d8ec.png](./img/a9tEKfXFO2k0Y0Od/1683644934928-8c91c635-088e-4376-8be1-5666b585d8ec-406376.png)

![1683644891642-344cd9ee-917b-4ee5-8f02-28a68c7c8fd0.png](./img/a9tEKfXFO2k0Y0Od/1683644891642-344cd9ee-917b-4ee5-8f02-28a68c7c8fd0-463869.png)

在线例子 [http://graphics.stanford.edu/courses/cs178/applets/dof.html](http://graphics.stanford.edu/courses/cs178/applets/dof.html) 

# Light Field/Lumigraph
光场。有两个名字是历史遗留问题。



人向3d世界看看到的东西

![1683646737158-37db822b-c21d-4b85-b691-1ac8ad7d7ce7.png](./img/a9tEKfXFO2k0Y0Od/1683646737158-37db822b-c21d-4b85-b691-1ac8ad7d7ce7-446479.png)

## The Plenoptic Function
全光函数，给出了我们能看到的所有东西

![1683687627289-c790c0a9-8c22-4c58-87e0-39762bb21a04.png](./img/a9tEKfXFO2k0Y0Od/1683687627289-c790c0a9-8c22-4c58-87e0-39762bb21a04-079258.png)

### Grayscale snapshot
任意视角(theta, phi)的灰度值

![1683687823892-47d9e5c7-6b90-4472-825f-f670b2860113.png](./img/a9tEKfXFO2k0Y0Od/1683687823892-47d9e5c7-6b90-4472-825f-f670b2860113-342817.png)

### Color Snapshot
波长

![1683687850573-ccf3db20-362b-4146-be16-d0369e6f1440.png](./img/a9tEKfXFO2k0Y0Od/1683687850573-ccf3db20-362b-4146-be16-d0369e6f1440-217453.png)

### A movie
扩展时间t，不同时间显示的东西不一样

![1683688118862-10edcdbc-d9d4-4810-a99a-0991e37be832.png](./img/a9tEKfXFO2k0Y0Od/1683688118862-10edcdbc-d9d4-4810-a99a-0991e37be832-474124.png)

### Holographic movie
全息电影。相机可以在空间里任意移动。

![1683688335160-01c9947b-1af0-4205-b7ab-85284b36f2f9.png](./img/a9tEKfXFO2k0Y0Od/1683688335160-01c9947b-1af0-4205-b7ab-85284b36f2f9-864919.png)

### The Plenoptic Function
重新理解这个式子。不理解为全息电影，理解为在任意位置向任意方向看在任何时间看到的颜色。

![1683688387367-891dba70-6cd2-4fd4-8b62-06e66a17933b.png](./img/a9tEKfXFO2k0Y0Od/1683688387367-891dba70-6cd2-4fd4-8b62-06e66a17933b-236482.png)

### Sampling Plenoptic Function (top view)
![1683688673277-ec1e45d8-b4ae-4bff-84a1-ecdf9481a903.png](./img/a9tEKfXFO2k0Y0Od/1683688673277-ec1e45d8-b4ae-4bff-84a1-ecdf9481a903-485555.png)

## Light Field/Lumigarph
### Ray
光线可以通过5个维度来定义

![1683688741028-549771bc-4d73-4650-8e4b-f795e21177e2.png](./img/a9tEKfXFO2k0Y0Od/1683688741028-549771bc-4d73-4650-8e4b-f795e21177e2-249690.png)

光线也可以通过4个维度来定义

![1683688826776-3818faad-b3ad-409e-bea5-b68b8bc287b9.png](./img/a9tEKfXFO2k0Y0Od/1683688826776-3818faad-b3ad-409e-bea5-b68b8bc287b9-993313.png)

#### Only need Plenoptic Surface
光场是物体在任何一个位置往任何一个方向去的函数

![1683688929017-df49ae99-c6a2-446f-bfeb-f809958d09c3.png](./img/a9tEKfXFO2k0Y0Od/1683688929017-df49ae99-c6a2-446f-bfeb-f809958d09c3-938526.png)

### Synthesizing Novel Views
通过光场，用户可以知道从任意方向观测物体的结果。 

![1683689218317-bcd44dde-5eca-487e-8b7a-bdca485b195c.png](./img/a9tEKfXFO2k0Y0Od/1683689218317-bcd44dde-5eca-487e-8b7a-bdca485b195c-910296.png)

### Lunigraph/Light FIeld
![1683689389439-732a38c6-2075-472b-8ab6-88b8272995fb.png](./img/a9tEKfXFO2k0Y0Od/1683689389439-732a38c6-2075-472b-8ab6-88b8272995fb-020094.png)

### Lunigraph-Organization
用两个平面来定义任何一个光场

之前用一个点加一个方向，现在用两个点

![1683689577703-cf7cca37-2450-4b45-a2c1-1bf19b81769e.png](./img/a9tEKfXFO2k0Y0Od/1683689577703-cf7cca37-2450-4b45-a2c1-1bf19b81769e-976584.png)![1683689478776-c06e971f-eb8c-4207-a650-411a37d0333c.png](./img/a9tEKfXFO2k0Y0Od/1683689478776-c06e971f-eb8c-4207-a650-411a37d0333c-493522.png)

uv + st

![1683689643334-3b62e9cb-3b98-44f9-a1ef-294d00cba3c3.png](./img/a9tEKfXFO2k0Y0Od/1683689643334-3b62e9cb-3b98-44f9-a1ef-294d00cba3c3-577296.png)

![1683788570881-608f0057-1a1f-45d7-9a11-420459d307fc.png](./img/a9tEKfXFO2k0Y0Od/1683788570881-608f0057-1a1f-45d7-9a11-420459d307fc-752861.png)

整个世界还是在st右边

![1683788600197-239715a5-f0d5-49a0-b545-0f10a7daed22.png](./img/a9tEKfXFO2k0Y0Od/1683788600197-239715a5-f0d5-49a0-b545-0f10a7daed22-800733.jpg)

## Light Field Camera
### Stanford Camera Array
每个位置是一个uv，通过摄像机组记录光场

![1683788780757-b566effe-503f-4237-8ac8-c37432ea2f5b.png](./img/a9tEKfXFO2k0Y0Od/1683788780757-b566effe-503f-4237-8ac8-c37432ea2f5b-132534.jpg)

### Itegral Images ("Fly's Eye" Lenslets)
不同方向的光分开记录![1683788816797-1965eedf-fbf2-470c-9527-3604b05fa499.png](./img/a9tEKfXFO2k0Y0Od/1683788816797-1965eedf-fbf2-470c-9527-3604b05fa499-648696.jpg)

#### The Lytro Light Field Camera
采用了前面的微透镜原理。把每个像素替换成一个透镜，把经过透镜的不同方向的光区分开再记录下来。

光场照相机的作用：支持后期重新聚焦。（Computational Refocusing）

![1683788995685-a0e62767-8561-4639-a46b-a8c15ce602d9.png](./img/a9tEKfXFO2k0Y0Od/1683788995685-a0e62767-8561-4639-a46b-a8c15ce602d9-291738.jpg)

### Light Field Camera
![1683789440933-cf8e42bc-6206-4abd-8843-0b286bb52521.png](./img/a9tEKfXFO2k0Y0Od/1683789440933-cf8e42bc-6206-4abd-8843-0b286bb52521-823878.jpg)

取不同方向的光线，就像是虚拟移动摄像机的位置。

![1683789676152-a1fbd62e-14e6-49b6-a6b7-8bc4abc456d8.png](./img/a9tEKfXFO2k0Y0Od/1683789676152-a1fbd62e-14e6-49b6-a6b7-8bc4abc456d8-406861.jpg)

光场相机通常有以下问题

1. 分辨率不足。对相片的分辨率要求高。
2. 制造成本高。



![1683789933354-d7c2b098-1d0f-4034-b7c0-33f214260587.png](./img/a9tEKfXFO2k0Y0Od/1683789933354-d7c2b098-1d0f-4034-b7c0-33f214260587-554788.jpg)

# References
+ [Lecture 19 Cameras, Lenses and Light Fields_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1X7411F744?p=19&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [Depth of field](http://graphics.stanford.edu/courses/cs178/applets/dof.html)



> 更新: 2023-05-11 08:34:13  
> 原文: <https://www.yuque.com/viruspc/el3mi0/bgyzqbnrb872tttf>