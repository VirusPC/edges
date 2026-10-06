# 节点系统简化：单实例、完整保存与树操作归属

状态：实现与自动验收已完成，等待独立复核；基线为 `e1283b7`。整体完成状态以实施计划的审阅记录为准。

## 目的与取舍

同一个 NodeService 内，同一入口路径只保留一个受管可变实例。多个调用方共享修改；保存这个节点时，写入它的完整当前状态。创建、移动、删除或导入需要维护其他节点的索引时，也保存那些受影响节点的完整当前状态。

用户明确不要求各调用方的未保存修改彼此隔离。取消“多个可编辑副本加三方合并”的合同，不增加 dirty 节点必须先保存的限制。舍弃自动合并并不是舍弃文件冲突检查：磁盘被其他 Service、进程或用户修改时，仍在写入前报错。

本补充设计替代 [目录节点模型](2026-10-05-directory-node-model.md)“生命周期与一致性”中的同路径多实例刷新和未保存副本自动合并两条。其他布局、类型、关系、作用域、索引、资源与写入边界维持原约定。实施时同步原 spec，避免保留两套现行合同。

用户进一步确认将树操作下沉纳入同一计划：单实例和树操作都作用于同一组 NodeService 调用链，分步提交、统一验收，不另建平行计划。

## 树操作与分层

纯节点关系算法归 operations：遍历次序、本层/下层/harness 关系选择、去重、环检测。将现有 `services/traverse.ts` 移至 `operations/traverse.ts`，保留独立函数，不新增 NodeTree 类，也不把文件加载放入 BaseNode。

用户随后确认采用通用布局：`src/operations/` 与 models、services、utils 同级，包含 traverse.ts、query.ts 及各个操作算法文件。traverse 依赖领域模型，查询链保持泛型，不限定 Node；两者均不承担文件 IO 或 CLI 编排。此决定替代早先仅把树操作放入 models/operations 的布局。

本轮只迁通用方法。用户讨论过将 Tasks 专用操作一起迁入，随后明确暂不执行；现有业务模块保持原位，仅更新对通用 operations 的引用。

Service 提供引用解析、范围限制与节点加载的现有回调，负责身份表、持久化、文件/资源快照及生命周期写计划。`operations` 不导入 services、文件读写或 NodeCache。异步遍历是按需调用加载回调，不代表模型拥有文件系统。

复用同一遍历内核处理三条调用链：query 的读取遍历、`#registered` 的登记节点收集、`#validateGraph` 的拟提交关系校验。后两者的根集合、关系范围、计划草稿覆盖、删除检查及范围外处理保留在 Service；只消除重复 DFS、seen/active 和环检测，不统一它们不同的业务范围。多根调用在一次遍历中共用去重和当前递归路径，不依次创建多个独立遍历来重复加载相交子树。

普通查询仍默认只走 localChildren，显式选项才走 descendantChildren/harness；写入前图校验仍只检查原有 composition 关系，不借重构扩大成 harness 校验。已登记节点收集仍保留既有维护关系范围和显式加载节点补集。`filter/map/groupBy/find` 属于通用集合查询，集中到 `operations/query.ts`，保持泛型能力；不下沉 Task 业务条件、不新增公共 enter/shouldEnter 回调。

## 实例身份

- 身份表属于一个 NodeService，不是进程全局单例；同一 Service 的 get、query、list 和内部已加载节点使用同一个对象。
- 键是规范化后的绝对入口文件路径，沿用现有路径处理；`index.md` 与同目录 `AGENTS.md` 是两个节点。不改为目录键、inode 键或全量 realpath 去重，避免混淆共址 harness 及外部只读链接。
- 重复 get 不重新 parse 磁盘正文覆盖内存修改，不推进原始写入快照。首次读取保留 EntryFile 快照；外部变化仍由现有校验拒绝。需要读取外部新版本时新建 NodeService，本次不增加 reload、reset 或合并 API。
- 首次加载非 AGENTS 叶子时，保留现有显式非 BaseNode 构造器选择及 models/modelForReference 扩展机制；未指定构造器或请求 BaseNode 时沿用模型解析。AGENTS 的权威模型仍是 InternalNode。缓存建立后，`get(path, Model)` 只约束唯一受管实例的类型，BaseNode 请求可返回子类；不相容请求报错，不能创建另一视图、替换实例或转换原型。代价是首次加载者决定叶子构造器，后续不同类型的调用方必须兼容该实例；将来若收紧为仅按布局选择，须另行迁移现有调用方。
- typed query 为跳过不匹配叶子而创建的导航占位对象，不是已加载节点，不得进入身份表或返回给结果消费者；不能为了满足单实例而加载原本跳过的正文。
- create 成功登记并返回传入实例；import 返回目标路径的唯一实例；失败或临时校验草稿不进入身份表。
- move 后更新同一对象的 path/id/关系和身份表键，覆盖已加载的被搬子节点；旧路径释放。destroy 从表中移除对应节点及所属被删节点，使旧对象不能再保存。之后同路径重新创建是新节点，不复活旧对象。

