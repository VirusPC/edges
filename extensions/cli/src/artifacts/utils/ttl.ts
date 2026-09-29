const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 86_400,
};

const MAX_TTL_SECONDS = 2_592_000;

export function parseTtlSeconds(raw: string): number {
  const match = /^(\d+)([smhd])?$/.exec(raw.trim());
  if (!match) {
    throw new Error("ttl must be seconds or a duration like 24h, 90m, 1d");
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const seconds = amount * UNIT_SECONDS[unit];
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_TTL_SECONDS) {
    throw new Error("ttl must be an integer between 1 and 2592000 seconds");
  }
  return seconds;
}
