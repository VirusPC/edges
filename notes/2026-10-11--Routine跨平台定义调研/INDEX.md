# Routine 跨平台定义调研

> 日期: 2026-10-11
> 状态: 待审阅的设计笔记。尚未写成 ADR，也尚未成为 Edges 的产品目录。
> 类型文件: [`docs/routines/shared.v1.types.ts`](../../docs/routines/shared.v1.types.ts)。文末代码块与该文件逐字相同，方便在 GitHub PR 的 Markdown 预览里一次看完。
> 材料日期: 公开文档与仓库快照截至 2026-10-11。Grok Bot 盒上的草稿没有挂进这次工作区，名词和类型按约定的 shared.v1 形状写全，路径改成 Edges 的笔记与 `docs/`。

## 结论

这几家都提供「到点，或遇到一件事，就跑一段提示词」。能放进 Git、换一个平台还能原样读懂的文件形态，目前几乎没有。

对照里需要单独记住的三件事：

- Claude Desktop 会在磁盘上留下 `SKILL.md`：frontmatter 是 `name` 与 `description`，正文是提示词。日程、工作目录、模型和启用状态在这个文件外面。
- Kimi Code 公开了 `CronCreate` 的工具 schema（`cron`、`prompt`、`recurring`），定义停在会话工具上，不是一份跨平台文件。
- 其余产品把定义留在账号、会话或各自的本机存储里。DSH 的 `dsh-routines` 是社区插件写出的 YAML，不是 DeepSeek Harness 官方核心，也不能当作大家共用的 schema。

建议的共享模型只用六个名词：`intent`、`triggers`、`execution`、`io`、`policy`、`capabilities`。平台怎么落地，写在旁边的 adapter 里，不写进名词本身。

## 校正

早期容易把「有没有日程能力」听成「有没有一份可搬运的文件」。分开看：

| 事实 | 依据 |
| --- | --- |
| Claude Desktop 的任务目录里有 `SKILL.md` | 官方说明：`~/.claude/scheduled-tasks/<name>/SKILL.md`（或 `CLAUDE_CONFIG_DIR`）。YAML frontmatter 只放 `name`、`description`，提示词是正文。改这个文件会在下次运行生效。 |
| 日程不在那份 `SKILL.md` 里 | 同一页写明：schedule、folder、model、enabled 要通过编辑表单或让 Claude 改，不在这个文件中。 |
| Kimi 有公开工具 schema | MoonshotAI/kimi-code 的工具文档与 `CronCreate` 实现：五段 cron、prompt（UTF-8 上限 8 KiB）、`recurring` 默认 true。 |
| 多数平台没有可移植的跨平台文件 | Grok Bot、Claude Code 云端 routine、ChatGPT Scheduled 的定义在产品账号侧。Codex app 有本机 `automation.toml` 的观察记录，Pi 的日程在社区扩展的本机会话状态里。这些都不是一份大家能互换的 schema。 |

## 对照

