---
name: feedback_artifacts_server_cli_no_nginx
description: 改 edges artifacts server 命令面时打开：公开面是 install（保证 env、不 start）/ start|stop|restart / status / setup-nginx。没有 server init。不要 nginx-snippet、nginx-setup、configure-proxy。
metadata:
  edges-title: artifacts server CLI 用 setup-nginx，不要 snippet / server init
  edges-type: feedback
  edges-origin-session-id: bc-64f20364-5e66-5924-903e-9e45abedf3ff
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:36:18+00:00"
---

`edges artifacts server` 的公开面是 `install`（确保 env：缺 token 就建，`--force` 可轮换；装依赖/unit/enable，不 start）、`start`/`stop`/`restart`、`status`、`setup-nginx`。没有 `server init`（客户端才是顶层 `edges artifacts init`）。不要 `nginx-snippet` / `nginx-setup` / `configure-proxy`，也不要把打印 snippet 当主路径。
**Why:** 2026-09-20 用户把此前「nginx 不是 CLI 动词 + 保留 server init」的纠正作废，指定本提示为唯一规格。`setup-nginx` 是一次性/可重入反代（`/health`、`POST /artifacts`、`/artifacts/…` → `127.0.0.1:8787`，不动 `/teaching/`）；需要 sudo 时升级或打印确切 `sudo bash …/setup-nginx-artifacts.sh`。
**How to apply:** 帮助、README、ops 笔记和工作流只写这五个动词。第一次：`install` → `start` → `setup-nginx` → `status`。pull 之后：env 在才 `install` 再 `restart`（或只 `restart`）；不要从 Action 调 `setup-nginx`。永远不要把 install 和 start 合成一步。