## 保存语义

```ts
const a = await service.get(parentPath, InternalNode);
const b = await service.get(parentPath, InternalNode);
// a === b
a!.setConstraints(["新约束"]);
b!.description = "新说明";
await service.update(a!, {}); // 新约束、新说明一起写入
```

多个引用上的赋值就是对同一个对象的普通顺序修改；同一字段以后一次修改为准，不再推导不同调用方的意图或合并嵌套 metadata。Node 自身已有字段方法的语义不变。

创建 child 要给 parent 添加索引时，计划以 parent 当前内存状态为起点：约束、正文、metadata 和新索引一起落盘。move/destroy/import 对其他节点的索引维护相同。不因为这些节点已有未保存修改而报错，也不要求额外 update(parent)。

仅保存本次生命周期操作实际影响的节点：传入的主节点、确实需要登记/改引用的节点、被移动的节点。为寻找引用而遍历到但没有关系变化的其他节点，不应因本身有未保存修改而被顺手保存。destroy 删除的节点无须先落盘其修改。

## 写入与失败

保留“构建完整写计划 → validate/快照检查 → 执行 IO → 回填原实例”的顺序。内部可用不受管的短命草稿验证及改写引用，这不构成多份可编辑节点。使用当前实例生成计划、使用旧 EntryFile 校验磁盘；不可从旧 source 构建计划而丢掉当前修改。

写入失败前不把操作新增的结构变更或路径提前提交到共享实例；调用方原有的修改保留。已有多文件恢复和错误报告继续使用，不新增事务框架，也不扩大为崩溃原子性保证。成功后只按实际提交结果回填实例和快照，不再 refresh 合并 dirty 副本。

NodeService 生命周期限定在一次 CLI 命令内，相关修改属于同一次操作；既有 Task 查询/写入与 Memory 工厂可因 managedRoot 或 hooks 不同而创建多个 Service，全部处于同一次写命令锁内，不跨命令保留实例。单实例身份只在各 Service 内成立，不通过全局 cache、session 或 DI 框架强行统一不同业务边界；未来若需跨这些视图共享对象，应另行设计边界。同一 Service 内的写调用按 await 顺序执行，不跨命令保留编辑会话。共享对象不提供独立编辑会话隔离。不引入 Unit of Work、事件总线或自动 flush 全部缓存。跨进程写协调采用下节的工作树锁，替代本设计早期“不引入并发写入锁”的范围说明。

## 命令锁与单文件原子保存

2026-10-06 讨论后记录的当前方案：一棵工作树共用一把写锁，采用 `proper-lockfile`；文件保存采用 `write-file-atomic`；保留保存前外部修改检查，冲突报错，不自动合并。按实际文件加锁是未来并发优化选项，尚未采用。

