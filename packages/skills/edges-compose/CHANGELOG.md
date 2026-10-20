# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 底层改用 git submodule：默认目录从 `~/.edges/composed/<name>` 改为仓内 `.harness/compose/<name>`，`AGENTS.md` 只写相对路径，`--path` 只收相对路径。写清 `register` / `clone` / `pull` / `push` 各自跑的 git 命令、detached HEAD 时怎么推送、不递归，以及未初始化提示与旧条目的迁移提示。

- 说明 `clone` / `pull` / `push` 的逐条失败处理：失败条目记为 `action: "failed"` 并在 stderr 打 warning，其余条目继续；部分成功时退出码仍是 0，要检查 `entries`。

## [0.1.0] - 2026-10-19

### Added

- 新增 beta 引导：用 `edges compose` 把外部 harness 仓库挂到当前 scope。`register` 必须带 `--description`，写清这个仓存什么、什么时候该写进去。常见流程是 register、clone、list；pull、push、unregister 可选。git 鉴权由用户在自己的终端完成，AI 不经手 token。
