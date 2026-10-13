# Animation

- [Summary](#summary)
- [History](#history)
- [Keyframe animation](#keyframe-animation)
  * [Keyframe interpolation](#keyframe-interpolation)
- [Physical simulation](#physical-simulation)
  * [Newton's Law](#newtons-law)
  * [Physical based Animation](#physical-based-animation)
  * [Mass Spring System](#mass-spring-system)
    + [Examples](#examples)
    + [A Simple Spring](#a-simple-spring)
    + [Non-zero Length Spring](#non-zero-length-spring)
    + [Introducint Energy Costs](#introducint-energy-costs)
      - [Dot Notation for Derivatives](#dot-notation-for-derivatives)
      - [Energy Costs](#energy-costs)
      - [Internal Damping for Spring](#internal-damping-for-spring)
    + [Structures from Springs](#structures-from-springs)
  * [Finite Element Method (FEM)](#finite-element-method-fem)
  * [Partical Systems](#partical-systems)
    + [System Overview](#system-overview)
    + [Partical System Animations](#partical-system-animations)
    + [Partical System Forces](#partical-system-forces)
      - [Gravitational Attraction](#gravitational-attraction)
    + [Example](#example)
    + [Simulated Flocking as an ODE](#simulated-flocking-as-an-ode)
- [Kinematics](#kinematics)
  * [Forward Kinematics](#forward-kinematics)
    + [Overview](#overview)
    + [Pros and Cons](#pros-and-cons)
  * [Inverse Kinematics](#inverse-kinematics)
    + [Overview](#overview-1)
    + [Pros and Cons](#pros-and-cons-1)
    + [Solutions](#solutions)
    + [Example](#example-1)
- [Rigging](#rigging)
  * [Overview](#overview-2)
  * [Blend Shapes](#blend-shapes)
- [Motion Capture](#motion-capture)
  * [Overview](#overview-3)
  * [Pros and Cons](#pros-and-cons-2)
  * [Motion Capture Equipment](#motion-capture-equipment)
    + [Optical Motion Capture](#optical-motion-capture)
    + [Motion Data](#motion-data)
- [Challenges of Facial Animation](#challenges-of-facial-animation)
- [The Production Pipeline](#the-production-pipeline)
- [References](#references)

---

# Summary
+ Keyframe animation
    - Interpolation
+ Physical simulation
    - Mass spring system
    - Finite Element Method (FEM)
    - Simulated Flocking
+ Kinematics
    - Forward Kinematics
    - Inverse Kinematics
+ Rigging
    - Blend shapes
+ Motion Capture



# History
"Bring things to life"

+ Communication tool
+ Aesthetic issues often dominate technical issues

An extension of modeling

+ Represent scene models as a function of time

Output: sequence of images that when viewed sequentially provide a sense of motion

+ Film: 24 frames per second
+ Video (in general): 30 fps
+ Virtual reality: 90 fps    90fps才能让人不晕

# Keyframe animation
最开始时，领头人画出关键帧，助手画中间帧。

![1683864307761-639b61d0-353c-4f28-8ccb-2945f2223711.png](./img/5oMFLTPrRu61d8GA/1683864307761-639b61d0-353c-4f28-8ccb-2945f2223711-354315.png)

## Keyframe interpolation 
取一些重要的点，这些重要的点在不同帧之间做插值

![1683864448756-2b3fba2f-457f-478c-ab67-fdca362276fa.png](./img/5oMFLTPrRu61d8GA/1683864448756-2b3fba2f-457f-478c-ab67-fdca362276fa-031844.png)

Keyframe interpolation for each parameter:

![1683864561619-e9d9c2c8-e371-45c3-9a0b-5ff58ad6ddbf.png](./img/5oMFLTPrRu61d8GA/1683864561619-e9d9c2c8-e371-45c3-9a0b-5ff58ad6ddbf-513324.png)

# Physical simulation
物理模拟/仿真



## Newton's Law
![1683864688254-b018671d-eddb-488b-b6d3-b18d0f7fca75.png](./img/5oMFLTPrRu61d8GA/1683864688254-b018671d-eddb-488b-b6d3-b18d0f7fca75-185993.png)

## Physical based Animation
建立受力模型。

只要正确建立受力模型，就不会出现穿模问题。

![1683864756407-c4b9ee74-3e51-419a-ae95-74f9389f67a7.png](./img/5oMFLTPrRu61d8GA/1683864756407-c4b9ee74-3e51-419a-ae95-74f9389f67a7-959895.png)

![1683864907078-7a2f3510-fda6-4241-a18d-01d5466840e7.png](./img/5oMFLTPrRu61d8GA/1683864907078-7a2f3510-fda6-4241-a18d-01d5466840e7-913722.png)

## Mass Spring System
质点弹簧系统是一系列相互连接的质点和弹簧

### Examples
![1683865100649-59244d33-9043-4e37-910a-21284e18a368.png](./img/5oMFLTPrRu61d8GA/1683865100649-59244d33-9043-4e37-910a-21284e18a368-325351.png)![1683865167455-72665bf1-c029-488f-af8c-da9a1fe308fa.png](./img/5oMFLTPrRu61d8GA/1683865167455-72665bf1-c029-488f-af8c-da9a1fe308fa-300434.png)

![1683865183460-d863de83-4f7e-4a61-b0ce-38ad3c158050.png](./img/5oMFLTPrRu61d8GA/1683865183460-d863de83-4f7e-4a61-b0ce-38ad3c158050-129423.png)![1683865235453-84454d0c-0ba1-41f5-9f82-1c1e51d51f9a.png](./img/5oMFLTPrRu61d8GA/1683865235453-84454d0c-0ba1-41f5-9f82-1c1e51d51f9a-962229.png)

### A Simple Spring
由两个质点和一个弹簧组成

理想化的弹簧：没有长度，被拉开多长，就产生多大的力。

胡克定律：力和形变量成正比

问题：没有考虑弹簧长度

![1683865558824-93ca7fed-9662-4afc-8b14-6490abbcc0f5.png](./img/5oMFLTPrRu61d8GA/1683865558824-93ca7fed-9662-4afc-8b14-6490abbcc0f5-100184.png)

### Non-zero Length Spring
考虑弹簧长度

问题：永远震动下去。

![1683871523329-d517f2bf-b38e-4c7a-a7e6-97df02a3fa2a.png](./img/5oMFLTPrRu61d8GA/1683871523329-d517f2bf-b38e-4c7a-a7e6-97df02a3fa2a-391297.png)

### Introducint Energy Costs
不希望震动，引入摩擦力。

#### Dot Notation for Derivatives
在模拟仿真中，用点来代替撇。

![1683871615380-1cd427ff-4b80-4ba2-a5bd-d407a4f3a62d.png](./img/5oMFLTPrRu61d8GA/1683871615380-1cd427ff-4b80-4ba2-a5bd-d407a4f3a62d-229875.png)

#### Energy Costs
不希望震动，引入摩擦力damping force（阻尼力）

阻尼力方向与速度方向相反

问题：所有运动都会停下。摩擦力考虑到外部的力，没有考虑内部的损耗。

![1683871778243-5320a735-d84e-478e-954e-f717f167f2c1.png](./img/5oMFLTPrRu61d8GA/1683871778243-5320a735-d84e-478e-954e-f717f167f2c1-048729.png)

#### Internal Damping for Spring
a和b同步运动。

相对速度在a->b方向上的投影。

有一些速度不会引起长度改变（圆周运动 ）



考虑应用在b上的摩擦力（这个摩擦力希望弹簧恢复到原始长度）。

+ 摩擦力方向：从b到a。
+ 摩擦力大小：投影到ab方向的相对速度越大，摩擦力越大。



摩擦力只和相对速度有关，与弹簧长度无关。弹力和长度有关。



![1683871930146-faf16f86-8eff-41e9-9272-cfd83c15fd73.png](./img/5oMFLTPrRu61d8GA/1683871930146-faf16f86-8eff-41e9-9272-cfd83c15fd73-315729.png) 

### Structures from Springs
组合弹簧成不同形状

![1683872511929-620050c4-b6d9-4ce7-aa9c-4b8012292d1d.png](./img/5oMFLTPrRu61d8GA/1683872511929-620050c4-b6d9-4ce7-aa9c-4b8012292d1d-864478.png)

模拟一张不，会遇到什么问题？

1. 不能抗shearing（切变）。对角线会产生，现实中不存在切变
2. 不支持out-of-plane bending。如将纸沿对角线折叠

![1683872746305-fa8e3272-7417-4bc7-b30d-bd54475465b8.png](./img/5oMFLTPrRu61d8GA/1683872746305-fa8e3272-7417-4bc7-b30d-bd54475465b8-048649.png)

改进：主对角线添加弹簧来抵抗切变。此时，沿对角线拉，蓝色弹簧会被缩短，而蓝色弹簧会产生抵抗切变的力。

问题：1. 结构不对称，各向异性 2. 不能进行非平面弯曲

![1683873046700-5eee8551-55f5-4d30-914c-447b8f1806c3.png](./img/5oMFLTPrRu61d8GA/1683873046700-5eee8551-55f5-4d30-914c-447b8f1806c3-488478.png)

改进：副对角线也添加弹簧，解决各项异性问题

问题：不能进行非平面弯曲

![1683875811991-b23b7860-425f-4fc4-854c-178386597fb3.png](./img/5oMFLTPrRu61d8GA/1683875811991-b23b7860-425f-4fc4-854c-178386597fb3-534972.png)

改进：隔一个连接。（类似深度学习领域的skip connection）

蓝色连接强，红色连接非常弱

![1683876048578-1c0c8192-d3fe-4126-8340-54d139ebf057.png](./img/5oMFLTPrRu61d8GA/1683876048578-1c0c8192-d3fe-4126-8340-54d139ebf057-248832.png)

可以用来模拟布料的自由垂落

![1683876335209-0a98de5c-06ca-426b-a418-beccf3feafd3.png](./img/5oMFLTPrRu61d8GA/1683876335209-0a98de5c-06ca-426b-a418-beccf3feafd3-040930.png)

## Finite Element Method (FEM)
除了弹簧系统外，还可以借助有限元方法来进行物理仿真。

车辆碰撞比较常用。

![1683876492625-a7d8b808-b572-4c33-97f9-9ce48a1fd416.png](./img/5oMFLTPrRu61d8GA/1683876492625-a7d8b808-b572-4c33-97f9-9ce48a1fd416-976339.jpg)

## Partical Systems
### System Overview
Model dynamical systems as collections of large numbers of particles

Each particle's motion is defined by a set of physical (or non-physical) forces

Popular technique in graphics and games. 比如游戏中的魔法效果、雾、灰尘、流体模拟等。

+ Easy to understand, implement
+ Scalable: fewer particles for speed, more for higher complexity

Challenges

+ May need many particles (e.g. fluids) 
+ May need acceleration structures (e.g. to find nearest particles for interactions)

### Partical System Animations
For each frame in animation

+ [If needed] Create new particles
+ Calculate forces on each particle
+ Update each particle's position and velocity
+ [If needed] Remove dead particles
+ Render particles

一个困难在如何定义清粒子和粒子之间的关系（ 建模）

另一个困难在如何去解

### Partical System Forces
Attraction and repulsion forces

+ Gravity, electromagnetism, ...
+ Springs, propulsion, ...

Damping forces

+ Friction, air drag, viscosity, ...

Collisions

+ Walls, containers, fixed objects, ...
+ Dynamic objects, character body parts, ...

#### Gravitational Attraction
万有引力

![1683877127217-afa91507-b25f-4a76-817c-e56f8ce055b6.png](./img/5oMFLTPrRu61d8GA/1683877127217-afa91507-b25f-4a76-817c-e56f8ce055b6-680250.png)

### Example
模拟结果不同于渲染结果

模拟结果：

![1683877241469-d2b79883-129b-41bb-b27a-097160a52724.png](./img/5oMFLTPrRu61d8GA/1683877241469-d2b79883-129b-41bb-b27a-097160a52724-131471.jpg)

不同渲染结果：

![1683877272581-ee5305f9-2f85-4fe5-977b-8d17ab46bcf1.png](./img/5oMFLTPrRu61d8GA/1683877272581-ee5305f9-2f85-4fe5-977b-8d17ab46bcf1-731962.png)

![1683877308194-902fd17e-db6f-485a-821c-49895637f669.png](./img/5oMFLTPrRu61d8GA/1683877308194-902fd17e-db6f-485a-821c-49895637f669-475013.jpg)

### Simulated Flocking as an ODE
粒子系统中的粒子，也可以理解为一个群体中的个体

Model each bird as a particle

+ 吸引力：每只鸟都不想落单，希望找到相近的鸟并融入进去
+ 排斥力：鸟和鸟之间不愿意离的太近
+ 朝向：鸟群平均 飞行方向

![1683877591787-3de1db6f-08ce-40e1-b921-b7c315fc68de.png](./img/5oMFLTPrRu61d8GA/1683877591787-3de1db6f-08ce-40e1-b921-b7c315fc68de-918156.jpg)



![1683877633103-6b825477-1445-4c20-be90-a8ea68e4c6f2.png](./img/5oMFLTPrRu61d8GA/1683877633103-6b825477-1445-4c20-be90-a8ea68e4c6f2-772569.jpg)



# Kinematics
运动学。图形学中将运动学分为正运动学和逆运动学。

## Forward Kinematics
### Overview
Joint Types

+ Pin：支持平面旋转
+ Ball：类似球形关节，支持三维旋转
+ Prismatic joint： 可以拉长

![1683877728618-1603c2ea-6421-4f81-935d-1efe90d017bf.png](./img/5oMFLTPrRu61d8GA/1683877728618-1603c2ea-6421-4f81-935d-1efe90d017bf-369876.png)

已知每个关节的位置、连接方式（如何运动），可以得到整体所有关节的位置

![1683877964589-ffce6705-aa9a-4e0f-a24d-711a632cd9d2.png](./img/5oMFLTPrRu61d8GA/1683877964589-ffce6705-aa9a-4e0f-a24d-711a632cd9d2-525473.png)

### Pros and Cons
Strengths

+ Direct control is convenient
+ Implementation is straightforward

Weaknesses

+ Animation may be inconsistent with physics 
+ Time consuming for artists 艺术家们更喜欢直接拖着某个部分到指定位置。

## Inverse Kinematics
### Overview
逆运动学

移动末端，系统自己决定其他关节改如何运动

![1683878273984-d25b72f3-1688-475a-9bd3-b955483f1447.png](./img/5oMFLTPrRu61d8GA/1683878273984-d25b72f3-1688-475a-9bd3-b955483f1447-653245.jpg)



解逆运动学

![1683878326363-7cc07f18-00e6-46dd-9b62-d3db7d9b1dea.png](./img/5oMFLTPrRu61d8GA/1683878326363-7cc07f18-00e6-46dd-9b62-d3db7d9b1dea-268643.png)

### Pros and Cons
Pros：

+ 方便艺术家创作

Cons：

+ 难解
+ 解可能不唯一
+ 解可能不存在

![1683878371956-62945994-62cc-4795-a6c8-50d530ca4060.png](./img/5oMFLTPrRu61d8GA/1683878371956-62945994-62cc-4795-a6c8-50d530ca4060-782448.png)



![1683878412512-9df1e463-a72c-464d-bdd4-e435c9fc8e49.png](./img/5oMFLTPrRu61d8GA/1683878412512-9df1e463-a72c-464d-bdd4-e435c9fc8e49-495091.png)

### Solutions
多解怎么办？根据梯度下降等优化方法直接找位置。

已知终点，求中间关节的旋转角度。

Numerical solution to general N-link IK problem

+ Choose an initial configuration
+ Define an error metric (e.g. square of distance between goal and current position)
+ Compute gradient of error as function of configuration
+ Apply gradient descent (or Newton's method, or other optimization procedure)

### Example
Style-based IK

![1683878746741-631e4f8a-a63b-458c-ae18-3a07eadb7c99.png](./img/5oMFLTPrRu61d8GA/1683878746741-631e4f8a-a63b-458c-ae18-3a07eadb7c99-972766.png)

# Rigging
## Overview
Rigging是对一个形状的控制，是逆运动学的一个应用

Rigging is a set of higher level controls on a character that allow more rapid & intuitive modification of pose, deformations, expression, etc.

为物体添加控制点（骨骼），拖动控制点



Important

+ Like strings on a puppet
+ Captures all meaningful character changes
+ Varies from character to character

Expensive to create

+ Manual effort
+ Requires both artistic and technical training

![1683879853250-c0ae86a8-e08f-4a5e-a47c-e3cc82e4b029.png](./img/5oMFLTPrRu61d8GA/1683879853250-c0ae86a8-e08f-4a5e-a47c-e3cc82e4b029-959781.png) 

## Blend Shapes
两个Shape的控制点之间做插值。  

Instead of skeleton, interpolate directly between surfaces

E.g., model a collection of facial expressions:

Simplest scheme: take linear combination of vertex positions

Spline used to control choice of weights over time

# Motion Capture
## Overview
动作捕捉

Data-driven approach to creating animation sequences

+ Record real-world performances (e.g. person executing an activity)
+ Extract pose as a function of time from the data collected

![1683880264509-68ef8440-c47e-4eaf-84b6-b2c1f702ef11.png](./img/5oMFLTPrRu61d8GA/1683880264509-68ef8440-c47e-4eaf-84b6-b2c1f702ef11-415992.png)

## Pros and Cons
Strengths

+ Can capture large amounts of real data quickly
+ Realism can be high

Weaknesses

+ Complex and costly set-ups
+ Captured animation may not meet artistic needs, requiring alterations

## Motion Capture Equipment
![1683880537651-c57ad6dd-6614-4961-a483-3111af8c63ba.png](./img/5oMFLTPrRu61d8GA/1683880537651-c57ad6dd-6614-4961-a483-3111af8c63ba-939486.png)

### Optical Motion Capture
光学动作捕捉最常见

![1683880888500-de59147d-1ff2-4140-bcbb-5f354816fcf1.png](./img/5oMFLTPrRu61d8GA/1683880888500-de59147d-1ff2-4140-bcbb-5f354816fcf1-241730.png)

### Motion Data
![1683880947521-4f6dd010-5485-4c63-9f83-fd5349737be9.png](./img/5oMFLTPrRu61d8GA/1683880947521-4f6dd010-5485-4c63-9f83-fd5349737be9-643497.png)

# Challenges of Facial Animation
![1683880987244-1373d8cd-89be-4abc-96bb-bfb28d3a0917.png](./img/5oMFLTPrRu61d8GA/1683880987244-1373d8cd-89be-4abc-96bb-bfb28d3a0917-745120.png)

# The Production Pipeline
图形学中FX是effects的简称

![1683881137863-c871144e-1f9b-4a2d-91eb-653dc9911c87.png](./img/5oMFLTPrRu61d8GA/1683881137863-c871144e-1f9b-4a2d-91eb-653dc9911c87-211430.png)



# References
+ [https://www.bilibili.com/video/BV1X7411F744?p=21&vd_source=a637826c55b409b420b4b6584a6e8379](https://www.bilibili.com/video/BV1X7411F744?p=21&vd_source=a637826c55b409b420b4b6584a6e8379)



> 更新: 2023-05-12 08:54:33  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gxcms6mga0qgi7is>