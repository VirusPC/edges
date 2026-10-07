# 混合测试

- [**1. 裁切测试（Scissor Test）**](#1-%E8%A3%81%E5%88%87%E6%B5%8B%E8%AF%95scissor-test)
- [**2. 模板测试（Stencil Test）**](#2-%E6%A8%A1%E6%9D%BF%E6%B5%8B%E8%AF%95stencil-test)
- [**3. 深度测试（Depth Test）**](#3-%E6%B7%B1%E5%BA%A6%E6%B5%8B%E8%AF%95depth-test)
- [**4. Alpha 测试（已弃用，现代 OpenGL 中无此阶段）**](#4-alpha-%E6%B5%8B%E8%AF%95%E5%B7%B2%E5%BC%83%E7%94%A8%E7%8E%B0%E4%BB%A3-opengl-%E4%B8%AD%E6%97%A0%E6%AD%A4%E9%98%B6%E6%AE%B5)
- [**关键总结**](#%E5%85%B3%E9%94%AE%E6%80%BB%E7%BB%93)
- [**典型流程示意图**](#%E5%85%B8%E5%9E%8B%E6%B5%81%E7%A8%8B%E7%A4%BA%E6%84%8F%E5%9B%BE)
- [**注意事项**](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

---

1. 光栅化（生成片段）
2. 裁切测试（Scissor Test）
3. 片段着色器（Fragment Shader）  （alpha test）
4. 模板测试（Stencil Test）
5. 深度测试（Depth Test）
6. 混合（Blending）

在 OpenGL 的渲染管线中，**片段处理阶段的测试顺序是固定的**，具体顺序如下：

***

### **1. 裁切测试（Scissor Test）**

* **作用**：限制渲染到屏幕的某个矩形区域（像素级裁剪）。
* **位置**：**最先执行**，直接根据屏幕坐标过滤片段。

```cpp
glEnable(GL_SCISSOR_TEST);
glScissor(x, y, width, height);
```

***

### **2. 模板测试（Stencil Test）**

* **作用**：通过模板缓冲区（Stencil Buffer）的掩码值决定是否保留片段。
* **位置**：在裁切测试之后，深度测试之前。

```cpp
glEnable(GL_STENCIL_TEST);
glStencilFunc(GL_EQUAL, 1, 0xFF); // 例如：仅当模板值为 1 时通过
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE); // 模板操作
```

***

### **3. 深度测试（Depth Test）**

* **作用**：通过深度缓冲区（Z-Buffer）比较片段的深度值，决定是否遮挡。
* **位置**：在模板测试之后，混合（Blending）之前。

```cpp
glEnable(GL_DEPTH_TEST);
glDepthFunc(GL_LESS); // 默认：深度更小的片段通过
```

***

### **4. Alpha 测试（已弃用，现代 OpenGL 中无此阶段）**

* **历史作用**：根据 Alpha 值直接丢弃片段（如完全透明的像素）。
* **现代替代**：在片段着色器中使用 `discard` 关键字手动丢弃片段。

```glsl
// 片段着色器示例（现代 OpenGL）
if (color.a < 0.5) discard;
```

***

### **关键总结**

1. **固定顺序**：\
   **裁切测试 → 模板测试 → 深度测试 → 混合（Blending）**。
   * Alpha 测试已废弃，需在着色器中实现类似逻辑。
2. **混合（Blending）在最后**：\
   所有测试通过后，若启用混合（`glEnable(GL_BLEND)`），才会进行颜色混合。
3. **性能优化**：
   * 深度测试在模板测试后，可避免不必要的模板缓冲操作。
   * 先通过模板/深度测试的片段才会进入后续计算，减少资源浪费。

***

### **典型流程示意图**

```plain
片段着色器 → 裁切测试 → 模板测试 → 深度测试 → 混合 → 写入帧缓冲
```

***

### **注意事项**

* **模板与深度写入控制**：\
  深度测试失败时，可通过 `glStencilOp` 控制是否更新模板缓冲。

```cpp
glStencilOp(stencil_fail, depth_fail, depth_pass); // 分别定义不同情况的模板操作
```

* **深度测试与混合冲突**：\
  透明物体需关闭深度写入（`glDepthMask(GL_FALSE)`），并按从后到前排序渲染，否则混合结果可能错误。

***

通过正确理解测试顺序，可以避免渲染错误（如模板覆盖深度、混合顺序错乱），并优化渲染性能。


> 更新: 2025-05-20 04:33:50  
> 原文: <https://www.yuque.com/viruspc/el3mi0/wvg8174wppzaql0v>