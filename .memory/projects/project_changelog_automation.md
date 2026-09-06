---
name: project_changelog_automation
title: Changelog 自动化：调研过，暂不生成正文
description: 考虑给仓库或 skill 自动生成 changelog 时：维持手写 Unreleased；若要自动化只切版本和校验，不要从 git log 生成条目。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T20:46:46+08:00"
---

调研过常见 changelog 自动生成方案，结论是 Edges 继续手写 Keep a Changelog 的 `[Unreleased]`；以后若加自动化，只做「把 Unreleased 切成版本段 + 打 tag + 校验忘写」，不要从 Conventional Commits 或 git log 生成正文。脚本尚未落地。

**Why:** 成熟开源项目的「自动」多半是拼装、升版本、打 tag、发 GitHub Release，用户可见条目仍是人事先写的。对照过三类方案：

1. 从 Conventional Commits 生成（semantic-release、release-please、git-cliff）：changelog 质量和 commit 绑死，实现向标题会进用户文档；本仓一次 commit 常改多个 skill，按路径切也会混。
2. 变更碎片再拼接（changesets、towncrier、Release Drafter）：正文质量好，changesets 的多包独立 semver 也接近 skill 的形状，但会和现有各 `CHANGELOG.md` 重复。skill 独立发版那条已经否决用它生成。
3. 手写 `[Unreleased]`，脚本只切版本：即现状。认真维护的项目经常停在这里。

根 `CHANGELOG.md` 和各 `extensions/skills/<name>/CHANGELOG.md` 都适用同一条。GitHub 自动生成的 Release notes 对 clone 仓库的人不可见，不能代替仓库内文件。

**How to apply:** 不要擅自引入 semantic-release、git-cliff、changesets 来生成 changelog。用户再提自动化时，优先做切 Unreleased 和忘写校验，不必重做方案调研。只改某一个 skill 的补丁仍走该 skill 的 changelog 和 `skill/<name>@<version>`，不要因此升仓库版本。
