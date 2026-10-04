# 节点与文档工具

位于 `extensions/cli/src/utils/node-tree/` 的 TypeScript 模块。模型、格式、存储与树遍历各自分层，独立于命令行适配、Tasks 和具体记忆类型，不读取环境变量或当前工作目录，也不把 Git 仓库当作节点定义。所有起始路径由调用方以绝对路径传入。

```ts
import { readNodeTree, discoverNodes, findAncestor } from './index.js';

// 按 AGENTS.md 的下层记忆索引递归；允许跨过物理目录层级。
const tree = readNodeTree('/workspace/project');

// 物理目录清查：不以扫描顺序推导节点归属。
const inventory = discoverNodes('/workspace/project', {
  enterDirectory: directory => !directory.endsWith('/node_modules'),
});

// 谁是作用域、何处停止，由调用方明确指定。
const owner = findAncestor('/workspace/project/source',
  directory => directory === '/workspace/project');
```

| API | 职责 |
| --- | --- |
| `walkTree(root, children, key)` | 通用、有序深度优先遍历，按 key 去重并终止环；不依赖文件系统。 |
| `readNode(directory)` | 组合文件适配与 codec，返回位置、原文、文件身份、领域模型及已解析的节点路径。 |
| `findAncestor(start, matches, stopAt?)` | 从起点向上查找；边界节点先匹配、后停止，没有匹配返回 `undefined`。 |
| `discoverNodes(root, options?)` | 清查物理目录；`acceptNode` 筛选结果，`enterDirectory` 决定是否进入子目录。 |
| `readNodeTree(root, options?)` | 沿下层索引读取逻辑节点树；返回的普通引用不会自动成为子节点。 |

子节点链接取自 `project-memory-children` 标记区块，或无标记文档的“下层记忆索引”标题区块。使用 `mdast-util-from-markdown` 解析 CommonMark，支持指向本地 `AGENTS.md` 的内联与引用式 Markdown 链接，包括 `<带空格路径>`、百分号编码、括号和片段锚点；不解析 wikilink。代码块、注释、行内代码、图片与远程 URL 不参与导航。节点链接保留文档顺序，同一目标去重。

逻辑遍历默认限制在 root 内；需要访问兄弟目录时，调用方显式传入更大的 `boundary`。`canVisit` 对边界内途经的目录生效，显式 root 和 boundary 本身除外，可用来隔离嵌套 Git 仓库。缺失的节点链接跳过；符号链接不跟随；其他文件系统错误抛给调用方。扫描无效或不存在的目录返回空结果。这里处理重复和环，不验证每个节点是否只有一个归属父节点。

CLI 在 `src/utils/scope.ts` 提供适配：解析参数、环境变量和 cwd，指定 Git 回退和扫描排除目录，并保留当前命令的 Project Memory 标记筛选策略。这个策略不限制节点模型。Tasks 的 `all` 仍使用物理清查，以免重构改变现有看板覆盖范围；切换到逻辑树需单独调整调用策略。

Project Memory 执行层已迁入 `src/services/memory/`，通过 `edges memory` 调用；其 Markdown/YAML 处理复用本目录的基础文档 codec。作用域注册与索引维护仍遵守现行 LAYOUT，尚未重构为新设计的 BaseNode / InternalNode 类模型。

```sh
pnpm --filter edges-cli build
pnpm --filter edges-cli test
```

实现全部使用 TypeScript，随 CLI 一起构建为 `dist/utils/node-tree/`。开发时由现有 `tsx` 运行源码，部署时使用 CLI 的编译结果；没有单独的 workspace package 或预构建步骤。示例中的 `.js` 导入扩展名遵循项目现有 NodeNext 编译约定，对应源码仍为 `.ts`。

## 模型、格式与存储

