---
name: feedback_artifacts_inject_teaching_only
description: 改 setup-nginx / inject_nginx_include.py 或盒上站点文件时打开：文件是 /etc/nginx/conf.d/teaching.conf（TEACHING_CONF）；前缀只认 /teaching/；线上已是这套（2026-09-21 核实）；不要把 leftover 当现行状态；migrate 是一次性清理，迁完只留一条 location = / → /teaching/。
metadata:
  edges-title: artifacts nginx 只认 teaching.conf 与 /teaching/
  edges-type: feedback
  edges-origin-session-id: bc-91723278-c5cc-58ae-aabd-f1dc32b7036e
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T02:44:47+00:00"
---

`edges artifacts server setup-nginx` 只写 `/etc/nginx/conf.d/teaching.conf`（`TEACHING_CONF`）里已经含 `/teaching/` 的 server 块。注入脚本不认旧文件名，也不认旧前缀。线上阿里云 ECS **已经是** `teaching.conf` + `/teaching/`（2026-09-21 核实），旧名已迁走，不要再写成「今天仍可能是 leftover」。
**Why:** 2026-09-21 用户最终命名：站点文件 `teaching.conf`、URL 前缀 `/teaching/`、仓库目录 `knowledge/teaching/`。同日稍后核实线上已经迁完，再把 leftover 当现行状态会让人去跑已经做过的 rename/migrate。双认旧名会把错误路径固化。用户所述 + 已核实。
**How to apply:** 脚本、CLI help、README 的现行路径只写 `teaching.conf` / `/teaching/`。`migrate-teaching-nginx-prefix.py` 是一次性遗留清理，不是日常步骤；迁完每个 teaching `server {}` 只留一条 `location = /` 跳到 `/teaching/`。注入仍只认 `/teaching/`。公开入口仍是这条 CLI，不要发明用户面 apply.sh。
