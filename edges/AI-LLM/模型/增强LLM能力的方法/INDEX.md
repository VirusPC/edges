# 增强LLM能力的方法

- [**一、与微调相关的技术**](#%E4%B8%80%E4%B8%8E%E5%BE%AE%E8%B0%83%E7%9B%B8%E5%85%B3%E7%9A%84%E6%8A%80%E6%9C%AF)
  * [1. **参数高效微调（Parameter-Efficient Fine-tuning, PEFT）**](#1-%E5%8F%82%E6%95%B0%E9%AB%98%E6%95%88%E5%BE%AE%E8%B0%83parameter-efficient-fine-tuning-peft)
  * [2. **持续学习（Continual Learning）**](#2-%E6%8C%81%E7%BB%AD%E5%AD%A6%E4%B9%A0continual-learning)
  * [3. **多任务学习（Multi-task Learning）**](#3-%E5%A4%9A%E4%BB%BB%E5%8A%A1%E5%AD%A6%E4%B9%A0multi-task-learning)
- [**二、与提示词工程相关的技术**](#%E4%BA%8C%E4%B8%8E%E6%8F%90%E7%A4%BA%E8%AF%8D%E5%B7%A5%E7%A8%8B%E7%9B%B8%E5%85%B3%E7%9A%84%E6%8A%80%E6%9C%AF)
  * [1. **Few-shot/Zero-shot Learning**](#1-few-shotzero-shot-learning)
  * [2. **思维链（Chain-of-Thought, CoT）**](#2-%E6%80%9D%E7%BB%B4%E9%93%BEchain-of-thought-cot)
  * [3. **自洽性（Self-Consistency）**](#3-%E8%87%AA%E6%B4%BD%E6%80%A7self-consistency)
- [**三、与RAG相关的增强技术**](#%E4%B8%89%E4%B8%8Erag%E7%9B%B8%E5%85%B3%E7%9A%84%E5%A2%9E%E5%BC%BA%E6%8A%80%E6%9C%AF)
  * [1. **知识图谱增强（Knowledge Graph Augmentation）**](#1-%E7%9F%A5%E8%AF%86%E5%9B%BE%E8%B0%B1%E5%A2%9E%E5%BC%BAknowledge-graph-augmentation)
  * [2. **动态检索（Dynamic Retrieval）**](#2-%E5%8A%A8%E6%80%81%E6%A3%80%E7%B4%A2dynamic-retrieval)
  * [3. **混合检索（Hybrid Retrieval）**](#3-%E6%B7%B7%E5%90%88%E6%A3%80%E7%B4%A2hybrid-retrieval)
- [**四、模型增强与优化**](#%E5%9B%9B%E6%A8%A1%E5%9E%8B%E5%A2%9E%E5%BC%BA%E4%B8%8E%E4%BC%98%E5%8C%96)
  * [1. **强化学习（Reinforcement Learning, RL）**](#1-%E5%BC%BA%E5%8C%96%E5%AD%A6%E4%B9%A0reinforcement-learning-rl)
  * [2. **模型蒸馏（Knowledge Distillation）**](#2-%E6%A8%A1%E5%9E%8B%E8%92%B8%E9%A6%8Fknowledge-distillation)
  * [3. **稀疏专家模型（Mixture-of-Experts, MoE）**](#3-%E7%A8%80%E7%96%8F%E4%B8%93%E5%AE%B6%E6%A8%A1%E5%9E%8Bmixture-of-experts-moe)
- [**五、数据增强与处理**](#%E4%BA%94%E6%95%B0%E6%8D%AE%E5%A2%9E%E5%BC%BA%E4%B8%8E%E5%A4%84%E7%90%86)
  * [1. **数据增强（Data Augmentation）**](#1-%E6%95%B0%E6%8D%AE%E5%A2%9E%E5%BC%BAdata-augmentation)
  * [2. **课程学习（Curriculum Learning）**](#2-%E8%AF%BE%E7%A8%8B%E5%AD%A6%E4%B9%A0curriculum-learning)
  * [3. **主动学习（Active Learning）**](#3-%E4%B8%BB%E5%8A%A8%E5%AD%A6%E4%B9%A0active-learning)
- [**六、后处理与部署优化**](#%E5%85%AD%E5%90%8E%E5%A4%84%E7%90%86%E4%B8%8E%E9%83%A8%E7%BD%B2%E4%BC%98%E5%8C%96)
  * [1. **模型量化（Quantization）**](#1-%E6%A8%A1%E5%9E%8B%E9%87%8F%E5%8C%96quantization)
  * [2. **模型剪枝（Pruning）**](#2-%E6%A8%A1%E5%9E%8B%E5%89%AA%E6%9E%9Dpruning)
  * [3. **解码策略优化**](#3-%E8%A7%A3%E7%A0%81%E7%AD%96%E7%95%A5%E4%BC%98%E5%8C%96)
- [**七、新兴方向**](#%E4%B8%83%E6%96%B0%E5%85%B4%E6%96%B9%E5%90%91)
  * [1. **自监督学习（Self-Supervised Learning）**](#1-%E8%87%AA%E7%9B%91%E7%9D%A3%E5%AD%A6%E4%B9%A0self-supervised-learning)
  * [2. **因果推理（Causal Inference）**](#2-%E5%9B%A0%E6%9E%9C%E6%8E%A8%E7%90%86causal-inference)
  * [3. **可解释性工具（Interpretability Tools）**](#3-%E5%8F%AF%E8%A7%A3%E9%87%8A%E6%80%A7%E5%B7%A5%E5%85%B7interpretability-tools)
- [**总结：如何选择技术？**](#%E6%80%BB%E7%BB%93%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9%E6%8A%80%E6%9C%AF)

---

在调整或增强大语言模型（LLM）性能时，除了**微调（Fine-tuning）**、**提示词工程（Prompt Engineering）和RAG（检索增强生成）**，还有许多相关技术和方法。以下是这些概念的分类整理，涵盖从数据增强到模型架构优化的多个方向：

---

### **一、与微调相关的技术**
#### 1. **参数高效微调（Parameter-Efficient Fine-tuning, PEFT）**
+ **目标**：仅调整少量参数，降低计算成本。
+ **方法**：
    - **LoRA**：通过低秩矩阵注入调整注意力层。
    - **Adapter**：插入小型可训练模块到Transformer层。
    - **Prefix/Prompt Tuning**：优化输入前缀或提示向量（如Soft Prompt）。
+ **特点**：适合资源有限场景，效果接近全参数微调。

#### 2. **持续学习（Continual Learning）**
+ **目标**：在多个任务上逐步训练模型，避免灾难性遗忘。
+ **方法**：弹性权重巩固（Elastic Weight Consolidation, EWC）、任务增量学习。

#### 3. **多任务学习（Multi-task Learning）**
+ **目标**：同时训练模型完成多个任务，共享底层表示。
+ **特点**：提升泛化能力，但需平衡任务间的数据分布。

---

### **二、与提示词工程相关的技术**
#### 1. **Few-shot/Zero-shot Learning**
+ **原理**：通过少量示例（Few-shot）或无示例（Zero-shot）直接引导模型推理。
+ **示例**：

```latex
任务：情感分析。输入：“这部电影太棒了！” 输出：正面。
输入：“服务非常糟糕。” 输出：
```

#### 2. **思维链（Chain-of-Thought, CoT）**
+ **原理**：通过提示词引导模型分步推理，提升复杂问题解答能力。
+ **示例**：

```latex
问题：小明有5个苹果，吃了2个，又买了3个，现在有多少个？
思考：首先5-2=3，然后3+3=6。答案是6。
```

#### 3. **自洽性（Self-Consistency）**
+ **原理**：生成多个答案，通过投票或一致性筛选最优结果（减少随机性）。

---

### **三、与RAG相关的增强技术**
#### 1. **知识图谱增强（Knowledge Graph Augmentation）**
+ **原理**：结合结构化知识图谱（而非文本片段）辅助生成。
+ **优势**：提升生成内容的逻辑性和事实准确性。

#### 2. **动态检索（Dynamic Retrieval）**
+ **原理**：在生成过程中实时检索外部知识库（如每生成一个段落检索一次）。

#### 3. **混合检索（Hybrid Retrieval）**
+ **方法**：结合语义检索（如向量相似度）和关键词检索，提升召回率。

---

### **四、模型增强与优化**
#### 1. **强化学习（Reinforcement Learning, RL）**
+ **RLHF（人类反馈强化学习）**：通过人类偏好数据调整模型（如ChatGPT的训练流程）。
+ **RLAIF（AI反馈强化学习）**：用AI模型替代人类标注反馈。

#### 2. **模型蒸馏（Knowledge Distillation）**
+ **原理**：将大模型（教师模型）的知识迁移到小模型（学生模型）。
+ **应用**：压缩模型规模，提升推理速度。

#### 3. **稀疏专家模型（Mixture-of-Experts, MoE）**
+ **原理**：将模型拆分为多个专家子网络，动态路由输入到特定专家。
+ **优势**：在参数量相近时提升模型容量（如GPT-4的稀疏架构）。

---

### **五、数据增强与处理**
#### 1. **数据增强（Data Augmentation）**
+ **方法**：回译（中→英→中）、同义词替换、模板生成。
+ **目标**：扩展训练数据多样性，缓解过拟合。

#### 2. **课程学习（Curriculum Learning）**
+ **原理**：从简单样本到复杂样本逐步训练模型（类似人类学习过程）。

#### 3. **主动学习（Active Learning）**
+ **原理**：让模型选择对自身提升最有价值的数据进行标注。

---

### **六、后处理与部署优化**
#### 1. **模型量化（Quantization）**
+ **原理**：将模型权重从32位浮点压缩为8/4位整数，减少推理内存占用。

#### 2. **模型剪枝（Pruning）**
+ **原理**：移除对输出影响小的神经元或连接，压缩模型大小。

#### 3. **解码策略优化**
+ **方法**：Top-p采样（Nucleus Sampling）、温度调整（Temperature Scaling）、束搜索（Beam Search）。

---

### **七、新兴方向**
#### 1. **自监督学习（Self-Supervised Learning）**
+ **原理**：利用无标注数据生成预训练任务（如掩码语言建模）。

#### 2. **因果推理（Causal Inference）**
+ **目标**：让模型理解变量间的因果关系，而非仅仅相关性。

#### 3. **可解释性工具（Interpretability Tools）**
+ **方法**：注意力可视化、特征重要性分析（如LIME、SHAP）。

---

### **总结：如何选择技术？**
| **需求场景** | **适用技术** |
| --- | --- |
| 资源有限但需适配新任务 | PEFT（LoRA/Adapter）、提示工程、量化 |
| 提升生成结果的事实准确性 | RAG、知识图谱增强、动态检索 |
| 控制生成风格或安全性 | RLHF、后处理规则、Prompt工程 |
| 压缩模型以部署到边缘设备 | 模型蒸馏、剪枝、量化 |
| 解决复杂推理问题 | 思维链（CoT）、自洽性、多步推理Prompt |


这些技术并非孤立，实际应用中常需组合使用（如RAG+Prompt工程+LoRA微调）。选择时需权衡**数据量**、**计算资源**、**任务复杂度**和**实时性要求**。



> 更新: 2025-03-29 04:27:03  
> 原文: <https://www.yuque.com/viruspc/el3mi0/trh9cg55khhroe8z>