# 节点领域模型设计

日期：2026-10-04；2026-10-05 开始按[实施计划](../plans/2026-10-05-node-domain-model-implementation.md)继续执行。会话已确认模型方向、目录职责及实例解析方式；实现状态以该计划的验收记录为准。整仓目录迁移、节点识别策略和局部记忆恢复仍按 ADR 0024 分别推进。

## 模型与继承

```text
BaseNode           共同文档能力，可选 parent / children
├── InternalNode    AGENTS.md，从索引派生 children，组织直属节点
├── TaskNode        任务及其领域操作
├── MemoryNode      项目记忆及其领域操作
├── NoteNode        笔记及其领域操作
└── SkillNode       SKILL.md 及其领域操作
```

BaseNode 提供共同的文件路径 path、文档内容、可选 metadata、身份、可选 parent / children 及文本转换能力。树结构是共同模型的一部分，所有子类继承树关系属性，但允许没有关系值。InternalNode 扩展 AGENTS 正文与索引处理，TaskNode、MemoryNode、NoteNode、SkillNode 扩展自身字段与领域操作，彼此并列继承 BaseNode。模型统一位于 `extensions/cli/src/models/`，不创建独立 package。

NoteNode 表达知识捕获与整理的笔记，MemoryNode 表达供作用域长期复用的项目记忆，两者不因都是 Markdown 就互相继承。NoteNode.title 沿用现有 Note 的一级标题，读写作用于 body，不另造 title YAML 字段；不把某个笔记 skill 的章节模板强加给所有 Note。

SkillNode 表达以 SKILL.md 为入口的完整 Skill 目录；name/description 是入口 frontmatter 字段的类型化访问，步骤和说明由 body 承载。managed/referenced 是来源与维护职责，不是两种 SkillNode 子类；service 写入时遵守相应来源权限。scripts、references、assets 及其他附属文件属于资源目录，不自动成为 children。节点服务处理内容与目录资源的生命周期，宿主安装、链接和执行技能仍由既有流程负责。

不单独定义 NodeTree。公共 NodeService 负责引用加载、作用域查询和跨节点归属协调，节点模型只维护自身内容与索引。children 保存 NodeReference，不因递归需要就改成完整子节点对象或让模型执行文件读取。跨文件系统层级的引用继续有效；父子关系表达逻辑归属，普通交叉引用不构成第二个 parent。

## 节点路径与引用

`path: string` 是 BaseNode 的必填属性，构造时传入，表示节点文档的文件位置。新节点在写入前也具有目标路径；携带路径不代表文件已经存在，模型不检查或读写文件。

构造节点或调用公共 service 接口前，结合明确的当前 scope 解析用户输入的相对路径和本层简写；公共接口的 path/scopePath 参数及节点内部 path 统一使用绝对路径，避免依赖隐含工作目录或 service 的默认根。本层简写依据当前作用域已登记的目录布局解析，不写死全局目录。新建或登记下层节点时显式提供目标路径；读取已登记节点时由 service 按引用所在文档的位置解析目标路径即可。

`NodeReference.target` 表达文档中的引用目标：相对路径以持有引用的 AGENTS.md 所在目录为基准解析，定位到目标节点的 path。写入 AGENTS 时仍可使用相对链接，不将机器上的绝对路径写进索引。

NodeReference 同时承载索引的 label（链接文字）和 description（条目说明），不另设 NodeIndexEntry 或 reference 包装层。description 描述当前引用条目，不自动同步目标文档的 metadata.description。

path 负责文件定位，BaseNode 的可选 parent / children 表达树组织关系。内容节点可独立存在，也可建立归属关系。不能用 dirname 推导父节点，也不能把物理目录扫描当成归属树；根 AGENTS 可以直接引用跨多层目录的节点。`localMemory` / `descendantMemory` 只标识索引章节，不是目录路径，也不是 CRUD 的目标参数。

path 对调用方只读，不作为普通内容字段更新。`parse()` 不改变 path，`serialize()` 不自动将 path 写进 YAML。service.reparent 只调整归属，不改变文件位置；物理文件迁移另行协调，不通过修改 path 后调用 update 隐式完成。

## 单文件、目录入口与资源归属

