# 节点系统简化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以同路径共享可变实例和完整状态保存替代多副本合并，将树遍历和查询链集中到 operations 并复用，减少 NodeService 的状态和重复算法。

**Architecture:** NodeCache 在一个 NodeService 生命周期内维护 `Map<string, BaseNode>`；读路径复用实例，生命周期写计划从当前实例生成，IO 成功后原地更新。纯树遍历、去重、环检测及通用惰性查询链位于 operations，Service 注入加载及范围策略；查询、登记收集与拟提交图校验复用这个内核。写命令在读取前取得工作树级锁，文件原子替换；保留校验草稿、磁盘漂移检查与恢复逻辑，不再合并 dirty aliases。

**Tech Stack:** TypeScript、Node.js、现有 gray-matter/Markdown codec、node:test、pnpm；增加与项目 Node 引擎兼容的 proper-lockfile、write-file-atomic 及必要的开发类型依赖，删除无消费者的直接 diff 依赖。

**Spec:** [节点系统简化设计](../specs/2026-10-06-node-identity-simplification.md)，替代[原节点模型](../specs/2026-10-05-directory-node-model.md)的多副本合并合同，并明确树算法下沉的职责边界。两者冲突以本次用户确认的补充设计为准。

**Status:** 用户已授权实施，执行中；基线 `e1283b7`。本计划不构成推送、合并、部署或真实内容迁移授权。

## Global Constraints

- 同一个 NodeService 内，同一入口路径只保留一个受管可变实例。身份表不跨 Service，不建全局单例。
- 一次 CLI 命令使用一个 NodeService 生命周期。写命令在业务读取之前取得工作树级锁并持有到结束；父子/兄弟 scope 共用一把锁，独立 worktree 各自加锁。占用时报错，只读命令不加锁。
- proper-lockfile 负责协作式互斥，write-file-atomic 负责单文件原子替换；保留外部原文/身份检查与现有失败恢复，不承诺外部编辑器隔离或多文件 ACID。
- 多个调用方共享修改；保存这个节点时，写入它的完整当前状态。创建、移动、删除或导入需要维护其他节点的索引时，也保存那些受影响节点的完整当前状态。
- 取消“多个可编辑副本加三方合并”的合同，不增加 dirty 节点必须先保存的限制。
- 仅保存本次生命周期操作实际影响的节点；不自动 flush 所有加载过的节点。
- 磁盘被其他 Service、进程或用户修改时，仍在写入前报错。原始快照不能因缓存命中或补充资源而静默推进。
- 保留“构建完整写计划 → validate/快照检查 → 执行 IO → 回填原实例”的顺序；临时草稿不得注册成受管实例。
- query 首次只取得入口快照；get/list 可在同一对象上补充资源快照。已有资源快照不因重复 get 而失效或被覆盖。
- `.value()` 仍是查询执行入口；重复 value 重跑遍历和回调，复用节点实例不等于缓存查询结果。
- 同目录 index.md 与 AGENTS.md 仍是不同节点；parent、localChildren、descendantChildren、harness、目录生命周期及外部只读合同不变。
- 纯树算法归 operations；Service 通过现有 resolve/load 回调提供引用边界和加载。operations/traverse 不导入 services、文件 IO 或 NodeCache。
- query、登记节点收集、拟提交图校验复用同一树算法，各自关系范围、删除检查、计划草稿覆盖和错误处理不变；不新增公共 enter/shouldEnter。
- 通用查询链从 utils/async-query.ts 迁入 operations/query.ts，各算法拆为独立文件，继续泛型化；不改变链式惰性语义、不扩大算法种类。
- 本轮只迁通用方法；Tasks 等业务专用操作不抽取、不搬迁，仅更新对通用 operations 的引用。
- 不新增 NodeTree、事务/session 框架、事件总线、dirty 合并替代物、OS 权限系统、公共 reload API 或流处理库。
- 只在独立 worktree 修改；不读取私有 users/journal，不改 posts、Obsidian workspace 或真实节点内容；不运行会进入真实私有索引的根全仓查询。
- 重复批量修改测试时使用 TypeScript 脚本并检查差异。保留正文、附件、runlog、引用、回滚等业务断言，不通过删除断言掩盖回归。

