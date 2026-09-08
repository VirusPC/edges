---
name: project_shared_extensions
title: 跨机器跨 Agent 的 harness 放 shared-extensions
description: 新增不绑定 Edges 的 skill / MCP 配置 / plugin / hook 时：放 shared-extensions；接入 Edges 的能力仍走 extensions。不要用「换机器带得走」当进 extensions 的充分条件。
type: project
username: viruspc
email: cheng.peng.helloworld@gmail.com
updatedAt: "2026-09-08T15:55:33+08:00"
---

跨机器、跨 Agent 共用、且不绑定 Edges 产品的 harness 放 `shared-extensions/`；接入或操作 Edges 的能力继续放 `extensions/`。

**Why:** `extensions/` 原来的判据「换 Agent、换机器带得走」太宽，个人 MCP 配置、hooks、plugins 也会混进去，和 Edges 对外接口层分不清。用户明确要一个所有本地/云端机器、所有 Agent 共享的扩展层。

**How to apply:** 新 skill / MCP 配置 / plugin / hook 先问「离开 Edges 知识库，换一台机器、换一个 Agent，我还要带着它吗」。要，且不是为了接入 Edges → `shared-extensions/`。是为了让 Agent 接入或操作 Edges → `extensions/`。已有 `extensions/skills` 不迁移。凭据只用环境变量占位。安装到各机器全局发现位的脚本等有第一份真实内容再加，不要手拷到 `~/.claude/` 等处。
