# 节点领域模型设计

日期：2026-10-04。状态：会话已确认模型方向、目录职责及实例解析方式；本文为汇总稿，代码尚未按此重构。整仓目录迁移、节点识别策略和局部记忆恢复仍按 ADR 0024 分别推进。

## 模型与继承

```text
BaseNode
├── InternalNode    AGENTS.md，组织直属节点
├── TaskNode        任务及其领域操作
└── MemoryNode      记忆及其领域操作

NodeTree           组织节点对象，不继承 BaseNode
```

BaseNode 提供共同的文档内容、可选 metadata、身份、parent 引用及文本转换能力。InternalNode、TaskNode、MemoryNode 是有行为的领域对象，既解释各自数据，也承担自身操作。模型统一位于 `extensions/cli/src/models/`，不创建独立 package。

NodeTree 组织已经加载的节点，提供查找、遍历及父子关系调整。跨文件系统层级的引用继续有效；父子关系表达逻辑归属，普通交叉引用不构成第二个 parent。

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

`children` 是后两部分中归属索引的统一派生视图，包括 Internal、Task、Memory 等所有直属节点，不单独保存另一份可修改数组。普通参考链接不因出现在正文里就成为归属关系。

增删子节点实际修改对应章节索引；序列化仍输出三部分，不新增 children 章节或 YAML 字段。InternalNode 的正文由三部分生成，不能同时维护可独立修改的正文与章节副本。为保留原文中的未建模内容，可以保留只读来源快照；它不是第二份当前状态。

parent 位于 BaseNode，表示组树过程建立的上下文。身份、parent 及由索引派生的 children 不自动写入 YAML；原有 YAML 中同名字段仍是 metadata 的数据。

InternalNode 的索引编辑针对单个文档；NodeTree 的挂接、移动负责协调已加载节点间的归属与 parent。文件移动、加载、保存由 services 协调，不在模型里操作磁盘。

## Service 增删改查

services 统一负责节点的增删改查及文档、归属索引的同步，采用以下职责边界；具体方法签名在实施时确定。

| 操作 | Service 职责 |
| --- | --- |
| create | 创建节点文档，协调所属节点的索引登记并保存 |
| get / list | 查询、读取文档，选择对应模型并调用实例 parse，返回节点对象 |
| update | 协调领域操作，调用 serialize 保存文档，并同步受影响的归属索引 |
| destroy | 删除节点文档，并同步移除对应归属索引 |

model 的 setStatus、setBody、addChild 等方法只改变内存中的领域状态；service 的 update 负责将变更写入文件。NodeTree.find/walk 只查询已加载的树，service 的 get/list 负责持久化内容的读取。模型及 NodeTree 不直接执行文件读写或 Git 操作。

## 公共类型草案

以下声明展示职责与扩展点，不是实现代码。Task、Memory 的具体字段操作沿用现有业务规则，不新增状态转换规则或记忆类型注册机制。

```ts
type Metadata = Record<string, unknown>;

interface NodeReference {
  target: string;
  label?: string;
}

type IndexSection = "localMemory" | "descendantMemory";

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
  constructor();
  readonly type: TType;
  readonly id?: string;
  get parent(): NodeReference | undefined;
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
  get children(): readonly NodeReference[];
  protected override parseBody(markdown: string): void;
  protected override serializeBody(): string;
  setConstraints(items: readonly string[]): void;
  addChild(entry: NodeIndexEntry, section: IndexSection): void;
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
  walk(): Iterable<BaseNode>;
  attach(parent: InternalNode, child: BaseNode, section: IndexSection): void;
  move(child: BaseNode, newParent: InternalNode, section: IndexSection): void;
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
