# Tasks、Memory、Note 通用能力收敛

状态：待实施。用户已确认四项全部纳入本轮计划；本文件不表示实现已经完成。

## 目标与依据

在已完成的节点单实例、通用 operations、命令锁及原子保存之上，消除业务模块中的重复基础设施。此次不调整目录协议、节点继承关系或 CLI 产品行为。

当前仍有四处收敛空间：

1. Tasks 的项目/看板 AGENTS.md 通过 BoardWriter 直接写入，而 Memory 自己维护文档加载/保存包装。节点文档应统一经过 NodeService，读取快照必须发生在生成修改之前。
2. Tasks 手拼 AGENTS 三段骨架及 task-projects 区块，Memory 另有模板和索引区块处理。三段结构、受控区块替换及链接编码可以共享，内容与归属政策仍由业务模块决定。
3. Tasks、Memory、Note 重复处理路径包含关系、符号链接与祖先查找。共享物理路径机制，保留 scope、私有目录、看板和 Git 发布的不同边界政策。
4. repositoryNodeQuery 位于 Tasks，却已支持任意节点类型。将其移至通用 Service 目录；本轮直接迁移，不等待未来消费者。

## 分层

- `models/internal/`：AGENTS 结构与受控文本处理，纯函数，无文件 IO。
- `utils/filesystem.ts`：路径与文件系统检查原语，不决定业务权限。
- `utils/markdown/index-rendering.ts`：通用索引文本转义与链接路径编码，保持现有输出规则。
- `services/node-documents.ts`：薄文档加载/保存函数，使用调用方传入的 NodeService 和模型构造器；不新增缓存、会话或事务层。
- `services/node-query.ts`：显式全仓登记树查询入口；加载仍由 NodeService 完成，集合操作仍由 operations 完成。
- `services/tasks/`、`services/memory/`、`services/note/`：业务规则、模板内容、权限政策和命令编排。

Tasks 的状态、项目标题/描述、默认项目排序、run log、项目归属；Memory 的类型、provenance、私有内容及 ignore 校验；Note 的标题、Git 分支/提交/PR 流程均留在业务层。不将它们变成 BaseNode 的条件分支。

## 保存契约

已有文档通过同一个 NodeService 加载、修改、保存，同路径保持同一个受管实例。通用文档函数只是减少“get 或 new，再 update 或 create”的重复；不替代 Node 模型自己的 parse、serialize、validate。

Tasks 的 TaskNode CRUD 已走 NodeService，保持原路径。新增项目/看板索引写入适配使用 scope 为 managedRoot 的专用 Service，写权限仅覆盖当前看板目录以及已存在的 scope AGENTS.md；不能借此写其他模块或自动初始化一个缺失的 scope 入口。缺失目录的创建由原有 Tasks 编排负责。

Memory 加载前的私有类型 ignore 准备、只读类型限制保留在 Memory 适配层。Note 在 Git checkout/pull 之后加载节点；不能提前读取而绕过它的发布前检查。

普通文本 `.gitignore` 不伪装成 Node：复用 `node-files.ts` 的 readEntry/saveEntries。读取后再计算新文本；无变化不写；保留既有文件权限、新建权限及外部修改检查。run log 等资源仍可使用业务文件接口，不要求全部进入节点模型。

不承诺一条业务命令中的所有 NodeService 调用构成多文件 ACID 事务。保留已有单次生命周期操作的校验与失败恢复，禁止借重构删除这些保证。

## AGENTS 与索引契约

三段名称及顺序由现有 layout/serializer 定义：本层硬约束、本层记忆、下层记忆索引。Tasks 新建骨架调用共用生成函数；Memory 继续读取对外分发的模板内容，通过同一个区块维护原语填充。模板中的指导文字不得因代码去重而删除。

受控区块由明确的 start/end 标记定位。只改对应区块；外部正文、注释、其他模块索引和未修改链接拼写保留。成对标记缺失、重复、逆序或不明确的嵌套必须报错，不猜测性修复。完全没有目标标记时，才按调用方指定位置插入。

Tasks 的 task-projects 放在本层记忆；Memory 类型入口的 entries 可位于文档级。维护一个区块不能清空整段 localChildren。旧项目链接如何收编、业务条目如何排序属于各自适配层。

## 路径与查询契约

路径工具回答“是否在目录内”“缺失叶子的真实路径是什么”“指定范围内哪里存在符号链接”“祖先在哪里”。调用方决定是否允许链接、在哪里停止及什么错误对用户可见。目录同名前缀不代表包含关系；`..draft` 是合法目录名，不等于 `..`。

`repositoryNodeQuery(root, types?)` 从显式 root 的登记树查询全部 descendant 与 harness 层级；不自动查找 Git 根。省略 types 表示全部类型。Tasks 调用方必须显式传入 `['task']` 或 `['internal']`，维持现有跳过无关叶子正文的行为。默认局部 query/list 的范围不改变。

查询继续惰性组合，只有 value() 执行；filter 不改变树导航，types 可跳过确定无关叶子的正文解析但不能遗漏该叶子的 harness。禁止增加物理目录扫描兜底。Memory doctor/index 重建需要发现未登记文件，仍保留业务物理盘点，不替换成登记树查询。

## 全局约束

- TypeScript；Node >=20；不新增运行时依赖或独立 package。
- 仅在独立 worktree 修改；不迁移仓库真实内容或用户私有数据。
- 保留 NodeService 内同路径单实例、原地更新与实际受影响节点保存语义。
- 保留命令写锁、文件快照冲突检查、单文件原子保存与既有失败恢复。
- 保留 Markdown 非受控区域；不要求保留 YAML 注释或 YAML 样式。
- 保留 CLI 参数、输出协议、默认 scope 与查询范围；不新增 CLI 命令。
- 通用 operations 与 models/services 同级，算法按文件拆分；不引入 NodeTree、全局 Service 或事务框架。

## 验收

四项都完成，且 Tasks、Memory、Note 的业务行为回归通过；项目与看板 AGENTS.md 不再通过 BoardWriter 直接保存；Memory 不再实现另一套原子写；Tasks 不再拥有通用 repositoryNodeQuery；共享底层不反向导入业务 Service。异常写入、未受控内容、私有目录、scope 边界、惰性查询和全部类型查询都有针对性用例。

实施步骤见[计划](../plans/2026-10-06-shared-node-capabilities.md)。