## 三个实施任务及顺序

缓存身份与 create/update/move/destroy/import 的写计划相互依赖：只替换 Map 而继续从磁盘重建父节点，仍会丢掉共享修改。Task 1 一起收敛这组状态合同；Task 2 下沉树操作并复用递归内核；Task 3 删除不再使用的文件和依赖，接入本次补充确认的命令锁与原子保存，统一业务验收及文档。三个任务顺序执行，各自提交、验证和审查；它们共享 node-service.ts，不并行改动。锁的取舍和资料见补充 spec 的“命令锁与单文件原子保存”“决策过程与代价”。

## 文件职责及删减清单

| 文件 | 本次职责 |
| --- | --- |
| `extensions/cli/src/services/node-cache.ts` | 唯一路径实例、EntryFile/资源快照、提交后登记/改键/失效；删除 alias 三方合并 |
| `extensions/cli/src/services/node-service.ts` | 共用实例及完整状态计划；成功回填；通过加载/范围适配复用 operations 遍历 |
| `extensions/cli/src/services/traverse.ts` → `extensions/cli/src/operations/traverse.ts` | 移动纯树算法；单根/多根共用 DFS、去重和环检测；删除旧实现，不保留第二份 |
| `extensions/cli/src/operations/index.ts` | 导出 traverse 和泛型查询 API；内部直接模块导入，避免 barrel 循环依赖 |
| `extensions/cli/src/utils/async-query.ts` → `extensions/cli/src/operations/query.ts` | 查询链与独立算法文件分开，更新全部生产及测试消费者；删除旧文件，不留转发副本 |
| `extensions/cli/test/utils/async-query.{test,types}.ts` → `extensions/cli/test/operations/async-query.{test,types}.ts` | 保留运行时及类型断言，同步 strict 验证路径 |
| `extensions/cli/test/operations/traverse.test.ts` | 纯内存模型及加载回调验证次序、关系范围、惰性、环、多根和提前结束 |
| `extensions/cli/src/services/node-layout.ts` | 仅在模型选择需要共用既有逻辑时调整；不改变 layout/路径/引用协议 |
| `extensions/cli/src/services/node-merge.ts` | Task 1 停止调用，Task 3 删除 |
| `extensions/cli/src/services/node-text-merge.ts` | Task 3 删除 |
| `extensions/cli/test/services/node-identity.test.ts` | 新增身份、读缓存、资源升级、模型与只读边界用例 |
| `extensions/cli/test/services/alias-reconciliation.test.ts` | 改名为 `shared-node-state.test.ts`，替换自动合并预期，保留完整状态与源文本业务验证 |
| `extensions/cli/test/services/{node-service,owned-units,resource-review}.test.ts` | 生命周期、失败不改变路径、索引/附件、外部冲突回归 |
| `extensions/cli/test/tasks/{node-index,owner-board,node-query,all-scopes}.test.ts` | 生产 Tasks 索引、共享查询、全仓覆盖回归 |
| `extensions/cli/test/services/{production-nodes,directory-cli}.test.ts` | Memory/Task/Note/Skill 与 CLI 兼容验证 |
| `extensions/cli/package.json`、`pnpm-lock.yaml` | 删除直接 diff 依赖；由 pnpm 添加兼容版本的锁/原子保存依赖 |
| `extensions/cli/src/services/node-lock.ts`（新增）、现有 CLI 写命令编排入口 | 薄封装 proper-lockfile；在业务读取之前取得工作树锁，finally 释放，覆盖整个命令 |
| `extensions/cli/src/services/node-files.ts`（已有） | 接入 write-file-atomic；保留文件读取、快照检查及失败恢复；不把锁缩小到单次文件保存 |
| `extensions/cli/test/services/command-write-lock.test.ts`、现有文件写入/CLI 集成测试 | 两进程父子 scope 争锁、不同工作树独立、失败释放、原子替换后的快照及恢复 |
| `docs/superpowers/specs/2026-10-05-directory-node-model.md`、`extensions/cli/README.md` | 移除多副本合并表述，说明共享实例、完整保存、资源升级与外部冲突 |

