---
name: project_locomo_smoke_truncated_baseline
description: 跑或改 evaluation/cases/locomo-smoke 时：dummy 用 python3 run.py dry-run；真实用 KIMI_API_KEY + run.py baseline。SUT 是上游 locomo 打分/out-file；cat-5 金标字段是 adversarial_answer；不要接 Project Memory。
metadata:
  edges-title: LoCoMo 冒烟是截断上下文基线，dummy dry-run 无 API
  edges-type: project
  edges-origin-session-id: bc-9b67d166-2345-5a45-86b9-888ca2c88ae2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T07:17:25+00:00"
---

LoCoMo Evaluation Smoke 已落地为截断上下文基线：`python3 evaluation/cases/locomo-smoke/run.py dry-run` 无 API 写报告；真实 run 是 `KIMI_API_KEY=... python3 evaluation/cases/locomo-smoke/run.py baseline`（默认模型 kimi-for-coding，默认 base https://api.kimi.com/coding/v1）。已验证于 2026-09-16 dummy dry-run（conv-44，10 QA，exit 0）。

**Why:**
上游 `evaluate_qa.py` 只路由名字里带 gpt/claude/gemini/部分 HF 的模型，不能直接喂 kimi-for-coding。cat-5 在 locomo10.json 里用 `adversarial_answer` 而不是 `answer`。分数只证明链路可跑，不是项目记忆证明。

**How to apply:**
- 先 `python3 -m unittest discover -s evaluation/cases/locomo-smoke/tests -v`，再 `run.py dry-run`。
- 子集规则：只留 conv-44；各类 1–5 按文件顺序取前 2 题，不足则全取。
- 打分要对齐上游 `eval_question_answering`；cat-5 缺 `answer` 时读 `adversarial_answer`。
- 不要把 `.memory` / Project Memory 接到 LoCoMo。对照 ADR 0008。
