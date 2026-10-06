# Shared Node Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Tasks、Memory、Note 重复的路径、节点文档保存、AGENTS 索引维护和全仓查询能力收敛到通用层，四项全部实现。

**Architecture:** 沿用 models / operations / services / utils 分层。格式与树规则归模型，加载与保存归 Service，业务模块传入模型与边界政策；不建立第二套缓存或事务机制。按路径 → 文档保存 → 索引维护 → 查询顺序实施，每项独立验证。

**Tech Stack:** TypeScript、Node >=20、node:test、tsx、现有 NodeService 与 operations；沿用 gray-matter、proper-lockfile、write-file-atomic。

**Spec:** [2026-10-06-shared-node-capabilities.md](../specs/2026-10-06-shared-node-capabilities.md)

状态：待实施。本文只制定计划，所有复选框保持未完成。它承接已完成的 [节点职责简化计划](2026-10-06-node-identity-simplification.md)，不重新执行旧计划。

## Global Constraints

- TypeScript；Node >=20；不新增运行时依赖或独立 package。
- 仅在独立 worktree 修改；不迁移仓库真实内容或用户私有数据。
- 保留 NodeService 内同路径单实例、原地更新与实际受影响节点保存语义。
- 保留命令写锁、文件快照冲突检查、单文件原子保存与既有失败恢复。
- 保留 Markdown 非受控区域；不要求保留 YAML 注释或 YAML 样式。
- 保留 CLI 参数、输出协议、默认 scope 与查询范围；不新增 CLI 命令。
- 通用 operations 与 models/services 同级，算法按文件拆分；不引入 NodeTree、全局 Service 或事务框架。

## 文件与职责

以下路径相对仓库根。测试命令也从仓库根执行。

| 文件 | 改动与职责 |
| --- | --- |
| `extensions/cli/src/utils/filesystem.ts` | 补齐包含关系、缺失路径 canonical 化、范围内链接检查；复用已有 findAncestor |
| `extensions/cli/src/services/node-layout.ts`、`node-files.ts` | 消费公共路径原语；继续承载节点布局和快照/原子保存 |
| `extensions/cli/src/services/node-documents.ts`（新增） | 显式 Service + Model 的薄文档句柄与保存函数 |
| `extensions/cli/src/models/internal/documents.ts`（新增） | 共用 AGENTS 新文档骨架与完整模板结构检查 |
| `extensions/cli/src/models/internal/blocks.ts` | 单一受控区块替换/插入算法，支持指定三段内的放置位置 |
| `extensions/cli/src/utils/markdown/index-rendering.ts`（迁入） | 现有 Memory 索引转义与路径编码；不引入新语法 |
| `extensions/cli/src/services/node-query.ts`（新增） | 从显式根查询全仓登记树，不拥有业务模型判断 |
| `extensions/cli/src/services/tasks/project-meta.ts`、`board.ts`、`node-query.ts`、`grouped.ts` | 保留 Tasks 政策，替换基础设施调用 |
| `extensions/cli/src/services/memory/node-documents.ts`、`paths.ts`、`types.ts`、`blocks.ts`、`entries.ts`、`agents.ts`、`remember.ts` | 保留 Memory 政策，删除重复保存与区块/路径实现 |
| `extensions/cli/src/services/note/git/ingest.ts` | 保留发布编排，复用路径判断与文档保存 |
| `extensions/cli/src/models/memory/index-rendering.ts`（移除旧路径） | 所有引用切换到 utils，不留转发文件 |

Tasks 专用操作仍留在 Tasks。Memory 的模板装载/填充、provenance 与物理盘点仍留在 Memory。测试 fixture 只使用临时目录中的合成内容。

## Task 1：统一物理路径原语，保留业务边界

**Files:**
- Modify: `extensions/cli/src/utils/filesystem.ts`
- Modify: `extensions/cli/src/services/node-layout.ts`, `extensions/cli/src/services/node-files.ts`
- Modify: `extensions/cli/src/services/tasks/board.ts`, `extensions/cli/src/services/tasks/node-query.ts`
- Modify: `extensions/cli/src/services/memory/paths.ts`, `extensions/cli/src/services/note/git/ingest.ts`
- Test: `extensions/cli/test/utils/filesystem.test.ts`, `extensions/cli/test/memory/core-boundaries.test.ts`, `extensions/cli/test/note/utils/git-ingest.test.ts`