Memory、Task、Note 支持独立 Markdown 文件和“目录入口 + 附属资源”两种形式；不批量强制转换现有内容。AGENTS 始终索引入口文件。2026-10-05 实施默认约定：普通内容的目录入口固定为 `index.md`，Skill 按标准固定为 `SKILL.md`；入口命名已向用户提供选择，在未收到不同偏好时采用此默认值。

```text
notes/example.md            # 单文件节点
notes/example/index.md      # 目录节点的入口
notes/example/diagram.png   # 同一节点的资源
skills/example/SKILL.md      # Skill 的入口
skills/example/scripts/... # Skill 的资源
```

`path` 始终指入口文件，新增只读 `directoryPath?: string` 表达完整资源单元：TaskNode、MemoryNode、NoteNode 仅在入口文件名为 `index.md` 时具有该值；SkillNode 必须使用 `SKILL.md` 并拥有其所在目录；BaseNode 和 InternalNode 不因文件恰好位于某目录而拥有整个目录。加载按具体模型与固定入口命名判断，不扫描邻居或猜测任意 Markdown 的附件归属。入口更新只修改正文；资源保持原样。单文件节点不拥有旁边的图片或其他文件。

创建普通内容显式选择 `file` 或 `directory`，默认 `file` 保留现有调用行为；已有目录入口按原形式更新。目录单元的物理移动包括其附件，Task 的状态移动也包括其运行记录；不得通过修改 node.path 隐式完成。销毁目录单元可删除其资源，但须先检查逻辑 children、写权限及真实文件边界，不跟随资源内的外部符号链接删除外部目标。InternalNode 的销毁仍只针对入口文档，不自动删除整个作用域。宿主安装来源的 Skill 继续只读。

目录资源与父子关系互相独立：前者决定物理文件生命周期，后者由 AGENTS 的归属索引决定。`reparent` 只修改后者，不移动资源目录。

2026-10-05 Task 4 已实现：新建 `memory remember`、`tasks create`、`note` 可传 `--format file|directory`；Skill 固定目录。普通 Memory 的目录名沿用 `type_slug`，Task 沿用 stem，Note 沿用日期与 slug；入口均为 `index.md`。Task 目录格式的 `.{stem}.log.md` 在该目录内。枚举只检查已登记类型/看板层的独立入口及一层目录入口，不递归把资源 Markdown 当节点；索引仍写到入口文件。已有目录不因未传 format 被转成单文件；两种入口同名存在时拒绝歧义。

`move<T>(node, destinationEntryPath, parent?)` 返回相同模型的新实例，旧实例不再具有有效写快照。它保持 id、资源字节和权限，不允许隐式 file/directory 转换，也不接管已经存在的目的资源目录。已知或显式父索引同步改为新入口 href，保留 label、description、kind 及 query/fragment；不猜未知外部引用，不重写普通正文链接。当前明确不支持 InternalNode 或任意模型的 `AGENTS.md` 路径移动，组织作用域迁移仍走专用流程。

资源快照覆盖目录/文件身份、权限、文件字节与符号链接本身；更新、移动和删除前校验，不跟随资源链接写入或删除外部目标。已发现的只读目录来源同时限制资源文件的后续非类型化读取对象。销毁先将目录改名为同级 `.node-recovery-*`，保存父索引后清理；该恢复目录也在写前经过权限与私有 ignore 预检。失败时尽力恢复，若目录被替换或恢复失败则报告实际恢复路径并保留数据，不宣称跨文件原子性。调用方应重新加载失败涉及的节点。拥有 `AGENTS.md` 作用域边界、嵌套 `SKILL.md` 或已加载且已登记的独立逻辑子节点的目录拒绝整单元移动/销毁；这是保守的生命周期边界，不将任意资源 `index.md` 推断为子节点。

`create(node, placement?, { resources?: absoluteDirectory })` 仅给新目录节点显式导入资源。Memory/Note 对应 `--format directory --resources <directory>`：只复制被显式选择目录内的相对路径，不猜 content-file 邻居。导入拒绝 symlink、特殊文件、入口覆盖以及 AGENTS.md/SKILL.md 边界；这是导入限制，不是节点类型推断。已有目录不接受合并导入。createMode 只决定入口权限；新资源默认保留源文件权限。可选 resourceMode(node, sourceMode) 独立返回 0 至 0o777 的整数权限位，在首次写入前校验。Memory 适配器按已登记类型策略处理：公开资源保留原权限，私有资源清除 group/other 权限，非执行文件为 0600、保留 owner execute 的脚本为 0700。导入失败报告仍需人工恢复的路径。

