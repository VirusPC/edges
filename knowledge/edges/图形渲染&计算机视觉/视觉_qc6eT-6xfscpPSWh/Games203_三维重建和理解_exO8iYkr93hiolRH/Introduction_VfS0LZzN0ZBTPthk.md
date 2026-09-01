# Introduction

- [Summary](#summary)
- [Introduction](#introduction)
  * [Geometry Processing Pipeline](#geometry-processing-pipeline)
  * [3D Vision](#3d-vision)
  * [2D Vision VS 3D Vision](#2d-vision-vs-3d-vision)
  * [Application](#application)
  * [Interdisciplinary field](#interdisciplinary-field)
  * [Topics to be covered](#topics-to-be-covered)
    + [Topic1: 3D Reconstruction](#topic1-3d-reconstruction)
    + [Topic2: How to represent 3D Data](#topic2-how-to-represent-3d-data)
    + [Topic3: How to understand 3D Data](#topic3-how-to-understand-3d-data)
  * [What we focus on](#what-we-focus-on)
    + [We focus on the basics](#we-focus-on-the-basics)
    + [Mathematics is important](#mathematics-is-important)
    + [Numerical Optimization is important](#numerical-optimization-is-important)
  * [Homework](#homework)
- [推荐书籍](#%E6%8E%A8%E8%8D%90%E4%B9%A6%E7%B1%8D)

---

## Summary
1. Geometry processing pipeline
    1. reconstruction
    2. processing&analysis
    3. printing
2. 3D vision
    1. Recovering the Underlying 3D structures from Images.
    2. 重点方向
        1. Structure-from-motion
        2. Multi-view Stereo
        3. Pose Estimation
    3. 在大部分研究从reconstruction转向 understanding
    4. 数据集有了，为什么不重建 model，而是重建 structure？从image做model的重建很难（现在有guassian splatting）。有了structure后，就是一些共性问题：clasification,segmentation,detection
3. 2D vision VS 3D vision
    1. 2D vision 中的表达方式往往为vector，3D vision 中表达方式多种多样
4. Application
5. Topics
    1. 3d reconstruction
        1. 几何处理
            1. Scanning，硬件三维扫描
            2. Scan registration，扫描只能扫描一部分，如何把不同部分合到一起
            3. Surface reconstruction，重建得到3维曲面
        2. 从image做重建
            1. Structure-from-motion，得到camera的pose，一些少量的点
            2. Multi-view stereo，做dance的reconstruction。
        3. Map synchronization：解决multiple object的pose
            1. 重建只是 map synchronization的一种应用
    2. how to represent 3d data
        1. 不同表达
        2. 不同表达之间的转换（如marching cube）
    3. how to understand 3d data
        1. Segmentation
        2. matching
        3. retrieval
        4. classification&clustering

## Introduction
这门课会把2D VIsion 和 3D Vision 放到一起讲。

### Geometry Processing Pipeline
![1711269681119-fc7607a4-570c-43c9-98a6-1f6234b76fbd.png](./img/VfS0LZzN0ZBTPthk/1711269681119-fc7607a4-570c-43c9-98a6-1f6234b76fbd-645618.png)

几何处理（geometry processing）用一种计算的方法研究现实世界中的物理对象（physical object），通过硬件扫描生成物理对象的三维模型，然后做各种处理和分析。

1. Reconstruction。physical object => 3d object。通过硬件扫描，把真实世界的物体变成三维模型。
2. Procesing&Analysis：3d object=. 在虚拟的世界中，用计算的方法对3D object做分析，比如part，两个object的哪些地方对应，把物体组合起来变成更多的物体。怎么更好地表示，参数化，贴纹理.
3. Printing：3d object=>physical object: 3D printing

### 3D Vision
狭义的3D vision：Recovering the Underlying 3D structures from Images.

特别注意：Structure-from-motion,Multi-view Stereo

![1711270469870-070d98ae-7904-43ed-9e0c-f649e7696af4.png](./img/VfS0LZzN0ZBTPthk/1711270469870-070d98ae-7904-43ed-9e0c-f649e7696af4-748065.png)

现在大部分研究从reconstruction转向 understanding。原因：海量的3D模型产生了，特别是 Image net 做出了巨大贡献。

![1711270625946-2405a87b-4d7a-45a0-a2ea-702d616f0672.png](./img/VfS0LZzN0ZBTPthk/1711270625946-2405a87b-4d7a-45a0-a2ea-702d616f0672-746397.png)

数据集有了，为什么不重建 model，而是重建 structure？从image做model的重建很难（现在有guassian splatting）。

有了structure后，就是一些共性问题：clasification,segmentation,detection

![1718973166011-d007b196-eacf-43af-88ee-ceaeaacf96e1.png](./img/VfS0LZzN0ZBTPthk/1718973166011-d007b196-eacf-43af-88ee-ceaeaacf96e1-576192.png)

### 2D Vision VS 3D Vision
二者区别很大。

![1711271533291-abe81c1f-6c4a-4ad9-b87a-b42734eb43dc.png](./img/VfS0LZzN0ZBTPthk/1711271533291-abe81c1f-6c4a-4ad9-b87a-b42734eb43dc-985173.png)

机器学习：从一个Vector变换到另一个Vector，需要优化这个变换。中间需要考虑表示问题，即如何把数据转为vector。

3D Vision：许多种表示方式。

![1711271559697-04efae1c-112a-46e2-bf8d-dc9db6aacfe7.png](./img/VfS0LZzN0ZBTPthk/1711271559697-04efae1c-112a-46e2-bf8d-dc9db6aacfe7-303016.png)



![1711271643416-1e95fdb3-5d16-4d6c-98a2-9ccf4fea3228.png](./img/VfS0LZzN0ZBTPthk/1711271643416-1e95fdb3-5d16-4d6c-98a2-9ccf4fea3228-219177.png)

### Application
无人驾驶，AR，VR，需要对地球做精致的建模，这是一个重建问题。物体做大规模的重建

![1711271817835-8de8aa81-d4d5-4c45-9e84-8ade1edea8b4.png](./img/VfS0LZzN0ZBTPthk/1711271817835-8de8aa81-d4d5-4c45-9e84-8ade1edea8b4-585182.png)

Performance capture。采集人的performance。

![1711271829071-0f9b68e0-eac5-468a-b18b-75ae05bce5d2.png](./img/VfS0LZzN0ZBTPthk/1711271829071-0f9b68e0-eac5-468a-b18b-75ae05bce5d2-501271.png)

Rototics。机器人与自然界做交互，牵扯到3维的建模和理解。

![1711287605325-b34c51ff-212e-497a-9011-9efebade6f64.png](./img/VfS0LZzN0ZBTPthk/1711287605325-b34c51ff-212e-497a-9011-9efebade6f64-495453.png)

无人驾驶。距离非常重要。

![1711287617754-2f58818d-d7f7-4dbd-b2a0-e432464d6316.png](./img/VfS0LZzN0ZBTPthk/1711287617754-2f58818d-d7f7-4dbd-b2a0-e432464d6316-077665.png)

反向工程。制作模型，对模型做分析，判断是否有偏差、由什么构成等。

![1711287650035-c12db764-5867-4dbf-8cba-32bd91c0690a.png](./img/VfS0LZzN0ZBTPthk/1711287650035-c12db764-5867-4dbf-8cba-32bd91c0690a-392068.png)

### Interdisciplinary field
是一个交叉学科

![1711287726888-7874f572-a73f-422c-97df-2db3f3f1a7c2.png](./img/VfS0LZzN0ZBTPthk/1711287726888-7874f572-a73f-422c-97df-2db3f3f1a7c2-240479.png)



### Topics to be covered
- [x] representation
- [x] reconstruction
- [ ] processing&analysing
    - [x] understanding
    - [ ] ...
- [ ] print



#### Topic1: 3D Reconstruction
![1711288101150-8d66cb87-06bf-4e67-a6e6-11154455ccfd.png](./img/VfS0LZzN0ZBTPthk/1711288101150-8d66cb87-06bf-4e67-a6e6-11154455ccfd-136141.png)

1. 几何处理
    1. Scanning，硬件三维扫描
    2. Scan registration，扫描只能扫描一部分，如何把不同部分合到一起
    3. Surface reconstruction，重建得到3维曲面
2. 从image做重建
    1. Structure-from-motion，得到camera的pose，一些少量的点
    2. Multi-view stereo，做dance的reconstruction。
3. Map synchronization：解决multiple object的pose

#### Topic2: How to represent 3D Data
![1711288538818-89eb70bf-96b6-4925-acd1-fd0027dd616f.png](./img/VfS0LZzN0ZBTPthk/1711288538818-89eb70bf-96b6-4925-acd1-fd0027dd616f-352504.png)

不同表示之间的转换：

+ **marching cube: 隐式表达 到 显示表达 的 de-facto**

  
![1711288646635-e910be41-218c-4f4b-a697-5762e43b3e1f.png](./img/VfS0LZzN0ZBTPthk/1711288646635-e910be41-218c-4f4b-a697-5762e43b3e1f-337519.png)

![1711288706029-8984ab87-b79e-46da-952d-71aea2db7b3d.png](./img/VfS0LZzN0ZBTPthk/1711288706029-8984ab87-b79e-46da-952d-71aea2db7b3d-816223.png)

#### Topic3: How to understand 3D Data


![1711288876283-9f76b440-606d-4bc7-9170-8246db159aa5.png](./img/VfS0LZzN0ZBTPthk/1711288876283-9f76b440-606d-4bc7-9170-8246db159aa5-652141.png)

### What we focus on
#### We focus on the basics
不仅要学前沿，更要学基础，了解学科的发展

![1711289062518-4494e98b-8745-44d9-b12c-dc481d67176b.png](./img/VfS0LZzN0ZBTPthk/1711289062518-4494e98b-8745-44d9-b12c-dc481d67176b-539469.png)

![1711290755312-8e61edd3-76ef-47fe-823a-69eb550b7e38.png](./img/VfS0LZzN0ZBTPthk/1711290755312-8e61edd3-76ef-47fe-823a-69eb550b7e38-669453.png)

#### Mathematics is important
![1711290825177-44b111b4-6dbc-4252-977f-86c744908a1b.png](./img/VfS0LZzN0ZBTPthk/1711290825177-44b111b4-6dbc-4252-977f-86c744908a1b-704802.png)

#### Numerical Optimization is important
![1711290998823-4059a147-ca4c-4a4a-b228-3fd9a6af0a9c.png](./img/VfS0LZzN0ZBTPthk/1711290998823-4059a147-ca4c-4a4a-b228-3fd9a6af0a9c-095206.png)

![1711291040776-6b18b038-7ea3-4152-b445-2099a911efee.png](./img/VfS0LZzN0ZBTPthk/1711291040776-6b18b038-7ea3-4152-b445-2099a911efee-719207.png)

![1711291057793-fd2e0764-ee8f-4283-b9d5-af06e5dbebf7.png](./img/VfS0LZzN0ZBTPthk/1711291057793-fd2e0764-ee8f-4283-b9d5-af06e5dbebf7-892109.png)

![1711291104950-48560521-99c2-44d8-a966-ca04a22666a1.png](./img/VfS0LZzN0ZBTPthk/1711291104950-48560521-99c2-44d8-a966-ca04a22666a1-259588.png)

![1711291118297-cc7ee934-a18b-4ab2-9789-ba7df4a75d34.png](./img/VfS0LZzN0ZBTPthk/1711291118297-cc7ee934-a18b-4ab2-9789-ba7df4a75d34-163694.png)

![1711291140449-ecc566b3-7580-401c-b902-58c5635aacf2.png](./img/VfS0LZzN0ZBTPthk/1711291140449-ecc566b3-7580-401c-b902-58c5635aacf2-594861.png)

![1711291156273-56572031-751a-4322-ab4c-7b67084dc9c3.png](./img/VfS0LZzN0ZBTPthk/1711291156273-56572031-751a-4322-ab4c-7b67084dc9c3-999938.png)



![1711291186951-c046840a-9c61-4825-8c62-b09d11913486.png](./img/VfS0LZzN0ZBTPthk/1711291186951-c046840a-9c61-4825-8c62-b09d11913486-958469.png)

### Homework
1. 深度重建

![1711291225604-9d61fa28-ec0e-4e9a-948c-f42a2eb0a768.png](./img/VfS0LZzN0ZBTPthk/1711291225604-9d61fa28-ec0e-4e9a-948c-f42a2eb0a768-395268.png)

![1711291257930-fb2fc461-87e7-4784-81de-e5eaa8332bb4.png](./img/VfS0LZzN0ZBTPthk/1711291257930-fb2fc461-87e7-4784-81de-e5eaa8332bb4-551460.png)

![1711291306436-73100526-54ed-4de1-913b-095c3e950224.png](./img/VfS0LZzN0ZBTPthk/1711291306436-73100526-54ed-4de1-913b-095c3e950224-232761.png)

有了海量数据，可以做单目重建

![1711291319852-057c912e-892a-4ae0-b86f-7e080f127d43.png](./img/VfS0LZzN0ZBTPthk/1711291319852-057c912e-892a-4ae0-b86f-7e080f127d43-177332.png)

![1711291413657-d3419312-eb03-4590-b5ef-c8ed90346acb.png](./img/VfS0LZzN0ZBTPthk/1711291413657-d3419312-eb03-4590-b5ef-c8ed90346acb-732589.png)

![1711291457756-acc0dbf0-9241-40b7-b595-903644de3a3c.png](./img/VfS0LZzN0ZBTPthk/1711291457756-acc0dbf0-9241-40b7-b595-903644de3a3c-176556.png)

![1711291479826-e5827060-809f-410c-a472-8a611863ed69.png](./img/VfS0LZzN0ZBTPthk/1711291479826-e5827060-809f-410c-a472-8a611863ed69-174540.png)

![1711291487475-9acaa69a-254a-426f-b242-60a5ec3efc53.png](./img/VfS0LZzN0ZBTPthk/1711291487475-9acaa69a-254a-426f-b242-60a5ec3efc53-012597.png)

![1711291531375-632e6aa5-df88-4432-9f56-36cd0795c1a4.png](./img/VfS0LZzN0ZBTPthk/1711291531375-632e6aa5-df88-4432-9f56-36cd0795c1a4-188261.png)

很多个图片的信息的合成（重建只是一种应用）：

![1711291637787-b747db66-36b4-4bcb-9983-fc17e93d850a.png](./img/VfS0LZzN0ZBTPthk/1711291637787-b747db66-36b4-4bcb-9983-fc17e93d850a-657496.png)



重建后模型的不确定性的度量

![1711291623597-0a94db06-7615-4735-b237-71e22e9d04ab.png](./img/VfS0LZzN0ZBTPthk/1711291623597-0a94db06-7615-4735-b237-71e22e9d04ab-100692.png)



## 推荐书籍
3d vision：

![1718975445774-7ec41878-0a1b-4243-bcb0-1e5731dda46b.png](./img/VfS0LZzN0ZBTPthk/1718975445774-7ec41878-0a1b-4243-bcb0-1e5731dda46b-015825.png)

representation：

![1718975407732-58a01cd5-9f8b-4feb-af54-7ffaa9710dc1.png](./img/VfS0LZzN0ZBTPthk/1718975407732-58a01cd5-9f8b-4feb-af54-7ffaa9710dc1-814734.png)



> 更新: 2024-06-21 14:57:33  
> 原文: <https://www.yuque.com/viruspc/el3mi0/zpvzdrphieznw7te>