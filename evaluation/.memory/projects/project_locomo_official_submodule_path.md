---
name: project_locomo_official_submodule_path
description: 跑或改 LoCoMo Evaluation Smoke 时：首选 evaluation/run_locomo_official.py（submodule 官方 evaluate_qa.py / evaluation.py F1）。print-command 无 key；真实 smoke 用 KIMI_API_KEY + kimi-for-coding。evaluation/cases/locomo-smoke 是 legacy hand-port。不是 Benchmark Proof / Project Memory proof。
metadata:
  edges-title: LoCoMo 官方冒烟走 VirusPC/locomo submodule
  edges-type: project
  edges-origin-session-id: bc-fd9a53e9-45c9-5ce8-bf48-b26c30aff880
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T09:33:00+00:00"
---

LoCoMo Evaluation Smoke 的首选官方路径是 `evaluation/run_locomo_official.py`：git submodule 钉住 VirusPC/locomo `cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea`（fork main 上 PR #1 merge），调用 `task_eval/evaluate_qa.py`，F1 走官方 `task_eval/evaluation.py`。`evaluation/cases/locomo-smoke` 是 PR #70 的 hand-port，只留历史与旧报告。这是 Evaluation Smoke，不是 Benchmark Proof，也不是 Project Memory proof。用户所述 + 2026-09-16 已接线验证（print-command / crop / 无 key smoke 拒绝）。

**Why:**
仓内 port 的 F1/crop 会和官方语义漂移（legacy crop 还丢掉 observation / session_summary）。fork 只改 OpenAI-compatible 模型后端；打分与 prompt 仍是上游。四臂探索仍 paused，不要把 Project Memory 接到 LoCoMo。

**How to apply:**
- Clone：`git clone --recurse-submodules https://github.com/VirusPC/edges.git`；已有仓：`git submodule update --init evaluation/third_party/locomo`。
- 无 key：`python3 evaluation/run_locomo_official.py print-command`。
- 真跑：`KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 python3 evaluation/run_locomo_official.py smoke`（conv-44 / 每类 2 题 / kimi-for-coding）。
- 官方 crop：`python3 evaluation/run_locomo_official.py crop`（保留 RAG 字段；默认写 `evaluation/.cache/`）。
- 不要用 Moonshot pay-as-you-go；不要把分数写成 Project Memory 证明。对照 ADR 0008。
