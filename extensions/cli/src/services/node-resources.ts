/** Physical resources are opaque bytes, never inferred logical children. */
import * as fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { checkPath } from './node-files.js';
export interface ResourceSnapshot { root: string; entries: Map<string, string> }
export function resourceSnapshot(root: string, linkedRead = false): ResourceSnapshot {
  checkPath(root, linkedRead);
  const entries = new Map<string, string>();
  const physicalRoot = linkedRead ? fs.realpathSync(root) : root;
  function visit(file: string) {
    const stat = fs.lstatSync(file), relative = path.relative(physicalRoot, file);
    const identity = `${stat.dev}:${stat.ino}:${stat.mode}`;
    if (stat.isSymbolicLink()) { entries.set(relative, `${identity}:link:${fs.readlinkSync(file)}`); return; }
    if (stat.isDirectory()) {
      entries.set(relative, `${identity}:directory`);
      for (const name of fs.readdirSync(file).sort()) visit(path.join(file, name));
    } else if (stat.isFile()) {
      const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      try {
        const opened = fs.fstatSync(fd);
        if (opened.ino !== stat.ino || opened.dev !== stat.dev) throw new Error(`Resource identity changed: ${file}`);
        entries.set(relative, `${identity}:file:${createHash('sha256').update(fs.readFileSync(fd)).digest('hex')}`);
      } finally { fs.closeSync(fd); }
    } else throw new Error(`Unsupported node resource: ${file}`);
  }
  visit(physicalRoot);
  return { root, entries };
}
export function validateResources(before: ResourceSnapshot): void {
  let current: ResourceSnapshot;
  try { current = resourceSnapshot(before.root); } catch (cause) { throw new Error(`Node resources changed: ${before.root}`, { cause }); }
  if (JSON.stringify([...before.entries]) !== JSON.stringify([...current.entries])) throw new Error(`Node resources changed; reload before saving: ${before.root}`);
}
/** AGENTS is an explicit physical scope boundary, unlike arbitrary index.md assets. */
export function assertResourceBoundary(snapshot: ResourceSnapshot): void {
  for (const file of snapshot.entries.keys()) if (path.basename(file) === 'AGENTS.md' || path.basename(file) === 'SKILL.md' && file.includes(path.sep)) {
    throw new Error(`Ambiguous nested node/scope in owned resource directory: ${path.join(snapshot.root, file)}`);
  }
}
export function recoveryPath(root: string): string { return path.join(path.dirname(root), `.node-recovery-${randomUUID()}`); }
export interface ImportedResource { relative: string; bytes?: Buffer; mode: number }
/** Explicit directory boundary only: no neighboring-file inference or symlink following. */
export function readResourceImport(source: string, entryName: string): ImportedResource[] {
  source = checkPath(path.resolve(source));
  if (!fs.statSync(source).isDirectory()) throw new Error('Resource source must be a directory');
  const result: ImportedResource[] = [];
  function visit(directory: string) {
    for (const name of fs.readdirSync(directory).sort()) {
      const file = path.join(directory, name), relative = path.relative(source, file), stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error(`Resource import refuses symbolic links: ${file}`);
      if (name === 'AGENTS.md' || name === 'SKILL.md' || relative === entryName) throw new Error(`Resource import entry/scope collision: ${file}`);
      if (stat.isDirectory()) { result.push({ relative, mode: stat.mode & 0o777 }); visit(file); }
      else if (stat.isFile()) {
        const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
        try {
          const opened = fs.fstatSync(fd);
          if (opened.dev !== stat.dev || opened.ino !== stat.ino) throw new Error(`Resource source changed: ${file}`);
          result.push({ relative, mode: stat.mode & 0o777, bytes: fs.readFileSync(fd) });
        } finally { fs.closeSync(fd); }
      }
      else throw new Error(`Unsupported resource import: ${file}`);
    }
  }
  visit(source); return result;
}
export function writeResourceImport(root: string, resources: ImportedResource[], mode?: number): void {
  checkPath(root); fs.mkdirSync(path.dirname(root), { recursive: true });
  fs.mkdirSync(root, { mode: mode === undefined ? 0o777 : 0o700 });
  for (const item of resources) {
    const target = checkPath(path.join(root, item.relative));
    if (item.bytes === undefined) fs.mkdirSync(target, { mode: item.mode | 0o700 });
    else {
      fs.writeFileSync(target, item.bytes, { flag: 'wx', mode: item.mode });
      fs.chmodSync(target, item.mode);
    }
  }
}
