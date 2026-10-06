---
name: user-memory-restore
description: 将新布局 user-memory-backup 归档恢复到指定作用域的 .harness/memory/users。目标已占用时需明确授权 --force 整份替换；旧归档须先在隔离旧项目完成转换。
version: 3.0.0
---

# User Memory Restore

与 `user-memory-backup` 共用 Edges CLI 的归档路径与忽略规则校验。按用户提供的归档和目标执行：

```bash
edges memory restore --archive <归档路径> --repo-dir <作用域目录> [--force]
```

只写 `.harness/memory/users/`。路径穿越、绝对路径、重复成员、链接/设备成员、linked `.harness` 祖先都在覆盖前拒绝。归档以流式方式在受限临时目录中验证，最终副本在目标文件系统内准备完成后才替换；替换失败时回滚，若回滚也失败，保留受保护的恢复副本并报告路径。私有临时材料与目标的忽略规则在写入前验证；索引和正文保留归档字节与文件权限，不自动 init 或重写索引。

已有任何正文或资产（包括不符合 user_*.md 命名的文件）都视为占用；只有与 CLI 携带的当前空索引模板逐字节一致的 init 索引允许直接恢复；模板不可用、人工说明、未知元数据或其他编辑都按已占用处理。`--force` 会整份替换 users 子树，归档中没有的旧文件也删除，符号链接仅删链接本身。若用户尚未明确授权替换，说明将被替换的目标并确认；已有授权不重复询问。

支持 `.tar.gz` 和未压缩 `.tar`，不支持其他压缩格式或嵌套压缩。归档展开后的 tar 数据（含头部、填充与元数据）上限为 256 MiB，文件成员最多 10,000 个；超过限制会拒绝恢复，原有用户记忆保留。备份命令采用同样限制。进程被强制终止或断电不属于自动回滚范围；若目标缺失，保留作用域下 `.private-user-memory-*/previous`，先核对恢复副本，不要清理它。

旧 `.memory` 归档返回 `conversion-required`，不会静默写回旧路径。转换步骤：用对应旧版恢复工具在隔离的旧项目副本中恢复，运行 `$project-memory-migrate --target-dir <旧项目副本>`，再用新版 `$user-memory-backup` 生成归档。不要直接解压不受信任归档。

汇报恢复的路径，不展示私有正文，不提交回注数据或归档。
