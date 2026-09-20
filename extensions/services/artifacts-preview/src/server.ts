import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { authorizeWrite } from "./auth.js";
import { headerValue, readJsonBody, sendError, sendJson } from "./http.js";
import { isArtifactId } from "./paths.js";
import { parseArtifactFrom } from "./from.js";
import { parseArtifactTask } from "./task.js";
import { createArtifactStore } from "./store.js";
import type { ArtifactFileInput, PublishBody, ServerOptions } from "./types.js";

const DEFAULT_TTL_SECONDS = 86_400;
const DEFAULT_MAX_BODY_BYTES = 10 * 1024 * 1024;

export type ListenArtifactsOptions = ServerOptions & {
  listen?: { host?: string; port?: number };
};

function defaultTtl(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_TTL_SECONDS;
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("ttlSeconds must be an integer between 1 and 2592000");
  }
  return value;
}

function parseFiles(raw: unknown): ArtifactFileInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("files must be a non-empty array");
  }
  return raw.map((file, index) => {
    if (!file || typeof file !== "object") {
      throw new Error(`files[${index}] must be an object`);
    }
    const rec = file as { path?: unknown; content?: unknown; encoding?: unknown };
    if (typeof rec.path !== "string" || typeof rec.content !== "string") {
      throw new Error(`files[${index}] must include path and content strings`);
    }
    if (rec.encoding !== undefined && rec.encoding !== "utf8" && rec.encoding !== "base64") {
      throw new Error(`files[${index}] encoding must be utf8 or base64`);
    }
    return {
      path: rec.path,
      content: rec.content,
      encoding: rec.encoding,
    };
  });
}

function artifactPath(pathname: string): { id: string; rel: string | null } | null {
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (parts[0] !== "artifacts" || !parts[1]) {
    return null;
  }
  let id: string;
  let rest: string[];
  try {
    id = decodeURIComponent(parts[1]);
    rest = parts.slice(2).map((part) => decodeURIComponent(part));
  } catch {
    return null;
  }
  if (!isArtifactId(id)) {
    return null;
  }
  return { id, rel: rest.length === 0 ? null : rest.join("/") };
}

export function createArtifactsServer(options: ServerOptions): http.Server {
  const store = createArtifactStore({
    dataDir: options.dataDir,
    now: options.now,
    idFactory: options.idFactory,
  });
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  const server = http.createServer((req, res) => {
    void handleRequest(req, res).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!res.headersSent) {
        sendError(res, 500, "UNKNOWN_ERROR", message);
      } else {
        res.end();
      }
    });
  });

  const sweepMs = options.sweepIntervalMs;
  if (sweepMs !== null && sweepMs !== 0) {
    const interval = setInterval(() => {
      void store.sweepExpired();
    }, sweepMs ?? 60_000);
    interval.unref();
    server.on("close", () => clearInterval(interval));
  }

  async function requireWrite(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const auth = authorizeWrite(headerValue(req, "authorization"), options.token);
    if (!auth.ok) {
      sendError(res, 401, auth.errorCode, auth.reason);
      return false;
    }
    return true;
  }

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const pathname = url.pathname;

    if (method === "GET" && pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === "POST" && pathname === "/artifacts") {
      if (!(await requireWrite(req, res))) {
        return;
      }
      let body: unknown;
      try {
        body = await readJsonBody(req, maxBodyBytes);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 400, "VALIDATION_ERROR", message);
        return;
      }
      if (!body || typeof body !== "object") {
        sendError(res, 400, "VALIDATION_ERROR", "request body must be a JSON object");
        return;
      }
      const publish = body as PublishBody;
      try {
        const files = parseFiles(publish.files);
        const from = parseArtifactFrom(publish.from);
        const task = parseArtifactTask(publish.task);
        const created = await store.put({
          ttlSeconds: defaultTtl(publish.ttlSeconds),
          entry: publish.entry,
          from,
          task,
          files,
        });
        sendJson(res, 201, {
          id: created.id,
          url: `${baseUrl}/artifacts/${created.id}/`,
          expiresAt: created.expiresAt,
          from: created.from,
          ...(created.task ? { task: created.task } : {}),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sendError(res, 400, "VALIDATION_ERROR", message);
      }
      return;
    }

    const artifact = artifactPath(pathname);
    if (!artifact) {
      sendError(res, 404, "NOT_FOUND", "not found");
      return;
    }

    if (method === "DELETE" && artifact.rel === null) {
      if (!(await requireWrite(req, res))) {
        return;
      }
      const removed = await store.remove(artifact.id);
      if (!removed) {
        sendError(res, 404, "NOT_FOUND", "artifact not found");
        return;
      }
      res.writeHead(204);
      res.end();
      return;
    }

    if (method === "GET") {
      const meta = await store.getMeta(artifact.id);
      if (!meta) {
        sendError(res, 404, "NOT_FOUND", "artifact not found");
        return;
      }
      const rel = artifact.rel ?? meta.entry;
      const file = await store.getFile(artifact.id, rel);
      if (!file) {
        sendError(res, 404, "NOT_FOUND", "artifact file not found");
        return;
      }
      res.writeHead(200, {
        "content-type": file.contentType,
        "content-length": file.bytes.length,
        "cache-control": "no-store",
      });
      res.end(file.bytes);
      return;
    }

    sendError(res, 405, "METHOD_NOT_ALLOWED", "method not allowed");
  }

  return server;
}

export async function listenArtifactsServer(
  options: ListenArtifactsOptions,
): Promise<{ server: http.Server; url: string; close: () => Promise<void> }> {
  const host = options.listen?.host ?? "127.0.0.1";
  const port = options.listen?.port ?? 8787;
  const server = createArtifactsServer(options);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const boundPort = typeof address === "object" && address ? address.port : port;
  const url = `http://${host}:${boundPort}`;
  return {
    server,
    url,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
