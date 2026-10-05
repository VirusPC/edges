import * as fs from "node:fs";
import path from "node:path";
import { BaseNode, InternalNode } from "../models/index.js";
import type {
  ChildGroup,
  NodeReference,
  ScopeTraversalOptions,
} from "../models/index.js";
import {
  lifecycleUnits,
  assertMovableLayout,
  identifyNodeType,
} from "../models/layout.js";
import { referenceOf } from "../models/relations.js";
import {
  checkPath,
  readEntry,
  saveEntries,
  validateEntry,
  type EntryFile,
  type FileChange,
} from "./node-files.js";
import {
  resourceSnapshot,
  validateResources,
  recoveryPath,
  type ResourceSnapshot,
} from "./node-resources.js";
import {
  coLocated,
  carryReferenceSuffix,
  directoryEntries,
  indexContract,
  modelAt,
  physicalParent,
  rewriteLinks,
  within,
  type Model,
} from "./node-layout.js";
import { traverse } from "./traverse.js";
import { NodeCache } from "./node-cache.js";

type Operation = "create" | "update" | "move" | "destroy" | "import";
export interface NodeWriteContext {
  operation: Operation;
  node: BaseNode;
  parent?: InternalNode;
}
export interface NodeServiceOptions {
  managedRoot: string;
  models?: Readonly<Record<string, Model>>;
  readOnlyReference?: (
    parent: BaseNode,
    reference: NodeReference,
    target: string,
  ) => boolean;
  assertWrite?: (context: NodeWriteContext) => void | Promise<void>;
  modelForReference?: (
    parent: BaseNode,
    reference: NodeReference,
    target: string,
  ) => Model | undefined;
}
interface Planned {
  node: BaseNode;
  before?: EntryFile;
  source: string;
}
const clone = <T extends BaseNode>(node: T, file = node.path): T =>
  new (node.constructor as Model<T>)(file).parse(node.serialize());

