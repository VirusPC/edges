# Issue priority: word labels (`urgent|high|medium|low|none`) vs `P0/P1/P2/P3`

Research date: 2026-09-15 (Asia/Shanghai). Primary-source pass for VirusPC/edges / peng cheng.

---

## 1. Direct answer（短）

主流产品 issue tracker（Linear、GitHub Issue Fields、Jira 默认、Asana 示例、Multica）用的是**自然语言档位**（Urgent/High/Medium/Low ± None），不是工程圈常见的 **P0–P3**。P0 文化主要来自 **SRE/on-call、事故严重度、云厂商支持工单 SLA**——表示「要不要立刻放下一切去救火 / 几分钟内响应」，和看板里「相对谁先做」不是同一套语义。Multica 代码与文档固定为 `urgent|high|medium|low|none`；**仓库内未找到解释「为何用词而不是 P0」的 ADR/设计说明**。

---

## 2. Evidence table

| Product | Priority vocabulary (as shipped / documented) | Source |
| --- | --- | --- |
| **Multica** | Wire/API: `urgent`, `high`, `medium`, `low`, `none`. UI: Urgent / High / Medium / Low / No priority（中文：紧急/高/中/低/无优先级） | Type: [`packages/core/types/issue.ts`](https://github.com/multica-ai/multica/blob/main/packages/core/types/issue.ts) (`IssuePriority`); config: [`packages/core/issues/config/priority.ts`](https://github.com/multica-ai/multica/blob/main/packages/core/issues/config/priority.ts); DB: [`server/migrations/001_init.up.sql`](https://github.com/multica-ai/multica/blob/main/server/migrations/001_init.up.sql) `CHECK (priority IN (...))`; projects docs: [multica.ai/docs/projects](https://multica.ai/docs/projects); CLI: [multica.ai/docs/cli](https://multica.ai/docs/cli) (`--priority` on `issue create`/`list`) |
| **Linear** | No priority, Low, Medium, High, Urgent. API numeric: `0` none, `1` urgent, `2` high, `3` medium, `4` low. **No custom priority levels** (by product policy) | [linear.app/docs/priority](https://linear.app/docs/priority); create URL: [developers/create-issues-using-linear-new](https://linear.app/developers/create-issues-using-linear-new); filter examples: [developers/filtering](https://linear.app/developers/filtering) |
| **Jira (Cloud defaults)** | **Highest, High, Medium, Low, Lowest** (customizable via priority schemes) | [Configure priorities for spaces](https://support.atlassian.com/jira-cloud-administration/docs/configure-priorities-for-projects/); meanings: [What are work item statuses, priorities, and resolutions?](https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-statuses-priorities-and-resolutions/); JSM same defaults: [What are priority levels in JSM?](https://support.atlassian.com/jira-service-management-cloud/docs/what-are-priority-levels-in-jira-service-management/) |
| **GitHub Issues** | Historically: **labels** (no built-in priority). Now (GA 2026-07): org **Issue fields** default **Priority** single-select: **Urgent, High, Medium, Low** (customizable). Docs explicitly contrast fields vs labels | Docs: [Managing issue fields](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-fields-in-your-organization); Changelog: [Issue fields GA](https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available/) |
| **Asana** | No dedicated system “P0” field. Official API guide example: enum **Priority** with **Low / Medium / High** (+ unset/`null`). Help Center recipes use Low/Medium/High custom field | [developers.asana.com custom-fields-guide](https://developers.asana.com/docs/custom-fields-guide) (example use case); [Schedule tasks based on priority](https://help.asana.com/s/article/schedule-tasks-based-on-priority) |
| **Height** | Product treats **priority** as a first-class / selectable task attribute; first-party automation copy uses values **High** and **Urgent**. OpenAPI-style field templates describe `select` “used for priority…” (exact default option set not fully enumerated in public help we fetched) | [height.app/product/automations](https://height.app/product/automations) (example: “priority … High”); Height blog 0.118 (automation: priority set to `Urgent`) — first-party product blog; [height.app/product](https://height.app/product) (custom attributes incl. priority) |
| **Google SRE (bug / planning)** | **P0** = “highest priority of bug: all hands on deck; drop everything else until this is fixed” (error-budget policy example) | [sre.google/workbook/error-budget-policy](https://sre.google/workbook/error-budget-policy/) footnote 1 |
| **Google SRE Workbook (on-call example)** | Alert categories **P1 / P2 / P3** (immediate / next business day / informational); incidents separately **Sev 1–3** | [sre.google/workbook/on-call](https://sre.google/workbook/on-call/) (Evernote example section) |
| **Google Cloud Support (TSSG)** | Support request **Priority P0–P4** tied to **target initial response times** (contractual SLA language), not product backlog ranking | [cloud.google.com/terms/tssg](https://cloud.google.com/terms/tssg) §§13.13–13.18 and response-time tables |

---

## 3. Multica: code/docs; is there a written “why”?

### What the code and docs say

- **Type enum (canonical):** `export type IssuePriority = "urgent" | "high" | "medium" | "low" | "none"` in `packages/core/types/issue.ts`.
- **Sort vs display:** `PRIORITY_ORDER` = urgent→high→medium→low→none (sort rank; **none last**). `PRIORITY_DISPLAY_ORDER` = none first, then severity descending — comment explains picker UX (“empty value first”), **not** why words beat P-numbers ([`priority.ts`](https://github.com/multica-ai/multica/blob/main/packages/core/issues/config/priority.ts)).
- **DB constraint:** `issue.priority` and `project.priority` CHECK `IN ('urgent','high','medium','low','none')` from `001_init.up.sql` / `035_project_priority.up.sql`.
- **Product docs:** Issues page mentions “Status and priority” as “what to handle first” but does **not** enumerate the five values on [multica.ai/docs/issues](https://multica.ai/docs/issues). Projects docs **do** list `urgent|high|medium|low|none` ([multica.ai/docs/projects](https://multica.ai/docs/projects)). CLI documents `--priority` on create/list ([multica.ai/docs/cli](https://multica.ai/docs/cli)) without spelling the enum on that page (values come from API/DB/UI).
- **i18n:** English Urgent/High/…; zh-Hans 紧急/高/中/低/无优先级 (`packages/views/locales/.../issues.json`).

### Written rationale for words vs P0?

**No.** Searched Multica `main` for ADR/design notes around priority vocabulary (`VISION.md`, `apps/docs`, `packages/core/issues/config/priority.ts`, mobile ADR tree). The only nearby ADR found is unrelated (`apps/mobile/docs/markdown-rendering-adr.md`). Comments in `priority.ts` explain **sort rank** and **picker empty-first convention**, not why the product chose word labels over `P0/P1/...`.

Shape is **Linear-compatible** (same five levels including Urgent + No priority), but Multica does **not** cite Linear in the priority config.

---

## 4. Word labels vs P0: tradeoffs grounded in sources

| Dimension | Word labels (tracker default) | P0–P3 (ops / support culture) | Grounding |
| --- | --- | --- | --- |
| **Primary job** | Relative ordering of product/engineering work (“which issues to complete first”) | Urgency of **response / mitigation** under pager or vendor SLA | Linear overview ([docs/priority](https://linear.app/docs/priority)); Google Cloud Priority definitions ([TSSG](https://cloud.google.com/terms/tssg)); SRE P0 footnote ([error-budget-policy](https://sre.google/workbook/error-budget-policy/)) |
| **Cardinality / customization** | Small fixed set preferred; Linear **refuses** custom priorities: “easy to get carried away with specificity… diminishing returns” | Often fixed org playbooks; support P0–P4 are **contract** levels | Linear [docs/priority](https://linear.app/docs/priority); Jira allows admin customization of names ([configure priorities](https://support.atlassian.com/jira-cloud-administration/docs/configure-priorities-for-projects/)) |
| **Empty / unset** | First-class **No priority / none** (Linear, Multica, GitHub options omit “none” as named option but field can be unset) | P-levels usually **assigned** when opening an incident/case; “none” is rare | Linear; Multica `DEFAULT 'none'`; GitHub default options list Urgent–Low without a “None” option |
| **Audience** | PM + eng + agents reading a board | On-call, incident commander, support desk | SRE workbook on-call vs product docs above |
| **Coupling to side effects** | Linear: **Urgent** triggers assignee notification / urgent email | P1 pages; P0 may mean 5-minute vendor response (MCS) | Linear Urgent Notifications; TSSG P0/P1 tables |
| **Severity vs priority** | Product trackers usually fold “importance” into one field | Ops often **split** alert priority (P1–P3) from incident **severity** (Sev 1–3) | Evernote example in [SRE workbook on-call](https://sre.google/workbook/on-call/) |
| **Interop** | Words localize cleanly (Multica zh-Hans); GitHub moved from free-form **labels** to structured word options | P-numbers are language-agnostic but **ambiguous across orgs** (P0≠same SLA everywhere) | Multica locales; GitHub fields vs labels note; TSSG vs SRE footnote both use “P0” differently |

**Bottom line from primaries:** trackers optimize for **human-readable backlog triage with few buckets**; P0 culture optimizes for **time-bound operational response**. Same glyph “P0” is overloaded (Google SRE bug priority ≠ Google Cloud support P0).

---

## 5. Implication for edges tasks CLI (Multica-aligned words vs P0)

If edges’ tasks CLI creates/updates Multica issues (or mirrors Multica’s enum), **prefer `urgent|high|medium|low|none` (or UI synonyms)** so values pass Multica’s DB CHECK and match Linear/GitHub defaults without a translation layer. Reserve **P0–P3** for incident/on-call surfaces—or map explicitly (e.g. document `P0→urgent`) if humans paste SRE language—because Multica will **reject** bare `P0` as a priority string under the current CHECK constraint, and no Multica ADR defines a P-number alias.

---

## 6. Sources

### Multica (primary)

- https://github.com/multica-ai/multica/blob/main/packages/core/types/issue.ts
- https://github.com/multica-ai/multica/blob/main/packages/core/issues/config/priority.ts
- https://github.com/multica-ai/multica/blob/main/packages/core/types/project.ts
- https://github.com/multica-ai/multica/blob/main/packages/core/projects/config.ts
- https://github.com/multica-ai/multica/blob/main/server/migrations/001_init.up.sql
- https://github.com/multica-ai/multica/blob/main/server/migrations/035_project_priority.up.sql
- https://github.com/multica-ai/multica/blob/main/apps/docs/content/docs/projects.mdx
- https://github.com/multica-ai/multica/blob/main/apps/docs/content/docs/cli.mdx
- https://multica.ai/docs/projects
- https://multica.ai/docs/issues
- https://multica.ai/docs/cli

### Linear (primary)

- https://linear.app/docs/priority
- https://linear.app/developers/create-issues-using-linear-new
- https://linear.app/developers/filtering

### Jira / Atlassian (primary)

- https://support.atlassian.com/jira-cloud-administration/docs/configure-priorities-for-projects/
- https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-statuses-priorities-and-resolutions/
- https://support.atlassian.com/jira-cloud-administration/docs/manage-priority-schemes/
- https://support.atlassian.com/jira-service-management-cloud/docs/what-are-priority-levels-in-jira-service-management/

### GitHub (primary)

- https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-fields-in-your-organization
- https://github.blog/changelog/2026-07-02-issue-fields-are-now-generally-available/

### Asana (primary)

- https://developers.asana.com/docs/custom-fields-guide
- https://help.asana.com/s/article/schedule-tasks-based-on-priority

### Height (primary / first-party product)

- https://height.app/product
- https://height.app/product/automations
- Height product blog post 0.118 (automation example with priority `Urgent`) — first-party; public fetch of that URL was intermittently failing at research time

### SRE / support P-culture (primary)

- https://sre.google/workbook/error-budget-policy/
- https://sre.google/workbook/on-call/
- https://cloud.google.com/terms/tssg

### Explicitly not relied on as authority

- SEO roundups / third-party “Height cheat sheets” (e.g. 1337skills) — if referenced elsewhere, treat as **secondary**.