Note `--content-file <path> --markdown` 接收已经写好和审阅过的完整 UTF-8 Markdown；保留作者正文与标题，不额外套 ingest 模板。文档仍通过标准 BaseNode.parse/serialize 和 gray-matter，YAML 可规范化，不保证 frontmatter 字节/样式/注释保真，也不把 YAML 塞进 body。`--title` 仍用于文件名和提交信息。此入口不取代 conversation-to-notes 的写作/审阅流程，也不改变鉴权、Git、PR 或发布默认值。


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

InternalNode 在正文扩展点处理 AGENTS 三部分与索引。TaskNode、MemoryNode、NoteNode、SkillNode 复用共同的 Markdown/frontmatter 流程，必要的正文解释、字段校验和领域操作在各自模型内实现。重复解析表示用新文档替换当前文档内容，不能累加旧的章节或索引。

不自定义 YAML engine、schema、日期、别名或格式保留，不直接依赖 js-yaml。不符合文档约定时修正文档，不加兼容分支。保留既有的非 YAML 语言声明拒绝，以防读取文档时激活 JavaScript 引擎；这不改变 YAML 数据解析方式。

## 三部分内容与树关系

InternalNode 以 AGENTS 三部分的结构化内容为正文真源：

| 内容 | 含义 |
| --- | --- |
| 本层重要约束 | 当前节点的约束内容 |
| 本层记忆 | 本层直属内容的归属索引 |
| 下层记忆索引 | 下层组织节点的归属索引 |

InternalNode 的 `children` 是后两部分中归属索引的统一派生视图，包括 Internal、Task、Memory 等所有直属节点。所有引用统一使用 NodeReference，不另设 ChildReference；kind 在通用类型中可选，用于 parent 或普通引用时可以省略，用于 children 时必须有值。本层记忆派生为 local，下层记忆索引派生为 descendant。kind 是引用关系的分类，与目标节点的 type 和物理路径无关，两类引用都可能指向 AGENTS.md。不单独保存另一份可修改数组，也不在章节条目中重复存储 kind。普通参考链接不因出现在正文里就成为归属关系。

children 的 kind 约束由模型和 service 校验；InternalNode 解析时从章节补全，其他来源的 children 缺少 kind 时应报错，不能默认当作 local 或静默跳过。普通引用可省略 kind，由 service 解析 target 后按路径读取目标。

增删子节点实际修改对应章节索引；序列化仍输出三部分，不新增 children 章节或 YAML 字段。InternalNode 的正文由三部分生成，不能同时维护可独立修改的正文与章节副本。为保留原文中的未建模内容，可以保留只读来源快照；它不是第二份当前状态。

parent 与 children 均定义在 BaseNode，允许值为 undefined。parent 是组树时依据归属索引建立的反向引用，根节点或尚未挂接的节点为 undefined。children 未提供时为 undefined；提供集合但没有子节点时为 []。InternalNode 覆盖 children 的读取逻辑，始终返回由索引派生的集合，无条目时返回 []。身份、parent 和 children 不自动写入 YAML；原有 YAML 中同名字段仍是 metadata 的数据。

Note、Task、Memory 等内容节点继承相同的可选树关系，独立存在时无需提供 parent 或 children。被挂接到树后，同样建立 parent；其归属仍以组织节点的索引为依据，普通交叉引用不算归属。

InternalNode 的索引编辑针对单个文档；addChild(reference) 从 reference.kind 确定写入章节，调用时必须提供 kind，不再重复传递分类参数。章节内直接保存 NodeReference 条目，children 视图从章节派生 kind。跨节点操作由 service 调用这些模型方法，协调归属索引、child.parent 及相关文件保存，规则适用于所有节点类型；模型方法本身不保存文件。children 缺省或为空时无子节点可遍历。

## 作用域读取与遍历

