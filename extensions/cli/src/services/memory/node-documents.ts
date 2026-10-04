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
    readOnlyReference: (parent) => layerTypeSpecs(target).some(spec => !spec.writable && parent.path === join(target, spec.indexFile)),
    createMode: () => 0o600,
    assertWrite: ({ node }) => {
    assertScopePath(node.path, target);
    const spec = layerTypeSpecs(target).find(spec => within(node.path, dirname(join(target, spec.indexFile))));
    if (!spec) return; // Scope AGENTS.md is owned by this scope, not a memory type.
    if (!spec.writable && node.path !== join(target, spec.indexFile)) throw new Error(`Read-only memory type: ${spec.name}`);
    if (spec.gitignore) assertPrivateIgnored(findGitRoot(target) ?? target, [node.path], [dirname(node.path)]);
  } });
}

export async function saveMemoryDocument(target: string, file: string, source: string): Promise<void> {
  assertScopePath(file, target);
  file = join(realpathSync(target), relative(target, file));
  target = realpathSync(target);
  const spec = layerTypeSpecs(target).find(spec => within(file, dirname(join(target, spec.indexFile))));
  if (spec) ensureLayerTypeGitignore(target, spec.name, [file]);
  const service = memoryNodes(target);
  const Model = basename(file) === 'AGENTS.md' ? InternalNode : basename(file) === 'SKILL.md' ? SkillNode : MemoryNode;
  const existing = await service.get<InternalNode | MemoryNode | SkillNode>(file, Model);
  if (existing) { existing.parse(source); await service.update(existing); }
  else await service.create(new Model(file).parse(source));
}
