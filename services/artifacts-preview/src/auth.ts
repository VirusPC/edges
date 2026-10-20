import { timingSafeEqual } from "node:crypto";

export type AuthFailure = {
  ok: false;
  errorCode: "AUTH_MISSING" | "AUTH_INVALID_FORMAT" | "AUTH_INVALID_TOKEN";
  reason: string;
};

export function readBearerToken(header: string | undefined): { ok: true; token: string } | AuthFailure {
  if (!header) {
    return {
      ok: false,
      errorCode: "AUTH_MISSING",
      reason: "Authorization header is required",
    };
  }
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    return {
      ok: false,
      errorCode: "AUTH_INVALID_FORMAT",
      reason: "Authorization header must be in format: Bearer <token>",
    };
  }
  return { ok: true, token: match[1] };
}

export function tokensEqual(expected: string, actual: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  const compare = left.length === right.length ? right : Buffer.alloc(left.length);
  return timingSafeEqual(left, compare) && left.length === right.length;
}

export function authorizeWrite(header: string | undefined, expected: string): AuthFailure | { ok: true } {
  const parsed = readBearerToken(header);
  if (!parsed.ok) {
    return parsed;
  }
  if (!tokensEqual(expected, parsed.token)) {
    return {
      ok: false,
      errorCode: "AUTH_INVALID_TOKEN",
      reason: "Invalid authorization token",
    };
  }
  return { ok: true };
}
