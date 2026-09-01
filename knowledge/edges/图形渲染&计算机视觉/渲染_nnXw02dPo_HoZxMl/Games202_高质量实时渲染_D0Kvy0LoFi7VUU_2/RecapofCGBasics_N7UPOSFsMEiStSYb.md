# Recap of CG Basics

- [Summary](#summary)
- [Graphics (hardware) pipeline](#graphics-hardware-pipeline)
- [OpenGL](#opengl)
  * [Why?](#why)
  * [How?](#how)
- [OpenGL Shading Language (GLSL)](#opengl-shading-language-glsl)
  * [Shading Languages](#shading-languages)
  * [Shader Setup](#shader-setup)
  * [Debugging Shaders](#debugging-shaders)
- [The Rendering Equation](#the-rendering-equation)
- [Calculus](#calculus)
- [References](#references)

---

# Summary
Recap of CG Basics

+ Basic GPU hardware pipeline
+ OpenGL
+ OpenGL Shading Language (GLSL)
+ The Rendering Equation
    - ![1685202442790-789562e9-72ad-45af-a0a2-f0587427e9ce.png](./img/N7UPOSFsMEiStSYb/1685202442790-789562e9-72ad-45af-a0a2-f0587427e9ce-814094.png)
+ Calculus

# Graphics (hardware) pipeline
现在可能没有适合全局光照的管线，但这个管线比较适合实时光线追踪。



可能先判断遮挡再着色，也可能先着色再判断遮挡，视具体实现而定。

![1684722223875-4c324647-ec6c-4cdf-a88c-f4ea3e48533d.png](./img/N7UPOSFsMEiStSYb/1684722223875-4c324647-ec6c-4cdf-a88c-f4ea3e48533d-927251.png)

Vertex Processing:

![1684722277840-ff24bfd7-a19d-4f50-8300-5186d249369c.png](./img/N7UPOSFsMEiStSYb/1684722277840-ff24bfd7-a19d-4f50-8300-5186d249369c-978419.png)

Rasterization:

![1684722288185-7bfa38c9-bddb-419b-a015-701eb508d99e.png](./img/N7UPOSFsMEiStSYb/1684722288185-7bfa38c9-bddb-419b-a015-701eb508d99e-873512.png)

深度缓存：

![1684722332901-db3adfa2-5a54-433d-a21a-f36c81638d27.png](./img/N7UPOSFsMEiStSYb/1684722332901-db3adfa2-5a54-433d-a21a-f36c81638d27-580195.png)

着色模型：

Blinn-Phong 模型对直接光照处理的还可以，但处理不好任何全局现象，比如阴影、光线的多次弹射。

![1684722357319-df5c30fb-ceac-4a95-b46a-b8f1ed20cfeb.png](./img/N7UPOSFsMEiStSYb/1684722357319-df5c30fb-ceac-4a95-b46a-b8f1ed20cfeb-557765.png)

Texture mapping & interpolation

![1684722507032-e65e3e7e-e88c-41b8-973f-78f5c067877e.png](./img/N7UPOSFsMEiStSYb/1684722507032-e65e3e7e-e88c-41b8-973f-78f5c067877e-258528.png)

参数化问题：包括：对于贴图，如何尽量减少扭曲，且使得贴图映射到物体上后各个位置的拉伸程度差不多

# OpenGL
## Why?
Is a set of APls that call the GPU pipeline from CPU

+ Therefore, language does not matter!
+ Cross platform
+ Alternatives (Direct, Vulkan, etc.)

Cons

+ Fragmented: lots of different versions
+ C style, not easy to use
+ Cannot debug (?)

Understanding

+ 1-to-1 mapping to our software rasterizer in GAMES101

## How?
+ Important analogy: oil painting
    - A: Place objects/models  (VAO + model transformation)
    - B: Set position of an easel  (view transformation + projection + framebuffer)
    - C: Attach a canvas to the easel （output textures）
    - D: Paint to the canvas （Specify vertex / fragment shaders）
    - E: (Attach other canvases to the easel and continue painting)
+ Summary: in each pass
    - Specify objects, camera, MVP, etc.
    - Specify framebuffer and input/output textures
    - Specify vertex / fragment shaders
    - When you have everything specified on the GPU) Render!
+ What's left?
    - Multiple pass. (shadow mapping)

![1684723441146-e471dc93-b599-4781-8619-15a65cbfc1e3.png](./img/N7UPOSFsMEiStSYb/1684723441146-e471dc93-b599-4781-8619-15a65cbfc1e3-597851.png)



![1684723614732-a43c654b-5391-436d-9743-178adad097dd.png](./img/N7UPOSFsMEiStSYb/1684723614732-a43c654b-5391-436d-9743-178adad097dd-831548.png)

之前 OpenGL 不支持 multiple render target，一次渲染只能出一个渲染结果。现在可以同时输出渲染结果、深度胡缓存等等。

有一个特殊的目标，就是设备屏幕。现在不太推荐直接渲染到屏幕，可能会出现画面撕裂问题。解决方式：垂直同步、双重缓冲、三重缓冲等。

![1684723695097-1198fb9f-c3d5-46be-bbd4-e28645ad6b15.png](./img/N7UPOSFsMEiStSYb/1684723695097-1198fb9f-c3d5-46be-bbd4-e28645ad6b15-741239.png)

![1684724256483-8550384e-23d2-43f8-82ce-904304e27964.png](./img/N7UPOSFsMEiStSYb/1684724256483-8550384e-23d2-43f8-82ce-904304e27964-822474.png)

![1684724598755-985ccaec-2357-4d87-a490-bfc73ae91416.png](./img/N7UPOSFsMEiStSYb/1684724598755-985ccaec-2357-4d87-a490-bfc73ae91416-873890.png)

# OpenGL Shading Language (GLSL)
## Shading Languages
![1684724829587-adcfa901-19cc-475d-98a7-4dfd27f624c8.png](./img/N7UPOSFsMEiStSYb/1684724829587-adcfa901-19cc-475d-98a7-4dfd27f624c8-352104.png)

## Shader Setup
+ Initializing (shader itself discussed later)
    - Create shader Vertex and Fragment)
    - Compile shader
    - Attach shader to program
    - Link program
    - Use program
+ Shader source is just sequence of strings
+ Similar steps to compile a normal program

![1684724944759-80a000a5-5134-437f-88e0-76f65bd3b411.png](./img/N7UPOSFsMEiStSYb/1684724944759-80a000a5-5134-437f-88e0-76f65bd3b411-187990.png)

![1684725064346-7fb00f26-72fd-4e2d-a166-b99d7af5c427.png](./img/N7UPOSFsMEiStSYb/1684725064346-7fb00f26-72fd-4e2d-a166-b99d7af5c427-799731.png)

## Debugging Shaders
SpectorJS

如何debug？print。

如何print？输出颜色到画布上，然后通过color picker提取颜色。

![1684726119515-4aebdc56-63eb-48ca-a603-e9e007495f3a.png](./img/N7UPOSFsMEiStSYb/1684726119515-4aebdc56-63eb-48ca-a603-e9e007495f3a-983485.png)

![1684726202830-64004e37-1358-4c50-b062-7b5c75f84450.png](./img/N7UPOSFsMEiStSYb/1684726202830-64004e37-1358-4c50-b062-7b5c75f84450-472781.png)

# The Rendering Equation
RTR 中的 rendering equation 和 games101 里的略有不同。

+ BRDF 通常包括 cosine 项。
+ incident lighting 仅指光源直接发出的radiance。incident lighting （光源）来自各个方向。
+ 明确考虑 shading point 是否可以被看到 —— visibility term。
+ RTR中，incident lighting 与 visibility term 结合，才是光源到达这一点的 incident radiance

![1684726426626-6612936a-d9a2-43cf-b9e8-2538d1a0088a.png](./img/N7UPOSFsMEiStSYb/1684726426626-6612936a-d9a2-43cf-b9e8-2538d1a0088a-121425.png)

![1684726544445-f9e30642-9bce-41f0-b8b3-e4a300ca18da.png](./img/N7UPOSFsMEiStSYb/1684726544445-f9e30642-9bce-41f0-b8b3-e4a300ca18da-202607.png)



新的rendering equation的理解有什么好处？

+ incident lighting （光源）来自各个方向，**方便处理环境光照**。

![1684726902362-65f308af-8aea-4600-a589-27bbd2953ceb.png](./img/N7UPOSFsMEiStSYb/1684726902362-65f308af-8aea-4600-a589-27bbd2953ceb-770925.png)

全局光照 = 直接光照 + 间接光照

大多数情况下，仅考虑直接光照 和 考虑直接光照加一次弹射的间接光照 的渲染效果差很大，而弹射一次和两次及多次相差不大。

结合光线弹射次数的指数爆炸问题，故一般解决全局光照问题就是解决直接光照加一次弹射的间接光照的问题。

# Calculus
# References
+ [Lecture2 Recap of CG Basics_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1YK4y1T7yY/?p=2&spm_id_from=pageDriver&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [Spector.js demos & documentation](https://spector.babylonjs.com/)



> 更新: 2023-06-27 08:44:42  
> 原文: <https://www.yuque.com/viruspc/el3mi0/dgeiw2vgrcyiiirc>