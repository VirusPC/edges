import path from "node:path";

const ARTIFACT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isArtifactId(id: string): boolean {
  return ARTIFACT_ID.test(id);
}

export function assertSafeRelPath(rel: string): string {
  if (
    typeof rel !== "string" ||
    rel.length === 0 ||
    rel.includes("\0") ||
    rel.includes("\\") ||
    rel.startsWith("/")
  ) {
    throw new Error("artifact path must be a relative POSIX path");
  }

  const segments = rel.split("/");
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") {
      throw new Error("artifact path must not contain '..' or empty segments");
    }
  }

  const normalized = path.posix.normalize(rel);
  if (normalized.startsWith("..") || path.posix.isAbsolute(normalized)) {
    throw new Error("artifact path escapes the artifact root");
  }

  return rel;
}

export function safeResolve(root: string, rel: string): string {
  const safeRel = assertSafeRelPath(rel);
  const resolved = path.resolve(root, safeRel);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    throw new Error("artifact path escapes the artifact root");
  }
  return resolved;
}
