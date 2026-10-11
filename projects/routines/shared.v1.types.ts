/**
 * Shared Routine filesystem model (vendor-neutral).
 * One routine = one directory under Routines/<id>/ with INDEX.md (frontmatter + body).
 * Platform bindings live in adapters/*.yaml (optional), not in the shared contract.
 */

/** Semver string, e.g. "1.0.0" */
export type SemVer = string;

/** IANA timezone, e.g. "Asia/Shanghai" */
export type IanaTimeZone = string;

/** Capability noun, not a vendor tool id — e.g. "read-transcripts", "open-pr" */
export type Capability = string;

/** Secret reference name only — never the secret value */
export type SecretRef = string;

export type RoutineStatus = "draft" | "active" | "paused" | "retired";

export type Owner =
  | { kind: "person"; id: string; email?: string }
  | { kind: "team"; id: string; name?: string }
  | { kind: "agent"; id: string; name?: string };

/** Time-based triggers. Prefer cron + timezone for portability. */
export type CronTrigger = {
  type: "cron";
  /** 5-field POSIX cron: minute hour day-of-month month day-of-week */
  expression: string;
  timezone: IanaTimeZone;
};

export type IntervalTrigger = {
  type: "interval";
  /** e.g. "4h", "30m", "1d" — parser is adapter-specific */
  every: string;
  timezone: IanaTimeZone;
};

export type RRuleTrigger = {
  type: "rrule";
  /** RFC 5545 RRULE body, optionally with DTSTART handled by adapter */
  rrule: string;
  timezone: IanaTimeZone;
};

export type OneShotTrigger = {
  type: "one_shot";
  /** ISO-8601 instant or local wall time + timezone */
  at: string;
  timezone?: IanaTimeZone;
};

/**
 * Event triggers stay abstract in the shared file.
 * Adapters map `source` + `filter` to Slack/GitHub/webhook/etc.
 */
export type EventTrigger = {
  type: "event";
  /** Noun: "github.pr", "slack.message", "webhook", ... */
  source: string;
  /** Opaque filter object; meaning defined by adapter for that source */
  filter?: Record<string, unknown>;
};

export type WebhookTrigger = {
  type: "webhook";
  /** Logical name; URL/secret live in adapter / vault refs */
  name?: string;
};

export type RoutineTrigger =
  | CronTrigger
  | IntervalTrigger
  | RRuleTrigger
  | OneShotTrigger
  | EventTrigger
  | WebhookTrigger;

export type OverlapPolicy = "skip" | "queue" | "cancel_previous";

export type MisfirePolicy =
  | "skip"
  | "run_once_on_wake"
  | "catch_up_bounded";

export type RetryPolicy = {
  /** Blind retry of side-effecting runs should stay false by default */
  enabled: boolean;
  maxAttempts?: number;
  backoff?: "none" | "linear" | "exponential";
};

export type ExecutionPolicy = {
  /** Prefer a fresh session/run each fire (agent platforms) */
  freshRun: boolean;
  concurrency: OverlapPolicy;
  /** Soft or hard wall-clock budget in minutes */
  timeoutMin?: number;
  misfire: MisfirePolicy;
  retry: RetryPolicy;
  /** Stable key template for idempotency, e.g. "{id}:{fireDate}" */
  idempotencyKey?: string;
};

export type Destination =
  | { kind: "chat"; channel: "owner" | "thread" | "group"; ref?: string }
  | { kind: "file"; pathTemplate: string }
  | { kind: "none" };

export type IoPolicy = {
  /** Declared inputs the run may need (paths, queries) — no secrets */
  inputs?: Array<{ name: string; description: string; required?: boolean }>;
  /** Declared outputs the run should produce */
  outputs?: Array<{ name: string; description: string }>;
  destination: Destination;
  /** When nothing actionable: stay silent (no message) */
  quietWhenEmpty: boolean;
};

export type ApprovalPolicy = {
  /** Human must approve before these capability nouns execute */
  requiredFor: Capability[];
};

export type Policy = {
  approvals: ApprovalPolicy;
  /** Secret refs only — values never in-repo */
  secrets: SecretRef[];
  /** Treat event/webhook payloads as untrusted unless Intent opts in */
  trustEventPayload: boolean;
  /** What "green run" means in prose, mirrored in INDEX.md body */
  successCriteria: string[];
};

/**
 * YAML frontmatter of Routines/<id>/INDEX.md
 * Body sections (Markdown): Intent, Procedure, Inputs, Outputs, Idle, Success, Ownership
 */
export type RoutineFrontmatter = {
  /** routine.schema version for this file shape */
  schema: "shared.v1";
  id: string;
  name: string;
  version: SemVer;
  status: RoutineStatus;
  owners: Owner[];
  created: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  tags?: string[];
  triggers: RoutineTrigger[];
  execution: ExecutionPolicy;
  io: IoPolicy;
  policy: Policy;
  /**
   * Capability nouns the intent may need.
   * Adapters bind these to real tools/MCP — never put vendor tool ids here.
   */
  capabilities?: Capability[];
};

/** Parsed on-disk routine (frontmatter + markdown body) */
export type RoutineDocument = {
  frontmatter: RoutineFrontmatter;
  /** Markdown below the second --- */
  body: string;
};

/** Optional platform binding: Routines/<id>/adapters/<platform>.yaml */
export type PlatformAdapter = {
  platform:
    | "grok-bot"
    | "claude-desktop"
    | "claude-cloud"
    | "codex-chatgpt"
    | "kimi-code"
    | "pi"
    | "dsh-routines"
    | "os-cron"
    | string;
  /** Opaque binding — e.g. grokBotFolder, skillPath, envId */
  binding: Record<string, unknown>;
  /** Map shared capability nouns → platform-specific tool/skill names */
  capabilityMap?: Record<Capability, string>;
  notes?: string;
};

/**
 * Filesystem layout for this project (local first; migrate to edges later):
 *
 * Routines/
 *   README.md
 *   types.ts                 ← this file
 *   <routine-id>/
 *     INDEX.md               ← frontmatter: RoutineFrontmatter; body: intent sections
 *     adapters/              ← optional
 *       grok-bot.yaml        ← PlatformAdapter
 *       claude-desktop.yaml
 *     examples/              ← optional sample outputs / fixtures
 *   _schema/
 *     shared.v1.md           ← human doc of the schema (optional)
 */
export type RoutinesTree = {
  root: "Routines";
  entries: Array<{
    id: string;
    index: "INDEX.md";
    adapters?: string[]; // filenames under adapters/
  }>;
};
