/** File persistence for arbitrary node entry documents. Same optimistic identity/source
 * contract for model snapshots; never infer an AGENTS filename here. */
import * as fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { absolute } from '../utils/filesystem.js';

export interface EntryFile {
  path: string;
  source: string;
  device: number;
  inode: number;
  mode: number;
  realPath: string;
  realDirectory: string;
}
export interface FileChange { path: string; before?: EntryFile; source?: string; createMode?: number }
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
/** A freshly created descriptor remains readable even when the path's final mode is
 * 000/0200. Keep that descriptor through commit/rollback; never relax path permissions. */
function validateCreatedEntry(before: EntryFile, fd: number): void {
  checkPath(before.path);
  const current = stat(before.path), opened = fs.fstatSync(fd);
  if (!current?.isFile() || current.dev !== before.device || current.ino !== before.inode ||
      opened.dev !== before.device || opened.ino !== before.inode ||
      fs.realpathSync(before.path) !== before.realPath || fs.realpathSync(path.dirname(before.path)) !== before.realDirectory) {
    throw new Error(`Node file identity changed; reload before saving: ${before.path}`);
  }
  const expected = Buffer.from(before.source, 'utf8');
  if (opened.size !== expected.length) throw new Error(`Node source changed; reload before saving: ${before.path}`);
  const actual = Buffer.alloc(expected.length);
  let offset = 0;
  while (offset < actual.length) {
    const read = fs.readSync(fd, actual, offset, actual.length - offset, offset);
    if (read === 0) throw new Error(`Node source changed; reload before saving: ${before.path}`);
    offset += read;
  }
  if (!actual.equals(expected)) throw new Error(`Node source changed; reload before saving: ${before.path}`);
}
/** Preflight every destination. Each file is replaced in its own directory. Cross-file
 * changes are recoverable, not atomic: errors report applied and unrecovered paths. */
export function saveEntries(changes: readonly FileChange[]): Map<string, EntryFile | undefined> {
  changes.forEach(validateChange);
  const applied: { change: FileChange; after?: EntryFile }[] = [];
  const result = new Map<string, EntryFile | undefined>();
  const descriptors = new Map<string, number>();
  const validateSaved = (entry: EntryFile) => {
    const fd = descriptors.get(entry.path);
    if (fd !== undefined && (entry.mode & 0o400) === 0) validateCreatedEntry(entry, fd);
    else validateEntry(entry);
  };
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
        const fd = fs.openSync(temporary, fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW,
          change.before?.mode ?? change.createMode ?? 0o666);
        descriptors.set(change.path, fd);
        fs.writeFileSync(fd, change.source, 'utf8');
        if (change.before) fs.fchmodSync(fd, change.before.mode);
        const info = fs.fstatSync(fd);
        const staged: EntryFile = { path: temporary, source: change.source, device: info.dev, inode: info.ino,
          mode: info.mode & 0o777, realPath: fs.realpathSync(temporary), realDirectory: fs.realpathSync(path.dirname(temporary)) };
        // Capture identity before committing, so no post-commit reopen/cleanup can
        // leave a changed destination absent from recovery accounting.
        const after: EntryFile = { ...staged, path: change.path,
          realPath: path.join(staged.realDirectory, path.basename(change.path)) };
        validateChange(change);
        if (change.before) {
          fs.renameSync(temporary, change.path);
          applied.push({ change, after });
        } else {
          fs.linkSync(temporary, change.path);
          applied.push({ change, after });
          fs.unlinkSync(temporary);
        }
      } finally { fs.rmSync(temporary, { force: true }); }
      const after = applied[applied.length - 1]!.after!;
      validateSaved(after);
      result.set(change.path, after);
    }
    return result;
  } catch (cause) {
    const recovered: string[] = [], unrecovered: string[] = [], recoveryCopies: string[] = [], unavailable: string[] = [];
    for (const { change, after } of applied.reverse()) {
      try {
        if (after) validateSaved(after);
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
  } finally {
    for (const fd of descriptors.values()) fs.closeSync(fd);
  }
}
