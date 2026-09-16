---
name: project_locomo_smoke_truncated_baseline
description: 跑或改 evaluation/cases/locomo-smoke 时：dummy 用 python3 run.py dry-run（不要 key）。真实 run 用 Kimi Code Console 的 KIMI_API_KEY + OPENAI_BASE_URL=https://api.kimi.com/coding/v1，模型 kimi-for-coding；不要用 Moonshot pay-as-you-go api.moonshot.ai。SUT 是上游 locomo 打分；不要接 Project Memory。
metadata:
  edges-title: LoCoMo 冒烟是截断上下文基线，dummy dry-run 无 API
  edges-type: project
  edges-origin-session-id: bc-9b67d166-2345-5a45-86b9-888ca2c88ae2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T07:23:44+00:00"
---

LoCoMo Evaluation Smoke 真实基线走 Kimi Code（token plan）OpenAI-compatible 接口：默认模型 `kimi-for-coding`，默认 base `https://api.kimi.com/coding/v1`，Bearer 来自 Kimi Code Console membership。这不是 Moonshot pay-as-you-go（`api.moonshot.ai` / `api.moonshot.cn`，另一套产品与钥匙）。dummy dry-run 仍然不要 key。用户所述、已写进 runner defaults / README。

**Why:**
两套 endpoint 容易混用；用错 key 或 base 会让真实 baseline 看起来像模型失败。冒烟成功标准仍是无 key 的 dry-run 能写出报告。

**How to apply:**
- Dry-run：`python3 evaluation/cases/locomo-smoke/run.py dry-run`（无 `KIMI_API_KEY`）。
- Real：`KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 python3 evaluation/cases/locomo-smoke/run.py baseline`。
- 不要把 Moonshot 平台 key 填进这个 runner。
- 子集 / 打分 / 不接 Project Memory 的约定不变。对照 ADR 0008。