给定一个目录作用域，默认读取入口的本层约束及 local 引用的内容，不展开 descendant 所指向的下层作用域。local 入口若还有 local 子引用，继续沿 local 关系读取，覆盖本层类型入口与条目；遇到 descendant 则停止。不能因为目标文件叫 AGENTS.md 或位于物理子目录就自动跨入下层作用域。

`includeDescendants` 默认为 false；只有显式设置为 true，才同时沿 local 和 descendant 关系展开。它控制是否跨入下层作用域，不限制本层 local 索引链的层数。

- service.list(scopePath, options) 在读取目标文件之前应用关系筛选，不先加载下层作用域再过滤结果。
- service.list 从指定作用域入口出发，对已加载节点也应用同样的规则；即使 descendant 目标已在内存中，默认查询也不沿 descendant 关系访问它。
- service.get(path) 只读取指定文档，不自动加载其引用目标。

对外保留 list 一个作用域遍历入口，不重复暴露 walk/traverse。service 内部可以拆出 traverse 辅助函数，负责遍历顺序、去重和环检测，由 service 提供节点加载能力；该函数不拥有文件系统依赖，也不形成新的领域类。已加载节点的查找属于 service 内部实现，不另设公开 find 或整树容器。

解析和序列化仍保留 AGENTS 中的两类索引。只读取本层内容是一项加载、遍历策略，不能因此删除 descendant 引用或在写回时丢失下层索引。本层重要约束也不因仅选择 local 子引用而被忽略。

```ts
await service.list(scopePath);                             // 入口节点及 local 可达节点
await service.list(scopePath, { includeDescendants: true }); // 显式包含下层作用域
```

## 公共 NodeService 接口

公共 NodeService 统一负责节点增删改查、引用加载与跨节点归属协调。所有公开操作为异步方法；get/list 只读，其余操作执行文件保存。它调用模型的解析、序列化和领域方法，不接管模型内部的字段规则，也不要求每种模型机械配一个 service。

| 操作 | Service 职责 |
| --- | --- |
| create(node, placement?) | 创建 node.path；可同时显式提供 parent/kind，登记并保存父索引；目标已存在时报错 |
| get(path, Model?) | 只读取指定文档，以解析后的路径构造实例并调用 parse；不存在返回 undefined |
| list(scopePath, options?) | 返回作用域入口及所选引用可达的节点；默认仅 local，显式 includeDescendants 才包含下层作用域 |
| update(node) | serialize 后写回 node.path；更新索引时协调已加载节点的反向关系；目标不存在时报错，不隐式创建 |
| move(node, destinationEntryPath, parent?) | 同布局移动入口与所属资源，协调已知父索引，返回同模型新实例；不支持组织入口 |
| destroy(node, parent?) | 删除当前文档或其明确拥有的资源目录，按归属上下文移除并保存父索引；不隐式级联删除逻辑子节点 |
| attach(parent, child, kind) | 将已有文档登记到父索引，更新 child.parent 并保存父文档；不创建或移动 child 文件 |
| detach(parent, child) | 移除指定父索引中的归属，清除对应 child.parent 并保存父文档；保留 child 文件 |
| reparent(child, oldParent, newParent, kind) | 将归属从旧父移到新父，同步引用路径、parent 并保存两份索引；不移动 child 文件 |

```ts
declare class NodeService {
  // 无 placement 时只创建独立文档；有 placement 时同时登记父索引。
  create(
    node: BaseNode,
    placement?: { parent: InternalNode; kind: ChildKind },
    options?: { resources?: string },
  ): Promise<void>;

  // 默认使用基础模型；传入具体模型构造器时返回对应类型。
  get(path: string): Promise<BaseNode | undefined>;
  get<T extends BaseNode>(
    path: string,
    Model: new (path: string) => T,
  ): Promise<T | undefined>;

  list(scopePath: string, options?: ScopeTraversalOptions): Promise<BaseNode[]>;
  update(node: BaseNode): Promise<void>;
  destroy(node: BaseNode, parent?: InternalNode): Promise<void>;
  move<T extends BaseNode>(node: T, destinationEntryPath: string, parent?: InternalNode): Promise<T>;

  attach(parent: InternalNode, child: BaseNode, kind: ChildKind): Promise<void>;
  detach(parent: InternalNode, child: BaseNode): Promise<void>;
  reparent(
    child: BaseNode,
    oldParent: InternalNode,
    newParent: InternalNode,
    kind: ChildKind,
  ): Promise<void>;
}
```

