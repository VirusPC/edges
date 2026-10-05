import { mergeInternal } from "./node-merge.js";
/** Loaded instance identity and optimistic snapshots. Not a public domain API. */
import * as fs from "node:fs";
import { BaseNode, InternalNode } from "../models/index.js";
import { harnessPath } from "../models/layout.js";
import { setNodeRelations, setNodePath } from "../models/relations.js";
import { readEntry, type EntryFile } from "./node-files.js";
import { resourceSnapshot, type ResourceSnapshot } from "./node-resources.js";
import {
  physicalParent,
  within,
  rewriteLinks,
  type Model,
} from "./node-layout.js";
interface Loaded {
  file: EntryFile;
  readOnly: boolean;
  resources?: ResourceSnapshot;
}
export class NodeCache {
  readonly loaded = new Map<string, Set<BaseNode>>();
  readonly state = new WeakMap<BaseNode, Loaded>();
  readonly readOnly = new Set<string>();
  constructor(readonly managedRoot: string) {}
  isReadOnly(file: string): boolean {
    return [...this.readOnly].some((root) => within(file, root));
  }
  relations(node: BaseNode): void {
    const parent = physicalParent(node.path, this.managedRoot),
      harness = harnessPath(node.path);
    setNodeRelations(node, {
      parent: parent ? { id: parent } : undefined,
      harness: fs.existsSync(harness) ? { id: harness } : undefined,
    });
  }
  remember(node: BaseNode, file: EntryFile, readOnly = false): void {
    const resources =
      node.directoryPath === this.managedRoot || readOnly
        ? undefined
        : resourceSnapshot(node.directoryPath);
    this.state.set(node, { file, readOnly, resources });
    if (readOnly) {
      this.readOnly.add(node.directoryPath);
      this.readOnly.add(file.realDirectory);
    }
    const instances = this.loaded.get(node.path) ?? new Set();
    instances.add(node);
    this.loaded.set(node.path, instances);
    this.relations(node);
  }
  #mergedSource(
    node: BaseNode,
    file: string,
    source: string,
    primary: BaseNode | undefined,
    relocate: (file: string) => string,
  ): string {
    const previous = this.state.get(node)!.file;
    const baseline = new (node.constructor as Model)(node.path).parse(
      previous.source,
    );
    if (node === primary || node.serialize() === baseline.serialize())
      return source;
    const dirtySource = rewriteLinks(
      node.serialize(),
      node.path,
      file,
      relocate,
    );
    if (node instanceof InternalNode) {
      const before = new InternalNode(file).parse(
        rewriteLinks(previous.source, node.path, file, relocate),
      );
      const dirty = new InternalNode(file).parse(dirtySource);
      return mergeInternal(before, dirty, new InternalNode(file).parse(source));
    }
    return dirtySource;
  }
  assertRefresh(
    sources: ReadonlyMap<string, string>,
    primary?: BaseNode,
    relocate: (file: string) => string = (file) => file,
  ): void {
    for (const aliases of this.loaded.values())
      for (const node of aliases) {
        const file = relocate(node.path),
          source = sources.get(file);
        if (source !== undefined)
          this.#mergedSource(node, file, source, primary, relocate);
      }
  }
  refresh(
    relocate: (file: string) => string = (file) => file,
    removed: (file: string) => boolean = () => false,
    primary?: BaseNode,
    changed: ReadonlySet<string> = new Set(),
  ): void {
    const instances = [...this.loaded.values()].flatMap((set) => [...set]);
    this.loaded.clear();
    for (const node of instances) {
      const old = node.path,
        state = this.state.get(node)!;
      if (removed(old)) {
        this.state.delete(node);
        setNodeRelations(node, {});
        continue;
      }
      const file = relocate(old);
      if (file === old && !changed.has(file)) {
        const group = this.loaded.get(file) ?? new Set<BaseNode>();
        group.add(node);
        this.loaded.set(file, group);
        this.relations(node);
        if (
          state.resources &&
          [...changed].some((target) => within(target, node.directoryPath))
        )
          state.resources = resourceSnapshot(node.directoryPath);
        continue;
      }
      const entry = readEntry(file, state.readOnly);
      if (!entry) {
        this.state.delete(node);
        setNodeRelations(node, {});
        continue;
      }
      const merged = this.#mergedSource(
        node,
        file,
        entry.source,
        primary,
        relocate,
      );
      setNodePath(node, file);
      node.parse(merged);
      this.remember(node, entry, state.readOnly);
    }
  }
}
