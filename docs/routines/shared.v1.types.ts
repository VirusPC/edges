/**
 * Schema shared.v1 — portable Routine definition for review.
 *
 * This file is a design snapshot. It is not wired into the Edges build,
 * and this repository does not grow a top-level Routines/ product directory.
 *
 * Proposed filesystem (the layout lives in the note and in this comment):
 *
 *   Routines/<id>/INDEX.md
 *     YAML frontmatter = RoutineFrontmatter
 *     Markdown body     = the prompt executed on each run
 *   Routines/<id>/adapters/<platform>.yaml
 *     PlatformAdapter
 *
 * Shared nouns sit on RoutineFrontmatter:
 *   intent, triggers, execution, io, policy, capabilities
 *
 * Adapters stay beside that document. An adapter records where a platform
 * keeps its native copy and which shared fields that platform cannot store.
 * It does not restate the prompt or the nouns.
 *
 * Secrets, bearer tokens, and webhook keys stay out of both files.
 * An adapter may name a secret slot. It must not contain the secret.
 */

export const ROUTINE_SCHEMA = "shared.v1" as const;

export type RoutineSchema = typeof ROUTINE_SCHEMA;

/** Stable id. Also the directory name under the proposed Routines/ tree. */
export type RoutineId = string;

export type PlatformId =
  | "grok-bot"
  | "claude-code-cloud"
  | "claude-desktop"
  | "codex"
  | "chatgpt-scheduled"
  | "kimi"
  | "pi"
  | "dsh";

/** What the routine is for. The prompt itself is the INDEX.md body. */
export interface Intent {
  /** Display name. Adapters may kebab-case it when a platform needs a folder name. */
  name: string;
  /** One-line summary for lists. Distinct from the prompt body. */
  description: string;
  /** What a single successful run produces, in terms a person can check. */
  outcome: string;
}

export interface CronSchedule {
  form: "cron";
  /** Five fields: minute hour day-of-month month day-of-week. */
  expression: string;
}

export interface RRuleSchedule {
  form: "rrule";
  /** RFC 5545 RRULE value, without the RRULE: prefix. */
  expression: string;
}

export interface PresetSchedule {
  form: "preset";
  preset: "hourly" | "daily" | "weekdays" | "weekly" | "monthly";
  /** Local wall time HH:mm when the preset needs a clock time. */
  at?: string;
  /** 1 = Monday … 7 = Sunday, when preset is weekly. */
  weekday?: number;
}

export interface IntervalSchedule {
  form: "interval";
  /** Compact duration such as "5m", "2h", or "1d". */
  every: string;
}

export type ScheduleExpr =
  | CronSchedule
  | RRuleSchedule
  | PresetSchedule
  | IntervalSchedule;

export interface ScheduleTrigger {
  kind: "schedule";
  expr: ScheduleExpr;
  /** IANA zone. Required so adapters cannot silently use the host zone. */
  timezone: string;
  /** False means fire once, then disable. */
  recurring: boolean;
}

export type EventSource =
  | "github"
  | "slack"
  | "linear"
  | "sentry"
  | "pagerduty"
  | "email";

export interface EventTrigger {
  kind: "event";
  source: EventSource;
  /**
   * Structured filter. Values stay short labels (event name, channel, phrase).
   * Adapters map this onto the platform's own trigger form.
   */
  filter: Record<string, string>;
}

export interface WebhookTrigger {
  kind: "webhook";
  /** Name of a secret slot. The secret value is not in git. */
  authSlot: string;
  /** How the inbound body is handed to the run. */
  payload: "text" | "json";
}

export interface ManualTrigger {
  kind: "manual";
}

export interface SessionTrigger {
  kind: "session";
  on: "session_start" | "agent_end" | "session_shutdown" | "pulse";
  /** Required when on is "pulse". Compact duration such as "10m". */
  every?: string;
}

/** Triggers union. A routine may carry more than one. */
export type Trigger =
  | ScheduleTrigger
  | EventTrigger
  | WebhookTrigger
  | ManualTrigger
  | SessionTrigger;

export type ExecutionResidency =
  | "cloud"
  | "local-machine"
  | "in-session"
  | "headless-oneshot";

export type OverlapPolicy = "skip" | "queue" | "cancel-previous";

export type WorkspaceBinding =
  | { kind: "repo"; remote: string }
  | { kind: "cwd"; path: string }
  | { kind: "none" };

export interface ExecutionPolicy {
  residency: ExecutionResidency;
  /** Fresh session per fire, or continue an existing thread. */
  session: "fresh" | "thread";
  workspace: WorkspaceBinding;
  model?: string;
  timeoutMin?: number;
  overlap: OverlapPolicy;
  /**
   * Minimum gap this definition asks for.
   * Platforms enforce their own floors (Grok Bot 5m, Claude Code cloud 1h,
   * Claude Desktop 1m, Pi in-session extensions 30s). Adapters record the floor
   * they actually honor in PlatformAdapter.gaps or PlatformAdapter.narrows.
   */
  minInterval?: string;
}

export type InputSource = "prompt" | "fire-payload" | "file" | "connector";

export interface RoutineInput {
  name: string;
  required: boolean;
  source: InputSource;
}

export type Delivery =
  | { type: "chat" }
  | { type: "file"; path: string }
  | { type: "connector"; name: string };

export type MissingInputBehavior = "fail" | "report" | "skip";

export type StaleInputBehavior = "fail" | "report" | "use";

export interface IoPolicy {
  inputs: RoutineInput[];
  deliver: Delivery[];
  onMissing: MissingInputBehavior;
  onStale: StaleInputBehavior;
}

export type ApprovalGate =
  | "send"
  | "purchase"
  | "delete"
  | "publish"
  | "production-write";

export type Autonomy = "ask" | "allowlisted" | "unattended";

export type NetworkPolicy = "default-allowlist" | "open" | "none";

export interface Policy {
  enabled: boolean;
  /** Empty means the run does not stop for a person. */
  approval: ApprovalGate[];
  autonomy: Autonomy;
  network: NetworkPolicy;
  /** How many run records to keep, when the platform accepts a preference. */
  retainRuns?: number;
}

export interface Capabilities {
  /** Skill ids the run may load. Empty means the prompt alone. */
  skills: string[];
  /** Connector or plugin ids. Listing one permits the run to call it. */
  connectors: string[];
  /** Tools beyond the platform's default agent profile. */
  tools: string[];
}

export interface RoutineFrontmatter {
  schema: RoutineSchema;
  id: RoutineId;
  intent: Intent;
  triggers: Trigger[];
  execution: ExecutionPolicy;
  io: IoPolicy;
  policy: Policy;
  capabilities: Capabilities;
}

export type AdapterBindingKind = "account" | "file" | "tool-call" | "session-store";

export interface PlatformAdapter {
  schema: RoutineSchema;
  /** Matches RoutineFrontmatter.id. */
  routineId: RoutineId;
  platform: PlatformId;
  /**
   * Pointer to the native record. Not a second copy of the prompt.
   * ref is a path, an account routine id, or a tool name — never a secret.
   */
  binding: {
    kind: AdapterBindingKind;
    ref: string;
  };
  /** Shared fields this platform cannot store or cannot honor. */
  gaps: string[];
  /** Forced narrower values. Omitted fields keep the shared definition. */
  narrows?: {
    execution?: Partial<ExecutionPolicy>;
    policy?: Partial<Policy>;
  };
}
