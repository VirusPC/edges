---
name: edges_cli_command
description: 拆开装 nginx 结果里两个都叫 command 的字段，让 pnpm --filter edges-cli build 通过。
metadata:
  edges-type: task
  edges-title: 跑通 edges-cli 完整编译（修好 command 字段撞车）
  edges-tasks-status: backlog
  edges-task-project: edges-cli-platform
  edges-updated-at: "2026-09-29T17:42:44.195Z"
---

**背景：**
目录改成 extensions/cli 后，完整编译失败：装 nginx 拼返回结果时，同一个对象里两个字段都叫 command（子命令名 vs 给用户看的 sudo 命令）。平时 tsx/测试没事；包不发 npm。非目标：发 npm、改二进制名 edges；类型检查脚本与「为何保留 build」的长说明可另说，本卡不做。

**目标：**
完整编译能通过。

**动作：**
把两个 command 改成不同名字，相关测试跟着改。

**完成标准：**
- [ ] pnpm --filter edges-cli build 通过
- [ ] 装 nginx 成功结果里两种含义不再共用同一个字段名
