# 2026-03-01--XSCT方法论与AI评测范式变化.md

> Ingested on 2026-03-01

文件名：
2026-03-01--XSCT方法论与AI评测范式变化.md

【讨论主题】
围绕 XSCT methodology（AI评测方法论）展开讨论。核心议题是：传统AI benchmark（如MMLU、GSM8K等）主要评测“做题能力”，而XSCT尝试通过真实任务场景来评估AI在产品级环境中的能力，例如多步骤任务执行、工具调用、幻觉控制等。

【主要结论】
1. 传统AI benchmark存在结构性问题：
   - 以题库形式评测模型能力（question → answer）。
   - 与真实AI产品能力存在明显差距。

2. 真实AI产品能力更接近任务执行流程：
   - 用户任务 → 多步骤推理 → 工具调用 → 输出结果。

3. XSCT methodology提出以“任务场景”为评测单位，而不是单一题目。

4. XSCT benchmark的结构设计包含：
   - 三大领域：语言生成（xsct-l）、图像生成（xsct-vg）、Web生成（xsct-w）。
   - 能力维度包括：幻觉控制、prompt injection防御、agent任务执行、SQL能力、上下文追踪、推理链等。
   - 每个任务具有难度分层：Basic / Medium / Hard。

5. XSCT采用“LLM-as-judge”的评测模式：
   - 被测模型负责执行任务。
   - 评分模型根据rubric进行质量评分。

6. 该方法论更接近产品QA测试，而不是传统学术benchmark。

7. XSCT数据规模约为846个测试案例，规模相对有限。

【认知更新】
1. AI评测范式正在从“模型benchmark”转向“系统benchmark”。

2. 未来评测对象可能不再只是LLM，而是完整AI系统：
   - LLM + 工具 + 记忆 + 规划能力。

3. 真实AI能力评估更适合使用“任务执行质量”而不是“题目正确率”。

4. LLM-as-judge成为复杂任务评测的重要方法，因为很多任务不存在唯一标准答案。

5. XSCT的核心创新并非数据集本身，而是：
   - 从题目评测转向任务评测
   - 引入工程能力维度
   - 使用Rubric + Judge的评估机制

【行动指南】
1. 在评估AI系统时，优先关注任务执行能力，而不是单一benchmark分数。

2. 构建AI产品评测体系时，可以参考XSCT结构：
   - 设计真实任务场景
   - 设置难度分层
   - 定义明确评分rubric

3. 在复杂任务评估中引入LLM-as-judge机制，以支持开放式输出评分。

4. 在Agent或AI工具开发中，应重点测试以下能力：
   - hallucination控制
   - prompt injection防御
   - multi-step task执行
   - 工具选择与调用

【补充说明】
1. XSCT benchmark案例数量约846个。
2. 该方法论更偏向AI Agent与AI产品能力评估。
3. 仍然存在局限，例如：LLM judge可能存在评分偏差，且难以完全模拟真实产品环境中的延迟、成本和工具稳定性问题。

