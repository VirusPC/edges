# Tasks

跨 Agent 接力的工作项看板。本层只放未归入 Project 的任务；主题任务由对应 Project 的 tasks 模块组织。

## 归属与目录

- 未指定 Project：`<scope>/.edges/tasks/<status>/<stem>/INDEX.md`。
- 指定 `--project P`：`P/tasks/<status>/<stem>/INDEX.md`；P 可递归拥有 `projects/Q`。
- Project 与 scope 分工不同：Project 聚合主题材料，scope 保留维护与权限边界。公共 Project 使用 `edges projects` 管理，不再有 Task Project、`_default` 目录或 `edges-task-project` 元数据。
- 全局 `--project` 选择来源范围；调整归属使用 `tasks update <target> --to-project <path>`，或 `--to-default` 返回当前 scope 的上层任务板。移动保持 stem、状态、优先级、附件和 Run Log。

## Task 与 Run

Task 表达工作项当前状态，Run Log 表达一次执行尝试；Task 状态不由 Run 状态推导。这个区分沿用 [ADR 0002](../../docs/adr/0002-knowledge-tasks-status-folders.md) 的设计背景。

Task 正文位于任务目录的 `INDEX.md`，Run Log 是同目录 `.{stem}.log.md`。资源随整个任务目录移动。历史 Run Log 保持原文，查询使用 `tasks runs` / `tasks run-messages`。

## 状态与优先级

状态目录与 `metadata.edges-tasks-status` 一致：`backlog`、`todo`、`in_progress`、`in_review`、`done`、`blocked`、`cancelled`。新任务默认进入 backlog；指派与进入 in_progress 表示认领开工。取消用 `tasks status <target> cancelled`；`tasks delete` 只返回这一提示，不删除 Task 文件。

优先级是独立字段 `metadata.edges-task-priority`：`urgent`、`high`、`medium`、`low`、`none`。改变优先级不移动目录；缺省为 none。使用 `create/update --priority`、`list --priority` 或 `list --sort priority`。

## 工作约定

Task 的 description 用一句话说明问题和预期结果；正文区分事实背景与想法，说明 Why、How 和完成标准，不塞执行流水。具体写法遵循 [edges-create-tasks](../../packages/skills/edges-create-tasks/references/conversation.md)。

任务推进采用 grill → research → plan → implement → validate → close；未通过验证不标 done，用户明确指定的流程优先。看板、索引与代码改动遵循仓库 [AGENTS.md](../../AGENTS.md) 的提交和审阅规则。

递归 Project 的迁移与边界见 [ADR 0052](../../docs/adr/0052-projects-as-recursive-material-groups.md)。

<!-- edges-entries-local:start -->
## 本层内容

