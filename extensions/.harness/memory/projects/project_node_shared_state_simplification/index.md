---
name: project_node_shared_state_simplification
description: 节点与 Service 边界：共享实例、domain 内 models/operations 同级、通用能力收敛及命令锁取舍。
metadata:
  edges-title: 节点共享状态与职责简化
  edges-type: project
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-06T14:49:29+08:00'
---

用户确认：同一 NodeService 内，同路径节点共享同一个可变实例；多个调用方的修改可以同时存在于该实例中，保存时一起落盘。不要为了隔离调用方的未保存修改，引入多副本自动合并或要求先保存 dirty 父节点的闸门。

**Why:** 用户质疑 node-merge 的必要性，并指出共享实例直接同时修改即可。此前的复杂度来自实现额外假设了“多个独立编辑副本需要自动协调”，不是用户需要的能力。简化应删除这个前提，而不是换一种合并框架。

**How to apply:** 生命周期操作维护父节点或其他受影响节点的索引时，保存这些节点的完整当前状态；不自动保存未受影响的所有缓存节点。保留文件被外部修改时的冲突检查、写入前校验及失败恢复，不保留多副本正文或 metadata 三方合并。短命校验草稿不作为第二个受管实例。实际接口和验收以 docs/superpowers/specs/2026-10-06-node-identity-simplification.md 与对应 plan 为准。

## 树操作下沉与同一计划实施

早期用户确认把树操作下沉与单实例简化合并在同一计划中（最终目录归属见下文），分三步实施：统一实例与保存语义；下沉树算法并复用递归；清理依赖及统一验收。

**Why:** 两项改动都作用于 NodeService 的相同调用链，分开计划会重复修改和验收。树关系规则属于模型，文件加载与持久化属于 Service；下沉应消除重复递归，而不只是移动文件。

**How to apply:** 遍历、去重和环检测采用独立函数（最终位于 operations），由 Service 提供加载与范围策略，不新增 NodeTree 类、不把文件 IO 放入 BaseNode。query、登记节点收集及拟提交图校验复用算法，但保留各自关系范围和计划处理。通用 filter/map/groupBy/find 保持泛型化，最终随查询链迁入 operations。

## 命令生命周期、锁与保存边界

2026-10-06 讨论后，用户要求记录架构结论与决策过程。NodeService 不跨 CLI 命令保留；同一命令允许因 managedRoot 或模型策略不同而使用独立 Service 视图，实例共享限定在各视图内；同一工作树共用一把写锁，使用 proper-lockfile；单文件保存使用 write-file-atomic；保留外部修改检查，冲突报错。按实际文件加锁仅作为后续并发优化选项，尚未采用。

**Why:** 用户指出一次 CLI 只执行一个操作，因此关联保存不需要额外的编辑会话隔离；又要求并发方案简单且有实际采用依据。工作树锁覆盖可能共同修改父索引或跨 scope 移动的操作，免去多锁协调。它接受父子及兄弟 scope 的独立写也串行这一代价：争锁不等于数据冲突。单文件原子保存解决半写文件问题，与命令互斥是两个职责；编辑器不遵守 CLI 锁，所以不能删除外部冲突检查。依赖选择看官方源码、实际采用和引擎兼容性，不凭 Star 数断言，也不把选中的包称为行业标准。

