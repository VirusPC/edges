import * as fs from 'node:fs';
import { readResourceImport, writeResourceImport, resourceSnapshot, validateResources, assertResourceBoundary, recoveryPath, type ResourceSnapshot } from './node-resources.js';
import path from 'node:path';
import { BaseNode, InternalNode, MemoryNode, SkillNode } from '../models/index.js';
import type { ChildGroup, NodeReference, ScopeTraversalOptions } from '../models/index.js';
import { setNodeRelations, validateChild } from '../models/relations.js';
import { parseDocument } from '../utils/markdown/document.js';
import { absolute } from '../utils/filesystem.js';
import { checkPath, readEntry, saveEntries, validateEntry } from './node-files.js';
import type { EntryFile, FileChange } from './node-files.js';
import { traverse } from './traverse.js';

type Model<T extends BaseNode = BaseNode> = new (path: string) => T;
type Operation = 'move' | 'create' | 'update' | 'destroy' | 'attach' | 'detach' | 'reparent';
export interface NodeWriteContext {
  operation: Operation;
  node: BaseNode;
  parent?: InternalNode;
}
/** Production integration boundary. Adapters retain private-ignore, source provenance,
 * and module-specific authorization. assertWrite sees every file in the write plan
 * before any mutation; it must validate, not perform writes. Discovered read-only
 * index sources cannot be made writable by omitting or supplying this hook. */
export interface NodeServiceOptions {
  /** New files only; validated permission bits, applied before any contents are staged. */
  createMode?: (node: BaseNode) => number;
  /** Imported resource permissions, independent of entry permissions; default preserves source mode. */
  resourceMode?: (node: BaseNode, sourceMode: number) => number;
  /** Supplemental module provenance, evaluated before following an installed link. */
  readOnlyReference?: (parent: BaseNode, reference: NodeReference, target: string) => boolean;
  assertWrite?: (context: NodeWriteContext) => void | Promise<void>;
  modelForReference?: (parent: BaseNode, reference: NodeReference, target: string) => Model | undefined;
}
interface Loaded { file: EntryFile; readOnly: boolean; resources?: ResourceSnapshot }
interface Write { node: BaseNode; draft?: BaseNode; source?: string; create?: boolean; imported?: ResourceSnapshot; parent?: InternalNode }
interface IndexContract { module?: 'memory' | 'skills'; writable: boolean }

/** Only the explicit type-index comment is a model contract; arbitrary frontmatter
 * fields (including type/module) never select constructors. Uses the shared codec. */
function indexContract(node: BaseNode): IndexContract | undefined {
  if (!(node instanceof InternalNode)) return undefined;
  const match = node.body.match(/<!-- project-memory-type:start -->([\s\S]*?)<!-- project-memory-type:end -->/);
  if (!match) return undefined;
  const fields = parseDocument(`---\n${match[1]!.trim()}\n---\n`).metadata ?? {};
  if (fields.module !== undefined && fields.module !== 'memory' && fields.module !== 'skills') throw new Error(`Invalid type-index module: ${node.path}`);
  if (fields.writable !== undefined && typeof fields.writable !== 'boolean') throw new Error(`Invalid type-index writable flag: ${node.path}`);
  // referenced is an index-only source even if malformed metadata attempts to enable it.
  return { module: fields.module as IndexContract['module'], writable: fields.name !== 'referenced' && fields.writable !== false };
}
function resolveReference(_parent: BaseNode, reference: NodeReference): string { validateChild(reference); return reference.id; }
function clone<T extends BaseNode>(node: T): T {
  return new (node.constructor as Model<T>)(node.path).parse(node.serialize());
}

