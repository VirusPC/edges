import type { ArtifactFrom } from "./from.js";

export type { ArtifactFrom };

export type ArtifactEncoding = "utf8" | "base64";

export type ArtifactFileInput = {
  path: string;
  content: string;
  encoding?: ArtifactEncoding;
};

export type ArtifactMeta = {
  id: string;
  entry: string;
  expiresAt?: string;
  published?: boolean;
  from?: ArtifactFrom;
};

export type PublishBody = {
  ttlSeconds?: number;
  entry?: string;
  from?: ArtifactFrom;
  files: ArtifactFileInput[];
  publish?: boolean;
};

export type ArtifactStore = {
  put(input: {
    ttlSeconds?: number;
    entry?: string;
    from?: ArtifactFrom;
    files: ArtifactFileInput[];
    published?: boolean;
  }): Promise<{ id: string; expiresAt?: string; entry: string; from?: ArtifactFrom; published: boolean }>;
  publish(id: string, ttlSeconds: number): Promise<{ id: string; expiresAt: string; entry: string; from?: ArtifactFrom }>;
  getMeta(id: string): Promise<ArtifactMeta | null>;
  getFile(id: string, rel: string): Promise<{ bytes: Buffer; contentType: string } | null>;
  remove(id: string): Promise<boolean>;
  sweepExpired(now?: Date): Promise<number>;
};

export type ServerOptions = {
  token: string;
  dataDir: string;
  baseUrl: string;
  now?: () => Date;
  idFactory?: () => string;
  sweepIntervalMs?: number | null;
  maxBodyBytes?: number;
};
