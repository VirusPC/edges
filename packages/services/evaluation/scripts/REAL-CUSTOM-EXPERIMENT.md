# Real Custom Experiment

On 2026-10-25 the live `experiment-webhook` process took a signed Custom Experiment POST through a Cloudflare quick tunnel and wrote the run back to self-hosted Langfuse. Langfuse itself did not send that POST: saving the dataset remote URL needs a UI session, and the credentials in this environment are project API keys.

That signed POST, checked against the dataset and experiment APIs, is the acceptance for this PR. The UI click is deferred to a CLI/ops card. Decision 12 in `../DECISIONS.md` records that.

Do not put API keys, the webhook secret, the Langfuse hostname, project or dataset ids, or the quick-tunnel hostname in the repo. Quick-tunnel hostnames are ephemeral.

## What Langfuse returned when asked to store the URL

User-Agent on every call was `edges-observation/1`.

| Call | Result |
|---|---|
| `PATCH`, `PUT`, and `POST /api/public/v2/datasets/{name}` with `remoteExperimentUrl` | 405 |
| `PATCH /api/public/datasets/{name}` with the same body | 405 |
| `GET /api/public/v2/datasets/edges-experiment-webhook-smoke` | 200, no remote-experiment field |
| `POST /api/trpc/datasets.upsertRemoteExperiment` | 401 with Basic project keys, 401 with `Bearer` secret key |
| `POST /api/trpc/datasets.getRemoteExperiment` | 401 on both of those auths |
| `POST /api/trpc/datasets.triggerRemoteExperiment` | 401 on both of those auths |

`DELETE` of a dataset also returned 405 on this instance. An empty dataset `edges-experiment-webhook-smoke-b` from an earlier create probe is still there. Remove it in the UI if you do not want it.

## What the signed POST verified

Temporary registry `/tmp/edges-experiment-webhook-registry.json` mapped `edges-experiment-webhook-smoke` to `experiment_webhook.runners.harness_memory_ablation`. The shipped `registry.json` still maps only `harness-memory-ablation/v1`. The smoke dataset has one connectivity item, so this run did not load the 30 ablation cases.

Payload was `{"samples":1,"repeats":1,"judge":"skip","client":"codex"}`. `memoryOff` and `memoryOn` were left out so the adapter would stop before the model client. That client waits up to 600 seconds.

Observed:

- Tunnel `GET /health` returned `{"ok": true}`.
- `POST /langfuse/experiment` returned HTTP 202 `{"accepted": true, "runId": "18c1bca1-5a62-4b8e-9456-fdd5a50037ec"}`.
- The process log then recorded `error=invalid_payload detail=memoryOff must be a directory path langfuse=sent`.
- Local report `2026-10-25-072157-18c1bca1-experiment-webhook-failed.json` under `EXPERIMENT_WEBHOOK_REPORTS_DIR` (`/tmp/edges-experiment-webhook-reports` for this run, so it stayed out of `packages/evaluation/reports/`). `status` failed, `langfuse` sent.
- `GET /api/public/experiments?fromStartTime=2026-10-25T07:20:00Z` lists that run id, name `edges-experiment-webhook-smoke 18c1bca1`, `itemCount` 1, `startTime` `2026-10-25T07:21:58.416Z`, and the smoke dataset id. `itemCount` 1 is the failure writeback: a failed run with no returned items posts one synthetic span. The error is `invalid_payload`, which is after the dataset fetch. A fetch failure would have been `dataset_fetch_failed`.

Earlier the same credentials already read `harness-memory-ablation/v1` (30 items) and created experiment `edges-experiment-webhook-smoke-scores` through this service's client.

## Commands that worked

`cloudflared` 2026.10.3. `$HOME/.local/bin` was not on `PATH`.

```bash
mkdir -p "$HOME/.local/bin"
curl -fsSL -o "$HOME/.local/bin/cloudflared" \
  https://github.com/cloudflare/cloudflared/releases/download/2026.10.3/cloudflared-linux-amd64
chmod +x "$HOME/.local/bin/cloudflared"
"$HOME/.local/bin/cloudflared" --version
# cloudflared version 2026.10.3 (built 2026-10-21-13:11 UTC)
```

Secrets went in a mode `0600` env file and were sourced by the shell. They were not placed on `python` or `cloudflared` argv.

```bash
umask 077
cat > /tmp/edges-experiment-webhook.env << 'EOF'
LANGFUSE_BASE_URL=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
LANGFUSE_WEBHOOK_SECRET=...
EXPERIMENT_WEBHOOK_REGISTRY=/tmp/edges-experiment-webhook-registry.json
EXPERIMENT_WEBHOOK_REPORTS_DIR=/tmp/edges-experiment-webhook-reports
EXPERIMENT_WEBHOOK_HOST=127.0.0.1
EXPERIMENT_WEBHOOK_PORT=8791
EOF
chmod 600 /tmp/edges-experiment-webhook.env

cat > /tmp/edges-experiment-webhook-registry.json << 'EOF'
{"edges-experiment-webhook-smoke": "experiment_webhook.runners.harness_memory_ablation"}
EOF
mkdir -p /tmp/edges-experiment-webhook-reports
```