实现允许构造时传入可选业务适配钩子，`new NodeService()` 仍可独立使用：`modelForReference(parent, reference, resolvedPath)` 根据已登记模块契约选择模型；`assertWrite(context)` 在所有计划写入前校验权限和来源。`readOnlyReference(parent, reference, resolvedPath)` 根据业务登记补充只读来源（例如没有类型注释的官方 referenced 索引），在跟随安装链接前判定；返回 false 不会撤销既有只读来源或真实路径别名的限制。`createMode(node)` 为新建入口及暂存文件提供 0 至 0o777 的整数权限位；不影响已有文件权限。`resourceMode(node, sourceMode)` 独立控制导入资源权限，默认保留源权限，不继承 createMode 的入口文件策略。它们不形成全局类型注册表，权限校验不执行写入。Memory 的私有忽略规则、业务来源校验仍由适配层负责；入口暂存/恢复文件在入口同目录；整资源单元的恢复目录在单元同级。私有校验覆盖这些目录而不只是入口 Markdown。

更新与删除使用同一 service 读取或创建时记录的内容和文件身份，拒绝盲覆盖、内容漂移与文件替换。跨文件失败尽力回滚并报告实际受影响路径；回滚失败时保留可恢复的原文副本和原权限，不在错误中输出正文。

get(path) 只提供基础 Markdown 模型；需要领域操作时显式传入 TaskNode、MemoryNode、NoteNode、SkillNode 或 InternalNode，不通过随意猜测 YAML 字段决定模型类型。list 的作用域入口使用 InternalNode，其他节点依据已登记的入口、模块契约加载；没有专用模型约定的普通文档使用 BaseNode，不把任意 Markdown 都当作 Note，不另建全局类型注册框架。

list 从 scopePath 指定的作用域入口开始，采用先序遍历并遵循索引条目顺序；按解析后的目标路径去重，遇到归属环时报错。作用域入口或被选中引用目标缺失时报错，不静默遗漏；未选择的 descendant 目标不加载、不检查。输出为节点数组，不新增树包装对象。初始作用域的 CLI 选择策略仍由命令适配层决定。

归属操作使用显式传入的父节点，不根据 dirname 或全盘扫描猜父级。destroy 可以使用已建立的 node.parent 上下文加载父节点；独立加载的文档没有该上下文时，调用方须在有归属的情况下传入 parent。未给出任何归属上下文表示按独立文档处理，不宣称清理未知的外部引用。含有归属子节点的组织节点须先明确处理其子节点，再 destroy，避免隐式级联删除。

attach/detach/reparent 校验参与操作的归属一致性并防止自引用、归属环。reparent 保留已有 label/description，按新父位置重新计算相对 target，并使用给定 kind；它同步内存关系与相关 AGENTS 文件。跨文件写入失败必须报告，不能宣称多个文件写入天然具有原子性；具体写入与失败恢复机制在实施时确定。

已有节点对象时，写操作直接使用 node.path，不再另传一份可能与节点不一致的目标路径；尚未加载节点时，查询仍需路径输入。以下示意省略所属节点等操作上下文，不定义额外的 service 类层级：

```ts
// taskPath 已根据当前 scope 解析为绝对路径。
const task = new TaskNode(taskPath);
task.parse(markdown);

await service.create(task);
const existing = await service.get(taskPath, TaskNode);

await service.update(task);
await service.destroy(task);
```

创建时的归属上下文由业务调用方显式提供或由已加载的树获得，不能从 node.path 猜测；service 据此协调所属 AGENTS 的索引同步。

model 的属性 setter 和 addChild/updateChild 等方法只改变内存中的领域状态；service.update 负责将变更写入文件。读取 Task 并使用领域属性时调用 service.get(taskPath, TaskNode)。模型不直接执行文件读写或 Git 操作。

## 内存修改方式

节点采用可变内存模型。普通内容属性通过 setter 赋值，执行已有字段校验并更新唯一真源；不再同时提供 setTitle、setStatus、setBody 等重复入口。

