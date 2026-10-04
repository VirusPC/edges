---
name: user-memory-backup
description: 将指定作用域 .harness/memory/users 的本机私有记忆（含 AGENTS.md 索引及资产）打成归档。换机、删仓或留逃生副本时用；旧 .memory 先用 project-memory-migrate 转换。
version: 3.0.0
---

# User Memory Backup

用户记忆不在 Git 历史中，换机或删除克隆前可用此归档带走。目标是明确指定的作用域；默认归档落在该目录，不必为已明确或默认位置再次询问。

```bash
edges memory backup --repo-dir <作用域目录> [--output-dir <归档目录>]
```

命令打包 `.harness/memory/users/` 的普通文件，包括索引与资产，保留字节和文件权限。归档权限为 0600，写入前建立忽略规则；默认名称为 `user-memory-backup-<UTC时间戳>.tar.gz`。已有同名归档拒绝覆盖，遇到符号链接、硬链接或没有可打包的文件也停止。展开后的 tar 数据（包括头部、填充与元数据）上限为 256 MiB，文件成员最多 10,000 个，与恢复限制一致；超限时不保留不完整归档。

只支持新布局。出现 `conversion-required` 时先在对应旧项目运行 `$project-memory-migrate`，再备份。报告 JSON 的 archive 路径，不展示私有正文，不提交归档或用户记忆。恢复用 `$user-memory-restore`，两者应一起安装。
