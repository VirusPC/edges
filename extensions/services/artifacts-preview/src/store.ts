import { randomUUID } from "node:crypto";
import { lstat, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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
    if (!meta) {
      return true;
    }
    if (new Date(meta.expiresAt).getTime() <= now.getTime()) {
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
      const root = filesRoot(id);
      await mkdir(root, { recursive: true });

      for (const file of safeFiles) {
        const dest = safeResolve(root, file.path);
        await mkdir(path.dirname(dest), { recursive: true });
        const bytes =
          file.encoding === "base64" ? Buffer.from(file.content, "base64") : Buffer.from(file.content, "utf8");
        await writeFile(dest, bytes);
      }

      const meta: ArtifactMeta = { id, entry, expiresAt };
      await writeFile(metaPath(id), `${JSON.stringify(meta)}\n`, "utf8");
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

      let dest: string;
      try {
        dest = safeResolve(filesRoot(id), rel);
      } catch {
        return null;
      }

      try {
        const info = await lstat(dest);
        if (info.isSymbolicLink()) {
          return null;
        }
        if (!info.isFile()) {
          return null;
        }
        const bytes = await readFile(dest);
        return { bytes, contentType: contentTypeFor(rel) };
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