**Interfaces:**
- Consumes existing `findAncestor(start: string, matches: (directory: string) => boolean, stopAt?: (directory: string) => boolean): string | undefined`.
- Produces in `utils/filesystem.ts`:

```ts
export function isWithinPath(file: string, root: string): boolean;
export function canonicalPath(file: string): string;
export function firstSymlink(file: string, stopAt?: string): string | undefined;
```

`isWithinPath` 使用 path.resolve/relative，允许 root 本身，不混淆目录名前缀。`canonicalPath` 解析已有祖先，允许末端不存在；链接循环报错。`firstSymlink` 从 file 向上查，包含 file、不包含 stopAt；无 stopAt 查到文件系统根；stopAt 非祖先时报错。返回链接路径，由调用方产生业务错误；缺失末端不阻止检查已有祖先。

- [ ] 在 filesystem 测试现有 imports 中加入三个函数及 `realpathSync`，新增以下用例：

```ts
test('path primitives distinguish containment and existing link ancestors', t => {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'path-primitives-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'real'));
  symlinkSync(path.join(root, 'real'), path.join(root, 'alias'));
  assert.equal(isWithinPath(path.join(root, '..draft/index.md'), root), true);
  assert.equal(isWithinPath(`${root}-other/index.md`, root), false);
  assert.equal(isWithinPath(root, root), true);
  assert.equal(canonicalPath(path.join(root, 'alias/new/index.md')),
    path.join(root, 'real/new/index.md'));
  assert.equal(firstSymlink(path.join(root, 'alias/new/index.md'), root),
    path.join(root, 'alias'));
  assert.equal(firstSymlink(path.join(root, 'real/new/index.md'), root), undefined);
  assert.throws(() => firstSymlink(root, path.join(root, 'real')));
  symlinkSync('loop', path.join(root, 'loop'));
  assert.throws(() => canonicalPath(path.join(root, 'loop')));
});
```

- [ ] RED：运行 `pnpm --filter edges-cli exec node --test --import tsx test/utils/filesystem.test.ts`；预期新导出不存在或新断言失败。
- [ ] 实现包含判断，迁移 Memory 的 realPath 算法为 canonicalPath，补上链接循环集合；实现 firstSymlink 的 lstat 祖先循环。沿用已有 ENOENT/ENOTDIR 处理，不吞掉 EACCES/ELOOP。

```ts
export function isWithinPath(file: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  return relative === '' || (relative !== '..'
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
```

- [ ] 逐个替换重复机制：node-layout.within / Memory.within 调用公共包含判断；Memory.realPath 调用 canonicalPath；assertScopePath 与 assertBoardPath 调用 firstSymlink；Note 的 `relative.startsWith('..')` 改为精确包含判断。重复纯别名内部调用迁完后删除，业务 assert 包装保留。node-files 的 allowLinkedRead 分支必须保留。

```ts
// Memory 边界仍是 Memory 的政策：先验证逻辑/真实归属，再检查局部链接。
assertOwned(file, target);
const linked = firstSymlink(file, target);
if (linked) throw new Error(`Managed path contains a symbolic link: ${linked}`);
```

- [ ] 复用 findAncestor 替换有相同停止条件的祖先循环；保留 Memory resolveRoot 的显式根/Git 边界、scope 发现和 `~` 选项语义。不要把 stat-follow-links 与 lstat-no-links 的 isDirectory 合并成行为不同的一个函数。
- [ ] GREEN：运行 `pnpm --filter edges-cli exec node --test --test-concurrency=1 --import tsx test/utils/filesystem.test.ts test/utils/scope.test.ts test/services/node-service.test.ts test/memory/core-boundaries.test.ts test/note/utils/git-ingest.test.ts test/tasks/utils/board.test.ts`。全部通过；检查 Note 位于合法 `..draft` 路径时不被拒绝，链接越界仍拒绝。
- [ ] 提交本任务文件：`git commit -m "refactor: share filesystem path primitives" -m "Co-authored-by: Codex <noreply@openai.com>"`。