export class NodeService {
  readonly #options: NodeServiceOptions;
  readonly #loaded = new Map<string, Set<BaseNode>>();
  readonly #state = new WeakMap<BaseNode, Loaded>();
  // Permission knowledge is conservative within this service, not a filesystem cache.
  readonly #readOnly = new Set<string>();
  readonly #readOnlyDirectories = new Set<string>();
  #isReadOnly(file: string): boolean { return this.#readOnly.has(file) || [...this.#readOnlyDirectories].some(root => file === root || file.startsWith(root + path.sep)); }
  constructor(options: NodeServiceOptions = {}) { this.#options = options; }

  #remember(node: BaseNode, file: EntryFile, readOnly = false): void {
    this.#state.set(node, { file, readOnly, resources: node.directoryPath ? resourceSnapshot(node.directoryPath, readOnly) : undefined });
    if (readOnly) { this.#readOnly.add(file.path); this.#readOnly.add(file.realPath);
      if (node.directoryPath) { this.#readOnlyDirectories.add(node.directoryPath); this.#readOnlyDirectories.add(file.realDirectory); }
    }
    const nodes = this.#loaded.get(file.path) ?? new Set<BaseNode>();
    nodes.add(node); this.#loaded.set(file.path, nodes);
  }
  async #read<T extends BaseNode>(file: string, Model: Model<T>, readOnly = false): Promise<T | undefined> {
    const entry = readEntry(file, readOnly);
    if (!entry) return undefined;
    const node = new Model(entry.path).parse(entry.source);
    this.#remember(node, entry, readOnly);
    return node;
  }
  async get(file: string): Promise<BaseNode | undefined>;
  async get<T extends BaseNode>(file: string, Model: Model<T>): Promise<T | undefined>;
  async get(file: string, Model: Model = BaseNode): Promise<BaseNode | undefined> {
    return this.#read(absolute(file), Model);
  }
  async #loadReference(parent: BaseNode, reference: NodeReference, target: string): Promise<BaseNode> {
    const contract = indexContract(parent);
    const readOnly = this.#state.get(parent)?.readOnly || contract?.writable === false || this.#options.readOnlyReference?.(parent, reference, target) === true;
    const Model = path.basename(target) === 'AGENTS.md' ? InternalNode
      : this.#options.modelForReference?.(parent, reference, target)
        ?? (contract?.module === 'skills' || path.basename(target) === 'SKILL.md' ? SkillNode : contract?.module === 'memory' ? MemoryNode : BaseNode);
    const node = await this.#read(target, Model, readOnly);
    if (!node) throw new Error(`Missing referenced node: ${target}`);
    return node;
  }
  async list(scopePath: string, options: ScopeTraversalOptions = {}): Promise<BaseNode[]> {
    const rootPath = path.join(absolute(scopePath), 'AGENTS.md');
    const root = await this.#read(rootPath, InternalNode);
    if (!root) throw new Error(`Missing scope entry: ${rootPath}`);
    return traverse(root, options, resolveReference, async (parent, reference, target) => {
      const child = await this.#loadReference(parent, reference, target);
      this.#parent(child, parent);
      return child;
    });
  }
  #parent(node: BaseNode, parent?: BaseNode): void {
    const state = this.#state.get(node);
    if (parent && state && (this.#state.get(parent)?.readOnly || indexContract(parent)?.writable === false)) {
      state.readOnly = true; this.#readOnly.add(state.file.path); this.#readOnly.add(state.file.realPath);
      if (node.directoryPath) { this.#readOnlyDirectories.add(node.directoryPath); this.#readOnlyDirectories.add(state.file.realDirectory); }
    }
    setNodeRelations(node, { parent: parent ? { id: parent.path } : undefined, harness: node.harness });
  }
  #knownParent(child: BaseNode, permitted?: BaseNode): void {
    for (const instance of new Set([child, ...(this.#loaded.get(absolute(child.path)) ?? [])])) {
      if (instance.parent && resolveReference(instance, instance.parent) !== permitted?.path) {
        throw new Error(`Conflicting known ownership parent for ${child.path}: ${instance.parent.id}`);
      }
    }
  }
  #current(node: BaseNode): EntryFile {
    const loaded = this.#state.get(node);
    if (!loaded) throw new Error(`Node has no read snapshot; load with get/list or create before saving: ${node.path}`);
    validateEntry(loaded.file, loaded.readOnly);
    return loaded.file;
  }
  #existing(node: BaseNode): EntryFile {
    const loaded = this.#state.get(node);
    if (!loaded) throw new Error(`Node has no read snapshot; load with get/list or create before saving: ${node.path}`);
    if (loaded.readOnly || this.#isReadOnly(node.path) || this.#isReadOnly(loaded.file.realPath)) throw new Error(`Read-only node source: ${node.path}`);
    validateEntry(loaded.file);
    if (loaded.resources) validateResources(loaded.resources);
    return loaded.file;
  }
  #reference(parent: InternalNode, child: BaseNode): NodeReference | undefined {
    const matches = parent.children.filter(reference => resolveReference(parent, reference) === absolute(child.path));
    if (matches.length > 1) throw new Error(`Ambiguous ownership references for ${child.path} in ${parent.path}`);
    return matches[0];
  }
  /** Validate the exact combined documents about to be saved, not only the
   * requested edge or the caller's selected model. AGENTS is authoritative. */
  async #validateWrites(writes: readonly Write[]): Promise<void> {
    const proposed = new Map<string, BaseNode | undefined>();
    for (const write of writes) {
      const target = absolute(write.node.path);
      proposed.set(target, write.source === undefined ? undefined
        : path.basename(target) === 'AGENTS.md' ? new InternalNode(target).parse(write.source)
          : write.draft ?? write.node);
    }
    const seen = new Set<string>(), active = new Set<string>();
    const owners = new Map<string, string>();
    const visit = async (node: BaseNode): Promise<void> => {
      const nodePath = absolute(node.path);
      if (active.has(nodePath)) throw new Error(`Ownership cycle: ${nodePath}`);
      if (seen.has(nodePath)) return;
      seen.add(nodePath); active.add(nodePath);
      for (const reference of node.children ?? []) {
        validateChild(reference);
        const target = resolveReference(node, reference);
        if (active.has(target)) throw new Error(`Ownership cycle: ${target}`);
        const owner = owners.get(target);
        if (owner && owner !== nodePath) throw new Error(`Conflicting ownership parents for ${target}: ${owner}, ${nodePath}`);
        owners.set(target, nodePath);
        for (const instance of this.#loaded.get(target) ?? []) {
          if (!instance.parent) continue;
          const known = resolveReference(instance, instance.parent);
          if (known === nodePath) continue;
          const replacement = proposed.get(known);
          const removed = proposed.has(known) && !replacement?.children?.some(entry => resolveReference(replacement, entry) === target);
          if (!removed) throw new Error(`Conflicting known ownership parent for ${target}: ${known}`);
        }
        const child = proposed.has(target) ? proposed.get(target) : await this.#loadReference(node, reference, target);
        if (!child) throw new Error(`Missing referenced node in proposed graph: ${target}`);
        await visit(child);
      }
      active.delete(nodePath);
    };
    for (const node of proposed.values()) if (node) await visit(node);
  }
  #sync(parent: InternalNode, previous: InternalNode): void {
    const next = new Set(parent.children.map(reference => resolveReference(parent, reference)));
    const old = new Set(previous.children.map(reference => resolveReference(previous, reference)));
    for (const target of new Set([...next, ...old])) {
      for (const child of this.#loaded.get(target) ?? []) {
        if (next.has(target)) this.#parent(child, parent);
        else if (child.parent && resolveReference(child, child.parent) === parent.path) this.#parent(child);
      }
    }
  }
  async #save(operation: Operation, writes: Write[]): Promise<void> {
    const changes: FileChange[] = [];
    const previous = new Map<BaseNode, InternalNode>();
    for (const write of writes) {
      const target = absolute(write.node.path);
      const before = write.create ? undefined : this.#existing(write.node);
      if (write.create) {
        checkPath(target);
        if (write.imported) validateResources(write.imported);
        else if (write.node.directoryPath && fs.existsSync(write.node.directoryPath)) throw new Error(`Owned node directory already exists: ${write.node.directoryPath}`);
      }
      if (this.#isReadOnly(target) || (write.parent && indexContract(write.parent)?.writable === false)) {
        throw new Error(`Read-only node source: ${target}`);
      }
      if (before && (write.node instanceof InternalNode || path.basename(target) === 'AGENTS.md')) previous.set(write.node, new InternalNode(target).parse(before.source));
      const mode = write.create ? this.#options.createMode?.(write.node) : undefined;
      if (mode !== undefined && (!Number.isInteger(mode) || mode < 0 || mode > 0o777)) throw new Error('Invalid node creation permission mode');
      changes.push({ path: target, before, source: write.source, createMode: mode });
      await this.#options.assertWrite?.({ operation, node: write.draft ?? write.node, parent: write.parent });
    }
    await this.#validateWrites(writes);
    for (const write of writes) {
      if (!write.create) this.#existing(write.node);
      else if (write.imported) validateResources(write.imported);
      else if (write.node.directoryPath && fs.existsSync(write.node.directoryPath)) throw new Error(`Owned node directory already exists: ${write.node.directoryPath}`);
    }
    const saved = saveEntries(changes);
    for (const write of writes) {
      const file = saved.get(absolute(write.node.path));
      if (write.draft) write.node.parse(write.draft.serialize());
      if (file) {
        if (write.node instanceof InternalNode || path.basename(file.path) === 'AGENTS.md') {
          const before = previous.get(write.node)?.serialize();
          for (const instance of this.#loaded.get(file.path) ?? []) {
            if (instance === write.node || !(instance instanceof InternalNode)) continue;
            const state = this.#state.get(instance);
            if (state && new InternalNode(instance.path).parse(state.file.source).serialize() === before && instance.serialize() === before) {
              instance.parse(write.source!);
              this.#remember(instance, file, state.readOnly);
            }
          }
        }
        this.#remember(write.node, file);
      }
      else { this.#state.delete(write.node); this.#loaded.get(absolute(write.node.path))?.delete(write.node); }
    }
    for (const write of writes) {
      if (write.source !== undefined && (write.node instanceof InternalNode || path.basename(write.node.path) === 'AGENTS.md')) {
        const current = write.node instanceof InternalNode ? write.node : new InternalNode(write.node.path).parse(write.source);
        this.#sync(current, previous.get(write.node) ?? new InternalNode(write.node.path));
      }
    }
  }
  async create(node: BaseNode, placement?: { parent: InternalNode; kind: ChildGroup }, options: { resources?: string } = {}): Promise<void> {
    checkPath(node.path);
    if (node.directoryPath && fs.existsSync(node.directoryPath)) throw new Error(`Owned node directory already exists: ${node.directoryPath}`);
    if (readEntry(node.path)) throw new Error(`Node target already exists: ${node.path}`);
    if (options.resources && !node.directoryPath) throw new Error('Resource import requires directory format');
    if (this.#isReadOnly(node.path)) throw new Error(`Read-only node source: ${node.path}`);
    const resources = options.resources ? readResourceImport(options.resources, path.basename(node.path)).map(resource => {
      const mode = this.#options.resourceMode ? this.#options.resourceMode(node, resource.mode) : resource.mode;
      if (!Number.isInteger(mode) || mode < 0 || mode > 0o777) throw new Error('Invalid resource permission mode');
      return { ...resource, mode };
    }) : undefined;
    const writes: Write[] = [{ node, source: node.serialize(), create: true, parent: placement?.parent }];
    if (placement) {
      const { parent, kind } = placement;
      this.#existing(parent); this.#knownParent(node);
      validateChild({ id: node.path });
      if (this.#reference(parent, node)) throw new Error(`Child already indexed: ${node.path}`);
      const draft = clone(parent); draft.addChild(kind, { id: node.path });
      writes.push({ node: parent, draft, source: draft.serialize() });
    }
    // Validate all permissions (including private directory ignore coverage) before resources exist.
    for (const write of writes) await this.#options.assertWrite?.({ operation: 'create', node: write.draft ?? write.node, parent: write.parent });
    const mode = this.#options.createMode?.(node);
    if (mode !== undefined && (!Number.isInteger(mode) || mode < 0 || mode > 0o777)) throw new Error('Invalid node creation permission mode');
    let imported: ResourceSnapshot | undefined;
    try {
      if (node.directoryPath) {
        try { writeResourceImport(node.directoryPath, resources ?? [], mode); imported = resourceSnapshot(node.directoryPath!); writes[0]!.imported = imported; }
        catch (cause) { throw new Error(`Node directory creation failed: ${String(cause)}. Partial resources may remain at ${node.directoryPath}. Reload before retrying.`, { cause }); }
      }
      await this.#save('create', writes);
    } catch (cause) {
      if (imported) {
        try { validateResources(imported); fs.rmSync(imported.root, { recursive: true }); }
        catch { throw new Error(`Node create failed; resource recovery remains at ${imported.root}. Reload affected nodes.`, { cause }); }
      }
      throw cause;
    }
    if (placement) this.#parent(node, placement.parent);
  }
  /** Same-layout relocation. Logical scopes have their own migration workflow. */
  async move<T extends BaseNode>(node: T, destinationEntryPath: string, parent?: InternalNode): Promise<T> {
    this.#existing(node);
    if (node instanceof InternalNode || node.children?.length || path.basename(node.path) === 'AGENTS.md') throw new Error('Cannot move an organization node or logical children');
    const destination = checkPath(destinationEntryPath);
    const moved = new (node.constructor as Model<T>)(destination).parse(node.serialize());
    if (!!node.directoryPath !== !!moved.directoryPath || node.directoryPath && path.basename(node.path) !== path.basename(destination)) throw new Error('Move cannot change entry format/layout');
    if (node.path === destination) { await this.update(node); return node; }
    const sourceUnit = node.directoryPath ?? node.path, destinationUnit = moved.directoryPath ?? moved.path;
    if (destinationUnit.startsWith(sourceUnit + path.sep) || sourceUnit.startsWith(destinationUnit + path.sep)) throw new Error('Move cannot nest owned units');
    if (fs.existsSync(destinationUnit)) throw new Error(`Node destination already exists: ${destinationUnit}`);
    if (this.#isReadOnly(destination)) throw new Error(`Read-only node source: ${destination}`);
    if (node.directoryPath) {
      assertResourceBoundary(this.#state.get(node)!.resources!);
      for (const [file, instances] of this.#loaded) if (file !== node.path && file.startsWith(node.directoryPath + path.sep) && [...instances].some(item => item.parent)) throw new Error(`Cannot move logical child node: ${file}`);
    }
    parent ??= await this.#parentContext(node);
    const writes: Write[] = [{ node: moved, source: moved.serialize(), parent }];
    if (parent) {
      this.#existing(parent); this.#knownParent(node, parent);
      const reference = this.#reference(parent, node);
      if (!reference) throw new Error(`Child is not indexed by parent: ${node.path}`);
      const draft = clone(parent); draft.removeChild(reference.id);
      draft.addChild(parent.localChildren.some(child => child.id === reference.id) ? 'local' : 'descendant', { ...reference, id: moved.path });
      writes.push({ node: parent, draft, source: draft.serialize() });
    }
    await this.#options.assertWrite?.({ operation: 'move', node, parent });
    for (const write of writes) await this.#options.assertWrite?.({ operation: 'move', node: write.draft ?? write.node, parent: write.parent });
    this.#existing(node); if (parent) this.#existing(parent);
    checkPath(destination); if (fs.existsSync(destinationUnit)) throw new Error(`Node destination already exists: ${destinationUnit}`);
    fs.mkdirSync(path.dirname(destinationUnit), { recursive: true });
    const originalResources = this.#state.get(node)!.resources;
    const originalFile = this.#state.get(node)!.file;
    fs.renameSync(sourceUnit, destinationUnit);
    try {
      this.#remember(moved, readEntry(destination)!);
      await this.#save('move', writes);
    } catch (cause) {
      this.#state.delete(moved); this.#loaded.get(destination)?.delete(moved);
      try {
        if (originalResources) validateResources({ ...originalResources, root: destinationUnit });
        else validateEntry({ ...originalFile, path: destination, realPath: fs.realpathSync(destination), realDirectory: fs.realpathSync(path.dirname(destination)) });
        if (fs.existsSync(sourceUnit)) throw new Error('Source recreated'); fs.renameSync(destinationUnit, sourceUnit);
      }
      catch { throw new Error(`Node move failed; owned unit recovery remains at ${destinationUnit}. Affected: ${sourceUnit}, ${destinationUnit}. Reload affected nodes.`, { cause }); }
      throw new Error(`Node move failed; restored ${sourceUnit}. Reload affected nodes. ${String(cause)}`, { cause });
    }
    this.#state.delete(node); this.#loaded.get(node.path)?.delete(node); this.#parent(node); this.#parent(moved, parent);
    return moved;
  }
  async update(node: BaseNode): Promise<void> {
    this.#existing(node);
    await this.#save('update', [{ node, source: node.serialize(), parent: await this.#parentContext(node) }]);
  }
  async #parentContext(node: BaseNode): Promise<InternalNode | undefined> {
    if (!node.parent) return undefined;
    const target = resolveReference(node, node.parent);
    const parent = await this.#read(target, InternalNode);
    if (!parent) throw new Error(`Missing ownership parent: ${target}`);
    return parent;
  }
  async attach(parent: InternalNode, child: BaseNode, kind: ChildGroup): Promise<void> {
    this.#existing(parent); this.#current(child); this.#knownParent(child, parent);
    validateChild({ id: child.path });
    if (this.#reference(parent, child)) throw new Error(`Child already indexed: ${child.path}`);
    const draft = clone(parent); draft.addChild(kind, { id: child.path });
    await this.#save('attach', [{ node: parent, draft, source: draft.serialize() }]);
    this.#parent(child, parent);
  }
  async detach(parent: InternalNode, child: BaseNode): Promise<void> {
    this.#existing(parent); this.#current(child); this.#knownParent(child, parent);
    const reference = this.#reference(parent, child);
    if (!reference) throw new Error(`Child is not indexed by parent: ${child.path}`);
    const draft = clone(parent); draft.removeChild(reference.id);
    await this.#save('detach', [{ node: parent, draft, source: draft.serialize() }]);
    this.#parent(child);
  }
  async reparent(child: BaseNode, oldParent: InternalNode, newParent: InternalNode, kind: ChildGroup): Promise<void> {
    this.#current(child); this.#existing(oldParent); this.#existing(newParent); this.#knownParent(child, oldParent);
    validateChild({ id: child.path });
    const reference = this.#reference(oldParent, child);
    if (!reference) throw new Error(`Child is not indexed by old parent: ${child.path}`);
    if (oldParent.path === newParent.path) {
      const draft = clone(oldParent); draft.moveChild(reference.id, kind);
      await this.#save('reparent', [{ node: oldParent, draft, source: draft.serialize() }]); return;
    }
    if (this.#reference(newParent, child)) throw new Error(`Child already indexed by new parent: ${child.path}`);
    const oldDraft = clone(oldParent), newDraft = clone(newParent);
    oldDraft.removeChild(reference.id);
    newDraft.addChild(kind, { ...reference, id: child.path });
    await this.#save('reparent', [
      { node: oldParent, draft: oldDraft, source: oldDraft.serialize() },
      { node: newParent, draft: newDraft, source: newDraft.serialize() },
    ]);
    this.#parent(child, newParent);
  }
  async destroy(node: BaseNode, parent?: InternalNode): Promise<void> {
    const original = this.#existing(node);
    const persistedChildren = path.basename(node.path) === 'AGENTS.md' ? new InternalNode(node.path).parse(original.source).children : undefined;
    if (node.children?.length || persistedChildren?.length) throw new Error(`Cannot destroy node with ownership children: ${node.path}`);
    parent ??= await this.#parentContext(node);
    const writes: Write[] = [];
    if (parent) {
      this.#existing(parent); this.#knownParent(node, parent);
      const reference = this.#reference(parent, node);
      if (!reference) throw new Error(`Child is not indexed by parent: ${node.path}`);
      const draft = clone(parent); draft.removeChild(reference.id);
      writes.push({ node: parent, draft, source: draft.serialize() });
    }
    if (node.directoryPath) {
      const resources = this.#state.get(node)!.resources!;
      assertResourceBoundary(resources);
      for (const [file, instances] of this.#loaded) {
        if (file !== node.path && file.startsWith(node.directoryPath + path.sep) && [...instances].some(item => item.parent)) throw new Error(`Cannot delete logical child node: ${file}`);
      }
      await this.#options.assertWrite?.({ operation: 'destroy', node, parent });
      await this.#validateWrites(writes);
      const recovery = recoveryPath(node.directoryPath);
      const recoveryNode = new (node.constructor as Model)(path.join(recovery, path.basename(node.path))).parse(original.source);
      await this.#options.assertWrite?.({ operation: 'destroy', node: recoveryNode, parent });
      this.#existing(node);
      fs.renameSync(node.directoryPath, recovery);
      try { await this.#save('destroy', writes); }
      catch (cause) {
        try { validateResources({ ...resources, root: recovery }); if (fs.existsSync(node.directoryPath)) throw new Error('Source recreated'); fs.renameSync(recovery, node.directoryPath); }
        catch { throw new Error(`Node destroy failed; recover owned resources from ${recovery}. Affected: ${node.directoryPath}`, { cause }); }
        throw cause;
      }
      this.#state.delete(node); this.#loaded.get(node.path)?.delete(node);
      try { validateResources({ ...resources, root: recovery }); fs.rmSync(recovery, { recursive: true }); }
      catch (cause) { throw new Error(`Node removed from index; resource cleanup incomplete at ${recovery}`, { cause }); }
    } else {
      writes.push({ node, parent });
      await this.#save('destroy', writes);
    }
    this.#parent(node);
  }
}
