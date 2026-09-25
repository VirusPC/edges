---
name: minigtr_codex_cli_remote_control
description: "在 minigtr（Ubuntu）上验证 Codex CLI remote-control：手机 ChatGPT 能否配对把该 Linux 当远程主机；产出行/不行/卡在哪。"
metadata:
  edges-type: task
  edges-title: minigtr 验证 Codex CLI remote-control（手机配对）
  edges-tasks-status: in_progress
  edges-task-project: agent-clients-ux
  edges-task-priority: medium
  edges-task-assignee: 通用-辅助-2
  edges-task-assignee-id: e783aa76-4d8c-4296-8080-7ed191474f70
  edges-updated-at: "2026-09-25T07:10:00.000Z"
---

解决的问题是：不确定 Codex CLI 的 remote-control（不是桌面 App Remote）在 Linux 上能否让手机 ChatGPT 配对。做成后要有一份可复用结论：行、不行、或卡在哪一步。

**背景：**
用户在「通用-辅助-2」对话里想验证：在 minigtr（当前 Ubuntu 24.04，已在 Grok Bot 注册）上，用 Codex CLI 的 remote-control（明确不是桌面 App Remote），能否用手机 ChatGPT 配对，把这台 Linux 当成远程主机。用户点名任务记录员按 conversation-to-tasks 登记；通用-辅助-2 正在本轮实测，本卡只负责看板落库，实测结果稍后回传写入卡或 sidecar log。
- 相关现状：目标机是 minigtr 的 Ubuntu 侧；验证范围限定 CLI remote-control + pair（或当前等价命令）。
- 预期收益：搞清 Linux 主机是否能走手机配对这条路，避免在未验证能力上浪费后续配置。
- 非目标：不验证桌面 App Remote；本卡不要求改 edges 代码；不把配对码、token 明文写进公开仓。
- 关联：登记请求来自助手「通用-辅助-2」（id e783aa76-4d8c-4296-8080-7ed191474f70）；设备侧也可对照「minigtr设备助手」。

**目标：**
在 minigtr 上安装或确认 Codex CLI，跑通 `codex remote-control start` 与 `pair`（或当前等价命令），记下能否生成手机可用的配对码、手机端是否认得到，并产出可复用结论（行 / 不行 / 卡在哪）。

**完成标准：**
- [ ] 本卡已写入 VirusPC/edges `knowledge/tasks`（本文件即满足登记项）
- [ ] 实测结论写清：CLI 版本、实际命令、配对码是否产出、手机配对成功或失败错误（脱敏：不写完整配对码/token）
- [ ] 若失败：记下具体报错，并写可行替代（例如 Mac 桌面 Remote + SSH，或切 Windows 侧）

**动作：**
- 通用-辅助-2 在 minigtr 上安装/确认 Codex CLI 并跑 remote-control + pair
- 结论回传任务记录员后，更新本卡正文或 sidecar `.2026-09-25--minigtr-验证-Codex-CLI-remote-control.log.md`，必要时改状态为 done/blocked
