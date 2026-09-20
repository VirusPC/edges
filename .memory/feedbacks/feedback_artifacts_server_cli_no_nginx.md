---
name: feedback_artifacts_server_cli_no_nginx
description: 改 edges artifacts server 命令面、或想把 nginx 反代收进 CLI 时打开：只留 init / install / start|stop|restart / status。不要 nginx-snippet、nginx-setup、configure-proxy。nginx 是宿主机一次性 sudo 脚本。
metadata:
  edges-title: artifacts server CLI 不含 nginx 动词
  edges-type: feedback
  edges-origin-session-id: bc-03eab9e8-f0e7-5b5c-93d1-5b97661749f2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:28:04+00:00"
---

`edges artifacts server` 只服务进程生命周期：`init`、`install`、`start`/`stop`/`restart`、`status`。nginx 反代不进 CLI（不要 `nginx-snippet`、`nginx-setup`、`configure-proxy`）；材料留在 `deploy/nginx-artifacts.conf` 和一次性 `setup-nginx-artifacts.sh`。
**Why:** 2026-09-20 用户纠正：snippet 是实现物名字，不是用户意图；nginx reverse-proxy 是 host ops，和 init/install/start/stop/restart/status 不是同一条生命周期。用户明确不要发明 `configure-proxy`。
**How to apply:** 帮助文本、包装脚本和工作流只写那六个动词。要暴露 :80 时，文档指向人跑 `sudo bash …/deploy/setup-nginx-artifacts.sh`。`deploy/bootstrap.sh` 只包装 `install` 然后 `restart`。不要把 nginx include 内容打印成 CLI 子命令。
