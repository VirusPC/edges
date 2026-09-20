import type { ArtifactFrom } from "./from.js";
import type { ArtifactTask } from "./task.js";

export type { ArtifactFrom, ArtifactTask };

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
  task?: ArtifactTask;
};

const ARTIFACT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  from: ArtifactFrom;
  task?: ArtifactTask;
  fetch: typeof fetch;
}): Promise<PublishResult> {
  const body: Record<string, unknown> = {
    ttlSeconds: options.ttlSeconds,
    files: options.files,
    from: options.from,
  };
  if (options.entry) {
    body.entry = options.entry;
  }
  if (options.task) {
    body.task = options.task;
  }
  const response = await options.fetch(`${options.baseUrl.replace(/\/$/, "")}/artifacts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.token}`,
      "content-type": "application/json",
    },
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
    headers: {
      authorization: `Bearer ${options.token}`,
    },
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
