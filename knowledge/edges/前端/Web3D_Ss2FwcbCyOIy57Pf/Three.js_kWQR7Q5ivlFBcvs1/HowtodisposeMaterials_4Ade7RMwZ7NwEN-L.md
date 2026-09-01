# How to dispose Materials

- [Geometries](#geometries)
- [Materials](#materials)
- [Textures](#textures)
- [Render Targets](#render-targets)
- [Miscellaneous](#miscellaneous)
- [References](#references)

---

Whenever you create an instance of a three.js type, you allocate a certain amount of memory.

It's important to highlight that these objects are not released automatically.

## Geometries

相关需要释放的对象：three.js internally creates an object of type `WebGLBuffer` for each attribute.

如何释放：These entities are only deleted if you call `BufferGeometry.dispose()`.

## Materials

相关需要释放的对象：Shader Program

如何释放：`Material.dispose`

## Textures

相关需要释放的对象：`WebGLTexture`

如何释放：`Texture.dispose`+ `ImageBitmap.close()`

## Render Targets

相关需要释放的对象：`WebGLRenderTarget`

如何释放：`Texture.dispose`

<font style="color:rgb(187, 187, 187);">Objects of type</font><font style="color:rgb(187, 187, 187);"> </font>[WebGLRenderTarget](https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderTarget)<font style="color:rgb(187, 187, 187);"> </font><font style="color:rgb(187, 187, 187);">not only allocate an instance of</font><font style="color:rgb(187, 187, 187);"> </font>[WebGLTexture](https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture)<font style="color:rgb(187, 187, 187);"> </font><font style="color:rgb(187, 187, 187);">but also</font><font style="color:rgb(187, 187, 187);"> </font>[WebGLFramebuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer)<font style="color:rgb(187, 187, 187);">s and</font><font style="color:rgb(187, 187, 187);"> </font>[WebGLRenderbuffer](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderbuffer)<font style="color:rgb(187, 187, 187);">s for realizing custom rendering destinations. These objects are only deallocated by executing</font><font style="color:rgb(187, 187, 187);"> </font>[WebGLRenderTarget.dispose](https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderTarget.dispose)<font style="color:rgb(187, 187, 187);">().</font>

## <font style="color:rgb(187, 187, 187);">Miscellaneous</font>

<font style="color:rgb(187, 187, 187);">There are other classes from the examples directory like controls or post processing passes which provide </font><font style="color:rgb(170, 170, 170);background-color:rgb(51, 51, 51);">dispose</font><font style="color:rgb(136, 136, 136);background-color:rgb(51, 51, 51);">()</font><font style="color:rgb(187, 187, 187);"> methods in order to remove internal event listeners or render targets. In general, it's recommended to check the API or documentation of a class and watch for </font><font style="color:rgb(170, 170, 170);background-color:rgb(51, 51, 51);">dispose</font><font style="color:rgb(136, 136, 136);background-color:rgb(51, 51, 51);">()</font><font style="color:rgb(187, 187, 187);">. If present, you should use it when cleaning things up.</font>

## References

* [Three 之 three.js （webgl）模型的删除/场景的清空/内存的释放 的简单整理\_threejs清空场景\_仙魁XAN的博客-CSDN博客](https://blog.csdn.net/u014361280/article/details/124309410?csdn_share_tail=%7B%22type%22%3A%22blog%22%2C%22rType%22%3A%22article%22%2C%22rId%22%3A%22124309410%22%2C%22source%22%3A%22unlogin%22%7D)
* [three.js docs](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)


> 更新: 2023-09-06 12:49:53  
> 原文: <https://www.yuque.com/viruspc/el3mi0/kox0qim8hfg83lvo>