## Task 2：统一节点文档保存与普通文本的原子写

**Files:**
- Create: `extensions/cli/src/services/node-documents.ts`
- Modify: `extensions/cli/src/services/tasks/project-meta.ts`, `extensions/cli/src/services/tasks/board.ts`
- Modify: `extensions/cli/src/services/memory/node-documents.ts`, `extensions/cli/src/services/memory/remember.ts`, `extensions/cli/src/services/memory/types.ts`, `extensions/cli/src/services/memory/paths.ts`, `extensions/cli/src/services/memory/entries.ts`, `extensions/cli/src/services/memory/agents.ts`
- Modify: `extensions/cli/src/services/note/git/ingest.ts`
- Create test: `extensions/cli/test/services/node-documents.test.ts`
- Extend tests: `extensions/cli/test/tasks/owner-board.test.ts`, `extensions/cli/test/tasks/project.test.ts`, `extensions/cli/test/memory/core-boundaries.test.ts`, `extensions/cli/test/note/utils/git-ingest.test.ts`

**Interfaces:**
- Consumes Task 1 path functions; existing `Model<T>` from `services/node-layout.ts`; `NodeService.get/create/update`; `readEntry(file: string, allowLinkedRead?: boolean): EntryFile | undefined`; `saveEntries(changes: readonly FileChange[]): Map<string, EntryFile | undefined>`.
- Produces:

```ts
export interface NodeDocument<T extends BaseNode> {
  readonly service: NodeService;
  readonly node: T;
  existed: boolean;
}
export function loadNodeDocument<T extends BaseNode>(
  service: NodeService, file: string, Model: Model<T>,
): Promise<NodeDocument<T>>;
export function saveNodeDocument<T extends BaseNode>(
  document: NodeDocument<T>, source: string,
): Promise<void>;
```

source 是业务层已经生成的完整文档。parse/validate 仍由对应模型完成；此函数不是新的 CLI Markdown 导入通道。结构化 create/update API 保持原样，TaskNode CRUD 不强制先转 Markdown。

- [ ] 新建以下完整基础测试，验证重复保存继续使用同一实例，以及外部修改不能被覆盖：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import * as fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { InternalNode } from '../../src/models/index.js';
import { NodeService } from '../../src/services/node-service.js';
import { loadNodeDocument, saveNodeDocument } from '../../src/services/node-documents.js';

test('document save retains identity, supports repeated updates and detects drift', async t => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'node-documents-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'AGENTS.md');
  const service = new NodeService({ managedRoot: root });
  const document = await loadNodeDocument(service, file, InternalNode);
  await saveNodeDocument(document, '# Root\n\nAuthored text.\n');
  assert.equal(document.existed, true);
  assert.equal(await service.get(file, InternalNode), document.node);
  await saveNodeDocument(document, '# Root\n\nUpdated text.\n');
  assert.match(fs.readFileSync(file, 'utf8'), /Updated text/);
  fs.writeFileSync(file, '# External editor\n');
  await assert.rejects(saveNodeDocument(document, '# CLI replacement\n'));
  assert.equal(fs.readFileSync(file, 'utf8'), '# External editor\n');
});

