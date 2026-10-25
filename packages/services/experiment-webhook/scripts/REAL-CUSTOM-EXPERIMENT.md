# Real Custom Experiment checklist

The webhook speaks Langfuse's Custom Experiment POST. Langfuse has to reach this process, and the dataset's remote URL is set in the Langfuse UI. The public API on the self-hosted instance does not expose that field: on 2026-10-25 `PATCH /api/public/v2/datasets/{name}` returned **405**, and `DELETE` on a dataset also returned **405**.

Outbound calls from this environment did work with `LANGFUSE_HOST` or `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, and `LANGFUSE_SECRET_KEY`: health, dataset read, dataset item create, OTEL experiment create, and one-object score create. Do not put those values, or the instance hostname, in the repo.

`cloudflared` was not installed here, so this run did not open a tunnel and Langfuse did not call the new webhook.

## What is already true

- `GET /api/public/health` returned OK (Langfuse 4.38.0).
- Dataset `harness-memory-ablation/v1` is readable and has items shaped like the ablation adapter (`input.question`, `expectedOutput.criteria` / `violations`, `metadata.case_id`, `metadata.category`).
- A connectivity dataset `edges-experiment-webhook-smoke` was created, with one item, and an experiment named `edges-experiment-webhook-smoke-scores` was ingested through this service's client. Scores on that run were accepted (`run_ok`, `worth_default_on`).
- An empty dataset `edges-experiment-webhook-smoke-b` was also created while probing create calls. The public API would not delete it. Remove it in the UI if you do not want it.

## Steps for a real UI trigger

1. Export `LANGFUSE_HOST` or `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_WEBHOOK_SECRET`. Leave `EXPERIMENT_WEBHOOK_SIGNATURE` unset so verification stays on.
2. From `packages/services/experiment-webhook` run `PYTHONPATH=. python3 -m experiment_webhook`. It listens on `127.0.0.1:8791`.
3. Install Cloudflare `cloudflared` and run `cloudflared tunnel --url http://127.0.0.1:8791`. Copy the HTTPS URL it prints.
4. In the Langfuse UI, open a dataset whose **name** is a key in `registry.json`. Today that is `harness-memory-ablation/v1`. Custom Experiment URL: `https://<tunnel-host>/langfuse/experiment`. Turn on request signing and paste `LANGFUSE_WEBHOOK_SECRET`.
5. Default payload, edited in the UI before Run:

   ```json
   {
     "memoryOff": "/absolute/path/worktree-off",
     "memoryOn": "/absolute/path/worktree-on",
     "samples": 1,
     "repeats": 1,
     "judge": "skip",
     "client": "codex"
   }
   ```

   Both directories must already exist. The runner does not clone or reset them. `samples: 1` avoids a full 30-item agent run.
6. Click Run. Langfuse should see HTTP 202 within its own timeout. This process logs `accepted runId=...`.
7. Confirm a file `packages/evaluation/reports/<stamp>-<run>-experiment-webhook-ok.md` or `...-failed.md`, and a new experiment on that dataset in Langfuse. Failure and timeout also post `run_ok=0`.

Re-check credentials and item counts without sending a trigger:

```bash
cd packages/services/experiment-webhook
PYTHONPATH=. python3 scripts/real_custom_experiment.py
```

That script exits 2 when the Langfuse env or health check fails. It does not register a webhook URL and it does not start a tunnel.
