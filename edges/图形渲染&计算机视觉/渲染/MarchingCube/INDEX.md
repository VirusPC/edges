# Marching Cube

- [SDF](#sdf)
- [A simple cube](#a-simple-cube)
- [References](#references)

---

> Marching cubes这个算法虽然古老（1987）但依旧是隐式表达到显式表达转换的de-facto；这个算法的输入是SDF： 关于SDF，喜欢玩shadertoy的小伙伴都知道，在上面写shader的时候可没有显式的mesh，都是靠SDF的隐式表达结合ray-marching实现各种各样fancy的效果
>



## SDF
几何的隐式表达：

![1706436820647-1e3cf708-6cec-4664-8513-f522c276422e.png](./img/OWrExml2Zls7p2zy/1706436820647-1e3cf708-6cec-4664-8513-f522c276422e-639238.png)

可视化。 右侧的数值被称为<font style="color:#DF2A3F;"> surface level</font>。surface level 是一个很重要的参数。

![1706436851432-a1313d9d-0f4b-4625-87ef-06e5fbbcc435.png](./img/OWrExml2Zls7p2zy/1706436851432-a1313d9d-0f4b-4625-87ef-06e5fbbcc435-160397.png)

![1706436969482-79964a37-3ff9-448e-9a5d-70517b8db261.png](./img/OWrExml2Zls7p2zy/1706436969482-79964a37-3ff9-448e-9a5d-70517b8db261-823522.png)

![1706437013022-542e2cef-dff3-41b4-b914-1db0d5d66ac9.png](./img/OWrExml2Zls7p2zy/1706437013022-542e2cef-dff3-41b4-b914-1db0d5d66ac9-251982.png)

## A simple cube
1. 点亮一点

![1706437347922-471b693a-1e51-4bd7-8662-ad1314736751.png](./img/OWrExml2Zls7p2zy/1706437347922-471b693a-1e51-4bd7-8662-ad1314736751-238873.png)

2. 点亮两点

![1706437385242-16701f90-50d6-48a1-9044-166ccc46e28f.png](./img/OWrExml2Zls7p2zy/1706437385242-16701f90-50d6-48a1-9044-166ccc46e28f-888529.png)

2. 点亮三点

![1706437458146-75be6957-b116-446c-83fc-ebd38d5a49bf.png](./img/OWrExml2Zls7p2zy/1706437458146-75be6957-b116-446c-83fc-ebd38d5a49bf-181753.png)

一共16种情况：

![1706437499637-e968514f-42a2-495d-8083-07d9263c3aec.png](./img/OWrExml2Zls7p2zy/1706437499637-e968514f-42a2-495d-8083-07d9263c3aec-466933.png)



![1706437143371-4313cada-efdc-4e91-9c80-3b63ff6c8601.png](./img/OWrExml2Zls7p2zy/1706437143371-4313cada-efdc-4e91-9c80-3b63ff6c8601-208590.png)

![1706436610578-34e7167c-8a66-4f52-b450-9ff11b208d47.png](./img/OWrExml2Zls7p2zy/1706436610578-34e7167c-8a66-4f52-b450-9ff11b208d47-110527.png)

可以总结为一个 triangluation table:

![1706437687720-935c90f1-d689-424c-a082-59f24a5e8d6c.png](./img/OWrExml2Zls7p2zy/1706437687720-935c90f1-d689-424c-a082-59f24a5e8d6c-238112.png)将顶点的组合用一个二进制数字来表达：

![1706437715705-72d77fad-3e84-461e-96a3-08f53b4d18d0.png](./img/OWrExml2Zls7p2zy/1706437715705-72d77fad-3e84-461e-96a3-08f53b4d18d0-259613.png)

![1706437735303-f43fb2e3-6b51-48fb-88e5-a383a59d093a.png](./img/OWrExml2Zls7p2zy/1706437735303-f43fb2e3-6b51-48fb-88e5-a383a59d093a-694186.png)

然后就可以根据二进制数字查表得到三角形顶点了：

![1706437801574-c88764e9-1dd7-4441-bc99-e41826431d03.png](./img/OWrExml2Zls7p2zy/1706437801574-c88764e9-1dd7-4441-bc99-e41826431d03-616872.png)

indexed vertex：

![1706437813893-25652594-ed1f-4f50-96ab-83917cf94449.png](./img/OWrExml2Zls7p2zy/1706437813893-25652594-ed1f-4f50-96ab-83917cf94449-025244.png)

![1706437901804-4cf5d579-0929-48f4-9b73-7910ebeaf80c.png](./img/OWrExml2Zls7p2zy/1706437901804-4cf5d579-0929-48f4-9b73-7910ebeaf80c-660335.png)

接下来要做的，就是marching整个空间：

![1706437947649-108787af-9cb5-4bae-9ee5-2889dc23fbbf.png](./img/OWrExml2Zls7p2zy/1706437947649-108787af-9cb5-4bae-9ee5-2889dc23fbbf-409882.png)

![1706437956745-3c271082-4ba8-464e-8439-8c51ed9c613e.png](./img/OWrExml2Zls7p2zy/1706437956745-3c271082-4ba8-464e-8439-8c51ed9c613e-591331.png)

![1706438008245-8436c7a9-d874-4b82-b0aa-251da31bdd98.png](./img/OWrExml2Zls7p2zy/1706438008245-8436c7a9-d874-4b82-b0aa-251da31bdd98-314413.png)

![1706438026716-66fa3bfc-79fb-48f4-a22f-6c67bb1b1eba.png](./img/OWrExml2Zls7p2zy/1706438026716-66fa3bfc-79fb-48f4-a22f-6c67bb1b1eba-920124.png)

without interpolation: 总是将顶点放在边的中点，即上面那16种情况

![1706438048865-7b1bd6ca-0b65-4337-b6d8-b88a1e01374a.png](./img/OWrExml2Zls7p2zy/1706438048865-7b1bd6ca-0b65-4337-b6d8-b88a1e01374a-513415.png)

![1706438159547-63458bb7-e6a3-4f88-ad12-09aa51e91347.png](./img/OWrExml2Zls7p2zy/1706438159547-63458bb7-e6a3-4f88-ad12-09aa51e91347-656542.png)

with interpolation: 根据实际值，做插值



![1706438169258-d0bb1efc-d5fd-416a-ad6c-31ef66216f9e.png](./img/OWrExml2Zls7p2zy/1706438169258-d0bb1efc-d5fd-416a-ad6c-31ef66216f9e-243690.png)

下图假设 surface level = 0

![1706438183682-4af574f2-6fc4-4bca-a803-5cdab29f7e23.png](./img/OWrExml2Zls7p2zy/1706438183682-4af574f2-6fc4-4bca-a803-5cdab29f7e23-448137.png)





## References


+ [读书笔记 - Marching Cubes 算法](https://zhuanlan.zhihu.com/p/613392327)
+ [https://www.youtube.com/watch?v=M3iI2l0ltbE](https://www.youtube.com/watch?v=M3iI2l0ltbE)
+ Unity 代码： [https://github.com/SebLague/Marching-Cubes](https://github.com/SebLague/Marching-Cubes)
+ [地形、大气和云](https://www.yuque.com/pengcheng-fuigs/el3mi0/ewvn8igeil345gm7#OsK4p)
+ [Shadertoy](https://www.shadertoy.com/view/sltyRM)
+ [Shadertoy](https://www.shadertoy.com/view/ftXGDj)
+ 



> 更新: 2024-01-28 10:44:07  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ytfqms4nix3dgtf9>