---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-13T02:15:53.878Z'
  edges-title: 为 Edges server 提供官方 OCI 镜像，方便开源使用者自行部署
  edges-tasks-status: backlog
  edges-task-priority: none
name: edges_server_official_oci_image
description: >-
  开源使用者不应再照搬作者的 ECS、systemd 和 nginx 约定。用官方镜像和 compose，填环境变量即可启动 artifacts /
  evaluation 服务。
---
**背景：**
2026-11-13 peng cheng 先问 Edges 要不要把 CI/CD 打成 Docker 镜像。澄清是 server 端后，先判断：自己那台 ECS 上现有的 `edges artifacts server` / `edges evaluation server`（CLI 启 systemd、主机 nginx 反代）不必改成镜像。被问到什么时候该用 Docker 时，标准是运行环境开始复制或失控。随后他明确：服务要给外面的人用，因为它是开源项目。结论是镜像作为对外发行方式，自己的 ECS 可继续走现有 CLI；两边共用同一份服务代码，CI 在打 tag 或合入 main 时构建并推到 ghcr.io。他要求把这件事记成任务。
- 现状：artifacts 与 evaluation 服务封装在 CLI 里，`deploy.yml` 在 ECS 上 git pull、本机构建，再 `install` / `restart`；配置在 `~/.config/edges/edges.env`，前面走主机 nginx。
- 关联：同项目 backlog「artifacts 预览服务随 npm 包发布，不再绑定作者服务器」（2026-10-19，结论是服务打进 npm，部署方式不跟着打包）。本卡不替代那张卡，补的是开源项目的容器发行面。
- 非目标：不把教学站、主机 nginx、整仓 checkout 打进镜像；不要求把现有 ECS 部署改成容器。

**目标：**
开源使用者不用复制作者的 ECS、Node 和 systemd 环境，用官方 OCI 镜像和 compose，填好环境和数据卷就能启动 artifacts / evaluation 服务。

**动作：**
- CI 构建只包含 Node 服务本身的 OCI 镜像（artifacts / evaluation），推到 ghcr.io。
- 提供 docker compose（或 podman-compose）和最小环境变量模板；配置与数据用卷挂载，反向代理留给使用者自己的 nginx 或 Caddy。
- 文档写清「复制 compose、填 env、启动」；说明作者自己的 ECS 仍可用现有 CLI 路径。

**完成标准：**
- [ ] 仓库提供官方镜像构建与推送（合入 main 或打 tag 时推到 ghcr.io）
- [ ] 镜像内只有 artifacts / evaluation 的 Node 服务，不含教学站、主机 nginx 或整仓 checkout
- [ ] 提供 compose 和 env 模板，配置与数据通过卷挂载
- [ ] 按文档用 compose 能在没有本仓库完整开发环境的机器上启动服务
- [ ] 现有 ECS 的 CLI + systemd + 主机 nginx 路径保持可用
