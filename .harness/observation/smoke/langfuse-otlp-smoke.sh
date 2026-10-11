#!/usr/bin/env bash
# Langfuse v4 OTLP 冒烟：发 1 条根 span，并按 traceId 回查。
# 需要环境变量：LANGFUSE_HOST LANGFUSE_PUBLIC_KEY LANGFUSE_SECRET_KEY（不要写进仓库）
set -euo pipefail
: "${LANGFUSE_HOST:?}" "${LANGFUSE_PUBLIC_KEY:?}" "${LANGFUSE_SECRET_KEY:?}"
TRACE=$(python3 -c "import secrets;print(secrets.token_hex(16))")
SPAN=$(python3 -c "import secrets;print(secrets.token_hex(8))")
T=$(python3 -c "import time;print(time.time_ns())"); T2=$((T+150000000))
AUTH=$(printf '%s:%s' "$LANGFUSE_PUBLIC_KEY" "$LANGFUSE_SECRET_KEY" | base64 | tr -d '\n')
BODY=$(cat <<JSON
{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"edges-langfuse-smoke"}}]},"scopeSpans":[{"scope":{"name":"edges-smoke"},"spans":[{"traceId":"$TRACE","spanId":"$SPAN","name":"edges-langfuse-smoke","kind":1,"startTimeUnixNano":"$T","endTimeUnixNano":"$T2","attributes":[{"key":"langfuse.trace.name","value":{"stringValue":"edges-langfuse-smoke"}}]}]}]}]}
JSON
)
curl -fsS -H "Authorization: Basic $AUTH" -H 'Content-Type: application/json' \
  -X POST "$LANGFUSE_HOST/api/public/otel/v1/traces" --data "$BODY" >/dev/null
echo "sent traceId=$TRACE"; sleep 8
curl -fsS -H "Authorization: Basic $AUTH" \
  "$LANGFUSE_HOST/api/public/v2/observations?traceId=$TRACE&limit=5" | grep -q "\"traceId\":\"$TRACE\"" \
  && echo "OK: trace landed" || { echo "FAIL: trace not found"; exit 1; }
