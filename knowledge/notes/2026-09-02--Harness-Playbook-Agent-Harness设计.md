# The Harness Playbook：Agent Harness 是系统软件，不是 while 套 fetch

> 日期: 2026-09-02  
> 来源: [The Harness Playbook](https://stencil.so/blog/harness-playbook)（Can Bölük / Stencil；omp → omp² 的复盘与设计手册）

【讨论主题】

Agent coding harness（omp / Pi / OpenCode / OpenClaw 一类）表面像「循环调模型」，实际要同时扛会话权威状态、沙箱执行、控制面、模型兼容、工具面、实时界面。文章用四个架构压力测试（同目录多 agent、远程驾驶、旁观、自动工厂）说明：只为本地交互 TUI 设计时，复杂度会漏到扩展和用户身上；可靠路径是把不可避免的复杂度压进 harness 模块。

【主要内容】

(事实与共识)

- **设计信封**：先定四类产品形态（Multiplexed workspace / Remote driver / Spectator / Factorio），再设计子系统。它们在本地远程、交互自主、信任边界、并发上拉开维度；只服务第一种容易把控制器塞进 TUI、状态关在闭包、扩展与引擎同进程、无限调用靠人救场。
- **五条贯通约束**：① 一份可日记化的权威 session；② 信任控制面留在 host，沙箱只接有界执行；③ 工具/子 agent/后台作业可取消、有上限与可观测；④ 模型/厂商 quirks 是结构化知识；⑤ 视图是投影，不是第二权威。
- **状态**：若权威状态不能从 journal 导出，rewind / fork / resume 都是假的。Pi 式 harness 常见「消息树 + 闭包/Map 里的第二真相」；作者扫了 78 个官方扩展例，有状态的 17 个里只有 2 个正确（计数、checkpoint、动态工具、plan-mode 等在 rewind/resume 后翻车）。omp² 方向：整棵 session 物化为一棵 DOM/树，journal 存增量 patch；runtime 对象可缓存，但不能另立真相。于是 rewind≈DOM diff，复制≈订阅 patch，渲染≈投影。
- **运行时**：host 拥有 session、推理、策略、路由、审批、限额与日记；沙箱里只放听话的执行 stub，回流带宽有界。子 agent 在文件系统层同理（如 copy-on-write 视图 + 回 diff）。工具不该是「preview / execute / renderResult」三段脱节 API，而应是有状态、可取消、可流式的元素生命周期；截断与阻塞预算是库层原语，不是每个工具手写；取消需要真杀边界（进程/worker/VM），不能只靠 AbortSignal 礼貌请求。扩展侧倾向 Python + `@remote`，让本地写法落地到沙箱，并固定 Eval 依赖。
- **控制面**：配置用 convar 式声明（作用域、持久、复制、是否入档在定义处写清），避免经 god object 手搓 dirty。跨轮「谁能接着跑」用可堆叠的 **Director**（prepare_inference / on_yield：Pass、Continue、Yield、Push、Done、Fail），plan/goal/force_tool/reminder 同一套组合，而不是各插件私有 mutex。
- **推理**：兼容性从巨型 if-provider 树拆成 taxonomy / classes / providers，编译器拒绝未知指令与歧义优先级，未知≠ false。Provider 不止 stream：鉴权刷新、重试、token 计数、搜索/生成/发现、原生控件应是共享基建。强制工具调用要软提示 → 无副作用时再开原生 flag → 不听话再有界升级。工具 schema 对模型方言要可修复；strict sampling 要管预算与语法方言。Compaction 应提前投机做，再 splice 回主分支，而不是卡在上限时让用户空等最大请求。小本地模型适合标题、分类、情绪等 harness 杂务。
- **工具面**：永久工具表有语法税（墙钟可差接近一倍）；目标是小而深的稳定语法 + 长尾经 `dyn`/Bash 或代码面发现。`Read` 把「物化资源」做深（目录、文档、库、档案、URL、artifact/agent/…）；`Bash` 应是可解释、可按能力点审批的命令语言，不是裸 shell。工具应有 intent、版本；AutoQA 给 agent 一条报工具体验的路径。
- **界面**：`string[]` + ANSI 作布局原语会把性能、安全和一致性一起拖垮；改为 RichText 单遍管线 + 类型化组件，语义色/图标归渲染器。Transcript 分块生命周期（active→finalized→committed），可变块与只追加块规则不同；逻辑历史与原生 scrollback 解耦，resize 有明确策略。作者用 TLA+（Elastic Speculative Slots）钉不变量。
- **语言栈**：语言选择是架构——默认与生态先验会塑造 agent 写码形态。omp² 倾向 Rust 核心、Python 扩展（生成质量、AST/`@remote`、Eval 可靠），而不是把扩展再拉回 TypeScript。

【认知更新】

(洞察与 Edge 雏形)

- Harness 更像游戏引擎职责清单（权威世界、日记、不可信动作、多视图复制、调度、协议适配、实时 UI），不是「提示词 + 工具循环」产品叙事。
- 「简单好、复杂坏」常被误读成推卸推理；Dijkstra 要的是可推理，Ousterhout 要的是模块作者「拥抱受苦」、把复杂度压下去。扩展里「好写」若建立在闭包状态与三段工具 API 上，可靠性会系统性漏掉。
- 正确性来自「不可重放状态不可表示」，不是更多文档或两个 hook。状态、取消、截断、兼容、渲染都应有单一可强制的所有者。
- Director 与推理层分工：Director 声明语义意图（下一轮必须 write），推理层选最便宜诚实的实现并升级；把「flag 支持」当成产品完成条件不够。
- 永久工具表的成本是生成时的语法税与缓存失效；动态发现要有稳定外壳，否则省了表、伤了 KV。

【行动指南】

(决策与后续动作)

- 评/做 coding agent 客户端时，用四形态信封做架构验收，而不是只看本地对话好不好用。
- 会话相关能力（rewind/fork/resume/复制/检查子 agent）先问：是否都能从同一 journal 物化？扩展状态能否只存在于权威树上？
- 工具与子 agent：统一「有界可取消 job」原语；截断与阻塞预算进库层；沙箱与 host 不要对调「谁做策略」。
- 多模式/plan/goal：优先可组合 Director（或等价物），避免入口处手写互斥 if。
- 模型兼容：quirks 进结构化规则与显式优先级；强制工具走软提示+有界升级；compaction 考虑投机分支。
- 工具产品：压永久表、加深 Read/Bash 一类原语；长尾走发现面；工具加 intent/version；需要时留 AutoQA。
- UI：组件描述语义，渲染器管主题与流式节奏；transcript 协议写清再改，避免「看起来能测」的伪验证。
- 与 Grok Bot / edges 任务相关：Artifacts 多类型预览、审阅壳、多 agent 上下文——可对照「视图是投影」「一份权威状态」「有界执行」三条，避免预览面各自变权威。

【补充说明】

(其他重要细节或备注)

- 文中 omp / omp² / Pi 为作者语境中的 harness 产品族；附录 A 列官方扩展状态失败复现，附录 B 为 Elastic Speculative Slots 论文与完整 TLA+，此处不展开公式。
- 任务来源：`knowledge/tasks/agent-clients-ux/todo/2026-09-09--待读-harness-playbook.md`（指派 Notes记录员；可跳过 grill-with-docs）。

【相关链接】

- [The Harness Playbook · Stencil](https://stencil.so/blog/harness-playbook)
