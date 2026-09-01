# Lecture 06. Rasterization 2 (Antialiasing and Z-Buffering)

- [Summary](#summary)
- [Antialiasing](#antialiasing)
- [Sampling Artifacts (Errors / Mistakes / Inaccuracies) in Computer Graphics](#sampling-artifacts-errors--mistakes--inaccuracies-in-computer-graphics)
- [Antialiasing Idea: Blurring (Pre-Filtering) Before Sampling](#antialiasing-idea-blurring-pre-filtering-before-sampling)
- [Frequency domain](#frequency-domain)
  * [傅立叶级数展开](#%E5%82%85%E7%AB%8B%E5%8F%B6%E7%BA%A7%E6%95%B0%E5%B1%95%E5%BC%80)
  * [傅立叶变换](#%E5%82%85%E7%AB%8B%E5%8F%B6%E5%8F%98%E6%8D%A2)
  * [Higher frequencies need faster sampling](#higher-frequencies-need-faster-sampling)
  * [Undersampling Create Frequency Aliases](#undersampling-create-frequency-aliases)
- [频域 Filtering (滤波)](#%E9%A2%91%E5%9F%9F-filtering-%E6%BB%A4%E6%B3%A2)
  * [Visualizing Image Frequency Content](#visualizing-image-frequency-content)
  * [高通滤波](#%E9%AB%98%E9%80%9A%E6%BB%A4%E6%B3%A2)
  * [低通滤波](#%E4%BD%8E%E9%80%9A%E6%BB%A4%E6%B3%A2)
  * [Filter Out Low and High Frequencies](#filter-out-low-and-high-frequencies)
- [频域 Convolution](#%E9%A2%91%E5%9F%9F-convolution)
  * [卷积理论](#%E5%8D%B7%E7%A7%AF%E7%90%86%E8%AE%BA)
  * [Box Filter](#box-filter)
- [频域 采样](#%E9%A2%91%E5%9F%9F-%E9%87%87%E6%A0%B7)
  * [采样](#%E9%87%87%E6%A0%B7)
  * [反走样](#%E5%8F%8D%E8%B5%B0%E6%A0%B7)
- [Reduce Aliasing Error](#reduce-aliasing-error)
  * [解决方案](#%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
  * [Antialiasing](#antialiasing-1)
  * [Averaging Values](#averaging-values)
  * [Super sampling (MSAA, Multisample Anti-Aliasing)](#super-sampling-msaa-multisample-anti-aliasing)
  * [其他被广泛应用的方法](#%E5%85%B6%E4%BB%96%E8%A2%AB%E5%B9%BF%E6%B3%9B%E5%BA%94%E7%94%A8%E7%9A%84%E6%96%B9%E6%B3%95)
  * [Super resolution](#super-resolution)
- [其他参考资料](#%E5%85%B6%E4%BB%96%E5%8F%82%E8%80%83%E8%B5%84%E6%96%99)

---

# Summary


1. Sampling theory
    1. Sampling Artifacts (Errors / Mistakes / Inaccuracies) in Computer Graphics: Signals are changing too fast (high frequency), but sampled too slowly
    2. Higher frequencies need faster sampling
    3. 频域与滤波
        1. Filtering（滤波） = Getting rid of certian frequency contents
        2. 高通滤波提取边界信息，低通滤波提取内容信息。
        3. 低通滤波 = 模糊
    4. 频域与卷积
        1. 时域上的乘积 === 频域上的卷积
        2. 可以在时域上直接做卷积
        3. 也可以变换到频域（傅立叶变换），乘以卷积核，再变换回时域（逆傅立叶变换）。
    5. 频域与采样
        1. Sampling = Repeating Frequency Contents
        2. Aliasing= Mixed Frequency Contents
2. Reduce Aliasing Error
    1. Option1: Increasing sampling rate （究极解决方案）
        1. Essentially increasing the distance between replicas in the Fourier domain
        2. Higher resolution displays, sensors, framebuffers
        3. But: costly & may need very high resolution
    2. Option2: **Antialiasing**
        1. 先模糊，再采样。（顺序不可反过来）
            1. Making Fourier contents "narrower" before repeating
            2. i.e. Filtering out high frequencies before sampling
            3. Blurring (Pre-Filtering) Before Sampling
        2. 具体方法：MSAA, FXAA, TAA
3. Visibility / occlusion
    1. Z-buffering: 见下一章





# Antialiasing
![1673275682235-848beea5-72fa-4cf6-be02-d4700909f33f.png](./img/oPsKft0smpygBLT7/1673275682235-848beea5-72fa-4cf6-be02-d4700909f33f-958166.png)![1673275878883-72bcab5b-24e3-4755-baaf-1759404d3c1e.png](./img/oPsKft0smpygBLT7/1673275878883-72bcab5b-24e3-4755-baaf-1759404d3c1e-792608.png)![1673275653620-a83a282d-69ef-4ba3-ada3-1389f9ff9b0f.png](./img/oPsKft0smpygBLT7/1673275653620-a83a282d-69ef-4ba3-ada3-1389f9ff9b0f-295919.png)



# Sampling Artifacts (Errors / Mistakes / Inaccuracies) in Computer Graphics


两个例子中的**摩尔纹和锯齿都是采样频率太低导致的**。

摩尔纹和锯齿的区别是，图片本身包含重复图案产生摩尔纹，非重复图案产生锯齿。

注意和[后续](https://www.yuque.com/pengcheng-fuigs/el3mi0/foyrm10dwlq1f8ug)的某个同时出现锯齿和摩尔纹的例子做区分。该例子中上采样产生摩尔纹，下采样产生锯齿。texture本身就是采样后的结果，是采样频率不足的结果（将连续的东西离散的存储），texture query 是从采样后的结果上再次进行二次采样。摩尔纹是二次采样频率太低导致的；锯齿是第一次采样频率太低导致的，二次采样将这个问题放大。

1. Jaggies (Staircase Pattern)

![1673276117192-f8c962fa-321a-450a-a932-13ffdbef8fb0.png](./img/oPsKft0smpygBLT7/1673276117192-f8c962fa-321a-450a-a932-13ffdbef8fb0-918911.png)

2. Molre Patterns in Imaging
    1. ![1673276158174-43f226a3-fe23-43f3-8c9e-a986f6a9610b.png](./img/oPsKft0smpygBLT7/1673276158174-43f226a3-fe23-43f3-8c9e-a986f6a9610b-170423.png)
3. Wagon Wheel Illusion (False Motion)
    1. 轮子顺时针旋转，看到的却是逆时针旋转
    2. 人眼在时间上的采样跟不上旋转速度
4. [Many more] ...



Behind the Aliasing Artifacts

+ **Signals are ****<font style="color:#117CEE;">changing too fast</font>**** (high frequency), but ****<font style="color:#DF2A3F;">sampled too slowly</font>**



# Antialiasing Idea: Blurring (Pre-Filtering) Before Sampling
先模糊，再采样。

模糊导致产生了一些中间颜色。

顺序不能反过来

![1673276629093-b55dc34e-6a29-4576-96a1-09a6e0249fd1.png](./img/oPsKft0smpygBLT7/1673276629093-b55dc34e-6a29-4576-96a1-09a6e0249fd1-064011.png)

![1673276684472-691952f7-7af7-4182-8969-c818bce10651.png](./img/oPsKft0smpygBLT7/1673276684472-691952f7-7af7-4182-8969-c818bce10651-002528.png)



# Frequency domain
## 傅立叶级数展开
![1673277070934-63ae8017-1e82-48c2-9593-116e0d0804da.png](./img/oPsKft0smpygBLT7/1673277070934-63ae8017-1e82-48c2-9593-116e0d0804da-320181.png)



## 傅立叶变换
给定一个函数，都可以用另外一个复杂的函数来表示。

把一个函数拆成不同频率的段

将函数从时域变到频域

![1673277210730-5b155654-7939-43ee-99d8-8fa248365de9.png](./img/oPsKft0smpygBLT7/1673277210730-5b155654-7939-43ee-99d8-8fa248365de9-461106.png)

## Higher frequencies need faster sampling
![1673277415708-7e58d409-fcc7-4a6b-84bc-f83bbef88456.png](./img/oPsKft0smpygBLT7/1673277415708-7e58d409-fcc7-4a6b-84bc-f83bbef88456-579030.png)



## Undersampling Create Frequency Aliases
![1673277533714-508f1ea2-d0e3-4055-8c7d-501f2f5ad11c.png](./img/oPsKft0smpygBLT7/1673277533714-508f1ea2-d0e3-4055-8c7d-501f2f5ad11c-582120.png)



# 频域 Filtering (滤波)
Filtering = Getting rid of certian frequency contents， 去掉一些频率



## Visualizing Image Frequency Content
中间代表低频，周围代表高频，白色的代表信息。

可以看到，图中低频信息比较多，高频信息很少。

忽略竖直水平两条白线。

![1673277783691-0d8ed415-4c79-4a4b-943b-89236c6a2518.png](./img/oPsKft0smpygBLT7/1673277783691-0d8ed415-4c79-4a4b-943b-89236c6a2518-736243.png)

## 高通滤波
Filter Out Low Frequencies Only (Edges)

高频部分表示图像内容上的边界

![1673278022441-1a0f5521-191d-4c4f-b628-5244eff0aab3.png](./img/oPsKft0smpygBLT7/1673278022441-1a0f5521-191d-4c4f-b628-5244eff0aab3-906390.png)

## 低通滤波
![1673278217899-a6f9e783-a853-433f-a173-6a38e7f6e6c5.png](./img/oPsKft0smpygBLT7/1673278217899-a6f9e783-a853-433f-a173-6a38e7f6e6c5-598463.png)

## Filter Out Low and High Frequencies
提取不那么明显的边界特征

![1673278261988-11d27887-23ce-49e4-bd91-6096e4d17c64.png](./img/oPsKft0smpygBLT7/1673278261988-11d27887-23ce-49e4-bd91-6096e4d17c64-786776.png)

![1673278293133-f7d322ff-17b6-44de-81c9-1ee5a719427d.png](./img/oPsKft0smpygBLT7/1673278293133-f7d322ff-17b6-44de-81c9-1ee5a719427d-803341.png)



# 频域 Convolution
**时域上的乘积 === 频域上的卷积**

**Filtering = Convolution (=Averaging)**

![1673278590626-2c8795df-ae71-42d9-8cb9-94be4512522b.png](./img/oPsKft0smpygBLT7/1673278590626-2c8795df-ae71-42d9-8cb9-94be4512522b-202018.png)

## 卷积理论
**时域上两个信号的卷积，等同于频域上两个信号的乘积。**

如何做卷积？

1. 在时域上直接做卷积
2. 变换到频域（傅立叶变换），乘以卷积核，再变换回时域（逆傅立叶变换）。从图中可以看到，乘卷积核起到了类似低通滤波的作用（中间保留的多）。



![1673278665177-47caec72-bebf-4f08-bc10-8bad7f4a578b.png](./img/oPsKft0smpygBLT7/1673278665177-47caec72-bebf-4f08-bc10-8bad7f4a578b-601760.png)



![1673278918586-f7276839-9a9a-4594-88c3-b130f43f36d2.png](./img/oPsKft0smpygBLT7/1673278918586-f7276839-9a9a-4594-88c3-b130f43f36d2-397039.png)

## Box Filter
![1673279916484-13054d37-0353-429f-983b-d1d2eccf5331.png](./img/oPsKft0smpygBLT7/1673279916484-13054d37-0353-429f-983b-d1d2eccf5331-770265.png)

![1673279946281-59ee0533-e955-4ca0-ac55-47286e99502e.png](./img/oPsKft0smpygBLT7/1673279946281-59ee0533-e955-4ca0-ac55-47286e99502e-964128.png)

![1673280025042-35c29eb2-e1e2-427a-842a-8111bf36d052.png](./img/oPsKft0smpygBLT7/1673280025042-35c29eb2-e1e2-427a-842a-8111bf36d052-039255.png)



# 频域 采样
## 采样
**Sampling = Repeating Frequency Contents**

![1673280416649-d9155532-8a60-498c-8058-10d4b83e8f76.png](./img/oPsKft0smpygBLT7/1673280416649-d9155532-8a60-498c-8058-10d4b83e8f76-954094.png)



## 反走样
**Aliasing= Mixed Frequency Contents**

采样不够快，意味着原始信号的复制粘贴不够快，信号发生了混叠，出现走样。

![1673339617074-a96b0de7-e152-4618-864f-cc3671b5473e.png](./img/oPsKft0smpygBLT7/1673339617074-a96b0de7-e152-4618-864f-cc3671b5473e-807321.png)



# Reduce Aliasing Error
## 解决方案
1. Option1: Increasing sampling rate （究极解决方案）
    1. Essentially increasing the distance between replicas in the Fourier domain
    2. Higher resolution displays, sensors, framebuffers
    3. But: costly & may need very high resolution
2. Option2: **Antialiasing**
    1. Making Fourier contents "narrower" before repeating
    2. i.e. Filtering out high frequencies before sampling

## Antialiasing
**Antialiasing === Limiting, then repeating**

![1673340010161-954bda21-d0ea-4b02-b5d7-2633d4166df0.png](./img/oPsKft0smpygBLT7/1673340010161-954bda21-d0ea-4b02-b5d7-2633d4166df0-462180.png)

## Averaging Values
通过 Averaging Values 来做Blur/Filter

Antialiasing By Averaging Values in Pixel Area

1. Convolve f(x, y) by a 1-pixel box-blur
    1. Recall: convolving = filtering = averaging
2. Then sample at every pixel's center

![1673340326349-f495a916-3c32-4b7d-a8f9-ce7bd36a4fe1.png](./img/oPsKft0smpygBLT7/1673340326349-f495a916-3c32-4b7d-a8f9-ce7bd36a4fe1-480870.png)

抗锯齿的方法有很多种，MSAA是其中一种

## Super sampling (MSAA, Multisample Anti-Aliasing)
Antialiasing By Supersampling (MSAA)

用来做**Averaging Values**， 做**模糊**

MSAA只是通过Blur来做近似，并没有真正提升分辨率/采样率，属于方法2.

Approximate the effect of the 1-pixel box filter by sampling multiple locations within a pixel and averaging their values:

![1673340625255-6e1686e4-8e5d-4ed9-947b-07dbfaa5773e.png](./img/oPsKft0smpygBLT7/1673340625255-6e1686e4-8e5d-4ed9-947b-07dbfaa5773e-348252.png)

![1673340711226-30c2c5d0-aad0-46eb-b72d-616a4de4c78c.png](./img/oPsKft0smpygBLT7/1673340711226-30c2c5d0-aad0-46eb-b72d-616a4de4c78c-405615.png)

![1673340682537-9aaa279d-a49e-4bc9-b917-388980b26875.png](./img/oPsKft0smpygBLT7/1673340682537-9aaa279d-a49e-4bc9-b917-388980b26875-573004.png)

![1673340813673-2a2807bc-d23c-4623-ac1d-74688ff66b7f.png](./img/oPsKft0smpygBLT7/1673340813673-2a2807bc-d23c-4623-ac1d-74688ff66b7f-497337.png)

![1673341057702-cd14d757-047c-46bf-ae5b-4bc5812b7ae8.png](./img/oPsKft0smpygBLT7/1673341057702-cd14d757-047c-46bf-ae5b-4bc5812b7ae8-094052.png)



Cost of MSAA:

1. 计算量增大



## 其他被广泛应用的方法
1. FXAA (Fast Approximate AA): 先画出一副有锯齿的图，再通过图像匹配的方法把这些边界找到，并且把这些边界换成没有锯齿的。速度很快。（Recall， 先画再blur是错误的）
2. TAA (Temporal AA)：通过找上一帧的信息来做抗锯齿。相当于将MSAA采样的范围分布到时间上。



## Super resolution
Super resolution  和 super sampling 不太一样，但本质一样。

Super resolution 是超分辨率，解决小图拉大不希望出现锯齿，低分辨率恢复高分辨率的问题。

同样是采样不足的问题。本质同样也是增加采样频率。

方法：DLSS (Deep Learning Super Sampling). 小图拉大，需要猜出原来的样子。什么技术适合猜？深度学习。

## 
# 其他参考资料
<font style="color:rgb(18, 18, 18);background-color:rgb(246, 246, 246);">如果看了这篇文章你还不懂傅里叶变换，那就过来掐死我吧 - Heinrich的文章 - 知乎 https://zhuanlan.zhihu.com/p/19759362</font>



> 更新: 2023-04-10 15:04:37  
> 原文: <https://www.yuque.com/viruspc/el3mi0/den895kaxrb0gaa1>