<!-- project-memory-type:start -->
name: feedback
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->

# FEEDBACK — 纠正与约束

> 记：用户给出的纠正、明确确认过的做法，以及必须始终生效的禁止模式和它的原因。
> 不记：读代码就能看出来的写法，以及 `AGENTS.md` 已经写过的规则。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。
> 本文件只是索引，条目区块由脚本重算，正文写在 `feedbacks/feedback_<slug>/index.md` 里。

<!-- project-entries-local:start -->
## 本层内容

- [Skill 分发：能不要的不要，必须留的软链](feedback_agent_skills_hub_symlink/INDEX.md) — 整理仓库或本机 .xxx/skills 时：能读 .agents/skills 的不占目录；Claude Code 只留软链，禁止实体拷贝。commands 目录不适用。
- [task 是 from.type，不是顶层字段](feedback_artifact_from_task_is_kind/INDEX.md) — 改 artifact meta / edges artifacts publish 的 from 时打开：task 是 from.type 的一种来源，不要再写顶层 task 或 from.kind；v1 可选 from 只允许 \{type:task,id,project\}；CLI 是 --from-type / --from-id / --task-project。
- [Artifacts 文档写用例×能力，不写盒上当天状态](feedback_artifacts_docs_use_case_matrix/INDEX.md) — 改 Artifacts 预览 README / edges artifacts / 根 README 指针时打开：只写用例×能力（CLI、HTTP、review-page、Action）；不要写某台机器当天是否已迁、verified 日期或当前可达状态。
- [artifacts nginx 只认 teaching.conf 与 /teaching/](feedback_artifacts_inject_teaching_only/INDEX.md) — 改 setup-nginx / inject\_nginx\_include.py 或盒上站点文件时打开：文件是 /etc/nginx/conf.d/teaching.conf（TEACHING\_CONF）；前缀只认 /teaching/；不要双认 teach.conf 或 /teach/；遗留先改名再 migrate-teaching-nginx-prefix.py，然后 edges artifacts server setup-nginx。
- [artifacts server CLI 用 setup-nginx，不要 snippet / server init](feedback_artifacts_server_cli_no_nginx/INDEX.md) — 改 edges artifacts server 命令面时打开：公开面是 install（保证 env、不 start）/ start\|stop\|restart / status / setup-nginx。没有 server init。不要 nginx-snippet、nginx-setup、configure-proxy。
- [artifacts server install 不启动进程](<feedback_artifacts_server_install_not_start/INDEX.md>) — 改 edges artifacts server 的 install/start、或想把装 unit 和拉起进程合成一步时打开：install 在已有 ~/.config/edges/edges.env 上保证 token、装依赖/unit/enable，不 start；文件不在就报错并提示 edges config init，不读 artifacts\-preview.env；start/stop/restart 只做进程生命周期。
- [能力面必须 CLI / Skill / MCP 并列](feedback_capability_surface_three_peers/INDEX.md) — 写能力面标题、Why、How-to 时：三者并列；禁止「必要时 MCP」、禁止用「一个 CLI + 一份 skill」当本仓简称。
- [根 changelog 不要堆 schema 字段表](feedback_changelog_no_schema_dump/INDEX.md) — 写根 CHANGELOG Unreleased 时打开：用人话完整句写能做什么，对照 \[1.2.0\] 的语气；不要把 schema 字段表、flag 汤或运维细节塞进一段。小节标题与条目前小标题只看 project\_repo\_changelog，不要另写一套。缘起 https://github.com/VirusPC/edges/pull/110。
- [classifyTasks 按已有质心归类，不要求 embedding](feedback_classify_tasks_centroids_not_embeddings/INDEX.md) — 写或改 project-tasks-classify / classifyTasks 时：按用户已设 Task Project（标题+描述）做归属建议，用 LLM / agent 判断；不要写成 Embedding-based 最近质心分类，不要要求 embedding，也不要把方法名写成 K-means。Embedding / 真向量分类另卡。缘起 https://github.com/VirusPC/edges/pull/78。
- [reference 的 description 必须带关键链接](feedback_description_must_include_urls/INDEX.md) — 写或更新 .harness/memory/references/\* 时：description 与类型入口索引行必须带关键 URL，不能只写在正文 Links。缘起 https://github.com/VirusPC/edges/pull/45。
- [本作用域的维护模块登记在本层](feedback_harness_modules_are_local_scope/INDEX.md) — 划分 AGENTS 本层与下层索引时：维护当前作用域的 evaluation、tasks、observation 等属于本层，不因模块有独立入口或验证职责就归下层。
- [知识闭环的反馈回到捕获](feedback_knowledge_loop_returns_to_capture/INDEX.md) — 绘制或描述知识闭环时：反馈必须重新成为输入并回到捕获，不能绕过捕获直接进入生产或沉淀。
- [不要再给本仓库装 OpenSpec](feedback_no_openspec/INDEX.md) — 规划与决策写 .memory，禁止 openspec init 以及把 skill/command vendor 进仓库里的 agent 目录。
- [teach 工作区放 knowledge/teaching，不放 .teaching](feedback_teach_workspace_location/INDEX.md) — 为 teach 技能新建教学工作区时：一律放 knowledge/teaching/\<topic\>/ 并在 knowledge/teaching/README.md 登记；不要写到 .teaching/。
- [断言仓库事实前先跑能证伪它的命令](feedback_verify_before_asserting/INDEX.md) — 汇报仓库、git 历史或工具行为的事实时：先跑验证命令，别把推断说成查过的。工具输出的显示形态不等于文件内容。

