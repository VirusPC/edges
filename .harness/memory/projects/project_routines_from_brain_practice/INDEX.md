---
name: project_routines_from_brain_practice
description: >-
  设计 routines 时打开：INDEX.md
  记录，仓库为接入依据；平台每次读Skill，默认最新可指定，失败停止报告；首版适配全部现有例程，无调度器和分组。
metadata:
  edges-title: Routines 记录定义，由外部平台接入执行
  edges-type: project
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-26T00:41:15+08:00'
---

routines 是从公开 brain 现有实践提炼出的 Edges 定义记录模块。仓库是外部平台接入时的依据，平台每次运行前读取仓库 Skill；实际触发、启停和执行属于接入平台，Edges 本轮不实现调度器。

**Why:** 用户先提出将 brain 的 routines 升为框架模块，明确首版不加 Project 分组。2026-10-26 第一轮 grill 选择日复盘作为首个案例、按 scope 放在 `.harness/routines`；并在 Q3 评论中明确：「不用管。这里只是记录，真正的触发器可能是在其他平台。这里主要是做个记录，方便其他平台的agent如grok bot读取后接入。」这澄清并替代助手此前将「是的」解释为 Edges 自带调度运行时的记录。第二轮用户确认仓库是接入依据、用 INDEX.md 承接 schedule.md、每次运行前读取 Skill，避免日程与执行内容在平台和仓库分别维护。

**How to apply:**

- 已确认：日复盘首例；routine 定义默认位于当前 scope 的 `.harness/routines/<name>/`，沿用既有 scope/super 体系；不加 Project 分组。
- 已确认 Q4：仓库记录是接入依据。Agent 按记录配置平台；修改日程后须另行更新平台，文件修改本身不表示已同步。
- 已确认 Q5：`INDEX.md` 承接原 `schedule.md` 的日程及 Skill 引用，不保留两份日程真源。执行内容仍是 Skill，可在同目录或引用别处；同目录文件共享目录移动/删除生命周期。
- 已确认 Q6：平台每次运行前读取仓库中的 Skill，不以接入时复制的完整提示词作为日常维护真源。第三轮已确认：默认读仓库默认分支最新内容，允许指定分支、tag 或 commit；读不到 Skill 时停止本次并报告，不静默使用旧副本。
- 保留平台自身日程的表达方式，不把各平台格式合成跨厂商统一调度 schema。
- Q3 的「单独启用」按具体评论澄清为平台行为。Edges 不新增 enabled、enable/disable、server、run 或调度进程；不追问漏跑、重试、进程锁等实现。文件存在不能证明平台已接入或已运行。
- 第三轮已确认首版交付框架模块与现有全部 routines 适配，包括日复盘、周复盘、会话导出。模块包含初始化、记录增删改查、发现索引及 Agent 使用说明；不自动修改外部平台触发器。
- 用户第三轮补充「默认最新，可以指定」：把版本选择写入记录与接入说明，由平台执行；不新增 Edges 仓库读取运行服务。
