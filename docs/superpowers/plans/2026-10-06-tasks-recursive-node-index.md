# Tasks 递归节点索引 Implementation Plan

> **状态：用户已批准执行（2026-10-06）。** 先提交计划与已有默认作用域改动，再按任务实现、验证及补齐历史索引。
>
> **For agentic workers:** 用户确认后使用 `executing-plans` 按项执行；如选择分工，使用 `subagent-driven-development`，每个写入者独立 worktree。每项完成后核验，整体使用 `requesting-code-review`。

**Goal:** Task 按现有 AGENTS 规范递归登记，通过 NodeService 遍历查询；默认操作当前作用域的维护任务，同时提供完整的全仓 CLI 列表与看板总览。

**Architecture:** 单条任务是 TaskNode，任务总入口与项目分组入口是 InternalNode。底层以原生 AsyncIterable 驱动延迟查询链，filter / map / find / toArray / groupBy / mapValues / values / thru 仅描述计算，分组后仍可继续链式处理，统一由 value() 执行；类型条件尽早排除无关节点，调用方可根据节点属性或 metadata 提供条件与分组键；Tasks 层只解释业务字段、范围策略、投影与排序，不维护另一套查询算法。一次性脚本补齐历史索引，正常读命令不补索引。

**Tech Stack:** TypeScript、现有 NodeService / InternalNode / TaskNode、现有 Markdown codec、Node fs、node:test；不新增包或解析库。