- **锁的范围：** 锁属于工作树，不属于单个 Node 或当前子 scope。父子 scope、兄弟 scope 的写命令取得同一把锁，独立 Git worktree 各用自己的锁；不能使用 Git common-dir 使独立工作树误共用锁。scope 仍决定业务操作范围，锁不会使操作自动加载或保存全树。
- **锁的生命周期：** 先解析稳定的工作树锁身份，再取得锁，然后创建本次命令的 Service、读取业务节点并执行写操作；完成或失败均释放。锁占用直接报错，用户重试，不引入任务队列。只读命令不加锁，不承诺多文件读取是一致性快照。
- **实现边界：** 命令编排在读操作前取得锁，服务层封装锁及文件 IO，models 不感知锁。直接调用 NodeService 不等于自动获得整个 CLI 命令的锁；不能只锁 save，因为那时可能已基于过期状态生成计划。实际锁根为规范化后的最近 Git worktree 根（不使用 common-dir）；非 Git 目录使用最外层物理 AGENTS.md 祖先，找不到时使用实际目标。发现阶段仅查文件元数据，不解析业务文档；不存在的目标按已存在祖先 realpath 加剩余后缀确定身份。锁路径为 `<os.tmpdir()>/edges-node-write-locks/<sha256(canonical-root)>.lock`，不进入内容目录、资源快照或 Git。
- **锁的机制：** `proper-lockfile` 使用原子 mkdir 创建空 `.lock` 目录，定期更新目录 mtime 作为心跳；释放时删除目录，过期后可尝试回收。它是协作式锁，不是 OS 强制文件权限。检测到持锁失效时采用 proper-lockfile 默认 compromised 处理器抛出错误并终止进程，不能吞掉错误继续写入。正常结束或业务异常在命令 finally 释放，释放失败也返回失败。
- **文件划分：** 新增 `services/node-lock.ts` 薄封装工作树锁；在已有 `services/node-files.ts` 接入原子写入并保留读取、快照检查和失败恢复。锁覆盖整个命令，原子写入处理每个文件，两种生命周期分别表达；不新增子目录、package、LockManager 或 AtomicWriter 类。
- **文件的保存：** `write-file-atomic` 负责临时文件写入、默认 fsync、rename 替换和清理。已有文件覆盖接入该能力；新建目标的存在性检查、目录移动/删除、附件处理和失败恢复仍遵守原有合同。替换成功后重新取得实际文件身份/快照再回填缓存，不能沿用被替换文件的 inode；不得放宽“外部同字节替换文件仍报错”的检查。
- **外部冲突：** 保留读取时原文及已有文件/资源身份快照，写入前检测变化，有冲突直接报错。不新增仅凭 mtime 的版本协议。编辑器不遵守 CLI 锁，检查与替换之间仍有竞态窗口；此方案不声称完全排除任意外部写入。
- **事务边界：** 单文件原子替换不等于多文件一起成功或失败。保留已有失败恢复与残留位置报告，不新增事务框架，不承诺进程崩溃时整次操作原子回滚。选用与项目 Node 引擎兼容的包版本，不能无条件安装最新版。

```text
确定工作树锁身份 → 取得写锁 → 创建 Service / 读取节点
  → 修改共享实例 → 生成并校验写计划 → 检查外部变化
  → 保存实际受影响文件 → 回填实例和快照 → finally 释放锁
```

## 决策过程与代价

| 讨论问题 | 结论与原因 | 接受的代价 / 未采用方案 |
| --- | --- | --- |
| 同路径多个副本为何需要 node-merge？ | 用户选择同一 Service 同路径共享实例，直接组合修改；取消副本合并前提。 | 不提供独立编辑草稿隔离；同字段遵循原有顺序修改语义。 |
| 关联索引操作保存父节点已有修改，会不会破坏操作边界？ | 用户澄清一次 CLI 只执行一个操作，Service 生命周期跟随命令；本次受影响节点的修改一起保存。 | 库调用方若复用长寿命 Service，也接受共享状态语义；不增加 dirty 父节点保存闸门。 |
| 开始和保存时比较时间戳是否足够？ | 外部检查沿用原文及文件身份快照；CLI 之间用写锁协调完整读改写过程。 | mtime 不是可靠的唯一版本号；不开发自定义并发协议。 |
| 是否需要两个库？ | proper-lockfile 协调写命令；write-file-atomic 避免单个目标文件出现半写入内容，职责不同。 | 增加少量依赖，但不自建锁心跳、过期回收和原子写实现。 |
| Star 少是否意味着不能采用？ | 以官方源码、实际依赖和版本兼容性为依据；有知名项目采用，不把具体库称为行业标准。 | 大项目采用不能替代本仓场景验证。 |
| 锁每个节点、当前 scope，还是工作树？ | 当前采用一棵工作树一把锁，因为一次操作可能修改父级索引或跨 scope 移动。 | 父子甚至兄弟 scope 的独立写也会争锁；这是串行化，不是数据写冲突。按实际文件加锁可提高并发，但涉及完整写集合和多锁顺序，暂不采用。 |
| 是否因此保证完整事务？ | 沿用已有恢复，明确单文件原子性和多文件恢复的区别。 | 不承诺数据库级事务或任意外部编辑器写入隔离。 |

