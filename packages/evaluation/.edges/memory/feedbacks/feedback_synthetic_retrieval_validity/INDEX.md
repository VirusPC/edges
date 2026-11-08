---
name: feedback_synthetic_retrieval_validity
description: 扩充 Edges 合成检索数据时：先说明真实请求依据与场景覆盖，再验证检索质量区分度，不能用成本差异或模板数量替代。
metadata:
  edges-title: 合成检索题以真实请求机制和质量区分度为目标
  edges-type: feedback
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-11-09T06:22:25+08:00'
---

Edges 记忆检索实验的补充合成题，应贴合真实请求的语言和任务机制，并检查检索质量的区分度；资源开销差异不能替代该目标。

**Why:** 用户在 2026-11-09 明确要求“问题自然贴合真实数据，并且有一定的检索效果的区分度”，并追问 benchmark 如何论证场景覆盖。仅增加明确查数题、复制模板或扩大干扰库，不能充分回答这一要求。

**How to apply:** 从授权真实开发样本提取抽象任务特征，公开覆盖依据、逐题标签、独立来源和未覆盖项；私密原问不进入合成程序或公开题集。另立版本，保留生成逻辑、结构真值与独立语义审阅。开发诊断检查质量是否天花板、错误是否有合理依据，不以 scoped 必须胜出挑题。正式集独立冻结，真实/合成分别报告，观察测试结果后改造的数据必须重新标识版本与验证范围。