无需另建缓存包、身份服务、文档合并模块或通用变更追踪器。

锁与原子写入分文件，是因为前者覆盖整个命令，后者处理每个文件的保存；两者均位于 services，不新增子目录、package、LockManager 或 AtomicWriter 类。CLI 编排组合两者，models 不感知文件 IO 或锁。

## Task 1：统一受管实例和生命周期写计划

**Files:** 修改 node-cache.ts、node-service.ts；必要时复用 node-layout.ts 模型解析；新增 node-identity.test.ts；重命名 alias-reconciliation.test.ts 为 shared-node-state.test.ts；更新 node-service.test.ts、owned-units.test.ts、resource-review.test.ts；同步原模型 spec 的生命周期两条。

**Interfaces:**

- Consumes：现有 `EntryFile` / `readEntry` / `validateEntry` / `saveEntries`、`ResourceSnapshot`、模型 `serialize/parse/validate` 和 NodeService 的现有 CRUD/query 方法。
- Produces：公共方法签名保持不变；重复 `get`、`query`、`list` 的同路径结果满足引用相等。内部 `NodeCache.loaded` 从 `Map<string, Set<BaseNode>>` 改为 `Map<string, BaseNode>`；`state: WeakMap<BaseNode, Loaded>` 仍保存持久化基线。

- [x] **Step 1：先写身份与完整保存的失败用例。** 新测试文件使用真实临时目录和生产 NodeService，不 mock 缓存。可直接采用以下独立用例骨架，补充的场景沿用相同 setup/cleanup：

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { InternalNode, LeafNode } from "../../src/models/index.js";
import { NodeService } from "../../src/services/node-service.js";

test("get/query/list share identity and child creation saves parent current state", async t => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "node-identity-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const entry = path.join(root, "AGENTS.md");
  fs.writeFileSync(entry, new InternalNode(entry)
    .parse("# Root\n\nHuman introduction.\n").serialize());
  const service = new NodeService({ managedRoot: root });
  const a = (await service.get(entry, InternalNode))!;
  a.setConstraints(["shared constraint"]);
  const b = (await service.get(entry, InternalNode))!;
  assert.strictEqual(a, b);
  assert.deepEqual(b.constraints, ["shared constraint"]);
  assert.strictEqual(await service.query(root).find(n => n.path === entry).value(), a);
  assert.strictEqual((await service.list(root)).find(n => n.path === entry), a);
  const child = new LeafNode(path.join(root, "child/index.md"));
  await service.create(child, { body: "Child\n" });
  assert.strictEqual(await service.get(child.path), child);
  const disk = new InternalNode(entry).parse(fs.readFileSync(entry, "utf8"));
  assert.deepEqual(disk.constraints, ["shared constraint"]);
  assert.equal(disk.children[0]?.id, child.id);
  assert.match(disk.body, /Human introduction/);
});
```

- [x] **Step 2：确认 RED。** 在 `extensions/cli` 运行 `node --test --import tsx test/services/node-identity.test.ts`。应因同路径 `strictEqual` 失败；另将“父未保存约束在 create 后立即出现在磁盘”的断言独立成用例，避免前一个断言阻断这条行为验证。
- [x] **Step 3：改身份表与所有读入口。** 唯一入口路径采用 `path.resolve` 等既有规范化。首次读取、parse/validate 后登记；命中返回同一实例。`remember` 不允许不同对象覆盖已受管路径；同一对象成功提交可以更新快照。内部关系读取若需要物理权威信息可保留短命只读解析，但不得作为第二个受管实例传播。模型解析保留 layout/models/modelForReference；typed get 请求 BaseNode 不把 InternalNode 降级。冲突模型明确报错。

```ts
// NodeCache 的身份表，替代 Set<BaseNode>。
readonly loaded = new Map<string, BaseNode>();

// remember 内的身份约束；file/资源状态仍按既有快照合同处理。
const current = this.loaded.get(node.path);
if (current && current !== node)
  throw new Error(`Node already managed: ${node.path}`);
