---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-21T01:22:19.217Z'
  edges-title: 框架仓平铺 extensions 并把 posts 搬回个人仓
  edges-tasks-status: done
  edges-task-priority: none
name: 框架仓平铺 extensions 并把 posts 搬回个人仓
description: 拆仓后 extensions/ 一层多余，平铺到框架仓顶层；posts/ 改算个人内容，搬到用户的个人大脑仓。
---

**背景：**
拆仓后 VirusPC/edges 已是框架工程仓而非记忆仓库，`extensions/` 这一层多余；之前认定 `posts/` 算系统，现改为算个人内容。

**目标：**
把 `extensions/` 下的内容（CLI、skills 等）平铺到框架仓顶层；把 `posts/` 连同 site-and-content 项目及博客建站卡搬到用户的个人大脑仓（通用建站代码若有则留框架仓，个人仓只放文章与站点配置）。

**动作：**
- 先全仓搜 `extensions/` 引用：CLI layout / harness 扫描、skills 安装来源、工作流、Compose 登记、文档链接。
- 等拆仓卡剩余两件（ECS `/tasks/` 切换、删个人仓系统副本）完成后再动手。
- 对老路径留兼容，或写清迁移说明。

**进展（2026-10-20）：** 已全部完成，本卡关闭。
- VirusPC/edges#6 已合：`posts/`、site-and-content 项目和博客记忆迁出框架仓；新增 ADR 0040；grill 拍板写进本卡。
- VirusPC/edges#7 已合（merge commit）：`extensions/` 平铺到仓根（`packages/cli/` `packages/skills/` `packages/apps/` `packages/services/` `packages/mcp-servers/` `packages/system-prompt/`），硬约束与记忆并入根；CHANGELOG 与 `docs/migrations` 写了旧→新路径对照表。用 merge commit 是为了让 6 个 skill tag 指向的提交留在 main 上。
- 个人仓接收内容：个人大脑仓 #334。
- 部署：框架仓 Deploy 成功；ECS 上框架仓检出已到最新，没有 `extensions/`，artifacts 服务改从 `packages/services/` 运行；`/tasks/`、`/teaching/`、`/health`、`/artifacts` 都返回 200。
- 拆仓卡里 posts 边界的表述已在个人大脑仓 #333 改掉。

**完成标准：**
- [x] 框架仓顶层不再有 `extensions/`，构建、测试、npm 发布、部署工作流路径改对并跑通
- [x] README / AGENTS 目录说明按平铺后的现状写
- [x] `posts/` 与相关卡在个人仓，框架仓不再有
- [x] 拆仓卡里 posts 边界的表述同步改掉

## grill 第 1 轮（2026-10-20 peng cheng 拍板）

决定记录。第 5、8 题改了当时页面上的推荐项。状态仍是 todo。对应 [ADR 0040](../../../../../docs/adr/0040-flatten-extensions-posts-to-personal-repo.md)。

### 1. 平铺后的目录名

- **问题：** `extensions/` 下的目录放到仓根时用哪一套名字？
- **选项：** 原名平铺（`packages/cli/` `packages/skills/` `packages/apps/` `packages/services/` `packages/mcp-servers/` `packages/system-prompt/`）；或收进 `packages/`、skills 等资产放根；或其他命名。
- **结论：** 原名平铺，不套 `packages/`。推荐项，未改。
- **理由：** `packages/cli/`、`packages/skills/`、`packages/apps/` 仍是兄弟，现有互相引用的相对路径不用改。套 `packages/` 会让「平铺」名不副实，打包脚本也要改。

### 2. 空占位和个人运维目录

- **问题：** `docs/`、`tools/`、`subagents/` 占位，以及 `new-server/`、`others/` 怎么处理？
- **选项：** 删占位，`new-server` 与 `others` 搬个人仓 `shared-extensions`；或全部原名平铺到根；或占位删、运维笔记收进 `docs/ops/`。
- **结论：** 删 `extensions/docs`、`extensions/tools`、`extensions/subagents`。`extensions/new-server`、`extensions/others` 从框架仓删除。个人仓由 peng cheng 另行搬到 `shared-extensions`。推荐项，落地时个人仓那一步不在本卡的 PR 里做。
- **理由：** 根上只留框架真用的目录。占位是空的。`others/` 放根名字不合适，内容是个人运维与检索式。

### 3. extensions 这层 harness 并到哪里

