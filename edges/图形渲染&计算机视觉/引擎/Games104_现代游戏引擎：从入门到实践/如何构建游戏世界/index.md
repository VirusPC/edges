# 如何构建游戏世界

- [Summary](#summary)
- [How to Describe the World?](#how-to-describe-the-world)
  * [Game Object](#game-object)
  * [Components](#components)
- [How to Make the World Alive?](#how-to-make-the-world-alive)
  * [Tick](#tick)

---

## Summary
![1701089622536-ed188887-f406-49a1-979b-e15a5f7f4693.png](./img/jKnkcdck29W8RtKN/1701089622536-ed188887-f406-49a1-979b-e15a5f7f4693-054827.png)





![1701088809954-6e1bda7d-b7e9-4af7-ac7c-d7af8620a444.png](./img/jKnkcdck29W8RtKN/1701088809954-6e1bda7d-b7e9-4af7-ac7c-d7af8620a444-833255.jpg)

在上一节课中我们介绍了现代游戏引擎的分层架构，而在本节课中我们会开始构造整个游戏世界。



## <font style="color:rgb(0, 0, 0);">How to Describe the World?</font>
### Game Object 
首先我们要考虑游戏世界是由哪些组件构成的。以《战地2042》为例：

+ 游戏中包含了大量的可互动对象包括坦克、无人机、火炮、士兵等。
+ 除此之外，游戏中还包含了很多静态的对象比如说各种建筑物。
+ 这些动态和静态的游戏对象都依附于游戏场景，一般来说场景包括天空、植被以及地形等。
+ 在玩家看不到的地方还有一些其它类型的游戏对象，它们为整个玩法提供支持。

总结一下，游戏世界是由各种各样的游戏对象(game object, GO)组成的。

![1701088887035-c898919d-b3c2-4a10-bcc7-ffc2ac7eb3e3.png](./img/jKnkcdck29W8RtKN/1701088887035-c898919d-b3c2-4a10-bcc7-ffc2ac7eb3e3-042069.jpg)

![1701088899192-4853917c-e37c-40dd-9743-abe2f5623094.png](./img/jKnkcdck29W8RtKN/1701088899192-4853917c-e37c-40dd-9743-abe2f5623094-233945.jpg)

![1701088940455-de14d184-0c04-4b5b-addf-4697f0f92c3f.png](./img/jKnkcdck29W8RtKN/1701088940455-de14d184-0c04-4b5b-addf-4697f0f92c3f-156268.jpg)  
![1701089008277-1b64af47-ce84-47ca-b189-143fec382a07.png](./img/jKnkcdck29W8RtKN/1701089008277-1b64af47-ce84-47ca-b189-143fec382a07-509634.jpg)

![1701089050650-82a9849b-db56-44bc-b2d8-36ff68721d25.png](./img/jKnkcdck29W8RtKN/1701089050650-82a9849b-db56-44bc-b2d8-36ff68721d25-958827.jpg)

### <font style="color:rgb(0, 0, 0);">Components</font>
<font style="color:rgb(34, 34, 34);">那么如何描述一个游戏对象呢？最直观的方法是使用面向对象编程的思路把GO划分为</font>**<font style="color:rgb(34, 34, 34);">属性</font>**<font style="color:rgb(34, 34, 34);">和</font>**<font style="color:rgb(34, 34, 34);">行为</font>**<font style="color:rgb(34, 34, 34);">。同时，不同GO之间的依赖关系还可以通过继承的方式来加以描述。</font>

<font style="color:rgb(34, 34, 34);"></font>

<font style="color:rgb(34, 34, 34);">但在实践中人们发现GO之间的关系往往是非常复杂的，仅通过继承的方式无法完整地描述不同对象之间的关系。因此在现代游戏引擎中一般是通过</font>**<font style="color:rgb(34, 34, 34);">组件化(components)</font>**<font style="color:rgb(34, 34, 34);">的方式来描述一个对象，这样每个GO都可以拆分成若干个相互独立的组件。以无人机为例，我们可以把任意形式的无人机拆分成Transform、Motor、Model、AI等组件，然后单独实现每个组件的功能。</font>

![1701089129421-d943fb02-c47f-4651-9b72-44a537e6e0e2.png](./img/jKnkcdck29W8RtKN/1701089129421-d943fb02-c47f-4651-9b72-44a537e6e0e2-919618.png)



以无人机为例，我们可以把任意形式的无人机拆分成Transform、Motor、Model、AI等组件，然后单独实现每个组件的功能。这样当我们想要取定义新的无人机类型时只需要替换相应的组件即可。

![1701089454923-abb4d47e-7c88-4912-807b-46fd3bc55dab.png](./img/jKnkcdck29W8RtKN/1701089454923-abb4d47e-7c88-4912-807b-46fd3bc55dab-735955.png)

![1701089506527-971f98b1-f50c-4e47-881e-4de83a9e7219.png](./img/jKnkcdck29W8RtKN/1701089506527-971f98b1-f50c-4e47-881e-4de83a9e7219-920863.png)





<font style="color:rgb(34, 34, 34);">目前市面上常见的商业游戏引擎，包括Unity和虚幻等都使用了组件化的设计思想。我们在设计自己的游戏引擎时也应遵循这样的设计理念。</font>

![1701089538178-0b5fe577-0d2d-4ee9-bc27-7c8ba42cca25.png](./img/jKnkcdck29W8RtKN/1701089538178-0b5fe577-0d2d-4ee9-bc27-7c8ba42cca25-922063.png)



UE中的UObject不是GO，比GO更低级。

![1701089612885-5f5f6121-f85e-4d2d-86c3-817caf36d97b.png](./img/jKnkcdck29W8RtKN/1701089612885-5f5f6121-f85e-4d2d-86c3-817caf36d97b-833871.png)



## How to Make the World Alive?
### Tick
接下来我们考虑如何让整个游戏世界动起来。回忆我们在上节课介绍过的tick机制，我们可以在每个时钟周期中分别对每个GO调用tick()函数，这种方式称为object-based tick。（整个世界tick时，每个object tick一遍）

另一种调用tick()函数的方式是以组件作为基本单位，每个时钟周期内我们依次tick不同GO的同一类组件。这种方式称为component-based tick。（整个世界tick时，先把object分组，再按分组顺序把每个object tick一遍。有点像所有人先动头，再动手，再动脚）



component-based tick相对要反直觉一点，但却有着更高的性能。component-based tick相当于把系统的tick()函数分解成流水线，这样可以提高系统的并行性并重复利用缓存。（读写存取效率更高？并且可以保证执行顺序？）



![1701089671614-5a447d43-d05a-447f-b2a0-152e950f7dfe.png](./img/jKnkcdck29W8RtKN/1701089671614-5a447d43-d05a-447f-b2a0-152e950f7dfe-657074.png)

![1701089740482-4a26a563-329f-4a79-b7b9-8b02cf171b91.png](./img/jKnkcdck29W8RtKN/1701089740482-4a26a563-329f-4a79-b7b9-8b02cf171b91-090181.png)

![1701089864439-a1bdc2aa-654d-4c93-ad44-5b397b33a0b0.png](./img/jKnkcdck29W8RtKN/1701089864439-a1bdc2aa-654d-4c93-ad44-5b397b33a0b0-668500.png)





> 更新: 2023-11-27 16:32:14  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vg808c89wdwu0c4y>