test('document creation does not overwrite a file that appeared after load', async t => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'node-create-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'AGENTS.md');
  const document = await loadNodeDocument(new NodeService({ managedRoot: root }), file, InternalNode);
  fs.writeFileSync(file, '# External creator\n');
  await assert.rejects(saveNodeDocument(document, '# CLI creator\n'));
  assert.equal(fs.readFileSync(file, 'utf8'), '# External creator\n');
});
```

- [ ] RED：运行 `pnpm --filter edges-cli exec node --test --import tsx test/services/node-documents.test.ts`；预期缺失新模块。
- [ ] 实现薄包装：get 命中直接复用；未命中才 new；保存前调用模型 parse/validate，已有走 update、新建走 create，成功后更新 existed。以当前 Memory 包装为起点，不引入第二个受管对象或从磁盘重新读取来掩盖冲突。

```ts
const existing = await service.get(file, Model);
return { service, node: existing ?? new Model(file), existed: existing !== undefined };
// saveNodeDocument 内：
document.node.parse(source);
document.node.validate();
const input = { metadata: document.node.metadata, body: document.node.body };
if (document.existed) await document.service.update(document.node, input);
else await document.service.create(document.node, input);
document.existed = true;
```

- [ ] Memory 的 loadMemoryDocument 保留 canonical target、assertScopePath、ensureLayerTypeGitignore、模型选择和 memoryNodes，然后调用 loadNodeDocument；saveMemoryDocument 删除，调用方直接使用 saveNodeDocument。remember 的文本生成路径也复用此包装；import 路径继续 service.import，保留来源审计与只读类型校验。
- [ ] Tasks 项目/看板文档改用 NodeService。`project-meta.ts` 内创建业务工厂 `projectNodes(target: BoardTarget): NodeService`：managedRoot 为 canonical scope；assertWrite 仅允许当前 board 内节点及**已经存在**的 owner AGENTS。board 写继续 assertBoardPath；owner 路径必须精确匹配。所有待修改文档先 load，再计算文本；ownerBoardChange 改为在此 Service 的 InternalNode 上修改关联，而非另走 raw FileChange 保存。

```ts
// 文档保存调用形态；service 由当前业务操作共享。
const document = await loadNodeDocument(service, projectAgentsPath, InternalNode);
const source = renderProjectAgents(projectInput);
await saveNodeDocument(document, source);
```

此代码中的 projectAgentsPath/projectInput 使用 create/updateProject 的现有局部值。项目创建时 NodeService 自动维护父索引后，后续刷新必须读取同一 Service 中的最新节点正文，不能继续使用此前缓存的字符串。缺失 owner 不创建；maintenance board 登记到 local，domain board 保留 descendant。BoardWriter 普通资源接口和测试 seam 保留，但项目/看板 AGENTS 不再调用 writer.writeFile。
- [ ] Note 在 checkout/pull 后，用该命令自己的 Service 调用 loadNodeDocument/saveNodeDocument；保留现有 draftNoteNode 验证、已有父索引 Git 状态检查、附件 import、git add/commit/push/PR 行为。不要挪动发布流程的读写时序。
- [ ] `.gitignore` 在 ensureTypeGitignore 中用 readEntry 捕获原文再生成文本；变更时 saveEntries，原文件保留 mode、新建使用原实现的 `0o600`。删 Memory.writeAtomic 和无用导入；普通资源不必包装成 Node。

```ts
const before = readEntry(ignorePath);
const previous = before?.source ?? '';
// 使用 ensureTypeGitignore 现有规则从 previous 追加缺失 patterns，得到 next。
if (next !== previous) saveEntries([{ path: ignorePath, before, source: next, createMode: 0o600 }]);
```

- [ ] 扩展已有业务测试 fixture：项目/看板/owner 修改分别保留自定义正文；缺失 owner 不创建；Memory 私有类型仍先验证 ignore；Note 的发布目标更新保留父索引检查。对现有 node-files-atomic 注入失败测试继续运行，不能只测试写入成功。
- [ ] GREEN：运行 `pnpm --filter edges-cli exec node --test --test-concurrency=1 --import tsx test/services/node-documents.test.ts test/services/node-files-atomic.test.ts test/services/shared-node-state.test.ts test/tasks/project.test.ts test/tasks/owner-board.test.ts test/memory/core-boundaries.test.ts test/note/utils/git-ingest.test.ts`；全部通过。
- [ ] 提交本任务文件：`git commit -m "refactor: unify node document persistence" -m "Co-authored-by: Codex <noreply@openai.com>"`。

## Task 3：统一 AGENTS 骨架与受控索引区块

**Files:**
- Create: `extensions/cli/src/models/internal/documents.ts`
- Modify: `extensions/cli/src/models/internal/blocks.ts`
- Move: `extensions/cli/src/models/memory/index-rendering.ts` → `extensions/cli/src/utils/markdown/index-rendering.ts`
- Modify: `extensions/cli/src/services/tasks/project-meta.ts`, `extensions/cli/src/services/memory/blocks.ts`, `extensions/cli/src/services/memory/entries.ts`, `extensions/cli/src/services/memory/agents.ts`
- Create test: `extensions/cli/test/models/internal-documents.test.ts`
- Extend tests: `extensions/cli/test/tasks/utils/project-meta.test.ts`, `extensions/cli/test/memory/core.test.ts`, `extensions/cli/test/models/internal.test.ts`

**Interfaces:**
- Consumes existing `createNodeModel(): NodeModel`, `serializeNode(model: NodeModel, originalSource?: string): string`, `decodeBody`, `SectionKey = 'constraints' | 'memory' | 'children'` and CODEC_SECTIONS.
- Produces:

```ts
// models/internal/documents.ts
export function createAgentsDocument(introduction: string): string;
export function validateAgentsStructure(source: string): void;
// models/internal/blocks.ts：扩展现有函数，不新增并存的另一套 upsert。
export function upsertBlock(
  document: string, start: string, end: string, block: string, section?: SectionKey,
): string;
// utils/markdown/index-rendering.ts：原样迁移已有接口与编码规则。
export function escapeIndexText(value: string): string;
export function encodeIndexPath(value: string): string;
```

block 包含完整 start/end 标记。已有目标区块仅原位替换；若 section 有值而现有区块位于错误位置，报错，由业务迁移流程显式处理。没有区块时：section 有值则插入对应段落；无 section 沿用现有 document 级插入规则。标记半缺失/重复/逆序报错。缺少指定三段之一时通过现有 insertInnerBlock 和 layout 补齐该段，不重建整篇文档。

- [ ] 新建测试文件，使用如下可直接运行的区块保留用例：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentsDocument, validateAgentsStructure } from '../../src/models/internal/documents.js';
import { upsertBlock, LOCAL_START, LOCAL_END } from '../../src/models/internal/blocks.js';

const start = '<!-- task-projects:start -->';
const end = '<!-- task-projects:end -->';
const block = `${start}\n- [A](a/AGENTS.md)\n${end}`;

test('owned index changes leave authored text and other indexes intact', () => {
  const source = createAgentsDocument('# Board\n\nAuthored introduction.')
    .replace(LOCAL_END, `<!-- other-index:start -->\nKeep exactly.\n<!-- other-index:end -->\n${LOCAL_END}`)
    + '\nAuthored tail.\n';
  validateAgentsStructure(source);
  const next = upsertBlock(source, start, end, block, 'memory');
  assert.ok(next.indexOf(start) > next.indexOf(LOCAL_START));
  assert.ok(next.indexOf(end) < next.indexOf(LOCAL_END));
  assert.ok(next.includes('<!-- other-index:start -->\nKeep exactly.\n<!-- other-index:end -->'));
  assert.ok(next.endsWith('\nAuthored tail.\n'));
  assert.equal(upsertBlock(next, start, end, block, 'memory'), next);
  const changed = upsertBlock(next, start, end, block.replace('[A]', '[B]'), 'memory');
  assert.equal(changed, next.replace('[A]', '[B]'));
  assert.throws(() => upsertBlock(source + start, start, end, block, 'memory'));
  assert.throws(() => upsertBlock(next + '\n' + block, start, end, block, 'memory'));
  assert.throws(() => upsertBlock(source + end + '\n' + start, start, end, block));
});
```

