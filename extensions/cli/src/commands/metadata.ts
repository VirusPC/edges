export function parseMetadata(pairs: string[] | undefined): Record<string, string> | undefined {
  if (!pairs?.length) return undefined;
  const metadata: Record<string, string> = {};
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq <= 0) throw new Error(`metadata must be key=value: ${pair}`);
    metadata[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return metadata;
}

export function collectRepeat(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}
