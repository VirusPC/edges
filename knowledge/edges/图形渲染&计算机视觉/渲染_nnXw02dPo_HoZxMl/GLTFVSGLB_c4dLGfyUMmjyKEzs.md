# GLTF VS GLB

- [**1. 定义和本质**](#1-%E5%AE%9A%E4%B9%89%E5%92%8C%E6%9C%AC%E8%B4%A8)
- [**2. 文件结构**](#2-%E6%96%87%E4%BB%B6%E7%BB%93%E6%9E%84)
  * [**GLTF**](#gltf)
  * [**GLB**](#glb)
- [**3. 优缺点对比**](#3-%E4%BC%98%E7%BC%BA%E7%82%B9%E5%AF%B9%E6%AF%94)
- [**4. 使用场景**](#4-%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF)
  * [**GLTF 的适用场景**](#gltf-%E7%9A%84%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF)
  * [**GLB 的适用场景**](#glb-%E7%9A%84%E9%80%82%E7%94%A8%E5%9C%BA%E6%99%AF)
- [**5. Three.js 对 GLTF 和 GLB 的支持**](#5-threejs-%E5%AF%B9-gltf-%E5%92%8C-glb-%E7%9A%84%E6%94%AF%E6%8C%81)
  * [**加载 GLTF 文件**](#%E5%8A%A0%E8%BD%BD-gltf-%E6%96%87%E4%BB%B6)
  * [**加载 GLB 文件**](#%E5%8A%A0%E8%BD%BD-glb-%E6%96%87%E4%BB%B6)
- [**6. 如何在工具中选择 GLTF 或 GLB**](#6-%E5%A6%82%E4%BD%95%E5%9C%A8%E5%B7%A5%E5%85%B7%E4%B8%AD%E9%80%89%E6%8B%A9-gltf-%E6%88%96-glb)
- [**总结**](#%E6%80%BB%E7%BB%93)

---

**GLTF** 和 **GLB** 是密切相关但有区别的两种文件格式，它们都属于 **GL Transmission Format（GLTF）** 的范畴。简单来说，**GLB 是 GLTF 的二进制版本**。以下是两者的详细对比和区别：

***

### **1. 定义和本质**

| **格式** | **定义** |
| --- | --- |
| **GLTF** | 一种基于 JSON 的 3D 文件格式，用于描述模型的几何、材质、动画等信息。 |
| **GLB** | GLTF 的二进制版本，将所有数据（JSON、纹理、二进制几何）打包为一个文件。 |

***

### **2. 文件结构**

#### **GLTF**

* **GLTF 文件是一个 JSON 文件**，主要描述 3D 模型的元数据（如几何、材质、动画等）。
* GLTF 文件通常会引用外部资源，例如：
  * **纹理文件**（如 PNG/JPG）。
  * **二进制几何数据**（通常存储在 `.bin` 文件中）。
* GLTF 文件结构：

```plain
model.gltf
├── model.gltf          // JSON 文件，描述模型结构和属性
├── model.bin           // 二进制文件，存储顶点、法线等几何数据
├── texture1.png        // 外部纹理文件
└── texture2.jpg        // 外部纹理文件
```

#### **GLB**

* **GLB 是一个单一的二进制文件**，将 GLTF 的所有数据（JSON 元数据、二进制几何数据、纹理等）打包在一起。
* GLB 文件结构：

```plain
model.glb
// 单一文件，包含 JSON、二进制数据和纹理
```

***

### **3. 优缺点对比**

| **特性** | **GLTF** | **GLB** |
| --- | --- | --- |
| **文件大小** | 文件较小，但需要依赖外部资源（如纹理和几何数据）。 | 文件较大，因为所有数据都被打包在一个文件中。 |
| **加载速度** | 加载时需要多次请求外部资源（如纹理和二进制数据），加载速度可能较慢。 | 单一文件，加载时只需一次请求，加载速度更快。 |
| **易用性** | 需要管理多个文件（JSON、二进制数据、纹理等），不方便分发或共享。 | 单一文件，便于分发和共享，适合网络传输和实时渲染。 |
| **可读性** | JSON 文件是纯文本格式，易于阅读和编辑（可手动修改）。 | 二进制文件，不易于直接阅读和编辑（需要工具解析）。 |
| **纹理处理** | 纹理存储为外部文件，便于单独修改或替换。 | 纹理嵌入到文件中，不易单独修改或替换。 |
| **适用场景** | 适用于开发阶段或需要频繁修改模型的场景（方便调试）。 | 适用于发布阶段或需要高效加载的场景（如 WebGL 应用）。 |

***

### **4. 使用场景**

#### **GLTF 的适用场景**

* **开发阶段**：
  * GLTF 文件结构清晰，便于调试和修改。
  * 纹理和几何数据存储为外部文件，可以单独替换或优化。
* **需要动态加载资源**：
  * 如果模型的纹理或几何数据需要按需加载，GLTF 更加灵活。

#### **GLB 的适用场景**

* **发布阶段**：
  * GLB 文件是单一文件，便于分发和网络传输。
  * 加载速度快，适合实时渲染（如 WebGL、Three.js）。
* **移动端或 Web 应用**：
  * GLB 文件减少了 HTTP 请求次数，提高了加载性能。

***

### **5. Three.js 对 GLTF 和 GLB 的支持**

Three.js 的 **GLTFLoader** 同时支持 GLTF 和 GLB 文件，两者的加载方式几乎完全相同。

#### **加载 GLTF 文件**

GLTF 文件通常需要加载多个外部资源（如 `.bin` 和纹理文件）：

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load(
  'path/to/model.gltf', // GLTF 文件路径
  (gltf) => {
    scene.add(gltf.scene); // 将模型添加到场景中
  },
  undefined,
  (error) => {
    console.error('An error occurred:', error);
  }
);
```

#### **加载 GLB 文件**

GLB 文件是单一文件，加载方式与 GLTF 相同：

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load(
  'path/to/model.glb', // GLB 文件路径
  (gltf) => {
    scene.add(gltf.scene); // 将模型添加到场景中
  },
  undefined,
  (error) => {
    console.error('An error occurred:', error);
  }
);
```

***

### **6. 如何在工具中选择 GLTF 或 GLB**

许多 3D 建模工具（如 Blender、Maya）支持导出 GLTF 和 GLB 文件。在选择导出格式时，可以根据需求决定：

* **如果需要灵活性和可修改性**：
  * 选择 GLTF，便于调试和编辑。
* **如果需要单一文件和高效加载**：
  * 选择 GLB，适合发布和分发。

在 Blender 中导出 GLB 的选项如下：

1. 打开模型。
2. 选择 **File > Export > glTF 2.0**。
3. 在导出设置中选择 **GLB (Binary)** 格式。

***

### **总结**

* **GLTF 和 GLB 的核心区别**在于文件结构：
  * GLTF 是基于 JSON 的文本格式，依赖外部文件。
  * GLB 是二进制格式，将所有数据打包在一个文件中。
* **选择 GLTF 还是 GLB** 取决于场景：
  * 开发阶段或需要灵活性时选择 GLTF。
  * 发布阶段或需要高效加载时选择 GLB。
* 无论选择哪种格式，Three.js 都能很好地支持两者。


> 更新: 2025-04-02 16:38:03  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pklfquwx2mf159ck>