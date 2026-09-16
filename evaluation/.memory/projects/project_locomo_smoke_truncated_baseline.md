---
name: project_locomo_smoke_truncated_baseline
description: 改 evaluation/cases/locomo-smoke 时：这是 legacy hand-port。新跑用 evaluation/run_locomo_official.py。dummy 仍可用 python3 run.py dry-run（不要 key）。真实 run 若走旧入口：KIMI_API_KEY + OPENAI_BASE_URL=https://api.kimi.com/coding/v1，模型 kimi-for-coding。SUT 是上游 locomo 打分；不要接 Project Memory。
metadata:
  edges-title: LoCoMo 冒烟是截断上下文基线，dummy dry-run 无 API
  edges-type: project
  edges-origin-session-id: bc-fd9a53e9-45c9-5ce8-bf48-b26c30aff880
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-16T09:33:00+00:00"
---

`evaluation/cases/locomo-smoke` 仍是截断上下文基线的 legacy hand-port：dummy dry-run 不要 key；若仍走旧入口，真实 run 用 Kimi Code Console 的 KIMI_API_KEY + OPENAI_BASE_URL=https://api.kimi.com/coding/v1，模型 kimi-for-coding。新的 Evaluation Smoke 应走 `evaluation/run_locomo_official.py`（VirusPC/locomo submodule 官方 F1）。不是 Moonshot pay-as-you-go。SUT 是上游 locomo 打分；不要接 Project Memory。用户所述 + 2026-09-16 官方路径接线后更新。

**Why:**
旧入口的 crop 丢掉 observation / session_summary；打分是仓内 port。官方路径钉住 fork 后，再改 locomo-smoke 只为维持 PR #70 历史报告与测试。

**How to apply:**
- 新跑：`python3 evaluation/run_locomo_official.py print-command` / `smoke`。
- 旧 dry-run：`python3 evaluation/cases/locomo-smoke/run.py dry-run`（无 `KIMI_API_KEY`）。
- 旧 real：`KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 python3 evaluation/cases/locomo-smoke/run.py baseline`。
- 不要把 Moonshot 平台 key 填进这些 runner。
- 对照 ADR 0008。不要删除 `evaluation/reports/2026-09-16-locomo-smoke-*`。
