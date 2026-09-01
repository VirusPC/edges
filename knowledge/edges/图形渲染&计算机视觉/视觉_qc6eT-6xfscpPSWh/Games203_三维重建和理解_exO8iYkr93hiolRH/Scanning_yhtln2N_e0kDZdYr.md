# Scanning

- [Summary](#summary)
- [Scanning](#scanning)
- [References](#references)

---

## Summary
range acquisition 方法（大都是返回<font style="color:#DF2A3F;">点云</font>，这点很总要，后面大都是围绕点云讲）

1. Contact（接触式）
    1. Mechanical (CMM, jointed arm)
        1. 优点：很精确，一些工厂还在用。
        2. 缺点：一个一个点的扫描，很慢。需要手动连点成三角面片。
    2. Inertial惯性 (gyroscope 陀螺仪, accelerometer 加速度计) 
    3. ultrasonic trackers
    4. magnetic trackers
2. Transmissive（穿透式，主要观察信号穿透过程中发生的变化。接收端一般在物体另一侧，如X射线CT）
    1. Industrial CT
    2. Ultrasound
        1. 原理：利用超声波的传播速度和时间差计算距离。
        2. 特点：
            1. 适合短距离测量，成本低。
            2. 常用于机器人避障、医学超声成像。
    3. MRI（ Magnetic Resonance Imaging， 磁共振成像）
3. Reflective（反射式，主要利用信号到物体表面然后反射的特性，不涉及穿透目标）
    1. Non-optical 
        1. radar（passive）
            1. 原理：通过发射和接收电磁波信号，计算目标的距离、速度和方位。
            2. 特点：
                1. 高精度（毫米级）
                2. 适合长距离探测，穿透性强。适合大范围三维场景建模。
                3. 广泛应用于自动驾驶、航空航天、军事领域。
            3. 缺点：
                1. 成本较高。
                2. 对环境光敏感，雨雾天气可能影响性能。
            4. 应用：
                1. 自动驾驶汽车
                2. 机器人导航和工业自动化
        2. sonar（passive）
    2. Optical （最主要的方法还是基于视觉/光学的方法，这里单独拎出来）
        1. passive：Photogrammetry。 照图片，给定照片去做重建，用计算的方式获取深度信息
            1. 方法
                1. 双目立体视觉：stereo vision。
                    1. 原理：通过两台摄像机捕获场景的两幅图像，利用视差（Parallax）和三角形测量计算深度。
                    2. 特点：
                        1. 模拟人类双眼的视觉机制。
                        2. 成本低，无需主动发射光信号。
                        3. 可在自然光下工作。
                    3. 却掉
                        1. 但对光照和纹理依赖较强，光滑表面或纹理较少的场景效果差。
                        2. 精度受摄像头基线长度限制
                    4. 应用：
                        1. ZED Stereo Camera：用于机器人导航和AR/VR。
                        2. Intel RealSense（部分型号，如D415）：结合立体视觉和其他技术。
                2. 单目深度估计（Monocular Depth Estimation）
                    1. 原理：通过单个摄像头的图像，利用场景线索（如透视、纹理梯度）或深度学习模型估计深度。
                    2. 特点：
                        1. 不需要额外硬件，仅需单个摄像头，适合便携设备。
                    3. 缺点：
                        1.  度估计精度受限于算法和模型。
                        2. 需要大量训练数据，难以泛化到新场景。
                    4. 应用：
                        1. 手机摄像头（如Google Pixel的景深模式）。
                        2. 无人机摄像头：用于简单的障碍物检测。
                3.  运动视差（Motion Parallax）
                    1. 原理：通过观察物体在不同视点或时间帧中的移动，利用几何关系计算深度。
                    2. 适合动态场景，常与SLAM（Simultaneous Localization and Mapping）结合。
                4. 光流（Optical Flow）
                    1. 原理：通过分析图像序列中像素的运动，推断场景的深度和运动信息。
                    2. 特点：
                        1. 常用于动态场景的深度估计。
                        2. 对快速运动和光照变化敏感。
                5. 结构化环境线索
                    1. 原理：利用环境中的已知几何结构（如直线、平面）或纹理特征推断深度。
                    2. 特点：依赖于场景的几何特性。
            2. 作用：
                1. 用于建筑文献、电影制作和虚拟旅游等应用，也常用于环境测绘和测量。
                2. 优点：可以生产具有相对低成本的设备(智能手机或数码相机)高度详细的模型。
                3. 缺点：需要良好的照明和多角度的图像，以实现准确的结果。模型的质量取决于输入图像的质量和用于处理的软件。
        2. active：改变input，用主动的方法引导重建
            1. 结构光（Structured Light Scanning）
                    1. 原理：通过投射已知的光学图案（如条纹、点阵）到物体表面，并分析图案的变形来计算深度。Kinect用的是红外光。
                    2. 特点：
                        1. 高分辨率
                        2. 中短距离范围（1-3米）
                        3. 适合纹理较少或光滑表面的重建。
                        4. 常用于3D扫描仪、面部识别（如iPhone的Face ID）。
                        5. 常用于工业应用，如质量控制、逆向工程和中小型物体(如雕塑、工具或零件)的3 d 扫描。
                    3. 缺点：
                        1. 对环境光敏感，强光下性能下降，在受控环境下工作效果最好。受日光或其他传感器发射的红外光干扰。多个深度相机之间也会互相干扰。
                        2. 适用范围有限，通常为中短距离。
                        3. 对于透射的物体，接受不到反射光，无法测量这些点的位置。
                    4. 应用
                        1. 微软 Kinect v1：用于游戏和室内深度感知。V2该用Time of Flight技术。
                        2. Artec Eva 3D扫描仪：用于高精度3D建模。
                        3. iPhone Face ID：利用点阵投影实现面部识别。
            2. Pulsed Time of Flight。（比如常见的 lazer scanning，其实也是一种基于反射方法）
                1. 原理：利用光信号从发射到返回的时间差，计算目标距离。一般是红外线。
                2. 优点：
                    1. 适合大规模环境下的远距离的扫描，如地图景观，建筑物和历史遗迹。它提供了高精度（相对），并经常用于地理空间应用，考古学和自动驾驶。
                    2. 实时性强，适合动态场景。
                    3. 设备小型化，适合移动设备。
                    4. 常用于手势识别、无人机避障、AR/VR设备、建筑工地。
                3. 缺点：
                    1. 精度不高（相对，厘米级，光速太快）
                    2. 分辨率低。
                    3. 对环境光有一定敏感性，受日光或其他传感器发射的红外光干扰。多个深度相机之间也会互相干扰。（同基于红外线的结构光）
                    4. 对于透射的物体，接受不到反射光，无法测量这些点的位置。（同基于红外线的结构光）
                    5. 在成本、功耗方面有一定劣势。
                4. 应用：
                    1. 微软 Kinect v2：改用ToF技术。
                    2. Intel RealSense D系列：用于机器人、AR/VR。
                    3. iPhone LiDAR Scanner：用于AR应用和摄影增强。
4. 多模态
    1. 视觉-惯性融合（Visual-Inertial Fusion）
        1. 典型设备：
            1. Google Tango：结合RGB摄像头、深度传感器和IMU。
            2. Apple ARKit：结合iPhone的摄像头和IMU。
        2. 特点：
            1. 提高动态场景中的鲁棒性。
            2. 适用于AR/VR和室内导航。
    2.  LiDAR + 摄像头融合
        1. 典型设备：
            1. 自动驾驶汽车传感器套件（如特斯拉、Waymo）。
            2. 无人机：结合LiDAR和视觉传感器，用于精确建模和导航。
        2. 特点：
            1. 提高深度信息的精度和场景理解能力。
            2. 成本较高，主要用于高端应用。



| ** 设备类型** | **典型设备** | **方法** | **适用场景** |
| :--- | :--- | :--- | :--- |
| **激光雷达 ** | Velodyne, Hokuyo | 飞行时间（ToF）或相位测距 | 自动驾驶、地形测绘 |
| **结构光设备** | Kinect v1, Artec Eva | 结构光 | 人脸识别、3D扫描 |
| **ToF相机** | Kinect v2, Intel RealSense | 飞行时间（ToF） | 动态场景、AR/VR |
| **双目相机** | ZED Camera, RealSense D415 | 立体视觉 | 机器人导航、AR/VR |
| **单目相机** | 手机景深模式 | 深度学习/几何推断 | 简单场景、便携设备 |
| **多模态融合设备** | Google Tango, iPhone LiDAR | LiDAR + 摄像头/IMU | AR/VR、导航、自动驾驶 |


## Scanning
了解就可以，不建议做这方面研究

扫描仪从不同视角扫描物体，会得到不同**点云**。



重温什么是 geometry reconstruction：

![1719031009850-d8d7a3bc-03af-4166-b929-9de18ebafea5.png](./img/yhtln2N_e0kDZdYr/1719031009850-d8d7a3bc-03af-4166-b929-9de18ebafea5-486150.png)



Sensor 非常广

![1711292659562-e0089dec-0368-4bbd-b665-1aae5532e90a.png](./img/yhtln2N_e0kDZdYr/1711292659562-e0089dec-0368-4bbd-b665-1aae5532e90a-306323.png)



Contact:

![1711292756150-dbf29dce-0aab-445c-bbab-d17019476880.png](./img/yhtln2N_e0kDZdYr/1711292756150-dbf29dce-0aab-445c-bbab-d17019476880-079530.png)

优点：很精确，一些工厂还在用。

缺点：一个一个点的扫描，很慢。需要手动连点成三角面片。

对某一类物体有用。



大部分还是基于光学的方法：

![1711292855463-5dffeb68-6fc9-443c-9eb6-756eef0b1d28.png](./img/yhtln2N_e0kDZdYr/1711292855463-5dffeb68-6fc9-443c-9eb6-756eef0b1d28-684609.png)  
passive：照图片，给定照片去做重建，用计算的方式获取深度信息

active：改变input，用主动的方法引导重建



主动方法主要有两种

1. Pulsed Time of Flight。适合非常远距离的扫描，比如building。缺点是精度不高（光速太快）。建筑工地常用。
2. Triangulation。两个方向的光相交到一个点。

![1711293202134-2eccce6b-520c-4bd3-8a0b-4f31fe061482.png](./img/yhtln2N_e0kDZdYr/1711293202134-2eccce6b-520c-4bd3-8a0b-4f31fe061482-499849.png)

![1711293343561-de645871-719b-4e92-8845-94316bbe573f.png](./img/yhtln2N_e0kDZdYr/1711293343561-de645871-719b-4e92-8845-94316bbe573f-493098.png)

![1719031977287-fd4bb157-c124-428d-bc3c-0ecfe4284f43.png](./img/yhtln2N_e0kDZdYr/1719031977287-fd4bb157-c124-428d-bc3c-0ecfe4284f43-159817.png)

下图三角形中，左右$ O $和$ O' $的位置分别放置光源和相机。光从光源$ O $发出，打到 $ X
 $后，再落入$ O' $相机的传感器。

![1711293395372-26db712f-b76a-4f54-a044-4f2d3dd85a17.png](./img/yhtln2N_e0kDZdYr/1711293395372-26db712f-b76a-4f54-a044-4f2d3dd85a17-319211.png)

![1711293535664-a95b40ad-6a86-4c41-9666-59f9c47bb524.png](./img/yhtln2N_e0kDZdYr/1711293535664-a95b40ad-6a86-4c41-9666-59f9c47bb524-139930.png)

![1711293572702-a8bd50be-6404-4cac-b088-c9a665fd8baf.png](./img/yhtln2N_e0kDZdYr/1711293572702-a8bd50be-6404-4cac-b088-c9a665fd8baf-850081.png)

![1711293688941-33ca227a-0fe2-437e-8f73-1a271dd6c317.png](./img/yhtln2N_e0kDZdYr/1711293688941-33ca227a-0fe2-437e-8f73-1a271dd6c317-615270.png)

Pattern Design：



回忆：下图三角形中，左右$ O $和$ O' $的位置分别放置光源和相机。光从光源$ O $发出，打到 $ X
 $后，再落入$ O' $相机的传感器。能够找到像素对应的ray，就可以计算这个像素的深度。![1720361371000-4900df8c-0bf8-463c-9256-15c0997c4337.png](./img/yhtln2N_e0kDZdYr/1720361371000-4900df8c-0bf8-463c-9256-15c0997c4337-480385.png)

问题： 上图是讲的一个ray打到3D物体的一个点后生成一个像素。

+ 问题1：相机拍摄得到的是一片像素，如何找到每个像素对应哪条ray？
    - 答：用一个面积光源去拍摄（条带或块），基本上总能找到对应的ray
+ 问题二：如何找对应的ray？
    - pattern



pattern 的目标：给定image的一个pixel，快速知道对应lazer的哪个ray

每个pattern都是一个专利

下图中，每一个pixel/strip都有不同color，都对应不同ray。

![1711293982473-f737074f-e09a-449e-a16a-45ce0756b42c.png](./img/yhtln2N_e0kDZdYr/1711293982473-f737074f-e09a-449e-a16a-45ce0756b42c-345284.png)

早期不能打彩色pattern，只能黑白patten

拍多张照片，利用编码来区分颜色。



![1719032745354-84d31b34-ec81-47a4-9ea1-512fae18201d.png](./img/yhtln2N_e0kDZdYr/1719032745354-84d31b34-ec81-47a4-9ea1-512fae18201d-248990.png)

![1719032809058-15696fe3-432a-40b2-91c2-179191259679.png](./img/yhtln2N_e0kDZdYr/1719032809058-15696fe3-432a-40b2-91c2-179191259679-301917.png)

![1711294218113-6b164236-c738-4569-bd64-5bee012b1177.png](./img/yhtln2N_e0kDZdYr/1711294218113-6b164236-c738-4569-bd64-5bee012b1177-232969.png)

局限性：

![1711294261048-ba0adfc0-ff1b-4446-8e25-863f70e1e12a.png](./img/yhtln2N_e0kDZdYr/1711294261048-ba0adfc0-ff1b-4446-8e25-863f70e1e12a-201796.png)

grid的方法：

![1711294275544-760460f4-25ab-49c5-8edb-a7d13bd37aeb.png](./img/yhtln2N_e0kDZdYr/1711294275544-760460f4-25ab-49c5-8edb-a7d13bd37aeb-628000.png)

![1711294492763-7762d91d-e775-4cf3-bfd9-06073fd99e30.png](./img/yhtln2N_e0kDZdYr/1711294492763-7762d91d-e775-4cf3-bfd9-06073fd99e30-254458.png)

![1711294511840-12fbddad-3f2b-4e84-9355-3ddfae9b2dc4.png](./img/yhtln2N_e0kDZdYr/1711294511840-12fbddad-3f2b-4e84-9355-3ddfae9b2dc4-152364.png)

Kinect如何应用pattern原理：

两个depth sensor。

Kinect v1的Depth传感器，采用了「Light Coding」的方式，读取投射的红外线pattern，通过pattern的变形来取得Depth的信息。为此，Depth传感器分为投射红外线pattern的IR Projector（左）和读取的这个的IR Camera（右）。中间的就是普通的RGB CAMERA



![1711294526731-1f976827-1b0f-4a29-8114-110c3269aee1.png](./img/yhtln2N_e0kDZdYr/1711294526731-1f976827-1b0f-4a29-8114-110c3269aee1-089908.png)

kinect的pattern：

![1719033157264-aa61f186-8e59-4c34-878a-e9b8d7fa4371.png](./img/yhtln2N_e0kDZdYr/1719033157264-aa61f186-8e59-4c34-878a-e9b8d7fa4371-084992.png)

## References
1. \\\\\\\\\\\\\\\\[https://www.bilibili.com/video/BV1pw411d7aS/?spm_id_from=333.337.search-card.all.click&vd_source=a637826c55b409b420b4b6584a6e8379](https://www.bilibili.com/video/BV1pw411d7aS/?spm_id_from=333.337.search-card.all.click&vd_source=a637826c55b409b420b4b6584a6e8379)
2. [https://zhuanlan.zhihu.com/p/462167006](https://zhuanlan.zhihu.com/p/462167006)



> 更新: 2025-11-13 17:33:57  
> 原文: <https://www.yuque.com/viruspc/el3mi0/dbzyg2bniesq9i59>