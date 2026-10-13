---
name: langfuse_public_https
description: >-
  自建 Langfuse 已通过 Cloudflare Tunnel 提供公网 HTTPS。仓库不写实例域名；仅 Tailscale 的旧决策已由 ADR
  0033 取代。
metadata:
  edges-type: task
  edges-title: Langfuse 公网 HTTPS 暴露（反代+证书）
  edges-tasks-status: done
  edges-task-project: observation
  edges-updated-at: '2026-10-11T09:26:50.210Z'
---

自建 Langfuse 的公网 HTTPS 已经接通：经 Cloudflare Tunnel 暴露。仓库不写实例域名。

**背景：**
2026-09-20 从「自部署 Langfuse」拆出这张后续卡。当时 v1 访问面记成只走 Tailscale（ADR 0017），因为用户设备不会一直开着 Tailscale。2026-10-11 核实：实例已在 minigtr 的 Docker 上，经 Cloudflare Tunnel 提供公网 HTTPS，`/api/public/health` 返回 OK。落地方式是 Tunnel，不是在仓库里记录自管反代或证书材料。
- 父卡「自部署 Langfuse」已按 ADR 0020 完成 v1 验收。
- ADR 0017 已由 ADR 0033 取代。
- 非目标：不写实例域名、Cloudflare 账号、Tailscale 地址或 100.x。密钥仍只留 minigtr 磁盘（ADR 0018）。

**目标：**
没有 Tailscale 的设备也能用公网 HTTPS 访问自建 Langfuse。

**完成标准：**
- [x] 公网 HTTPS 可访问，健康检查返回 OK（2026-10-11，v4.38.0）。
- [x] 方式记为 Cloudflare Tunnel；仓库不收录域名与账号细节。
