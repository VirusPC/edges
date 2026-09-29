---
name: extensions_clis_extensions_cli
description: 目录实际是一套统一 edges 命令，复数名容易让人以为有多套 CLI。
metadata:
  edges-type: task
  edges-title: 把 extensions/clis 改名为 extensions/cli
  edges-tasks-status: backlog
  edges-task-project: edges-cli-platform
  edges-updated-at: "2026-09-29T14:59:14.465Z"
---

**背景：**
刚问过 edges CLI 现在落在哪；答完后用户说 clis 改成 cli 可能更合适。现状是仓里只有这一套多命令 CLI（edges note|tasks|artifacts），目录却用复数。
- 相关现状：代码与文档路径大量写 extensions/clis；pnpm filter 名是 edges-cli；安装后二进制仍是 edges
- 预期收益：目录名和「一套 CLI」心智一致，少踩错路径
- 非目标：不改二进制名 edges，不拆多套 CLI，不做功能改造
- 关联：任务记录员对话里关于 CLI 目录结构的问答（2026-09-29）

**目标：**
仓库路径与文档统一写成 extensions/cli，引用旧路径的地方一并改完且能正常构建调用。

**动作：**
- 目录改名 + 更新 README / AGENTS / .memory / pnpm workspace 等引用

**完成标准：**
（待 grill-with-docs 补）
