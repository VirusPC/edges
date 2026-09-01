# 核心架构

- [核心思想](#%E6%A0%B8%E5%BF%83%E6%80%9D%E6%83%B3)
- [基本使用](#%E5%9F%BA%E6%9C%AC%E4%BD%BF%E7%94%A8)
  * [初始化 engine](#%E5%88%9D%E5%A7%8B%E5%8C%96-engine)
  * [系统](#%E7%B3%BB%E7%BB%9F)
    + [渲染场景](#%E6%B8%B2%E6%9F%93%E5%9C%BA%E6%99%AF)
    + [物理场景](#%E7%89%A9%E7%90%86%E5%9C%BA%E6%99%AF)
  * [实体与组件](#%E5%AE%9E%E4%BD%93%E4%B8%8E%E7%BB%84%E4%BB%B6)
    + [camera](#camera)
    + [light](#light)
    + [transform](#transform)
    + [MeshRenderer](#meshrenderer)
    + [交互](#%E4%BA%A4%E4%BA%92)
    + [脚本与生命周期](#%E8%84%9A%E6%9C%AC%E4%B8%8E%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F)
- [相关链接](#%E7%9B%B8%E5%85%B3%E9%93%BE%E6%8E%A5)

---

## 核心思想
ECS 架构？

## 基本使用
### 初始化 engine
```typescript
const engine = await WebGLEngine.create({
  canvas: htmlCanvas,  // 或 'canvas'
  graphicDeviceOptions: { alpha: false },
});

// 垂直同步
engine.vSyncCount = 1;
engine.vSyncCount = 2;

// 非垂直同步
engine.vSyncCount = 0;
engine.targetFrameRate = 120;
```

### 系统
#### 渲染场景
```typescript
// 获取当前所有激活的场景。默认scenes下有一个。
const scenes = engine.sceneManager.scenes;
const scene = engine.sceneManager.scenes[0];

// 获取节点属于的场景
const scene = entity.scene;

// 实体树根节点
// 创建根实体
const rootEntity = scene.createRootEntity();
// 添加实体到场景
scene.addRootEntity(rootEntity);

// 查找根实体
const allEntities: Readonly<Entity[]> = scene.rootEntities;
const entity2 = scene.getRootEntity(2);
```

#### 物理场景
1. physics
    1. <font style="color:rgb(17, 24, 28);background-color:rgb(251, 252, 253);">物理场景和渲染场景相互独立，但在程序运行过程中不断同步各自的数据。因此，和脚本一样，同步的时序也非常重要。一般来说，物理场景的更新频率和渲染场景不同，在物理管理器中可以对其进行设置：</font>







### 实体与组件
```typescript
// 创建实体的子实体并添加组件
const lightEntity = rootEntity.createChild("light");
const directLight = lightEntity.addComponent(DirectLight);
directLight.color = new Color(0.3, 0.3, 1);
directLight.intensity = 1;

// 从场景树中删除实体
rootEntity.removeChild(newEntity);
// 销毁实体
newEntity.destroy();

// 暂时不使用某实体时，可以通过调用实体的 isActive 停止激活。
// 同时该实体下的组件被动component.enabled = false
newEntity.isActive = false;

// 暂时不使用某组件时，可以主动调用组件的 enabled
directLight.enabled = false;

// transform也是组件，是entity自带的基础组件
cubeEntity.transform.scale = new Vector3(2, 1, 1);
```

#### camera
#### light
#### transform
#### MeshRenderer
MeshRenderer 是网格渲染组件，当一个实体挂载了网格渲染组件，只需设置它的 mesh 与 material即可渲染物体。

```typescript
let cubeEntity = rootEntity.createChild('cube');
let cube = cubeEntity.addComponent(MeshRenderer);
cube.mesh = PrimitiveMesh.createCuboid(engine, 2, 2, 2);
cube.setMaterial(new BlinnPhongMaterial(engine));
```

#### 交互
#### 脚本与生命周期
Script 也是组件

```typescript

```



### 
## 相关链接
+ [Galacean - Mobile first high performance web interactive engine](https://galacean.antgroup.com/#/docs/latest/cn/entity)



> 更新: 2023-10-18 13:03:37  
> 原文: <https://www.yuque.com/viruspc/el3mi0/wygdr7dl7w7gi2vd>