| 内容 | 修改入口 |
| --- | --- |
| body、Task 的 title/status/assignee/priority、Memory 的 memoryType/description、Note 的 title、Skill 的 name/description | 属性赋值，经 setter 处理 |
| metadata | setMetadata / removeMetadata，保留字段校验 |
| InternalNode 的约束集合 | setConstraints |
| InternalNode 的索引引用 | addChild / updateChild / removeChild |
| parent、跨节点归属 | service.attach / reparent / detach，协调并保存相关文档 |
| path、type、id | 对调用方只读；文件迁移由 service 协调 |

body setter 调用正文解析扩展点，不改变 path 或 metadata。InternalNode 通过 parseBody 更新三部分内容及派生索引，不保存另一份可独立修改的正文。getter 暴露的 content、children、parent 和 metadata 不得泄漏内部可变引用；集合及引用条目提供只读视图或独立快照，metadata 的嵌套对象也不能通过外部修改绕过校验。

`updateChild(reference)` 按 target 定位已有索引条目，替换为传入的新引用，kind 必填；label、description 等可选字段省略时清除原值。目标条目不存在时报错，不隐式新增。修改 kind 时将条目移入对应章节；target 用于定位，此方法不重定向引用、不修改目标文档正文，也不移动文件。

```ts
task.title = "节点模型设计";
task.status = "in_progress";

internal.updateChild({
  target: "tasks/model.md",
  label: task.title,
  description: "方案已确认",
  kind: "local",
});

await service.update(task);
await service.update(internal);
```

上例分别修改 Task 的内容与 AGENTS 的引用信息，再显式保存；索引 label 不会因目标节点 title 赋值而自动改变。InternalNode 的单文档修改由 service 协调已加载节点中的关联状态。

## 公共类型草案

以下声明展示职责与扩展点，不是实现代码。各模型的字段操作沿用现有业务规则，不新增 Task 状态转换规则、记忆类型注册机制或统一笔记模板。

```ts
type Metadata = Record<string, unknown>;

type ChildKind = "local" | "descendant";

interface NodeReference {
  target: string;        // 文档中的原始 href，可带百分号编码和锚点；相对路径以持有引用的入口文件为基准。
  label?: string;        // 索引链接的显示文字。
  description?: string; // 当前索引条目的说明，不自动同步目标文档的 metadata.description。
  kind?: ChildKind;     // local = 本层记忆，descendant = 下层记忆；children 中必填，parent 或普通引用可省略。
}

interface ScopeTraversalOptions {
  // 默认 false：只沿 local；true：同时沿 local 和 descendant。
  includeDescendants?: boolean;
}

interface InternalContent {
  readonly constraints: readonly string[];
  readonly localMemory: readonly Readonly<NodeReference>[];
  readonly descendantMemory: readonly Readonly<NodeReference>[];
}

declare class BaseNode<TType extends string = string> {
  constructor(path: string);
  readonly path: string;
  readonly type: TType;
  readonly id?: string;
  readonly directoryPath?: string; // 显式目录入口所拥有的资源目录；普通单文件及 InternalNode 无此值。
  get parent(): Readonly<NodeReference> | undefined;
  get children(): readonly Readonly<NodeReference>[] | undefined;
  get metadata(): Readonly<Metadata> | undefined;
  get body(): string;
  set body(markdown: string);

  parse(markdown: string): this;
  serialize(): string;
  protected parseBody(markdown: string): void;
  protected serializeBody(): string;

  setMetadata(key: string, value: unknown): void;
  removeMetadata(key: string): void;
}

declare class InternalNode extends BaseNode<"internal"> {
  get content(): InternalContent;
  override get children(): readonly Readonly<NodeReference>[];
  protected override parseBody(markdown: string): void;
  protected override serializeBody(): string;
  setConstraints(items: readonly string[]): void;
  addChild(reference: NodeReference): void;
  updateChild(reference: NodeReference): void;
  removeChild(reference: NodeReference): void;
}

type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review"
  | "done" | "blocked" | "cancelled";
type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

declare class TaskNode extends BaseNode<"task"> {
  get title(): string;
  set title(value: string);
  get status(): TaskStatus;
  set status(value: TaskStatus);
  get assignee(): string | undefined;
  set assignee(value: string | undefined);
  get priority(): TaskPriority;
  set priority(value: TaskPriority);
}

declare class MemoryNode extends BaseNode<"memory"> {
  get memoryType(): string | undefined;
  set memoryType(value: string | undefined);
  get description(): string | undefined;
  set description(value: string | undefined);
}

declare class NoteNode extends BaseNode<"note"> {
  get title(): string; // 笔记一级标题，真源在 body。
  set title(value: string);
}

declare class SkillNode extends BaseNode<"skill"> {
  get name(): string; // SKILL.md frontmatter 中的 name。
  set name(value: string);
  get description(): string; // SKILL.md frontmatter 中的 description。
  set description(value: string);
}
```

