# Updating Resource

- [更新资源](#%E6%9B%B4%E6%96%B0%E8%B5%84%E6%BA%90)
  * [物体矩阵](#%E7%89%A9%E4%BD%93%E7%9F%A9%E9%98%B5)
  * [BufferGeomery](#buffergeomery)
  * [Materials](#materials)
  * [Textures](#textures)
  * [Camera](#camera)

---

## 更新资源

<https://threejs.org/docs/#manual/en/introduction/How-to-update-things>

### 物体矩阵

1. matrixAutoUpdate：如果物体是静态的，可以通过将matrixAutoUpdate设为false来关闭local matrix的自动更新

### BufferGeomery

2. 重要的一点：不能resize buffer。resize buffer的代价等价于重新创建一个新的geometry
   1. 因此，需要提前分配好足够大小的buffer，以适应geometry的变化。通过geometry.setDrawRange来设置用到的buffer范围。
   2. 场景：笔迹，不断延伸的曲线（需要不断加点）

```typescript
// 1. 新建geometry
const geometry = new THREE.BufferGeometry()
const positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
const drawCount = 2; // draw the first 2 points, only
geometry.setDrawRange( 0, drawCount );

// 2. 更新position
const positionAttribute = line.geometry.getAttribute( 'position' );
let x = 0, y = 0, z = 0;
for ( let i = 0; i < positionAttribute.count; i ++ ) {
	positionAttribute.setXYZ( i, x, y, z );
    x += ( Math.random() - 0.5 ) * 30;
    y += ( Math.random() - 0.5 ) * 30;
    z += ( Math.random() - 0.5 ) * 30;

}
line.geometry.setDrawRange( 0, newLength );

// 3. update informations
// If you want to change the position data values after the first render, 
// you need to set the needsUpdate flag like so:
positionAttribute.needsUpdate = true; // required after the first render
// If you change the position data values after the initial render, 
// you may need to recompute bounding volumes so other features of the engine like view frustum culling or helpers properly work.
line.geometry.computeBoundingBox();
line.geometry.computeBoundingSphere();

```

### Materials

All uniforms values can be changed freely (e.g. colors, textures, opacity, etc), values are sent to the shader every frame.

Also GLstate related parameters can change any time (depthTest, blending, polygonOffset, etc).

The following properties can't be easily changed at runtime (once the material is rendered at least once):

* numbers and types of uniforms
* presence or not of
  * texture
  * fog
  * vertex colors
  * morphing
  * shadow map
  * alpha test
  * transparent

Changes in these require building of new shader program. You'll need to set

`material.needsUpdate =true`

### Textures

Image, canvas, video and data textures need to have the following flag set if they are changed:

`texture.needsUpdate =true;`

Render targets update automatically.

### Camera

A camera's position and target is updated automatically. If you need to change

* fov
* aspect
* near
* far

then you'll need to recompute the projection matrix:

`camera.aspect = window.innerWidth / window.innerHeight;  
camera.updateProjectionMatrix();`


> 更新: 2023-09-06 12:28:18  
> 原文: <https://www.yuque.com/viruspc/el3mi0/rrrc4k05o2vk7a0p>