---
name: reference_snap_research_locomo
description: 取 LoCoMo 数据或对照官方打分时：首选 submodule evaluation/third_party/locomo（https://github.com/VirusPC/locomo @ cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea）；上游基线 https://github.com/snap-research/locomo @ 3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376 ；QA 入口 task_eval/evaluate_qa.py，打分 task_eval/evaluation.py。fork 唯一有意差异是 OpenAI-compatible 模型后端。
metadata:
  edges-title: snap-research/locomo 官方数据与评测脚本
  edges-type: reference
  edges-origin-session-id: bc-fd9a53e9-45c9-5ce8-bf48-b26c30aff880
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T09:33:00+00:00"
---

LoCoMo 官方仓是 snap-research/locomo。Edges 现在用 fork https://github.com/VirusPC/locomo ，以 submodule 钉在 evaluation/third_party/locomo，commit cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea（PR #1 merge）。上游基线仍是 3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376 的 data/locomo10.json。QA 入口 task_eval/evaluate_qa.py，打分函数是 task_eval/evaluation.py 的 eval_question_answering。fork 相对上游的唯一有意差异是 OpenAI-compatible / kimi-for-coding 路由与 --sample-id / --qa-per-category；官方 crop 保留 observation / session_summary。用户所述 + 2026-09-16 已对照 fork docs/EDGES_EVAL.md。

**Why:**
不再靠仓内 port 对齐官方 F1。需要稳定的 fork URL、pinned commit 和官方脚本入口。

**How to apply:**
- 初始化：`git clone --recurse-submodules` 或 `git submodule update --init evaluation/third_party/locomo`。
- 跑：`python3 evaluation/run_locomo_official.py print-command` / `smoke`。
- 数据：submodule 内 `data/locomo10.json`；子集 conv-44、每类前 2 题（官方 in-memory 过滤或 `crop`）。
- Links: https://github.com/VirusPC/locomo ；https://github.com/snap-research/locomo ；https://raw.githubusercontent.com/snap-research/locomo/3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376/data/locomo10.json
