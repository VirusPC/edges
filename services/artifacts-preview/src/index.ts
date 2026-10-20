#!/usr/bin/env node
import path from "node:path";
import { tmpdir } from "node:os";
import { listenArtifactsServer } from "./server.js";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} is required`);
    process.exit(2);
  }
  return value;
}

const token = requiredEnv("EDGES_ARTIFACTS_TOKEN");
const host = process.env.EDGES_ARTIFACTS_HOST?.trim() || "127.0.0.1";
const port = Number(process.env.EDGES_ARTIFACTS_PORT ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("EDGES_ARTIFACTS_PORT must be an integer 1–65535");
  process.exit(2);
}
const dataDir = process.env.EDGES_ARTIFACTS_DATA_DIR?.trim() || path.join(tmpdir(), "edges-artifacts");
const baseUrl = (process.env.EDGES_ARTIFACTS_BASE_URL?.trim() || `http://${host}:${port}`).replace(/\/$/, "");

const listening = await listenArtifactsServer({
  token,
  dataDir,
  baseUrl,
  listen: { host, port },
});

console.error(`artifacts preview listening on ${listening.url}`);
console.error(`public artifact URLs use ${baseUrl}`);
console.error("Phone review needs a reachable URL (not localhost).");
