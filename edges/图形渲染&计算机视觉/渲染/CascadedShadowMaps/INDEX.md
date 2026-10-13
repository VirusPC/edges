# Cascaded Shadow Maps

- [Introduction](#introduction)
- [Approach](#approach)
- [Discussion](#discussion)

---

# Introduction
**Shadow maps** are a very popular technique to obtain realistic shadows in game engines. When trying to use them for large spaces, shadow maps get harder to tune and will be more prone to exhibit **surface acne** and **aliasing**. 可以准备一个最精细的shadowmap，但太占内存。

**Cascaded Shadow maps (CSM) **is a know approach that helps to fix the aliasing problem by providing higher resolution of the depth texture near the viewer and lower resolution far away. This is done by splitting the camera view frustum and creating a separate depth-map for each partition in an attempt to make the screen error constant.

根据深度将frustum分成多个frustum，为每个frustum根据其深度准备不同分辨率的shadowmap。LoD的思想。



# Approach
For every light’s frustum, render the scene depth from the lights point of view. 

1. Render the scene from the camera’s point of view. 
2. Depending on the fragment’s z-value, pick an appropriate shadow map to the lookup into.



# Discussion
显然。当物体离camera太近时，还是会出现走样。







[https://developer.download.nvidia.com/SDK/10.5/opengl/src/cascaded_shadow_maps/doc/cascaded_shadow_maps.pdf](https://developer.download.nvidia.com/SDK/10.5/opengl/src/cascaded_shadow_maps/doc/cascaded_shadow_maps.pdf)



> 更新: 2023-05-15 02:47:19  
> 原文: <https://www.yuque.com/viruspc/el3mi0/axex2v8c2ntl1qv2>