this.loaded.set(node.path, node);
```

- [x] **Step 4：保留 snapshot、资源及只读语义。** 缓存命中不重读并 parse 覆盖用户修改、不更新 EntryFile.source。首次 query 的对象在 get/list 时调用既有 captureResources 补资源；该升级校验旧 EntryFile 并保持对象相等。已有资源快照不重拍。保留 readonly 路径的传播及 symlink 写拒绝，不能由于可写对象先入表而绕过后来遇到的只读来源。类型跳过的导航对象不入表、不作为正常结果返回。
- [x] **Step 5：统一生命周期计划来源。** create/import 的父索引、move 的旧/新父及被搬子节点、destroy 的存活引用方都从唯一实例当前 `serialize()` 构造草稿；旧 EntryFile 仅用于乐观校验。删除 move 中只对主节点选当前 source、对其他节点退回 before.source 的分支。主 update 的 input 仍按现有模型方法覆盖对应字段。

```ts
// 每一个实际受影响节点采用相同规则，不特殊区分 primary/dirty alias。
const draft = clone(entry);
const currentSource = entry.serialize();
const source = rewriteLinks(currentSource, entry.path, target, relocate);
// 后续沿现有流程对 draft 改受控索引、validate 并形成 Planned；
// before 仍是最初读取/上次成功提交的 EntryFile，而非新读磁盘基线。
```

必须先确定是否真的有移动/登记/移除/引用改写，再把节点列入 plan；比较“施加结构操作前的当前序列化”与“施加后序列化”，不能仅比较当前序列化与旧磁盘 source，否则会误 flush 无关 dirty 节点。无需索引变更的已登记父不额外保存。

- [x] **Step 6：提交后回填及失效。** 删除 `#mergedSource` 和 `assertRefresh` 及全部调用；refresh 简化为按已成功提交的文档回填唯一实例并更新基线。移动改键时先校验目标缓存/文件冲突，保留对象身份；删除清除 loaded/state，旧实例保存拒绝。未受影响节点保持修改与快照。用计划草稿避免 validate/IO 失败时提前污染共享实例；保留已有部分失败恢复位置报告。
- [x] **Step 7：把旧 alias 用例改成新合同，新增边界断言。** 以下矩阵全部落实为有实际行为断言的测试；重复转换先写 TS 脚本，逐类检查，不全局替换期待值。

| 场景 | 必须验证 |
| --- | --- |
| `Promise.all([get(p), get(p)])`；相对/绝对同路径 | 同一 Service 同一对象；不同 Service 不同对象 |
| 同目录 index.md / AGENTS.md | 两个对象；harness 关系仍正确 |
| 多引用修改不同字段/同字段/嵌套 metadata | 修改立即共享；同字段按现有 setter 顺序覆盖；不递归自动合并两份 mapping |
| 父已有约束、正文、metadata 修改后 create/import child | 未额外 update(parent)，磁盘已有全部当前字段及新索引，非受控正文保留 |
| 同时存在无关 dirty 节点 | 生命周期操作后其文件字节未变、内存修改仍在 |
| move 影响旧/新父、已加载子节点与其他引用方 | 完整状态持久化；实例相等；新键命中原对象；旧键释放；fragment/query 与附件/runlog 保留 |
| destroy 引用方 dirty、被删节点有 harness | 存活引用方完整保存且引用移除；被删对象不可保存；同路径重建产生新对象 |
| 模型选择 | BaseNode 请求返回 InternalNode 原实例；不相容类型失败；自定义 models/modelForReference 路径继续工作 |
| query→get/list 资源升级 | 同对象、未保存正文不丢、仍检测入口和附件漂移；不加载未选叶子正文 |
| 重复 value | 再次执行回调/遍历，结果实例复用；同 Service 查询能观察内存字段修改 |
| 外部改内容/同字节替换文件/另一个 Service 保存 | 写入拒绝且不推进旧快照；原内存编辑保留；新建 Service 能读外部新版本 |
| 校验失败、assertWrite 拒绝、已有 IO 故障 fixture | 不提交新增索引/路径，不丢调用方原修改；文件恢复/残留报告仍正确 |

