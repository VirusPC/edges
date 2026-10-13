# Custom Material

- [背景（Why）](#%E8%83%8C%E6%99%AFwhy)
- [创建自定义材质（What and How）](#%E5%88%9B%E5%BB%BA%E8%87%AA%E5%AE%9A%E4%B9%89%E6%9D%90%E8%B4%A8what-and-how)
  * [`ShaderMaterial`](#shadermaterial)
    + [Built-in attributes and uniforms](#built-in-attributes-and-uniforms)
      - [Vertex shader (Unconditional)](#vertex-shader-unconditional)
      - [Fragment Shader](#fragment-shader)
      - [Vertex shader (Conditional)](#vertex-shader-conditional)
  * [`RawShaderMaterial`](#rawshadermaterial)
- [References](#references)

---

# 背景（Why）

You may want to use a custom shader if you need to:

* implement an effect not included with any of the built-in [materials](https://threejs.org/docs/index.html#api/en/materials/Material)
* combine many objects into a single [BufferGeometry](https://threejs.org/docs/index.html#api/en/core/BufferGeometry) in order to improve performance

# 创建自定义材质（What and How）

可以通过`ShaderMaterial`或是`RawShaderMaterial`来创建自定义Material。

> Built in attributes and uniforms are passed to the shaders along with your code. If you don't want the WebGLProgram to add anything to your shader code, you can use `RawShaderMaterial` instead of `RawShaderMaterial`.

## `ShaderMaterial`

### Built-in attributes and uniforms

The `WebGLRenderer` provides many attributes and uniforms to shaders by default. [#](https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram)

If you don't want `WebGLProgram` to add anything to your shader code, you can use `RawShaderMaterial` instead of this class.

#### Vertex shader (Unconditional)

```glsl
// = object.matrixWorld
uniform mat4 modelMatrix;

// = camera.matrixWorldInverse, inverse of the camera matrix.
uniform mat4 viewMatrix;

// = camera.projectionMatrix
uniform mat4 projectionMatrix;

// = camera position in world space. Part of camera matrix.
uniform vec3 cameraPosition;

// = camera.matrixWorldInverse * object.matrixWorld  更方便计算GL_Position
// Note that modelViewMatrix is not set when rendering an instanced model,
// but can be calculated from viewMatrix * modelMatrix.
uniform mat4 modelViewMatrix;

// = inverse transpose of modelViewMatrix 更方便对法向量进行坐标变换
uniform mat3 normalMatrix;

// default vertex attributes provided by BufferGeometry
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
```

#### Fragment Shader

```glsl
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
```

#### Vertex shader (Conditional)

在使用某些功能时，可能还会存在其他 attribute。

```glsl
#ifdef USE_TANGENT
	attribute vec4 tangent;
#endif
#if defined( USE_COLOR_ALPHA )
	// vertex color attribute with alpha
	attribute vec4 color;
#elif defined( USE_COLOR )
	// vertex color attribute
	attribute vec3 color;
#endif
```

```glsl
#ifdef USE_MORPHTARGETS

	attribute vec3 morphTarget0;
	attribute vec3 morphTarget1;
	attribute vec3 morphTarget2;
	attribute vec3 morphTarget3;

	#ifdef USE_MORPHNORMALS

		attribute vec3 morphNormal0;
		attribute vec3 morphNormal1;
		attribute vec3 morphNormal2;
		attribute vec3 morphNormal3;

	#else

		attribute vec3 morphTarget4;
		attribute vec3 morphTarget5;
		attribute vec3 morphTarget6;
		attribute vec3 morphTarget7;

	#endif
#endif

```

```glsl
#ifdef USE_SKINNING
	attribute vec4 skinIndex;
	attribute vec4 skinWeight;
#endif
```

```glsl
#ifdef USE_INSTANCING
	// Note that modelViewMatrix is not set when rendering an instanced model,
	// but can be calculated from viewMatrix * modelMatrix.
	//
	// Basic Usage:
	//   gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
	attribute mat4 instanceMatrix;
#endif
```

## `RawShaderMaterial`

# References

* [three.js docs](https://threejs.org/docs/#api/en/materials/ShaderMaterial)
* [three.js docs](https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram)


> 更新: 2023-05-21 15:35:00  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ynapfvyt6vkzs35n>