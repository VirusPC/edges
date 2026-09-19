import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { chmod, lstat, mkdir, open, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSafeRelPath, isArtifactId, safeResolve } from "./paths.js";
import type { ArtifactFileInput, ArtifactMeta, ArtifactStore } from "./types.js";

const DEFAULT_MIN_TTL = 1;
const DEFAULT_MAX_TTL = 2_592_000;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

export function contentTypeFor(rel: string): string {
  return CONTENT_TYPES[path.extname(rel).toLowerCase()] ?? "application/octet-stream";
}

async function chmodPrivateDir(dir: string): Promise<void> {
  await chmod(dir, 0o700);
}

async function ensurePrivateDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await chmodPrivateDir(dir);
}

async function writePrivateFile(dest: string, bytes: Buffer | string): Promise<void> {
  await writeFile(dest, bytes, { mode: 0o600 });
  await chmod(dest, 0o600);
}

async function assertUnlinkedAncestors(root: string, rel: string): Promise<void> {
  const parentRel = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
  let cursor = path.resolve(root);
  const rootInfo = await lstat(cursor);
  if (rootInfo.isSymbolicLink()) {
    throw new Error("artifact path must not be a symlink");
  }
  if (!parentRel) {
    return;
  }
  for (const segment of parentRel.split("/")) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    if (info.isSymbolicLink()) {
      throw new Error("artifact path must not be a symlink");
    }
  }
}

/** Walk root + each relative segment with lstat; refuse any symlink. */
export async function resolveUnlinkedFile(root: string, rel: string): Promise<string | null> {
  let current: string;
  try {
    current = safeResolve(root, rel);
    assertSafeRelPath(rel);
  } catch {
    return null;
  }
  const rootResolved = path.resolve(root);
  const chain = [rootResolved];
  const segments = assertSafeRelPath(rel).split("/");
  let cursor = rootResolved;
  for (const segment of segments) {
    cursor = path.join(cursor, segment);
    chain.push(cursor);
  }
  if (chain[chain.length - 1] !== current) {
    return null;
  }
  for (const step of chain) {
    try {
      const info = await lstat(step);
      if (info.isSymbolicLink()) {
        return null;
      }
    } catch {
      return null;
    }
  }
  try {
    const leaf = await lstat(current);
    if (!leaf.isFile() || leaf.isSymbolicLink()) {
      return null;
    }
  } catch {
    return null;
  }
  return current;
}

export function resolveEntry(files: ArtifactFileInput[], entry?: string): string {
  const paths = files.map((file) => file.path);
  if (entry) {
    if (!paths.includes(entry)) {
      throw new Error(`artifact entry not found: ${entry}`);
    }
    return entry;
  }
  if (paths.includes("index.html")) {
    return "index.html";
  }
  if (files.length === 1) {
    return files[0].path;
  }
  throw new Error("artifact entry is required when publishing multiple files without index.html");
}

export function createArtifactStore(options: {
  dataDir: string;
  now?: () => Date;
  idFactory?: () => string;
}): ArtifactStore {
  const nowFn = options.now ?? (() => new Date());
  const idFactory = options.idFactory ?? (() => randomUUID());
  const dataDir = path.resolve(options.dataDir);

  function artifactDir(id: string): string {
    if (!isArtifactId(id)) {
      throw new Error("invalid artifact id");
    }
    return path.join(dataDir, id);
  }

  function filesRoot(id: string): string {
    return path.join(artifactDir(id), "files");
  }

  function metaPath(id: string): string {
    return path.join(artifactDir(id), "meta.json");
  }

  async function readMeta(id: string): Promise<ArtifactMeta | null> {
    try {
      const raw = await readFile(metaPath(id), "utf8");
      const parsed = JSON.parse(raw) as ArtifactMeta;
      if (!parsed || parsed.id !== id || typeof parsed.entry !== "string" || typeof parsed.expiresAt !== "string") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async function remove(id: string): Promise<boolean> {
    if (!isArtifactId(id)) {
      return false;
    }
    const dir = path.join(dataDir, id);
    try {
      await rm(dir, { recursive: true, force: true });
      return true;
    } catch {
      return false;
    }
  }

  async function expireIfNeeded(id: string, now: Date): Promise<boolean> {
    const meta = await readMeta(id);
    const expiresAt = meta ? Date.parse(meta.expiresAt) : Number.NaN;
    if (!meta || Number.isNaN(expiresAt) || expiresAt <= now.getTime()) {
      await remove(id);
      return true;
    }
    return false;
  }

  return {
    async put(input) {
      if (!Number.isInteger(input.ttlSeconds) || input.ttlSeconds < DEFAULT_MIN_TTL || input.ttlSeconds > DEFAULT_MAX_TTL) {
        throw new Error("ttlSeconds must be an integer between 1 and 2592000");
      }
      if (!Array.isArray(input.files) || input.files.length === 0) {
        throw new Error("files must be a non-empty array");
      }

      const safeFiles = input.files.map((file) => {
        const rel = assertSafeRelPath(file.path);
        return { ...file, path: rel };
      });
      const entry = assertSafeRelPath(resolveEntry(safeFiles, input.entry));
      const id = idFactory();
      if (!isArtifactId(id)) {
        throw new Error("invalid artifact id");
      }

      const expiresAt = new Date(nowFn().getTime() + input.ttlSeconds * 1000).toISOString();
      await ensurePrivateDir(dataDir);
      await ensurePrivateDir(artifactDir(id));
      const root = filesRoot(id);
      await ensurePrivateDir(root);

      for (const file of safeFiles) {
        const dest = safeResolve(root, file.path);
        await ensurePrivateDir(path.dirname(dest));
        await assertUnlinkedAncestors(root, file.path);
        const bytes =
          file.encoding === "base64" ? Buffer.from(file.content, "base64") : Buffer.from(file.content, "utf8");
        await writePrivateFile(dest, bytes);
      }

      const meta: ArtifactMeta = { id, entry, expiresAt };
      await writePrivateFile(metaPath(id), `${JSON.stringify(meta)}\n`);
      return { id, expiresAt, entry };
    },

    async getMeta(id) {
      if (!isArtifactId(id)) {
        return null;
      }
      if (await expireIfNeeded(id, nowFn())) {
        return null;
      }
      return readMeta(id);
    },

    async getFile(id, rel) {
      if (!isArtifactId(id)) {
        return null;
      }
      if (await expireIfNeeded(id, nowFn())) {
        return null;
      }

      const dest = await resolveUnlinkedFile(filesRoot(id), rel);
      if (!dest) {
        return null;
      }
      try {
        const handle = await open(dest, constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
          const bytes = await handle.readFile();
          return { bytes, contentType: contentTypeFor(rel) };
        } finally {
          await handle.close();
        }
      } catch {
        return null;
      }
    },

    async remove(id) {
      if (!isArtifactId(id)) {
        return false;
      }
      try {
        await stat(path.join(dataDir, id));
      } catch {
        return false;
      }
      await rm(path.join(dataDir, id), { recursive: true, force: true });
      return true;
    },

    async sweepExpired(now) {
      const when = now ?? nowFn();
      let removed = 0;
      let names: string[];
      try {
        names = await readdir(dataDir);
      } catch {
        return 0;
      }
      for (const name of names) {
        if (!isArtifactId(name)) {
          continue;
        }
        if (await expireIfNeeded(name, when)) {
          removed += 1;
        }
      }
      return removed;
    },
  };
}