/** Coordinates directory IO and indexes. References are discovery, not ownership. */
export class NodeService {
  readonly managedRoot: string;
  readonly #options: NodeServiceOptions;
  readonly #cache: NodeCache;
  constructor(options: NodeServiceOptions) {
    if (!options?.managedRoot)
      throw new Error("NodeService requires an explicit managedRoot");
    this.managedRoot = checkPath(options.managedRoot);
    this.#options = options;
    this.#cache = new NodeCache(this.managedRoot);
  }
  #boundary(file: string): string {
    file = checkPath(file);
    if (!within(file, this.managedRoot))
      throw new Error(`Node path escapes managedRoot: ${file}`);
    if (!identifyNodeType(file))
      throw new Error(`Unsupported node entry layout: ${file}`);
    return file;
  }
  #parentNode(file: string): InternalNode | undefined {
    const parent = physicalParent(file, this.managedRoot);
    if (!parent) return undefined;
    const entry = readEntry(parent);
    return entry ? new InternalNode(parent).parse(entry.source) : undefined;
  }
  #model(file: string): Model | undefined {
    return modelAt(
      file,
      indexContract(this.#parentNode(file) ?? new BaseNode(file)),
      this.#options.models,
    );
  }
  async #read(
    file: string,
    Model?: Model,
    readOnly = false,
  ): Promise<BaseNode | undefined> {
    Model ??= this.#model(file);
    if (!Model) return undefined;
    const parent = this.#parentNode(file);
    readOnly ||=
      this.#cache.isReadOnly(file) ||
      (!!parent && indexContract(parent)?.writable === false);
    const entry = readEntry(file, readOnly);
    if (!entry) return undefined;
    const node = new Model(entry.path).parse(entry.source);
    node.validate();
    this.#cache.remember(node, entry, readOnly);
    return node;
  }
  async get(file: string): Promise<BaseNode | undefined>;
  async get<T extends BaseNode>(
    file: string,
    Model: Model<T>,
  ): Promise<T | undefined>;
  async get(file: string, Model?: Model): Promise<BaseNode | undefined> {
    return this.#read(path.resolve(file), Model);
  }
  async #reference(
    parent: BaseNode,
    reference: NodeReference,
  ): Promise<BaseNode> {
    const readonly =
      this.#cache.state.get(parent)?.readOnly ||
      indexContract(parent)?.writable === false ||
      this.#options.readOnlyReference?.(parent, reference, reference.id) ===
        true;
    const Model =
      this.#options.modelForReference?.(parent, reference, reference.id) ??
      modelAt(reference.id, indexContract(parent), this.#options.models);
    const node = await this.#read(reference.id, Model, readonly);
    if (!node) throw new Error(`Missing referenced node: ${reference.id}`);
    return node;
  }
  async list(
    scopePath: string,
    options: ScopeTraversalOptions = {},
  ): Promise<BaseNode[]> {
    const entry =
      path.basename(scopePath) === "AGENTS.md"
        ? path.resolve(scopePath)
        : path.join(path.resolve(scopePath), "AGENTS.md");
    const root = await this.#read(entry, InternalNode);
    if (!root) throw new Error(`Missing scope entry: ${entry}`);
    return traverse(
      root,
      options,
      (_parent, reference) => reference.id,
      (parent, reference) => this.#reference(parent, reference),
    );
  }
  #existing(node: BaseNode, resources = false): EntryFile {
    const state = this.#cache.state.get(node);
    if (!state)
      throw new Error(
        `Node has no read snapshot; load before saving: ${node.path}`,
      );
    this.#boundary(node.path);
    if (
      state.readOnly ||
      this.#cache.isReadOnly(node.path) ||
      this.#cache.isReadOnly(state.file.realPath)
    )
      throw new Error(`Read-only node source: ${node.path}`);
    validateEntry(state.file);
    if (resources && state.resources) validateResources(state.resources);
    return state.file;
  }
  /** Reachable registered nodes plus explicitly loaded nodes, including maintenance trees.
   * list deliberately has a narrower traversal policy and never uses this helper. */
  async #registered(): Promise<Map<string, BaseNode>> {
    const result = new Map<string, BaseNode>();
    const visit = async (node: BaseNode): Promise<void> => {
      if (result.has(node.path) || !within(node.path, this.managedRoot)) return;
      result.set(node.path, node);
      for (const ref of node.children)
        if (within(ref.id, this.managedRoot))
          await visit(await this.#reference(node, ref));
      if (node.harness && within(node.harness.id, this.managedRoot)) {
        const harness = await this.#read(node.harness.id, InternalNode);
        if (harness) await visit(harness);
      }
    };
    const root = await this.#read(
      path.join(this.managedRoot, "AGENTS.md"),
      InternalNode,
    );
    if (root) await visit(root);
    for (const [file, instances] of [...this.#cache.loaded])
      if (!result.has(file) && fs.existsSync(file))
        await visit(instances.values().next().value!);
    return result;
  }
  async #validateGraph(
    plan: Map<string, Planned>,
    removed: (file: string) => boolean = () => false,
  ): Promise<void> {
    const seen = new Set<string>(),
      active = new Set<string>();
    const visit = async (node: BaseNode): Promise<void> => {
      if (active.has(node.path))
        throw new Error(`Composition cycle: ${node.path}`);
      if (seen.has(node.path)) return;
      active.add(node.path);
      seen.add(node.path);
      for (const ref of node.children) {
        if (removed(ref.id))
          throw new Error(`Reference to removed node: ${ref.id}`);
        const proposed = plan.get(ref.id);
        const child = proposed?.node ?? (await this.#reference(node, ref));
        await visit(child);
      }
      active.delete(node.path);
    };
    for (const write of plan.values()) await visit(write.node);
  }
  async #preflight(
    operation: Operation,
    plan: Map<string, Planned>,
  ): Promise<void> {
    for (const write of plan.values()) {
      this.#boundary(write.node.path);
      if (
        this.#cache.isReadOnly(write.node.path) ||
        (write.before && this.#cache.isReadOnly(write.before.path))
      )
        throw new Error(`Read-only node source: ${write.node.path}`);
      if (write.before) validateEntry(write.before);
      else if (fs.existsSync(write.node.path))
        throw new Error(`Node target already exists: ${write.node.path}`);
      write.node.validate();
      await this.#options.assertWrite?.({
        operation,
        node: write.node,
        parent: this.#parentNode(write.node.path),
      });
    }
  }
  #plan(
    node: BaseNode,
    source = node.serialize(),
    before?: EntryFile,
  ): Planned {
    const draft = clone(node);
    draft.parse(source);
    draft.validate();
    // An explicit typed get cannot bypass authoritative AGENTS validation.
    const authoritative =
      path.basename(node.path) === "AGENTS.md"
        ? new InternalNode(node.path).parse(source)
        : draft;
    return { node: authoritative, before, source };
  }
  async #save(
    operation: Operation,
    plan: Map<string, Planned>,
    primary?: BaseNode,
  ): Promise<void> {
    await this.#validateGraph(plan);
    await this.#preflight(operation, plan);
    saveEntries(
      [...plan.values()].map((w) => ({
        path: w.node.path,
        before: w.before,
        source: w.source,
      })),
    );
    this.#cache.refresh(undefined, undefined, primary, new Set(plan.keys()));
  }
  async #registration(
    node: BaseNode,
    group: ChildGroup = "local",
  ): Promise<Planned | undefined> {
    if (
      coLocated(node.path) ||
      path.basename(node.directoryPath) === ".harness"
    )
      return undefined;
    const parentPath = physicalParent(node.path, this.managedRoot);
    if (!parentPath) return undefined;
    const parent = await this.get(parentPath, InternalNode);
    if (!parent) return undefined;
    if (indexContract(parent)?.writable === false)
      throw new Error(`Read-only node source: ${node.path}`);
    const before = this.#existing(parent),
      draft = clone(parent);
    if (!draft.children.some((ref) => ref.id === node.id))
      draft.addChild(group, referenceOf(node));
    return this.#plan(draft, draft.serialize(), before);
  }
  async create<T extends BaseNode>(
    node: T,
    input: Parameters<T["create"]>[0],
  ): Promise<T> {
    this.#boundary(node.path);
    if (fs.existsSync(node.path))
      throw new Error(`Node target already exists: ${node.path}`);
    const draft = clone(node);
    draft.create(input, {
      operation: "create",
      parent: this.#parentNode(node.path),
    });
    draft.validate();
    const plan = new Map<string, Planned>([[draft.path, this.#plan(draft)]]);
    const registration = await this.#registration(draft);
    if (registration) plan.set(registration.node.path, registration);
    await this.#save("create", plan);
    node.parse(draft.serialize());
    this.#cache.remember(node, readEntry(node.path)!);
    return node;
  }
  async update<T extends BaseNode>(
    node: T,
    input: Parameters<T["update"]>[0],
  ): Promise<T> {
    const before = this.#existing(node),
      draft = clone(node);
    draft.update(input, {
      operation: "update",
      parent: this.#parentNode(node.path),
    });
    draft.validate();
    await this.#save(
      "update",
      new Map([[node.path, this.#plan(draft, draft.serialize(), before)]]),
      node,
    );
    return node;
  }
  #unit(node: BaseNode): readonly string[] {
    const units = lifecycleUnits(node.path, coLocated(node.path));
    for (const unit of units) {
      checkPath(unit);
      if (unit === this.managedRoot || !within(unit, this.managedRoot))
        throw new Error(`Cannot relocate or destroy managed root: ${unit}`);
    }
    return units;
  }
  async move<T extends BaseNode>(node: T, destinationPath: string): Promise<T> {
    this.#existing(node, true);
    const destination = this.#boundary(destinationPath);
    if (node.path === destination) return node;
    assertMovableLayout(node.path, coLocated(node.path));
    const sourceRoot = this.#unit(node)[0]!,
      destRoot = path.dirname(destination);
    if (path.basename(node.path) !== path.basename(destination))
      throw new Error("Move cannot change entry layout");
    if (
      identifyNodeType(
        node.path,
        indexContract(this.#parentNode(node.path) ?? node),
      ) !==
      identifyNodeType(
        destination,
        indexContract(this.#parentNode(destination) ?? node),
      )
    )
      throw new Error("Move cannot change known business type");
    if (within(destRoot, sourceRoot) || within(sourceRoot, destRoot))
      throw new Error("Move cannot nest owned directories");
    if (fs.existsSync(destRoot))
      throw new Error(`Node destination already exists: ${destRoot}`);
    const relocate = (file: string) =>
      within(file, sourceRoot)
        ? path.join(destRoot, path.relative(sourceRoot, file))
        : file;
    const registered = await this.#registered();
    registered.set(node.path, node);
    for (const parentPath of [
      physicalParent(node.path, this.managedRoot),
      physicalParent(destination, this.managedRoot),
    ])
      if (parentPath && !registered.has(parentPath)) {
        const parent = await this.get(parentPath, InternalNode);
        if (parent) registered.set(parentPath, parent);
      }
    for (const file of directoryEntries(sourceRoot))
      if (!registered.has(file)) {
        const child = await this.#read(file);
        if (child) registered.set(file, child);
      }
    const oldParent = physicalParent(node.path, this.managedRoot),
      newParent = physicalParent(destination, this.managedRoot);
    let group: ChildGroup = "descendant",
      reference: NodeReference = referenceOf(node);
    const old = oldParent
      ? (registered.get(oldParent) as InternalNode | undefined)
      : undefined;
    if (old) {
      const match = old.children.find((ref) => ref.id === node.path);
      if (match) {
        reference = match;
        group = old.localChildren.some((ref) => ref.id === node.path)
          ? "local"
          : "descendant";
      }
    }
    const plan = new Map<string, Planned>();
    for (const entry of registered.values()) {
      const before = this.#cache.state.get(entry)!.file,
        target = relocate(entry.path);
      let draft = clone(entry);
      let authored =
        entry === node &&
        node.serialize() !==
          new (node.constructor as Model)(node.path)
            .parse(before.source)
            .serialize()
          ? node.serialize()
          : before.source;
      if (
        entry.path === oldParent &&
        oldParent !== newParent &&
        draft instanceof InternalNode
      ) {
        draft.removeChild(node.path);
        authored = draft.serialize();
      }
      let source = rewriteLinks(authored, entry.path, target, relocate);
      draft = clone(draft, target).parse(source);
      if (
        entry.path === newParent &&
        oldParent !== newParent &&
        draft instanceof InternalNode &&
        !draft.children.some((ref) => ref.id === destination)
      ) {
        draft.addChild(group, { ...reference, id: destination });
        if (old) carryReferenceSuffix(old, draft, node.path, destination);
        source = draft.serialize();
      }
      const text = source;
      if (target !== entry.path || text !== before.source)
        plan.set(target, this.#plan(draft, text, before));
    }
    if (newParent && !registered.has(newParent)) {
      const parent = (await this.get(newParent, InternalNode))!,
        draft = clone(parent);
      draft.addChild(group, { ...reference, id: destination });
      if (old) carryReferenceSuffix(old, draft, node.path, destination);
      plan.set(
        newParent,
        this.#plan(draft, draft.serialize(), this.#existing(parent)),
      );
    }
    // Destination snapshots still point at the source until the rename commits.
    await this.#validateGraph(plan, (file) => within(file, sourceRoot));
    await this.#preflight("move", plan);
    const snapshot = resourceSnapshot(sourceRoot);
    this.#existing(node, true);
    validateResources(snapshot);
    fs.mkdirSync(path.dirname(destRoot), { recursive: true });
    checkPath(destRoot);
    if (fs.existsSync(destRoot))
      throw new Error(`Node destination already exists: ${destRoot}`);
    fs.renameSync(sourceRoot, destRoot);
    try {
      const changes: FileChange[] = [...plan.values()].map((w) => ({
        path: w.node.path,
        before:
          w.before && within(w.before.path, sourceRoot)
            ? {
                ...w.before,
                path: relocate(w.before.path),
                realPath: relocate(w.before.realPath),
                realDirectory: relocate(w.before.realDirectory),
              }
            : w.before,
        source: w.source,
      }));
      for (const write of plan.values())
        await this.#options.assertWrite?.({
          operation: "move",
          node: write.node,
          parent: this.#parentNode(write.node.path),
        });
      saveEntries(changes);
    } catch (cause) {
      try {
        validateResources({ ...snapshot, root: destRoot });
        if (fs.existsSync(sourceRoot)) throw new Error("Source recreated");
        fs.renameSync(destRoot, sourceRoot);
      } catch {
        throw new Error(
          `Node move failed; recover directory from ${destRoot}; affected ${sourceRoot}. ${String(cause)}`,
          { cause },
        );
      }
      throw new Error(
        `Node move failed; source restored at ${sourceRoot}. ${String(cause)}`,
        { cause },
      );
    }
    this.#cache.refresh(relocate, undefined, node, new Set(plan.keys()));
    return node;
  }
  async destroy(node: BaseNode): Promise<void> {
    this.#existing(node, true);
    node.destroy({ operation: "destroy", parent: this.#parentNode(node.path) });
    const units = this.#unit(node).filter((unit) => fs.existsSync(unit));
    const removed = (file: string) => units.some((unit) => within(file, unit));
    const plan = new Map<string, Planned>();
    for (const entry of (await this.#registered()).values())
      if (!removed(entry.path) && entry instanceof InternalNode) {
        const draft = clone(entry);
        const deleted = draft.children.filter((ref) => removed(ref.id));
        if (deleted.length === 0) continue;
        for (const ref of deleted) draft.removeChild(ref.id);
        const before = this.#cache.state.get(entry)!.file;
        if (draft.serialize() !== before.source)
          plan.set(entry.path, this.#plan(draft, draft.serialize(), before));
      }
    await this.#validateGraph(plan, removed);
    await this.#preflight("destroy", plan);
    await this.#options.assertWrite?.({
      operation: "destroy",
      node,
      parent: this.#parentNode(node.path),
    });
    const staged = units.map((unit) => ({
      unit,
      recovery: recoveryPath(unit),
      snapshot: fs.statSync(unit).isDirectory()
        ? resourceSnapshot(unit)
        : undefined,
      file: fs.statSync(unit).isFile() ? readEntry(unit) : undefined,
    }));
    for (const stage of staged) {
      const recoveryEntry = stage.file
        ? stage.recovery
        : path.join(stage.recovery, path.basename(node.path));
      await this.#options.assertWrite?.({
        operation: "destroy",
        node: clone(node, recoveryEntry),
        parent: this.#parentNode(node.path),
      });
    }
    this.#existing(node, true);
    for (const stage of staged) {
      if (stage.snapshot) validateResources(stage.snapshot);
      else validateEntry(stage.file!);
    }
    const moved: typeof staged = [];
    try {
      for (const stage of staged) {
        fs.renameSync(stage.unit, stage.recovery);
        moved.push(stage);
      }
      saveEntries(
        [...plan.values()].map((w) => ({
          path: w.node.path,
          before: w.before,
          source: w.source,
        })),
      );
    } catch (cause) {
      const remaining: string[] = [];
      for (const stage of moved.reverse())
        try {
          if (stage.snapshot)
            validateResources({ ...stage.snapshot, root: stage.recovery });
          else
            validateEntry({
              ...stage.file!,
              path: stage.recovery,
              realPath: stage.recovery,
            });
          if (fs.existsSync(stage.unit)) throw new Error("Source recreated");
          fs.renameSync(stage.recovery, stage.unit);
        } catch {
          remaining.push(stage.recovery);
        }
      throw new Error(
        `Node destroy failed: ${String(cause)}. Recovery locations: ${remaining.join(", ") || "(none; restored)"}`,
        { cause },
      );
    }
    for (const stage of staged)
      try {
        if (stage.snapshot)
          validateResources({ ...stage.snapshot, root: stage.recovery });
        else
          validateEntry({
            ...stage.file!,
            path: stage.recovery,
            realPath: stage.recovery,
          });
        fs.rmSync(stage.recovery, { recursive: true });
      } catch (cause) {
        this.#cache.refresh(
          undefined,
          removed,
          undefined,
          new Set([...plan.keys(), ...units]),
        );
        throw new Error(
          `Node deleted; cleanup incomplete; recovery remains at ${stage.recovery}`,
          { cause },
        );
      }
    this.#cache.refresh(
      undefined,
      removed,
      undefined,
      new Set([...plan.keys(), ...units]),
    );
  }
  async import(
    sourceEntry: string,
    destinationEntry: string,
  ): Promise<BaseNode> {
    const source = checkPath(sourceEntry),
      destination = this.#boundary(destinationEntry),
      sourceRoot = path.dirname(source),
      destRoot = path.dirname(destination);
    if (
      !identifyNodeType(source) ||
      path.basename(source) !== path.basename(destination)
    )
      throw new Error("Import cannot change entry layout");
    if (within(destRoot, sourceRoot) || within(sourceRoot, destRoot))
      throw new Error("Import cannot nest source and destination");
    if (fs.existsSync(destRoot))
      throw new Error(`Node destination already exists: ${destRoot}`);
    const relocate = (file: string) =>
      within(file, sourceRoot)
        ? path.join(destRoot, path.relative(sourceRoot, file))
        : file;
    const snapshot = resourceSnapshot(sourceRoot);
    for (const [relative, identity] of snapshot.entries)
      if (identity.includes(":link:"))
        throw new Error(
          `Import refuses symbolic links: ${path.join(sourceRoot, relative)}`,
        );
    const plan = new Map<string, Planned>();
    for (const file of directoryEntries(sourceRoot)) {
      const sourceParent = physicalParent(file, sourceRoot);
      const parentEntry = sourceParent ? readEntry(sourceParent) : undefined;
      const contract = parentEntry
        ? indexContract(
            new InternalNode(parentEntry.path).parse(parentEntry.source),
          )
        : undefined;
      const Model = modelAt(
        relocate(file),
        contract ??
          indexContract(this.#parentNode(relocate(file)) ?? new BaseNode(file)),
        this.#options.models,
      )!;
      const entry = readEntry(file)!;
      const node = new Model(file).parse(entry.source);
      node.validate();
      const target = relocate(file),
        draft = new Model(target).parse(
          rewriteLinks(entry.source, file, target, relocate),
        );
      draft.validate();
      plan.set(target, this.#plan(draft));
    }
    const main = plan.get(destination);
    if (!main) throw new Error(`Missing source entry: ${source}`);
    const registration = await this.#registration(main.node);
    if (registration) plan.set(registration.node.path, registration);
    await this.#validateGraph(plan);
    await this.#preflight("import", plan);
    validateResources(snapshot);
    fs.mkdirSync(path.dirname(destRoot), { recursive: true });
    checkPath(destRoot);
    fs.mkdirSync(destRoot);
    let copied: ResourceSnapshot | undefined;
    try {
      fs.cpSync(sourceRoot, destRoot, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
      copied = resourceSnapshot(destRoot);
      validateResources(snapshot);
      const changes = [...plan.values()].map((w) => ({
        path: w.node.path,
        before: within(w.node.path, destRoot)
          ? readEntry(w.node.path)
          : w.before,
        source: w.source,
      }));
      saveEntries(changes);
    } catch (cause) {
      // Only remove the copied identity. Partial copies and intervening edits remain recoverable.
      try {
        if (!copied) throw new Error("Copy did not complete");
        validateResources(copied);
        fs.rmSync(destRoot, { recursive: true });
      } catch {
        throw new Error(
          `Import failed; recovery remains at ${destRoot}. ${String(cause)}`,
          { cause },
        );
      }
      throw cause;
    }
    this.#cache.refresh(undefined, undefined, undefined, new Set(plan.keys()));
    return (await this.#read(destination, main.node.constructor as Model))!;
  }
}