- [x] **Step 8：验证并提交。** 在 `extensions/cli` 执行下列命令；针对变动代码迭代这些 tests，不每一步重复全仓套件：

```bash
node --test --import tsx test/services/node-identity.test.ts test/services/shared-node-state.test.ts test/services/node-service.test.ts test/services/owned-units.test.ts test/services/resource-review.test.ts
pnpm exec tsc --noEmit -p tsconfig.json
git diff --check
```

预期全部通过；生产路径已不再导入 node-merge，但两个待删除源文件可留到 Task 3。原 spec 的两条多副本合同更新为本设计；记录实际 RED/GREEN 结果。提交 `refactor: share one node instance per service path`，附 `Co-authored-by: Codex <noreply@openai.com>`。

## Task 2：将树遍历和查询链集中到 operations 并复用递归内核

**Files:** 移动 `extensions/cli/src/services/traverse.ts` 到 `extensions/cli/src/operations/traverse.ts`；新增 operations/index.ts；将 utils/async-query.ts 拆为 operations/query.ts、filter.ts、map.ts、find.ts、group-by.ts、map-values.ts、to-array.ts，并移动其 test/types 到 operations 测试目录，并用 TS 脚本更新全部消费者；修改 services/node-service.ts；新增 test/operations/traverse.test.ts；补强 test/services/node-service.test.ts、owned-units.test.ts 和 test/tasks/node-query.test.ts。

**Interfaces:**

- Consumes：Task 1 唯一受管实例、NodeReference、NodeQueryOptions 和既有 resolve/load 注入；Service 提交计划中的草稿仍是临时对象。
- Produces：operations 导出的 traverse，单根调用继续兼容，多根调用共用一次 seen/active 状态；NodeService 的 query/list/CRUD 公共签名不变。

```ts
export async function* traverse(
  roots: BaseNode | Iterable<BaseNode>,
  options: NodeQueryOptions,
  resolve: (parent: BaseNode, reference: NodeReference) => string | undefined,
  load: (parent: BaseNode, reference: NodeReference, target: string) => Promise<BaseNode>,
): AsyncGenerator<BaseNode>;
```

- [ ] **Step 1：先写纯模型测试并确认 RED。** 使用内存 Map 提供 load，不读写文件、不实例化 NodeService。以下用例验证重叠根只加载一次、返回原对象以及生成器创建不触发加载：

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { BaseNode, InternalNode, LeafNode } from "../../src/models/index.js";
import { traverse } from "../../src/operations/traverse.js";

test("multiple roots share traversal identity and load on demand", async () => {
  const leaf = new LeafNode("/root/item/index.md");
  const root = new InternalNode("/root/AGENTS.md").create({
    localChildren: [{ id: leaf.id }],
  }, { operation: "create" });
  const nodes = new Map<string, BaseNode>([[root.id, root], [leaf.id, leaf]]);
  const loads: string[] = [];
  const pending = traverse([root, leaf], {}, (_parent, ref) => ref.id,
    async (_parent, _ref, target) => {
      loads.push(target);
      return nodes.get(target)!;
    });
  assert.deepEqual(loads, []);
  const result: BaseNode[] = [];
  for await (const node of pending) result.push(node);
  assert.equal(result.length, 2);
  assert.strictEqual(result[0], root);
  assert.strictEqual(result[1], leaf);
  assert.deepEqual(loads, [leaf.id]);
});
```

在 extensions/cli 运行 `node --test --import tsx test/operations/traverse.test.ts`；预期先因 operations/traverse 尚不存在失败。补充单根前序、默认 local、显式 descendant/harness、菱形去重、跨根环、types 仅筛结果不误剪父节点、resolve 返回 undefined、load 报错、break 后无额外 load 用例。
- [ ] **Step 2：移动现有算法，最小扩展根集合。** 将 seen/active 放在一次 traverse 调用内，内部 visit 沿用既有流程；外层按根顺序调用 visit。单根等价于一元素集合，不为每个根重建 seen/active。traverse 直接导入 ../models 下的 base-node/internal-node/types/relations，operations/index.ts 导出遍历及泛型查询 API；内部不反向导入自身 barrel。用可重复执行的 TS 脚本迁移查询链、拆出算法、移动测试并更新所有引用。query.ts 保留 fluent interfaces 和薄的 deferred/collection/object 链式适配；filter/map/find/group-by/map-values/to-array 各文件承载对应算法，不反向导入 query.ts；保留延迟求值及可重复执行，不保留 async-query 转发文件，不把查询链改为 Node 专用类型。

```ts
// 放在同一次遍历的 seen/active 和 visit 定义之后。
for (const root of roots instanceof BaseNode ? [roots] : roots)
  yield* visit(root);
