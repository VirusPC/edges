---
name: feedback_artifacts_inject_teaching_only
description: 改 setup-nginx / inject_nginx_include.py 或盒上站点文件时打开：文件是 /etc/nginx/conf.d/teaching.conf（TEACHING_CONF）；前缀只认 /teaching/；不要双认 teach.conf 或 /teach/；遗留先改名再 migrate-teaching-nginx-prefix.py，然后 edges artifacts server setup-nginx。
metadata:
  edges-title: artifacts nginx 只认 teaching.conf 与 /teaching/
  edges-type: feedback
  edges-origin-session-id: bc-1ae9c0b8-1474-512c-94c9-7b5370276f1f
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T01:58:08+00:00"
---

`edges artifacts server setup-nginx` 只写 `/etc/nginx/conf.d/teaching.conf`（`TEACHING_CONF`）里已经含 `/teaching/` 的 server 块。注入脚本不认 `teach.conf`，也不认 `/teach/`。
**Why:** 2026-09-21 用户最终命名：站点文件 `teaching.conf`、URL 前缀 `/teaching/`、仓库目录 `knowledge/teaching/`。生产今天仍是遗留 `teach.conf` + `/teach/`，那是要迁走的配置债，不是第二条合法名字。双认会把错误路径固化。用户所述。
**How to apply:** 脚本、CLI help、README 的现行路径只写 `teaching.conf` / `/teaching/`。盒上若还是旧文件：先 `mv` 成 `teaching.conf`，再跑 `deploy/migrate-teaching-nginx-prefix.py`，然后 `edges artifacts server setup-nginx`。公开入口仍是这条 CLI，不要发明用户面 apply.sh。
