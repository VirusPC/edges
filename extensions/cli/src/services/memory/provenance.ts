import { execFileSync } from "node:child_process";
export const ORIGIN_FIELDS = ["originSessionId", "agentClient"] as const;
export const AUDIT_FIELDS = ["username", "email"] as const;
export function nowTimestamp(): string {
  const date = new Date(),
    offset = -date.getTimezoneOffset(),
    sign = offset < 0 ? "-" : "+";
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
}
export function gitIdentity(target: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [option, field] of [
    ["user.name", "username"],
    ["user.email", "email"],
  ] as const)
    try {
      const value = execFileSync("git", ["-C", target, "config", option], {
        encoding: "utf8",
        timeout: 5000,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
      if (value) fields[field] = value;
    } catch {}
  return fields;
}
export function agentContext(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  for (const [flag, client, session] of [
    ["CURSOR_AGENT", "cursor", "CURSOR_CONVERSATION_ID"],
    ["CLAUDECODE", "claude-code", "CLAUDE_SESSION_ID"],
  ] as const)
    if (env[flag])
      return {
        agentClient: client,
        ...(env[session] ? { originSessionId: env[session]! } : {}),
      };
  return {};
}