**Spec:** [目录节点模型](../specs/2026-10-05-directory-node-model.md)、[README 系统实现](../../../README.md#系统实现)，以及用户本轮确认：“TaskNode 代表单条任务”“follow 规范递归索引”“根执行默认读取 .harness/tasks”“不能影响查看全仓 tasks”。

## 已确认的组织方式

```text
AGENTS.md                                  根作用域入口
  ├─ .harness/tasks/AGENTS.md               InternalNode：维护任务板
  │    └─ <project>/AGENTS.md               InternalNode：项目分组
  │         ├─ backlog/<task-a>/index.md    TaskNode：单条任务
  │         └─ done/<task-b>/index.md       TaskNode：单条任务
  └─ tasks/AGENTS.md                        InternalNode：领域任务板
       └─ <project>/AGENTS.md
            └─ <status>/<task>/index.md
```

- 分组在自身 AGENTS 的“本层记忆”登记单条任务，解析为 `localChildren`。
- 状态文件夹只承担物理分类，不为每个状态新造 AGENTS 或节点类型。
- 索引指向入口文件，允许跨过状态目录；物理 parent 与跨层发现仍按既有模型处理。
- 保留 AGENTS 的三块：本层硬约束、本层记忆、下层记忆索引。Task Project 的标题和说明保留在原位置；索引在受控区块内。
- 不增加 TaskBoardNode、TaskProjectNode、StatusNode，不把资源或 runlog 变成组成节点。

登记示例：

```markdown
<!-- project-memory-local:start -->
## 本层记忆

- [任务 A](backlog/task-a/index.md) — 任务说明
- [任务 B](done/task-b/index.md) — 任务说明
<!-- project-memory-local:end -->
```

## Global Constraints

- 沿用 `NodeReference { id, name?, description? }`、`localChildren / descendantChildren` 和独立 harness 关系，不新增第二套索引格式。
- 默认遍历 localChildren，不跟随 harness；includeDescendants 与 includeHarness 分别显式启用下层组成关系与维护关系。全仓视图开启两者，递归汇总各层任务，包括维护系统自身的维护任务；默认查询行为不变。
- `.harness/tasks` 属于当前作用域的本层维护内容，不因物理路径较深就自动变成下层。
- 普通任务板查询不进入任务板或单条任务自身的维护系统；全仓聚合显式跨维护层级。必须同时验证两种模式，不能只看目录名或深度。
- 索引解析、修改、序列化复用 InternalNode 及现有 codec；不在 Tasks 层手写第二套 Markdown/XML 正则解析器。
- 只在独立 worktree 修改；不读取私有 journal、用户记忆，不提交 Obsidian workspace，不部署、不合并。
- 批量迁移使用 TypeScript 脚本，默认预览、显式 apply、碰撞和源漂移先拒绝、重复执行零改动。
- 历史任务正文、元数据、目录位置、附件和 runlog 不变。本轮补索引，不再次移动任务。
- 查询只读，不能因为索引缺失而自动初始化、扫描补齐，或静默切回旧查询以掩盖遗漏。
- 全仓聚合保留 scope、purpose、project、stem 组成的身份，不凭同名 stem 去重。
- 全仓 CLI 与看板本轮一起交付：`edges tasks list --all-scopes` 汇总仓库内所有作用域及维护层级，默认包含 domain 与 maintenance；普通 list 默认仍是当前作用域 maintenance。不用 purpose 表达空间范围，`--purpose` 显式传入时仍用于用途筛选。
- 通用遍历、filter、group 不认识 Task 状态、优先级或项目字段；Memory、Skill 等节点复用同一能力。字段选择用 TypeScript 函数表达，不新增查询语言或查询依赖。
- 筛选结果与裁剪分支分开：filter 不匹配的父节点仍可包含匹配的子节点；不公开 `enter` / `shouldEnter` 回调；遍历范围由既有关系规则决定，可提前判断的类型条件阻止无关叶子加载，不能把任意 predicate 自动当剪枝条件。
- 提前结束整个遍历与裁剪单个分支分开；find 在 value 执行期间找到首个匹配后停止后续加载，不用于检查全部匹配或同名歧义。
- 查询链所有操作只描述计算；只有显式 value() 执行。借鉴 Lodash 显式 chain/value 语义，但实现仍用原生异步生成器，不引入流处理库。

## 当前缺口和执行起点

以下是执行前调查快照，不代表完成后的现状。已提交基线为 `935d3de`。当时公开任务：根领域板 5 条、根维护板 100 条，子作用域尚无任务，共 105 条；执行前须重新盘点，不能把这个数量硬编码进工具。

1. Task 总入口已引用项目分组，但多数项目 AGENTS 只有标题和说明，没有任务 children。
2. `board.ts:listTasksWithDocs` 和 `findByStem` 按项目／状态目录查询；`listProjectIds` 也扫描目录。
3. Task create/update/move 已使用 NodeService，但项目入口生成仍是旧格式，需要保证索引生命周期完整。
4. 全仓看板通过 `discoverScopes` 扫描物理作用域后逐板读取；它也需要改为从根入口沿登记组成关系与约定的 harness 关系聚合。
5. 当前有尚未提交的默认值试改：`README.md`、`extensions/cli/README.md`、`src/commands/tasks.ts`、`src/services/tasks/paths.ts` 和新测试 `test/tasks/default-purpose.test.ts`。这不是已验收实现。用户确认计划后先检查这些差异，再纳入任务 4；不要覆盖其他人的修改。

## 文件与职责

| 文件 | 调整职责 |
|---|---|
| `extensions/cli/src/services/tasks/project-meta.ts` | 项目入口采用既有 AGENTS 结构；更新标题／说明时保留索引与非受控内容 |
| `extensions/cli/src/services/tasks/node-query.ts`（新增） | 用 NodeService 查询；将 TaskNode 投影为现有任务列表格式；解释任务的板归属 |
| `extensions/cli/src/services/tasks/board.ts` | list/get/project discovery 接入节点查询；删除正常查询路径上的旧目录枚举 |
| `extensions/cli/src/services/tasks/write.ts`、`move.ts` | CRUD 前确保相应入口可用，复用 NodeService 的登记与移动一致性 |
| `extensions/cli/src/services/tasks/grouped.ts`、`generate-site.ts` | 由统一节点查询结果构造分组与全仓看板 |
| `extensions/cli/src/commands/tasks/list.ts`、`commands/tasks.ts`、Tasks 列表服务及投影类型 | 增加 --all-scopes；复用全仓查询、保留来源，兼容既有筛选、排序与分组 |
| `extensions/cli/test/tasks/all-scopes.test.ts`（新增） | 全仓 CLI 覆盖、子目录调用、用途筛选、来源分组及与看板一致性 |
| `extensions/cli/src/services/node-service.ts`、`traverse.ts` | 惰性遍历内核、延迟 query 入口、类型条件与分支剪枝；维护去重／环检测／harness 边界，不加入 Task 特判 |
| `extensions/cli/src/utils/async-query.ts`（新增） | 薄延迟查询包装与通用操作，value() 才执行；内部使用原生 AsyncIterable，不依赖节点模型或 IO |
| `extensions/cli/src/models/types.ts` | 保留遍历范围，补查询类型条件；不增加公开剪枝回调；任务业务范围策略仍由 Tasks 层提供 |
| `extensions/cli/src/services/tasks/index-migration.ts`（新增） | 显式历史索引补齐计划，独立于正常读路径 |
| `scripts/index-task-nodes.mts`（新增） | 批量预览／apply／报告入口，注册为 `pnpm migrate:task-indexes` |
| `extensions/cli/test/tasks/node-index.test.ts`（新增） | 索引协议、查询和 CRUD 生命周期回归 |
| `extensions/cli/test/utils/async-query.test.ts`（新增）、`extensions/cli/test/services/node-service.test.ts`（已有） | 构建无 IO、value 显式执行、类型排除、提前终止、上游关闭与范围语义 |
| `extensions/cli/test/tasks/task-index-migration.test.ts`（新增） | 历史迁移、保真、冲突、漂移、重复执行回归 |
| `extensions/cli/test/tasks/default-purpose.test.ts` | 默认维护板、显式领域板、根与子作用域一致性 |
| `extensions/cli/test/tasks/utils/generate-site.test.ts` | 全仓覆盖、来源身份、未登记目录不被静默收录、harness 边界 |

## Task 1：让项目入口和 Task 生命周期维护同一棵索引树

**Consumes:** 现有 InternalNode.parse/addChild/updateChild/removeChild/serialize，以及 NodeService.create/update/move。

**Produces:** 新建 Task Project 即为可组织 children 的 InternalNode；Task CRUD 后索引与实际入口一致。

- [ ] 先写生命周期测试，在临时目录创建板、分组和任务，直接用 NodeService.list 验证发现链；当前没有完整索引时应失败。

```ts
// root 是测试创建的临时作用域；显式 purpose 保证测试目标不随默认值变化。
await run(["--scope", root, "tasks", "--purpose", "maintenance",
  "create", "--title", "Indexed task"], { env: {} });
const board = path.join(root, ".harness/tasks");
const nodes = await new NodeService({ managedRoot: board }).list(board);
assert.equal(nodes.filter(node => node instanceof TaskNode).length, 1);
```

- [ ] 修改项目入口生成：保留标题与说明，在原 AGENTS 协议内初始化三部分；现有 `task-projects` 块继续位于总入口本层区块，不新增并行索引。
- [ ] 创建任务前确保目标项目入口存在并登记到任务板；随后让 NodeService.create 自动登记任务，不能“先创建文件，再由另一套扫描刷新列表”。
- [ ] 用已有 NodeService.move 处理状态与分组变化；验证旧引用消失、新引用可解析，runlog 和附件随原有目录生命周期移动。
- [ ] 验证 `project update` 只改标题／说明，不覆盖任务 children、本层约束、Pointers、其他人工正文；保留现有 Task 元数据校验行为。
- [ ] 写失败路径测试：目标冲突、非法元数据或受控区块损坏时，不留下成功任务与失败索引的半成品。只有通用 NodeService 确实缺少一致性保障时才修通用层。
- [ ] 运行 `pnpm --filter edges-cli exec node --test --import tsx test/tasks/node-index.test.ts test/tasks/scope.test.ts`。通过后提交独立变更：`refactor: maintain task composition indexes through node service`。

## Task 2：延迟查询链、显式执行与 Task 适配

**Consumes:** 任务 1 的索引树；既有 NodeService 加载、layout/索引合同、TaskListOpts、TaskListItem、TaskDoc、GroupedList 与 TaskBoardLocation。

**Produces:** 原生异步生成器驱动的延迟查询链，统一 `.value()` 执行；Tasks 查询不再枚举项目／状态目录。

### 用户已确认的执行语义

参考 Lodash **显式 chain / value** 的交互约定，但不引入 Lodash 或其他流处理库。构建查询时不读取任何文件、不调用源工厂，也不执行 predicate、keyOf 或 map 函数。filter / map / find / groupBy / toArray / mapValues / values / thru 都只记录延迟操作；唯一的查询链执行入口是 `await .value()`。

内部使用标准 AsyncIterable 和少量 for await / yield 实现，查询包装不承担树关系或领域职责，不再造 NodeTree。之前“groupBy/find 调用时立即返回执行中的 Promise”“不提供任何链式包装”“groupBy 后只能 value、结果为 Map”的草案已被本节取代。

```ts
// utils/async-query.ts：通用延迟计算，不依赖节点或文件系统。
export interface Deferred<T> {
  value(): Promise<T>;
  // 对整个结果继续变换；find 得到的单值也保持显式链。
  thru<U>(transform: (value: T) => U | Promise<U>): Deferred<U>;
}
// 数组和分组对象共用集合操作；对象的 item 是属性值。
export interface CollectionQuery<T, Result> extends Deferred<Result> {
  filter<S extends T>(predicate: (item: T) => item is S): AsyncQuery<S>;
  filter(predicate: (item: T) => boolean | Promise<boolean>): AsyncQuery<T>;
  map<U>(transform: (item: T) => U | Promise<U>): AsyncQuery<U>;
  find<S extends T>(predicate: (item: T) => item is S): Deferred<S | undefined>;
  find(predicate: (item: T) => boolean | Promise<boolean>): Deferred<T | undefined>;
  groupBy<K>(keyOf: (item: T) => K | Promise<K>): ObjectQuery<T[]>;
  toArray(): AsyncQuery<T>;
}
export interface AsyncQuery<T> extends CollectionQuery<T, T[]> {}
export interface ObjectQuery<V>
  extends CollectionQuery<V, Record<PropertyKey, V>> {
  mapValues<U>(transform: (value: V, key: string) => U | Promise<U>): ObjectQuery<U>;
  values(): AsyncQuery<V>;
}
export function query<T>(source: () => AsyncIterable<T>): AsyncQuery<T>;

// 节点相关范围约定留在 models/types.ts。
export interface ScopeTraversalOptions {
  includeDescendants?: boolean; // 默认 false；递归展开下层组成引用
  includeHarness?: boolean; // 默认 false；递归展开各节点的独立维护关系
}
export interface NodeQueryOptions extends ScopeTraversalOptions {
  types?: readonly string[];
}
// NodeService 新增入口；调用时只创建查询，不做 IO。
query(scopePath: string, options?: NodeQueryOptions): AsyncQuery<BaseNode>;
```

- **构建与执行分离：** 操作返回新的延迟包装，不修改前面的查询；不实现 thenable、隐式迭代或隐式 JSON 求值。`.value()` 才调用源工厂并执行，错误通过此次 Promise 拒绝返回。既有 `NodeService.list` 为兼容保留 Promise 接口，内部明确调用 `query(...).toArray().value()`；不新增另一套立即执行的 NodeService.find，查找用 `query(...).find(...).value()`。
- **一次执行的惰性：** 内核仍为先序 DFS。加载当前节点→yield→筛选／转换／消费→再请求下一个；不先加载整棵树，不预取、不并发读取。每次执行独立管理 seen/active，包含根的默认语义、已有引用顺序、去重和环检测不变。
- **类型条件减少加载：** `types` 明确指导加载前判断及产出类型。通过 layout、父索引合同判断为无关叶子的引用，不读取其正文；InternalNode 即使不在结果类型中，仍按需要加载以发现目标孩子。能证明整个分支都无关的合同才允许整枝排除；无法提前确定的引用必须继续解析，不能猜测。全仓模式还须保留维护入口发现：即使节点正文因类型不匹配被跳过，仍按 layout 检查其约定的 harness 入口；若现有合同不足以在不加载节点时确定维护关系，就加载必要导航信息，不能直接剪掉。复用通用合同，不在遍历中写 Task 路径特判，也不扩充 NodeReference 字段。
- **结果筛选与剪枝：** 任意 predicate 不能自动推导为分支条件，不分析函数源码。filter 不匹配当前节点仍可发现匹配的孩子。内部根据范围规则及可证明的类型合同选择待展开引用；不增加公开 enter / shouldEnter，也不以另一个公开 childrenProvider 回调替代它。按内容 metadata 判断仍需加载被检查的节点；无法证明整枝无关时不能剪枝。
- **范围：** 默认递归 localChildren；includeDescendants 显式允许 descendantChildren；includeHarness 显式允许沿独立 harness 关系递归，未启用时保持原有边界。每层先按索引顺序访问所选组成引用，再访问 harness；两类关系共享去重和环检测。维护内容的本层归属依据索引，不凭目录深度推断；不把 harness 塞入 children。全仓查询限定在选定仓库边界内，只沿登记引用及 layout 规定的维护关系发现入口，不枚举任意未登记物理目录。
- **继续链式：** groupBy 返回对象查询，仍可 mapValues、values、filter、map、find 或再次 groupBy；toArray 仍返回数组查询，find 返回可通过 thru 继续转换的单值查询。mapValues 保留对象键，values/toArray 转成值数组；对象上的 filter/map 按属性值操作并返回数组，与 Lodash 一致。例如 Task 分组后的 filter 接收 Task[]，不再接收单条 Task，类型系统必须反映这个变化。上面的接口是同一延迟包装的类型视图，不是新增几套查询引擎。
- **消费边界：** find 在 `.value()` 执行期间找到首个匹配就关闭上游；未找到返回 undefined。groupBy、toArray 和接收整体结果的 thru 是物化边界，在执行期间先消费完整上游，再交给后续操作。因此 groupBy(...).find(...) 只能提前停止查找分组，不能免去上游完整遍历；groupBy 前的 filter 仍逐条执行，只把匹配项送入分组。提前结束不验证未访问的分支，Task 同名歧义检查必须收集全部相关匹配。回调抛错或提前返回时用生成器 finally 释放此次遍历资源；访问到的相关坏链接仍报错。
- **字段与键：** predicate / transform / keyOf 可读节点属性、metadata 或组合结果。Task 内层业务 metadata 仍交既有 domainFields 解释。groupBy 按 Lodash 返回普通对象，使用 JavaScript 属性键转换：1 与 "1" 进入同一组，undefined 对应 "undefined"，symbol 保持 symbol；组内保留输入顺序。对象集合操作和 mapValues/values 按自身可枚举字符串键处理（不包含 symbol），遵循 JavaScript 对象枚举顺序，不承诺 Map 的键插入顺序。安全处理 __proto__ 等普通分组键，不修改对象原型或节点。
- **重复执行：** 与 Lodash 未 commit 的显式链一致，同一条查询每次 `.value()` 都重新执行待执行操作及回调，不隐式记忆计算结果。包装保存源工厂，不保存已消费的生成器；每次执行创建独立消费序列。底层 NodeService 缓存继续遵守已有合同，重复执行不承诺绕过缓存的磁盘实时快照；需要重新读取外部变化时使用新的服务会话。
- **兼容范围：** 对已列操作采用 Lodash 显式链的结果形态与继续链式语义，不承诺复刻整个 Lodash API。异步源、可等待回调、Promise 形式的 value 是本项目适配；当前集合回调以单个 item 为契约，不提供完整 collection 参数或 iteratee 简写。Lodash 的 commit 是额外的显式执行入口，本轮不增加；需要复用已求值结果直接保存 await value() 的返回值。保留类型排除和原生异步流式执行，不照搬 Lodash 对内存数组的优化策略。
- **依赖与版本：** 保持 Node >=20。不引入 Lodash、IxJS、RxJS、Effect Stream，不依赖尚未稳定的 AsyncIterator Helpers，不修改内置对象原型，不引入通用执行计划优化器。

语义依据：[Lodash 显式链](https://lodash.com/docs/#chain)、[groupBy](https://lodash.com/docs/#groupBy)、[mapValues](https://lodash.com/docs/#mapValues)、[value](https://lodash.com/docs/#prototype-value)；重复执行核对 [4.17.21 源码](https://github.com/lodash/lodash/blob/4.17.21/lodash.js) 的 wrapperValue / baseWrapperValue（每次重新应用 actions）。

调用示例（当前保守返回 BaseNode，显式类型守卫负责 TypeScript 收窄）：

```ts
const tasks = service.query(boardDir, { types: ["task"] })
  .filter((node): node is TaskNode => node instanceof TaskNode)
  .filter(task => task.status === "todo");
const summary = tasks
  .groupBy(task => task.priority)
  .mapValues((items, priority) => ({ priority, count: items.length }))
  .values()
  .filter(group => group.count > 0);                   // 到这里仍无 IO 或回调执行
const result = await summary.value();                 // 明确开始执行
const again = await summary.value();                  // 重新执行，不自动缓存结果
const firstTitle = await tasks
  .find(task => task.priority === "urgent")
  .thru(task => task?.title)
  .value();
const list = await tasks.toArray().map(task => task.id).value();
```

### 已确认：删除公开 enter；先明确范围职责

2026-10-06 用户确认：不能只凭名字的直觉扩展 API；调研之后，当前方案不再公开 enter / shouldEnter。剪枝能力本身有成熟先例，但当前需求没有证明任意调用方自定义分支回调的必要性。

- 默认不进入下一层 harness 是通用遍历的关系边界，不能依赖调用者回调维持正确。已确认的全仓需求使用显式 includeHarness 关系选项；不增加任意剪枝回调。
- 类型条件的提前排除由通用查询内部实现；必须保留导航节点，未知类型或无法证明无关的分支不能跳过。
- Tasks 的全仓覆盖属于业务范围定义，不能用任意回调代替定义。内部可组合待展开引用的选择逻辑，保持单一遍历内核；本次不新增另一个公开 provider 接口。
- 暂不支持任意调用方排除指定子树；未来出现独立的真实需求，再明确排除对象和判断时机后设计接口。

调研依据：[fs.walk deepFilter / entryFilter](https://github.com/nodelib/nodelib/tree/master/packages/fs/fs.walk#deepfilter) 分别控制深入与输出；[walkdir filter_entry](https://docs.rs/walkdir/latest/walkdir/struct.IntoIter.html#method.filter_entry) 同时排除条目和后代；[Python os.walk](https://docs.python.org/3/library/os.html#os.walk) 通过修改 dirnames 控制递归；[NetworkX neighbors](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.traversal.breadth_first_search.generic_bfs_edges.html) 通过邻居来源控制展开。这些 API 的语义和 I/O 时机不同，不能据此宣称存在统一命名，或与本项目的加载前引用选择完全等价。

### 已确认：全仓任务跨所有维护层级

2026-10-06 用户确认：全仓总览包含仓库内各层领域任务与维护任务，也包含维护系统自身更深层的维护任务。普通任务板查询仍默认不跨 harness；全仓聚合显式请求跨维护层级，不能以默认边界缩小覆盖范围。

```text
.harness/tasks/                                  根维护任务
notes/example/.harness/tasks/                    笔记维护任务
extensions/cli/.harness/tasks/                   CLI 维护任务
.harness/tasks/project/task/.harness/tasks/      单条任务自身的维护任务
```

以上是范围示例，不代表这些路径都已存在；只要按索引及目录合同可发现，全仓视图均应纳入。包括非 Task 节点的维护空间；不能因为其正文不匹配 task 类型，就停止发现其维护任务。

接口上采用显式关系选项 includeHarness，默认 false；全仓适配开启 includeDescendants 与 includeHarness，复用同一遍历内核。该选项是本项目合同，不宣称行业标准。harness 仍是独立关系，不改变 children、parent 或现有索引协议。未设置深度上限，递归到所选关系耗尽；重复入口去重，真实环报错。

```ts
// listRepositoryTaskNodes：全仓明确请求两类关系，普通板查询不传这两个选项。
return service.query(root, {
  includeDescendants: true,
  includeHarness: true,
  types: ["task"],
})
  .filter((node): node is TaskNode => node instanceof TaskNode)
  .toArray().value();
```

只按已登记引用及 layout 的 harness 约定发现，不恢复全仓物理扫描；不读取附件作为节点。相同节点经索引与维护关系重复到达只输出一次，按其物理归属计算 scope / purpose，不以首次到达的遍历路径改变归属。

本轮设计待确认项已收敛，用户于 2026-10-06 批准 commit 后开始实现；实现、校验和迁移的实际完成情况以任务勾选及执行记录为准。

### 本轮交付：全仓 CLI 列表

2026-10-06 用户要求全仓 CLI 一起实现，取代此前留到后续的范围说明。命令用 `--all-scopes` 显式选择全仓，和用途筛选分开：

```bash
edges tasks list                          # 当前作用域 maintenance
edges tasks list --all-scopes             # 全仓 domain + maintenance，含所有维护层级
edges tasks --purpose maintenance list --all-scopes
edges tasks list --all-scopes --status todo --priority high
edges tasks list --all-scopes --group-by project
```

- 全仓根使用现有作用域／仓库定位能力：从显式 --scope 或当前工作目录定位所在 Git 仓库根；无 Git 时以解析出的作用域作为根。进入子目录执行也不能把“全仓”悄悄变成该子树；所选根仍须具有合法 AGENTS 入口。
- 普通 list 保留当前作用域维护板默认值。全仓模式未显式传 --purpose 时包含两种用途；显式 domain 或 maintenance 才缩小用途范围，不能误将 Commander 的默认值当成用户显式筛选。
- CLI 与看板共用 listRepositoryTaskNodes 及领域投影，不另建发现逻辑。--status / --priority / --project / --sort / --group-by 继续作用于同一任务集合。
- 保持现有 JSON 输出 envelope；全仓条目保留 source.scope / source.purpose、project、stem 和入口路径，项目分组以 scope + purpose + project 区分，同名项目和任务不跨来源合并。普通单板输出保持兼容。
- --all-scopes 仅用于 list，不改变 create/update/status 的单板定位规则。

### Tasks 适配接口

```ts
// services/tasks/node-query.ts：领域投影与范围策略，不另写树算法。
export function listTaskNodes(target: TaskBoardLocation): Promise<TaskNode[]>;
export function listRepositoryTaskNodes(root: string): Promise<TaskNode[]>;
export function taskLocationOf(node: TaskNode, root: string): {
  source: { scope: string; purpose: TaskPurpose };
  project: TaskProjectId;
  status: TaskStatus;
  stem: string;
};
```

- [ ] 先写通用延迟执行测试。源是可观察执行次数的真实异步生成器：仅构建 filter/map/groupBy/mapValues/values/find/toArray/thru 时工厂和回调均未执行；`.value()` 后才消费。测试源无关节点业务，不引用 Task 路径。

```ts
let started = 0;
const input = query(async function* () {
  started++;
  yield 1; yield 2; yield 3;
});
let mapped = 0;
const grouped = input.filter(n => n > 1).groupBy(n => n % 2);
const summary = grouped.mapValues(items => {
  mapped++;
  return items.length;
}).values().map(count => count * 10);
assert.equal(started, 0);
assert.equal(mapped, 0);
assert.deepEqual(await summary.value(), [10, 10]);
assert.equal(started, 1);
assert.equal(mapped, 2);
assert.deepEqual(await summary.value(), [10, 10]);
assert.equal(started, 2);
assert.equal(mapped, 4); // 同一条链再次执行所有操作
assert.deepEqual(await grouped.value(), { "0": [2], "1": [3] });
assert.equal(started, 3); // 派生查询未修改原分组查询
assert.equal(await input.find(n => n === 2).thru(n => n! * 10).value(), 20);
assert.equal(started, 4);
```

- [ ] 增加 find 命中后不执行后续生成器语句、源 finally 执行、异步条件顺序等待、回调异常传播、空输入、对象键转换（1/"1" 合组、undefined、symbol）、__proto__ 安全写入及对象枚举顺序测试。多条派生查询互不修改；同一条链重复 value 使用新生成器并重新执行回调。补类型检查 fixture，验证类型守卫、map 改类型、groupBy 后 filter 接收组数组、mapValues 保留键、values 后继续 map/filter、toArray 后继续链式、find 后 thru。验证分组后 find 仍须消费完整分组上游；使用官方 Lodash 的固定输入／预期结果作为语义对照，不新增生产依赖。
- [ ] 最小实现通用延迟包装：源工厂保存为函数；filter/map 构造新的生成器工厂；find/groupBy/toArray 将消费循环包在延迟执行函数中；分组结果通过同一包装继续组合，mapValues/values/thru 也只追加延迟操作。禁止提前创建执行中的 Promise；包装中不出现文件系统、Task 或 NodeService 依赖。
- [ ] 将既有 DFS 改成 async function*，内部递归 yield*；NodeService.query 延迟创建并消费该源，list 只显式收集。测试构建查询后修改源 fixture，value 才能观察读取结果；完整查询和旧 list 保持原有错误与范围行为。
- [ ] 建立“Internal→Task＋Memory＋下层 Internal→Task”fixture。只查 task 时应得到两条任务，不因 Internal 类型不同剪断路径。无关 Memory 正文放无效 YAML，证明没有被读取／解析；相关 Task 放坏入口则必须失败。无法预先识别类型时不能静默丢弃。
- [ ] 验证范围规则及可证明的类型排除：不在选择范围内的引用不加载；范围内且无法证明无关的缺失引用必须报错。仅当已有合同能证明整枝无关时测试分支裁剪，不能为通过测试臆造合同。独立覆盖 includeDescendants、去重、环检测、默认不进入任务自身 harness、过滤父节点仍能命中孩子。
- [ ] 建跨维护层级 fixture：根领域板、根维护板、笔记与 CLI 的维护任务、单条 Task 的维护任务以及该维护任务更深一层的维护任务。普通查询只返回选中板的组成 Task；全仓查询精确包含所有这些 Task，按实际来源归属，不凭 stem 去重。覆盖两种关系重复指向同一入口只输出一次、真实环报错、类型排除不阻断非 Task 节点的维护入口发现；全部用临时公开测试数据。
- [ ] 为提前终止建 fixture：root→branch→hit，hit 有缺失孩子，root 有后续缺失兄弟。find 命中后两处均不访问；toArray 的完整执行仍必须失败。

```ts
const found = await service.query(root)
  .find(node => node.metadata?.category === "hit").value();
assert.equal(found?.id, hit.id);
await assert.rejects(service.query(root).toArray().value(), /Missing referenced node/);
```

- [ ] 运行 `pnpm --filter edges-cli exec node --test --import tsx test/utils/async-query.test.ts test/services/node-service.test.ts`，确保先红后绿，再接 Tasks。
- [ ] 实现 listTaskNodes：不存在板返回空；已存在但没有合法入口给出迁移错误；正常通过以下同一查询内核读取，不扫描项目／状态目录。

```ts
return service.query(target.boardDir, { types: ["task"] })
  .filter((node): node is TaskNode => node instanceof TaskNode)
  .toArray().value();
```

- [ ] list/get 的 stem 查找与项目发现使用登记树，保留同名歧义检查；taskLocationOf 集中解释既有布局，验证 project/status 与 metadata 一致。显式路径 get 保留原板边界检查。
- [ ] status／priority／project 转换为链上 filter 条件；分组使用 groupBy(...).value()，结果按 scope／purpose／project 保留来源，不能按同名 stem 覆盖。保留 Task Doc、runCount、优先级排序与稳定输出顺序，排序规则留在 Tasks。
- [ ] listRepositoryTaskNodes 从仓库根入口调用同一 NodeService.query，显式开启 includeDescendants、includeHarness 并选择 task 类型，汇总 domain 与 maintenance；Tasks 层解释板归属和展示来源。不得排除模块自身或更深层维护任务，不新增 Task DFS、不把 Task 路径特判塞进通用层；板识别复用 layout/任务路径规则。
- [ ] generate-site 接统一查询与 GroupedList，不再调用 discoverScopes 或扫描各板；已登记空项目保留，其他普通分类不制造空任务分组。覆盖根两张板、登记子作用域任务、相同 stem、相关坏 Task 入口、未登记目录不被偷偷收录。Memory/Skill 正文与维护入口发现分开测试：类型不匹配可避免读取无关正文，但其维护入口中的 Task 必须纳入；为解析范围内关系必须访问的坏入口仍报错，不能以“非 Task”静默排除。
- [ ] 若现有板索引把自身维护材料登记成组成关系，核对协议后修正确认的错误关系或通用边界；不得用 Tasks 的临时路径排除规则掩盖矛盾，也不擅自删除非 Task 索引。
- [ ] 运行节点与看板测试，通过后提交 `refactor: query task trees with deferred node queries`。以上步骤已获执行授权，完成后记录验证结果。

## Task 3：用脚本补齐历史递归索引并证明不漏任务

**Consumes:** 任务 1 的标准入口结构、任务 2 的查询接口，以及原有 Task 目录布局。

**Produces:** 只修改组织入口的迁移计划与可审阅报告：

```ts
export interface TaskIndexMigrationPlan {
  root: string;
  tasks: string[]; // 原任务入口的仓库相对路径
  edits: Array<{ path: string; before: string | null; after: string }>;
}
export function planTaskIndexes(root: string): Promise<TaskIndexMigrationPlan>;
export function applyTaskIndexes(plan: TaskIndexMigrationPlan): Promise<void>;
```

- [ ] 先写 fixture：两张板、不同项目、同名任务、已有约束／人工正文、部分已登记任务。预览必须无写入，apply 后由 NodeService 得到精确相同的任务集合，复跑 edits 为零。
- [ ] 只在迁移器中枚举旧物理目录，以 TaskNode 校验任务；按现有归属补齐“作用域→任务板→项目→任务”索引链。根维护板仍登记为本层；不把子层任务提升到根板。
- [ ] 通过 InternalNode 修改引用，不手拼另一套受控区块。保留正确的非 Task 引用、重要约束、下层索引及区块外正文；遇重复冲突、越界引用或格式错误，报告路径并拒绝整批 apply。
- [ ] 源快照同时覆盖将修改的 AGENTS 和发现的 Task 入口；预览后新增／删除／修改任务或索引则重新计划。对所有目标预检后写入，当前进程失败时回滚；不承诺崩溃事务恢复。
- [ ] 包装 `scripts/index-task-nodes.mts`：必需 `--root`，默认预览，`--apply` 才写入，`--report` 保存来源／目的与校验结果；添加 shebang、执行权限和 package.json 入口。
- [ ] 执行真实工作树预览，逐项审阅索引位置，再 apply：

```bash
pnpm migrate:task-indexes --root /absolute/worktree --report /tmp/task-index-preview.json
pnpm migrate:task-indexes --root /absolute/worktree --apply --report /tmp/task-index-applied.json
```

- [ ] 迁移前后比较任务入口路径集合，不能只比较数量。当前基线应为 105 条（领域 5、维护 100）；Task 正文、所有元数据、runlog、附件字节及路径必须完全相同。
- [ ] 运行 `pnpm migrate:task-indexes --root /absolute/worktree`，验证零修改；用真正的 `listRepositoryTaskNodes` 与生成的 HTML payload 再次逐项对齐。
- [ ] 提交：`refactor: register existing tasks in recursive indexes`。索引补齐与查询切换一起交付，不能部署“新查询＋旧索引”的中间状态。

## Task 4：交付全仓 CLI，确认默认维护板并完成验收

**Consumes:** 三项前置任务通过；当前尚未提交的默认值试改。

**Produces:** 根与子作用域的 CLI 读写默认一致；新增 list --all-scopes，与全仓看板共享任务覆盖和来源语义。

- [x] 为 list 新增 --all-scopes，复用 listRepositoryTaskNodes；以显式参数来源区分 purpose 用户输入与默认值，其他写命令不接受全仓选项。
- [x] 先写全仓 CLI 回归：根与子目录执行得到相同全仓集合；无 --all-scopes 保持局部默认；显式用途筛选生效；非 Task 节点及多层 harness 中任务不漏；同名 stem/project 按来源区分，筛选、排序、分组和 JSON envelope 均正确。
- [x] 对同一 fixture 比较全仓 CLI 与看板 payload 的任务身份集合，必须精确相等；缺失相关入口不得静默退回目录扫描。验证无 Git 时使用已解析作用域作为范围根。
- [x] 审阅当前默认值差异：维护任务 `maintenance` 为 CLI 默认，领域任务通过 `--purpose domain` 选择。create/get/list/update/status/project/runs 必须选同一张板，不能只改 list。
- [x] 保留独立测试 `default-purpose.test.ts`：根与子作用域都创建两种任务，默认 list 仅见维护任务、默认 create 落维护板；显式 domain 仅见领域任务。

```ts
assert.equal(taskBoardLocation(scope).purpose, "maintenance");
assert.match(created.path, /^\.harness\/tasks\//);
assert.deepEqual(defaultListed.map(task => task.title), ["maintenance"]);
assert.deepEqual(domainListed.map(task => task.title), ["domain"]);
```

- [x] 检查旧测试的意图：专门测领域板的 fixture 改为显式 domain；不要全局改 helper，使测试偷偷自动补参数，从而掩盖生产默认值。需要大量同类修改时写 TypeScript 脚本，并审阅结果。
- [x] README、CLI help、CLI README、迁移指南和本模型 spec 同步，补充 --all-scopes、用途筛选和来源输出示例，删除“历史 Task 未登记、Task list 仍扫描目录”的过时现状说明。历史迁移数量保留审计意义，当前行为另写清楚。
- [x] 核对调用 Task 的 Skills 是否都明确选择用途；变更 Skill 内容时按仓库版本／CHANGELOG 约定执行，不静默留下相反示例。看板部署继续显式 `--purpose all`，本轮不改线上部署。
- [x] 按 project-memory-remember 更新用户决定：分层存放但保留全仓视图、默认当前作用域维护任务、Task 沿统一节点树递归索引；全仓显式跨所有维护层级，普通查询默认不跨 harness。不把一次性测试数量当长期记忆。
- [x] 同步记录通用查询约定：采用原生 AsyncIterable 驱动延迟查询链，filter/map/find/groupBy/toArray/mapValues/values/thru 不执行，value() 才执行；分组为普通对象且继续链式，同一条链重复 value 会重跑，不自动缓存；类型条件尽早排除无关加载，任意 predicate 不自动剪枝，不公开 enter / shouldEnter；不引入流处理库。CLI 架构文档展示同一原语用于 Task 和非 Task 节点。
- [x] 运行完整 `pnpm test`，再顺序运行 `pnpm build`；对迁移脚本运行 strict NodeNext 类型检查。失败时修复真实假设，不删除旧业务断言来获得通过。
- [ ] 独立审查调用链与数据迁移报告，重点确认正常 Task 查询不再调用 `readdir`／discoverScopes，也没有绕开 NodeService 的第二套 DFS。
- [ ] 用户确认集成方式后更新原 PR；保留 worktree，不自动合并、发布或部署。

## 最终验收

1. 单条任务仍是 TaskNode；项目和任务板仍是 InternalNode，没有新增组织节点类型或索引协议。
2. 根和子作用域默认查询各自 `.harness/tasks/`；领域板需要显式选择。list --all-scopes 本轮交付，默认包含全仓两种用途及所有维护层级，身份集合与看板一致。
3. 每条现有任务可沿已登记的 AGENTS 链从对应板入口找到；正常查询仅使用 NodeService。
4. 新建、状态移动、项目移动及项目描述更新后，索引与入口一致；普通查询不进入任务自己的 harness，全仓显式模式递归包含其中任务。
5. 全仓结果按来源身份与迁移前任务集合精确相等；fixture 验证节点维护任务及更深层维护任务均被纳入，重复引用不重复输出。不存在遗漏、同名覆盖或额外物理扫描捡漏。
6. 真实迁移只改索引，任务内容／路径／附件／runlog 未变；重复预览零修改。
7. 通用操作支持不同节点属性及 metadata；类型条件避免无关 Memory 等叶子加载，同时保留必要 Internal 导航；范围与有证据的类型合同负责内部引用选择，普通 filter 不误剪包含匹配孩子的父节点，不公开任意剪枝回调。
8. 查询构建及所有链式操作均无 IO 或回调执行，只有 value() 启动；groupBy 为普通对象并支持继续 mapValues/values/filter/map 等操作，find 可接 thru，toArray 后仍可继续链式。同一条链重复 value 重新执行，不隐式缓存。执行期 find 提前停止并关闭上游；遇到上游 toArray／groupBy／thru 物化边界时，边界前仍须完整消费相关范围。底层仍用原生 AsyncIterable，完整 list 与歧义检测不偷停，不引入流处理库。

## 执行边界

用户已授权提交及执行本计划，包括工作树内的索引迁移与验证；不自动推送、合并、发布或部署。真实私有内容及用户维护的 posts 不在修改范围。


## 2026-10-06 集成验收记录

Task 1–3 已由 controller 独立审阅并整合至 Task 4 基线 b06dbfb；本节记录 Task 4 实现者的集成验证，独立最终审查及 PR 更新仍待 controller 执行。保留工作树，不推送、合并或部署。

- CLI 新增 list --all-scopes，按 Commander 参数来源区分默认 maintenance 与显式 purpose。范围由已解析 scope 定位 Git 根，无 Git 回退该 scope。只对 list 开放；普通各读写命令仍共享 maintenance 默认。
- CLI 使用与看板相同的 listRepositoryTaskNodes / NodeService 查询与领域投影，未加 DFS 或物理发现回退。全仓非分组行去除 doc，保留原 JSON envelope、来源与入口 path；分组继续保留 Task Doc，并补出入口 path。同名 project/stem 按来源区分，空项目保留。
- 新 all-scopes 回归先因 unknown option '--all-scopes' 失败，再通过实现转绿。七个同名来源覆盖根/子作用域、非 Task 节点维护和两层 Task harness；从根、子 scope 与子 cwd 查询精确一致，并与实际生成 HTML 中的 payload 身份集合精确一致。用途、状态、优先级、项目、排序、分组、无 Git、缺根/子入口报错与未登记目录不扫描均覆盖。
- 默认用途独立测试覆盖根与子作用域 create/get/list/update/status/project/runs/run-messages，领域板必须显式选择。旧领域测试逐调用显式补 purpose=domain，手写 fixture 显式登记索引；没有让通用 CLI helper 偷补用途。
- 真实回归修复：updateProject 对明确指定且已存在的项目目录恢复补建 metadata/index，仍不扫描同级目录。旧业务断言保留。project get 在任务创建已登记索引后改验证读取前后全部既有索引字节不变；旧平铺迁移测试串接显式目录入口迁移及索引迁移。正文空白与 runlog 保留断言仍在；非法 status 增加拒绝且字节不变验证。
- 2026-10-06 顺序运行根 pnpm test → pnpm build，均退出 0；CLI 778 项通过，其余 workspace tests 通过。其后仅补强测试断言，相关 all-scopes/project 9 项复跑通过。strict NodeNext 的 index-task-nodes.mts 与 async-query.types.ts 合并类型检查通过。构建仅有既有 Vite __dirname/native loader 与 inlineDynamicImports 弃用提示。
- 自审调用链：Task list/get-by-stem/project-list 和全仓看板的发现只沿 NodeService 登记关系；BoardFs 的 readdir 仍为迁移/写入依赖保留，但查询发现不调用它。get/兼容 list 的资源快照读取属于原生命周期合同，文档明确 query/get/list 区别；没有宣称所有 IO 都不读取资源。
- Task 3 证据已复核并保存于[迁移指南](../../recursive-layout-migration.md#2026-10-06-task-递归索引采用)：11 个项目索引、105 个入口、277 个非索引文件路径/字节/blob 保持一致，复跑零修改。公开受控投影的 NodeService/HTML payload 105 条身份精确一致；摘要见指南。不对可能读取私有 users 的真实根执行全仓查询，fixture 证明更深层覆盖，不宣称真实私有覆盖。
- 根 README、CLI README/help、模型 spec、迁移指南已同步。conversation-to-tasks 与 project-tasks-classify 原已贯穿显式 scope/purpose；其他技能仅概述 CLI 无相反用途指令，因此无技能版本 churn。部署仍 purpose=all 且本轮未执行。既有持久看板项目记忆通过 memory remember 更新，保留原部署与 UI 决策，追加局部/全仓边界和原生延迟查询取舍。

复现命令：

```bash
pnpm test
pnpm build
pnpm exec tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck scripts/index-task-nodes.mts extensions/cli/test/utils/async-query.types.ts
pnpm --filter edges-cli exec node --test --import tsx test/tasks/all-scopes.test.ts test/tasks/project.test.ts
```
