# Tips

1. 在一个gameobject下添加第二个gameobject时，第二个的纬度会基于其父对象（inspector里的也都是相对父对象的坐标）。例如，在一个长方体内添加一个圆，这个圆会是一个顶满长方体的椭圆。选择、移动、放缩父对象时，子对象也会随着变化。
2. An empty GameObject is a placeholder object that can be created in the Hierarchy. It does not have a visible representation in the scene, and it can act as a container for other GameObjects.
3. 颜色、纹理、弹性等物理特性都是material。修改物体的material时（即使是最简单的颜色），要先创建Material，再拖拽到物体上
4. 开发时，可先用简单图元prefab作为占位符，后续再借助prefab做统一替换。In a prototype of a game, a colleague is modeling the enemy character while you work on gameplay. Your placeholder for the enemy is a prefab of a capsule primitive. When the enemy is ready to import, you can simply replace the capsule object in the prefab with the new model.
5. 注意original prefab 和 prefab variant 的区别: 后者会受到更高一级的prefab影响。
6. prefab instance 的 inspector 最上面的prefab controls里有个override选项，可以让你知道是哪些component被override了。
7. 文件目录组织: 最好在Assets文件夹下添加一个Materials文件夹和一个Prefabs文件夹，分开管理
8. RigidBody properties control how the GameObject interacts with gravity and air density. For example, the RigidBody properties on the Circle Sprite make it fall, but when it hits another GameObject, it will pass through it. The Collider Component adds additional properties that determine how objects interact with each other. 
9. 固定地面或其他rigid body： To keep the Ground in place, go to the RigidBody 2D Component for the Ground Sprite, expand the Constraints, and select the Freeze Position checkbox for the X, Y, and Z axes. These options will tell the Sprite that it should remain in place and not fall when the game is running. 
10. window => 2x3窗口，可同时显示Scene和Game窗口。
11. 开发时注意为game窗口设置合适的分辨率
12. 游戏中的逻辑,大部分在渲染帧完成. 输入检测,要在渲染帧完成. 逻辑帧 固定帧率，与渲染无关的帧
    1. unity脚本中的渲染帧 Update方法
    2. unity脚本中的逻辑帧 Fixedupdate方法
13. 几个重要API
    1. 输入控制系统 API
        1. 外部设备的按键反馈到游戏引擎中
    2. 移动物体(游戏体)的能力 API
        1. 坐标系：世界局部
        2. 方向，Time.delataTime 两次渲染帧的时间问隔
    3. 碰撞检测系统API
14. 在渲染帧中控制输入输出手感更好。
    1. unity中逻辑帧的间隔预设为0.02s（50FPS），帧数不足。
    2. 逻辑帧是固定FPS，渲染帧是固定FPS，容易出现不一致的情况。
15. 物理效果写在逻辑帧中。不受渲染频率影响。
16. 输入脚本全局只需要一个，挂在相机上或空物体即可。
17. C# 中方法名也采用首字母大写的命名方式。



[Work with GameObjects in a 3D Scene - Unity Learn](https://learn.unity.com/tutorial/work-with-gameobjects-in-a-3d-scene?uv=2021.3&missionId=5f777d9bedbc2a001f6f5ec7&pathwayId=5f7bcab4edbc2a0023e9c38f&contentId=5f777f61edbc2a2315d49058&projectId=5fa1e431edbc2a001f53e6cc#637538f9edbc2a3b4f9f153b)

[Create a structure with primitives - Unity Learn](https://learn.unity.com/tutorial/create-a-structure-with-primitives?uv=2021.3&pathwayId=5f7bcab4edbc2a0023e9c38f&missionId=5f777d9bedbc2a001f6f5ec7&projectId=5fa1e431edbc2a001f53e6cc#)

[Add physical properties to 3D GameObjects - Unity Learn](https://learn.unity.com/tutorial/create-effects-for-3d-gameobjects?uv=2021.3&pathwayId=5f7bcab4edbc2a0023e9c38f&missionId=5f777d9bedbc2a001f6f5ec7&projectId=5fa1e431edbc2a001f53e6cc)

[Manage GameObjects with prefabs - Unity Learn](https://learn.unity.com/tutorial/manage-gameobjects-with-prefabs?language=en&labelRequired=true&pathwayId=5f7bcab4edbc2a0023e9c38f&missionId=5f777d9bedbc2a001f6f5ec7&projectId=5fa1e431edbc2a001f53e6cc#)

[Add components to 2D GameObjects - Unity Learn](https://learn.unity.com/tutorial/add-components-to-2d-gameobjects?uv=2021.3&pathwayId=5f7bcab4edbc2a0023e9c38f&missionId=5f777d9bedbc2a001f6f5ec7&projectId=5fa5be27edbc2a001f01b3f0#)



> 更新: 2023-06-13 05:30:58  
> 原文: <https://www.yuque.com/viruspc/el3mi0/wtgd4w0pfp2env3g>