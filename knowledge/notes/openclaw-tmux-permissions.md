# OpenClaw + tmux 权限问题

> 日期: 2025-02-08
> 来源: Feishu 对话中测试 peekaboo 截图
> 状态: 待修复

## 问题描述

OpenClaw 运行在 **tmux session** 中时，peekaboo 等需要系统权限的工具无法正常工作。

## 根本原因

macOS 隐私权限（屏幕录制、辅助功能）是授予**应用级别**的：

| 运行环境 | 权限授予对象 |
|---------|-------------|
| 普通 Terminal | Terminal.app ✅ |
| tmux 中的进程 | tmux（需要单独授权）❌ |

实际检测：
```bash
$ echo "当前终端: $TERM_PROGRAM"
当前终端: tmux

$ peekaboo permissions
Screen Recording: Not Granted  ❌
Accessibility: Not Granted     ❌
```

即使 Terminal.app 已有权限，tmux 中的 OpenClaw 也无法继承。

## 解决方案

### 方案 1: 给 tmux 授权（推荐保留 tmux）

1. 系统设置 → 隐私与安全 → **屏幕录制**
2. 点击 **+**，按 `Cmd + Shift + G`
3. 输入: `/opt/homebrew/bin/tmux`
4. 同样给 **辅助功能** 权限

### 方案 2: 退出 tmux（简单但失去 tmux 优势）

```bash
# 退出 tmux
tmux kill-session -t openclaw

# 在普通 Terminal 启动
openclaw gateway
```

## 影响范围

需要系统权限的 skills：
- **peekaboo** - 屏幕录制、辅助功能
- **bird** - 浏览器 cookie 读取（部分情况）
- **apple-notes** - 辅助功能
- **apple-reminders** - 提醒事项权限

## 建议

长期使用建议**方案 1**：给 tmux 授权，保留 tmux 的会话管理优势。

## 标签

#openclaw #tmux #macos #permissions #peekaboo #todo
