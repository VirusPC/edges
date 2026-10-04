# 节点领域模型设计

日期：2026-10-04。状态：会话已确认模型方向、目录职责及实例解析方式；本文为汇总稿，代码尚未按此重构。整仓目录迁移、节点识别策略和局部记忆恢复仍按 ADR 0024 分别推进。

## 模型与继承

```text
BaseNode           共同文档能力，可选 parent / children
├── InternalNode    AGENTS.md，从索引派生 children，组织直属节点
├── TaskNode        任务及其领域操作
└── MemoryNode      记忆及其领域操作

NodeTree           组织节点对象，不继承 BaseNode
```

BaseNode 提供共同的文件路径 path、文档内容、可选 metadata、身份、可选 parent / children 及文本转换能力。树结构是共同模型的一部分，所有子类继承树关系属性，但允许没有关系值。InternalNode 扩展 AGENTS 正文与索引处理，TaskNode、MemoryNode 等内容模型扩展自身字段与领域操作。模型统一位于 `extensions/cli/src/models/`，不创建独立 package。

NodeTree 组织已经加载的节点，提供查找、遍历及父子关系调整。跨文件系统层级的引用继续有效；父子关系表达逻辑归属，普通交叉引用不构成第二个 parent。

## 节点路径与引用

`path: string` 是 BaseNode 的必填属性，构造时传入，表示节点文档的文件位置。新节点在写入前也具有目标路径；携带路径不代表文件已经存在，模型不检查或读写文件。

service 在构造节点前，结合明确的当前 scope 解析相对路径和本层简写，节点内统一保存绝对路径，避免后续操作随进程工作目录变化。本层简写依据当前作用域已登记的目录布局解析，不写死全局目录。新建或登记下层节点时显式提供目标路径；读取已登记节点时使用现有引用即可。

`NodeReference.target` 表达文档中的引用目标：相对路径以持有引用的 AGENTS.md 所在目录为基准解析，定位到目标节点的 path。写入 AGENTS 时仍可使用相对链接，不将机器上的绝对路径写进索引。

path 负责文件定位，BaseNode 的可选 parent / children 表达树组织关系。内容节点可独立存在，也可建立归属关系。不能用 dirname 推导父节点，也不能把物理目录扫描当成归属树；根 AGENTS 可以直接引用跨多层目录的节点。`localMemory` / `descendantMemory` 只标识索引章节，不是目录路径，也不是 CRUD 的目标参数。

path 对调用方只读，不作为普通内容字段更新。`parse()` 不改变 path，`serialize()` 不自动将 path 写进 YAML。NodeTree.move 只调整归属，不改变文件位置；物理文件迁移由 service 单独协调，不通过修改 path 后调用 update 隐式完成。

## 实例解析与序列化

`parse(markdown): this` 和 `serialize(): string` 均为实例方法。构造函数只初始化状态，不调用可被子类覆盖的方法。由调用方先选择具体类型、创建实例，再解析文本。

BaseNode 负责通用文档流程，子类通过 `parseBody` 与 `serializeBody` 解释、生成自己的正文：

```text
parse(markdown)
  → gray-matter 默认解析 metadata / content
  → this.parseBody(content)
  → 返回当前实例

serialize()
  → this.serializeBody()
  → gray-matter 默认序列化
  → 返回 Markdown
```

InternalNode 在正文扩展点处理 AGENTS 三部分与索引。TaskNode、MemoryNode 复用普通 Markdown 正文处理，必要的字段校验和领域操作在各自模型内实现。重复解析表示用新文档替换当前文档内容，不能累加旧的章节或索引。

不自定义 YAML engine、schema、日期、别名或格式保留，不直接依赖 js-yaml。不符合文档约定时修正文档，不加兼容分支。保留既有的非 YAML 语言声明拒绝，以防读取文档时激活 JavaScript 引擎；这不改变 YAML 数据解析方式。

## 三部分内容与树关系

InternalNode 以 AGENTS 三部分的结构化内容为正文真源：

| 内容 | 含义 |
| --- | --- |
| 本层重要约束 | 当前节点的约束内容 |
| 本层记忆 | 本层直属内容的归属索引 |
| 下层记忆索引 | 下层组织节点的归属索引 |

InternalNode 的 `children` 是后两部分中归属索引的统一派生视图，包括 Internal、Task、Memory 等所有直属节点。所有引用统一使用 NodeReference，不另设 ChildReference；kind 在通用类型中可选，用于 parent 或普通引用时可以省略，用于 children 时必须有值。本层记忆派生为 local，下层记忆索引派生为 descendant。kind 是引用关系的分类，与目标节点的 type 和物理路径无关，两类引用都可能指向 AGENTS.md。不单独保存另一份可修改数组，也不在章节条目中重复存储 kind。普通参考链接不因出现在正文里就成为归属关系。

