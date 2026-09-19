export type ArtifactEncoding = "utf8" | "base64";

export type ArtifactFileInput = {
  path: string;
  content: string;
  encoding?: ArtifactEncoding;
};

export type ArtifactMeta = {
  id: string;
  entry: string;
  expiresAt: string;
};

export type PublishBody = {
  ttlSeconds?: number;
  entry?: string;
  files: ArtifactFileInput[];
};

export type ArtifactStore = {
  put(input: {
    ttlSeconds: number;
    entry?: string;
    files: ArtifactFileInput[];
  }): Promise<{ id: string; expiresAt: string; entry: string }>;
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
