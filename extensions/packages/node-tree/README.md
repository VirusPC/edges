# @edges/node-tree

Edges 的公共节点与树遍历能力。它独立于 CLI、Tasks 和具体记忆类型，不读取环境变量或当前工作目录，也不把 Git 仓库当作节点定义。所有起始路径由调用方以绝对路径传入。

```ts
import { readNodeTree, discoverNodes, findAncestor } from '@edges/node-tree';

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

CLI 在 `src/utils/scope.ts` 提供适配：解析参数、环境变量和 cwd，指定 Git 回退和扫描排除目录，并保留当前命令的 Project Memory 标记筛选策略。这个策略不限制公共包的节点模型。Tasks 的 `all` 仍使用物理清查，以免重构改变现有看板覆盖范围；切换到逻辑树需单独调整调用策略。

Python Project Memory 尚未接入此包；本次不通过子进程给 Python 引入 Node 运行时依赖，也不声称已消除跨语言重复实现。

```sh
pnpm --filter @edges/node-tree build
pnpm --filter @edges/node-tree test
```

运行时代码为原生 ESM JavaScript，使用 JSDoc 与 TypeScript checkJs 校验并生成类型声明。安装依赖后即可运行，源码调用和部署脚本无需预先构建此包；CLI 编译时会先构建类型声明。

## 模型、格式与存储

| 层 | 内容与边界 |
| --- | --- |
| `model.js` | `NodeModel` 表达 constraints（本层重要约束）、memory（本层记忆）、children（下层记忆索引），以及区块外的普通 references。各条目由文本和链接片段组成；目标保留作者给出的标识，不带原文、AST 或文件位置。 |
| `codec/` | `parseNode(source)` 把 Markdown 转成模型；`serializeNode(model, originalSource?)` 转回 Markdown。源片段与 AST 只在 codec 内使用，无文件读写或路径解析。 |
| `filesystem.js`、`paths.js` | 读取和替换文件、验证路径与文件身份、解析相对引用、发现物理目录。原文通过 `readNodeFile` / `writeNodeFile` 独立读写。 |
| `repository.js` | 组合前三层。`readNode` 返回 `{location, source, identity, model, links}`，`saveNode(loaded, model)` 显式保存并重新加载；CLI 使用这个加载结果，领域模型本身保持独立。 |

纯模型和 codec 可通过子入口单独导入，不加载文件系统模块：

```js
import { createNodeModel } from '@edges/node-tree/model';
import { parseNode, serializeNode } from '@edges/node-tree/codec';

const model = createNodeModel();
model.constraints.push({ content: [{ kind: 'text', value: '保留本层私有材料。' }] });
model.memory.push({ content: [{ kind: 'link', label: 'Tasks', target: 'tasks/AGENTS.md' }] });
const markdown = serializeNode(model);
const parsed = parseNode(markdown);
```

模型中的 `references` 是区块外已有链接的关系信息，不新增第四个入口章节。memory、children 中的条目也可以包含人工说明；代码、图片、HTML 等尚未建模的内容由 codec 的原始文档保留。

提供原文时，未修改的往返逐字保留；修改只替换对应条目的源片段。插入、移位时匹配并复用原片段，保留其中的人工格式和未建模内容。对包含未知结构的条目进行无法保留的修改、歧义/未闭合区块、不能重新解析成目标模型的输出会报错，不生成有损结果。新建文档采用原 Project Memory 三块标题；已有“本层重要约束”与“本层硬约束”均可读取，原标题保持。

`saveNode` 校验读取时的原文、真实位置和文件身份，避免陈旧快照或后续符号链接替换覆盖别的文件；通过同目录临时文件替换，保留权限。它是乐观并发校验，不提供跨进程锁。不会初始化目录或自动保存 CLI 的读取结果。
