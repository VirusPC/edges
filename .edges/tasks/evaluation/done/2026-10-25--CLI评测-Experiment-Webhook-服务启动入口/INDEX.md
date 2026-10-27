---
metadata:
  edges-type: task
  edges-task-project: evaluation
  edges-updated-at: '2026-10-25T11:49:51.037Z'
  edges-title: CLI：edges evaluation server 启动入口
  edges-tasks-status: done
  edges-task-priority: none
name: cli_evaluation_server_启动入口
description: edges evaluation server 拉起评测服务；统一 edges.env；包迁入 evaluation 模块；脑仓 ops 同批改指 CLI。
---

**背景：**
评测能力拆成 Skill→Dataset 与 实验程序+Webhook→跑实验 后，还缺接入方的启动面。grill 后定下：CLI 命令挂在 evaluation 模块（`edges evaluation server …`），服务包从 `packages/services/experiment-webhook/` 迁入 evaluation 对应目录；统一本机配置 `~/.config/edges/edges.env`（前缀分区），不再兼容旧 `artifacts-preview.env`；脑仓 ops 同批改指 CLI，从 workspace 根开活并分别开 PR。
- 非目标：不重做 Webhook 业务逻辑本身、不做 Dataset 收集 skill（见兄弟卡）；隧道/域名仍用户侧。
- 关联：母卡 `2026-10-25--框架附带可接入评测能力含-Experiment-Webhook-适配层`；兄弟卡「评测实验程序+Webhook」「评测 Skill→Dataset」；框架 #35；脑仓 #379。

**目标：**
接入方用 `edges evaluation server` 与统一 `edges.env` 即可在本机/部署机拉起评测服务（含 Experiment Webhook），不必手写 systemd 命令或沿用脑仓 python -m 薄封装。

**动作：**
1. 将 `packages/services/experiment-webhook/` 迁入 evaluation 模块（如 `packages/services/evaluation/`），对外只保留 evaluation 一个 server 面；更新包名、README、registry 引用与 CHANGELOG。
2. CLI：`edges evaluation server install|start|restart|status|stop`；`start --dev` 前台阻塞，默认走 user systemd（对标 artifacts server 心智）。
3. 统一配置：`~/.config/edges/edges.env` + 前缀分区（`EXPERIMENT_WEBHOOK_*` / `LANGFUSE_*` / `ARTIFACTS_*` 等）；`edges config init|path|show`（show 脱敏）。硬切：不再读取 `~/.config/edges/artifacts-preview.env`，缺新文件则报错并提示迁。
4. 脑仓 `projects/services/langfuse-experiment-webhook/ops` 改指 `edges evaluation server …`（ExecStart/文档）；去掉对 `python -m langfuse_experiment_webhook` 的依赖说明。从 VirusPC/edges-workspace-viruspc 根开活，框架仓 / 脑仓 / workspace 指针分别开 PR。
5. 验收路径：`--dev` 起服务 → `GET /health` → 伪造签名 POST；install/start 能装上 unit。

**完成标准：**
- [x] `packages/services/experiment-webhook/` 已迁入 evaluation 模块目录，旧路径不再作为对外入口
- [x] `edges evaluation server start --dev` 可前台拉起；默认 `start` 走 systemd unit
- [x] 默认读 `~/.config/edges/edges.env`；`edges config init|path|show` 可用；旧 `artifacts-preview.env` 被忽略并给出迁移动作提示
- [x] `--dev` 下 `/health` 与伪造签名 POST 有可复现测试或脚本记录
- [ ] 脑仓 ops 已改为 CLI 入口的 PR 已开；workspace 指针 bump PR 已开（或同批说明阻塞）
