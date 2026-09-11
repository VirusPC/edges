# shared-extensions

跨机器、跨 Agent 共享的个人 harness。目录约定与收录标准看 [README.md](README.md)。

<!-- project-memory:start -->

<!-- project-memory-important:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 `$project-memory-ask`；该沉淀用 `$project-memory-remember`。本轮查过不重复。
- 本层硬约束直接写在这个区块里，不要链到 `.memory` 文件。
- 接入或操作 Edges 的能力不放本目录，去 `extensions/`。
- 凭据只用环境变量占位，禁止把 token / key / cookie 写入本目录。
- 本目录 `skills/` 与 `extensions/skills` 的 skill `name` 禁止撞车。
- 本目录整层一份版本：改 `skills/` / `mcp/` / `plugins/` / `hooks/` 或发版约定后，升 `VERSION`、写 `CHANGELOG.md`、同一 commit 打 `shared-extensions@<version>`。禁止给单条扩展另开 version 或 changelog。只改 `.memory/` 不升版本。
<!-- project-memory-important:end -->

<!-- project-memory-local:start -->
## 本层记忆

下面六个是索引，不是正文。按条目说明挑要读的，再打开对应内容。

- [.memory/FEEDBACK.md](.memory/FEEDBACK.md) — 用户的纠正、确认过的做法与必须遵守的禁止模式。
- [.memory/PROJECT.md](.memory/PROJECT.md) — 进行中的工作、关键时间点，无法从代码或 git 历史推导的决策，以及项目内的规范。
- [.memory/USER.md](.memory/USER.md) — 绑定本仓库、不宜公开的个人材料（个人偏好、凭据与密钥）。本机文件，不进 git。
- [.memory/REFERENCE.md](.memory/REFERENCE.md) — 需求文档、设计稿、接口文档、监控面板等外部资料。
- [.memory/SKILLS.md](.memory/SKILLS.md) — 从会话里沉淀出来的可复用流程，动手前先看本层有没有现成的。
- [.memory/AGENT_SKILLS.md](.memory/AGENT_SKILLS.md) — 本层 `.agents/skills/` 下人写或装入的标准技能，工具只索引不改写。
<!-- project-memory-local:end -->

<!-- project-memory:end -->