- **问题：** `extensions/AGENTS.md` 与 `extensions/.edges/`（22 条记忆）并到哪里？
- **选项：** 并入根；或挪到 `packages/cli/` 让 CLI 成为下层系统；或按条目分流。
- **结论：** 并入根。硬约束进根 `AGENTS.md`，22 条记忆并入根 `.edges` 并合并索引。`packages/skills/project-memory-init` 改由根登记。`feedback_cli_under_extensions` 按同一 slug 翻案，写明 2026-10-20 推翻「CLI 不放仓库根」。推荐项，未改。
- **理由：** 平铺之后不再有 extensions 这一层系统。记忆条目与根上无同名目录，只合并索引。

### 4. 旧路径留不留兼容

- **问题：** 旧 `extensions/` 路径留不留软链或墓碑？
- **选项：** 硬切，只写旧→新映射；或留 `extensions/skills`、`extensions/mcp-servers` 软链一个版本；或只留 `extensions/README.md` 墓碑。
- **结论：** 硬切。不留软链。映射表进 CHANGELOG 和 docs。推荐项，未改。
- **理由：** 本层约束是硬切断、不留旧名。软链或墓碑都会让顶层仍有 `extensions/`，对不上完成标准。edges CLI 不扫描用户仓的 `extensions/`。

### 5. 文档里的旧路径改到什么范围

- **问题：** 文档里的 `extensions/` 路径改现行文档，还是连历史一起改？
- **选项：** 只改现行文档（README、AGENTS、CONTEXT、ADR、记忆、未完成卡），历史计划、done 卡、CHANGELOG 历史条目、评测报告不动；或用脚本全量改写。
- **结论：** 全量改写。**本项改了推荐**（页面推荐是只改现行文档）。
- **理由：** peng cheng 要求历史计划、done 卡、CHANGELOG 历史条目、评测报告里的仓内路径一并改到新位置，避免读旧卡时走到已经不存在的目录。只改仓内路径引用，不改外部 URL 里无关的 `extensions` 字样。相对链接按文件新位置重算。

### 6. 怎么拆 PR

- **问题：** 平铺与 posts 迁出拆成几个 PR，workflow 谁改？
- **选项：** 平铺一个原子 PR，posts 另起一个 PR；或先合代码、workflow 随后补；或合成一个 PR。
- **结论：** 两个 PR，都对 main。PR-A 只迁出 posts。PR-B 原子平铺：`git mv`、路径、重新生成 lockfile，以及 `deploy.yml`、`publish-edges-cli.yml` 只改内容、文件名不变。推荐项，未改。
- **理由：** main 上不能出现「代码已平铺、workflow 还指旧路径」的中间态。Trusted Publishing 绑定 workflow 文件名。posts 删除单独审。

### 7. ECS 上 unit 与迁移器怎么切

- **问题：** artifacts unit 与站点布局迁移器怎么切到新路径？
- **选项：** 迁移器只移动不改内容，unit 由 deploy 里的 `artifacts server install` 重写并重启；或顺手改迁移器文案再约 root 重装；或在 ECS 上手动留软链。
- **结论：** 迁移器三份文件只 `git mv`，字节不变。`deploy.yml` 的 `repo_entry`、`repo_lib`、`repo_py`、`install_cmd` 改为新路径。unit 的 `WorkingDirectory` / `ExecStart` 改为 `%h/projects/edges-framework/services/artifacts-preview/...`，由 deploy 用仓内 CLI 执行 `artifacts server install` 后重启。`reset --hard` 之后若还有未被跟踪的 `extensions/`，整目录删掉。全程不用全局 `edges`。推荐项，未改；deploy 只用仓内 CLI 与清残留是拍板时写明的做法。
- **理由：** 迁移器装在 `/usr/local`，deploy 只比对摘要；内容不变就不必 root 重装。unit 是 user 级，install 会重写。ECS 上没有可靠的全局 edges，旧版还会写死 `packages/services/...`。

### 8. site-and-content 的 4 张卡怎么分

- **问题：** 博客卡、badge 卡、多形态输出卡，哪些离开框架仓？是否授权删除 `posts/` 并去掉根 AGENTS 的 posts 约束？
- **选项：** 只迁博客 2 卡 + `posts/` + 博客记忆，badge 与多形态输出留框架仓并改挂项目；或整个 `site-and-content` 项目全走；或其他分法。另有一项授权勾选：删除框架仓 `posts/` 并去掉 posts 硬约束。
- **结论：** 整个项目全走，并授权删除。**本项改了推荐**（页面推荐是按内容拆开，博客走、另外两张卡留）。
- **理由：** peng cheng 要求 `posts/`、`.edges/tasks/site-and-content/`（整个项目及 4 张卡）、`project_posts_public_astro_blog` 都离开框架仓，并明确授权去掉根 AGENTS 里的 posts 约束。个人仓已有文章与看板副本。框架仓的 `/tasks/` 看板生成器不是博客，留下。
