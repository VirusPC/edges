---
name: project-memory-migrate
description: 将明确指定作用域的旧 Project Memory .memory 一次性迁到 .harness/memory 和 .harness/skills；保留私有内容、技能资产、来源权限与稀疏子作用域。用于旧项目升级或 Git 升级后遗留的本机用户记忆，不迁业务目录。
version: 1.0.0
---

# Project Memory Migrate

新版 Project Memory 只读写 `.harness`；旧格式解析只在本 Skill 中。须与同级 `project-memory-init` 一起分发，脚本借用其新布局校验器。布局契约见 [LAYOUT](../project-memory-init/references/LAYOUT.md)。

明确目标作用域后直接运行；仓库要求 worktree 时先遵守仓规。`--recursive` 包含其下实际记忆层，不创建普通目录的作用域，不跨 Git 仓库或 submodule，不沿外部安装目录链接写入。

```bash
python3 <skill-dir>/scripts/migrate.py --target-dir <作用域> [--root-dir <记忆根>] [--recursive] [--dry-run]
```

不加 `--dry-run` 时，一次调用完成全范围预检、忽略规则、复制、校验和旧真源清理。`--dry-run` 只返回路径映射与诊断。`skills` → `skills/managed`、`agent_skills` → `skills/referenced`；普通类型进 `memory`，自定义 `format: skills` 类型进 `skills`。自定义类型保留身份、格式和显式 writable/gitignore 权限，缺失或冲突时停止，不猜权限。

- JSON 返回 `ok`、`status`、`complete`、`pathMap` 和 `diagnostics`，不包含正文。冲突中止时核对指出的源/目标，不能强制覆盖来消除问题。
- 来源缺失/不可读时保留 referenced 索引与采用关系，返回 `migrated-incomplete` 和 `complete: false`；恢复来源后用 doctor 检查/刷新。迁移重跑仍报告未恢复的来源。官方索引因 Git 忽略而缺失时仅按实际本地文件重建索引并明确诊断，不推断丢失正文。
- 已有合法新公共布局时，仅接受不冲突的旧私有残留；不会重置公共文件。不同的现有用户索引也是冲突，不猜合并。历史其他用途的 `.harness` 不接管。
- 忽略后的 `.project-memory-migration/` 保存恢复日志与原始字节，目录权限 0700、日志 0600。它属于本地私有恢复材料，不提交、不展示内容。中断后以相同参数重跑；源或目标后来有编辑时停止，保留两边供人判断。验证前不删除旧正文。
- 迁移带嵌套记忆层的本地 Skill 时使用 `--recursive`，子层随所属目录搬迁。所有 owned 相对链接按原始位置解析后重定位；只修复明确指向本次已迁本地内容的安装链接，原位技能正文保持字节不变。

本 Skill 不运行全局安装，不迁 Edges 的 tasks/teaching/evaluation 等业务目录，也不代替 user-memory-backup/restore 做归档恢复。完成时报告实际状态及未闭环诊断，不能把 `complete: false` 称为完整验证通过。