- [edges\_promotion\_preparation](<backlog/2026-10-27--Edges-%E5%AF%B9%E5%A4%96%E6%8E%A8%E5%B9%BF%E5%87%86%E5%A4%87%E5%AE%9E%E9%AA%8CSkills-%E4%B8%8E%E5%9C%BA%E6%99%AF%E6%A1%88%E4%BE%8B/INDEX.md>) — 完成核心价值验证、Skills 接入梳理与场景案例文章，让 Edges 推广有证据、可接入、可复现。
- [edges\_case\_articles](<backlog/2026-10-27--%E6%92%B0%E5%86%99-Edges-%E5%9C%BA%E6%99%AF%E6%A1%88%E4%BE%8B%E6%96%87%E7%AB%A0/INDEX.md>) — 把确认的使用场景、实验结果和接入流程写成读者能理解并尝试的案例文章草稿。
- [edges\_case\_scenarios](<backlog/2026-10-27--%E7%A1%AE%E5%AE%9A-Edges-%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF%E4%B8%8E%E6%A1%88%E4%BE%8B%E7%B4%A0%E6%9D%90/INDEX.md>) — 围绕真实用户需求选择案例选题，整理过程、产物和证据，为场景文章准备素材。
- [locomo\_official\_rag\_single\_file\_followup](<cancelled/2026-09-16--LoCoMo%E5%AE%98%E6%96%B9RAG%E5%8D%95%E6%A1%A3%E8%B7%9F%E8%BF%9B/INDEX.md>) — LoCoMo 官方 RAG 单档（rag\-mode dialog、单一 top\-k）——冒烟基线过关后的可选跟进
- [project\-memory可扩展memory\-type](<done/2026-09-09--project-memory%E5%8F%AF%E6%89%A9%E5%B1%95memory-type/INDEX.md>) — project\-memory 可扩展 memory type；如无必要勿增实体，可用目录\+skill 新增 type，未必需要单独 JSON
- [todos更名为tasks并支持状态流转](<done/2026-09-10--todos%E6%9B%B4%E5%90%8D%E4%B8%BAtasks%E5%B9%B6%E6%94%AF%E6%8C%81%E7%8A%B6%E6%80%81%E6%B5%81%E8%BD%AC/INDEX.md>) — 工作项从 todos 更名为 tasks，并支持状态流转
- [todos需支持状态字段](<done/2026-09-10--todos%E9%9C%80%E6%94%AF%E6%8C%81%E7%8A%B6%E6%80%81%E5%AD%97%E6%AE%B5/INDEX.md>) — todos 需要统一状态字段，以闭环「开发完后修改 TODO 状态」
- [bin\_cli\_skill\_layering](<done/2026-09-11--bin%E4%B8%8ECLI%E4%B8%8ESkill%E5%88%86%E5%B1%82/INDEX.md>) — 对齐经典项目：能力面是 CLI \+ Skill 两层；仓根 bin/ 不作为给人的第三层
- [cli\_refactor\_commanderjs](<done/2026-09-11--CLI%E7%94%A8Commanderjs%E9%87%8D%E6%9E%84/INDEX.md>) — CLI 用 Commander.js 重构
- [tasks\_skill\_crud\_status](<done/2026-09-11--tasks%E9%85%8D%E5%A5%97skill%E7%BB%9F%E4%B8%80CRUD%E4%B8%8E%E7%8A%B6%E6%80%81%E6%B5%81%E8%BD%AC/INDEX.md>) — tasks 应提供配套 skill，统一增删改查与状态流转操作接口
- [task\_grouping\_like\_requirements](<done/2026-09-11--task%E8%BF%9B%E4%B8%80%E6%AD%A5%E5%88%86%E7%BB%84%E7%B1%BB%E9%9C%80%E6%B1%82%E7%AE%A1%E7%90%86/INDEX.md>) — task 需要进一步分组；可能在 tasks/ 与状态夹之间再加一层需求目录
- [box\_obsidian\_preview\_artifacts](<done/2026-09-11--%E4%BA%91%E7%AB%AF%E7%94%B5%E8%84%91%E8%A3%85Obsidian%E9%A2%84%E8%A7%88artifacts/INDEX.md>) — 在 Grok Bot 云端电脑安装 Obsidian，用于预览 artifacts（含 tasks 浏览）
- [user\_memory\_safe\_gitignore](<done/2026-09-11--%E5%AE%89%E5%85%A8%E5%BC%95%E5%85%A5user-memory%E4%B8%8Egitignore/INDEX.md>) — 如何将 user memory 以安全方式引入体系（结合 .gitignore），并考虑仓删后仍留在本机用户目录
- [tasks\_requirement\_priority](<done/2026-09-13--tasks%E8%A1%A5%E5%85%85%E9%9C%80%E6%B1%82%E4%BC%98%E5%85%88%E7%BA%A7/INDEX.md>) — Tasks 补充需求优先级概念：和状态、分组正交，用来排谁先做
- [show\_teach\_deploy\_status\_on\_repo\_home](<done/2026-09-14--%E4%BB%93%E5%BA%93%E4%B8%BB%E9%A1%B5%E5%B1%95%E7%A4%BAteach%E7%AB%99%E7%82%B9%E9%83%A8%E7%BD%B2%E7%8A%B6%E6%80%81/INDEX.md>) — 仓库主页展示 Deploy teach site 部署状态：README 徽章 \+ workflow Environment
- [locomo\_fork\_thin\_wrap\_edges\_submodule](<done/2026-09-16--LoCoMo-fork%E8%96%84%E5%B0%81%E8%A3%85%E4%B8%8Eedges-submodule/INDEX.md>) — LoCoMo fork 薄封装 \+ edges submodule，替换仓内 port harness
- [locomo\_eval\_pipeline\_smoke](<done/2026-09-16--LoCoMo%E8%AF%84%E6%B5%8B%E6%B5%81%E6%B0%B4%E7%BA%BF%E5%86%92%E7%83%9F/INDEX.md>) — 先跑通 LoCoMo 评测流水线（写入→检索→作答→打分）；不把分数当 project\-memory 证据
- [root\_repo\_release\_since\_v1\_1\_0](<done/2026-09-20--%E6%A0%B9%E4%BB%93%E5%BA%93%E5%8F%91%E7%89%88%E8%87%AA-v110-%E8%B5%B7/INDEX.md>) — 上次正式发版停在 v1.1.0（2026\-09\-09），距今约 11 天主线有不少能力变化未切版本；需要走一轮发版（定版本号、收 Unreleased、打 tag/release）。
<!-- edges-entries-local:end -->

<!-- edges-migrated-task-default:start -->
## 原未分组任务说明

# Default

Ungrouped tasks that have not been assigned a named Task Project.

## 本层内容
<!-- edges-migrated-task-default:end -->
