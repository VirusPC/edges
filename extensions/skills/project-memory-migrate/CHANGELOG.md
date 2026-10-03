# Changelog

All notable changes to this skill will be documented in this file.
The format follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [1.0.2] - 2026-10-03

### Fixed

- 自定义类型默认保留 memory 归属与原目录；独立保留显式 module 和 format，官方目标路径冲突在复制前拒绝。
- 首次复制前收紧已有私有目录，保留祖先提供的限制及更严格目标权限；恢复校验源与目标目录权限，拒绝覆盖后续 chmod。

## [1.0.1] - 2026-10-03

### Fixed

- 修复反引号格式链接标签的迁移；真实行内代码与 fenced 示例仍保留原文。

## [1.0.0] - 2026-10-03

### Fixed

- 受管 Skill 资产完整遍历 dependency 命名目录，嵌套 Git 内容在预检拒绝；所有目标官方类型路径与模块组合先按新运行时纯契约校验，冲突不写忽略规则、日志或目标文件。

### Added

- 用 `migrate.py --target-dir [--root-dir] [--recursive] [--dry-run]` 一次性转换旧布局，预检冲突、保留字节与权限、更新索引和 owned 链接，支持嵌套 owner 随父目录移动。
- 私有忽略先于复制；恢复日志限制权限，验证后才删除旧真源，重跑拒绝覆盖后续编辑。Git 升级后的私有残留可单独迁入合法新布局。
- 来源不可用与官方索引缺失明确返回不完整诊断，保留采用关系；自定义缺失权限或新类型重名直接冲突。
