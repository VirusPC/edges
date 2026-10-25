---
name: feedback_artifacts_server_install_not_start
description: >-
  改 edges artifacts server 的 install/start、或想把装 unit 和拉起进程合成一步时打开：install 在已有
  ~/.config/edges/edges.env 上保证 token、装依赖/unit/enable，不 start；文件不在就报错并提示 edges
  config init，不读 artifacts-preview.env；start/stop/restart 只做进程生命周期。
metadata:
  edges-title: artifacts server install 不启动进程
  edges-type: feedback
  edges-origin-session-id: bc-64f20364-5e66-5924-903e-9e45abedf3ff
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-25T08:49:23+00:00'
---

`edges artifacts server install` 要求已经有 `~/.config/edges/edges.env`。文件不在就报错，并提示 `edges config init`。`edges config init` 只在新文件还不存在、旧的 `~/.config/edges/artifacts-preview.env` 还在时复制一次；复制之后任何 server 命令都不再读旧文件。`edges.env` 在时，缺 token 就写入，`--force` 可轮换，再装依赖、构建、安装并 enable user unit，返回 `started: false`，绝不 start/restart。拉起或重启进程用单独的 `start` / `restart`。
**Why:** 2026-09-20 用户纠正：不要把 install 和 start 合成一个 API。随后锁定：没有 `server init`。pull 之后的工作流是先 install 再 restart，不是一条 install-and-start。2026-10-25 评测服务 grill 把盒上配置收成 `~/.config/edges/edges.env`，并硬切旧的 `artifacts-preview.env`。install 仍不负责创建这份文件，避免静默继续读旧路径。
**How to apply:** 实现、测试、帮助和工作流都保持两条命令。断言 install 的 systemctl 调用里不能出现 start/restart/stop。包装脚本（`deploy/bootstrap.sh`、`deploy.yml`）必须先后调用 `install` 和 `restart`，且仅当盒上已有 `edges.env` 且 token 可用时才跑，避免挡住 teach。旧文件还在、新文件不在时，跳过并提示 `edges config init`，不要把旧文件当配置读进来。
