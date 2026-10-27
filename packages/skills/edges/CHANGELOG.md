# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-27

### Added

- **总入口：** 随包日常模块收进这一个 skill。正文是通用的 list / get / create / update / delete 形状；对不上这五个动词的差异写在 `references/`。
- **并入的说明：** compose、notes、routines、classifyTasks、memory init、用户记忆备份与恢复。旧目录删除，不留同名 skill。
- **记忆共享资源：** PROTOCOL、LAYOUT、模板、AGENTS 与维护记忆在 `references/memory/`，相对结构与原先 `edges-memory-init` 一致。

### Removed

- 不再单独发布 `edges-compose@0.3.0`、`edges-note@2.3.2`、`edges-routines@0.2.0`、`edges-tasks-classify@0.1.0`、`edges-memory-init@0.1.1`、`edges-memory-user-backup@0.1.0`、`edges-memory-user-restore@0.1.0`。这些 tag 留在当时的提交上。
