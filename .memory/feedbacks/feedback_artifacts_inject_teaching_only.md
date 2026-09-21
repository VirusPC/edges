---
name: feedback_artifacts_inject_teaching_only
description: 改 setup-nginx / inject_nginx_include.py 或盒上 teach.conf 仍是 /teach/ 时打开：注入脚本只匹配 /teaching/；不要双认 /teach/；先跑 migrate-teach-nginx-prefix.py 再 edges artifacts server setup-nginx。
metadata:
  edges-title: artifacts inject 只认 /teaching/，遗留 /teach/ 先迁 teach.conf
  edges-type: feedback
  edges-origin-session-id: bc-1ae9c0b8-1474-512c-94c9-7b5370276f1f
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T01:54:29+00:00"
---

`edges artifacts server setup-nginx` 的注入脚本只认 server 块里的 `/teaching/`。盒上若还是遗留 `location /teach/`，先把 teach nginx 迁到 `/teaching/`（location、`/` 跳转、旧 `/teach/` 跳转），不要改 injector 去双认 `/teach/`。
**Why:** 2026-09-21 用户纠正：这台 ECS 必须只用 `/teaching/`。生产 `teach.conf` 仍是 `/teach/` 是要修的配置债，不是第二条合法前缀。双认会把错误路径固化。用户所述。
**How to apply:** 保持 `inject_nginx_include.py` 只匹配 `/teaching/`。若 inject 报没有含 `/teaching/` 的 server，跑 `extensions/services/artifacts-preview/deploy/migrate-teach-nginx-prefix.py`，再 `nginx -t && systemctl reload nginx`，然后 `edges artifacts server setup-nginx`。公开入口仍是这条 CLI，不要发明用户面 apply.sh。