Server, from `packages/services/evaluation` (`edges evaluation server start --dev`). The log line was `listening host=127.0.0.1 port=8791 signature=True`.

```bash
cd packages/services/evaluation
set -a
source /tmp/edges-experiment-webhook.env
set +a
export PYTHONPATH="$PWD"
exec python3 -m experiment_webhook
```

Tunnel. The ICMP proxy warning (GID outside `ping_group_range`) did not block HTTPS.

```bash
"$HOME/.local/bin/cloudflared" tunnel --url http://127.0.0.1:8791 \
  --no-autoupdate --logfile /tmp/cloudflared-live.log --loglevel info
```

This environment's resolver returned no address for `*.trycloudflare.com`. `dig @1.1.1.1` did. Health check that returned `{"ok": true}`:

```bash
TUNNEL_HOST=<hostname printed by cloudflared>
TUNNEL_IP=$(dig +short "$TUNNEL_HOST" A @1.1.1.1 | head -n 1)
curl --resolve "${TUNNEL_HOST}:443:${TUNNEL_IP}" \
  -A edges-observation/1 -fsS "https://${TUNNEL_HOST}/health"
```

Official body, compact JSON, no trailing newline. Ids come from the public API. The signature covers those exact bytes (`timestamp + "." + raw body`).

```bash
python3 - << 'PY'
import base64, json, os, urllib.parse, urllib.request
from pathlib import Path

host = os.environ["LANGFUSE_BASE_URL"].rstrip("/")
token = base64.b64encode(
    f"{os.environ['LANGFUSE_PUBLIC_KEY']}:{os.environ['LANGFUSE_SECRET_KEY']}".encode()
).decode()

def get(path):
    request = urllib.request.Request(
        host + path,
        headers={
            "Authorization": f"Basic {token}",
            "Accept": "application/json",
            "User-Agent": "edges-observation/1",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())

name = "edges-experiment-webhook-smoke"
project_id = get("/api/public/projects")["data"][0]["id"]
dataset_id = get("/api/public/v2/datasets/" + urllib.parse.quote(name, safe=""))["id"]
body = {
    "projectId": project_id,
    "datasetId": dataset_id,
    "datasetName": name,
    "payload": {"samples": 1, "repeats": 1, "judge": "skip", "client": "codex"},
}
raw = json.dumps(body, separators=(",", ":")).encode()
Path("/tmp/edges-experiment-webhook-body.json").write_bytes(raw)
PY

TS=$(date +%s)
export TS
python3 - << 'PY'
import hashlib, hmac, os
from pathlib import Path

raw = Path("/tmp/edges-experiment-webhook-body.json").read_bytes()
ts = os.environ["TS"]
digest = hmac.new(
    os.environ["LANGFUSE_WEBHOOK_SECRET"].encode(),
    ts.encode() + b"." + raw,
    hashlib.sha256,
).hexdigest()
Path("/tmp/edges-experiment-webhook-sig").write_text(f"t={ts},v1={digest}")
PY

curl --resolve "${TUNNEL_HOST}:443:${TUNNEL_IP}" \
  -A edges-observation/1 \
  -D - \
  -o /tmp/edges-experiment-webhook-response.json \
  -X POST "https://${TUNNEL_HOST}/langfuse/experiment" \
  -H "content-type: application/json" \
  -H "x-langfuse-signature: $(cat /tmp/edges-experiment-webhook-sig)" \
  --data-binary @/tmp/edges-experiment-webhook-body.json
```

That POST returned 202 and run id `18c1bca1-5a62-4b8e-9456-fdd5a50037ec`.

Confirm the experiment row (Basic auth, same User-Agent):

```bash
curl -A edges-observation/1 -u "$LANGFUSE_PUBLIC_KEY:$LANGFUSE_SECRET_KEY" \
  "$LANGFUSE_BASE_URL/api/public/experiments?fromStartTime=2026-10-25T07:20:00Z"
```

## UI click, when a session exists

1. Leave `EXPERIMENT_WEBHOOK_SIGNATURE` unset.
2. Start the server with the shipped registry and a reports directory you mean to keep.
3. Open a dataset whose name is a key in `registry.json`. Today that is `harness-memory-ablation/v1`.
4. Custom Experiment URL: `https://<tunnel-host>/langfuse/experiment`. Turn on request signing and paste `LANGFUSE_WEBHOOK_SECRET`.
5. Payload before Run. Both directories must already exist. The runner does not clone or reset them. `samples: 1` keeps the agent run to one item.

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

6. Click Run. This process logs `accepted runId=...` and returns 202. Then look for `packages/evaluation/reports/<stamp>-<run>-experiment-webhook-ok.md` or `...-failed.md`, and for the experiment in Langfuse.

Re-check credentials and item counts without sending a trigger:

```bash
cd packages/services/evaluation
PYTHONPATH=. python3 scripts/real_custom_experiment.py
```

The script exits 2 when the Langfuse env or health check fails. It does not register a webhook URL and it does not start a tunnel.
