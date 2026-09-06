---
name: project_skill_independent_versioning
title: Skill 独立发版，changelog 按 skill 分
description: 决定 changelog、tag、semver 粒度时：每个 skill 一份，不要 extensions/skills 总 changelog。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T20:02:49+08:00"
---

`extensions/skills/` 里每个 skill 独立 semver，`CHANGELOG.md` 和 tag `skill/<name>@<version>` 都按单个 skill 计，不维护整目录一份总 changelog。仓库根 `CHANGELOG.md` 记的是 Edges 仓库本身，不是 skill 总账。

**Why:** skill 的 `version` 已经各自走（例如 init 1.1.0、ask 仍 1.0.0）。Keep a Changelog 的 `## [1.1.0]` 必须和那份 `SKILL.md` 的 version 是同一个数；合成一份只能写成 `## [project-memory-init 1.1.0]`，既不是该规范，compare 链接也对不上。`npx skills add --skill <name>` 按目录装，消费者打开的是那一个 skill 目录。只有 11 个 skill 锁步同一个数字时才该用总 changelog——当前明确是改了谁升谁。仓库另有自己的发版单元，不能拿根 changelog 代替各 skill 的那一份。

**How to apply:** 新 skill 自带 `CHANGELOG.md`，从 `1.0.0` 起。升版本只改被改到的那一份 changelog 和那一条 tag。不要在 `extensions/skills/CHANGELOG.md` 写 skill 总账。不要上 changesets / semantic-release 来自动生成（一次 commit 常改多个 skill，自动生成会混）。发版说明写给人看的行为变化，不写「升了 version 字段」。查找版本对应 commit 用 `git show skill/<name>@<version>`，范围查询加上该 skill 目录路径以免扫进整仓历史。仓库级变更走根目录 `CHANGELOG.md` 和 `vX.Y.Z`。
