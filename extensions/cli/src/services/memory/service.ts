import { isWithinPath } from '../../utils/filesystem.js';
import { realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { NodeService } from '../node-service.js';
import { assertScopePath } from './paths.js';
import { layerTypeSpecs, ensureLayerTypeGitignore, findGitRoot } from './types.js';
import { assertPrivateIgnored } from './ignore.js';

/** Memory owns type permissions and private-directory coverage, including staging/recovery. */
export function memoryNodes(target: string): NodeService {
  target = realpathSync(target);
  return new NodeService({
    managedRoot: target,
    readOnlyReference: (parent) => layerTypeSpecs(target).some(spec => !spec.writable && parent.path === join(target, spec.indexFile)),
    assertWrite: ({ node }) => {
    assertScopePath(node.path, target);
    const spec = layerTypeSpecs(target).find(spec => isWithinPath(node.path, dirname(join(target, spec.indexFile))));
    if (!spec) return; // Scope AGENTS.md is owned by this scope, not a memory type.
    if (!spec.writable && node.path !== join(target, spec.indexFile)) throw new Error(`Read-only memory type: ${spec.name}`);
    if (spec.gitignore) assertPrivateIgnored(findGitRoot(target) ?? target, [node.path], [dirname(node.path)]);
  } });
}

/** Validate policy and prepare private-file coverage without loading or saving a node. */
export function prepareMemoryWrite(target: string, file: string): string {
  assertScopePath(file, target);
  file = join(realpathSync(target), relative(target, file));
  target = realpathSync(target);
  const spec = layerTypeSpecs(target).find(spec => isWithinPath(file, dirname(join(target, spec.indexFile))));
  if (spec) ensureLayerTypeGitignore(target, spec.name, [file]);
  return file;
}
