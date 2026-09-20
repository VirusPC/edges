---
name: langfuse_public_https
description: v1 只走 Tailscale，用户设备不会一直开 Tailscale；需要公网 HTTPS 入口（反代+证书）才能随时访问自建 Langfuse。
metadata:
  edges-type: task
  edges-title: Langfuse 公网 HTTPS 暴露（反代+证书）
  edges-tasks-status: backlog
  edges-task-project: observation
  edges-updated-at: "2026-09-20T11:23:10.893Z"
---

结论（idea）：为自建 Langfuse 增加公网 HTTPS 暴露（反代+证书）。

**事实背景:**
- 父卡 in_progress：`knowledge/tasks/observation/in_progress/2026-09-20--自部署-Langfuse.md`（自部署 Langfuse）。
- minigtr设备助手 2026-09-20 要求拆后续，勿并进父卡当已完成。
- v1 决策：先只走 Tailscale。
- 用户设备不会一直开 Tailscale，因此需要后续公网入口。

**Why:**
v1 只走 Tailscale，用户设备不会一直开 Tailscale；没有公网 HTTPS 入口就无法随时访问自建 Langfuse。

**How to apply:**
- grill 反代选型、证书、鉴权/暴露面。
- 依赖父卡实例先落地；勿并进父卡当已完成。
- 未指派；派发默认 grill-with-docs。
