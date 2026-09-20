---
name: feedback_artifacts_server_install_not_start
description: 改 edges artifacts server 的 install/start、或想把装 unit 和拉起进程合成一步时打开：install 只装依赖/unit/enable，不 start；start/stop/restart 只做进程生命周期。
metadata:
  edges-title: artifacts server install 不启动进程
  edges-type: feedback
  edges-origin-session-id: bc-03eab9e8-f0e7-5b5c-93d1-5b97661749f2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T17:28:04+00:00"
---

`edges artifacts server install` 只做依赖、构建、安装并 enable user unit，返回 `started: false`，绝不 start/restart。拉起或重启进程用单独的 `start` / `restart`。
**Why:** 2026-09-20 用户纠正：不要把 install 和 start 合成一个 API。init 只写配置；install 是装好但不跑；lifecycle 动词才碰进程。pull 之后的工作流是先 install 再 restart，不是一条 install-and-start。
**How to apply:** 实现、测试、帮助和工作流都保持两条命令。断言 install 的 systemctl 调用里不能出现 start/restart/stop。包装脚本（`deploy/bootstrap.sh`、`deploy-teach.yml`）必须先后调用 `install` 和 `restart`，不要在包装层自己 `systemctl --user restart`。
