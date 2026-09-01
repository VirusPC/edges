# 不同渲染引擎中脚本的生命周期

  * [Unity](#unity)
  * [UE5](#ue5)
  * [Galacean](#galacean)
  * [Babaylon.js](#babaylonjs)
- [相关链接](#%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)

---

所有的游戏引擎都分物理更新和非物理更新。为什么要将物理更新单独拆出？



核心区别：物理更新是保证固定时间间隔的，更新则不一定。更新期望每帧（引擎中的一帧）渲染一次，但有可能出现渲染时间过长导致快点或慢点的问题

+ <font style="background-color:rgb(247, 247, 247);">FixedUpdate is ideal for physics calculations and maintaining consistent behavior, </font>
+ <font style="background-color:rgb(247, 247, 247);">while Update is suitable for general game logic and rendering-related tasks. </font>

<font style="background-color:rgb(247, 247, 247);"> Separating these functions can help optimize performance and ensure proper synchronization between physics and game logic.</font>



<font style="background-color:rgb(247, 247, 247);">The Unity engine provides both the FixedUpdate and Update functions to give developers more control over the timing and synchronization of their game logic.</font>

<font style="background-color:rgb(247, 247, 247);">The FixedUpdate function is called on a fixed time interval, typically at a rate of 50 times per second (although this can be changed). It is mainly used for physics calculations and any other game logic that needs to be updated consistently, regardless of the frame rate. Since FixedUpdate runs at a fixed interval, it is not affected by fluctuations in frame rate, making it suitable for physics simulations or other time-dependent calculations.</font>

<font style="background-color:rgb(247, 247, 247);">On the other hand, the Update function is called once per frame, as frequently as the frame rate allows. It is used for general game logic that does not require precise timing and allows developers to update the game state based on user input, animation, or other real-time events.</font>

<font style="background-color:rgb(247, 247, 247);">Having both functions gives developers the flexibility to control and separate different aspects of their game logic. FixedUpdate is ideal for physics calculations and maintaining consistent behavior, while Update is suitable for general game logic and rendering-related tasks. Separating these functions can help optimize performance and ensure proper synchronization between physics and game logic.</font>



## Unity
+ <font style="color:rgb(51, 51, 51);">FixedUpdate</font>
+ <font style="color:rgb(51, 51, 51);">Update</font>

## UE5
+ Tick
+ FixedTick

## Galacean
+ onPhysicsUpdate
+ onUpdate

## Babaylon.js
1. <font style="color:rgb(51, 51, 51);">onBeforePhysicsObservable.</font>
2. <font style="color:rgb(51, 51, 51);"> regular update loop</font>

<font style="color:rgb(51, 51, 51);"></font>

# <font style="color:rgb(51, 51, 51);">相关链接</font>
+ [what is the difference between Update & FixedUpdate in Unity?](https://stackoverflow.com/questions/34447682/what-is-the-difference-between-update-fixedupdate-in-unity)
+ [Unity - Manual: Order of execution for event functions](https://docs.unity3d.com/Manual/ExecutionOrder.html)
+ [Galacean - Mobile first high performance web interactive engine](https://galacean.antgroup.com/#/docs/1.0/cn/script)
+ [Update and FixedUpdate - Unity Learn](https://learn.unity.com/tutorial/update-and-fixedupdate)



> 更新: 2023-11-22 12:14:58  
> 原文: <https://www.yuque.com/viruspc/el3mi0/qsyoqromy6hqag00>