# REFERENCED — 引用技能

> 索引：当前作用域 `.agents/skills/` 原位正文或安装链接。正文可能由本仓编写，也可能来自外部。
> 本套工具只维护索引，不创建来源目录、不改写原位正文或安装链接。
> 每个条目链接相对本类型入口，指向当前作用域来源；不同真源同名保留，同真源别名去重。
> 可读且为空的来源才是空清单；来源缺失、断链或不可读会报告诊断，不能声称刷新完整。

<!-- edges-entries-local:start -->
## 本层内容

- [edges](<../../../.agents/skills/edges/SKILL.md>) — Edges 日常模块的总入口。要做这些事时加载本 skill，再打开 references 里对应的一份： 把外部 harness 仓库挂到当前 scope（edges compose add、list、update；add 必须带 \-\-description；不经手 git token）； 把一条 Note 入库（有 shell 用 edges notes，没有 shell 用 new\-note MCP；只写本地叶子，不要自己跑 git）； 用 edges routines 创建、查询、更新或删除例程定义，或让外部平台 Agent 按仓库记录接入（记录日程并引用 Skill，触发和执行由平台负责）； 对用户选定的目录初始化或刷新系统入口 AGENTS.md（仅当用户明确要求 init；标准命令是 edges init；各域 init 只初始化本模块）； 将 .edges/memory/users 的本机私有记忆打成归档，或从归档恢复（换机、删仓；目标已占用时须明确授权 \-\-force 整份替换）。 检索项目记忆用 edges\-memory\-ask，沉淀用 edges\-memory\-remember，新增 Memory Type 用 edges\-memory\-add\-type。 第一次接入用 edges\-onboarding。整理对话用 edges\-conversation\-to\-notes 或 edges\-conversation\-to\-tasks。 整板 Task 按已有 Project 归类用 edges\-tasks\-classify。 把会话接到 Langfuse 用 edges\-langfuse\-agent\-tracing。
- [edges\-conversation\-to\-notes](<../../../.agents/skills/edges-conversation-to-notes/SKILL.md>) — 将原始对话整理为可独立阅读的中文笔记（记录 \+ 复盘）：背景/主题/过程/结果/所学/行动指南/补充说明。 主题=一段主题\+难点列表；凡写做什么须带可选项与不做原因；取舍在过程保留并在所学与行动指南补充。 行动指南分主题层与细节若则。结果有未闭环项时逐点问清再交 edges\-conversation\-to\-tasks；必须保留原始材料引用。用户说整理/总结对话时使用；入库所选 scope 或 Project 的 Notes。
- [edges\-conversation\-to\-tasks](<../../../.agents/skills/edges-conversation-to-tasks/SKILL.md>) — 把对话整理成任务（背景 → 目标 → 动作 → 完成标准；后两栏可选）。必填不足先提问；成文后交人审（对话确认或 PR），再用 CLI 落库。看板文件进受保护的 main 必须开 PR，不要直推。
- [edges\-langfuse\-agent\-tracing](<../../../.agents/skills/edges-langfuse-agent-tracing/SKILL.md>) — 当用户要把编码 Agent 或 Grok Bot 的会话接到 Langfuse 时加载本 skill，再按表面打开 references。 本机 Codex、Cursor、Claude Code、OpenCode、Pi：安装以官方文档为准，补 environment（\*\-local）与设备 tags。 Codex Cloud（chatgpt.com/codex）：云端容器里官方插件、hooks、OTel 都用不了，改本机带外轮询写 OTLP；轮询脚本不在本仓库。 Cursor Cloud Agents：云端只执行仓库里的项目级 hooks，用包装脚本懒加载官方 cursor\-observability\-plugin。 Grok Bot 助手会话导出：步骤与环境变量在 references，导出脚本不随本包发布。 还没确定表面时不要装插件、改配置或写密钥。
- [edges\-memory\-add\-type](<../../../.agents/skills/edges-memory-add-type/SKILL.md>) — 在所选作用域或主题 Project 按 LAYOUT 登记一个自定义 Memory Type。仅当用户明确要求新增 type 时使用。官方类型按选择采用；不要把示例 type 写进 init 模板。
- [edges\-memory\-ask](<../../../.agents/skills/edges-memory-ask/SKILL.md>) — 用户提问或动手改代码前，按工作范围和主题 Project 检索已登记的项目记忆。不必等用户说搜索；本轮查过不重复。
- [edges\-memory\-remember](<../../../.agents/skills/edges-memory-remember/SKILL.md>) — 把可复用结论写入所选作用域或主题 Project 的已采用记忆类型并刷新索引。用户要求记住时必须用；被纠正、用户给出可用想法/约定/约束、或任务产出已验证、以后还用得上的结论时也要主动用。
- [edges\-tasks\-classify](<../../../.agents/skills/edges-tasks-classify/SKILL.md>) — 按真实 Project 的主题与正文整理 Task 归属，覆盖根板和已有 Project；用 edges tasks review\-page 交人审阅，收到导出 JSON 后以 tasks update \-\-to\-project/\-\-to\-default 落地。只在同一 owner scope 内移动，不手改目录，不改状态或优先级。
<!-- edges-entries-local:end -->