- [ ] RED：运行 `pnpm --filter edges-cli exec node --test --import tsx test/models/internal-documents.test.ts`；预期新模块缺失，或新位置/异常断言失败。
- [ ] 新骨架调用已有 serializer，禁止重新复制三段标题和标记。完整模板校验迁移 Memory.loadAgentsTemplate 中的唯一性/顺序检查，使用现有 marker 常量。该校验面向完整模板，不强制所有既有 AGENTS 都先变成完整模板才允许局部修改。

```ts
export function createAgentsDocument(introduction: string): string {
  return `${introduction.trimEnd()}\n\n${serializeNode(createNodeModel())}`;
}
```

- [ ] 扩展 upsertBlock：先统计目标标记并验证顺序，再定位替换区间；插入时复用 decodeBody 的 section 位置及 layout 的 marker。根据原文换行风格生成新增边界；替换不能全局 trim、折叠空行或重写文档。同步去掉 insertInnerBlock 对原文前缀的 trimEnd，只追加插入所需分隔符；否则仅修改 upsertBlock 仍会丢掉非受控空白。测试补充 CRLF、目标文档级 entries、缺少 local 段和未知段内文本四个 fixture。
- [ ] Tasks.renderProjectAgents 的新文档分支使用 createAgentsDocument；已有 tail 分支继续逐字保留。rewriteRootAgents 中保留“旧项目链接显式收编”和项目排序，只把 marker 操作交给公共 upsertBlock，指定 `'memory'`；不得把所有 localChildren 替换为项目列表。

