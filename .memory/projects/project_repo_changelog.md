---
name: project_repo_changelog
description: 写 Edges 仓库级变更时用根目录 CHANGELOG.md 和 vX.Y.Z tag；不要当成 skill 或 shared-extensions 总账，也不要因它们的补丁去升仓库版本。
metadata:
  edges-title: 仓库用根 CHANGELOG 和 v 标签发版
  edges-type: project
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-08T16:00:03+08:00"
---

Edges 仓库自己有一份根目录 `CHANGELOG.md`（Keep a Changelog）和 `vX.Y.Z` tag，版本号以 `package.json` 的 `version` 为准。这和对外 skill 的独立发版、`shared-extensions/` 的整层发版并行，不是把那些 changelog 抄到根上。

**Why:** 仓库是一个发版单元（MCP、bin、scripts、知识库约定、分发方式），对外 skill 是另一个，跨机器 harness 又是一个。根 changelog 让人能扫「这个系统最近变了什么」；把 skill 或 harness 明细写进来会和各自的 changelog 重复，也会逼仓库版本和它们锁步。

**How to apply:** 改基础设施、MCP、目录约定、分发或跨 skill 的仓库行为时，把条目写进根 `CHANGELOG.md` 的 `[Unreleased]`；做仓库发版时升 `package.json` version、把 Unreleased 挪到 `## [x.y.z] - YYYY-MM-DD`、打 annotated tag `vX.Y.Z`、`git push origin main --follow-tags`。只改某一个对外 skill 的补丁：走该 skill 的 changelog 和 `skill/<name>@<version>`，不必升仓库版本，也不要在根 changelog 逐条复述。只改 `shared-extensions/` 里的 harness：走 `shared-extensions/CHANGELOG.md` 和 `shared-extensions@x.y.z`，同样不必升仓库版本。新增或删除 skill / 这个 harness 发版单元、改变分发方式或 `extensions/` 与 `shared-extensions/` 的边界，算仓库级，写入根 changelog。查找用 `git show v1.0.0`。
