---
name: feedback_artifacts_server_install_not_start
description: 改 edges artifacts server 的 install/start、或想把装 unit 和拉起进程合成一步时打开：install 保证 env、装依赖/unit/enable，不 start；start/stop/restart 只做进程生命周期。
metadata:
  edges-title: artifacts server install 不启动进程
  edges-type: feedback
  edges-origin-session-id: bc-64f20364-5e66-5924-903e-9e45abedf3ff
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:36:18+00:00"
---

`edges artifacts server install` 确保 `~/.config/edges/artifacts-preview.env`（缺 token 就建，`--force` 可轮换），再装依赖、构建、安装并 enable user unit，返回 `started: false`，绝不 start/restart。拉起或重启进程用单独的 `start` / `restart`。
**Why:** 2026-09-20 用户纠正：不要把 install 和 start 合成一个 API。随后锁定：没有 `server init`，env 由 `install` 自己保证。pull 之后的工作流是先 install 再 restart，不是一条 install-and-start。
**How to apply:** 实现、测试、帮助和工作流都保持两条命令。断言 install 的 systemctl 调用里不能出现 start/restart/stop。包装脚本（`deploy/bootstrap.sh`、`deploy.yml`）必须先后调用 `install` 和 `restart`，且仅当盒上已有 server env 时才跑，避免挡住 teach。