```ts
return upsertBlock(existing, TASK_PROJECTS_START, TASK_PROJECTS_END,
  renderTaskProjectsSection(projects), 'memory');
```

- [ ] Memory.renderAgentsDocument 使用 validateAgentsStructure 和共用 upsertBlock 填充模板，保留模板中的硬约束、说明文字及占位符契约。refreshIndex 仍先 loadNodeDocument，再根据快照生成 entries 并保存。Memory 类型文件盘点保持物理扫描用途，不改成树查询。
- [ ] 迁移 index-rendering 两个函数及全部引用；Tasks 对新生成链接复用这些函数，已有 authored href 不重写。用一个临时 TypeScript 脚本批量更新 import，限定精确旧模块路径，不改真实 Markdown 内容；完成后删除临时脚本，不保留旧路径转发。
- [ ] GREEN：运行 `pnpm --filter edges-cli exec node --test --test-concurrency=1 --import tsx test/models/internal-documents.test.ts test/models/internal.test.ts test/tasks/utils/project-meta.test.ts test/tasks/owner-board.test.ts test/memory/core.test.ts test/memory/distribution.test.ts`；全部通过，分发模板仍可用。
- [ ] 提交本任务文件：`git commit -m "refactor: share AGENTS structure and index editing" -m "Co-authored-by: Codex <noreply@openai.com>"`。

## Task 4：迁出通用全仓查询，验证业务范围不变

**Files:**
- Create: `extensions/cli/src/services/node-query.ts`
- Modify: `extensions/cli/src/services/tasks/node-query.ts`, `extensions/cli/src/services/tasks/grouped.ts`
- Create test: `extensions/cli/test/services/node-query.test.ts`
- Extend tests: `extensions/cli/test/tasks/all-scopes.test.ts`, `extensions/cli/test/tasks/node-query.test.ts`

**Interfaces:**
- Consumes existing `NodeService.query(root: string, options?: NodeQueryOptions): AsyncQuery<BaseNode>` and `operations/query.ts` 的 AsyncQuery。
- Produces `repositoryNodeQuery(root: string, types?: readonly string[]): AsyncQuery<BaseNode>` from `services/node-query.ts`.
- Tasks.listRepositoryTaskNodes 显式传 `['task']`，grouped 项目发现显式传 `['internal']`。Tasks 的 boardLocationOf/taskLocationOf/projectLocationOf 留在原文件。

- [ ] 新建下列混合节点与惰性测试；只写临时 fixture，不遍历真实仓库：

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import * as fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { InternalNode } from '../../src/models/index.js';
import { repositoryNodeQuery } from '../../src/services/node-query.js';

