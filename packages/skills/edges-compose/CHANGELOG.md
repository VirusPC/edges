# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- 子命令收成三个，名字对应 git submodule：`add`（取代 `register`）、`list`（多了 `initialized`）、`update`（取代 `clone` / `pull`，`--remote` 跟到远端最新）。`unregister`、`clone`、`pull`、`push` 删除，不留别名。去掉条目改为手删 `AGENTS.md` 那一行（需要时用户自己 `git submodule deinit` / `git rm`）；推送改在子模块里用原生 git。
- 底层改用 git submodule：默认目录从 `~/.edges/composed/<name>` 改为仓内 `.harness/compose/<name>`，`AGENTS.md` 只写相对路径，`--path` 只收相对路径。写清 detached HEAD 时怎么推送、不递归，以及未初始化提示与旧条目的迁移提示。
- 说明逐条失败处理（现在落在 `update` 上）：失败条目记为 `action: "failed"` 并在 stderr 打 warning，其余条目继续；部分成功时退出码仍是 0，要检查 `entries`。

## [0.1.0] - 2026-10-19

### Added

- 新增 beta 引导：用 `edges compose` 把外部 harness 仓库挂到当前 scope。`register` 必须带 `--description`，写清这个仓存什么、什么时候该写进去。常见流程是 register、clone、list；pull、push、unregister 可选。git 鉴权由用户在自己的终端完成，AI 不经手 token。
