---
name: feedback_skill_bump_version
title: 改 skill 后必须升级 version
description: 更新 extensions/skills 下任何一个 skill 后，同步升 SKILL.md frontmatter 的 version。
type: feedback
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-06T17:13:22+08:00"
---

更新 `extensions/skills/` 下任何一个 skill 后，必须同步升级该 skill `SKILL.md` frontmatter 的 `version` 字段。

**Why:** 分发后的副本靠 version 判断有没有新内容；只改正文不升版本，安装方和 Agent 可能继续沿用旧副本。

**How to apply:** 改了某个 skill 的 `SKILL.md`、scripts、references 或对外行为后，按 semver 升它自己的 `version`（补丁 +0.0.1，行为/契约变 +0.1.0，不兼容 +1.0.0）。没改到的 skill 不要动版本；目录级 README 不算单个 skill 的版本。
