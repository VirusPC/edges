import type { ArtifactFrom } from "./from.js";

export type { ArtifactFrom };

export type PublishFile = {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
};

export type PublishResult = {
  id: string;
  url: string;
  expiresAt: string;
  from?: ArtifactFrom;
};

const ARTIFACT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Stable browser UA. Cloudflare 1010 blocks Node's default `node` identifier. */
export const ARTIFACTS_CLIENT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function clientHeaders(token: string, extra?: Record<string, string>): Record<string, string> {
  return {
    ...extra,
    authorization: `Bearer ${token}`,
    "user-agent": ARTIFACTS_CLIENT_USER_AGENT,
  };
}

export function extractArtifactId(idOrUrl: string): string {
  const trimmed = idOrUrl.trim();
  if (ARTIFACT_ID.test(trimmed)) {
    return trimmed;
  }
  const match = /\/artifacts\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\/|$)/i.exec(
    trimmed,
  );
  if (!match) {
    throw new Error("expected an artifact id or URL containing /artifacts/<uuid>");
  }
  return match[1];
}

export async function publishArtifact(options: {
  baseUrl: string;
  token: string;
  files: PublishFile[];
  ttlSeconds: number;
  entry?: string;
  from?: ArtifactFrom;
  fetch: typeof fetch;
}): Promise<PublishResult> {
  const body: Record<string, unknown> = {
    ttlSeconds: options.ttlSeconds,
    files: options.files,
  };
  if (options.entry) {
    body.entry = options.entry;
  }
  if (options.from) {
    body.from = options.from;
  }
  const response = await options.fetch(`${options.baseUrl.replace(/\/$/, "")}/artifacts`, {
    method: "POST",
    headers: clientHeaders(options.token, { "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
  return parseWriteResponse(response, 201) as Promise<PublishResult>;
}

export async function deleteArtifact(options: {
  baseUrl: string;
  token: string;
  id: string;
  fetch: typeof fetch;
}): Promise<void> {
  const response = await options.fetch(`${options.baseUrl.replace(/\/$/, "")}/artifacts/${options.id}`, {
    method: "DELETE",
    headers: clientHeaders(options.token),
  });
  if (response.status === 204) {
    return;
  }
  await parseWriteResponse(response, 204);
}

async function parseWriteResponse(response: Response, expected: number): Promise<PublishResult | void> {
  if (response.status === 401 || response.status === 403) {
    const payload = await safeJson(response);
    const reason = typeof payload.reason === "string" ? payload.reason : "authorization failed";
    const error = new Error(reason) as Error & { errorCode: string };
    error.errorCode = typeof payload.errorCode === "string" ? payload.errorCode : "AUTH_INVALID_TOKEN";
    throw error;
  }
  if (response.status !== expected) {
    const payload = await safeJson(response);
    const reason =
      typeof payload.reason === "string" ? payload.reason : `unexpected status ${response.status}`;
    const error = new Error(reason) as Error & { errorCode: string };
    error.errorCode = typeof payload.errorCode === "string" ? payload.errorCode : "UNKNOWN_ERROR";
    throw error;
  }
  if (expected === 204) {
    return;
  }
  const payload = (await response.json()) as PublishResult;
  if (!payload?.id || !payload.url) {
    throw new Error("publish response missing id or url");
  }
  return payload;
}

async function safeJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