| 层 | 内容与边界 |
| --- | --- |
| `model.ts`、`document-model.ts`（纯类型） | `NodeModel` 表达 constraints（本层重要约束）、memory（本层记忆）、children（下层记忆索引），以及区块外的普通 references。可选 `metadata` 承载文档头部数据。各条目由文本和链接片段组成；目标保留作者给出的标识，不带原文、AST 或文件位置。 |
| `codec/` | `parseNode(source)` 把 Markdown 转成模型；`serializeNode(model, originalSource?)` 转回 Markdown。源片段与 AST 只在 codec 内使用，无文件读写或路径解析。 |
| `filesystem.ts`、`paths.ts` | 读取和替换文件、验证路径与文件身份、解析相对引用、发现物理目录。原文通过 `readNodeFile` / `writeNodeFile` 独立读写。 |
| `repository.ts` | 组合前三层。`readNode` 返回 `{location, source, identity, model, links}`，`saveNode(loaded, model)` 显式保存并重新加载；CLI 使用这个加载结果，领域模型本身保持独立。 |

纯模型和 codec 可通过相对路径单独导入，不加载文件系统模块：

```ts
import { createNodeModel } from './model.js';
import { parseNode, serializeNode } from './codec/index.js';

const model = createNodeModel();
model.constraints.push({ content: [{ kind: 'text', value: '保留本层私有材料。' }] });
model.memory.push({ content: [{ kind: 'link', label: 'Tasks', target: 'tasks/AGENTS.md' }] });
const markdown = serializeNode(model);
const parsed = parseNode(markdown);
```

模型中的 `references` 是区块外已有链接的关系信息，不新增第四个入口章节。memory、children 中的条目也可以包含人工说明；代码、图片、HTML 等尚未建模的内容由 codec 的原始文档保留。

在 gray-matter 解析后的正文范围内，提供原文时只替换修改条目的源片段；文档外层的 BOM、头部和末尾换行采用库默认行为。插入、移位时匹配并复用原片段，保留其中的人工格式和未建模内容。对包含未知结构的条目进行无法保留的修改、歧义/未闭合区块、不能重新解析成目标模型的输出会报错，不生成有损结果。新建文档采用原 Project Memory 三块标题；已有“本层重要约束”与“本层硬约束”均可读取，原标题保持。

`saveNode` 校验读取时的原文、真实位置和文件身份，避免陈旧快照或后续符号链接替换覆盖别的文件；通过同目录临时文件替换，保留权限。它是乐观并发校验，不提供跨进程锁。不会初始化目录或自动保存 CLI 的读取结果。


## 文档类型与 codec

`MarkdownDocument.type` 可选，内置类型为 `base`、`agents`、`memory`、`task`，省略表示未标记，由调用方选用的 codec 决定处理方式。type 是处理方式提示，不自动写入 YAML，也不等同于头部中 `metadata.edges-type` 的 project、feedback 等内容分类。

统一接口为 `DocumentCodec<TModel, TType>`：含只读 type、parse(source)、serialize(model, originalSource?)。不同 codec 可以返回不同领域模型，底层 YAML 与 Markdown 处理共用现成库。

| Codec | 解析与生成职责 |
| --- | --- |
| `baseDocumentCodec` | 返回带 base 类型的 MarkdownDocument，处理可选 YAML 与正文。 |
| `agentsDocumentCodec` | 返回现有 NodeModel，处理三部分章节、HTML 注释标记及索引；仓库读写已接入。 |
| `memoryDocumentCodec` | 返回带 memory 类型的 MarkdownDocument，暂时复用基础格式；内容分类与正文规范由消费方解释。Memory service 已复用底层文档 codec；该适配器不承担记忆索引维护。 |
| `taskDocumentCodec` | 位于 Tasks 领域模块，返回带 task 类型的 MarkdownDocument，校验内嵌 metadata 为映射；Task 字段投影及原有读写已接入。 |

