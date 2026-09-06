# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [AGENTS.md 入口只留三类：硬约束、本层索引、下层索引](projects/project_agents_three_blocks.md) — 改 AGENTS.md 记忆形状、增减受管区块、或决定区块外留什么时：只保留 important / local / children；不要独立 auto 区块；硬约束种子是 ask/remember 聚光灯加「写在本区块」；区块外只留身份与指针。
- [项目记忆的技术关键点](projects/project_architecture.md) — 这套记忆的承重点、最脆的地方，以及技术选择的判断。
- [project-memory 设计决策记录](projects/project_design_decisions.md) — 成型过程中的关键取舍、翻案与待议；论证不进 PROTOCOL/LAYOUT。
- [Project Memory 系列 Skill 开发流程](projects/project_development.md) — 修改顺序：协议 → 布局 → init → 其他非 doctor skill → doctor。
- [本层硬约束写在 AGENTS.md 区块里](projects/project_important_block.md) — 改 AGENTS.md 记忆形状、或决定一条规则该常驻还是进 .memory 时：点名 ask/remember，加上不检索就会做错的仓规，直接写进 project-memory-important；目录细则不进这里也不进 .memory。
- [AGENTS.md 要点名 ask 和 remember](projects/project_spotlight_ask_remember.md) — 决定 AGENTS.md 要不要点名 skill、或觉得 skill 自己的说明就够时：要点名 ask 和 remember，因为 skill 一多，模型不一定会自己加载它们；不要点名 init/doctor/reshape，也不要在入口里写整套工具怎么用。
- [项目记忆的类型集合](projects/project_type_set.md) — 当前四类是否够用；否掉 docs 与仓库内 user；.memory 类型目录改复数与 skills 对齐。
<!-- project-memory-entries:end -->