```

不改变前序、早停、yield 时机和类型过滤。resolve/load 沿用原参数，不新建 children-provider、公开剪枝回调或 IO 接口层。删除旧 services/traverse.ts，NodeService 改导入 operations/traverse。
- [ ] **Step 3：替换 Service 的重复递归，逐项保留策略差异。** 不把三条调用链强行设成相同 options，也不将草稿注册到单实例缓存。

| 调用链 | roots / options | resolve / load 的 Service 责任 |
| --- | --- | --- |
| query | 原作用域入口；用户给定选项 | 原仓库边界、只读传播、类型跳过与轻量加载不变 |
| #registered | 管理根入口及显式加载补集；descendants+harness 开启 | 只收 managedRoot 内节点，仍使用当前实例；保留既有缺失入口处理和资源加载合同，多个起点交叉只收一次 |
| #validateGraph | plan 中所有 write.node；descendants 开启，harness 关闭 | resolve 检查 removed；load 优先 plan.get(target)?.node，再通过 Service 加载。所有 roots 共用去重及环检查 |

`#registered` 的候选根先按既有 managedRoot 和文件存在性规则筛选，不能只在 resolve 中限制子引用而让仓外缓存根直接进入结果。可将候选根作为按需迭代的 Iterable 提供，避免已经从根到达的缓存子树反复走 DFS；即使收集 roots，不能为了组成它而预先加载全部树。拟提交图校验的删除检查发生在引用解析阶段，仍先于已访问目标的跳过；不能因为目标 seen 而漏报待删除引用。overlay 草稿只用于验证，不替换已缓存实例。
- [ ] **Step 4：确认消除的是重复算法而非业务检查。** 删除 #registered / #validateGraph 各自的递归 visit 与 seen/active；保留它们薄的范围/计划适配与结果收集。node-layout 的 directoryEntries 是生命周期物理目录枚举，Task 索引迁移的 discover 是显式迁移扫描，均不改用逻辑节点遍历。不因“基本树操作”扩展到未使用的 BFS/排序/全图框架。
- [ ] **Step 5：回归 producer/consumer 边界。** 在已有 service fixture 中验证：创建或更新形成的计划草稿环在 IO 前报错、被删引用不因去重漏检、相交多个计划根不重复加载、move/destroy 仍覆盖已加载但根未登记的节点及其维护关系。纯模型测试只证明算法；现有 query 类型早跳过、多层 harness、只读来源及全仓同名任务 fixture 继续证明 Service 的加载策略。
- [ ] **Step 6：验证、记录实际删减并提交。** 在仓根运行：

```bash
pnpm --filter edges-cli exec node --test --import tsx test/operations/traverse.test.ts test/services/node-service.test.ts test/services/owned-units.test.ts test/tasks/node-query.test.ts test/tasks/all-scopes.test.ts test/operations/async-query.test.ts
pnpm --filter edges-cli exec tsc --noEmit -p tsconfig.json
rg -n 'services/traverse|\./traverse\.js' extensions/cli/src
git diff --check
git diff --stat
```

检查 rg 命中应只有合法的 operations 导出/局部引用，不再有 Service 旧路径；报告 Service 内删掉哪些递归实现和策略保留证据。提交 `refactor: centralize traversal and queries in operations`，附 Codex Co-authored-by；独立审查后进入 Task 3。

## Task 3：删除合并子系统并完成统一验收

