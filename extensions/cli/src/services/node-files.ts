/** File persistence for arbitrary node entry documents. Same optimistic identity/source
 * contract as utils/node-tree/filesystem; never infer an AGENTS filename here. */
import * as fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { absolute } from '../utils/node-tree/filesystem.js';

export interface EntryFile {
  path: string;
  source: string;
  device: number;
  inode: number;
  mode: number;
  realPath: string;
  realDirectory: string;
}
export interface FileChange { path: string; before?: EntryFile; source?: string }
function stat(file: string) {
  try { return fs.lstatSync(file); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
}
/** Reject symlink boundaries, including missing leaves beneath a linked directory. */
export function checkPath(file: string, allowLinkedRead = false): string {
  file = absolute(file);
  if (!allowLinkedRead) {
    let current = file;
    while (true) {
      if (stat(current)?.isSymbolicLink()) throw new Error(`Node path contains a symbolic link: ${current}`);
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return file;
}
export function readEntry(file: string, allowLinkedRead = false): EntryFile | undefined {
  file = checkPath(file, allowLinkedRead);
  let info = stat(file);
  if (!info) return undefined;
  if (allowLinkedRead) info = fs.statSync(file);
  if (!info.isFile()) throw new Error(`Node entry must be a regular file: ${file}`);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (allowLinkedRead ? 0 : fs.constants.O_NOFOLLOW));
  try {
    const opened = fs.fstatSync(fd);
    if (info.dev !== opened.dev || info.ino !== opened.ino) throw new Error(`Node identity changed during read: ${file}`);
    return { path: file, source: fs.readFileSync(fd, 'utf8'), device: info.dev, inode: info.ino,
      mode: info.mode & 0o777, realPath: fs.realpathSync(file), realDirectory: fs.realpathSync(path.dirname(file)) };
  } finally { fs.closeSync(fd); }
}
export function validateEntry(before: EntryFile, allowLinkedRead = false): void {
  const current = readEntry(before.path, allowLinkedRead);
  if (!current) throw new Error(`Missing node entry: ${before.path}`);
  if (current.device !== before.device || current.inode !== before.inode || current.realPath !== before.realPath || current.realDirectory !== before.realDirectory) {
    throw new Error(`Node file identity changed; reload before saving: ${before.path}`);
  }
  if (current.source !== before.source) throw new Error(`Node source changed; reload before saving: ${before.path}`);
}
function validateChange(change: FileChange): void {
  checkPath(change.path);
  if (change.before) validateEntry(change.before);
  else if (stat(change.path)) throw new Error(`Node target already exists: ${change.path}`);
}
/** Preflight every destination. Each file is replaced in its own directory. Cross-file
 * changes are recoverable, not atomic: errors report applied and unrecovered paths. */
export function saveEntries(changes: readonly FileChange[]): Map<string, EntryFile | undefined> {
  changes.forEach(validateChange);
  const applied: { change: FileChange; after?: EntryFile }[] = [];
  const result = new Map<string, EntryFile | undefined>();
  try {
    for (const change of changes) {
      validateChange(change);
      if (change.source === undefined) {
        fs.unlinkSync(change.path);
        applied.push({ change }); result.set(change.path, undefined);
        continue;
      }
      if (change.source === change.before?.source) { result.set(change.path, change.before); continue; }
      fs.mkdirSync(path.dirname(change.path), { recursive: true });
      checkPath(change.path);
      const temporary = path.join(path.dirname(change.path), `.node-${randomUUID()}.tmp`);
      try {
        fs.writeFileSync(temporary, change.source, { flag: 'wx', mode: change.before?.mode ?? 0o666 });
        if (change.before) fs.chmodSync(temporary, change.before.mode);
        validateChange(change);
        if (change.before) fs.renameSync(temporary, change.path);
        else { fs.linkSync(temporary, change.path); fs.unlinkSync(temporary); }
      } finally { fs.rmSync(temporary, { force: true }); }
      const after = readEntry(change.path)!;
      applied.push({ change, after }); result.set(change.path, after);
    }
    return result;
  } catch (cause) {
    const recovered: string[] = [], unrecovered: string[] = [], recoveryCopies: string[] = [], unavailable: string[] = [];
    for (const { change, after } of applied.reverse()) {
      try {
        if (after) validateEntry(after);
        else if (stat(change.path)) throw new Error('Deleted destination was recreated externally');
        if (change.before) {
          saveEntries([{ path: change.path, before: after, source: change.before.source }]);
          fs.chmodSync(change.path, change.before.mode);
        } else if (after) fs.unlinkSync(change.path);
        recovered.push(change.path);
      } catch {
        unrecovered.push(change.path);
        if (change.before) {
          const recovery = path.join(path.dirname(change.path), `.node-recovery-${randomUUID()}.md`);
          try {
            checkPath(recovery);
            fs.writeFileSync(recovery, change.before.source, { flag: 'wx', mode: change.before.mode });
            fs.chmodSync(recovery, change.before.mode);
            recoveryCopies.push(recovery);
          } catch { unavailable.push(change.path); }
        }
      }
    }
    throw new Error(`Node write failed: ${String(cause)}. Affected: ${applied.map(a => a.change.path).join(', ') || '(none)'}. Recovered: ${recovered.join(', ') || '(none)'}. Unrecovered: ${unrecovered.join(', ') || '(none)'}. Recovery copies: ${recoveryCopies.join(', ') || '(none)'}. Recovery copy unavailable: ${unavailable.join(', ') || '(none)'}. Reload affected nodes.`, { cause });
  }
}
