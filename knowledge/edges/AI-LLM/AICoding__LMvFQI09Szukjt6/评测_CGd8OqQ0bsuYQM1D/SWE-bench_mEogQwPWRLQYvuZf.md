# SWE-bench

[https://github.com/SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench)



Software engineer bench



1. 初版只支持python，后续支持typescript、java等多语言、多模态评测。前端可以用 multi-modal版本。
2. 如何使用？
    1. 要求先用自己的模型，生成 jsonl格式的数据。然后，把json文件作为swe-bench的输入，来评测。
    2. 推荐的issues，都存在huggingface上。如lite的数据集：[https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite)
    3. 也可以使用自己的数据集

```json
{
  "instance_id": "repo_owner__repo_name-issue_number",
  "model_name_or_path": "your-model-name",
  "model_patch": "补丁 diff 内容"
}

```

3. 原理？打分逻辑？SWE-bench 的整体打分逻辑总结如下：
    1. 评测目标：评估 LLM/自动修复工具在真实开源项目 issue 修复中的有效性。
    2. 评分流程
        1. 对每个 issue，应用模型生成的 patch 到项目代码。
        2. 自动运行项目原有的测试用例，检测 bug 是否被修复，并确保没有引入新错误。
    3. 判定标准
        1. 修复成功：patch 解决了指定 issue，所有相关和受影响的测试用例均通过。
        2. 修复失败：patch 未能解决目标问题，或引入新的测试错误。
    4. 统计指标
        1. 通过率（solved rate）：成功修复的 issue 数/总 issue 数，是主要评测分数。
        2. 还会细分不同模型、不同项目、不同 issue 类型的表现，方便横向对比。
    5. 工程自动化
        1. 全流程无人工标注，百分百依赖真实项目自动化测试，真正考验模型在生产级修复场景的能力
    6. 核心逻辑：自动应用 patch + 跑测试用例 + 统计通过率。分数科学、客观、可复现，能真实衡量代码大模型的工程修复能力。
4. Multi-modal版？
    1. Multi-modal 版除了文本，还涵盖 UI 元素、数据可视化等视觉相关 issue，但最终还是以修复后对应仓库的测试用例能不能通过为唯一判定标准；
    2. 对于不同编程语言/多模态内容，会准备对应的可自动运行的测试环境，保证评测时 patch 能被真实验证；
    3. 引入任务难度分级（easy/medium/hard），多语言泛化，以及多模态能力针对性分析，但打分仍以自动化 test case 的最终通过率为主。



> 更新: 2025-11-03 06:36:35  
> 原文: <https://www.yuque.com/viruspc/el3mi0/sb16l5v48agfhng5>