**Files:** 删除 node-merge.ts、node-text-merge.ts；更新已有 services/node-files.ts、现有 CLI 写命令编排入口，新增 services/node-lock.ts 及 command-write-lock.test.ts；更新 edges-cli/package.json、pnpm-lock.yaml、CLI README 和两份相关 spec 的状态；按实际影响更新 production-nodes.test.ts、directory-cli.test.ts 及 Task/Memory/Note 接入测试，不新增通用框架。

**Interfaces:**

- Consumes：Task 1 的单实例和完整保存合同，以及 Task 2 的 operations 遍历及三个 Service 消费方；公共 CRUD/query API 保持不变。
- Produces：无 node-merge/node-text-merge 生产引用、无 Service 重复 DFS；命令级工作树锁与单文件原子保存；完整业务回归和构建通过；文档说明新的实例、分层及并发合同。

- [ ] **Step 1：检查生产依赖，删除无调用代码。** 用 `rg` 查源码中 `mergeNode`、`mergeText`、`node-merge`、`node-text-merge`、`assertRefresh` 及 `from "diff"`。Task 1 应已删除缓存调用；若还有调用，回到同一缓存/写计划合同修复，不保留兼容合并分支。删除两个源文件，移除仅服务于它们的 import 和 types。
- [ ] **Step 2：由包管理器删除直接依赖。** 在仓根确认 diff 的实际消费者后运行：

```bash
rg -n 'from ["\x27]diff["\x27]|mergeNode|mergeText|node-text-merge|node-merge' extensions/cli/src
pnpm --filter edges-cli remove diff
git diff -- extensions/cli/package.json pnpm-lock.yaml
```

预期源码查询没有命中；只移除 edges-cli 的直接 diff 依赖，锁文件中其他合法依赖的 diff 记录不手工删。不要删除历史讨论/旧计划中的术语作为“通过检查”的手段。

- [ ] **Step 2a：先验证命令写边界，再接入锁。** 盘点现有 CLI 写命令及其 NodeService 创建位置，以一次命令为操作边界，业务读取前获取锁，finally 释放，不在每次内部 CRUD 重复获取。锁身份来自稳定工作树根，独立 worktree 不共用 Git common-dir；非 Git 管理目录沿既有根发现规则保持同一树的父子 scope 使用同一身份。锁目录不得进入节点索引、资源快照、Git 提交或后续打包。明确路径后补到 spec。通过包管理器选择兼容 Node engines 的 proper-lockfile、write-file-atomic 与必要类型依赖，记录版本依据；不要顺带提高 Node 最低版本。
- [ ] **Step 2b：先写失败用例再实现原子保存。** 在原有 node-files 保存边界接入 write-file-atomic，保留新建不覆盖、路径/符号链接检查、目录生命周期、附件和恢复逻辑。成功替换后采集新文件身份及 source，再回填唯一实例；不以关闭 inode 检查来掩盖自写替换。锁失效报错，不吞错继续；冲突检查仍比较原始内容及既有身份快照，不增加 mtime-only 协议或自动重试合并。

| 补充验收场景 | 必须验证 |
| --- | --- |
| 两个真实进程在同一树的父/子 scope 写入 | 首个命令读取前已持锁；第二个在读取业务节点前报锁占用；释放后重试成功 |
| 兄弟 scope、独立 worktree、只读命令 | 同树写串行；独立工作树可同时持锁；只读不获取写锁 |
| 校验失败、保存异常、锁失效 | finally 释放或库按其机制处理失效；不把失败当作成功，不破坏已有恢复报告 |
| 编辑器直接改动、外部同字节替换文件 | 原有外部冲突检查仍拒绝；不承诺检查到替换之间无竞态 |
| 一次成功原子保存后再保存同一实例 | 新快照反映 rename 后身份，不误报自身漂移；外部漂移仍能报错 |
| 临时文件写入/rename 故障及多文件部分失败 | 单文件替换前原文完整、临时文件清理；既有多文件恢复继续有效，不宣称崩溃原子性 |

锁测试采用隔离临时目录和进程间握手，避免依赖固定 sleep；不得对真实仓库节点发起并发写。运行新增锁测试、相关 node-files/Service 及 CLI 集成测试，记录 RED/GREEN，再进入整体回归。
- [ ] **Step 3：验证真实业务调用。** 跑下列已有集成回归，确认 Tasks 的 create/status/project/index、Memory/Note 的 update/import、Skill+harness 生命周期和全仓结果不变：

