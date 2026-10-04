<!-- project-memory-type:start -->
name: project
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->

# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [放弃的 ChatGPT MCP 接入](project_abandoned_chatgpt_mcp.md) — 2026-02-19 建过两条空的 ChatGPT MCP change，没有设计可恢复；若再做从当前 MCP 布局重开。
- [理想链路：AGENTS.md → Skill → CLI](project_agents_md_to_skill_to_cli.md) — peng cheng 理想发现链路——读目录 AGENTS.md，被指引到可加载 Skill，再由统一 Skill 调用 edges CLI；记忆 skills 类型不是自动加载层。
- [AGENTS.md 入口只留三类：硬约束、本层索引、下层索引](project_agents_three_blocks.md) — 改 AGENTS.md 记忆形状、增减受管区块、或决定区块外留什么时：只保留 important / local / children；不要独立 auto 区块；硬约束种子是 ask/remember 聚光灯加「写在本区块」；区块外只留身份与指针。
- [项目记忆的技术关键点](project_architecture.md) — 这套记忆的承重点、最脆的地方，以及技术选择的判断。
- [Artifacts 预览 ECS：user unit + nginx :80](project_artifacts_preview_ecs_ops.md) — 改 artifacts 在阿里云 ECS 上怎么跑、客户端 BASE_URL，或 POST 被 Cloudflare 1010 拦住时打开：和 teaching 同机；客户端 init --base-url https://edges.viruspc.tech；对该主机 POST /artifacts 缺浏览器式 User-Agent 会 1010，带上则 201，GET 通常正常；install 不启动；teaching.conf 必须带 /teaching/；不要公网 8787。已有盒上 env 的 BASE_URL 在 ECS 上手动改。
- [个人 Artifacts 预览服务：上传→URL→TTL](project_artifacts_preview_service.md) — 改 Artifacts 预览服务、edges artifacts、或审阅页如何给人打开时打开：稳定短生命周期托管 + 真浏览器可开 URL；聊天内嵌预览是绕开的不可靠路径；review-page 仍只渲染；结果回传另卡。ECS 手机 URL 走与 teach 同机的 :80 反代，不要假定 localhost。与 /tasks/ 持久站硬边界见 ADR 0021。决策见 docs/adr/0013-artifacts-preview-service.md。
- [tasks 工作流阶段：grill → research → plan → implement → validate → close，回环按证伪](project_assign_grill_with_docs_first.md) — 写或派发 tasks 时打开：默认链为 grill→research→plan→implement→validate→close；research 是 deep-research（竞品/开源/现成方案），独立于 grill 与 plan；validate 是质量/设计/行为门禁（英文阶段名，不用「验收」），可派给非实现者，看板 in_review 大致对应；未 validate 不标 done。回环只按证伪退回，不随便跳阶段；全程可派 subagent 做浅调研，但不占正式 research、不改看板。用户当次跳过除外。
- [云端 Obsidian vault 选用 edges clone](project_box_obsidian_vault_for_preview.md) — 预览 tasks/artifacts 时用 /workspace/edges 作 vault、AppImage+--no-sandbox、禁用 Sync；2026-09-11 已验证。
- [shared-extensions 整层一份版本，不按条目发版](project_bundle_versioning.md) — 改本目录的 skill / mcp / plugin / hook 或发版约定时：升 VERSION、写本层 CHANGELOG、打 shared-extensions@x.y.z。不要给单条扩展独立 semver，也不要把明细抄进根 changelog。只改 .memory 不升版本。
- [能力面：CLI / Skill / MCP](project_capability_surface_cli_skill_mcp.md) — 能力面是 CLI、Skill、MCP 三者并列；仓根 bin/ 已删除；Note git 在 extensions/cli 的 TS；MCP 子进程调 edges note。禁止「必要时 MCP」或只写 CLI+Skill。新能力不要再加仓根脚本或把 npm bin 当一层。
- [Changelog 自动化：调研过，暂不生成正文](project_changelog_automation.md) — 考虑给仓库或 skill 自动生成 changelog 时：维持手写 Unreleased；若要自动化只切版本和校验，不要从 git log 生成条目。
- [classifyTasks 与 Task Project 元数据](project_classify_tasks_and_project_metadata.md) — 实现或改 edges tasks project / project-tasks-classify Skill 时打开：能力面 CLI + Skill + MCP；按用户已设质心做 LLM / agent 判断；无 embedding、无 classify 动词。第 4 步人闸是 project review-page（Markdown 表仅无 GUI 回退）。四个 project 动词都会 ensure。Skill 目录/id 是 project-tasks-classify（展示名 classifyTasks）。
- [classifyTasks 按已有质心分类；Task Project 元数据只做索引层](project_classify_tasks_and_task_project_metadata.md) — 改 Task Project 元数据、classifyTasks / project-tasks-classify 工作流或看板 AGENTS.md 时：只做索引/描述层（Q18=A），不把 Task 升成 Memory Type。按用户已设 Task Project 质心做归属建议（LLM / agent 判断），不要求 embedding。人闸主路径是 review-page（ADR 0012）。Skill 路径 extensions/skills/project-tasks-classify/；新类型走 proposeTypes（ADR 0011）。决策见 docs/adr/0010-classify-tasks-and-task-project-metadata.md。
- [CliContext 只装生产快照](project_cli_context_production_snapshot.md) — 改 edges CLI 的 CliContext / run() 入参时：只放 env 与 stdin 快照加 Commander 的 result；不要把 ingest、fs、writer、now 等测试替身塞进 Context。输出类型叫 CliResult，不要叫 RunResult。
- [new_note 收成 extensions/cli/edges，MCP 保留](project_cli_from_mcp.md) — 改 note ingest、new-note MCP 或 cli 时：本地 agent 走 extensions/cli 的 edges note；git 在 CLI 的 TS 模块；MCP 子进程调 edges note；鉴权 flag 留在 note 上；JSON stdout。不要把 CLI 放仓库根。
- [edges-cli 测试用 glob 而不是目录 test](project_cli_node_test_glob.md) — 跑 extensions/cli 测试时：Node 22 + tsx 下 `node --test --import tsx test` 会把 test/ 当成模块并找 test/index.json；用 './test/**/*.test.ts'。
- [对话整理采用复盘四栏](project_conversation_notes_fupan_four_columns.md) — 改 conversation-to-notes 或对话 Note 结构时：用复盘四栏；相关链接写入【补充说明】并附说明；不要复活已关闭的 FIA 中文换皮；不要批量改写旧笔记；不要把升 Edge 写进该 skill。
- [对话笔记：主题难点、过程结果、取舍补充、遗留转任务](project_conversation_notes_plain_rich_human_review.md) — 写 knowledge/notes：2.3.2 结构；结果遗留逐点问清后交 conversation-to-tasks（一次1～2条）。
- [conversation-to-tasks：背景+目标必填，人审后落库](project_conversation_to_tasks_body_review_persist.md) — 改 conversation-to-tasks 或从对话开卡时：背景→目标→动作→完成标准（后两栏可选）；必填不足先问；成文后交人审再 CLI 落库；STAR 用于制定任务非复盘。
- [project-memory 设计决策记录](project_design_decisions.md) — 成型过程中的关键取舍、翻案与待议；论证不进 PROTOCOL/LAYOUT。
- [Project Memory 系列 Skill 开发流程](project_development.md) — 修改顺序：协议 → 布局 → init → 其他非 doctor skill → doctor。
- [Task Issue 优先级用词档位，与 status 正交](project_edges_task_priority.md) — Task Issue 优先级为 urgent|high|medium|low|none，写在 metadata.edges-task-priority，与 status 正交、不搬状态夹。CLI 已落地 create/update --priority 与 list --sort priority；Skill/MCP 后做。决策见 docs/adr/0007-edges-task-priority.md；词 vs P0 调研见 knowledge/projects/tasks/2026-09-15--issue-priority-words-vs-p0.md
- [Task 看板按 Task Project 目录优先分组](project_edges_task_project.md) — 看板 Task Project 为 directory-first + frontmatter 双写；未分组用 _default。决策见 docs/adr/0009-edges-task-project-grouping.md。CLI 已按 docs/superpowers/plans/2026-09-16-edges-task-project.md 落地；status 只在同 project 内移动。
- [edges tasks 本轮只做 CLI](project_edges_tasks_cli.md) — 本轮 edges tasks 看板操作只做 CLI（list/get/create/update/status + 只读 runs/run-messages）；Skill 与 MCP 后做同一契约。决策见 ADR 0005。
- [七个 Task Project 占位已确认](project_evaluation_observation_placeholder_projects.md) — 改看板 Task Project 分组或往 knowledge/tasks/<slug> 落卡时打开：用户已确认七个空壳质心（project-memory、edges-tasks、edges-cli-platform、evaluation、observation、site-and-content、agent-clients-ux）；现有卡仍留 _default，等 classify/#78 再迁。仓根 evaluation/ 不是看板 project。
- [可扩展 Memory Type：LAYOUT 登记，不另开注册表](project_extensible_memory_types.md) — 可扩展 Memory Type：扩展面只在 LAYOUT，用 project-memory-add-type 登记；官方种子仍是六类。决策见 docs/adr/0006-extensible-project-memory-types.md。
- [前端图标默认 Lucide](project_frontend_icon_set.md) — 改审阅壳或后续前端图标时打开：默认 Lucide（按需、可调 size/color/stroke）。同一产品不混搭。tasks-review 折叠用 ChevronDown/ChevronRight，筛选关闭用 X，不要可见文字收起/展开/关闭。正文在 knowledge/notes/2026-09-25--前端图标选型.md。
- [普通记忆 frontmatter 跟 Agent Skills 闭集](project_frontmatter_metadata.md) — 改普通记忆条目的 YAML 头、或读旧扁平文件时：写入只留 name/description/metadata，实现字段进 metadata.edges-*；闭集以 https://agentskills.io/specification 为准。读取兼容顶层旧键。
- [Git 管理记忆的版本与共享范围](project_git_memory_management.md) — 概括 Edges 核心思想时：Git 管理还包括跟踪与忽略规则，例如 user memory 通过 gitignore 不随 Git 提交与共享；不能只解释成版本历史、分支和回滚。
- [idea→task→专家→Cloud Agent→改状态](project_idea_todo_expert_cloud_loop.md) — 工作流：idea 记到 knowledge/tasks（Task 记录员）→ 有空时专家 Agent 细聊 → Cursor Cloud Agent 开发 → 开发完改 Task 状态
- [本层硬约束写在 AGENTS.md 区块里](project_important_block.md) — 改 AGENTS.md 记忆形状、或决定一条规则该常驻还是进 .memory 时：点名 ask/remember，加上不检索就会做错的仓规，直接写进 project-memory-important；目录细则不进这里也不进 .memory。
- [v1 Langfuse 用官方 docker compose](project_langfuse_docker_compose.md) — 选自托管 Langfuse 的 v1 编排、或有人提出上 Kubernetes 时打开：用官方 docker compose（文档里的 Postgres + Langfuse 栈及其官方依赖），不用 k8s；本仓不提交带密钥的 compose。决策见 docs/adr/0016-langfuse-docker-compose.md。
- [自部署 Langfuse 与 Observation 产品卡分开](project_langfuse_infra_vs_observation_product.md) — 改自部署 Langfuse 卡、知识库 Observation 系统、或想把两者并成一条时打开：前者只做实例部署/运维/鉴权/备份；后者是 traces/logs/dashboard 产品语义。v1 验收先 UI 再 1–2 个客户端（ADR 0020）；更广接线留产品卡。决策见 docs/adr/0015-langfuse-infra-vs-observation-product.md。
- [v1 Langfuse 用 named volume + 偶发 tar](project_langfuse_named_volumes_manual_backup.md) — 选自托管 Langfuse 的 v1 数据面、HA 或备份方案时打开：Docker named volume + 偶尔手工/脚本 tar；无 HA。定时机外备份（NAS/云）是后续未做。决策见 docs/adr/0019-langfuse-named-volumes-manual-backup.md。
- [Langfuse 密钥只留 minigtr 磁盘](project_langfuse_secrets_stay_on_minigtr.md) — 写自托管 Langfuse 的 .env、密钥、compose 笔记或想把配置提交进 VirusPC/edges 时打开：密钥只活在 minigtr 磁盘（例如本机 services 目录）；本仓只留脱敏 ADR/说明。决策见 docs/adr/0018-langfuse-secrets-stay-on-minigtr.md。
- [v1 自托管 Langfuse 只走 Tailscale](project_langfuse_tailscale_only_access.md) — 改自托管 Langfuse 的 v1 访问面、或有人要立刻做公网 HTTPS/反代时打开：v1 仅 Tailscale；没有 Tailscale 就接受只剩 minigtr localhost/LAN。公网 HTTPS（反代+证书）是后续未做。决策见 docs/adr/0017-langfuse-tailscale-only-access.md。
- [v1 Langfuse 先证明 UI 再试 1–2 个客户端](project_langfuse_ui_then_few_clients.md) — 写自部署 Langfuse 的 v1 验收、或想一次接上 Grok/edges Agent 时打开：先证明 UI 健康，再试 1–2 个客户端；更广接线留在 Observation 产品卡。决策见 docs/adr/0020-langfuse-ui-then-few-clients.md。
- [记忆研究笔记落 knowledge/projects/memory](project_memory_research_notes_in_knowledge_projects.md) — 写 project-memory 的调研、优点、related work 等研究笔记时：落到 knowledge/projects/memory/；skill 层 .memory 只记协议与设计决策，不当成对外研究笔记落点。
- [整仓 MIT，不拆 knowledge 许可证](project_mit_license.md) — 给仓库选许可证、改 LICENSE 或 package.json license 字段时：整仓 MIT，不要给 knowledge/ 另开一份。
- [new-note MCP 的 ingest 约束](project_new_note_ingest.md) — 改 new-note 或新增 MCP ingest 时：TS+Node 编排，子进程调用 edges note，失败即停，返回机器可解析 JSON。不要 Python server，不要 in-process import CLI，不要再找仓根 bin/。
- [Node ESM + TS 相对导入写 .js](project_node_esm_ts_import_js.md) — 写 Node ESM TypeScript（nodenext、tsc 出 JS）时：相对 import 用 .js，不要写 .ts，也不要省略扩展名。
- [定期从目录职责提炼通用维护规范](project_periodic_architecture_review.md) — 复盘 Edges 目录架构时：按实际职责与维护对象识别可跨作用域复用的系统二模块，输出规范候选；维护任务管理是例子，当前仅记规范、不启用自动运行。
- [posts 对外展示，Astro 博客 + Actions CI](project_posts_public_astro_blog.md) — posts 面向对外展示；后续以 posts 为数据用 Astro 搭博客，并用 GitHub Actions 在服务器做 CI
- [仓内任务优先用仓库 Skill 与 CLI](project_prefer_repo_skills_and_cli.md) — 执行 VirusPC/edges 仓内工作时，优先调用本仓 Skill 与 edges CLI；不可用须向用户说明缺口，勿默认手搓绕过。
- [订阅管理盘点进展](project_progress.md) — 订阅/用量盘点进展：双 Gmail + QQ IMAP、国内 Kimi 无邮箱、CodexBar Linux CLI 已装待鉴权；后续 Apple/微信侧核对。
- [proposeTypes 从 _default 提议新 Task Project 类型](project_propose_types_from_default.md) — 改 propose-types 工作流或从 _default 发明新 Task Project 时打开：独立 Skill extensions/skills/project-tasks-propose-types/；经同一 review-page 确认，不自动 project create；方法是 LLM/agent 判断；配对 project-tasks-classify、ADR 0011 与 ADR 0012。本轮不写 skill 正文。
- [仓库用根 CHANGELOG 和 v 标签发版](project_repo_changelog.md) — 仓库发版先提 PR，合并后给 main 的合并提交打 tag 并发布。写 Edges 仓库级变更时用根目录 CHANGELOG.md 和 v 标签。Unreleased 的 ### 用功能模块原名（如笔记入库与能力面、文档与系统、任务看板与项目、Artifacts 预览），不要改成「模块：摘要」或只留摘要；每条前面写成 `- **小标题：** 正文`，小标题白话摘要，正文不因精简文风大段删实现说明（示例 commit a80d1b0）。用人话写清「现在能做什么」，同一条里立刻给出真实命令名；对照 [1.2.0] 的完整句，不要堆 schema 字段表。枚举写仓库英文原值（优先级是 urgent/high/medium/low/none）。不要摊成扁平长列表，也不要把决策/术语/计划逐条写进去。 新版本不留 Changed 等未按模块归类的兜底小节；切版时检查重复、条目顺序与已落地范围。
- [审阅页侧栏筛选用 design A（选中染色 + 未选变淡）](project_review_page_sidebar_filter_design_a.md) — 改审阅页左栏项目筛选外观时打开：选中用 accent 实线边加面板底；未选中 opacity 0.6（hover 拉回）；拖过时外扩 outline，须和选中边叠得开。类写在 ProjectColumn，不改点击或拖放。用户 2026-09-17 选定 design A。
- [审阅壳外观 2026-09-24 收口](project_review_shell_chrome_2026_09_24.md) — 改审阅壳外观或信息密度时打开：顶栏左侧是 Edges；项目悬停出 description；卡片以标题为主；空状态列不占宽；桌面右栏是 Markdown 抽屉。不窄于 md 的交互按 ADR 0022。窄于 md 按 ADR 0023 纵向长滚动，不是盖住看板的抽屉。
- [根硬约束只留聚光灯、脱敏与 git](project_root_important_scope.md) — 改根 AGENTS.md 硬约束时：只留 ask/remember 聚光灯、硬约束写在本区块、公开仓脱敏、git 纪律；bin/scripts 路径约定和交互口吻不进硬约束，也不进 .memory。
- [根 README 以知识闭环为唯一主线](project_root_readme_direction.md) — 设计或修改根 README 时：个人 RSI 是当前实践，知识闭环是主线；四视角六思想，递归维护与树图结合归为递归树结构，ADR 按系统实现的思想顺序组织。
- [递归目录采用统一节点模型与自身维护空间](project_scope_first_content_ownership.md) — 节点模型：BaseNode 提供 path 与可选 parent/children，Internal 从索引派生 children；service CRUD；设计未实施
- [系统一／系统二按作用域建模，区分 harness 层级与自进化](project_scoped_systems_and_harness.md) — 讨论根、作用域或 RSI 时：根可面向任意选定主体或系统，维护空间承载系统二；个人 RSI 是当前实践，角色随作用域变化，不预设唯一绝对根或固定组织层级。
- [v1 自托管 Langfuse 落在物理机 minigtr](project_self_hosted_langfuse_on_minigtr.md) — 改自托管 Langfuse 的 v1 宿主、或默认往阿里云/云 VPS 上放时打开：宿主是物理机 minigtr，按多数时候在线的小型服务器运维；双系统仍在但 Windows 不是日常路径。不是阿里云或其它云 VPS。访问面见 ADR 0017。决策见 docs/adr/0014-self-hosted-langfuse-on-minigtr.md。
- [跨机器跨 Agent 的 harness 放 shared-extensions](project_shared_extensions.md) — 新增不绑定 Edges 的 skill / MCP 配置 / plugin / hook 时：放 shared-extensions；接入 Edges 的能力仍走 extensions。不要用「换机器带得走」当进 extensions 的充分条件。
- [Skill 独立发版，changelog 按 skill 分](project_skill_independent_versioning.md) — 决定 changelog、tag、semver 粒度时：每个 skill 一份，不要 extensions/skills 总 changelog。
- [skills 按「谁有权改写」分成两类](project_skill_ownership_split.md) — 为什么否掉 .memory→.agents 改名，改成 skills（自动沉淀）与 agent_skills（只索引）两个类型；两份入口为什么都放 .memory/；为什么没平铺进 local 区块。
- [AGENTS.md 要点名 ask 和 remember](project_spotlight_ask_remember.md) — 决定 AGENTS.md 要不要点名 skill、或觉得 skill 自己的说明就够时：要点名 ask 和 remember，因为 skill 一多，模型不一定会自己加载它们；不要点名 init/doctor/reshape，也不要在入口里写整套工具怎么用。
- [STAR 用来制定任务（尤其给 agent），不是复盘](project_star_for_agent_task_formulation.md) — 写/派 agent 任务时用 STAR 同构排正文（背景→目标→动作→完成标准）；不要拿 STAR 写复盘。
- [系统设计目标：三件事尽量一键](project_system_one_click_deploy_ingest_output.md) — 改根 README 的系统实现、或讨论 Edges 产品方向时打开：设计目标是一键部署底座、一键接入 Agent 客户端、一键产出对外资产；这是方向，仓库按这个方向收敛。不要另开顶级章节，也不要用它取代知识闭环主线。
- [Task Doc 字段真源是 JSON Schema](project_task_doc_json_schema.md) — 改 Task frontmatter、CLI 的 Task 文档类型，或看板条目的 doc 时打开：字段真源是 extensions/cli/schemas/task-doc.v1.json（name、description、metadata、body）；不要自造轻量配置，也不要另开看板顶层 schema。决策见 docs/adr/0022。
- [Task Project 审阅页是 render-only CLI](project_task_project_review_page_render_only_cli.md) — 改审阅壳或 edges tasks project review-page 时打开：仍只渲染、无 --mode。桌面三栏见 ADR 0022。窄屏同一页纵向分段，滚动必须能到顶也能到 Details。章节头是过渡色面，状态行贴背景且比章节小一档。筛选入口是 ListFilter 图标。双击章节标题滚到该节，回到看板滚到当前卡片。不要视口面板。源码在 apps/tasks-review-app/。
- [Task 正文分节事实/idea，并一句话讲清问题与结果](project_task_separate_facts_from_idea.md) — 写/改 Task 时：分节事实/idea + 一句话讲清问题与结果；对话开卡走背景→目标→动作→完成标准；STAR 用于制定 agent 任务。
- [Tasks 核心思想：与 /goal、loop engineering 同构](project_tasks_align_goal_and_loop_engineering.md) — 设计或验收 tasks 时：目标+完成标准要与 /goal、loop engineering 一起想；开卡时完成标准可暂缺、grill 后补；沉淀结论时同时写清背景上下文。
- [Task 看板变更优先走 edges tasks CLI](project_tasks_board_mutations_via_cli.md) — 任务记录员等 agent 改 knowledge/tasks 时优先走 edges tasks CLI 与已有 tasks Skill（如 project-tasks-classify）；缺口上报用户。本条是根 prefer_repo_skills_and_cli 的看板特化。
- [tasks 只追加直接推 main](project_tasks_direct_main.md) — 往 knowledge/tasks/ 写只追加速记时，直接提交 main、不提 PR
- [持久 /tasks/ 看板站：复用 review-page，扩展 Deploy](project_tasks_persistent_board_site.md) — 改 /tasks/ 持久入口、list --group-by、或看板站 vs Artifacts 时打开：不新开 status station；复用同一审阅壳。不窄于 md 时为三栏且不写回 git。窄屏布局见 ADR 0023。决策见 docs/adr/0021、0022 与 0023。
- [工作项叫 tasks，支持状态流转](project_tasks_with_status_not_todos.md) — idea→专家→Cloud 工作流下，目录与概念用 knowledge/tasks/（非 todos），按 Task Project 再按 edges-tasks-status 分夹流转
- [ECS 上 edges 用 Actions SSH 整仓 pull](project_teach_site_rsync_push.md) — 改 teaching、/tasks/ 或 ECS 部署时：SSH 只在 deploy.yml 的 deploy job；production 不挂 url；site-teaching 与 site-tasks 都 needs deploy，分别登记 https://edges.viruspc.tech/teaching/ 与 /tasks/；summary 列两个 URL。不要拆成两次 SSH，不要用 teach.* 或裸 IP。不要新开 workflow（ADR 0021）。
- [todos 只追加直接推 main（已由 tasks 路径取代）](project_todos_direct_main.md) — 旧约定：往 knowledge/todos/ 只追加速记曾直接推 main；该路径已删除，现行入口见 tasks_direct_main
- [项目记忆的类型集合](project_type_set.md) — 官方 init 种子仍是六类；类型集合由 LAYOUT+本层登记决定，不是 PROTOCOL 闭集。可扩展见仓库根 ADR 0006。类型入口现为复数目录下 AGENTS.md（ADR 0012）。否掉把 docs 等示例写进默认种子。user 进仓且 gitignore；v1 不做晋升。
<!-- project-memory-entries:end -->

## 原模块：extensions



# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。



## 原模块：shared-extensions



# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。



## 原模块：knowledge/notes



# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。对不上 `user` / `feedback` / `reference` 时也走这里（兜底）。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。



## 原模块：knowledge/tasks



# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。



## 原模块：extensions/skills/project-memory-init



# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。
