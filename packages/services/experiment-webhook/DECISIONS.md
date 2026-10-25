# Experiment webhook decisions

Grill on 2026-10-25. Do not reopen these in this change.

1. **Deliverable.** A multi-experiment registry, a Langfuse Custom Experiment webhook, and one real runner hooked up.
2. **Location.** `packages/services/experiment-webhook/`, same kind of long-running HTTP service as `artifacts-preview`. The runner stays in `packages/evaluation/`.
3. **Dispatch.** After HTTP 202 the process calls the runner function directly. A thread only lets the socket return before the run finishes. There is no job queue.
4. **Route key.** The Langfuse dataset name on the webhook body (`datasetName`).
5. **Failure.** Invalid JSON or a bad signature is rejected immediately. A run that times out or fails still got 202; the default limit is 10 minutes (`EXPERIMENT_RUN_TIMEOUT_SECONDS`). Timeout and failure are written to the local report and, when Langfuse keys are set, to an experiment trace plus a `run_ok` score.
6. **First runner.** `packages/evaluation/experiments/harness_memory_ablation`. The adapter maps Dataset items onto `run_experiment`. Local case files and Langfuse items are not the same shape.
7. **Signature.** Official `x-langfuse-signature` HMAC over the raw body (`t=<unix>,v1=<hex>`). `EXPERIMENT_WEBHOOK_SIGNATURE=off` disables it for development. Missing secret with verification on is a 401, not an unsigned accept.
8. **Results.** Local files under `packages/evaluation/reports/`. Langfuse gets an OTEL experiment trace and scores (`POST /api/public/scores`, one object per score on this self-hosted v4).
9. **Done bar.** Unit tests cover signature, routing, and timeout. A forged signed POST is an HTTP end-to-end test. A real Custom Experiment click needs a tunnel URL registered in the Langfuse UI; the public API does not set that URL. See `scripts/REAL-CUSTOM-EXPERIMENT.md`.
10. **Registry.** `registry.json` maps dataset name to a Python module. The process loads that file; the map is not only a hardcoded dict.
11. **Out of scope.** A thin wrap of brain #378 stays a follow-up on that repo. This change does not modify it.
