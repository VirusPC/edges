---
metadata:
  edges-type: task
  edges-task-project: edges-routines
  edges-updated-at: '2026-10-25T17:02:55.173Z'
  edges-title: Routines 模块：记录定义供外部平台接入
  edges-tasks-status: in_review
  edges-task-priority: none
name: routines_模块skill_与调度文件分离
description: Routines 定义记录模块与全部现有例程适配；默认最新可指定版本，平台读取执行，无调度器或分组。
---

**背景：** 用户要求把公开 brain 已有的 routines 提炼为 Edges 框架模块。已有日复盘、周复盘与会话导出实例采用日程和执行内容分离：日程文件引用 Skill，Skill 可放同目录或引用其他目录。调研与底稿在 [公开 brain 的 projects/routines](https://github.com/VirusPC/edges-brain-viruspc/tree/main/projects/routines)，历史来源是 [PR #219](https://github.com/VirusPC/edges-brain-viruspc/pull/219)。不把各平台格式合成共享调度 schema。

2026-10-26 第一轮 grill 后，用户进一步澄清：「这里只是记录，真正的触发器可能是在其他平台。这里主要是做个记录，方便其他平台的 agent 如 grok bot 读取后接入。」此前助手将「是的」理解为 Edges 自建调度器，这个理解已撤回。

**目标：** 建立 routines 定义记录模块，让外部平台 Agent 能发现、读取并按记录接入。首个案例为日复盘；routine 定义按 scope 放在 `.harness/routines/<name>/`，沿用 scope/super 体系；第一版不加 Project 分组。平台负责实际触发、启停与执行。

**动作：** Grill 已完成，按 research → plan → implement → validate 推进；实现框架模块，并适配全部三个现有 routines。保留日程与 Skill 分离，框架提供通用能力，个人例程由使用方持有。新能力按既有 NodeService、CLI 和 harness 索引约定接入。

**完成标准：** 模块初始化、CRUD、scope/super/all 查询和索引维护通过验证；三个 routine 的定义与引用可被外部 Agent 发现并读取；文档写明默认最新可指定版本、读取失败停止报告；不能将有定义文件当成平台已配置或已运行。首版不实现 Edges 调度器、启停、自动重试或运行队列。

**第一轮已答（2026-10-26）：**

- Q1：日复盘为首个案例。
- Q2：按作用域放 `.harness/routines`；该方案沿用 `--super` 对应根 `routines` 的既有语义。
- Q3：单选保留「单独启用」，评论明确本模块只记录，实际触发器可以在其他平台。按具体评论澄清，启停归平台，本模块不新增 enable/disable。
- 审阅页：[第一轮](https://edges.viruspc.tech/artifacts/69e64058-db04-46c5-801d-80dfc679e0b4/)（临时链接；本任务中的文字为长期记录）。

**Grill 设计树：**

- 根范围已定：定义记录模块；日复盘首例；scope 归属；无 Project 分组；外部平台执行。
- 记录关系已定：仓库是接入依据；日程变更后另行更新平台，不自动同步。
- 叶子入口已定：`INDEX.md` 承接原 `schedule.md`；执行内容继续用 Skill。
- 内容读取已定：平台每次运行前读仓库 Skill；默认分支最新内容，可指定版本；读取失败停止并报告。
- 首版范围已定：正式框架模块，沿用现有 Markdown 日程记录，并适配全部三个例程；无尚未回答的产品分支。

决定持续更新在 `.harness/memory/projects/project_routines_from_brain_practice/INDEX.md`。每轮 HTML 按 `grill → html-plan → Artifacts` 发布；本地源码与打包文件暂存在工作区 `.work/routines-module/review/`，不进入主线。

**第二轮已答（2026-10-26）：**

- Q4 `record-role`：仓库记录与平台配置以谁为准？推荐 `desired-definition`（仓库是接入依据）；另一选项 `platform-inventory`（平台是实际配置来源，仓库只登记现状）。两者均不包含 Edges 自动同步平台。
- Q5 `entry-file`：routine 的入口文件采用哪种方式？推荐 `index-entry`（用 `INDEX.md` 承接现有 `schedule.md`，日程只保留一份）；另可选 `schedule-entry`（保留 `schedule.md` 入口，扩展节点协议）或 `skill-entry`（用 `SKILL.md` 作入口，日程作附件）。同目录文件共享目录移动/删除生命周期。
- Q6 `skill-loading`：平台什么时候读取 Skill 内容？推荐 `read-each-run`（每次运行前读取仓库）；另一选项 `copy-on-setup`（接入时复制到平台，改动后重新同步）。若选每次读取，后续再明确读取版本和读取失败处理。
- 审阅页：[第二轮](https://edges.viruspc.tech/artifacts/78c9fffa-44b1-4a62-888c-7a56f28d628e/)（发布时有效期 24 小时；长期记录以本任务为准）。本地源码 `round-2.html` 与发布包 `round-2.packed.html` 在工作区 `.work/routines-module/review/`。
- 用户回传三项均为 `kept as proposed`：Q4 `desired-definition`、Q5 `index-entry`、Q6 `read-each-run`，已确认采用；上述其他选项保留为取舍记录。

**第三轮已答（2026-10-26）：**

- Q7 `source-version`：每次运行读取哪个版本？推荐 `default-branch-latest`（仓库默认分支最新内容）；另一选项 `pinned-ref`（固定 commit/tag）。
- Q8 `read-failure`：读不到 Skill 怎么办？推荐 `stop-and-report`（停止本次并报告）；另一选项 `last-successful-version`（由平台保留并标明上次版本）。这些是外部 Agent 接入约定，不新增 Edges 运行或缓存服务。
- Q9 `first-delivery`：首版交付范围。推荐 `module-and-daily`（框架模块加日复盘适配）；另可选 `module-only`（暂不迁移 brain）或 `module-and-all`（全部现有 routines 适配）。
- 整体提案：正式模块提供初始化、记录增删改查、发现索引和 Agent 使用说明；沿用通用 name/description 与现有 Markdown 日程，INDEX.md 引用 Skill。日复盘适配只调整文件与引用，平台配置另行接入。
- 事实依据：公开 brain 的日程已有 cron/timezone/platform/owner/skill，没有读取版本与 Skill 读取失败约定；Skill 内 main 是产出 PR 的目标分支，不能据此推断运行来源。
- 审阅页：[第三轮](https://edges.viruspc.tech/artifacts/1f68f6e5-99a4-40d6-b76c-d313e59492d6/)（发布时有效期 24 小时）。源码和发布包为工作区 `.work/routines-module/review/round-3.html` 与 `round-3.packed.html`。用户最终答复已记录如下。

- 第三轮最终答复：Q7 `default-branch-latest`，并补充「默认最新，可以指定」；Q8 `stop-and-report`；Q9 改选 `module-and-all`。先前未打开的默认值已由本次明确回传补齐。
- 实施布局：日复盘、周复盘按普通目录适配；会话导出带代码和 git submodule，保留其现有 Skill/代码目录，新 routine 定义引用外置 Skill，避免无关资产迁移。三条日程均以新 INDEX.md 为单一真源。

**Research（2026-10-26，已完成）：**

- 仓内：沿用 NodeService、稳定目录节点、scope/super/all、初始化材料登记和 JSON CLI。notes/projects 的 dated-leaf 强制日期前缀，不适合持续存在的 routine；以 skills service 的稳定名称与查询模式为参考。
- [Agent Skills 规范](https://agentskills.io/specification)：SKILL.md 适合作为执行指令真源；规范未要求每轮重读，这由本模块接入说明约定。复用现有 Markdown/YAML 解析，不加新依赖。
- [GitHub Actions schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)：平台拥有触发语义；不采用其专属配置作为跨厂商 schema。
- 选择：通用节点协议 + Markdown 日程 + 原有 Skill；不引入 scheduler、缓存、connector 或结构化日程校验。

**Implementation Plan：**

Goal：交付可发现、可维护的 routines 定义模块，并适配公开 brain 全部三个例程。
Architecture：RoutineNode 是 INDEX.md 内容节点；RoutinesService 经 NodeService 读写并登记 README；薄 CLI 使用已有写锁和统一查询范围。默认只在显式 routines init 或 init routines 时采用模块。
Tech Stack：现有 TypeScript、Commander、NodeService、Markdown/YAML；不增依赖。
Spec：本任务前三轮已确认决定与 project_routines_from_brain_practice 记忆。

- [x] Task 1：框架能力。创建 domain/models/routines/routine-node.ts、services/routines/service.ts、commands/routines.ts 与六个动词文件；更新 layout、models 导出与 modelAt、init modules/catalog、program 写锁、exclude/查询归类和 schema 入口。接口：createRoutine(env, {name, description, body?, metadata?, super?})；getRoutine(env,target,reach)；listRoutines(env,reach)；updateRoutine(env,target,fields,reach)；deleteRoutine(env,target,reach)；initRoutines(options)。名称稳定 kebab-case，目录无日期和 Project 分组。内容类型为 routine；body 不解析平台日程。显式路径只能操作对应 routine INDEX，不误操作别类节点。创建/更新/删除索引随 NodeService 同步。删除同目录 Skill 遵循既有目录生命周期，外置 Skill 不动。
- [x] Task 2：说明与模板。新增 edges-routines Skill（初版0.1.0及changelog）；更新框架/CLI README、领域模型文档和根 CHANGELOG。示例只包含通用 name/description、Markdown 日程及Skill链接；写清默认来源分支最新、可指定ref、每轮读取、失败停止报告、平台另行配置。叶子带示例不是自动装入的个人例程。
- [x] Task 3：公开 brain 适配。独立 worktree，迁移前输出冲突预览；用 NodeService/CLI迁日复盘和周复盘，入口统一INDEX.md；会话导出仅迁定义，引用现有外置Skill，保持代码/submodule。更新有效入口与当前任务/记忆引用，保留历史正文。脚本可重复执行且冲突时退出。
- [ ] Task 4：Validate。有意义的集成测试覆盖init幂等、CRUD与索引、稳定名称、scope/super/all/compose/exclude、同名歧义、非法路径及只读不补缺文件、同目录与外置Skill生命周期。运行类型检查、相关CLI回归、三例程读取/链接检查；独立代码审阅并修复。完成后提交可审阅PR与Artifacts页面，不自动merge或改平台配置。

命令验证形状：
```sh
edges --scope <scope> routines init
edges --scope <scope> routines create daily-review --description "每日复盘" --body "# 日复盘"
edges --scope <scope> routines list
edges --scope <scope> routines get daily-review
edges --scope <scope> --super routines list
edges --scope <scope> --all routines list
```


**实施与验证（2026-10-26）：**

- 框架模块、edges-routines Skill、CLI 与文档已完成；公开脑三个例程全部适配。brain 提交 1e8489ac1464d0659bc99bb6bcf7b852a9faab61，审阅 PR https://github.com/VirusPC/edges-brain-viruspc/pull/384。
- Node 22.23.4：全量 CLI 回归 1140 通过、1 跳过、0 失败；最终 routines 用例 14/14 通过；TypeScript 与完整 CLI build 通过；新 Skill 随包收录。
- 迁移可预览与重跑，二次 preview/apply 均 changes=[]；list=3，get=3/3，48 条本地链接有效；导出代码和子模块未移动，历史正文与 posts 未改。
- 独立审阅已闭环：描述变更同步索引；损坏同级记录时写入前失败；已登记外部引用（含软链接）可读，未登记外部路径与越界写入拒绝。
- 实现取舍：routines 的 --super 显式遍历根 routines/README.md，保持其他模块共享 Super 行为不变；只增加 NodeService.query 对明确 README 根的支持。
- 验证环境使用系统临时目录的真实路径；macOS /var 软链接与工作区内 Git 继承分别会触发既有测试前提限制。
- 边界：叶子与索引仍使用既有 NodeService 分次写入，未验证磁盘故障注入；未发布 npm、未修改平台触发器。框架 PR 与 Artifacts 链接待交付后补齐。
