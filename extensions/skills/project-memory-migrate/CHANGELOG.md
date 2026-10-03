# Changelog

All notable changes to this skill will be documented in this file.
The format follows Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [1.0.0] - 2026-10-03

### Added

- 用 `migrate.py --target-dir [--root-dir] [--recursive] [--dry-run]` 一次性转换旧布局，预检冲突、保留字节与权限、更新索引和 owned 链接，支持嵌套 owner 随父目录移动。
- 私有忽略先于复制；恢复日志限制权限，验证后才删除旧真源，重跑拒绝覆盖后续编辑。Git 升级后的私有残留可单独迁入合法新布局。
- 来源不可用与官方索引缺失明确返回不完整诊断，保留采用关系；自定义缺失权限或新类型重名直接冲突。