本次选型核实的第一手资料：

- [proper-lockfile 设计与实现](https://github.com/moxystudio/node-proper-lockfile)：mkdir、mtime 心跳及失效检测。
- [VS Code 扩展发布工具 vsce 的依赖](https://github.com/microsoft/vscode-vsce/blob/main/package.json)与 [Shopify CLI 的依赖](https://github.com/Shopify/cli/blob/main/packages/app/package.json)：当前直接运行时依赖包含 proper-lockfile。
- [Next.js canary 的 next-dev 调用](https://github.com/vercel/next.js/blob/canary/packages/next/src/cli/next-dev.ts)：使用随 Next.js 编译打包的 write-file-atomic 保存开发状态，不代表其全部 IO 都使用该库。
- [write-file-atomic 实现](https://github.com/npm/write-file-atomic/blob/main/lib/index.js)：单文件原子替换；进程内排队不等于跨进程锁。

选型已接入：proper-lockfile 4.1.2、write-file-atomic 5.0.1（Node engines 为 ^14.17.0 || ^16.13.0 || >=18.0.0，覆盖本仓 >=20；不提高本仓引擎下限）。实现与整体回归的完成状态以实施计划及独立审阅为准。

实际加锁命令：note（其 dry-run 仍有本地写入）、tasks create/update/status、tasks project create/update、memory init/add-type/remember/restore、doctor --apply、非 --dry-run 的 migrate。Memory --target-dir、restore --repo-dir 是实际目标覆盖项；--root-dir 只是遍历边界，不改变被写入的目标。Note 沿现有配置从 scope 确定 Git 工作树。只读 doctor、migrate --dry-run、列表与查询不锁；Artifacts 配置/网络/服务器操作不属于节点锁范围。

现有文件由 write-file-atomic.sync 接管临时写入、fsync、rename 与失败清理；tmpfileCreated 时保存将要替换的 inode 与描述符，返回后先登记已写记录，再检查目标并回填快照，保证提交后检查失败仍被恢复统计覆盖。新建目标继续用原有独占硬链接提交，保留不可读最终 mode 的描述符与恢复路径。单文件替换及多文件恢复不扩大为崩溃事务保证。

## 与惰性查询、资源及只读边界的关系

- `.value()` 仍是查询执行入口；重复 value 重跑遍历和回调，复用节点实例不等于缓存查询结果。未保存的节点字段修改可被同一 Service 的后续查询观察到。
- query 首次只取得入口快照；get/list 可在同一对象上补充资源快照。补充资源前校验旧入口快照，不重新 parse 或将外部改动当成新基线；不得无条件重拍已有资源快照来掩盖附件漂移。
- 外部源变化、文件身份变化、符号链接、越界及只读来源的拒绝逻辑保留。同一路径经只读发现路径再次抵达时不得返回可写分身；保留现有保守只读传播。
- 文件正文的非受控区域及 YAML 正常解析/序列化仍由既有模型负责。保留正文不等于合并两份独立草稿。

## 删除边界

移除 NodeCache 的 `Map<string, Set<BaseNode>>`、alias 遍历、`#mergedSource` 和专供自动合并的 `assertRefresh`。删除 `node-merge.ts`、`node-text-merge.ts` 及对应三方合并测试；把仍有业务价值的测试改成共享实例、完整保存、外部冲突与失败保留测试。

确认无其他生产消费者后移除 edges-cli 的直接 `diff` 依赖并更新锁文件；若其他包仍使用它，仅保留那些包的依赖。保留 node-files、node-resources、layout、关系改写、校验草稿以及 NodeService 本身。树算法只调整归属并复用既有语义，不另加 BFS 等未需求能力、不改 Markdown 格式、不迁移真实内容。
