# 创建对象

- [引用链](#%E5%BC%95%E7%94%A8%E9%93%BE)
  * [buffer](#buffer)
  * [texture](#texture)
- [创建和使用](#%E5%88%9B%E5%BB%BA%E5%92%8C%E4%BD%BF%E7%94%A8)
  * [Array Buffer](#array-buffer)
    + [创建](#%E5%88%9B%E5%BB%BA)
    + [数据填充](#%E6%95%B0%E6%8D%AE%E5%A1%AB%E5%85%85)
    + [参数设置](#%E5%8F%82%E6%95%B0%E8%AE%BE%E7%BD%AE)
    + [绑定到全局状态](#%E7%BB%91%E5%AE%9A%E5%88%B0%E5%85%A8%E5%B1%80%E7%8A%B6%E6%80%81)
  * [Element Buffer](#element-buffer)
    + [创建](#%E5%88%9B%E5%BB%BA-1)
    + [数据填充](#%E6%95%B0%E6%8D%AE%E5%A1%AB%E5%85%85-1)
    + [参数设置](#%E5%8F%82%E6%95%B0%E8%AE%BE%E7%BD%AE-1)
    + [绑定到全局状态](#%E7%BB%91%E5%AE%9A%E5%88%B0%E5%85%A8%E5%B1%80%E7%8A%B6%E6%80%81-1)
  * [Uniform Buffer](#uniform-buffer)
    + [创建](#%E5%88%9B%E5%BB%BA-2)
    + [数据填充](#%E6%95%B0%E6%8D%AE%E5%A1%AB%E5%85%85-2)
    + [参数设置](#%E5%8F%82%E6%95%B0%E8%AE%BE%E7%BD%AE-2)
    + [绑定到全局状态](#%E7%BB%91%E5%AE%9A%E5%88%B0%E5%85%A8%E5%B1%80%E7%8A%B6%E6%80%81-2)
    + [绑定到program](#%E7%BB%91%E5%AE%9A%E5%88%B0program)
  * [Texture (uniform)](#texture-uniform)
    + [创建](#%E5%88%9B%E5%BB%BA-3)
    + [数据填充](#%E6%95%B0%E6%8D%AE%E5%A1%AB%E5%85%85-3)
    + [参数设置](#%E5%8F%82%E6%95%B0%E8%AE%BE%E7%BD%AE-3)
    + [绑定到全局状态](#%E7%BB%91%E5%AE%9A%E5%88%B0%E5%85%A8%E5%B1%80%E7%8A%B6%E6%80%81-3)
    + [绑定到program](#%E7%BB%91%E5%AE%9A%E5%88%B0program-1)
- [总结](#%E6%80%BB%E7%BB%93)
- [References](#references)

---

# 引用链

## buffer

**Array buffer**: globalState.`VERTEX_ARRAY_BINDING`=> VAO.attribute\[location] => buffer

**Elemenet buffer**:  globalState.`VERTEX_ARRAY_BINDING`=>VAO.state.`ELEMENT_ARRAY_BINDING` => buffer

**Uniform buffer**: globalState.`Uniform_Buffer_Bindings`\[index] => buffer

> (通过Uniform\_Buffer\_Binding来传数据，通过gl.bindBufferBase(     gl.UNIFORM\_BUFFER,     lightUniformBufferIndex,     lightUniformBlockBuffer);来绑定全局状态)

## texture

globalState.TextureUnits\[texUnit] => texture

# 创建和使用

整体步骤：

1. 创建
2. 数据填充
3. 参数设置
4. 绑定到全局状态
5. 绑定到program（如果是uniform）

## Array Buffer

### 创建

```javascript
const buffer = gl.createBuffer()
```

### 数据填充

```typescript
declare const data: FLoat32Array;
declare const buffer: WebGLBuffer;

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
```

### 参数设置

将buffer的参数写到某个VAO中。

程序可以通过VAO来间接访问buffer和参数（顶点布局信息）。

```typescript
declare const program: WebGLProgram;
declare const attributeName: string;
declare const vao: WebGLVertexArrayObject;
declare const buffer: WebGLBuffer;
declare const location: number;

gl.bindVertexArray(vao);  // 绑定VAO
gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // 绑定buffer到gl.ARRAY_BUFFER绑定点
gl.vertexAttribPointer(
  location,  // location
  3,          // size (components per iteration)
  gl.FLOAT,   // type of to get from buffer
  false,      // normalize
  0,          // stride (bytes to advance each iteration)
  0,          // offset (bytes from start of buffer)
);  // 对于绑定到gl.ARRAY_BUFFER的buffer，将其绑定到当前VAO的location处，并指定其layout
gl.enableVertexAttribArray(location); // 启动

```

### 绑定到全局状态

globalState.`VERTEX_ARRAY_BINDING`=> VAO.attribute\[location] => buffer

```typescript
declare const vao: WebGLVertexArrayObject;

gl.bindVertexArray(vao);  // 绑定VAO
```

## Element Buffer

### 创建

```javascript
const indexBuffer = gl.createBuffer()
```

### 数据填充

和Array Buffer的区别在于，绑定到当前VAO的`gl.ELEMENT_ARRAY_BUFFER`，而不是绑定到全局状态的`gl.ARRAY_BUFFER`.

```javascript
declare const indexBuffer: WebGLBuffer;
declare const vertexIndices: Float32Array;
declare const vao: WebGLVertexArrayObject;

gl.bindVertexArray(vao); // 绑定到当前vao的ELEMENT_ARRAY_BUFFERE
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);
```

### 参数设置

无。

### 绑定到全局状态

globalState.`VERTEX_ARRAY_BINDING`=>VAO.state.`ELEMENT_ARRAY_BINDING` => buffer

```typescript
declare const vao: WebGLVertexArrayObject;

gl.bindVertexArray(vao);  // 绑定VAO
```

## Uniform Buffer

### 创建

```typescript
const uboBuffer = gl.createBuffer()
```

### 数据填充

```typescript
declare const uboUniformBlockBuffer: WebGLBuffer;
declare const uboUniformBlockData: Float32Array;

gl.bindBuffer(gl.UNIFORM_BUFFER, uboUniformBlockBuffer);
gl.bufferData(gl.UNIFORM_BUFFER, uboUniformBlockData, gl.STATIC_DRAW);
```

### 参数设置

无。按照shader中对应的结构体来从buffer中读取数据。

### 绑定到全局状态

globalState.`Uniform_Buffer_Bindings`\[index] => buffer

```typescript
declare const uboUniformBufferIndex: number; // global state中的一个槽位，类似texture unit
declare const uboUniformBlockBuffer: WebGLBuffer;

// 绑定buffer到gl.UNIFORM_BUFFER的第index个位置
gl.bindBufferBase(
  gl.UNIFORM_BUFFER,
  uboUniformBufferIndex,  // gl.activeTexture(gl.TEXTURE0 + texUnit);
  uboUniformBlockBuffer);  // gl.bindTexture(gl.TEXTURE_2D, texture);
```

### 绑定到program

```typescript
declare const program: WebGLProgram;
declare const uboName: string;
declare const uboUniformBufferIndex: number; // global state中的一个槽位，类似texture unit

const index = gl.getUniformBlockIndex(program, uboName);
gl.uniformBlockBinding(program, index, uboUniformBufferIndex);
```

## Texture (uniform)

### 创建

```typescript
const texture = gl.createTexture()
```

### 数据填充

```typescript
declare const texture: WebGLTexture;

gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip level
    gl.RGBA,          // internal format
    gl.RGBA,          // format
    gl.UNSIGNED_BYTE, // type
    makeTextCanvas('F', 32, 32, 'red'));
```

### 参数设置

buffer的参数保存在VAO中，而texture的参数就存在texture自己

```typescript
declare const texture: WebGLTexture;

gl.bindTexture(gl.TEXTURE_2D, texture);
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

### 绑定到全局状态

```typescript
declare const texUnit: number;
declare const texture: WebGLTexture;

// 类比bindeBufferBase: gl.bindTextureBase(gl.TEXTURE_2D, l.TEXTURE0 + texUnit, texture)
gl.activeTexture(gl.TEXTURE0 + texUnit);  // 将第texUnit个texture unit绑定到gl.TEXTURE_2D
gl.bindTexture(gl.TEXTURE_2D, texture);   // 将texture绑定到第texUnit个texture unit，
```

### 绑定到program

```typescript
declare const texUnit: number;
declare const location: number;

gl.uniform1i(location, texUnit);
```

# 总结

1. 创建
   1. 四者都可以通过creatXXX来创建
2. 数据填充
   1. 四者都是先将对象绑定到各自类型的绑定点上，再向绑定点填充数据
   2. 特殊的，Element Buffer的绑定点在VAO上而不在全局状态上，需要注意填充前使用正确的VAO
3. 参数设置
   1. Element Buffer 和 Uniform Buffer都不存在可设置的参数。layout都已固定。
   2. Array Buffer 的参数在VAO上，Texture的参数在其本身
4. 绑定
   1. array Buffer和element Buffer直接切换VAO即可
   2. 对于uniform buffer和uniform texture，需要先将对象绑定到全局状态的第i个对应位置，再将第i个位置连接到program

# References

* [WebGL2Fundamentals WebGL State Diagram](https://webgl2fundamentals.org/webgl/lessons/resources/webgl-state-diagram.html?exampleId=draw-cubes#no-help)


> 更新: 2023-05-12 16:32:49  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ne8gdulbrk8i5la2>