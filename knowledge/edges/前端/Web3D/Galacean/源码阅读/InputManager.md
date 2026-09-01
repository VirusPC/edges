# InputManager

  * [PointerManager](#pointermanager)
    + [挂载监听事件，存储低级事件](#%E6%8C%82%E8%BD%BD%E7%9B%91%E5%90%AC%E4%BA%8B%E4%BB%B6%E5%AD%98%E5%82%A8%E4%BD%8E%E7%BA%A7%E4%BA%8B%E4%BB%B6)
    + [更新inputManager，计算生成高级事件](#%E6%9B%B4%E6%96%B0inputmanager%E8%AE%A1%E7%AE%97%E7%94%9F%E6%88%90%E9%AB%98%E7%BA%A7%E4%BA%8B%E4%BB%B6)
    + [触发脚本](#%E8%A7%A6%E5%8F%91%E8%84%9A%E6%9C%AC)
- [值得学习的地方](#%E5%80%BC%E5%BE%97%E5%AD%A6%E4%B9%A0%E7%9A%84%E5%9C%B0%E6%96%B9)
- [存在的问题](#%E5%AD%98%E5%9C%A8%E7%9A%84%E9%97%AE%E9%A2%98)
- [相关链接](#%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)

---



## PointerManager


### 挂载监听事件，存储低级事件
挂载监听事件，存储事件

1. constructor中，触发onFocus
    1. ![1700656051331-9763373f-13e5-4b8e-b1ce-ed81ef67948d.png](./img/WKrxQ7EuKitm3qiP/1700656051331-9763373f-13e5-4b8e-b1ce-ed81ef67948d-387825.png)
2. onFocus中，为 canvas 上的所有pointer事件，绑定 onPointerEvent回调
    1. ![1700656029661-b35de864-c379-4251-9f29-6cd298bbe8bd.png](./img/WKrxQ7EuKitm3qiP/1700656029661-b35de864-c379-4251-9f29-6cd298bbe8bd-051930.png)
3. onPointerEvent中，向this._nativeEvents push 事件
    1. ![1700656195629-77dbd0fd-9eda-4b12-b2cf-fb0e794576bc.png](./img/WKrxQ7EuKitm3qiP/1700656195629-77dbd0fd-9eda-4b12-b2cf-fb0e794576bc-542902.png)



### 更新inputManager，计算生成高级事件
engine update 中刚开始的时候，利用存储的事件更新inputManager

1. 更新inputManager
    1. ![1700657171611-237071e8-d7ce-4689-b4df-763d86ee5743.png](./img/WKrxQ7EuKitm3qiP/1700657171611-237071e8-d7ce-4689-b4df-763d86ee5743-864518.png)
2. 更新各个manager
    1. ![1700657079496-4f4f49fe-b79d-4351-9b74-5dda58fdf885.png](./img/WKrxQ7EuKitm3qiP/1700657079496-4f4f49fe-b79d-4351-9b74-5dda58fdf885-414779.png)
3. 生成高阶事件（nativeEvent转pointer）
    1. ![1700658193671-4dd3409c-f717-4daf-b532-ea437d71dad9.png](./img/WKrxQ7EuKitm3qiP/1700658193671-4dd3409c-f717-4daf-b532-ea437d71dad9-165788.png)

### 触发脚本
engine update 中的物理更新后，触发脚本

1. 在物理更新和更新之间，触发交互事件（动画跟新在更新之后）
    1. ![1700656451630-c0e5c8f0-a0c7-430f-bf93-e032b2fd170b.png](./img/WKrxQ7EuKitm3qiP/1700656451630-c0e5c8f0-a0c7-430f-bf93-e032b2fd170b-068959.png)
2. inputManager.firePointerScript
    1. ![1700656832588-1251403c-9d33-4d35-8558-b6f4069a1ffe.png](./img/WKrxQ7EuKitm3qiP/1700656832588-1251403c-9d33-4d35-8558-b6f4069a1ffe-488105.png)
3. pointerManager.firePointerScript
    1. 包含拾取逻辑
    2. ![1700656859926-b5fe2004-2cb3-4813-8d8f-861b8c8f4eb1.png](./img/WKrxQ7EuKitm3qiP/1700656859926-b5fe2004-2cb3-4813-8d8f-861b8c8f4eb1-185005.png)
4. 



# 值得学习的地方
转高级事件时，将client坐标转为画布坐标

![1700657900088-36d9d5d1-0103-4857-b952-91d7b2f6f247.png](./img/WKrxQ7EuKitm3qiP/1700657900088-36d9d5d1-0103-4857-b952-91d7b2f6f247-755473.png)

[https://github.com/galacean/runtime/blob/1eaecf7917e75688133d69e91f3c96f580d9f64f/packages/core/src/input/pointer/PointerManager.ts#L67](https://github.com/galacean/runtime/blob/1eaecf7917e75688133d69e91f3c96f580d9f64f/packages/core/src/input/pointer/PointerManager.ts#L67)

# 存在的问题
# 相关链接
[https://github.com/galacean/runtime/blob/main/packages/core/src/input/pointer/PointerManager.ts#L114](https://github.com/galacean/runtime/blob/main/packages/core/src/input/pointer/PointerManager.ts#L114)



> 更新: 2023-11-23 03:36:23  
> 原文: <https://www.yuque.com/viruspc/el3mi0/uic0mrd6c02nsg3e>