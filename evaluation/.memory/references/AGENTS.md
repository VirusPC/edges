# REFERENCE — 外部引用

> 记：项目之外的信息去哪找，例如需求文档、设计稿、接口文档、监控面板、工单系统，以及各自的用途。
> 不记：链接里的内容本身，也不记密钥。
> 本文件只是索引，条目区块由脚本重算，正文写在 `references/reference_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [snap-research/locomo 官方数据与评测脚本](reference_snap_research_locomo.md) — 取 LoCoMo 数据或对照官方打分时：首选 submodule evaluation/third_party/locomo（https://github.com/VirusPC/locomo @ cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea）；上游基线 https://github.com/snap-research/locomo @ 3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376 ；QA 入口 task_eval/evaluate_qa.py，打分 task_eval/evaluation.py。fork 唯一有意差异是 OpenAI-compatible 模型后端。
<!-- project-memory-entries:end -->
