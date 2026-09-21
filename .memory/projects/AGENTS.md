# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [放弃的 ChatGPT MCP 接入](project_abandoned_chatgpt_mcp.md) — 2026-02-19 建过两条空的 ChatGPT MCP change，没有设计可恢复；若再做从当前 MCP 布局重开。
- [理想链路：AGENTS.md → Skill → CLI](project_agents_md_to_skill_to_cli.md) — peng cheng 理想发现链路——读目录 AGENTS.md，被指引到可加载 Skill，再由统一 Skill 调用 edges CLI；记忆 skills 类型不是自动加载层。
- [Artifacts 预览 ECS：user unit + nginx :80](project_artifacts_preview_ecs_ops.md) — 改 artifacts 在阿里云 ECS 上怎么跑、或要不要给 8787 开安全组时打开：和 teaching 同机；人机接口是 edges artifacts server（install 不启动 / start|stop|restart / status / setup-nginx）；站点文件 teaching.conf（TEACHING_CONF）必须带 /teaching/；遗留 teach.conf 先改名再 migrate；轮换 token 必须再 restart；客户端 init --token；不要公网 8787。
- [个人 Artifacts 预览服务：上传→URL→TTL](project_artifacts_preview_service.md) — 改 Artifacts 预览服务、edges artifacts、或审阅页如何给人打开时打开：稳定短生命周期托管 + 真浏览器可开 URL；聊天内嵌预览是绕开的不可靠路径；review-page 仍只渲染；结果回传另卡。ECS 手机 URL 走与 teach 同机的 :80 反代，不要假定 localhost。与 /tasks/ 持久站硬边界见 ADR 0021。决策见 docs/adr/0013-artifacts-preview-service.md。
- [能力面：CLI / Skill / MCP](project_capability_surface_cli_skill_mcp.md) — 能力面是 CLI、Skill、MCP 三者并列；仓根 bin/ 已删除；Note git 在 extensions/clis 的 TS；MCP 子进程调 edges note。禁止「必要时 MCP」或只写 CLI+Skill。新能力不要再加仓根脚本或把 npm bin 当一层。
- [Changelog 自动化：调研过，暂不生成正文](project_changelog_automation.md) — 考虑给仓库或 skill 自动生成 changelog 时：维持手写 Unreleased；若要自动化只切版本和校验，不要从 git log 生成条目。
- [classifyTasks 与 Task Project 元数据](project_classify_tasks_and_project_metadata.md) — 实现或改 edges tasks project / project-tasks-classify Skill 时打开：能力面 CLI + Skill + MCP；按用户已设质心做 LLM / agent 判断；无 embedding、无 classify 动词。第 4 步人闸是 project review-page（Markdown 表仅无 GUI 回退）。四个 project 动词都会 ensure。Skill 目录/id 是 project-tasks-classify（展示名 classifyTasks）。
- [classifyTasks 按已有质心分类；Task Project 元数据只做索引层](project_classify_tasks_and_task_project_metadata.md) — 改 Task Project 元数据、classifyTasks / project-tasks-classify 工作流或看板 AGENTS.md 时：只做索引/描述层（Q18=A），不把 Task 升成 Memory Type。按用户已设 Task Project 质心做归属建议（LLM / agent 判断），不要求 embedding。人闸主路径是 review-page（ADR 0012）。Skill 路径 extensions/skills/project-tasks-classify/；新类型走 proposeTypes（ADR 0011）。决策见 docs/adr/0010-classify-tasks-and-task-project-metadata.md。
- [CliContext 只装生产快照](project_cli_context_production_snapshot.md) — 改 edges CLI 的 CliContext / run() 入参时：只放 env 与 stdin 快照加 Commander 的 result；不要把 ingest、fs、writer、now 等测试替身塞进 Context。输出类型叫 CliResult，不要叫 RunResult。
- [对话整理采用复盘四栏](project_conversation_notes_fupan_four_columns.md) — 改 conversation-to-notes 或对话 Note 结构时：用复盘四栏；相关链接写入【补充说明】并附说明；不要复活已关闭的 FIA 中文换皮；不要批量改写旧笔记；不要把升 Edge 写进该 skill。
- [Task Issue 优先级用词档位，与 status 正交](project_edges_task_priority.md) — Task Issue 优先级为 urgent|high|medium|low|none，写在 metadata.edges-task-priority，与 status 正交、不搬状态夹。CLI 已落地 create/update --priority 与 list --sort priority；Skill/MCP 后做。决策见 docs/adr/0007-edges-task-priority.md；词 vs P0 调研见 knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md
- [Task 看板按 Task Project 目录优先分组](project_edges_task_project.md) — 看板 Task Project 为 directory-first + frontmatter 双写；未分组用 _default。决策见 docs/adr/0009-edges-task-project-grouping.md。CLI 已按 docs/superpowers/plans/2026-09-16-edges-task-project.md 落地；status 只在同 project 内移动。
- [edges tasks 本轮只做 CLI](project_edges_tasks_cli.md) — 本轮 edges tasks 看板操作只做 CLI（list/get/create/update/status + 只读 runs/run-messages）；Skill 与 MCP 后做同一契约。决策见 ADR 0005。
- [可扩展 Memory Type：LAYOUT 登记，不另开注册表](project_extensible_memory_types.md) — 可扩展 Memory Type：扩展面只在 LAYOUT，用 project-memory-add-type 登记；官方种子仍是六类。决策见 docs/adr/0006-extensible-project-memory-types.md。
- [idea→task→专家→Cloud Agent→改状态](project_idea_todo_expert_cloud_loop.md) — 工作流：idea 记到 knowledge/tasks（Task 记录员）→ 有空时专家 Agent 细聊 → Cursor Cloud Agent 开发 → 开发完改 Task 状态
- [v1 Langfuse 用官方 docker compose](project_langfuse_docker_compose.md) — 选自托管 Langfuse 的 v1 编排、或有人提出上 Kubernetes 时打开：用官方 docker compose（文档里的 Postgres + Langfuse 栈及其官方依赖），不用 k8s；本仓不提交带密钥的 compose。决策见 docs/adr/0016-langfuse-docker-compose.md。
- [自部署 Langfuse 与 Observation 产品卡分开](project_langfuse_infra_vs_observation_product.md) — 改自部署 Langfuse 卡、知识库 Observation 系统、或想把两者并成一条时打开：前者只做实例部署/运维/鉴权/备份；后者是 traces/logs/dashboard 产品语义。v1 验收先 UI 再 1–2 个客户端（ADR 0020）；更广接线留产品卡。决策见 docs/adr/0015-langfuse-infra-vs-observation-product.md。
- [v1 Langfuse 用 named volume + 偶发 tar](project_langfuse_named_volumes_manual_backup.md) — 选自托管 Langfuse 的 v1 数据面、HA 或备份方案时打开：Docker named volume + 偶尔手工/脚本 tar；无 HA。定时机外备份（NAS/云）是后续未做。决策见 docs/adr/0019-langfuse-named-volumes-manual-backup.md。
- [Langfuse 密钥只留 minigtr 磁盘](project_langfuse_secrets_stay_on_minigtr.md) — 写自托管 Langfuse 的 .env、密钥、compose 笔记或想把配置提交进 VirusPC/edges 时打开：密钥只活在 minigtr 磁盘（例如本机 services 目录）；本仓只留脱敏 ADR/说明。决策见 docs/adr/0018-langfuse-secrets-stay-on-minigtr.md。
- [v1 自托管 Langfuse 只走 Tailscale](project_langfuse_tailscale_only_access.md) — 改自托管 Langfuse 的 v1 访问面、或有人要立刻做公网 HTTPS/反代时打开：v1 仅 Tailscale；没有 Tailscale 就接受只剩 minigtr localhost/LAN。公网 HTTPS（反代+证书）是后续未做。决策见 docs/adr/0017-langfuse-tailscale-only-access.md。
- [v1 Langfuse 先证明 UI 再试 1–2 个客户端](project_langfuse_ui_then_few_clients.md) — 写自部署 Langfuse 的 v1 验收、或想一次接上 Grok/edges Agent 时打开：先证明 UI 健康，再试 1–2 个客户端；更广接线留在 Observation 产品卡。决策见 docs/adr/0020-langfuse-ui-then-few-clients.md。
- [记忆研究笔记落 knowledge/projects/memory](project_memory_research_notes_in_knowledge_projects.md) — 写 project-memory 的调研、优点、related work 等研究笔记时：落到 knowledge/projects/memory/；skill 层 .memory 只记协议与设计决策，不当成对外研究笔记落点。
- [整仓 MIT，不拆 knowledge 许可证](project_mit_license.md) — 给仓库选许可证、改 LICENSE 或 package.json license 字段时：整仓 MIT，不要给 knowledge/ 另开一份。
- [new-note MCP 的 ingest 约束](project_new_note_ingest.md) — 改 new-note 或新增 MCP ingest 时：TS+Node 编排，子进程调用 edges note，失败即停，返回机器可解析 JSON。不要 Python server，不要 in-process import CLI，不要再找仓根 bin/。
- [posts 对外展示，Astro 博客 + Actions CI](project_posts_public_astro_blog.md) — posts 面向对外展示；后续以 posts 为数据用 Astro 搭博客，并用 GitHub Actions 在服务器做 CI
- [仓内任务优先用仓库 Skill 与 CLI](project_prefer_repo_skills_and_cli.md) — 执行 VirusPC/edges 仓内工作时，优先调用本仓 Skill 与 edges CLI；不可用须向用户说明缺口，勿默认手搓绕过。
- [订阅管理盘点进展](project_progress.md) — 订阅/用量盘点进展：双 Gmail + QQ IMAP、国内 Kimi 无邮箱、CodexBar Linux CLI 已装待鉴权；后续 Apple/微信侧核对。
- [proposeTypes 从 _default 提议新 Task Project 类型](project_propose_types_from_default.md) — 改 propose-types 工作流或从 _default 发明新 Task Project 时打开：独立 Skill extensions/skills/project-tasks-propose-types/；经同一 review-page 确认，不自动 project create；方法是 LLM/agent 判断；配对 project-tasks-classify、ADR 0011 与 ADR 0012。本轮不写 skill 正文。
- [仓库用根 CHANGELOG 和 v 标签发版](project_repo_changelog.md) — 写 Edges 仓库级变更时用根目录 CHANGELOG.md 和 v 标签。Unreleased 按功能模块分组；用人话写清「现在能做什么」，同一条里立刻给出真实命令名；对照 [1.2.0] 的完整句，不要堆 schema 字段表。枚举写仓库英文原值（优先级是 urgent/high/medium/low/none）。不要摊成扁平长列表，也不要把决策/术语/计划逐条写进去。
- [审阅页侧栏筛选用 design A（选中染色 + 未选变淡）](project_review_page_sidebar_filter_design_a.md) — 改 edges tasks project review-page 侧栏筛选外观时打开：选中 is-filter 用 accent 染色底+实线边；未选中 group 降 opacity 0.55–0.7（hover 可拉回）；is-over 外扩 outline，须和 is-filter 叠得开。只改 CSS，不改点击/拖放。用户 2026-09-17 选定 design A。
- [根硬约束只留聚光灯、脱敏与 git](project_root_important_scope.md) — 改根 AGENTS.md 硬约束时：只留 ask/remember 聚光灯、硬约束写在本区块、公开仓脱敏、git 纪律；bin/scripts 路径约定和交互口吻不进硬约束，也不进 .memory。
- [根 README 以知识闭环为唯一主线](project_root_readme_direction.md) — 设计或修改根 README 时：从投资视角解释知识管理、分层 Agent Memory 与知识闭环，用一张图串联认知资本、Edge、收益、风险、流动性和反馈再投资。
- [v1 自托管 Langfuse 落在物理机 minigtr](project_self_hosted_langfuse_on_minigtr.md) — 改自托管 Langfuse 的 v1 宿主、或默认往阿里云/云 VPS 上放时打开：宿主是物理机 minigtr，按多数时候在线的小型服务器运维；双系统仍在但 Windows 不是日常路径。不是阿里云或其它云 VPS。访问面见 ADR 0017。决策见 docs/adr/0014-self-hosted-langfuse-on-minigtr.md。
- [跨机器跨 Agent 的 harness 放 shared-extensions](project_shared_extensions.md) — 新增不绑定 Edges 的 skill / MCP 配置 / plugin / hook 时：放 shared-extensions；接入 Edges 的能力仍走 extensions。不要用「换机器带得走」当进 extensions 的充分条件。
- [Task Project 审阅页是 render-only CLI](project_task_project_review_page_render_only_cli.md) — 改 classifyTasks / proposeTypes 人闸或 edges tasks project review-page 时打开：CLI 只渲通用 groups+items HTML（已落地）；Skill 出建议、现有 create/update 落地；无 --mode、无 classify/apply-review 动词、无审阅页 MCP。一次性人闸见 ADR 0013；固定 /tasks/ 入口见 ADR 0021，不要把托管并进 review-page。决策见 docs/adr/0012-task-project-review-page-is-render-only-cli.md。
- [tasks 只追加直接推 main](project_tasks_direct_main.md) — 往 knowledge/tasks/ 写只追加速记时，直接提交 main、不提 PR
- [持久 /tasks/ 看板站：复用 review-page，扩展 deploy-teach](project_tasks_persistent_board_site.md) — 改 /tasks/ 持久入口、list --group-by、或看板站 vs Artifacts 时打开：不新开 status station；CI 扩展 deploy-teach.yml 并在 pull 后生成 _site；分组 schema 松耦合（edges.tasks.grouped/v1）；review-page 仍只渲染；nginx 一次性 setup-nginx-tasks.sh。决策见 docs/adr/0021-persistent-tasks-board-site.md。
- [工作项叫 tasks，支持状态流转](project_tasks_with_status_not_todos.md) — idea→专家→Cloud 工作流下，目录与概念用 knowledge/tasks/（非 todos），按 Task Project 再按 edges-tasks-status 分夹流转
- [ECS 上 edges 用 Actions SSH 整仓 pull](project_teach_site_rsync_push.md) — 改 teach 站点、/tasks/ 持久站或 ECS 上的 edges 部署时：用 GitHub Actions SSH 触发整仓 git fetch/reset，不要再 rsync 推送；deploy job 保持 environment: production；reset 后始终生成 /tasks/；artifacts 仅在盒上已有 server env 时 bootstrap。不要新开 workflow（ADR 0021）。
- [todos 只追加直接推 main（已由 tasks 路径取代）](project_todos_direct_main.md) — 旧约定：往 knowledge/todos/ 只追加速记曾直接推 main；该路径已删除，现行入口见 tasks_direct_main
<!-- project-memory-entries:end -->
