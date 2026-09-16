# LoCoMo Evaluation Smoke

Official-style **write → retrieve → answer → score** path for a tiny LoCoMo subset.

This is **Evaluation Smoke, not Benchmark Proof**. The SUT is upstream [snap-research/locomo](https://github.com/snap-research/locomo) scoring / out-file schema. Do **not** wire Project Memory / `.memory` as a LoCoMo backend, and do **not** cite scores as evidence that filesystem project-memory works.

Decision: [`docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md`](../../../docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md).

## Locked subset

- Conversation: `conv-44` only.
- QA: categories `1..5`; for each category take the **first 2 QA items in file order**. If a category has fewer than 2, take all of them.
- This run: **truncated-context baseline only** (no RAG).

Default `dry-run` / `baseline` reuse the committed crop at `data/locomo10-conv44-smoke.json` (offline). To rebuild it, pass `--data-file` to a local `locomo10.json` or delete the crop so the runner fetches the pinned upstream commit `3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376`. Full source is cached under `evaluation/.cache/` (gitignored). The crop keeps `sample_id` + `conversation` + selected `qa` and drops observation / summaries. Category 5 gold in locomo10 is `adversarial_answer`.

Scoring is a stdlib port of upstream `eval_question_answering`. If `nltk` is installed it uses the same `PorterStemmer` as official locomo; otherwise an in-tree stemmer is used. Dummy dry-run F1 is 0 regardless. For a real run whose F1 you want to compare to `evaluate_qa.py`, `pip install nltk==3.8.1`.

## Dummy dry-run (no API)

```bash
python3 evaluation/cases/locomo-smoke/run.py dry-run
```

Writes:

- `evaluation/reports/2026-09-16-locomo-smoke-dry-run.json` — same schema as upstream `task_eval/evaluate_qa.py` `--out-file` (list of `{sample_id, qa}` with `{model}_prediction` / `{model}_f1`)
- `evaluation/reports/2026-09-16-locomo-smoke-dry-run.md` — Evaluation Report
- `evaluation/cases/locomo-smoke/data/locomo10-conv44-smoke.json` — cropped data-file

Tests (stdlib `unittest`, no extra deps):

```bash
python3 -m unittest discover -s evaluation/cases/locomo-smoke/tests -v
```

## Real kimi-for-coding baseline

`kimi-for-coding` spends completion budget on `reasoning_content` first; keep `max_tokens` high enough (default 1024) or `message.content` can be empty.

Upstream `evaluate_qa.py` only routes model names containing `gpt` / `claude` / `gemini` / selected HF ids. This wrapper feeds the cropped data-file, builds the official truncated-context prompt, calls an OpenAI-compatible Chat Completions endpoint, then scores with the upstream `eval_question_answering` rules.

```bash
KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 \
  python3 evaluation/cases/locomo-smoke/run.py baseline
```

Optional env / flags:

| Name | Default |
| --- | --- |
| `KIMI_API_KEY` or `OPENAI_API_KEY` | required for real run (Bearer from **Kimi Code Console** membership, not Moonshot pay-as-you-go) |
| `OPENAI_BASE_URL` | `https://api.kimi.com/coding/v1` |
| `LOCOMO_MODEL` / `--model` | `kimi-for-coding` |
| `--data-file` | committed crop; omit to stay offline |
| `--date` | `2026-09-16` |

This is the Kimi Code (token plan) OpenAI-compatible endpoint. It is **not** Moonshot pay-as-you-go `https://api.moonshot.ai/v1` / `https://api.moonshot.cn/v1` (different product, different key). Do not put the API key in the repo.
