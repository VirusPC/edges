---
name: project_top_level_content_and_extension_apps
description: >-
  目录单元适用于全部知识内容；共用附件复制，未引用旧 img 归 archive/img，根共享池无引用附件归档；apps 属于
  extensions，局部记忆保留归属。
metadata:
  edges-title: 知识目录单元与扩展应用归属
  edges-type: project
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T23:59:45+08:00'
---

用户明确要求移除 knowledge 容器层，原有知识角色直接平铺到根；apps 属于 extensions 的全局共享应用实现。目录单元适用于全部知识内容，不只 Note。

**Why:** 用户纠正了只处理 notes 的范围理解。目录单元的目的是让正文与附件一起迁移、归档和消费，Edge、Post 等没有例外；共享实现的归属与局部记忆归属分开判断。

**How to apply:** 普通内容使用目录中的 index.md；AGENTS.md、SKILL.md 与目录说明 README.md 保留各自角色。局部 .harness 随所属作用域，不上收根层。独占附件放入内容目录；用户选择共用附件复制给各篇、根共享池中无引用附件保留到 archive 待整理，不能为清空文件夹而删除附件或猜测归属。用户进一步指定，未找到引用的旧 img 附件统一归档到 archive/img，并保留原仓库相对路径以防止同名覆盖、方便恢复；不推测所属内容，也不删除。用户本次明确授权 posts 的目录及必要引用迁移，日后仍遵守禁止 AI 自动改写博客的约束。历史清单保留当时路径；大批量目录／引用操作必须写可预览、可重复执行的 TypeScript 脚本。
