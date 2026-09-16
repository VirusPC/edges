# evaluation/third_party/

Pinned third-party harnesses used by Edges evaluation. These are git submodules, not vendored copies.

## locomo

[VirusPC/locomo](https://github.com/VirusPC/locomo) — fork of [snap-research/locomo](https://github.com/snap-research/locomo).

- Path: [`locomo/`](locomo/)
- Pinned commit: `cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea` (PR #1 merge on fork `main`)
- Upstream base: `snap-research/locomo@3eb6f2c585f5e1699204e3c3bdf7adc5c28cb376`
- Intentional delta: OpenAI-compatible / `kimi-for-coding` routing. Official `task_eval/evaluation.py` F1 is unchanged.
- Edges entry: [`../run_locomo_official.py`](../run_locomo_official.py)
- Fork notes: [`locomo/docs/EDGES_EVAL.md`](locomo/docs/EDGES_EVAL.md)

This is **Evaluation Smoke, not Benchmark Proof / not Project Memory proof**. See [`docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md`](../../docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md).
