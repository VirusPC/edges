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

Python Project Memory 尚未接入这些工具；本次不通过子进程给 Python 引入 Node 运行时依赖，也不声称已消除跨语言重复实现。

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

提供原文时，未修改的往返逐字保留；修改只替换对应条目的源片段。插入、移位时匹配并复用原片段，保留其中的人工格式和未建模内容。对包含未知结构的条目进行无法保留的修改、歧义/未闭合区块、不能重新解析成目标模型的输出会报错，不生成有损结果。新建文档采用原 Project Memory 三块标题；已有“本层重要约束”与“本层硬约束”均可读取，原标题保持。

`saveNode` 校验读取时的原文、真实位置和文件身份，避免陈旧快照或后续符号链接替换覆盖别的文件；通过同目录临时文件替换，保留权限。它是乐观并发校验，不提供跨进程锁。不会初始化目录或自动保存 CLI 的读取结果。


## 可选 YAML 头与 Markdown 正文

Task、Memory、AGENTS.md 共用 `MarkdownDocument = { metadata?: Metadata, body: string }`。`metadata` 是完整 YAML 头的数据，缺省表示没有头部，`{}` 表示存在空头部；`body` 是不透明的 Markdown 正文。通用格式层不要求任何业务字段，也不解释 Markdown 章节。

```ts
import { parseDocument, serializeDocument } from './codec/index.js';

const source = '---\ndescription: Local knowledge\n---\n# Notes\n';
const document = parseDocument(source);
document.metadata = { ...document.metadata, description: 'Updated description' };
const next = serializeDocument(document, source);
```

`parseNode` / `serializeNode` 在此之上解释 AGENTS.md 的三部分章节、HTML 注释标记和索引关系，`NodeModel.metadata` 同样可选。YAML 字段中的 Markdown 链接不会成为节点引用。Task 适配层负责 `name`、`description` 和其头部内嵌 `metadata` 的业务含义；该内嵌字段与公共模型中表示整个头部的 `metadata` 不同。Memory 文档可使用同一格式接口，但 Python Memory 工具尚未切换到此实现。既有 Task Project 入口禁止头部的领域约定仍由它自己的校验器执行；本次不批量给 AGENTS.md 增加字段。

头部必须从文档首行 `---` 开始（允许 BOM），以独立的 `---` 或 `...` 行结束。首行 `---` 后有换行即按头部起始处理，缺少结束行会报错。数据限定为字符串键映射及 JSON 可表达的有限值；重复键、未知标签、非映射根、循环引用、超出安全范围的 YAML 整数均拒绝。`splitFrontmatter` 只切分格式，返回含完整末尾换行的 `rawFrontmatter` 或 `undefined`，不校验字段。

无改动逐字保留；只改正文时保持头部原字节。修改头部时按 YAML 节点复用未改数据、注释、引号与集合样式（数组移动按相同值的出现次数匹配），但头部空白可能规范化。结束分隔符原先位于 EOF 时，新增正文会补上分隔换行。可显式新增或移除头部；别名等导致无法保持目标数据时拒绝有损写回。格式 API 不做文件 IO。
