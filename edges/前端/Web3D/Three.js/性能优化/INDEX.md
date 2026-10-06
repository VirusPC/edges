# 性能优化

- [forceSinglePass](#forcesinglepass)
- [.[forceSinglePass](https://threejs.org/docs/index.html#api/en/materials/Material.forceSinglePass) : Boolean](#forcesinglepasshttpsthreejsorgdocsindexhtml%23apienmaterialsmaterialforcesinglepass--boolean)

---

### forceSinglePass
### <font style="color:rgb(187, 187, 187);">.</font>[forceSinglePass](https://threejs.org/docs/index.html#api/en/materials/Material.forceSinglePass)<font style="color:rgb(187, 187, 187);"> : </font><font style="color:rgb(153, 153, 153);">Boolean</font>
<font style="color:rgb(187, 187, 187);">Whether double-sided, transparent objects should be rendered with a single pass or not. Default is </font><font style="color:rgb(48, 176, 48);background-color:rgb(51, 51, 51);">false</font><font style="color:rgb(187, 187, 187);">.  
  
</font><font style="color:rgb(187, 187, 187);">The engine renders double-sided, transparent objects with two draw calls (back faces first, then front faces) to mitigate transparency artifacts. There are scenarios however where this approach produces no quality gains but still doubles draw calls e.g. when rendering flat vegetation like grass sprites. In these cases, set the </font><font style="color:rgb(170, 170, 170);background-color:rgb(51, 51, 51);">forceSinglePass</font><font style="color:rgb(187, 187, 187);"> flag to </font><font style="color:rgb(48, 176, 48);background-color:rgb(51, 51, 51);">true</font><font style="color:rgb(187, 187, 187);"> to disable the two pass rendering to avoid performance issues.</font>



2. three.js 并不自动释放内存，注意通过 dispose 来释放创建的各个对象 [three.js docs](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)
3. matrixAutoUpdate：如果物体是静态的，可以通过将matrixAutoUpdate设为false来关闭local matrix的自动更新 



> 更新: 2023-09-23 14:37:57  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ldeo5lgpen32rzi3>