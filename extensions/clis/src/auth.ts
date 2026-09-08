import { readFile } from "node:fs/promises";
import type { IngestErrorCode } from "./types.js";

export type AuthFailure = {
  errorCode: Extract<IngestErrorCode, "AUTH_MISSING" | "AUTH_INVALID_FORMAT" | "AUTH_INVALID_TOKEN">;
  reason: string;
};

export type AuthResult = { ok: true } | { ok: false; failure: AuthFailure };

export async function checkAuth(options: {
  expectedToken: string | undefined;
  tokenFile?: string;
  tokenStdin?: boolean;
  stdinText?: string;
  stdinIsTTY?: boolean;
}): Promise<AuthResult> {
  if (!options.expectedToken) {
    return { ok: true };
  }

  if (!options.tokenFile && !options.tokenStdin) {
    return {
      ok: false,
      failure: {
        errorCode: "AUTH_MISSING",
        reason: "EDGES_AUTH_TOKEN is set; pass --token-file or --token-stdin",
      },
    };
  }

  let presented: string;
  if (options.tokenStdin) {
    if (options.stdinIsTTY) {
      return {
        ok: false,
        failure: {
          errorCode: "AUTH_INVALID_FORMAT",
          reason: "--token-stdin requires a non-TTY stdin",
        },
      };
    }
    presented = (options.stdinText ?? "").trim();
    if (!presented) {
      return {
        ok: false,
        failure: {
          errorCode: "AUTH_INVALID_FORMAT",
          reason: "token from stdin is empty",
        },
      };
    }
  } else {
    try {
      presented = (await readFile(options.tokenFile as string, "utf8")).trim();
    } catch {
      return {
        ok: false,
        failure: {
          errorCode: "AUTH_INVALID_FORMAT",
          reason: `cannot read --token-file: ${options.tokenFile}`,
        },
      };
    }
    if (!presented) {
      return {
        ok: false,
        failure: {
          errorCode: "AUTH_INVALID_FORMAT",
          reason: "token file is empty",
        },
      };
    }
  }

  if (presented !== options.expectedToken) {
    return {
      ok: false,
      failure: {
        errorCode: "AUTH_INVALID_TOKEN",
        reason: "Invalid authorization token",
      },
    };
  }

  return { ok: true };
}
