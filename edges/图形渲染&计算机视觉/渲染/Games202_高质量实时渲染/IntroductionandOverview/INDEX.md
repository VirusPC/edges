# Introduction and Overview

- [Course Introduction](#course-introduction)
  * [What is Games202 about?](#what-is-games202-about)
    + [Shadow and Environment Mapping](#shadow-and-environment-mapping)
    + [Interactive Global Environment Techniques](#interactive-global-environment-techniques)
    + [Precomputed Radiance Transfer](#precomputed-radiance-transfer)
    + [Real-Time Ray Tracing](#real-time-ray-tracing)
    + [Participating Meida Rendering, Image Space Effects, etc.](#participating-meida-rendering-image-space-effects-etc)
    + [Antialiasing and Supersampling](#antialiasing-and-supersampling)
  * [What is Games 202 not about?](#what-is-games-202-not-about)
  * [How to Study Games 202](#how-to-study-games-202)
  * [Why to Study Games 202](#why-to-study-games-202)
  * [Prequisites](#prequisites)
  * [No Need to Use An IDE](#no-need-to-use-an-ide)
- [Real Time Ray Tracing Overview](#real-time-ray-tracing-overview)
  * [Motivation](#motivation)
  * [Evolution of Real-Time Rendering](#evolution-of-real-time-rendering)
  * [Technological and algorithmic milestones](#technological-and-algorithmic-milestones)
- [Others](#others)
- [References](#references)

---

# Course Introduction
Siggraph2022上有学者具象化了实时光线追踪的困难。高质量光照所要求的光线，是要求每像素发射几百根，而现在的游戏算力支持每像素一根都做不到。

Lumen的厉害之处，实现了光线的无限次反弹。



光线追踪主要慢在光线与哪一个三角面相交。Lumen通过距离场来解决这一问题。

## What is Games202 about?
+ **<font style="color:#DF2A3F;">Real-Time</font>** High Quality Rendering
    - **Speed**: more than 30 FPS (frames per second), even more for Virtual / Augmented Reality VR / AR): 90 FPS
    - **Interactivity**: Each frame generated on the fly.
+ Real-Time **<font style="color:#DF2A3F;">High Quality</font>** Rendering
    - **Realism**: advanced approaches to make rendering more realistic
    - **Dependability**: all-time correctness (exact or approximate), no tolerance to (uncontrollable) failures. 每一帧随机出现一个像素错误的问题在动画中难以忍受，比如Metropolis Light Transport 。
+ Real-Time High Quality **<font style="color:#DF2A3F;">Rendering</font>**
    - What is Rendering? Calculating light to eye.

![1684560838094-0c7176a2-aea3-4de6-9997-a0cde4b26871.png](./img/sQPzuyq8OFzsc0Lb/1684560838094-0c7176a2-aea3-4de6-9997-a0cde4b26871-035029.png)

Highest Level: 4 different parts on real-time rendering

1. Shadows (and env)
2. Global Illumination (Scene/image space precomputed)
3. Physically-based Shading
4. Real-time ray tracing



![1684560876715-6d57aa6d-5f50-42df-ba3e-44e5889ffdee.png](./img/sQPzuyq8OFzsc0Lb/1684560876715-6d57aa6d-5f50-42df-ba3e-44e5889ffdee-612194.png)

### Shadow and Environment Mapping
![1684578184941-7325b9c4-c6b7-41dd-a79c-b6f980320bae.png](./img/sQPzuyq8OFzsc0Lb/1684578184941-7325b9c4-c6b7-41dd-a79c-b6f980320bae-260226.jpg)

### Interactive Global Environment Techniques
![1684578220708-a2e90847-56ff-4370-9d9a-e30a85d3205b.png](./img/sQPzuyq8OFzsc0Lb/1684578220708-a2e90847-56ff-4370-9d9a-e30a85d3205b-694997.png)

### Precomputed Radiance Transfer
![1684579271611-a38782e4-84ac-4ec6-a045-859f59e696c3.png](./img/sQPzuyq8OFzsc0Lb/1684579271611-a38782e4-84ac-4ec6-a045-859f59e696c3-539278.png)

### Real-Time Ray Tracing
![1684579305190-7b7497e8-022a-47c4-b3b9-6aa08c90eeb7.png](./img/sQPzuyq8OFzsc0Lb/1684579305190-7b7497e8-022a-47c4-b3b9-6aa08c90eeb7-072252.png)

### Participating Meida Rendering, Image Space Effects, etc.
![1684579396079-5a827996-d095-4bc7-af63-14ae80610efc.png](./img/sQPzuyq8OFzsc0Lb/1684579396079-5a827996-d095-4bc7-af63-14ae80610efc-135423.jpg)

![1684579486533-34e18cb1-1e77-4102-9bc0-bb48854ced1f.png](./img/sQPzuyq8OFzsc0Lb/1684579486533-34e18cb1-1e77-4102-9bc0-bb48854ced1f-516654.jpg)

### Antialiasing and Supersampling
![1684579514620-a24c858c-b18f-4856-a921-ea35f4c2cdcf.png](./img/sQPzuyq8OFzsc0Lb/1684579514620-a24c858c-b18f-4856-a921-ea35f4c2cdcf-155463.jpg)





## What is Games 202 not about?
1. 3D modeling or game development using Unreal Engine
    1. ![1684580142074-128cbb64-e627-45fd-aeba-44a27c2b2afd.png](./img/sQPzuyq8OFzsc0Lb/1684580142074-128cbb64-e627-45fd-aeba-44a27c2b2afd-745242.png)
2. Expensive (but not accurate) light transport techniques in movies/animations.
    1. 完整的图形学课应该包含基础（games101），实时渲染（games202）和离线渲染。
    2. ![1684580201891-58286102-a391-4aa6-9b5c-e0f01c209831.png](./img/sQPzuyq8OFzsc0Lb/1684580201891-58286102-a391-4aa6-9b5c-e0f01c209831-074363.png)
3. Neural Rendering
    1. ![1684580267137-19522d82-a648-4884-a980-082df5658c5b.png](./img/sQPzuyq8OFzsc0Lb/1684580267137-19522d82-a648-4884-a980-082df5658c5b-018308.png)
    2. 现在绝大部分的neural rendering做不到两个事
        1. Real time
        2. High quality
4. Using OpenGL
5. Scene / Shader Optimization
6. Reverse engineering of shaders
7. High performance computing.
    1. e.g. CUDA programing

## How to Study Games 202
![1684583671412-de16a332-cf03-4087-9183-1d5bf35a3791.png](./img/sQPzuyq8OFzsc0Lb/1684583671412-de16a332-cf03-4087-9183-1d5bf35a3791-106460.png)

## Why to Study Games 202
Computer Graphics is AWSOME!

## Prequisites
![1684583855600-74688636-f460-491e-8ed9-2238cfc028f6.png](./img/sQPzuyq8OFzsc0Lb/1684583855600-74688636-f460-491e-8ed9-2238cfc028f6-784635.png)



## No Need to Use An IDE
![1684586696525-f6048c43-f67b-43d0-97bd-2403ec470755.png](./img/sQPzuyq8OFzsc0Lb/1684586696525-f6048c43-f67b-43d0-97bd-2403ec470755-354980.png)



# Real Time Ray Tracing Overview
+ Motivation
+ Evolution of real-time rendering
    - Technological and algorithmic milestones
    - Programmable graphics hardware
    - Precomputation-based methods
    - Interactive Ray Tracing

## Motivation
+ Today, Computer Graphics is able to generate photorealistic images
    - Complex geometry, lighting, materials, shadows
    - Computer-generated movies/special effects (difficult or impossible to tell real from rendered...)
+ But accurate algorithms (esp. ray tracing) are very slow
    - So they are called offline rendering methods
    - Remember how long it takes to render 1 frame in Zootopia? 1w cpu call

## Evolution of Real-Time Rendering
+ Interactive 3D graphics pipeline as in OpenGL
    - Earliest SGI machines (Clark 82) to today
    - Most of focus on more geometry, texture mapping
    - Some tweaks for realism (shadow mapping, accum. buffer)20 years ago
    - Interactive 3D geometry with simple texture mapping, fake
    - shadows (OpenGL, Directx)
+ 20 -> 10 years ago  10年前可编程渲染管线的出现，人们可以自由控制着色，游戏效果突飞猛进
    - A giant leap since the emergence of programmable shaders (2000)
    - Complex environment lighting, real materials (velvet, satin, paints), soft shadows
+ Today
    - Stunning graphics
    - Extended to Virtual Reality (VR) and even movies
+ In the future

![1684587382875-8266533b-2283-461d-bcda-e5ad1750f11b.png](./img/sQPzuyq8OFzsc0Lb/1684587382875-8266533b-2283-461d-bcda-e5ad1750f11b-526055.jpg)

![1684587341824-f975c094-8a1b-4b4c-ab10-b27ccf20236a.png](./img/sQPzuyq8OFzsc0Lb/1684587341824-f975c094-8a1b-4b4c-ab10-b27ccf20236a-991002.jpg)

![1684587352985-4300585d-95a6-41b2-a309-9d9db6851a04.png](./img/sQPzuyq8OFzsc0Lb/1684587352985-4300585d-95a6-41b2-a309-9d9db6851a04-531594.jpg)

![1684587482592-2461c34e-4859-4960-9de1-f05d25659cc5.png](./img/sQPzuyq8OFzsc0Lb/1684587482592-2461c34e-4859-4960-9de1-f05d25659cc5-877718.jpg)

## Technological and algorithmic milestones
+ Programmable graphics hardware (20years ago: shaders)
+ Precomputation-based methods (15 years ago)
    - Complex visual effects are (partially) **pre-computed**
    - Minimum rendering cost at **run time**
    - Relighting
        * Fix geometry
        * Fix viewport
        * Dynamically change lighting
+ Interactive Ray Tracing (8-10 years ago: CUDA + OptiX)
    - Hardware development allows ray tracing on GPUs at low sampling rates (~1 samples per pixel (SPP))
    - Followed by post processing to denoise

![1684587748487-34dd79f1-a870-41c3-884d-58882afcf5eb.png](./img/sQPzuyq8OFzsc0Lb/1684587748487-34dd79f1-a870-41c3-884d-58882afcf5eb-322037.png)

![1684587888905-d838a77e-3f2b-415b-bc7b-612c1c760f7a.png](./img/sQPzuyq8OFzsc0Lb/1684587888905-d838a77e-3f2b-415b-bc7b-612c1c760f7a-685262.jpg)

![1684588015841-06370211-dfe9-4f9e-ac4f-4d2064c6bbdd.png](./img/sQPzuyq8OFzsc0Lb/1684588015841-06370211-dfe9-4f9e-ac4f-4d2064c6bbdd-749170.jpg)

![1684588133839-afb11009-3ed0-4df6-a38a-dd830d66516d.png](./img/sQPzuyq8OFzsc0Lb/1684588133839-afb11009-3ed0-4df6-a38a-dd830d66516d-361319.jpg)



# Others
如何判断一个游戏引擎渲染效果好不好？画面是否明亮。

# References
+ [GAMES202-高质量实时渲染_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1YK4y1T7yY/?spm_id_from=333.337.search-card.all.click&vd_source=a637826c55b409b420b4b6584a6e8379)





> 更新: 2023-10-17 04:49:25  
> 原文: <https://www.yuque.com/viruspc/el3mi0/yrvx7y4808zru1wk>