# Stencil《The Harness Playbook》：omp 的坑与 omp² 设想

> 日期: 2026-10-14（Asia/Shanghai）整理入仓。来源帖 [stencil_labs](https://x.com/stencil_labs/status/2095180623690207593)（2026-09-02），长文 [The Harness Playbook](https://stencil.so/blog/harness-playbook)（作者 Can Bölük）。书签夹：harness。

一句话：作者主张 **agent harness 是系统软件**，不是「while 循环套一层 fetch」；复杂问题要由 harness 内核扛住，而不是甩给每个 extension。

## 背景

Stencil 做开源 agent harness **omp**（文档站 [omp.sh](https://omp.sh)；扩展作者指南等可公开核对）。这篇是 omp 的复盘 + 继任架构 **omp²** 的 playbook：部分已落地，部分仍在推进（作者自述）。

帖子里提到 OpenCode、Pi、OpenClaw、omp 都在做大重构——**「多家在重构」是作者判断，未逐一核实其仓库状态。**

## 设计信封：先定产品形态

作者要求每个子系统都能扛住四种用法：

| 场景 | 要点 |
| --- | --- |
| Multiplexed workspace | 同目录多 agent / subagent |
| Remote driver | 手机/远端驱本地或云端 agent |
| Spectator | Web 旁观 |
| Factorio | SDK + 不信任输入的自动化工厂 |

由此推出五条后果（作者主张）：

1. **一份权威 session**（可 rewind / fork / resume / 复制）
2. **可信控制面在 host**（策略与 session 所有权不进沙箱）
3. **有界工作**（工具、子 agent、后台任务可取消、有限额、可观测）
4. **兼容性显式化**（模型/厂商 quirks 是结构化知识，不是散落 if）
5. **视图是投影**（TUI / Web / 远端 / 子 agent 检查器读同一状态）

## 状态：一份 journal，不要两套真相

**omp / Pi 的教训（作者）：** message tree 进了 journal，但 todo、重试计数、子 agent 注册表、流式标志等仍活在闭包 / Map 里 → rewind、fork、resume 会撒谎。

**证据（作者对 Pi 官方扩展示例的审计，文中数字为 78 / 60 无状态 / 17 有状态 / 仅 2 正确）：**

- 2026-10-14 在公开仓库 [earendil-works/pi](https://github.com/earendil-works/pi) 的 `packages/coding-agent/examples/extensions/` 下，顶层约 70 个 `.ts` 示例 + 若干子目录；递归计数约 87 个相关文件——**与文中「78」不完全同口径，总数可能已变；未重新做「有状态 / 正确」全量复算。**
- **已核对源码与文中描述一致的例子：**
  - [`status-line.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/status-line.ts)：`let turnCount = 0` 放在闭包，靠 `turn_start` 自增——rewind 后计数不会从 transcript 重算。
  - [`auto-commit-on-exit.ts`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/auto-commit-on-exit.ts)：挂在 `session_shutdown` 上做 `git add -A` + commit——若 `/new`、`/resume`、`/fork` 也会触发该事件，会把「切 session」和「进程退出」混在一起（作者指控；**事件是否在所有路径触发未在此逐路径跑通，标部分核实**）。
- 文中另列 `git-checkpoint`、`plan-mode`、`dynamic-tools`、`snake`、`bookmark`、`tic-tac-toe` 等失败模式；**除文件仍存在外，未逐条复现，标「未核实复现」。**

**omp² 主张：** 整份 session 物化成一棵树（文中用类 DOM / XML 示意），journal 存属性变更流；rewind = 对权威树做 diff。Controller 拥有状态，Actor（TUI / 远端 / inspector）只消费快照与 patch。

## 运行时：沙箱只执行，不决策

作者反对「把 executor / 整 app 丢进 VM」：要么要双向网关（DoS / 复杂度），要么泄漏 prompt 与源码。推荐：

- **Host**：session、推理、策略、工具路由、审批、限额、journal
- **Sandbox**：瘦 stub，只做有界执行；回传带宽必须封顶

子 agent 侧：worktree 只隔离 tracked 文件；文中提 `pi-iso` 用 APFS/btrfs/ZFS/overlayfs 等做整工作区 CoW——**产品能力细节标「作者自述，未独立验证」。**

工具契约：omp 旧式 `renderCall` / `execute` / `renderResult` 三回调拆开同一调用；omp² 把执行做成可取消的状态流，调用在 DOM 里是带 `<input>` / `<result>` / `<diag>` 的元素。输出截断、阻塞时长、后台化应是**库层默认**，不是每个工具自己抄一遍。取消需要真正能杀的边界（进程 / worker / VM），不能只靠协作式 AbortSignal。

扩展语言：omp² 选 **Python**（可自省 AST、便于 `@remote` RPC，并内嵌保证 `Eval`）——**选型为作者主张。**

## 控制面：convar + Director

**配置：** 借鉴 Source Engine 的 ConVar——在定义处声明作用域、持久化、复制、是否进 replay；session 级 convar 仍是 journal 树里的节点。

**循环所有权：** Plan / Goal / vibe / 提醒等不该各自发明 mutex。引入 **Director 栈**：`prepare_inference` 外→内，`on_yield` 内→外；可 Pass / Continue / Yield / Push / Done / Fail。Plan 模式用「未写 plan 文件则 ForceTool」一类语义表达——**强制 tool_choice 的厂商副作用由推理层翻译，不由 Director 硬编码。**

## 推理与工具面（摘录）

- 厂商 quirks 收成 taxonomy / classes / providers 规则书，编译器对歧义报错（作者称 omp 曾用巨型 boolean 矩阵）。
- Provider 不只是 `stream`：计数、embedding、语音、web-search、发现模型等都要进同一层，避免每个扩展自造 OAuth/重试。
- **强制工具调用策略（作者理想路径）：** 永远软提示 → 无副作用时再开原生 flag → 不遵从则有限重试并必要时付代价开 flag。
- 永久工具表有税：实验显示工具数量显著影响墙钟（文中给 omp vs Codex/Pi 数字）——**数字来自作者实验，未复跑，标「未核实」。** 长尾工具走稳定发现面（文中 `dyn` CLI / 代码面），而不是塞满 schema。
- Compaction 应提前投机做，再 splice 回主分支，而不是卡在上限时让用户空等最大的那次请求（作者主张）。
- 小本地模型适合标题、分类、情绪判断等 harness 杂务（作者主张）。
- 内置要深：`Read` 统一物化资源（目录、笔记本、办公文档、归档、URL、内部 URI…）；`Bash` 自带解析/策略感知，而不是裸 shell。

## 界面与栈

- 旧 `render(): string[]` 导致反复解析 ANSI、量宽、分配；作者称某会话渲染占大量 CPU，改为一遍流式 RichText 后从数百秒量级到 ~90ms——**性能数字未复现，标「未核实」。**
- 组件模型 + 语义色/图标策略归渲染器；transcript 用 block 生命周期（active → finalized → committed），并用 TLA+ 建模（附录 B）——**形式化规格存在性以文中附录为准，未独立跑 TLC。**
- 语言：作者对 TS 作 harness 内核持负面态度，omp² 内核偏 Rust、扩展 Python——**品味判断，非普适结论。**

## 认知要点

以下为作者观点的浓缩（非新事实），用于评估或演进 harness：

1. **Harness 更像游戏引擎的职责清单**：权威世界状态、日记、不可信动作、多视图复制、调度、协议适配、实时 UI——而不是「提示词 + 工具循环」的产品叙事。
2. **「简单好、复杂坏」常被误读**：Dijkstra 要的是可推理，Ousterhout 要的是模块作者拥抱复杂度、把它压进内核；扩展「好写」若建立在闭包状态与三段工具 API 上，可靠性会系统性漏掉。
3. **正确性来自「不可重放的状态不可表示」**，而不是更多文档或多加两个 hook；状态、取消、截断、兼容、渲染都应有单一可强制的所有者。
4. **Director 与推理层分工**：Director 只声明语义意图（如「下一轮必须 write」），推理层选最便宜且诚实的实现并按需升级；「支持某个 flag」不等于产品完成。
5. **永久工具表的代价是语法税与缓存失效**：动态发现需要稳定外壳，否则省了 schema、伤了 KV 缓存（参见 [prompt caching](../agent-infra/prompt-caching.md)）。
6. **用四形态信封做验收**：评估或自建 coding agent 客户端时，用 Multiplexed / Remote / Spectator / Factorio 四种形态做架构验收，而不只看本地对话是否好用。

## 和本目录的关系

本目录的 [命名与定位](2026-10-12--命名与定位.md) 把 **personal harness** 定义为「规则、记忆、技能和入口」。Stencil 文把 harness 抬到 **session 权威状态、沙箱边界、Director、推理 quirks、渲染协议** 一层。两边不冲突：前者是「人的外脑怎么约束 agent」，后者是「写一个可 rewind 的 agent 运行时还缺什么内核」。

若以后做 edges / Grok Bot 侧 harness 演进，可优先对照的可操作点：

1. 会话状态是否只有一份可物化权威源（含扩展状态）
2. 工具输出截断与取消是否是中心策略
3. 「再转一轮 / 强制调工具」是否有可组合原语，而不是散落 flag
4. 视图是否只读投影

## 来源

- 帖子：https://x.com/stencil_labs/status/2095180623690207593
- 长文：https://stencil.so/blog/harness-playbook
- omp 文档（扩展）：https://omp.sh/docs/extension-authoring
- Pi 示例仓库路径：https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions
- 部分要点整合自 2026-09-28 旧笔记（PR #148，未合入）。
