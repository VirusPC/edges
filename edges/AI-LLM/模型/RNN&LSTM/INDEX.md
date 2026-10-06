# RNN & LSTM

- [RNN](#rnn)
- [LSTM](#lstm)
- [参考](#%E5%8F%82%E8%80%83)

---

## RNN
循环神经网络（Recurrent Neural Network，RNN），RNN出现的目的是来处理**序列数据**的。能够使用历史信息作为输入、包含环和自重复的网络。可以用来做动态embeding。如图所示:

+ 核心组成部分
    - 输入层
    - 循环层（核心层）。捕获序列数据中的时间依赖关系。每个时间步都会根据当前输入和上一个时间步的隐藏状态进行计算
    - 全连接层。对循环层的输出进行进一步处理，用于生成最终的结果。
    - 输出层



+ ![1753519104474-5cb9a723-0993-45be-ae00-96bb1c22de0f.png](./img/wmLUdsJ7zVvxuSCN/1753519104474-5cb9a723-0993-45be-ae00-96bb1c22de0f-893250.png)
+ ![1753521409291-d398de66-e08b-4b8d-a03f-a03f449934ca.png](./img/wmLUdsJ7zVvxuSCN/1753521409291-d398de66-e08b-4b8d-a03f-a03f449934ca-907119.png)
+ ![1753522298205-b010b48d-d1e8-46f0-96e7-aa2049a7d744.png](./img/wmLUdsJ7zVvxuSCN/1753522298205-b010b48d-d1e8-46f0-96e7-aa2049a7d744-579340.png)
+ ![1753522346250-3899bf1f-22ff-48c6-b09c-a5dfa3e9426b.png](./img/wmLUdsJ7zVvxuSCN/1753522346250-3899bf1f-22ff-48c6-b09c-a5dfa3e9426b-500253.png)
+ ![1753521801661-0c7f113c-af0b-48a7-a633-6861b561c5fa.png](./img/wmLUdsJ7zVvxuSCN/1753521801661-0c7f113c-af0b-48a7-a633-6861b561c5fa-819965.png)
+ 多个时间层级间，权重共享一个W_s
+ ![1753521913034-6dffc1df-c11e-4a41-bcb1-72acecdbfb3e.png](./img/wmLUdsJ7zVvxuSCN/1753521913034-6dffc1df-c11e-4a41-bcb1-72acecdbfb3e-046707.png)
+ ![1753522044963-89df18fe-03b8-4151-b634-6e65c97b7291.png](./img/wmLUdsJ7zVvxuSCN/1753522044963-89df18fe-03b8-4151-b634-6e65c97b7291-588302.png)



应用：

1 to n：

![1753522611515-badf0402-8fc6-4801-b7b5-e73fdac83a90.png](./img/wmLUdsJ7zVvxuSCN/1753522611515-badf0402-8fc6-4801-b7b5-e73fdac83a90-188309.png)

n to 1:

![1753522649861-9e6e8891-da10-4c3c-b46a-4c5ca4993669.png](./img/wmLUdsJ7zVvxuSCN/1753522649861-9e6e8891-da10-4c3c-b46a-4c5ca4993669-089406.png)

n to n，输入输出等长

![1753522683357-59bdfdcd-6e1b-42dc-b64e-3f4a587cf6cf.png](./img/wmLUdsJ7zVvxuSCN/1753522683357-59bdfdcd-6e1b-42dc-b64e-3f4a587cf6cf-167062.png)

n to m，输入输出不等长

![1753522773291-d4ca20f9-d8d0-4ae7-b1fe-bdac0866f0ef.png](./img/wmLUdsJ7zVvxuSCN/1753522773291-d4ca20f9-d8d0-4ae7-b1fe-bdac0866f0ef-340146.png)

RNN在小数据集，低算力的情况下非常有效

## <font style="color:rgb(25, 27, 31);">LSTM</font>
RNN只看上一步，是一种short term memory。通常情况下，RNN超过10步就会忘记。

于是，人们在RNN基础上，提出了LSTM，长短期记忆网络。LSTM增加了一条新的时间链，记录long term memory。

和RNN相比，LSTM在计算隐藏层状态S_t时，除了输入和前一时刻，还要包含当前时刻的日记C_t。同时保留短期记忆链S_t和长期记忆链C_t，并且互相更新，就是LSTM的核心。C_t上有两个重要操作，forgeot gate和input gate，用于实现忽略无关信息、关注重要片段。



![1753523638669-2e1d44f5-e3b4-4a73-9a2a-8f7d38ac9e03.png](./img/wmLUdsJ7zVvxuSCN/1753523638669-2e1d44f5-e3b4-4a73-9a2a-8f7d38ac9e03-469416.png)

L

![1753523699443-a4c59491-96c7-47d5-bdc7-0e99e0375b6a.png](./img/wmLUdsJ7zVvxuSCN/1753523699443-a4c59491-96c7-47d5-bdc7-0e99e0375b6a-538445.png)



日记（细胞状态，Cell State）的遗忘和写入：

![1753523967100-836a9c7a-0b31-44f3-acc1-165a4c808238.png](./img/wmLUdsJ7zVvxuSCN/1753523967100-836a9c7a-0b31-44f3-acc1-165a4c808238-411604.png)



**<font style="color:rgb(25, 27, 31);">LSTM：</font>**<font style="color:rgb(25, 27, 31);">一种改进的循环神经网络，通过输入门、遗忘门和输出门控制信息流动，并利用细胞状态保存长期记忆。这种门控机制有效解决了传统RNN的梯度消失问题，使其能够学习长序列中的依赖关系，在机器翻译、语音识别等时序任务中表现优异，显著优于标准RNN。</font>

<font style="color:rgb(25, 27, 31);"></font>

![1753522557465-8670040f-ca6e-4c37-b8de-b35e95e7caaa.png](./img/wmLUdsJ7zVvxuSCN/1753522557465-8670040f-ca6e-4c37-b8de-b35e95e7caaa-592187.png)

![1753524268038-5506303a-e48c-4c47-9dc5-77d69d3a0c50.png](./img/wmLUdsJ7zVvxuSCN/1753524268038-5506303a-e48c-4c47-9dc5-77d69d3a0c50-527359.png)



与RNN相比，LSTM引入了更多参数矩阵，训练起来更麻烦些。但总归还是梯度下降+反向传播。





## <font style="color:rgb(25, 27, 31);">参考</font>
+ [【循环神经网络】5分钟搞懂RNN，3D动画深入浅出_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1z5411f7Bm/?spm_id_from=333.337.search-card.all.click&vd_source=a637826c55b409b420b4b6584a6e8379)
+ [【LSTM长短期记忆网络】3D模型一目了然，带你领略算法背后的逻辑_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1Z34y1k7mc?spm_id_from=333.788.videopod.sections&vd_source=a637826c55b409b420b4b6584a6e8379)



> 更新: 2025-07-26 10:07:46  
> 原文: <https://www.yuque.com/viruspc/el3mi0/pfui16euoot1cqxb>