test('repository query defaults to all types and remains deferred', async t => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'repository-query-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const entry = path.join(root, 'AGENTS.md');
  const note = path.join(root, 'notes/example/index.md');
  fs.mkdirSync(path.dirname(note), { recursive: true });
  fs.writeFileSync(note, '# Note\n');
  fs.writeFileSync(entry, new InternalNode(entry).create({
    localChildren: [{ id: note }],
  }, { operation: 'create' }).serialize());
  let seen = 0;
  const all = repositoryNodeQuery(root).map(node => { seen += 1; return node; });
  const grouped = all.groupBy(node => node.type).mapValues(nodes => nodes.length);
  assert.equal(seen, 0);
  const result = await grouped.value();
  assert.equal(result.note, 1);
  assert.ok(seen > 0);
  fs.writeFileSync(note, '---\nbroken: [\n---\n');
  assert.deepEqual(await repositoryNodeQuery(root, ['task']).value(), []);
  await assert.rejects(repositoryNodeQuery(root).value());
});
```

- [ ] RED：运行 `pnpm --filter edges-cli exec node --test --import tsx test/services/node-query.test.ts`；预期通用入口模块缺失。
- [ ] 迁移现有函数，去掉默认 task 类型，root canonical 化一次；不引入额外加载逻辑或业务模型 imports。

```ts
export function repositoryNodeQuery(root: string, types?: readonly string[]): AsyncQuery<BaseNode> {
  root = fs.realpathSync(root);
  return new NodeService({ managedRoot: root }).query(root, {
    includeDescendants: true, includeHarness: true, types,
  });
}
```

- [ ] 更新两个 Tasks 调用点；原 Tasks 文件不留同名转发。复用 all-scopes fixture 验证 local/default board、domain/maintenance、重复引用、未登记目录和递归 harness 范围。对选定类型的 filter/groupBy/find 继续通过原有 operations 测试，不重写集合算法。

```ts
return repositoryNodeQuery(root, ['task'])
  .filter((node): node is TaskNode => node instanceof TaskNode)
  .value();
```

- [ ] GREEN：运行 `pnpm --filter edges-cli exec node --test --test-concurrency=1 --import tsx test/services/node-query.test.ts test/tasks/all-scopes.test.ts test/tasks/node-query.test.ts test/operations/async-query.test.ts test/operations/traverse.test.ts`；全部通过。
- [ ] 提交本任务文件：`git commit -m "refactor: expose generic repository node query" -m "Co-authored-by: Codex <noreply@openai.com>"`。

## 最终验收与交付

- [ ] 静态检查重复实现已清理：`rg -n 'repositoryNodeQuery|writeAtomic|saveMemoryDocument|writer\.writeFile|models/memory/index-rendering' extensions/cli/src`。逐项确认：repositoryNodeQuery 只在通用层定义；旧 Memory 原子写与保存函数无残留；project-meta 不再直接 writeFile；资源 writer 允许保留。
- [ ] 检查通用层无反向依赖：`rg -n 'services/(tasks|memory|note)|from .*\./(tasks|memory|note)/' extensions/cli/src/utils extensions/cli/src/models/internal extensions/cli/src/services/node-documents.ts extensions/cli/src/services/node-query.ts`。模型/模板适配不得导入业务 Service。
- [ ] 运行 `pnpm test`、`pnpm build`、`pnpm --filter edges-cli exec tsc --noEmit --strict -p tsconfig.json`。相较上一轮 934 项通过基线，既有用例必须保留通过，新用例计入实际结果；不拿旧结果冒充本轮验证。CLI 测试继续串行执行文件，保留显式多进程锁测试。
- [ ] 依照 requesting-code-review 审查实现，重点检查：Tasks owner 自动索引与手工刷新是否重复/冲突；保存读取快照是否早于编辑；模板非受控内容是否完整；默认任务查询是否仍传类型筛选；私有类型/链接边界是否退化。修复明确问题后只重跑受影响验证，必要时再跑全量。
- [ ] 更新本计划的实际完成记录及 spec 状态；仅同步受此重构影响的开发文档，不改 README 的系统设计含义。通过 CLI 更新相关项目记忆中的决策适用边界，不手改受管索引。
- [ ] 提交文档并更新当前 PR 的变更说明和本轮验证结果；保持待合并，不能把实施授权当作合并授权。

## 计划自查

四项需求分别由 Task 1–4 覆盖。保存和索引共享同一基础设施，故保留在一个计划中。核心约束由针对性测试与最终全量回归共同验收；通用查询直接实施，没有等待未来消费者的分支。本文所有新增公开接口在对应任务中给出了签名，业务规则不被提升为 BaseNode 的条件逻辑。
