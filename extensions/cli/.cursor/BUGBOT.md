# extensions/cli 审查清单

只审查本次 diff 里 `extensions/cli/` 的改动。同一 PR 里该目录以外的文件不要用本清单挑错。

本文件放在 `extensions/cli/.cursor/BUGBOT.md`。Cursor Bugbot 始终加载仓库根 `.cursor/BUGBOT.md`（本仓没有这份），再从每个改动文件向上收集沿途的 `.cursor/BUGBOT.md`。因此本清单只在改动落在 `extensions/cli/` 时进入审查，不会套到 `extensions/` 的其他子目录。依据：<https://cursor.com/docs/bugbot> 的 Project rules。

对照实现读 `extensions/cli/README.md`、`extensions/AGENTS.md`、`src/program.ts` 和下面点名的 ADR。评论要指出文件、违反的是哪一条、以及应有的命令名、旗标或登记形状。清单没写的风格问题不要拦。

## 1. 顶层命令名跟文件夹，不留旧别名

`extensions/AGENTS.md` 本层硬约束：顶层 `edges` 命令能对上 harness 或领域目录时，命令名跟目录。硬切断，不留旧名别名。

- 不合格：新增或恢复 `edges note`、`edges skill`、`edges-note`，或用 `.alias()`、第二个 `.command()`、`package.json` 的 `bin` 键、shim 脚本把旧名指到新命令。
- 合格：可对齐的顶层名只有 `notes`（`notes/`）、`skills`（`.harness/skills`）、`tasks`、`memory`。`tasks`、`memory` 已经同名，不要为了对称再改。`artifacts`、`schema`、`forest` 没有同名文件夹，保持现名。不要新开 `evaluation` 或 `observation` 命令。
- 根 `bin` 只有 `edges`，指向 `./dist/index.js`。包名保持 `edges-cli`。不要恢复仓根 `bin/`，不要把 npm `bin` 写成能力面的一层。
- `edges` 不带子命令必须仍是用法错误（退出码 2），不能默认写笔记。
- 帮助文案里的示例命令必须用现行名字。`BREAKING RENAME` 可以说明旧名已不存在，但不能把旧名注册成可执行命令。

## 2. 能力面共用同一套领域契约

ADR 0004：能力面是 CLI、Skill、MCP 三者并列。Skill 在 `extensions/skills/`，MCP 在 `extensions/mcp-servers/`，都调用这里的 `edges`，不另写一套字段。

- 不合格：新能力只改 CLI，却把对外说明写成「CLI + Skill」或「必要时 MCP」；MCP 用进程内 import CLI，或改去调用仓根脚本；Skill / MCP 的旗标、JSON 字段、`errorCode` 与 CLI 不一致。
- 合格：新的用户可见能力，命令参数与成功/失败 JSON 只有一套。MCP 以子进程调用 `edges`（notes 路径是 `edges notes`）。Skill 文档里的命令与 `edges <命令> --help` 一致。
- `edges tasks` 的通用 Skill / MCP CRUD 仍是同一契约上的后续工作（ADR 0005）。不要在 CLI 里为「以后的 MCP」再做一套动词、旗标或 JSON。
- 已有专门命令的动词不要再实现一遍（ADR 0027）：`tasks delete` 不删文件，退出码 2，`reason` 指向 `edges tasks status <target> cancelled`；`memory create` / `memory update` 指向 `edges memory remember`。`notes`、`projects`、`skills` 的 list / get / create / update / delete 照常执行。

## 3. 类型目录列表在 README.md，层入口才是 AGENTS.md

ADR 0029：组织清单是 `README.md` 的 `project-entries-local` / `project-entries-descendants`。`AGENTS.md` 只放本层硬约束、本层系统维护信息、下层系统维护信息。类型目录未 init 成系统入口时，列表写在 README，不要因为有列表就新建 `AGENTS.md`。

- 不合格：Task Project、Memory 类型、Skill 类型的孩子列表写进 `AGENTS.md`；看板 `AGENTS.md` 里出现 README 型 project 链接或旧 `task-projects` 区块；普通写入顺手把旧区块迁移掉。
- 合格：`edges tasks project create` 写 `tasks/<dir>/README.md`（标题、描述、`project-entries` 列表），并在看板 `README.md` 登记。目录里已经有的 `<dir>/AGENTS.md` 只就地更新，不把这份 README 的列表搬进 AGENTS。
- 系统一孩子（不是 `AGENTS.md`，路径也不经过 `.harness`）在同目录 README 已有 `project-entries-*` 时，登记进那份 README。系统入口和 harness 材料才进 `AGENTS.md`。判定与 `src/services/node/node-layout.ts` 的 `parentEntryIn` 一致。
- 内容叶子入口是目录加 `INDEX.md`（Skill 是 `SKILL.md`）。不要把叶子改回单文件 `index.md`，不要改 `posts/` 正文。

## 4. 写操作和登记形状一致

`NodeService.create` / `update` / `destroy` 会改父级组成登记。命令层的写操作必须走这条路径，登记分组与读路径相同。

