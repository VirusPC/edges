import { realpathSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { NodeService } from '../node-service.js';
import { InternalNode, MemoryNode, SkillNode } from '../../models/index.js';
import { assertScopePath, within } from './paths.js';
import { layerTypeSpecs, ensureLayerTypeGitignore, findGitRoot } from './types.js';
import { assertPrivateIgnored } from './ignore.js';

/** Memory owns type permissions and private-directory coverage, including staging/recovery. */
export function memoryNodes(target: string): NodeService {
  return new NodeService({
    managedRoot: target,
    readOnlyReference: (parent) => layerTypeSpecs(target).some(spec => !spec.writable && parent.path === join(target, spec.indexFile)),
    assertWrite: ({ node }) => {
    assertScopePath(node.path, target);
    const spec = layerTypeSpecs(target).find(spec => within(node.path, dirname(join(target, spec.indexFile))));
    if (!spec) return; // Scope AGENTS.md is owned by this scope, not a memory type.
    if (!spec.writable && node.path !== join(target, spec.indexFile)) throw new Error(`Read-only memory type: ${spec.name}`);
    if (spec.gitignore) assertPrivateIgnored(findGitRoot(target) ?? target, [node.path], [dirname(node.path)]);
  } });
}

export interface MemoryDocument {
  service: NodeService;
  node: InternalNode | MemoryNode | SkillNode;
  existed: boolean;
}

/** Load once, before deriving edits or deciding creation. The handle retains that snapshot. */
export async function loadMemoryDocument(target: string, file: string): Promise<MemoryDocument> {
  assertScopePath(file, target);
  file = join(realpathSync(target), relative(target, file));
  target = realpathSync(target);
  const spec = layerTypeSpecs(target).find(spec => within(file, dirname(join(target, spec.indexFile))));
  if (spec) ensureLayerTypeGitignore(target, spec.name, [file]);
  const service = memoryNodes(target);
  const Model = basename(file) === 'AGENTS.md' ? InternalNode : basename(file) === 'SKILL.md' ? SkillNode : MemoryNode;
  const existing = await service.get<InternalNode | MemoryNode | SkillNode>(file, Model);
  return { service, node: existing ?? new Model(file), existed: existing !== undefined };
}

export async function saveMemoryDocument(document: MemoryDocument, source: string): Promise<void> {
  document.node.parse(source);
  if (document.existed) await document.service.update(document.node, { metadata: document.node.metadata, body: document.node.body });
  else await document.service.create(document.node, { metadata: document.node.metadata, body: document.node.body });
}
