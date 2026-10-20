---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-20T05:17:08.480Z'
  edges-title: 框架仓平铺 extensions 并把 posts 搬回个人仓
  edges-tasks-status: todo
  edges-task-priority: none
name: 框架仓平铺 extensions 并把 posts 搬回个人仓
description: 拆仓后 extensions/ 一层多余，平铺到框架仓顶层；posts/ 改算个人内容，搬到 edges-brain-viruspc。
---
**背景：**
拆仓后 VirusPC/edges 已是框架工程仓而非记忆仓库，`extensions/` 这一层多余；之前认定 `posts/` 算系统，现改为算个人内容。

**目标：**
把 `extensions/` 下的内容（CLI、skills 等）平铺到框架仓顶层；把 `posts/` 连同 site-and-content 项目及博客建站卡搬到 VirusPC/edges-brain-viruspc（通用建站代码若有则留框架仓，个人仓只放文章与站点配置）。

**动作：**
- 先全仓搜 `extensions/` 引用：CLI layout / harness 扫描、skills 安装来源、工作流、Compose 登记、文档链接。
- 等拆仓卡剩余两件（ECS `/tasks/` 切换、删个人仓系统副本）完成后再动手。
- 对老路径留兼容，或写清迁移说明。

**完成标准：**
- [ ] 框架仓顶层不再有 `extensions/`，构建、测试、npm 发布、部署工作流路径改对并跑通
- [ ] README / AGENTS 目录说明按平铺后的现状写
- [ ] `posts/` 与相关卡在个人仓，框架仓不再有
- [ ] 拆仓卡里 posts 边界的表述同步改掉