| 平台 | 定义放在哪 | 触发 | 跑在哪 | 间隔下限 | 可提交的跨平台文件 |
| --- | --- | --- | --- | --- | --- |
| Grok Bot | 账号里的 routine：Instruction、When to run，webhook 另有 URL 与 key | 日程；Slack / GitHub / Linear / Sentry / PagerDuty / 邮件；webhook | 云端，笔记本合上也能跑 | 日程至少相隔 5 分钟 | 无 |
| Claude Code 云端 | claude.ai 账号。`/schedule` 写入同一处 | 日程、GitHub 事件、API `POST .../fire` | Anthropic 云端（或组织自托管环境） | 1 小时 | 无 |
| Claude Desktop | `SKILL.md` 只含名称、描述、提示词；日程在应用记录里 | 手动、每小时、每天、工作日、每周，以及自定义 | 本机 | 1 分钟 | 只有半份：提示词在文件里，日程不在 |
| Codex app automations | 产品内创建。公开 issue 里见过本机 `automation.toml` | 独立 cron（每次新开）；线程 heartbeat（回到同一条线程，可用分钟级） | Codex app 后台 | 线程 heartbeat 可以到分钟级；独立任务按产品档位 | 本机 TOML，不是跨平台 schema |
| ChatGPT Scheduled | Scheduled 页面 / 对话里创建。Codex CLI 不提供这块管理界面 | 一次性或重复；进阶用 RFC 5545 RRULE；部分方案还可接应用事件 | 网页与客户端后台。独立任务每次新开聊天 | 产品档位；进阶日程走 RRULE | 无 |
| Kimi `CronCreate` | 会话内工具调用；随 `kimi --session` 恢复，不进入全新会话 | 五段本地时区 cron；`recurring: false` 为一次性 | 当前会话空闲时注入提示词 | 表达式本身；整点有抖动 | 无（公开的是工具 schema） |
| Pi | 上游核心没有 routine 文件。社区扩展自管状态 | pulse / cron / 一次性 / 会话钩子 / 本机 API / GitHub 轮询（以 pi-routines 为例） | 活着的 pi 会话内部 | pi-routines 文档写 30 秒 | 无统一文件 |
| DSH `dsh-routines` | `.dsh/routines/*.yaml` 或 `~/.dsh/routines/*.yaml` | cron、`@daily` 一类别名、`every 4h` | 常驻 profile 调度，每次拉起 headless 一次性会话 | 由 schedule 表达 | 有 YAML，但是 DSH 插件私有形状 |

## 各家要点

### Grok Bot

Routine 告诉一个 Bot 何时跑一段工作流。人在对话里用自然语言创建和修改；桌面端在 Bot 详情的 Routines 里看到 Instruction、When to run，以及 webhook 的 URL 与 key。日程使用设置里的 Bot 时区。新建的日程要等到下一个钟点才跑，Test 会立刻做一次真实运行。一个 Bot 最多 50 条 routine，每条保留最近 20 次运行记录。删除立即生效。

Webhook 的 key 是凭据。笔记和 adapter 只记录「有一个 auth slot」，不记录 key 本身。

