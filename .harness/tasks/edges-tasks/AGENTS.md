# Edges Tasks

看板与 Task 工作流（协作、绑定、Skill/MCP、分类与调度）。

<!-- project-harness-local:start -->
## 本层组成
- [tasks\_multiplayer\_author\_claim](<backlog/2026-09-11--tasks%E9%9A%8F%E4%BB%93%E5%A4%9A%E4%BA%BA%E5%8D%8F%E4%BD%9C%E4%B8%8E%E4%BD%9C%E8%80%85%E5%8C%BA%E5%88%86/index.md>) — tasks 随代码仓库时，应考虑同一仓库多人协作，区分任务写入与领取的作者等
- [task\_record\_vs\_execution\_repo](<backlog/2026-09-11--task%E8%AE%B0%E5%BD%95%E4%BB%93%E4%B8%8E%E6%89%A7%E8%A1%8C%E4%BB%93%E5%88%86%E7%A6%BB/index.md>) — 应考虑 task 记录处与领取执行处可能分属不同仓库的问题
- [tasks\_board\_github\_association](<backlog/2026-09-12--tasks%E6%9C%BA%E5%88%B6%E4%B8%8EGitHub%E5%85%B3%E8%81%94/index.md>) — edges knowledge/tasks 机制与 GitHub Issues/PR/Projects 如何关联
- [merge\_tasks\_memory\_type\_with\_board](<backlog/2026-09-13--tasks-memory%E4%B8%8E%E7%9C%8B%E6%9D%BF%E8%AF%AD%E4%B9%89%E5%90%88%E5%B9%B6/index.md>) — 以后再把 tasks memory type 与 knowledge/tasks 看板语义合并（含 CLI 改造）
- [recommend\_related\_tasks\_and\_ask\_deps](<backlog/2026-09-14--%E8%90%BD%E7%9B%98%E6%97%B6%E6%8E%A8%E8%8D%90%E7%9B%B8%E5%85%B3task%E5%B9%B6%E9%97%AE%E4%BE%9D%E8%B5%96/index.md>) — 每次记录 task 时推荐相关条目并提问依赖，逐步建出依赖 graph
- [task\_complex\_visualization](<backlog/2026-09-15--Task%E5%A4%8D%E6%9D%82%E5%8F%AF%E8%A7%86%E5%8C%96%E7%8A%B6%E6%80%81%E4%B8%BB%E9%A2%98%E4%B8%8E%E8%B0%83%E5%BA%A6/index.md>) — Task 需要复杂可视化：状态调度与预览、主题制定等，不限于列表看板
- [interactive\_theme\_clustering\_kmeans](<backlog/2026-09-15--%E4%BA%A4%E4%BA%92%E5%BC%8F%E4%B8%BB%E9%A2%98%E8%81%9A%E7%B1%BB%E5%8F%82%E8%80%83K-means/index.md>) — 人定主题种子，AI 按主题聚类；每主题有代表；删主题则剩余内容重聚
- [per\_task\_folder\_after\_themes](<backlog/2026-09-15--%E5%88%86%E4%B8%BB%E9%A2%98%E5%90%8E%E6%AF%8Ftask%E4%B8%80%E6%96%87%E4%BB%B6%E5%A4%B9/index.md>) — task 分项目主题后，每个 task 对应文件夹；入口文件写 name/description 等元信息与项目描述
- [queue\_auto\_dispatch\_ready\_tasks](<backlog/2026-09-15--%E6%8C%89%E6%B6%88%E6%81%AF%E9%98%9F%E5%88%97%E8%87%AA%E5%8A%A8%E6%8E%A8%E9%80%81%E5%B0%B1%E7%BB%AAtask/index.md>) — 参考消息队列，把明确且依赖就绪的 Tasks 自动推给 Agent；结合额度窗口吃满配额
- [tasks\_bind\_external\_systems](<backlog/2026-09-16--Task%E4%B8%8E%E5%A4%96%E9%83%A8%E7%B3%BB%E7%BB%9F%E7%BB%91%E5%AE%9A/index.md>) — Task 可绑定外部需求系统（PingCode、Aone、GitHub Issues 等），需适配与自定义字段
- [edges\_tasks\_skill\_mcp\_wrappers](<backlog/2026-09-16--edges-tasks%E7%9A%84Skill%E4%B8%8EMCP%E5%B0%81%E8%A3%85/index.md>) — 补大一统 Task CRUD Skill 调 CLI（及 MCP）；理想链路 AGENTS.md→Skill→CLI；不另造动词
- [task\_project\_classify\_real\_embedding](<backlog/2026-09-17--Task-Project%E5%88%86%E7%B1%BB%E6%8E%A5%E5%85%A5%E7%9C%9F%E6%AD%A3Embedding/index.md>) — Task Project 分类接入真正的 Embedding（本地或云端），支撑 Embedding\-based NCC
- [classify\_tasks\_into\_edges\_cli\_needs\_embedding](<backlog/2026-09-17--classify%E6%B2%89%E5%88%B0edges-tasks-CLI/index.md>) — 探讨：把 classify 逻辑沉到 edges tasks CLI（需 embedding）；无 embedding 前不做
- [periodic\_tasks\_and\_period\_trigger](<backlog/2026-09-19--%E6%94%AF%E6%8C%81%E5%91%A8%E6%9C%9F%E6%80%A7%E4%BB%BB%E5%8A%A1%E4%B8%8E%E5%91%A8%E6%9C%9F%E8%A7%A6%E5%8F%91/index.md>) — 看板支持周期性任务：按周期触发（cron/间隔等）；与一次性 Task、MQ 派发拆开
- [edges\_changelog\_cli](<backlog/2026-09-20--edges-changelog-CLI%E5%88%87-Unreleased-%E6%A0%A1%E9%AA%8C/index.md>) — 更新根 CHANGELOG 目前只能手改文件，没有 edges CLI；需要命令支持把 Unreleased 切成版本段并校验忘写，仍不从 git log 自动生成正文。
- [board\_status\_visualization\_skill](<backlog/2026-09-21--%E7%9C%8B%E6%9D%BF%E7%8A%B6%E6%80%81%E5%8F%AF%E8%A7%86%E5%8C%96-Skillreview-pageHTML-artifacts-publish/index.md>) — 展示 tasks 状态总览时缺少可加载 Skill；需要把「渲状态板 HTML → edges artifacts publish → 公网 URL」封成 Skill，避免 agent 扫目录拼文字列表。
- [conversation\_to\_tasks\_then\_cli\_persist](<backlog/2026-09-24--conversation-to-tasks%E6%95%B4%E7%90%86%E5%90%8E%E8%B0%83CLI%E8%90%BD%E5%BA%93/index.md>) — conversation\-to\-tasks 只整理成文；另一步用 edges tasks CLI 把草稿写入看板
- [tasks\_board\_default\_path\_dot\_edges\_tasks](<backlog/2026-09-25--%E7%9C%8B%E6%9D%BF%E9%BB%98%E8%AE%A4%E8%B7%AF%E5%BE%84%E6%94%B9%E4%B8%BA.edges-tasks/index.md>) — 按作用域分流任务：维护看板迁入 .harness/tasks/，领域任务归 tasks/；保留 Task/Run 契约并同步工具，新版仅新布局、旧内容一次性迁移。
- [conversation\_to\_task\_skill\_via\_cli](<cancelled/2026-09-13--conversation-to-task-skill%E8%B0%83%E7%94%A8CLI/index.md>) — conversation\-to\-task skill：按模板从对话总结 Task，并调用 edges tasks CLI 落盘
- [organize\_default\_project\_tasks\_skill](<in_progress/2026-09-16--%E6%95%B4%E7%90%86default-project%E7%9A%84tasks-skill/index.md>) — Skill：整理 \_default 下的 tasks——归入已有 project、新建 project、或继续留在 \_default
<!-- project-harness-local:end -->
