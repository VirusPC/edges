# macOS 终端权限共享机制

> 日期: 2025-02-08
> 来源: 实际测试 apple-reminders skill

## 核心洞察

macOS 的隐私权限（辅助功能、提醒事项、日历等）是授予 **Terminal 应用本身**，而不是单个 CLI 工具。

这意味着：**授权一个工具 = 授权该终端运行的所有工具**

## 实际案例

在测试提醒事项功能时：
1. 运行 `remindctl authorize` 授予权限
2. 之后使用 AppleScript (`osascript`) 也能直接访问提醒事项
3. 无需再次授权，两者共享同一个 Terminal 权限

## 实践意义

| 场景 | 结果 |
|------|------|
| `remindctl authorize` 成功 | AppleScript 也能访问提醒事项 |
| Terminal 有辅助功能权限 | 所有脚本都能控制 GUI 应用 |

## 决策指导

- **授权时**：确认授权的是当前使用的终端（Terminal.app vs iTerm）
- **排查问题时**：如果权限不生效，检查是否授权了正确的终端
- **路径**：系统设置 → 隐私与安全性 → [具体权限类别]

## 相关工具

- `remindctl` - Apple Reminders CLI
- `osascript` - AppleScript 执行器
- 任何需要访问系统隐私数据的 CLI 工具

## 标签

#macOS #permissions #terminal #cli #applescript #automation