```bash
pnpm --filter edges-cli exec node --test --import tsx test/services/production-nodes.test.ts test/services/directory-cli.test.ts test/tasks/node-index.test.ts test/tasks/owner-board.test.ts test/tasks/node-query.test.ts test/tasks/all-scopes.test.ts test/tasks/default-purpose.test.ts
```

若调用方依赖不同对象隔离，改为复用 Service 的实例并按当前模型方法组合修改；需要短命校验副本时用现有 clone 模式且不登记。不能另写 merge/copy cache。新增回归先证明具体业务错误再修复，不改任务状态、用途、索引归属规则来迁就缓存。
- [ ] **Step 4：同步文档和用户决定。** CLI README 给出 `a === b`、父节点完整保存的例子，说明 models 管领域模型、operations 管树算法和泛型查询链、Service 管加载与持久化；原 spec 移除副本三方合并条款、改写 get/query/list 资源升级和遍历归属描述；本补充设计与计划状态只在实现、验证后标为完成。说明不同 Service/进程之间仍检查文件冲突，并说明受影响节点的未保存修改会随生命周期操作落盘。项目记忆只记录用户为何选择共享状态及合并计划，不能把临时测试数量写成长期约定。
- [ ] **Step 5：完整验收。** 在仓根顺序执行：

```bash
pnpm test
pnpm build
pnpm exec tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck scripts/index-task-nodes.mts extensions/cli/test/operations/async-query.types.ts
git diff --check
git diff --stat
```

预期全绿；分别报告状态/遍历简化的删减和锁/原子保存的新增，不新增替代合并模块。严格类型检查继续证明迁移脚本和惰性查询消费方兼容。只运行隔离 fixture；不执行真实数据迁移或可能读取私有用户索引的根全仓查询。锁接入和合并清理可按可审查边界分别提交，附 Codex Co-authored-by。
- [ ] **Step 6：独立复核。** 审查重点是“缓存命中是否保持用户编辑与旧快照”“父/子/引用方是否都基于当前状态计划”“无关 dirty 节点是否被误保存”“删除/移动后是否仍有旧键和可写旧对象”“只读或模型声明是否能绕开身份表”；另核对树算法对 Service 无反向依赖，query/registered/validateGraph 复用内核且范围不同仍正确，多根去重和计划草稿覆盖不漏环。tests 不得删除正文、资源和外部冲突断言。报告净删除文件/依赖、实际测试结果及任何未解决限制。

## 最终完成标准

1. get/query/list/create/import 返回的同路径受管对象具有稳定身份，move 保留身份，destroy 使旧身份失效。
2. 受影响节点的当前状态一次保存，无未保存修改必须先手动提交的闸门，无无关缓存的自动 flush。
3. NodeCache 不再维护实例集合或三方合并；两个 merge 文件及无消费者的直接 diff 依赖删除。
4. 校验草稿、文件/资源快照、外部只读、路径限制和失败恢复仍有效；磁盘冲突仍报错。
5. 惰性查询与全仓 Tasks/看板共享发现合同不退化，Tasks/Memory/Note/Skill 现有业务通过。
6. operations/traverse 是共用逻辑遍历内核；Service 不保留同用途重复 DFS，不反向把文件 IO 下沉；泛型查询链已从 utils 移至 operations，语义不变。
7. 一次写命令读取前取得工作树级锁；父子 scope 串行、独立 worktree 不互锁；单文件原子保存后正确刷新快照，保留外部冲突检查和失败恢复。
8. 文档描述和实现一致，区分单文件原子性与多文件恢复；不搬迁真实内容、不执行发布。

## 实施记录

- Task 1 已完成：共享实例与完整状态保存；实现 b584d30，边界修复 83e0bab。100 项相关测试、类型检查通过，独立审查两项发现均修复并复审通过。
- 用户更新布局：operations 与 models 同级，统一 traverse 与泛型 async-query；Task 2 按更新后的范围执行。
