---
name: project_top_level_content_and_extension_apps
description: >-
  目录布局现行决定：去掉 knowledge 层；notes、edges、posts、resources、archive 位于根；apps 属于
  extensions 的全局共享应用实现。
metadata:
  edges-title: 知识目录平铺与扩展应用归属
  edges-type: project
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T23:15:55+08:00'
---

用户明确要求移除 knowledge 容器层，原有知识目录直接平铺到根；apps 移入 extensions/apps，作为全局共享的对外扩展实现。

**Why:** 知识角色本身已经区分目录，额外容器层没有必要；应用是跨作用域复用的能力，不是根层知识内容。全局复用不改变局部记忆归属，也不表示已经单独打包发布。

**How to apply:** 新 Note 写入选定作用域的 notes/<条目>/index.md。迁移目录时，局部 .harness 随所属目录移动，重算相对引用；资源与正文一起搬迁。用户本次明确授权 posts 目录搬迁，但其文件字节保持不变，之后仍遵守禁止 AI 自动改动博客的约束。旧迁移清单及历史说明保留当时路径，不当作当前目录规范；可重复批量搬迁使用 pnpm migrate:top-level-layout 预览和执行。