引用的 target 保留文档链接语义：加载时先拆分 query/fragment，再解码文件路径；从物理路径生成引用时先编码路径，渲染已有 href 不重复编码。文件名中的字面 `#`、`?`、`%` 因而不会被误读为链接结构。

Task 的状态、负责人、优先级，Memory 的内容分类，以及 Skill 的 name/description，均是 metadata 的类型化访问，不独立存储第二份字段；Note.title 则从 body 的一级标题解释。运行时节点 type 不自动写入 YAML，也不与 Memory 内容分类或 Skill 的 managed/referenced 维护方式混为一谈。

## 源码组织

```text
extensions/cli/src/
├── commands/                 CLI 参数、调用与输出
├── models/
│   ├── base-node.ts
│   ├── internal-node.ts
│   ├── task-node.ts
│   ├── memory-node.ts
│   ├── note-node.ts
│   ├── skill-node.ts
│   └── types.ts
├── services/                 增删改查、文档与索引同步、跨对象流程协调
│   ├── node-service.ts        公共节点服务入口
│   └── traverse.ts            内部遍历辅助，节点加载由 service 提供
└── utils/                    无领域含义的基础工具
```

不设置顶层 core、tasks、memory、codecs 或 storage 来分散模型。解析辅助代码变长时收在相应模型目录内，职责分离不强制变成顶层目录分离。services 不接管节点自身的领域规则，也不要求每种模型机械配一个 service。

## 与当前实现的关系

2026-10-05：模型与 NodeService 已接入正常 Task create/update/status、Memory remember/索引维护及 Note ingest。命令处理器位于 `src/commands/`，保留目录即命令树；业务编排位于 `src/services/`，领域语法辅助位于 `src/models/`，通用 Markdown 与文件系统工具位于 `src/utils/`。旧纯数据仓储/树编排已删除，语法数据结构只作为模型内部实现。Task 读取保留旧优先级的容错投影；修改使用类型化字段并保留未知 vendor metadata。

Memory 的 init、remember、add-type、doctor、refreshIndex 及写索引辅助函数现为异步接口；命令输出、来源信息、权限检查及 Task runlog 约定保持。私有类型先检查整个目的目录的 Git 忽略覆盖，新文件首次暂存即采用 0600。managed 内部别名索引指向经当前作用域边界验证的物理来源，referenced 安装 href 保留且只读。NodeReference 保留原始 href，编码的 CR/LF 文件名可加载，字面换行和 NUL 不可作为 href。

Note 的 Git/PR 编排仍由业务服务负责。迁移与归档保持独立批处理；正常命令启动不导入旧布局迁移实现。Task 4 已补齐目录入口、资源快照、同布局移动、整目录删除和 opt-in 格式选择；不批量转换已有内容。

本文不授权修复整仓物理目录迁移、移动 knowledge/posts、迁移 Project Memory 执行层或改变 CLI 当前作用域筛选策略。它们仍有独立范围与验收责任；Project Memory 的 TypeScript 迁移另见 [实施计划](../plans/2026-10-04-project-memory-typescript.md)。

## 参考

- [npm Arborist](https://github.com/npm/cli/blob/latest/workspaces/arborist/README.md)：具有操作行为的节点与整树管理分开；Edges 的归属为逻辑关系，不照搬其物理目录关系。
- [GitHub CLI 命令开发约定](https://github.com/cli/cli/blob/trunk/docs/command-development.md)：按命令功能组织入口与依赖。
- [oclif 基类](https://oclif.io/docs/base_class/)：通过浅层继承共享共同操作；命令基类与节点领域基类的职责不同。