children 的 kind 约束由模型和树操作校验；InternalNode 解析时从章节补全，其他来源的 children 缺少 kind 时应报错，不能默认当作 local 或静默跳过。省略 kind 的普通 NodeReference 仍可用于 find 等按目标定位的操作。

增删子节点实际修改对应章节索引；序列化仍输出三部分，不新增 children 章节或 YAML 字段。InternalNode 的正文由三部分生成，不能同时维护可独立修改的正文与章节副本。为保留原文中的未建模内容，可以保留只读来源快照；它不是第二份当前状态。

parent 与 children 均定义在 BaseNode，允许值为 undefined。parent 是组树时依据归属索引建立的反向引用，根节点或尚未挂接的节点为 undefined。children 未提供时为 undefined；提供集合但没有子节点时为 []。InternalNode 覆盖 children 的读取逻辑，始终返回由索引派生的集合，无条目时返回 []。身份、parent 和 children 不自动写入 YAML；原有 YAML 中同名字段仍是 metadata 的数据。

Note、Task、Memory 等内容节点继承相同的可选树关系，独立存在时无需提供 parent 或 children。被挂接到树后，同样建立 parent；其归属仍以组织节点的索引为依据，普通交叉引用不算归属。

InternalNode 的索引编辑针对单个文档；NodeTree 协调已加载节点之间的关系：attach 按 kind 更新父节点对应章节索引并建立 child.parent，move 移除旧父索引、按目标 kind 添加新父索引并更新 child.parent，detach 移除原归属索引并清除 child.parent。上述规则适用于所有节点类型。公开方法使用 ChildKind，由 InternalNode 将 local / descendant 映射到对应章节，不再另传 IndexSection。children 缺省或为空时无子节点可遍历。文件移动、加载、保存由 services 协调，不在模型里操作磁盘。

## 作用域读取与遍历

给定一个目录作用域，默认读取入口的本层约束及 local 引用的内容，不展开 descendant 所指向的下层作用域。local 入口若还有 local 子引用，继续沿 local 关系读取，覆盖本层类型入口与条目；遇到 descendant 则停止。不能因为目标文件叫 AGENTS.md 或位于物理子目录就自动跨入下层作用域。

`includeDescendants` 默认为 false；只有显式设置为 true，才同时沿 local 和 descendant 关系展开。它控制是否跨入下层作用域，不限制本层 local 索引链的层数。

- service.list(scopePath, options) 在读取目标文件之前应用关系筛选，不先加载下层作用域再过滤结果。
- NodeTree.walk(options) 从当前 root 出发，对已加载节点应用同样的规则；即使 descendant 目标已在内存中，默认遍历也不沿 descendant 关系访问它。
- service.get(path) 只读取指定文档，不自动加载其引用目标。

解析和序列化仍保留 AGENTS 中的两类索引。只读取本层内容是一项加载、遍历策略，不能因此删除 descendant 引用或在写回时丢失下层索引。本层重要约束也不因仅选择 local 子引用而被忽略。

```ts
tree.walk();                             // 当前根节点及 local 可达节点
tree.walk({ includeDescendants: true }); // 显式包含下层作用域
```

## Service 增删改查

services 统一负责节点的增删改查及文档、归属索引的同步，采用以下职责边界；具体方法签名在实施时确定。

| 操作 | Service 职责 |
| --- | --- |
| create(node) | 根据 node.path 创建节点文档，协调所属节点的索引登记并保存 |
| get(path) | 读取指定文档，选择对应模型，以解析后的路径构造实例并调用 parse，返回节点对象 |
| list(scopePath, options) | 按作用域入口的归属索引加载本层内容；默认只沿 local，显式 includeDescendants 才跨入下层作用域；不以递归扫描物理目录替代索引 |
| update(node) | 协调领域操作，调用 serialize 写回 node.path，并同步受影响的归属索引 |
| destroy(node) | 删除 node.path 对应的节点文档，并同步移除对应归属索引 |

已有节点对象时，写操作直接使用 node.path，不再另传一份可能与节点不一致的目标路径；尚未加载节点时，查询仍需路径输入。以下示意省略所属节点等操作上下文，不定义额外的 service 类层级：

```ts
// taskPath 已由 service 根据当前 scope 解析为绝对路径。
const task = new TaskNode(taskPath);
task.parse(markdown);

await service.create(task);
const existing = await service.get(taskPath);

await service.update(task);
await service.destroy(task);
```

创建时的归属上下文由业务调用方显式提供或由已加载的树获得，不能从 node.path 猜测；service 据此协调所属 AGENTS 的索引同步。

model 的 setStatus、setBody、addChild 等方法只改变内存中的领域状态；service 的 update 负责将变更写入文件。NodeTree.find/walk 只查询已加载的树，service 的 get/list 负责持久化内容的读取。模型及 NodeTree 不直接执行文件读写或 Git 操作。

## 公共类型草案