材料: [Routines](https://cursor.com/help/grok-bot/routines)，[Skills and routines](https://docs.x.ai/grok-bot/skills-routines-and-automations)（页面标注更新于 2026-10-06）。

### Claude Code 云端

云端 routine 是研究预览：一段提示词、一个或多个仓库、一组 connector，加上日程、GitHub 事件或 API 触发，可组合。`/schedule`（别名 `/routines`）把结果写到 claude.ai 账号，和网页、Desktop 的 Cloud 入口是同一份。每次触发新开云端会话。日程最短 1 小时。API 触发走 `POST /v1/claude_code/routines/<id>/fire`，beta 头为 `experimental-cc-routine-2026-04-01`；token 只展示一次，留在调用方的密钥库。

材料: [Automate work with routines](https://code.claude.com/docs/en/routines)，[Introducing routines](https://claude.com/blog/introducing-routines-in-claude-code)。

### Claude Desktop

Desktop 里选 Local，得到的是本机 scheduled task，不是云端 routine。磁盘文件是 `~/.claude/scheduled-tasks/<kebab-name>/SKILL.md`。frontmatter 只有 `name` 和 `description`，正文是提示词。日程、工作目录、模型、是否启用，在文件之外，用编辑表单或会话里的 `update_scheduled_task` 修改。本机要在；最短间隔 1 分钟。

这是目前唯一「提示词已经在一份 Markdown 里」的官方形态，也是「日程故意不在这份文件里」的官方形态。共享模型把提示词放进 `INDEX.md` 正文，把 triggers 放进 frontmatter，就是为了补上这道缝，同时保留「正文给人读」的好处。

材料: [Schedule recurring tasks in Claude Code Desktop](https://code.claude.com/docs/en/desktop-scheduled-tasks)。

### Codex 与 ChatGPT Scheduled

这是两块相邻的表面。

ChatGPT Scheduled 在网页、手机和桌面的 ChatGPT 里管理。独立任务每次新开聊天；进阶日程可以改成 RRULE。任务可以使用 skill。Codex CLI 没有这块 Scheduled 管理界面。

Codex app 自己的 automations 分两种：独立运行（每次新开，自定义日程用 cron）和线程 heartbeat（回到同一条线程，可以用分钟级间隔）。OpenAI 的公开 issue 里，本机记录呈现为 `automation.toml`，字段包括 `kind`（`cron` 或 `heartbeat`）、`status`、`rrule`、`target_thread_id`。那是 Codex 自己的本机文件，时区解释也还有未关闭的问题，不能当成跨平台 schema。

材料: [Scheduled tasks](https://learn.chatgpt.com/docs/automations)，[Scheduled Tasks in ChatGPT](https://help.openai.com/en/articles/10291617)，[Automations – Codex app](https://developers.openai.com/codex/app/automations)。`automation.toml` 的字段来自 openai/codex 公开 issue 中的配置片段，不是一份官方文件规范。

### Kimi CronCreate

Kimi Code 把日程做成会话工具，schema 是公开的。`CronCreate` 接收：

- `cron`：用户本地时区的五段表达式
- `prompt`：触发时注入的文本，UTF-8 上限 8 KiB
- `recurring`：默认 true；false 表示下一次匹配后自动删除

成功时返回 `id`、规范化后的 `cron`、`humanSchedule`、`recurring`、`nextFireAt`。单会话最多 50 条。五年内不会触发的表达式会被拒绝。重复任务超过 7 天会再触发一次（信封上 `stale=true`）然后删除。触发文本包在 `cron-fire` 信封里。任务留在会话里，用 `kimi --session` 恢复，不会带进一个全新会话。只在会话空闲时投递。

这是「公开 schema」的例子，也是「schema 不等于可搬运文件」的例子。

材料: [MoonshotAI/kimi-code tools reference](https://github.com/MoonshotAI/kimi-code/blob/main/docs/en/reference/tools.md)。

### Pi

Pi 上游核心没有发布 routine 文件格式。社区扩展各自存状态。以 [Davidcreador/pi-routines](https://github.com/Davidcreador/pi-routines) 为例：routine 在活着的 pi 会话里变成普通一轮对话，支持 pulse、cron、一次性、会话钩子（`session_start`、`agent_end`、`session_shutdown`）、本机 API 和 GitHub 轮询。没有守护进程；pi 没开就不会跑。文档中的最短间隔是 30 秒。另外还有把任务写进 `.pi/scheduled_tasks.json` 或 `~/.pi-schedule/schedules.json` 的扩展。几个文件形状并存，所以 Pi 这一列不能写成「官方就这一种 JSON」。

### DSH dsh-routines

[Jesse-njx/dsh-routines](https://github.com/Jesse-njx/dsh-routines) 是 DeepSeek Harness 的社区插件，不是官方核心。一条 routine 是一份 YAML：必填 `name`、`schedule`、`prompt`；还有 `timezone`（默认 UTC，文档要求显式时区）、`cwd`、`profile`、`overlap`（`skip` / `queue` / `cancel-previous`）、`timeoutMin`、`deliver`。项目文件在 `<repo>/.dsh/routines/*.yaml`，全局文件在 `~/.dsh/routines/*.yaml`。调度器挂在一个常驻 profile 上，到点用 headless runner 开一次性会话，再把摘要写出去。

它是这组里最接近「人可以 diff 的定义文件」的一个，形状仍然是 DSH 插件私有的。共享模型向它借了 overlap、timeout、deliver 这几个执行与投递名词，不把它的 YAML 原样升成标准。

## 建议的共享模型

六个名词描述「要做什么」，adapter 描述「在某一家怎么挂上」。

| 名词 | 回答的问题 | 不放进去的东西 |
| --- | --- | --- |
| intent | 名称、一句话说明、怎样算跑成 | 整段提示词。提示词是 `INDEX.md` 正文 |
| triggers | 何时开始：日程、事件、webhook、手动、会话内脉冲或钩子 | 平台自己的 cron 方言。用统一的 expr，adapter 再降下去 |
| execution | 跑在云端、本机、会话内还是一次性 headless；新会话还是旧线程；仓库或目录；超时；重叠策略 | 某家账号里的环境变量和密钥 |
| io | 输入从哪来，结果送到哪，缺数据或数据过期时怎么办 | 连接器的访问令牌 |
| policy | 是否启用，哪些动作必须等人，自主程度，网络，运行记录留多少 | 审批按钮的 UI |
| capabilities | 允许加载的 skill、connector、额外工具 | 工具实现 |

`PlatformAdapter` 只保留三样：平台 id、指向原生记录的 binding、这份共享定义里该平台做不到的 gaps（以及被迫收窄的 narrows）。binding 可以是账号 id、文件路径或工具名。binding 不是第二份提示词。

这样做的直接原因：Claude Desktop 已经证明「提示词适合放在 Markdown」，也证明「把日程硬塞进同一份 frontmatter」并不是各家的现状。共享文件把日程放进 frontmatter 的 `triggers`，是提案，不是假装各家今天都这样存。

## 文件系统提案

下面是提案，不是本仓库里的目录。Edges 根 README 没有 routines 产品区，这次也不新增。

```text
Routines/<id>/INDEX.md
Routines/<id>/adapters/<platform>.yaml
```

`INDEX.md` 的 frontmatter 是 `RoutineFrontmatter`，正文是每次运行的提示词。`adapters/*.yaml` 每个平台一份，类型是 `PlatformAdapter`。

示例（虚构 id，没有任何凭据）：

```yaml
# Routines/weekday-inbox-brief/INDEX.md 的 frontmatter
schema: shared.v1
id: weekday-inbox-brief
intent:
  name: Weekday inbox brief
  description: 工作日早上汇总新的支持问题
  outcome: 在指定对话里留下一份带来源链接的简报；发不出去就报告失败
triggers:
  - kind: schedule
    expr:
      form: preset
      preset: weekdays
      at: "09:00"
    timezone: Asia/Shanghai
    recurring: true
execution:
  residency: cloud
  session: fresh
  workspace:
    kind: none
  overlap: skip
  minInterval: 5m
io:
  inputs:
    - name: ticket-source
      required: true
      source: connector
  deliver:
    - type: chat
  onMissing: fail
  onStale: report
policy:
  enabled: true
  approval: []
  autonomy: allowlisted
  network: default-allowlist
capabilities:
  skills: []
  connectors:
    - support-desk
  tools: []
```

```yaml
# Routines/weekday-inbox-brief/adapters/claude-desktop.yaml
schema: shared.v1
routineId: weekday-inbox-brief
platform: claude-desktop
binding:
  kind: file
  ref: ~/.claude/scheduled-tasks/weekday-inbox-brief/SKILL.md
gaps:
  - schedule, folder, model, and enabled state live outside SKILL.md
narrows:
  execution:
    residency: local-machine
    minInterval: 1m
```

```yaml
# Routines/weekday-inbox-brief/adapters/kimi.yaml
schema: shared.v1
routineId: weekday-inbox-brief
platform: kimi
binding:
  kind: tool-call
  ref: CronCreate
gaps:
  - session-scoped tool arguments, not a portable file
  - prompt capped at 8 KiB
  - recurring jobs expire after 7 days
narrows:
  execution:
    residency: in-session
    session: thread
```

## shared.v1 类型

类型文件是 [`docs/routines/shared.v1.types.ts`](../../docs/routines/shared.v1.types.ts)。下面是同一份全文。

```typescript
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
```

## 这份笔记不做什么

- 不在仓库根上新增 `routines/` 或 `Routines/` 产品目录，也不改根 README 的目录表。
- 不把上面的文件系统提案落成真实的 Routine 实例。
- 不取代维护看板里的「支持周期性任务与周期触发」。那张卡谈的是 Edges tasks 自己的周期字段；这里谈的是各家 agent 产品的 routine 定义能否共享。
- 不写入 token、webhook key、邮箱或未公开地址。adapter 示例里的 `authSlot` 只是槽名。

## 审阅时建议看的点

- 六个名词是否够用，还是要把 model、仓库、connector 再拆出去。
- `triggers` 联合是否盖住了要迁移的那几家；Pi 的多种社区文件要不要继续留在 gaps 里。
- 提示词放正文、日程放 frontmatter，对 Claude Desktop 这种「日程不在文件里」的平台，adapter 是否表达清楚。
- 时区强制为 IANA 字符串，能否接受。Codex 公开 issue 里 RRULE 的时区解释尚未稳定，所以共享模型不把「主机本地时区」当成默认值。
