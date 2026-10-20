import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const TEXT_EXT = new Set([".html", ".htm", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".md"]);

export type CollectedFile = {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
};

export async function collectPublishFiles(inputPath: string): Promise<CollectedFile[]> {
  const info = await lstat(inputPath);
  if (info.isSymbolicLink()) {
    throw new Error("cannot publish a symlink");
  }
  if (info.isFile()) {
    return [await readCollected(inputPath, path.basename(inputPath))];
  }
  if (!info.isDirectory()) {
    throw new Error("publish path must be a file or directory");
  }
  const files: CollectedFile[] = [];
  await walk(inputPath, "", files);
  if (files.length === 0) {
    throw new Error("directory has no publishable files");
  }
  return files;
}

async function walk(root: string, rel: string, out: CollectedFile[]): Promise<void> {
  const dir = rel ? path.join(root, rel) : root;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    const full = path.join(root, childRel);
    if (entry.isSymbolicLink()) {
      continue;
    }
    if (entry.isDirectory()) {
      await walk(root, childRel, out);
      continue;
    }
    if (entry.isFile()) {
      out.push(await readCollected(full, childRel.split(path.sep).join("/")));
    }
  }
}

async function readCollected(abs: string, rel: string): Promise<CollectedFile> {
  const bytes = await readFile(abs);
  const ext = path.extname(rel).toLowerCase();
  if (TEXT_EXT.has(ext)) {
    return { path: rel, content: bytes.toString("utf8") };
  }
  return { path: rel, content: bytes.toString("base64"), encoding: "base64" };
}
