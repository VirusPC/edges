import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NoteNode } from "../../domain/models/notes/note-node.js";

function notesDir(repo: string): string {
  return path.join(path.resolve(repo), "notes");
}

function entryFile(repo: string, entryPath: string): string {
  const abs = path.resolve(repo, entryPath);
  const root = notesDir(repo);
  if (!abs.startsWith(root + path.sep) || path.basename(abs) !== "index.md") {
    throw new Error("note path must be notes/<stem>/index.md");
  }
  return abs;
}

export function listNotes(repo: string) {
  const dir = notesDir(repo);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const file = path.join(dir, name, "index.md");
      return existsSync(file) ? [{ stem: name, path: path.relative(repo, file) }] : [];
    });
}

export function getNote(repo: string, entryPath: string) {
  const file = entryFile(repo, entryPath);
  if (!existsSync(file)) throw new Error(`note not found: ${entryPath}`);
  const node = new NoteNode(file).parse(readFileSync(file, "utf8"));
  return { path: path.relative(repo, file), title: node.title, body: node.body };
}

export function deleteNote(repo: string, entryPath: string) {
  const file = entryFile(repo, entryPath);
  if (!existsSync(file)) throw new Error(`note not found: ${entryPath}`);
  rmSync(path.dirname(file), { recursive: true, force: true });
  return { path: path.relative(repo, file) };
}

export function updateNote(repo: string, entryPath: string, input: { title?: string; body?: string }) {
  const file = entryFile(repo, entryPath);
  if (!existsSync(file)) throw new Error(`note not found: ${entryPath}`);
  const node = new NoteNode(file).parse(readFileSync(file, "utf8"));
  if (input.title !== undefined) node.title = input.title;
  if (input.body !== undefined) node.body = input.body;
  writeFileSync(file, node.serialize());
  return { path: path.relative(repo, file), title: node.title };
}
