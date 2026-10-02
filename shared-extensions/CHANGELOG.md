# Changelog

All notable changes to shared-extensions will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

本文件记 **shared-extensions 整层**变更。不按单个 skill / mcp / plugin / hook 拆 changelog。版本号以 [`VERSION`](VERSION) 为准，tag 为 `shared-extensions@<version>`。

仓库级变更见根 [`CHANGELOG.md`](../CHANGELOG.md)（`vX.Y.Z`）。Edges 对外 skill 见 [`extensions/skills/<name>/CHANGELOG.md`](../extensions/skills/)。

## [Unreleased]

## [1.1.0] - 2026-09-23

### Added

- `skills/linux-nas-direct-link`：Linux 主机用网线直连消费级 NAS（尤其绿联 UGOS）时的流程，含共享上网/NAT、专用用户 SMB 挂载、Tailscale（含 `tailscale0` 缺 IPv4）与 SSH 防锁。

## [1.0.0] - 2026-09-08

### Added

- 目录骨架：`skills/`、`mcp/`、`plugins/`、`hooks/`。
- 收录标准：不绑定 Edges 的跨机器 harness；与 `extensions/` 互斥。
- 整层一份 `VERSION`、本 changelog、tag `shared-extensions@<version>`。
- 本层项目记忆（`AGENTS.md` + `.memory/`）。

[Unreleased]: https://github.com/VirusPC/edges/compare/shared-extensions@1.1.0...HEAD
[1.1.0]: https://github.com/VirusPC/edges/compare/shared-extensions@1.0.0...shared-extensions@1.1.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/shared-extensions@1.0.0
