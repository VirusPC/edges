# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-10-27

### Changed

- **目录迁移不再走技能：** 公开单文件转换改指仓库命令 `pnpm migrate:directory-nodes`。技能 `edges-migrate-directory-nodes` 已删除，不留别名。
- **用户记忆归档技能改名：** 模板里的换机与回注改为 `$edges-memory-user-backup` 与 `$edges-memory-user-restore`。

## [0.1.0] - 2026-10-27

### Changed

- **更名：** 自 `project-memory-init@5.0.0` 更名为 `edges-memory-init`。目录名与 `name` 一致。
- **版本线重启：** 从 `0.1.0` 重新计数，不沿用 `5.0.0`。旧 tag `skill/project-memory-init@*` 仍留在历史提交上。