调用方显式选择 codec，未选择专用处理时使用 base；不根据 YAML 字段自动猜类型。`parseDocument` / `serializeDocument` 仍是只处理头部与正文的底层格式函数，不按 type 分发。选定 codec 后可省略输入模型的 type；若明确填写其他类型，Markdown codec 会拒绝。现有 AGENTS NodeModel 不含通用文档 type 字段，由所选 codec 标明处理类型。

```ts
import { memoryDocumentCodec } from './codec/index.js';

const doc = memoryDocumentCodec.parse(source); // doc.type === 'memory'
doc.metadata = { ...doc.metadata, description: 'Updated memory' };
const updated = memoryDocumentCodec.serialize(doc, source);
```

后续自定义类型可以实现 `DocumentCodec<CustomModel, 'custom'>`；只有格式与基础文档相同的类型才使用 `createMarkdownCodec('custom')`。无需新增包或全局注册框架。

## 可选文档树关系

`MarkdownDocument` 可附带 `id?: string`、`parent?: DocumentReference`、`children?: DocumentReference[]`。引用形状为 `{ target: string, label?: string }`，target 保留调用方给出的文档标识或链接，由调用方解释；不嵌套完整文档对象。

这些字段是加载或组树时的上下文，不属于 YAML 数据。`id` 的唯一性范围由调用方确定，`parent` 表示逻辑父节点，不由物理目录推断。`children` 按索引顺序排列，省略表示未指定，`[]` 表示没有子文档。通用解析不自动推导关系，序列化仅写 metadata/body，原对象上的关系保持不变。重新 parseDocument 不会恢复树上下文，调用方需要保留或重新关联；YAML 中恰好同名的字段仍完整保留在 metadata 内。AGENTS.md 的三部分 NodeModel 与通用文档关系分别表达，现有章节解析和遍历规则保持不变。

## 可选 YAML 头与 Markdown 正文

Task、Memory、AGENTS.md 共用 `MarkdownDocument`，内容字段为 `{ metadata?: Metadata, body: string }`。`metadata` 是完整 YAML 头的数据，缺省表示没有头部；空头部读为 `{}`，写回按库默认行为省略；`body` 是不透明的 Markdown 正文。通用格式层不要求任何业务字段，也不解释 Markdown 章节。

```ts
import { parseDocument, serializeDocument } from './codec/index.js';

const source = '---\ndescription: Local knowledge\n---\n# Notes\n';
const document = parseDocument(source);
document.metadata = { ...document.metadata, description: 'Updated description' };
const next = serializeDocument(document, source);
```

`parseNode` / `serializeNode` 在此之上解释 AGENTS.md 的三部分章节、HTML 注释标记和索引关系，`NodeModel.metadata` 同样可选。YAML 字段中的 Markdown 链接不会成为节点引用。Task 适配层负责 `name`、`description` 和其头部内嵌 `metadata` 的业务含义；该内嵌字段与公共模型中表示整个头部的 `metadata` 不同。Memory service 同样复用此格式接口；记忆类型、审计字段与索引维护由 service 解释。既有 Task Project 入口禁止头部的领域约定仍由它自己的校验器执行；本次不批量给 AGENTS.md 增加字段。

格式层直接调用 `gray-matter` 默认 parse/stringify，只映射 data/content 到 metadata/body，不自定义 YAML engine、schema、分隔符、日期转换、别名展开或写回规则。字段值使用 unknown，由领域收窄。仅拒绝非 YAML 语言声明，防止文档读取激活库内可执行的 JavaScript 引擎。

库默认行为包括日期解析为 Date、空数据写回省略头部、写回添加末尾换行、解析移除 BOM，不承诺逐字往返。空 options 仅关闭共享可变解析缓存，避免编辑结果污染后续读取。需要字符串的日期等按文档约定加引号；文档不符合约定时修正文档，不增加解析器兼容分支。Task 字段校验和 AGENTS 章节规则留在各自领域。格式 API 不做文件 IO。