- 看 `src/services/tasks/write.ts` 的 `createTask`：默认 project 为 `default`，优先级默认 `none`，状态默认 `backlog`；写 `<stem>/index.md` 和空的 `.<stem>.log.md`；`service.create` 使用 `indexGroup: "local"`。改创建结果时，文件、sidecar、父级登记要一起变，不能只写文件不登记，或登记到另一套父级。
- `indexGroup` 只接受实现里已有的 `local` / `descendant`。子目录里的 `AGENTS.md` 相对父级是 descendant；同目录组成是 local。不要把系统一孩子登记成 descendant，也不要恢复 `includeDescendants`。
- 删除走 `destroy`，并清掉父级登记。`tasks status` / `tasks update --project` 移动整个任务目录（含 sidecar），状态与项目只在同一 project 内按既有规则变。
- `notes create`、`projects create` 只在选定 scope 的对应目录本地建叶子，不 commit、不 push、不开 PR。
- 范围只由根上的 `--scope`、`--super`、`--all` 决定。不要另加用途开关、index-group 全仓开关，或第二套「扫全仓」旗标。`--super` 使用 `SuperAgentsNode`（不落盘）；不要引入 `VirtualSuperNode`。默认 list 从真 `AGENTS.md` 走一棵树，不把同目录 README 并进这棵树的 children。

## 5. JSON stdout 和稳定参数

机器可读命令的 stdout 是一个 JSON 对象加换行。诊断、用法、日志写 stderr。

- 成功形状保持 `{"status":"success", ...}`，失败形状保持 `{"status":"failed","errorCode","reason"}`。不要改已有成功体里的 `command` 字符串（如 `create`、`project.create`、`notes.create`）。
- 退出码：成功 0；运行错误 1；用法或校验 2（`VALIDATION_ERROR`）；`AUTH_*` 为 4。
- 任务、笔记、项目、技能、记忆的 issue 层 stdout 是 JSON。`runs` / `run-messages` 默认表格，只有 `--output json` 才输出 JSON。`--json` 在已经恒为 JSON 的命令上保持「always on」，不要让它改变输出。
- `list --group-by` 只有一种信封：`{ groupBy, groups: [{ key, items }] }`，先筛选再分组（ADR 0028）。缺字段的 key 是字面量 `__undefined__`。不要恢复 `edges.tasks.grouped/v1`。未分组的 tasks list 仍是 `{ status, command: "list", tasks: [...] }`。
- 内容叶子旗标保持 ADR 0030 那张表：`list` 用共享 `--filter` / `--group-by`；`get` 和 `delete` 只收目标；`create` / `update` 用 metadata 加 `--body`，不用 `--content`。notes 不要加回 `--import-entry`、`--co-author`、`--mode`、`--dry-run` 或 token 旗标。
- artifacts 的来源旗标是 `--from-type`、`--from-id`、`--task-project`。不要写顶层 `task` 或 `from.kind`。`artifacts server` 的公开动词是 `install`（保证环境，不 start）、`start` / `stop` / `restart`、`status`、`setup-nginx`。不要加 `server init`、`nginx-snippet`、`nginx-setup`、`configure-proxy`。

## 6. 分层

- `commands/` 只做参数、stdin、stdout/stderr 和退出码，并且只从该领域的 `services/<module>/service.ts` 进入。本次 diff 不要新增 `new NodeService`，不要从 commands import `services/node/`、`harness-materials`，或该模块 `service.ts` 以外的文件。
- 单节点规则进 `domain/models`，集合算法进 `domain/operations`，完整用例进 `services`。operations 不反向依赖 services。
- `CliContext` 只放 env、stdin 快照和 Commander 的 result（以及已有的 `super` / `all`）。不要把 `fs`、`writer`、`now`、`ingest` 放进 Context。输出类型叫 `CliResult`，不要改叫 `RunResult`。
- 相对 import 写 `.js`。Schema 在构建期由 `build:schemas` 生成到 `dist/schemas/`，不提交，不在命令运行时现造。

## 7. 测试与类型检查

行为或命令面有变时，diff 里要有对应的 `extensions/cli/test/**/*.test.ts`。测试脚本必须保持 `node --test --test-concurrency=1 --import tsx './test/**/*.test.ts'`，不要改成把 `test` 目录当成一个模块（那会去找 `test/index.json`）。

类型检查是 `pnpm --filter edges-cli exec tsc --noEmit`，Node 基线 >= 22。改了命令注册却没有断言帮助文本或未知命令退出码的，指出缺哪条断言。

## 8. 不得引入构建期命令名冲突

命令树在进程启动、构造 Commander 程序时注册。同名会在这里直接抛错，到不了子命令逻辑。

- 同一父命令下，每个 `.command()` 的名字只能出现一次。不要为对齐名再注册旧名。
- 根命令保持 `.helpCommand(false)`。不要打开 Commander 内置 `help` 子命令，避免和自有命令抢名。
- 父命令的注册文件是 `src/commands/<name>.ts`，子命令放在 `src/commands/<name>/<verb>.ts`。不要再加 `src/commands/<name>/index.ts`：它和 `<name>.ts` 会在 `tsc` 输出里抢同一个模块路径。
- `edges init <module>` 与 `edges <module> init` 继续委托同一个 `services/init/service.ts`。不要再写一套会和现有 init 抢路径的初始化入口。
