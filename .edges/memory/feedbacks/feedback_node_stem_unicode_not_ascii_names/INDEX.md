---
name: feedback_node_stem_unicode_not_ascii_names
description: >-
  改笔记、项目目录名或任务名 slug 时打开：目录 stem 保留汉字；skill、memory、task project 的名字校验仍要求小写
  ASCII，不要一起放宽。
metadata:
  edges-title: 目录 stem 保留 Unicode，名字校验仍要 ASCII
  edges-type: feedback
  edges-origin-session-id: bc-63a33f92-b6bc-5f6b-8851-29599defb1c1
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-10-11T17:02:11+00:00'
---

笔记和项目的日期目录 stem 保留 Unicode 字母和数字（含汉字）。任务 name 继续用 `_` 并转成小写。skill 名、memory 条目名、task project 名仍只接受小写 ASCII。

**Why:** 2026-10-11 用户确认：`edges notes create` 与 `edges projects create` 的目录名要留下中文标题，并与任务名共用同一套 stem 规则；分隔符和大小写按调用方原有约定保留，避免改掉任务已经落盘的名字。skill、memory、task project 的名字校验是故意限制 ASCII 的，不能借这次统一放宽。

**How to apply:** 目录名和任务 name 走领域模型里的共享 stem，用选项保留各自的分隔符、大小写和空结果 fallback（任务是 `task`，笔记和项目是 `untitled-` 加时间）。不要把 skill、memory、task project 的小写 ASCII 校验改成 Unicode 字母。不要把这套规则放进 utils。