以下声明展示职责与扩展点，不是实现代码。Task、Memory 的具体字段操作沿用现有业务规则，不新增状态转换规则或记忆类型注册机制。

```ts
type Metadata = Record<string, unknown>;

type ChildKind = "local" | "descendant";

interface NodeReference {
  // 文档引用；相对路径以持有引用的 AGENTS.md 所在目录为基准。
  target: string;
  label?: string;
  // children 中必须有值；parent 或普通引用可省略。
  kind?: ChildKind;
}

interface ScopeTraversalOptions {
  // 默认 false：只沿 local；true：同时沿 local 和 descendant。
  includeDescendants?: boolean;
}

interface NodeIndexEntry {
  reference: NodeReference;
  description?: string;
}

interface InternalContent {
  readonly constraints: readonly string[];
  readonly localMemory: readonly NodeIndexEntry[];
  readonly descendantMemory: readonly NodeIndexEntry[];
}

declare class BaseNode<TType extends string = string> {
  constructor(path: string);
  readonly path: string;
  readonly type: TType;
  readonly id?: string;
  get parent(): NodeReference | undefined;
  get children(): readonly NodeReference[] | undefined;
  get metadata(): Readonly<Metadata> | undefined;
  get body(): string;

  parse(markdown: string): this;
  serialize(): string;
  protected parseBody(markdown: string): void;
  protected serializeBody(): string;

  setMetadata(key: string, value: unknown): void;
  removeMetadata(key: string): void;
  setBody(markdown: string): void;
}

declare class InternalNode extends BaseNode<"internal"> {
  get content(): InternalContent;
  override get children(): readonly NodeReference[];
  protected override parseBody(markdown: string): void;
  protected override serializeBody(): string;
  setConstraints(items: readonly string[]): void;
  addChild(entry: NodeIndexEntry, kind: ChildKind): void;
  removeChild(reference: NodeReference): void;
}

type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review"
  | "done" | "blocked" | "cancelled";
type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

declare class TaskNode extends BaseNode<"task"> {
  get title(): string;
  get status(): TaskStatus;
  get assignee(): string | undefined;
  get priority(): TaskPriority;
  setTitle(title: string): void;
  setStatus(status: TaskStatus): void;
  assign(assignee: string | undefined): void;
  setPriority(priority: TaskPriority): void;
}

declare class MemoryNode extends BaseNode<"memory"> {
  get memoryType(): string | undefined;
  get description(): string | undefined;
  setMemoryType(type: string): void;
  setDescription(description: string): void;
}

declare class NodeTree {
  constructor(root: InternalNode, nodes?: Iterable<BaseNode>);
  readonly root: InternalNode;
  find(reference: NodeReference): BaseNode | undefined;
  walk(options?: ScopeTraversalOptions): Iterable<BaseNode>;
  attach(parent: InternalNode, child: BaseNode, kind: ChildKind): void;
  move(child: BaseNode, newParent: InternalNode, kind: ChildKind): void;
  detach(child: BaseNode): void;
}
```

Task 的状态、负责人、优先级，以及 Memory 的内容分类，是 metadata 的类型化访问，不独立存储第二份字段。运行时节点 type 不自动写入 YAML，也不与 Memory 内容分类混为一谈。

## 源码组织

```text
extensions/cli/src/
├── commands/                 CLI 参数、调用与输出
├── models/
│   ├── base-node.ts
│   ├── internal-node.ts
│   ├── task-node.ts
│   ├── memory-node.ts
│   ├── node-tree.ts
│   └── types.ts
├── services/                 增删改查、文档与索引同步、跨对象流程协调
└── utils/                    无领域含义的基础工具
```

不设置顶层 core、tasks、memory、codecs 或 storage 来分散模型。解析辅助代码变长时收在相应模型目录内，职责分离不强制变成顶层目录分离。services 不接管节点自身的领域规则，也不要求每种模型机械配一个 service。

## 与当前实现的关系

当前 `utils/node-tree/` 的纯数据模型、外部 codec 和仓储组合函数是重构起点，不是本设计已实现的证据。后续实施需迁移现有命令调用、AGENTS 正文处理、Task 字段操作及文件身份校验；重构过程中保留 CLI 输出契约和现有业务规则。

本文不授权修复整仓物理目录迁移、移动 knowledge/posts、接入 Python Memory 或改变 CLI 当前作用域筛选策略。它们仍有独立范围与验收责任。

## 参考

- [npm Arborist](https://github.com/npm/cli/blob/latest/workspaces/arborist/README.md)：具有操作行为的节点与整树管理分开；Edges 的归属为逻辑关系，不照搬其物理目录关系。
- [GitHub CLI 命令开发约定](https://github.com/cli/cli/blob/trunk/docs/command-development.md)：按命令功能组织入口与依赖。
- [oclif 基类](https://oclif.io/docs/base_class/)：通过浅层继承共享共同操作；命令基类与节点领域基类的职责不同。
