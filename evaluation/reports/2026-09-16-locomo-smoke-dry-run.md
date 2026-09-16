# Evaluation Smoke — LoCoMo truncated-context baseline

**This is Evaluation Smoke, not Benchmark Proof.**

The numbers below only show that the official-style write → retrieve → answer → score path can produce a reproducible Evaluation Report. They are **not** evidence that Project Memory or Agent Memory works. Do not cite them as project-memory gain, “记忆评测通过”, or benchmark 证明有效.

See [docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md](../../docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md).

| Field | Value |
| --- | --- |
| Kind | Evaluation Smoke (not Benchmark Proof) |
| SUT | upstream locomo (`task_eval/evaluate_qa.py` out-file schema + `eval_question_answering`) |
| Backend | truncated-context baseline (no RAG; Project Memory is **not** wired) |
| Subset | conv-44; first 2 QA per category 1-5 in file order (take all if a category has <2) |
| Model | `dummy` |
| Mode | dry-run (no LLM; fixed placeholder answers) |
| Samples | 1 |
| QA items | 10 |
| Mean `dummy_f1` | 0.000 |

## Reproduce

Dry-run (no API key):

```bash
python3 evaluation/cases/locomo-smoke/run.py dry-run
```

Real kimi-for-coding run (key via env, never commit the key):

```bash
KIMI_API_KEY=... OPENAI_BASE_URL=https://api.kimi.com/coding/v1 python3 evaluation/cases/locomo-smoke/run.py baseline
```

`KIMI_API_KEY` or `OPENAI_API_KEY` is required for the real run (Kimi Code Console Bearer key, not a Moonshot pay-as-you-go key). `OPENAI_BASE_URL` defaults to `https://api.kimi.com/coding/v1`. Do not use `api.moonshot.ai` / `api.moonshot.cn` for `kimi-for-coding`. Override the model with `--model` / `LOCOMO_MODEL`.

## Per-question scores

| sample_id | category | question | gold | prediction | F1 |
| --- | --- | --- | --- | --- | --- |
| conv-44 | 2 | Which year did Audrey adopt the first three of her dogs? | 2020 | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 2 | When did Andrew start his new job as a financial analyst? | The week before March 27, 2023 | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 1 | What kind of indoor activities has Andrew pursued with his girlfriend? | boardgames, volunteering at pet shelter, wine tasting, growing flowers | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 1 | What kind of places have Andrew and his girlfriend checked out around the city? | cafes, new places to eat, open space for hikes, pet shelter, wine tasting eve... | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 3 | What is an indoor activity that Andrew would enjoy doing while make his dog h... | cook dog treats | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 3 | Which meat does Audrey prefer eating more than others? | chicken | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 4 | Which specific type of bird mesmerizes Andrew? | Eagles | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 4 | What did Andrew express missing about exploring nature trails with his family... | The peaceful moments | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 5 | Which specific type of bird mesmerizes Audrey? | Eagles | DRY_RUN_PLACEHOLDER | 0.000 |
| conv-44 | 5 | What kind of flowers does Andrew have a tattoo of? | sunflowers | DRY_RUN_PLACEHOLDER | 0.000 |

## What this is not

- Not a ranking of memory systems.
- Not a construct-valid proof for filesystem project-memory.
- Not an official LoCoMo leaderboard submission.
