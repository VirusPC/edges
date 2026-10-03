---
name: user-memory-restore
description: 将新布局 user-memory-backup 归档恢复到指定作用域的 .harness/memory/users。目标已占用时需明确授权 --force 整份替换；旧归档须先在隔离旧项目完成转换。
version: 2.0.0
---

# User Memory Restore

与同级 `user-memory-backup` 一起安装，脚本共用归档路径与忽略规则校验。按用户提供的归档和目标执行：

```bash
python3 <skill-dir>/scripts/restore.py --archive <归档路径> --repo-dir <作用域目录> [--force]
```

只写 `.harness/memory/users/`。路径穿越、绝对路径、重复成员、链接/设备成员、linked `.harness` 祖先都在覆盖前拒绝。完整归档先在权限受限的临时目录中读取验证，建立目标忽略规则后才写入；索引和正文保留归档字节与文件权限，不自动 init 或重写索引。

已有任何正文或资产（包括不符合 user_*.md 命名的文件）都视为占用；空的 init 索引允许直接恢复。`--force` 会整份替换 users 子树，归档中没有的旧文件也删除，符号链接仅删链接本身。若用户尚未明确授权替换，说明将被替换的目标并确认；已有授权不重复询问。

旧 `.memory` 归档返回 `conversion-required`，不会静默写回旧路径。转换步骤：用对应旧版恢复工具在隔离的旧项目副本中恢复，运行 `$project-memory-migrate --target-dir <旧项目副本>`，再用新版 `$user-memory-backup` 生成归档。不要直接解压不受信任归档。

汇报恢复的路径，不展示私有正文，不提交回注数据或归档。
