---
name: feedback_skill_bump_version
title: 改 skill 后必须升级 version、写 changelog、打 tag
description: 更新 extensions/skills 下任何一个 skill 后，升 SKILL.md version，写 CHANGELOG.md，并打 skill/<name>@<version> tag。
type: feedback
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T17:52:01+08:00"
---

更新 `extensions/skills/` 下任何一个 skill 后，必须同步：升该 skill `SKILL.md` 的 `version`、把变更写入同目录 `CHANGELOG.md`、对同一个 commit 打 annotated tag `skill/<name>@<version>`。

**Why:** 分发后的副本靠 version 判断有没有新内容；changelog 是给人读的发版说明；tag 是「某个版本对应哪次提交」的索引。只改正文不升版本、不打 tag，安装方会沿用旧副本，以后也找不到那一版的代码。

**How to apply:** 改了某个 skill 的 `SKILL.md`、scripts、references 或对外行为后：(1) 按 semver 升它自己的 `version`（补丁 +0.0.1，行为/契约变 +0.1.0，不兼容 +1.0.0）；(2) 把 `CHANGELOG.md` 里 `[Unreleased]` 的条目挪到 `## [x.y.z] - YYYY-MM-DD`，分类用 Added / Changed / Deprecated / Removed / Fixed / Security；(3) `git tag -a skill/<name>@<version>`，message 用该版本 changelog 正文；(4) `git push origin main --follow-tags`。没改到的 skill 不要动版本；目录级 README 不算单个 skill 的版本。一次 commit 改了多个 skill，每个改过的各写 changelog、各打一条 tag。查找用 `git show skill/<name>@<version>`。
