# 渲染管线、后处理等

- [Ambient Occlusion](#ambient-occlusion)
  * [SSAO](#ssao)
  * [HBAO](#hbao)
  * [GTAO](#gtao)
  * [Ray-Tracing Ambient Occlusion](#ray-tracing-ambient-occlusion)
- [Fog](#fog)
  * [Depth Fog](#depth-fog)
  * [Height Fog](#height-fog)
  * [Voxel-based Volumetric Fog](#voxel-based-volumetric-fog)
- [Anti-aliasing](#anti-aliasing)
  * [SSAA and MSAA](#ssaa-and-msaa)
  * [FXAA](#fxaa)
  * [TAA](#taa)
- [Post-process](#post-process)
  * [Bloom](#bloom)
  * [Tone Mapping](#tone-mapping)
  * [Color Grading](#color-grading)
- [Rendering Pipeline](#rendering-pipeline)
  * [Forward Rendering](#forward-rendering)
  * [Deferred Rendering](#deferred-rendering)
  * [Tile-based Rendering](#tile-based-rendering)
  * [Cluster-based Rendering](#cluster-based-rendering)
  * [Visibility Buffer](#visibility-buffer)
- [Frame Graph](#frame-graph)
- [Render to Monitor](#render-to-monitor)
- [Reference](#reference)

---

## <font style="color:rgb(0, 0, 0);">Ambient Occlusion</font>
和传统的明暗关系不一样，有些小凹槽会比较黑，小突出会比较亮。这种效果，满足渲染方程，但实际渲染中很难做到。这是因为这种结构非常小，计算机图形学里一般叫中尺度结构（meso-structure）。

![1705681028362-56388b90-63a0-40d5-931b-de21eb9a4496.png](./img/uU9EeWDYoIokVB0Z/1705681028362-56388b90-63a0-40d5-931b-de21eb9a4496-261177.png)

**<font style="color:rgb(34, 34, 34);">环境光遮蔽(ambient occlusion, AO)</font>**<font style="color:rgb(34, 34, 34);">是现代游戏必备的渲染技术，通过AO可以获得更加丰富的光影变化以及更加立体的视觉感受。因为人眼对空间结构的感知，完全是基于大脑深度学习的结果，人的大脑对光影明暗的变化是非常明显的。现代游戏引擎中，AO的效果是非常明显的。</font>

![1705673281580-4e2920be-2fed-451c-bb06-b3830d7aeef0.png](./img/uU9EeWDYoIokVB0Z/1705673281580-4e2920be-2fed-451c-bb06-b3830d7aeef0-527110.jpg)

![1705673275520-866f69cf-1ab4-478d-a17b-88fc17a46b5c.png](./img/uU9EeWDYoIokVB0Z/1705673275520-866f69cf-1ab4-478d-a17b-88fc17a46b5c-088800.jpg)

<font style="color:rgb(34, 34, 34);">在游戏的早期，人们就意识到了AO的重要性。渲染方程的角度来看，AO的本质是计算网格上每个点在光照下的可见性。</font>

![1705673293386-72a11ef0-40e4-4459-a817-edbb0bf032ad.png](./img/uU9EeWDYoIokVB0Z/1705673293386-72a11ef0-40e4-4459-a817-edbb0bf032ad-107584.png)

<font style="color:rgb(34, 34, 34);">早期的AO是通过对网格进行预计算来实现，我们可以把顶点的可见性事先烘焙到网格信息中以便实际渲染时调用。这种方法目前在游戏工业中仍然有很多的应用，一些场景下无法被后续的其他方法取代掉。</font>

<font style="color:rgb(34, 34, 34);">具体来讲，比如用 zbrush 做一个高精度角色模型，这个模型是具有皱纹、眼角等很多细节的。但是，一旦把高精度模型变为游戏中消耗的低精度模型，就回把这些细节都烘焙到法线上去了。但法线只是用来做明暗的变化，不能做几何的变化，不能够提供一个地方凹进去导致周围天光比较少的效果。因此，现代很多建模软件里面都提供了AO烘焙功能。有了这种带AO的角色模型，画面表现感看起来完全不一样了。</font>

<font style="color:rgb(34, 34, 34);">这角色表达的场景中，烘焙AO方法不能被后续的其他AO方法取代掉。其他AO方法都要求有几何的，这一场景中模型简化后几何信息都丢失了。一般角色资产会伴有AO图。</font>

![1705673303183-75425e0e-ebe5-490d-9489-879833e3f64a.png](./img/uU9EeWDYoIokVB0Z/1705673303183-75425e0e-ebe5-490d-9489-879833e3f64a-876423.png)

### <font style="color:rgb(0, 0, 0);">SSAO</font>
<font style="color:rgb(34, 34, 34);">显然这种AO方法只考虑的单个模型自身的几何信息，当把模型放置在动态场景中时是无法得到正确的AO效果的，不能预先烘焙好。为了克服这样的问题，人们提出了</font>**<font style="color:rgb(34, 34, 34);">SSAO</font>**<font style="color:rgb(34, 34, 34);">这种基于屏幕空间的AO算法。SSAO的处理方法是首先从相机出发渲染出一张深度图（可类比 height field），然后对于深度图上的每一个像素我们在屏幕空间上找到该点对应的模型位置并在它的周围球形区域采样出</font>$ N $<font style="color:rgb(34, 34, 34);">个点。利用这</font>$ N $<font style="color:rgb(34, 34, 34);">个采样点以及深度图我们就可以估计该点处的遮挡关系，从而实现AO的效果。</font>

![1705673308012-edcd0bfa-656e-4796-b7d2-8b0dcbeca387.png](./img/uU9EeWDYoIokVB0Z/1705673308012-edcd0bfa-656e-4796-b7d2-8b0dcbeca387-173109.png)

<font style="color:rgb(34, 34, 34);">当然SSAO是一种近似方法，它本身是存在一些问题的：平面上，永远有一半点被挡住。有人意识到这一样，会减去个0.5</font>

<font style="color:rgb(34, 34, 34);">在SSAO的基础上人们又发展出了SSAO+算法，SSAO+没有在整个球体内进行采样而是根据顶点法向考虑法向对应的上半球上进行采样。这种改进克服了SSAO容易产生的整个游戏画面过暗的问题。</font>

![1705673314330-ac0222a5-d164-446e-92ae-2e688f805c3f.png](./img/uU9EeWDYoIokVB0Z/1705673314330-ac0222a5-d164-446e-92ae-2e688f805c3f-463604.png)

<font style="color:rgb(34, 34, 34);">使用SSAO+实现的AO效果可见下图。SSAO相关方法的缺陷在于它只考虑了屏幕空间上的几何，这种简化在某些情况下会导致错误的结果。</font>

![1705673323787-083c6956-6e7f-43d8-a00e-924f4976b7f4.png](./img/uU9EeWDYoIokVB0Z/1705673323787-083c6956-6e7f-43d8-a00e-924f4976b7f4-197885.jpg)![1705673326636-a4df119b-2d94-4b8b-b9ab-c300cec581d2.png](./img/uU9EeWDYoIokVB0Z/1705673326636-a4df119b-2d94-4b8b-b9ab-c300cec581d2-082984.jpg)

### <font style="color:rgb(0, 0, 0);">HBAO</font>
**<font style="color:rgb(34, 34, 34);">HBAO</font>**<font style="color:rgb(34, 34, 34);">同样是基于屏幕空间的AO算法，它的思想是考虑有多大面积的天顶是被遮挡住的。</font>

<font style="color:rgb(34, 34, 34);">从中心向四周望去找最低的仰角，（只采样上半球）使用天顶角</font>$ \theta $<font style="color:rgb(34, 34, 34);">的可见性来代替SSAO中的采样方法。我们可以通过对顶点法向上半球的方向通过ray marching的方式进行积分来估计它的可见性。</font>

同时加了一个hack，attenuation function。如果山离点太远就不考虑了。

（和games202说的不一样？games202中说HBAO考虑了cosine）

[https://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Image-Space%20Horizon-Based%20Ambient%20Occlusion.pdf](https://www.cse.chalmers.se/edu/year/2017/course/TDA361/Advanced%20Computer%20Graphics/Image-Space%20Horizon-Based%20Ambient%20Occlusion.pdf)

![1705720376703-ba38b6c3-875e-41f9-aabf-ecb5afda00d9.png](./img/uU9EeWDYoIokVB0Z/1705720376703-ba38b6c3-875e-41f9-aabf-ecb5afda00d9-788502.png)

![1705673333911-e426bc10-586f-4d86-82f4-5fe5b42fbe0f.png](./img/uU9EeWDYoIokVB0Z/1705673333911-e426bc10-586f-4d86-82f4-5fe5b42fbe0f-776539.png)![1705673336282-a01d7ad6-231d-4afc-87ca-89f1edf06da7.png](./img/uU9EeWDYoIokVB0Z/1705673336282-a01d7ad6-231d-4afc-87ca-89f1edf06da7-040983.png)

### <font style="color:rgb(0, 0, 0);">GTAO</font>
<font style="color:rgb(34, 34, 34);">是现在最常用的算法。</font>

**<font style="color:rgb(34, 34, 34);">GTAO</font>**<font style="color:rgb(34, 34, 34);">补充了缺失的余弦项，此外对光线进行多次弹射的效果进行了拟合。</font>

<font style="color:rgb(34, 34, 34);">上面介绍的几种算法都隐含地假设了顶点接收到来自不同方向上的光照是一致的，但实际上这种假设都没有考虑到渲染方程中的余弦项</font>$ \cos \theta $<font style="color:rgb(34, 34, 34);">。</font>

<font style="color:rgb(34, 34, 34);">如果我们能算出AO值，是不是也可以猜出来回bounce的效果？经过实验，发现ao值和multiple boucnes是有关系的。这里给出了一个三阶的多项式，根据当前ao值估算多次bounce的效果。</font>

![1705673342838-b815f116-4e70-424a-8451-23c6ec1f47b9.png](./img/uU9EeWDYoIokVB0Z/1705673342838-b815f116-4e70-424a-8451-23c6ec1f47b9-984561.png)

![1705673348192-46711cb4-c0af-494a-8439-2e49cbad1be5.png](./img/uU9EeWDYoIokVB0Z/1705673348192-46711cb4-c0af-494a-8439-2e49cbad1be5-567924.png)

### <font style="color:rgb(0, 0, 0);">Ray-Tracing Ambient Occlusion</font>
<font style="color:rgb(34, 34, 34);">当然，利用现代GPU的强大计算能力我们也可通过real time ray tracing的方式来计算AO。</font>

![1705673353455-660bc9fb-37c4-46a9-85be-571d3455504c.png](./img/uU9EeWDYoIokVB0Z/1705673353455-660bc9fb-37c4-46a9-85be-571d3455504c-052666.png)

## <font style="color:rgb(0, 0, 0);">Fog</font>
### <font style="color:rgb(0, 0, 0);">Depth Fog</font>
<font style="color:rgb(34, 34, 34);">雾效是游戏设计者非常喜欢的视觉效果。最简单的雾效是使用深度信息来考虑雾的视觉效果。</font>

<font style="color:rgb(34, 34, 34);">随着距离的变远，透明度逐渐下降。Linear Fog是许多游戏引擎（如）Unity的默认选项。</font>

![1705673378526-abf1ee4b-0777-481b-aa89-23c0ff94ff31.png](./img/uU9EeWDYoIokVB0Z/1705673378526-abf1ee4b-0777-481b-aa89-23c0ff94ff31-581490.png)

### <font style="color:rgb(0, 0, 0);">Height Fog</font>
<font style="color:rgb(34, 34, 34);">当然基于深度的雾效只有有限的表达效果。现实中的雾往往和它所处的高度有关，海拔高度越低的地方雾的效果越明显。对于这种视觉效果可以使用高度信息来进行近似：当高度大于一定的阈值时雾的效果会呈指数递减。</font>

![1705673384153-1a2f289f-bee2-44ff-b7f6-ae90f0c77992.png](./img/uU9EeWDYoIokVB0Z/1705673384153-1a2f289f-bee2-44ff-b7f6-ae90f0c77992-587264.png)

### <font style="color:rgb(0, 0, 0);">Voxel-based Volumetric Fog</font>
<font style="color:rgb(34, 34, 34);">在现代3A游戏中雾效可以使用体素化的方法来进行表现。在进行渲染时需要利用ray marching的方式考虑光线在参与介质中的各种行为，这样就可以获得逼真的雾效。</font>

![1705673392691-85b9db1d-b2ed-49d5-99ec-6cb3b56e47b8.png](./img/uU9EeWDYoIokVB0Z/1705673392691-85b9db1d-b2ed-49d5-99ec-6cb3b56e47b8-180467.png)

## <font style="color:rgb(0, 0, 0);">Anti-aliasing</font>
**<font style="color:rgb(34, 34, 34);">走样(aliasing)</font>**<font style="color:rgb(34, 34, 34);">是渲染中非常容易出现的问题。当相机的采样频率小于场景变化的频率时就会导致图像上出现各种各样的锯齿和走样。</font>

![1705673398716-f913fdee-9847-48f5-8b2e-75f8a35895a1.png](./img/uU9EeWDYoIokVB0Z/1705673398716-f913fdee-9847-48f5-8b2e-75f8a35895a1-590826.png)

**<font style="color:rgb(34, 34, 34);">反走样(anti-aliasing)</font>**<font style="color:rgb(34, 34, 34);">的目标是去除掉图像上的走样，它的基本思路是在每个像素点上进行多次采样并取平均，这样就可以过滤掉高频信号。</font>

![1705673402614-70a49adf-1b8c-49b7-a32a-06e1ecad5a16.png](./img/uU9EeWDYoIokVB0Z/1705673402614-70a49adf-1b8c-49b7-a32a-06e1ecad5a16-784126.png)

### <font style="color:rgb(0, 0, 0);">SSAA and MSAA</font>
<font style="color:rgb(34, 34, 34);">早期的反走样方法是直接使用更高的分辨率进行渲染，然后在输出图像前再通过降采样的方法来获得正常分辨率的图像，这样的方法称为</font>**<font style="color:rgb(34, 34, 34);">超采样(super sampling)</font>**<font style="color:rgb(34, 34, 34);">。显然超采样的方法会导致非常大的计算复杂度，在现代游戏引擎中基本已经弃用。类似地，</font>**<font style="color:rgb(34, 34, 34);">MSAA</font>**<font style="color:rgb(34, 34, 34);">则是在渲染时利用采样点进行着色然后通过取平均的方式来处理走样的问题。</font>

![1705673407296-c1637f94-03dd-4dda-9067-63c86623dcbc.png](./img/uU9EeWDYoIokVB0Z/1705673407296-c1637f94-03dd-4dda-9067-63c86623dcbc-377052.png)

### <font style="color:rgb(0, 0, 0);">FXAA</font>
<font style="color:rgb(34, 34, 34);">SSAA和MSAA的主要问题在于超采样的过程导致了巨大的计算复杂度，而</font>**<font style="color:rgb(34, 34, 34);">FXAA</font>**<font style="color:rgb(34, 34, 34);">则是直接在原始分辨率的图像上进行反走样。FXAA的思想是在图像的边缘区域使用插值的方式来实现反走样，因此FXAA首先需要使用边缘检测算子来检测出图像亮度发生剧烈变化的区域。</font>

![1705673412514-620b4bb2-1a7c-4438-90ba-84651a168cb6.png](./img/uU9EeWDYoIokVB0Z/1705673412514-620b4bb2-1a7c-4438-90ba-84651a168cb6-996510.png)

<font style="color:rgb(34, 34, 34);">然后通过卷积运算，FXAA判断这些区域是在水平方向还是垂直方向发生了较大的变化并以此作为反走样补偿的方向。得到补偿方向后还需要根据相邻像素之间的亮度差值来选择亮度差异大的作为具体的方向。</font>

![1705673417416-a1ba051d-6e70-44aa-9010-75d9e3ed8735.png](./img/uU9EeWDYoIokVB0Z/1705673417416-a1ba051d-6e70-44aa-9010-75d9e3ed8735-407695.png)

<font style="color:rgb(34, 34, 34);">接下来FXAA会沿补偿方向的垂直方向寻找像素对，如果相邻像素在补偿方向上的差异与当前像素接近则与当前像素为同一组。通过向两边进行查找的方法来获得插值计算的端点。</font>

![1705673423066-49e5687c-2b14-4664-ba1b-1137c6b74d0b.png](./img/uU9EeWDYoIokVB0Z/1705673423066-49e5687c-2b14-4664-ba1b-1137c6b74d0b-785923.png)

<font style="color:rgb(34, 34, 34);">得到端点后可以根据当前点到两端的距离来确定插值的系数。</font>

![1705673427079-325cad10-6e6c-47d5-b384-a68985f06a96.png](./img/uU9EeWDYoIokVB0Z/1705673427079-325cad10-6e6c-47d5-b384-a68985f06a96-964738.png)

<font style="color:rgb(34, 34, 34);">最后对同一组中的像素进行颜色插值即可。</font>

![1705673431206-dabe4671-d172-46b3-a665-0b6b8e46edad.png](./img/uU9EeWDYoIokVB0Z/1705673431206-dabe4671-d172-46b3-a665-0b6b8e46edad-884582.png)

<font style="color:rgb(34, 34, 34);">FXAA的反走样效果如下：</font>

![1705673435381-b21894ab-6d63-40d5-9ceb-eb64b9d71071.png](./img/uU9EeWDYoIokVB0Z/1705673435381-b21894ab-6d63-40d5-9ceb-eb64b9d71071-502341.png)

### <font style="color:rgb(0, 0, 0);">TAA</font>
<font style="color:rgb(34, 34, 34);">除了上面介绍过的方法外另一种进行反走样的思路是利用时序信息进行反走样，这类方法称为</font>**<font style="color:rgb(34, 34, 34);">TAA</font>**<font style="color:rgb(34, 34, 34);">。TAA的思想是考虑每个像素在上一帧所处的位置，然后将上一帧对应位置的颜色和当前帧上的颜色进行加权平均来进行滤波。目前很多游戏引擎都使用了TAA相关的方法来实现反走样。</font>

![1705673442628-5a3de960-0a49-45e0-b18c-c7635e01c3b3.png](./img/uU9EeWDYoIokVB0Z/1705673442628-5a3de960-0a49-45e0-b18c-c7635e01c3b3-160866.png)

![1705673449611-2c961b56-912b-4e55-985b-a1b93f04d66b.png](./img/uU9EeWDYoIokVB0Z/1705673449611-2c961b56-912b-4e55-985b-a1b93f04d66b-381498.png)

## <font style="color:rgb(0, 0, 0);">Post-process</font>
<font style="color:rgb(34, 34, 34);">在现代3A游戏中对画面进行渲染后一般还需要添加各种后处理来提升画面的表现力。</font>

![1705673476963-a1253329-22ef-4e45-bc08-8ad141de6db0.png](./img/uU9EeWDYoIokVB0Z/1705673476963-a1253329-22ef-4e45-bc08-8ad141de6db0-780339.png)

### <font style="color:rgb(0, 0, 0);">Bloom</font>
**<font style="color:rgb(34, 34, 34);">bloom</font>**<font style="color:rgb(34, 34, 34);">是一种非常常见的灯光效果，在光源的四周我们往往可以看到一圈放大的光晕。从物理的角度上讲，bloom的成因在于真实相机的镜头并不符合完美的针孔相机，因此在成像时会出现这样的光学现象。</font>

![1705673483445-f1452d8e-d673-4fcf-bf12-065d2781a53a.png](./img/uU9EeWDYoIokVB0Z/1705673483445-f1452d8e-d673-4fcf-bf12-065d2781a53a-906591.png)

<font style="color:rgb(34, 34, 34);">想要实现bloom的效果也非常简单，我们可以通过对渲染后的图像进行滤波来获得类似的效果。首先，我们需要找出图像中高亮度的区域。</font>

![1705673488913-36b7622c-011c-4c19-838c-75c479a3693b.png](./img/uU9EeWDYoIokVB0Z/1705673488913-36b7622c-011c-4c19-838c-75c479a3693b-419353.png)

<font style="color:rgb(34, 34, 34);">然后我们对这些高亮的区域使用高斯模糊来获得bloom的效果。实际处理时往往还会对高斯核进行分解并且结合图像金字塔来进行加速。</font>

![1705673495491-a921ae22-0bcf-4ba8-a73d-f6c164fdfe7a.png](./img/uU9EeWDYoIokVB0Z/1705673495491-a921ae22-0bcf-4ba8-a73d-f6c164fdfe7a-243544.png)![1705673499990-1c094e28-bd58-4d45-934a-77ae4bc18003.png](./img/uU9EeWDYoIokVB0Z/1705673499990-1c094e28-bd58-4d45-934a-77ae4bc18003-311636.png)

<font style="color:rgb(34, 34, 34);">最后，我们把高亮的区域叠加到原始图像上就可以得到bloom的效果。</font>

![1705673506789-ff058327-0d15-4d05-940b-689317c04723.png](./img/uU9EeWDYoIokVB0Z/1705673506789-ff058327-0d15-4d05-940b-689317c04723-500908.png)![1705673510463-ede16163-4f44-4331-9584-796d0eb3ec03.png](./img/uU9EeWDYoIokVB0Z/1705673510463-ede16163-4f44-4331-9584-796d0eb3ec03-869017.jpg)

### <font style="color:rgb(0, 0, 0);">Tone Mapping</font>
**<font style="color:rgb(34, 34, 34);">色调映射(tone mapping)</font>**<font style="color:rgb(34, 34, 34);">是输出最终渲染图像前的一个重要环节。目前3A游戏的光照往往都是HDR的，这容易导致渲染出的图像上会出现过明或过暗的区域。通过色调映射我们可以把HDR图像的亮度进行压缩来获得更好的显示效果。</font>

![1705673517234-9fdf7bee-6e77-47fd-891c-25f93515405e.png](./img/uU9EeWDYoIokVB0Z/1705673517234-9fdf7bee-6e77-47fd-891c-25f93515405e-411569.png)

<font style="color:rgb(34, 34, 34);">色调映射的实现同样非常简单，我们只需要利用一条曲线对亮度进行缩放即可。filmic曲线就是色调映射中常用的一种曲线，它可以让游戏画面获得电影般的质感。</font>

![1705673527639-ea2c1c8d-0660-48e7-ab4c-1023ed6ffb76.png](./img/uU9EeWDYoIokVB0Z/1705673527639-ea2c1c8d-0660-48e7-ab4c-1023ed6ffb76-804048.png)

<font style="color:rgb(34, 34, 34);">目前3A游戏中更多地使用了ACES曲线来进行色调映射。ACES来自于电影工业大量专业视觉工作者的总结，使用ACES曲线不仅会让画面更有表现力，而且它对于不同的显示设备都有很好的支持。</font>

![1705673532308-7771953f-dcb5-4a82-9329-6a7a910cb0ff.png](./img/uU9EeWDYoIokVB0Z/1705673532308-7771953f-dcb5-4a82-9329-6a7a910cb0ff-362279.png)![1705673534607-a5e35184-6ee0-401f-add7-be2f2d2ea12a.png](./img/uU9EeWDYoIokVB0Z/1705673534607-a5e35184-6ee0-401f-add7-be2f2d2ea12a-968529.png)

<font style="color:rgb(34, 34, 34);">使用不同的常用曲线进行色调映射的效果如下。</font>

![1705673539965-dd7852dd-5277-4e65-ae43-ba5e276522e9.png](./img/uU9EeWDYoIokVB0Z/1705673539965-dd7852dd-5277-4e65-ae43-ba5e276522e9-699942.png)

### <font style="color:rgb(0, 0, 0);">Color Grading</font>
**<font style="color:rgb(34, 34, 34);">颜色分级(color grading)</font>**<font style="color:rgb(34, 34, 34);">是游戏设计者非常常用的一种调色方法，它的本质是建立一个颜色到颜色的映射从而获得不同的画面表现效果。</font>

![1705673546874-0f49a7d3-24b2-4f26-bde1-7c328b047887.png](./img/uU9EeWDYoIokVB0Z/1705673546874-0f49a7d3-24b2-4f26-bde1-7c328b047887-441982.png)

<font style="color:rgb(34, 34, 34);">我们可以使用3D texture或者texture array等技术将这个映射存储在纹理中，然后通过查表的方式对画面进行调色。</font>

![1705673551995-3967b6ce-3615-4915-b2d8-4c90e7927508.png](./img/uU9EeWDYoIokVB0Z/1705673551995-3967b6ce-3615-4915-b2d8-4c90e7927508-138597.png)

<font style="color:rgb(34, 34, 34);">因此对于游戏引擎来说则需要开发相关的模块来方便设计师建立这样的颜色映射。</font>

![1705673557628-bb84cc83-6a3b-4c63-86a8-f5803390b1d9.png](./img/uU9EeWDYoIokVB0Z/1705673557628-bb84cc83-6a3b-4c63-86a8-f5803390b1d9-502556.png)

<font style="color:rgb(34, 34, 34);">通过color grading可以烘托玩家不同的情绪，从而提升玩家的游戏体验。</font>

![1705673563229-10ed4830-7181-460b-be84-d51b6e918865.png](./img/uU9EeWDYoIokVB0Z/1705673563229-10ed4830-7181-460b-be84-d51b6e918865-754980.jpg)

## <font style="color:rgb(0, 0, 0);">Rendering Pipeline</font>
### <font style="color:rgb(0, 0, 0);">Forward Rendering</font>
<font style="color:rgb(34, 34, 34);">到目前为止我们已经学到了很多工业界常用的渲染算法，在实际进行渲染时还需要通过</font>**<font style="color:rgb(34, 34, 34);">渲染管线(rendering pipeline)</font>**<font style="color:rgb(34, 34, 34);">来将这些算法组织起来。</font>

![1705673569399-74093835-00e6-4589-a8b0-bb3a6edfcbbe.png](./img/uU9EeWDYoIokVB0Z/1705673569399-74093835-00e6-4589-a8b0-bb3a6edfcbbe-139782.png)

<font style="color:rgb(34, 34, 34);">最直接的渲染管线是按照网格和光源进行遍历，依次把计算得到的颜色累加到指定的像素上。这样的渲染管线称为</font>**<font style="color:rgb(34, 34, 34);">前向渲染(forward rendering)</font>**<font style="color:rgb(34, 34, 34);">。</font>

![1705673573194-e8327546-4ae0-4be0-af77-08cde951a212.png](./img/uU9EeWDYoIokVB0Z/1705673573194-e8327546-4ae0-4be0-af77-08cde951a212-965985.png)

<font style="color:rgb(34, 34, 34);">对于半透明的物体，前向渲染还需要考虑物体之间的渲染顺序。比如说我们需要先绘制不透明的物体然后才能绘制半透明的物体，而在绘制不同的半透明物体时还需要按照深度由远及近进行绘制。</font>

![1705673579821-0d3481dd-fb8d-4cc3-89e0-ed0feb5b90d2.png](./img/uU9EeWDYoIokVB0Z/1705673579821-0d3481dd-fb8d-4cc3-89e0-ed0feb5b90d2-125811.png)

### <font style="color:rgb(0, 0, 0);">Deferred Rendering</font>
<font style="color:rgb(34, 34, 34);">前向渲染的一个缺陷在于当场景中的光源数比较多时效率会非常低下。为了克服前向渲染这样的问题，人们还开发出了</font>**<font style="color:rgb(34, 34, 34);">延迟渲染(deferred rendering)</font>**<font style="color:rgb(34, 34, 34);">的技术。在延迟渲染的管线中，每个像素的渲染分为两个步骤：首先把每个像素对应的各种几何信息存储到G-buffer中，然后再对像素进行渲染。</font>

![1705673606936-443c4b43-c1a6-4daa-a9a8-d75744f4bcbd.png](./img/uU9EeWDYoIokVB0Z/1705673606936-443c4b43-c1a6-4daa-a9a8-d75744f4bcbd-028025.png)

<font style="color:rgb(34, 34, 34);">延迟渲染的优势在于它可以极大地提升渲染效率，而且G-buffer中存储的几何信息也可以方便后处理的各种计算；但它的缺点也很明显，延迟渲染需要首先将几何信息写入G-buffer中因此对显存有着更高的需求。</font>

![1705673627899-9bccd4f0-9742-49f5-ab19-775befcd79b2.png](./img/uU9EeWDYoIokVB0Z/1705673627899-9bccd4f0-9742-49f5-ab19-775befcd79b2-447481.png)

### <font style="color:rgb(0, 0, 0);">Tile-based Rendering</font>
<font style="color:rgb(34, 34, 34);">为了缓解延迟渲染的显存压力，我们可以使用</font>**<font style="color:rgb(34, 34, 34);">分片渲染(tile-based rendering)</font>**<font style="color:rgb(34, 34, 34);">的方式将整个画面拆成若干个分片，然后在每个分片上单独使用延迟渲染。这样的方式可以有效减少显存的需求，在很多移动设备上都有应用。</font>

![1705673636028-3294be44-a440-43ca-bdfd-7a03c1a4db93.png](./img/uU9EeWDYoIokVB0Z/1705673636028-3294be44-a440-43ca-bdfd-7a03c1a4db93-437529.png)

<font style="color:rgb(34, 34, 34);">更进一步，我们可以把每个分片需要考虑的光源信息写入G-buffer中。这样在对每个分片进行渲染时只考虑可能出现在该分片上的光照，从而进一步提升渲染效率。</font>

![1705673644771-446f1b39-aa85-45c2-925f-2f5e48527e26.png](./img/uU9EeWDYoIokVB0Z/1705673644771-446f1b39-aa85-45c2-925f-2f5e48527e26-912344.png)

<font style="color:rgb(34, 34, 34);">除此之外，我们还可以利用空间深度信息来进一步优化每一个分片上需要考虑的光源。这样可以更高效地处理多光源的场景。</font>

![1705673650301-2a543fd2-8e67-4924-b404-0220f83e977c.png](./img/uU9EeWDYoIokVB0Z/1705673650301-2a543fd2-8e67-4924-b404-0220f83e977c-526730.png)

<font style="color:rgb(34, 34, 34);">很多游戏还是要了</font>**<font style="color:rgb(34, 34, 34);">forward+ rendering</font>**<font style="color:rgb(34, 34, 34);">这种形式的渲染管线，它是将forward rendering按照分片进行渲染的绘制方式。</font>

![1705673654733-5d28437b-ee70-4676-8407-85b90e011bdb.png](./img/uU9EeWDYoIokVB0Z/1705673654733-5d28437b-ee70-4676-8407-85b90e011bdb-040608.png)

### <font style="color:rgb(0, 0, 0);">Cluster-based Rendering</font>
<font style="color:rgb(34, 34, 34);">对空间进行划分时还可以同时按照深度进行切分，这样可以处理场景中有上千个光源的极端情况。它可以看做是分片渲染在深度上的推广。</font>

![1705673659299-ff573f84-0e68-40ea-9b5e-a99c80f62a44.png](./img/uU9EeWDYoIokVB0Z/1705673659299-ff573f84-0e68-40ea-9b5e-a99c80f62a44-761063.png)

### <font style="color:rgb(0, 0, 0);">Visibility Buffer</font>
<font style="color:rgb(34, 34, 34);">目前游戏工业还发展出了基于V-buffer的渲染管线。V-buffer与G-buffer类似，但在V-buffer中储存的是像素的深度和面片信息，而在实际渲染时根据每个像素对应的几何信息来进行绘制。这样的渲染管线更加适合如今越来越复杂的几何场景。</font>

![1705673664438-6b85ea05-363f-4192-894a-5c94f5408bd1.png](./img/uU9EeWDYoIokVB0Z/1705673664438-6b85ea05-363f-4192-894a-5c94f5408bd1-398173.png)

## <font style="color:rgb(0, 0, 0);">Frame Graph</font>
<font style="color:rgb(34, 34, 34);">在商业游戏引擎的渲染系统中，除了需要包含各种先进的渲染算法外还需要考虑如何对各种算法有序地进行管理。以虚幻引擎为例，整个渲染管线中包含了大量的可选算法，在实际渲染时需要进行相应的调度使它们按顺序进行执行。</font>

![1705673668835-9a7160ae-bb48-46e1-b56c-b7abb18b99db.png](./img/uU9EeWDYoIokVB0Z/1705673668835-9a7160ae-bb48-46e1-b56c-b7abb18b99db-327846.png)

<font style="color:rgb(34, 34, 34);">同时，像Vulkan和DirectX 12等现代图形API往往开放了大量的GPU底层接口进行编程。这使得程序员可以高效地实现对硬件计算资源的管理，但相应的如果开发时不够谨慎则容易造成整个系统的崩溃。</font>

![1705673673301-7ad9e347-425c-44a0-8c83-e4f8d90b6a3e.png](./img/uU9EeWDYoIokVB0Z/1705673673301-7ad9e347-425c-44a0-8c83-e4f8d90b6a3e-821996.png)

<font style="color:rgb(34, 34, 34);">为了便于整个开发和渲染流程，游戏工业目前尝试使用</font>**<font style="color:rgb(34, 34, 34);">frame graph</font>**<font style="color:rgb(34, 34, 34);">这样的技术对整个渲染过程进行管理。它的思想是把整个渲染过程所需的算法和各种资源表示为一张</font>**<font style="color:rgb(34, 34, 34);">有向无环图(DAG)</font>**<font style="color:rgb(34, 34, 34);">，这样就可以通过对图的管理来实现不同资源的调度。当然frame graph这样的技术仍在探索阶段，但我们可以期待它在今后整个游戏工业界的表现。</font>

![1705673677912-0b6fc91c-3995-40ae-a5f8-9fcf3701c939.png](./img/uU9EeWDYoIokVB0Z/1705673677912-0b6fc91c-3995-40ae-a5f8-9fcf3701c939-865452.png)

## <font style="color:rgb(0, 0, 0);">Render to Monitor</font>
<font style="color:rgb(34, 34, 34);">当我们在GPU完成渲染后就需要把渲染的结果输出到显示屏幕上。这里需要注意的是当显示器的刷新频率和GPU的输出频率不一致时会产生画面割裂的情况。</font>

![1705673683332-589fd405-aa02-48de-8439-d08a26f7ed35.png](./img/uU9EeWDYoIokVB0Z/1705673683332-589fd405-aa02-48de-8439-d08a26f7ed35-542912.png)

![1705673687368-64254803-c744-4e38-bc18-eb36e44c6d56.png](./img/uU9EeWDYoIokVB0Z/1705673687368-64254803-c744-4e38-bc18-eb36e44c6d56-735065.png)

<font style="color:rgb(34, 34, 34);">为了克服这样的问题人们开发出了</font>**<font style="color:rgb(34, 34, 34);">V-Sync</font>**<font style="color:rgb(34, 34, 34);">技术，它会强制显示器等待GPU的输出结果这样就可以避免画面的不一致。当然V-Sync也带来了一些新的问题：在场景发生变化时画面的帧率会忽快忽慢影响玩家的游戏体验。</font>

![1705673692265-0a88367b-190a-4dad-8ba3-130f2dc45809.png](./img/uU9EeWDYoIokVB0Z/1705673692265-0a88367b-190a-4dad-8ba3-130f2dc45809-037509.png)

<font style="color:rgb(34, 34, 34);">因此目前一些硬件厂商提出了</font>**<font style="color:rgb(34, 34, 34);">variable refresh rate</font>**<font style="color:rgb(34, 34, 34);">的概念，让显示器画面的刷新率可以由GPU根据需要来动态设置。</font>

![1705673696309-1fe50dea-ecb9-4c2f-bb85-7524e6db446b.png](./img/uU9EeWDYoIokVB0Z/1705673696309-1fe50dea-ecb9-4c2f-bb85-7524e6db446b-633307.png)

## <font style="color:rgb(0, 0, 0);">Reference</font>
+ [Lecture 07：Render Pipeline, Post-process and Everything](https://www.bilibili.com/video/BV1kY411P7QM/)



> 更新: 2025-10-06 12:08:22  
> 原文: <https://www.yuque.com/viruspc/el3mi0/xa1gbnusivyo6x5g>