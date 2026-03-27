基于上面对话的内容，总结如下：
新项目（使用 Claude 4.6 系列）
直接用 Adaptive Thinking，不要用 budget_tokens：

{
  "model": "claude-opus-4-6",
  "max_tokens": 16000,
  "thinking": { "type": "adaptive" },
  "output_config": { "effort": "medium" }
}


effort 选择参考：



|effort  |适用场景            |
|--------|----------------|
|`low`   |简单问答，成本优先       |
|`medium`|通用，大多数场景的起点     |
|`high`  |复杂推理、多步骤 Agentic|
|`max`   |最高质量，不计成本       |

老项目（Claude 4.5 及更早，或成本敏感）
继续用 Extended Thinking + budget_tokens，记住两个约束：

{
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000   // 必须 < max_tokens
  },
  "max_tokens": 16000
}


budget_tokens 经验值：简单任务 ~5K，复杂推理 ~16K，超过 32K 收益递减明显。

不需要深度推理时
直接关掉 thinking，省钱省时间：

{
  "thinking": { "type": "disabled" }
}


一句话决策树：
用 4.6？→ Adaptive + effort。用更早模型或要控制成本？→ Extended + budget_tokens。纯问答/写作？→ 关掉 thinking。​​​​​​​​​​​​​​​​