---
name: reference_snap_research_locomo
description: 取 LoCoMo 数据或对照官方打分时：仓库 https://github.com/snap-research/locomo ；pinned locomo10.json https://raw.githubusercontent.com/snap-research/locomo/3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376/data/locomo10.json ；QA 入口 task_eval/evaluate_qa.py，打分 task_eval/evaluation.py。
metadata:
  edges-title: snap-research/locomo 官方数据与评测脚本
  edges-type: reference
  edges-origin-session-id: bc-9b67d166-2345-5a45-86b9-888ca2c88ae2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T07:17:25+00:00"
---

LoCoMo 官方仓是 snap-research/locomo。冒烟数据用 pinned commit 3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376 的 data/locomo10.json；QA 写出文件格式以 task_eval/evaluate_qa.py 为准，打分函数是 task_eval/evaluation.py 的 eval_question_answering。用户所述 + 2026-09-16 对照过 raw URL。

**Why:**
不 vendor 整仓。需要稳定 URL 和脚本入口，避免每次去猜 raw 路径或把 kimi 硬塞进官方 CLI。

**How to apply:**
- 拉数：evaluation/cases/locomo-smoke/run.py 默认 fetch 上述 raw URL 到 evaluation/.cache/，或 --data-file 本地副本。
- 对照 schema：out-file 是 sample 列表，qa 上写 {model}_prediction 与 {model}_f1。
- 官方 CLI 不认 kimi-for-coding；真实 run 走本仓 OpenAI-compatible wrapper。
- Links: https://github.com/snap-research/locomo ；https://raw.githubusercontent.com/snap-research/locomo/3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376/data/locomo10.json