- [系统入口由用户对目录 init，不按路径禁配](<feedback_harness_markers_not_task_project_indexes/INDEX.md>) — 改任意目录上的 AGENTS.md 时：系统入口由用户自行 init 决定，不按路径白名单禁配；未 init 勿伪造。配套 project harness init skill 待办。

- [grill 与设计讨论必须当轮 remember](<feedback_grill_must_remember_settlements/INDEX.md>) — 做节点模型/系统二设计讨论或 grill 时：用户确认的取舍与纠正当轮用 edges memory remember 落库；不能只改 CONTEXT 或留在对话里。翻案则更新同一 slug。
- [traverse 不兼容 includeDescendants](<feedback_no_include_descendants_compat/INDEX.md>) — 改 traverse / NodeService.query 选项时：不要再接受 includeDescendants；只要本层用 localOnly: true；默认仍是全部 children。
- [CLI 默认只做系统二操作](<feedback_cli_is_system_two_ops/INDEX.md>) — 改 traverse、scope 根或 tasks 查询入口时：同目录 README 不并进真 AGENTS；层入口本层可登记材料 README，默认 list 顺着它走到任务。\-\-super 仍是虚拟系统。
- [系统一内容经 SuperAgentsNode 当虚拟系统二](<feedback_content_via_super_agents_node/INDEX.md>) — 改 traverse/\-\-super/tasks 查询时：同目录 README 不并边；层入口可登记材料 README 供默认 list；\-\-super 把材料接到 scope 目录。无 includeContentFace。
- [traverse 单系统；森林根、Super 挂载与 domain 配置](<feedback_traverse_single_system_and_forest_roots/INDEX.md>) — 改 traverse/森林/Super/harness 材料 IO 时：domain/config/harness\-materials.json；Super 只挂 README；森林 BaseNode\[\]\[\]；edges forest list。
- [scope、super、all 的组合形成一切](<feedback_scope_super_all/INDEX.md>) — 改 edges 的 list、写任务、init、doctor、帮助、skill 或持久看板生成时：目录和登记分组只由 \-\-scope、\-\-super、\-\-all 与路径决定，不要再加 purpose、index\-group 或另一套全仓开关。
- [commands 不直接读 harness 材料表](<feedback_commands_do_not_import_harness_materials/INDEX.md>) — 改 CLI 命令时：不要在 commands 里 import harness\-materials；看板路径与是否存在走该领域 service。
- [模块 README 不写说明文字](<feedback_no_prose_in_harness_module_readmes/INDEX.md>) — 下放内容或补说明时打开：harness\-materials.json 登记的模块 README（含 \-\-super 视角下根上的 tasks/、notes/、projects/ README）只放标题与受管区块，不加正文；概念进 CONTEXT，命令用法进能力 README。edges/、archive/ 这类内容目录 README 可以写标准。
- [精简内容前先把要删的迁到合适去处](<feedback_migrate_before_delete/INDEX.md>) — 精简或拆分笔记、清单时：被删的条目先查在别处有没有归宿，没有就先迁过去再删，不直接删除。
- [grill 每轮经 html\-plan 发布到 Artifacts](<feedback_grill_rounds_as_html_plan/INDEX.md>) — 跑 grill 或交付实现 PR 审阅页时打开：默认 grill → html\-plan 打包 → Artifacts 发布并验证链接 → 用户 Copy response 回传；不要停在本地 HTML 或等用户提醒发布。
- [叠层 PR：底层 squash 前确认上层已合入](<feedback_stacked_pr_merge_order/INDEX.md>) — 合叠层 PR 或核实修复是否已在 main 时打开：底层 squash 进 main 前确认上层都已合进底层分支，合完把剩余上层改指向 main；PR 显示已合并不等于改动在 main。缘起 \#208/\#211 丢失，见 https://github.com/VirusPC/edges/pull/289。
- [复盘正文定稿后不改，评论写进同目录 COMMENTS.md](<feedback_retro_comments_in_separate_file/INDEX.md>) — 审阅或补记周复盘时打开：正文定稿后不再改，用户后续评论与进度写同目录 COMMENTS.md；更正往期也在往期目录加 COMMENTS.md，不动往期正文。
- [调研行业方案先并列多种，不擅自收敛](<feedback_survey_options_before_converging/INDEX.md>) — 用户要行业方案、主流做法或技术选型调研时打开：先并列多种方案并按用户约束逐条评估，不擅自收敛；说「常见」「主流」前要有依据。
- [CLI 遇到缺失的必需文件就报错，不自动补](<feedback_cli_fail_on_missing_required_files/INDEX.md>) — 改 cli 里读写节点或项目的命令时打开：读、列表、更新遇到约定必需文件缺失就报错，不补文件。系统一叶子的 create 例外：缺组织清单 README 时先创建再登记，不挂到 AGENTS。
- [CLI 多子命令一文件一个动词](<feedback_cli_subcommand_files/INDEX.md>) — 新增或修改 cli 的多子命令时：父文件只注册，每个子命令一个文件，commands 层只解析参数并调 Service。
- [CLI 放 packages/cli/](<feedback_cli_under_extensions/INDEX.md>) — 新增或移动面向 agent 的 CLI 时放 packages/cli/。2026\-10\-20 先翻案到仓库根 cli/，同日 workspace 化后再收进 packages/cli/。
- [Codex 唤起 skill 用 $ 不是 /](<feedback_codex_invoke_skill_with_dollar/INDEX.md>) — 在 Codex 里触发某个 skill 时用 $skill\-name；/ 是斜杠命令。/skills 只列清单。不要把认不到 skill 当成没装上。
- [禁止动词的 help 测例锚定命令行](<feedback_help_forbid_verb_line_anchor/INDEX.md>) — 写 edges tasks \-\-help 测例、禁止某个动词出现时：用 ^\\s\+verb\\b 锚定命令列表行，不要用 /\\bverb\\b/，以免 after\-help 的 “There is no X command” 被当成命令。
- [接口层方案进根 .harness/memory，不进 docs](<feedback_interface_plans_in_memory/INDEX.md>) — 写接入层调研或技术方案时：进根 .harness/memory（reference/project），不要放 docs/ 或 knowledge/projects，否则 ask 检索不到。
- [move 不改写软链接登记](<feedback_move_leaves_symlink_registrations/INDEX.md>) — 改 NodeService.move 或父级登记匹配时：软链接登记是指向别处的链接，不是节点本身；只迁移非软链接的那条登记，不改写、不删除、不重定向；断链是预期，交给诊断，不要在 move 里修。
- [新增文件不造新概念，名字一眼看懂](<feedback_new_files_no_new_concepts/INDEX.md>) — 在 cli 新增文件、目录或改名时打开：不引入抽象新词（如 classify.ts），文件名要一眼看出职责、符合语义；能并进已有文件就不另起。简单命名不等于降低分层质量。
- [不要加 edges\-note shim 或根目录默认 ingest](<feedback_no_edges_note_shim/INDEX.md>) — 改 edges\-cli 的 bin、默认命令或兼容入口时：只保留 edges；禁止 edges\-note 第二 bin / shim；根目录无子命令不得跑 note ingest。
- [目录 stem 保留 Unicode，名字校验仍要 ASCII](<feedback_node_stem_unicode_not_ascii_names/INDEX.md>) — 改笔记、项目目录名或任务名 slug 时打开：目录 stem 保留汉字；skill、memory、task project 的名字校验仍要求小写 ASCII，不要一起放宽。
- [Restore \-\-force 整份替换，不合并](<feedback_restore_force_replaces/INDEX.md>) — 改 user\-memory\-restore 时：\-\-force 先丢掉 users 与 USER.md 再解压（symlink 只删链接）；成员过滤不依赖 filter=data，拒绝非普通文件。
- [审阅壳竖线只拖宽度](<feedback_review_shell_dividers_resize_width/INDEX.md>) — 改审阅壳三栏分隔线或拖放时打开：两条竖线只调整左右栏宽度，不搬任务、不改状态。项目拖放仍只在左栏。2026\-09\-24 peng cheng 澄清。
- [审阅壳筛选靠右、紧挨导出](<feedback_review_shell_filters_before_export/INDEX.md>) — 改审阅壳顶栏筛选或复制导出 JSON 的位置时打开：全文和优先级、负责人、状态整组靠右，紧挨在导出按钮前面。系统名不在这一栏。
- [改 skill 后必须升级 version、写 changelog、打 tag](<feedback_skill_bump_version/INDEX.md>) — 更新 skills 下任何一个 skill 后，升 SKILL.md version，写 CHANGELOG.md，并打 skill/\<name\>@\<version\> tag。
- [根 changelog 从用户视角写](<feedback_changelog_user_perspective/INDEX.md>) — 写或切根 CHANGELOG 时打开：从用户能做什么、和以前差在哪来说；扫一眼 \#\#\# 与每条小标题要能列出关键模块变化；不要写 systemd unit/unit 等运维黑话，目录布局不要摊对照表。缘起 2026\-10\-25 审 \#41。
<!-- project-entries-local:end -->
