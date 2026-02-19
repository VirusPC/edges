---
name: conversation-to-notes
description: 将原始对话记录整理为结构清晰的中文笔记摘要。遵循 Facts - Insights - Actions 模型：主要结论（事实）、认知更新（洞察）和行动指南（动作）。
---

# conversation_to_notes

将原始对话记录整理为结构清晰的中文笔记摘要。
生成符合格式 YYYY-MM-DD--主题简述.md 的标题。
遵循 **Facts - Insights - Actions** 逻辑进行组织。

## When to Use:
当需要将原始对话或聊天记录总结转化为可阅读笔记时使用。

## Inputs:
- 原始对话全文

## Instructions:
1. 识别对话的核心讨论主题。
2. 生成标题，格式严格为：YYYY-MM-DD--主题简述.md
3. **Facts (主要结论)**：提取对话中达成的共识、定论或发现的关键事实。
4. **Insights (认知更新)**：识别对话中产生的关键洞察、逻辑转变或可复用的 Edge（判断优势）。
5. **Actions (行动指南)**：列出明确的具体决策、后续行动项或实验计划。
6. 梳理重要推理过程或逻辑关系（关键过程）。
7. 所有输出必须为中文。

## Output Format:

文件名：
YYYY-MM-DD--主题简述.md

---

【主要结论】
(事实与共识)
...

【认知更新】
(核心洞察与可复用逻辑)
...

【行动指南】
(具体决策与后续动作)
...

【关键过程】
(重要的推理路径或讨论背景)
...

## Constraints:
- 不添加原记录中不存在的新观点。
- 标题必须严格符合 YYYY-MM-DD--主题简述.md 格式。
- **逻辑递进**：确保从 Facts 到 Actions 的逻辑连贯性。
- 输出必须为中文。

## Limitations:
- 依赖输入文本提供足够语境。