**How to apply:** 写命令在读取业务节点前取得稳定工作树锁，失败或成功均释放；占用时报错，由用户重试。独立 Git worktree 不共用锁，只读命令不加锁；scope 决定操作范围而不是锁范围。保留原文及文件/资源身份快照，不新增只凭时间戳的协议。原子替换后更新实际文件身份，继续沿用已有多文件失败恢复；不承诺多文件 ACID 或阻止任意外部编辑器写入。具体职责、未采用方案及官方证据集中在[补充设计](../../../../../docs/superpowers/specs/2026-10-06-node-identity-simplification.md#命令锁与单文件原子保存)，[实施计划](../../../../../docs/superpowers/plans/2026-10-06-node-identity-simplification.md)同步补齐验证步骤。

## 树操作的目录归属

以下为此前的 src 顶层位置决策；本条目末尾的 domain 归组决策已更新物理位置，算法分文件及 models/operations 同级的要求仍保留。

用户最终确认本轮只迁通用方法，Tasks 专用操作保持原位；采用通用布局：src/operations/ 与 models、services 同级，包含 traverse.ts、query.ts 与独立算法文件。替代此前仅收树操作的 models/operations 子目录建议。

**Why:** 用户指出除了 traverse，还应统一组织 filter、map、groupBy、find 等可组合操作。统一目录便于发现整条操作链，同时通用集合查询不应归为 Node 专用模型能力。

**How to apply:** traverse 依赖节点模型、由 Service 注入加载；query 保持泛型和显式 value 求值；filter、map、groupBy、find 等算法分别放独立文件，由 query 组合且不反向依赖查询链，更新全部导入及运行时/类型测试，不保留旧路径转发文件。锁放 services/node-lock.ts，原子保存放已有 services/node-files.ts，保持薄封装。具体完成状态以实施计划为准。


## 实施时保留的扩展边界

首次加载叶子保留显式模型构造器及现有模型解析 hooks；AGENTS 仍使用 InternalNode。后续同路径读取约束已有对象类型，不建立第二个编辑副本。

**Why:** 简化身份管理不应顺带取消模型扩展能力。不同 managedRoot 或模型策略的 Service 也不应为了形式上的单例被合并成一个全局会话。

**How to apply:** 首次加载者决定叶子构造器，后续类型必须兼容；跨 Service 视图不共享实例。若将来要求只按布局选型或跨视图身份一致，需显式迁移构造器调用或 Service 传递边界，不能悄悄换对象。

## 无 Git 目录的锁边界

实施审查确认：Memory init 可创建或更新父级索引，不能把 root-dir 一概理解成只读遍历边界。用户进一步要求锁就地存放：Git 锁放最近的独立 worktree 根 `.edges-write.lock/`；非 Git 默认共用一个固定临时锁，均不做路径哈希。

**Why:** 初始化会创建 AGENTS.md，以物理 AGENTS 祖先确定锁身份会在同一命令内改变锁根，且新建父索引可能位于原锁范围之外。固定边界保留一次命令一把锁，不新增多锁协调或根注册协议。Git 根是稳定现成目录，直接存放可删除哈希与集中路径管理。非 Git 没有这个前提，因此保留固定临时锁作为简单 fallback。

**How to apply:** 锁根发现前按实际命令参数的既有语义规范化目标路径，不能由锁模块另行解释路径。非 Git 目录接受共享临时锁的无关写入也串行的代价；若未来需要并发，再设计持久的显式根约定。Git 根内 `.edges-write.lock` 是保留运行时目录：资源扫描和复制排除它，生命周期操作不能搬移或删除活动锁。

## 后续通用能力收敛的范围

用户确认四项全部纳入同一个后续实施计划：统一节点文档保存、AGENTS 骨架及受控索引区块、物理路径原语、通用全仓登记树查询。全仓查询入口本轮直接下沉，不等待未来出现第二个业务消费者。此处记录的是用户确认的实施范围，目前只编写计划。

**Why:** 用户要求再次检查 Tasks、Memory、Note 是否还有通用能力可沉淀，并接受了全部四项建议。目标是删掉业务模块各自实现的基础设施，而不是继续搬迁业务专用操作或增加抽象层。

**How to apply:** 通用层提供机制，Tasks 的状态/项目规则、Memory 的类型/私有内容规则、Note 的 Git 发布流程仍由各自模块负责。保留非受控 Markdown、外部修改检查及已有单实例/命令锁合同。范围与步骤见[补充设计](../../../../../docs/superpowers/specs/2026-10-06-shared-node-capabilities.md)和[实施计划](../../../../../docs/superpowers/plans/2026-10-06-shared-node-capabilities.md)；不要据此把 Memory 发现未登记文件的物理盘点改成只查登记树。

## 通用能力计划的文件划分待复核

用户确认通用能力收敛的目标，但质疑已提交计划的实际文件划分过散、过于复杂。四项目标仍成立，文件划分和新增抽象需重新讨论；尚未确认替代方案。

**Why:** 将重复代码抽到公共位置，不等于应该新增一层公开接口或中间状态。用户关心的是架构理解与使用成本，不能仅以拆出更多小文件作为完成收敛的依据。

**How to apply:** 执行 shared-node-capabilities 计划前，先复核 NodeDocument 包装、独立查询入口及 AGENTS 文档辅助模块的必要性，优先评估既有 NodeService、InternalNode 与序列化实现能否直接承担。这里记录待复核事项，不代表用户已批准合并具体文件或取消已确认的 operations 分文件约定。

## 创建与保存的 Service 边界

用户进一步强调：保存、创建等完整操作应通过 Service，不应要求调用方直接操作 Model 后自行协调落盘。

**Why:** 上一轮“Model 管内容、Service 管 IO”的表述容易被理解成业务调用方需要自己拼接模型修改和保存流程。用户要求参照后端分层明确统一的操作入口，同时继续减少过散的文件和包装。

**How to apply:** Service 协调加载、调用模型规则、关联索引与持久化；Model 保留纯内存领域方法及 parse/serialize/validate，不执行文件 IO。对业务调用方提供完整的 Service 操作；模型内部可变实现与原地更新决策仍保留，不借此引入 immutable。通用能力应优先复用已有 NodeService 与模型实现；重新梳理的 spec/plan 已据此修订，具体实现尚未开始。

## models 与 operations 共同归入 domain

用户提出用 domain 目录包裹 models 和 operations，并要求将该布局一起写入计划。两者在 domain 内保持同级，services/commands/utils 留在 src 顶层。

**Why:** 模型和节点操作共同构成领域核心，归组能明确其与 Service 执行编排的边界；这是一处目录归组，不应引入新的调用层、DomainService 或 package。

**How to apply:** 用 TypeScript 脚本批量迁移并重算相对导入，operations 的算法分文件和泛型查询链继续保留。domain 不反向依赖 Service，类型依赖也纳入检查；服务提供遍历所需加载回调。Node 请求校验按实际职责归业务 Service，不能为了搬目录把已有反向依赖一起固化。以 shared-node-capabilities spec/plan 的 Task 0 和新布局为准；本轮仅改计划，代码目录尚未迁移。
