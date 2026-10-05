# Lumen

- [SDF](#sdf)
- [如何用实现无限次反弹？](#%E5%A6%82%E4%BD%95%E7%94%A8%E5%AE%9E%E7%8E%B0%E6%97%A0%E9%99%90%E6%AC%A1%E5%8F%8D%E5%BC%B9)
  * [反射阴影贴图（Reflective Shadow Maps）](#%E5%8F%8D%E5%B0%84%E9%98%B4%E5%BD%B1%E8%B4%B4%E5%9B%BEreflective-shadow-maps)
  * [Reuse](#reuse)
- [更多细节优化](#%E6%9B%B4%E5%A4%9A%E7%BB%86%E8%8A%82%E4%BC%98%E5%8C%96)
- [more](#more)

---

实时全局光照

实时全局光照是图形学的圣杯

## SDF
## 如何用实现无限次反弹？
![1697542400306-dcac0b0b-8b0f-4c23-9e04-f905ff0039a4.png](./img/WvyvFToeiAsUXs4z/1697542400306-dcac0b0b-8b0f-4c23-9e04-f905ff0039a4-908847.jpg)

### 反射阴影贴图（Reflective Shadow Maps）
原理是让光线打到物体后，将被照亮的位置当成光源。

![1697542503308-2ea3aa56-ae09-4401-ba76-8ef77a0959e6.png](./img/WvyvFToeiAsUXs4z/1697542503308-2ea3aa56-ae09-4401-ba76-8ef77a0959e6-343020.jpg)

再照亮整个场景

 ![1697542532648-714881b3-5557-47cb-befd-b390d66cc014.png](./img/WvyvFToeiAsUXs4z/1697542532648-714881b3-5557-47cb-befd-b390d66cc014-168885.jpg)

**只是比光栅化多了一次间接光**

![1697542546665-6cc7f0e6-9cdc-4e98-8872-869f7a997967.png](./img/WvyvFToeiAsUXs4z/1697542546665-6cc7f0e6-9cdc-4e98-8872-869f7a997967-788496.png)

目前主流的实时全局光照，基本都知识提供了一次反弹的间接光。一次反弹的全局光照也足够优秀了。

![1697542592304-e9cf4090-633b-45ed-99b3-4b8a3464cbe9.png](./img/WvyvFToeiAsUXs4z/1697542592304-e9cf4090-633b-45ed-99b3-4b8a3464cbe9-502356.jpg)



![1697542694838-54fdb73d-c2cf-4f15-9914-940ee0d96392.png](./img/WvyvFToeiAsUXs4z/1697542694838-54fdb73d-c2cf-4f15-9914-940ee0d96392-568407.jpg)

![1697542731746-1114ed68-e181-4d34-9320-a75ba78d3f69.png](./img/WvyvFToeiAsUXs4z/1697542731746-1114ed68-e181-4d34-9320-a75ba78d3f69-621514.jpg)



Lumen的思路：分开求解直接光和间接光。



直接光：通过距离场快速找到物体，但没有材质信息

![1697542810654-69a357e8-cdc6-4500-8535-6c6c72315985.png](./img/WvyvFToeiAsUXs4z/1697542810654-69a357e8-cdc6-4500-8535-6c6c72315985-609428.jpg)



间接光

 距离场不提供材质信息，如何获取间接光？

![1697542879331-0c7e9f03-ad48-4675-9ba1-ae4a0ed3ef2d.png](./img/WvyvFToeiAsUXs4z/1697542879331-0c7e9f03-ad48-4675-9ba1-ae4a0ed3ef2d-837786.jpg)

1. 将光存进表面缓存。

![1697542897914-bd514924-beeb-4202-ba42-f16596af535d.png](./img/WvyvFToeiAsUXs4z/1697542897914-bd514924-beeb-4202-ba42-f16596af535d-812382.jpg)2. 辐射度算法（Radiosity）

Goral在将辐射度引入图形学时提出的

![1697542988701-a9602719-27ee-4b96-bf2e-7d2631d30528.png](./img/WvyvFToeiAsUXs4z/1697542988701-a9602719-27ee-4b96-bf2e-7d2631d30528-695298.jpg)



1. 将场景离散成一个个面元，拿么一个面元往外辐射的能量，一定等于其他面元辐射给它的能量之和。

![1697543079586-fe92391f-3904-494a-845e-7151b9d0cc71.png](./img/WvyvFToeiAsUXs4z/1697543079586-fe92391f-3904-494a-845e-7151b9d0cc71-431772.jpg)

![1697543235702-f5fa952a-2b59-4040-83e4-6205d754d787.png](./img/WvyvFToeiAsUXs4z/1697543235702-f5fa952a-2b59-4040-83e4-6205d754d787-181637.jpg)

![1697543281638-fa36520b-493a-430b-bd5c-8a58f8e6ae8a.png](./img/WvyvFToeiAsUXs4z/1697543281638-fa36520b-493a-430b-bd5c-8a58f8e6ae8a-811048.jpg)

![1697543329375-06599c34-f4dc-424a-8c41-719dac90be75.png](./img/WvyvFToeiAsUXs4z/1697543329375-06599c34-f4dc-424a-8c41-719dac90be75-577443.jpg)

就是渲染方程在场景离散成面元后推得来的



面元细分地越多，间接光的反弹次数就越多，

![1697543416631-8a652e85-2e99-4aa5-9224-eacdd5ea8d00.png](./img/WvyvFToeiAsUXs4z/1697543416631-8a652e85-2e99-4aa5-9224-eacdd5ea8d00-042698.jpg)

 ![1697543438641-bac17382-7176-4627-8fce-a9b468f95dae.png](./img/WvyvFToeiAsUXs4z/1697543438641-bac17382-7176-4627-8fce-a9b468f95dae-916266.jpg)

![1697543473540-d43015e7-4100-43dd-ae19-16792209d27a.png](./img/WvyvFToeiAsUXs4z/1697543473540-d43015e7-4100-43dd-ae19-16792209d27a-979670.jpg)

![1697543593306-453ed798-2f75-41f2-ab37-31723d549fba.png](./img/WvyvFToeiAsUXs4z/1697543593306-453ed798-2f75-41f2-ab37-31723d549fba-323861.jpg)

求解：

![1697543627357-c991ce24-31a5-4874-a7f3-774f0871d602.png](./img/WvyvFToeiAsUXs4z/1697543627357-c991ce24-31a5-4874-a7f3-774f0871d602-794699.jpg)

问题：互相依赖，无法求解。如何求解？

![1697543726539-70d6c13a-d54b-4c61-addd-b926cf90d474.png](./img/WvyvFToeiAsUXs4z/1697543726539-70d6c13a-d54b-4c61-addd-b926cf90d474-343564.jpg)

### Reuse
一个经典思想：Reuse：

游戏中一秒60帧，相邻两帧变化并不多，

![1697543786920-c3aedc75-f707-457e-8c78-382504120fe7.png](./img/WvyvFToeiAsUXs4z/1697543786920-c3aedc75-f707-457e-8c78-382504120fe7-406545.jpg)、

可以粗略认为，大多数面元每一帧接收的光照都差不多

![1697543872736-bcb2ef4f-1ccf-4fec-bc96-94f67dc4f1ec.png](./img/WvyvFToeiAsUXs4z/1697543872736-bcb2ef4f-1ccf-4fec-bc96-94f67dc4f1ec-688753.jpg)

![1697543901632-7092d6aa-b088-4f57-b190-a7d29acd4f5a.png](./img/WvyvFToeiAsUXs4z/1697543901632-7092d6aa-b088-4f57-b190-a7d29acd4f5a-671318.jpg)

![1697543929795-82870200-33ef-4eeb-a522-f2350d2c91f7.png](./img/WvyvFToeiAsUXs4z/1697543929795-82870200-33ef-4eeb-a522-f2350d2c91f7-655581.jpg)

![1697543975633-3bc4d4ee-f807-4f92-a550-ee65208584f0.png](./img/WvyvFToeiAsUXs4z/1697543975633-3bc4d4ee-f807-4f92-a550-ee65208584f0-730836.jpg)

![1697543994197-48f31716-a395-4054-9bb9-5da17114700f.png](./img/WvyvFToeiAsUXs4z/1697543994197-48f31716-a395-4054-9bb9-5da17114700f-427689.jpg)

Lumen巧妙地利用了第0帧的面元的直接光是已知的特性，对面元进行单独求解，规避了传统辐射度算法联立方程组求解未知数的难度。而后续每一帧里的迭代计算，则保证了计算的准确性。

**于是，实现了无限次反弹。**

![]()

## 更多细节优化
生成光照后，还要把光照采集给相机。Lumen将场景按距离分为四部分来优化。

![1697544371456-5b43f918-08af-4061-a986-c358e64a80a0.png](./img/WvyvFToeiAsUXs4z/1697544371456-5b43f918-08af-4061-a986-c358e64a80a0-878131.jpg)直接光用SDF+光线追踪，间接光用辐射度算法。  





## more
![1697544540960-d9c13318-037b-4f36-a60c-b4af28eda3ed.png](./img/WvyvFToeiAsUXs4z/1697544540960-d9c13318-037b-4f36-a60c-b4af28eda3ed-479615.jpg)





 





> 更新: 2024-01-07 10:10:34  
> 原文: <https://www.yuque.com/viruspc/el3mi0/oytzo9ahorv6oev3>