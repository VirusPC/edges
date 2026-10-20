# 命令适配地基 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 退出码与失败 JSON 由命令层的一个函数产生，Service 不再引用 `CliContext` 或 `utils/exit.ts`。

**Architecture:** `commands/exit.ts` 把错误码映射成 0/2/4/1。`commands/result.ts` 组装 `{ status, errorCode, reason }` 与 stderr 提示。`services/config.ts` 拥有 `loadConfig`。`services/tasks/result.ts` 只保留用 `env` 打开看板的运行时，不再写进程输出。

**Tech Stack:** Node 22、`node:test`、tsx、现有 Commander。不新增依赖。

**Spec:** `docs/superpowers/specs/2026-10-06-commands-service-decoupling-research.md`，以及 ADR 0026、0027、0028 里已经锁定的契约。本计划只做地基。审阅页编排、Artifacts server 搬迁、列表分组、叶子 CRUD、草稿发布另开计划。

## Global Constraints

- 退出码：0 成功；2 是 `VALIDATION_ERROR` 或用法错误；4 是错误码以 `AUTH_` 开头；其余为 1。
- 失败 JSON：`{ status: "failed", errorCode, reason }` 加换行，写 stdout。给人看的短句写 stderr。
- 成功 JSON：`{ status: "success", ... }` 加换行。
- Service 不 import `CliContext`、`CliResult`、Commander。
- `utils/` 不 import `services/`。
- 不引入 sysexits 或 JSON 规范化库。

---

### Task 1: 错误码到退出码

**Files:**
- Create: `extensions/cli/src/commands/exit.ts`
- Test: `extensions/cli/test/commands/exit.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `exitCodeForErrorCode(errorCode: string): number`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { exitCodeForErrorCode } from "../../src/commands/exit.js";

test("exit codes follow validation, auth, and other", () => {
  assert.equal(exitCodeForErrorCode("VALIDATION_ERROR"), 2);
  assert.equal(exitCodeForErrorCode("AUTH_MISSING"), 4);
  assert.equal(exitCodeForErrorCode("AUTH_INVALID_TOKEN"), 4);
  assert.equal(exitCodeForErrorCode("TASK_NOT_FOUND"), 1);
  assert.equal(exitCodeForErrorCode("UNKNOWN_ERROR"), 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/commands/exit.test.ts'`
Expected: FAIL，找不到 `commands/exit.js`

- [ ] **Step 3: Write minimal implementation**

```ts
export function exitCodeForErrorCode(errorCode: string): number {
  if (errorCode === "VALIDATION_ERROR") return 2;
  if (errorCode.startsWith("AUTH_")) return 4;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/commands/exit.test.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/commands/exit.ts extensions/cli/test/commands/exit.test.ts
git commit -m "$(cat <<'EOF'
feat: map domain error codes to process exit codes

EOF
)"
```

### Task 2: 命令结果与用法错误

**Files:**
- Create: `extensions/cli/src/commands/result.ts`
- Test: `extensions/cli/test/commands/result.test.ts`
- Modify: `extensions/cli/src/context.ts`

**Interfaces:**
- Consumes: `exitCodeForErrorCode`；`CliResult` from `context.ts`
- Produces:
  - `fail(errorCode: string, reason: string, stderrHint: string): CliResult`
  - `succeed(payload: Record<string, unknown>, stderr?: string): CliResult`
  - `usageErrorCode(commandCode: string): "VALIDATION_ERROR" | null` — Commander 的 `commander.unknownOption`、`commander.missingArgument`、`commander.invalidArgument`、`commander.excessArguments`、`commander.missingMandatoryOptionValue` 返回 `"VALIDATION_ERROR"`，其他返回 `null`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { fail, succeed, usageErrorCode } from "../../src/commands/result.js";

test("fail writes status JSON on stdout and the hint on stderr", () => {
  const result = fail("VALIDATION_ERROR", "missing title", "See edges tasks --help\n");
  assert.equal(result.exitCode, 2);
  assert.equal(result.stderr, "See edges tasks --help\n");
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "failed",
    errorCode: "VALIDATION_ERROR",
    reason: "missing title",
  });
});

test("succeed writes status success", () => {
  const result = succeed({ command: "get", task: { stem: "a" } });
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "success",
    command: "get",
    task: { stem: "a" },
  });
});

test("commander usage codes are validation errors", () => {
  assert.equal(usageErrorCode("commander.invalidArgument"), "VALIDATION_ERROR");
  assert.equal(usageErrorCode("commander.unknownCommand"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/commands/result.test.ts'`
Expected: FAIL，找不到模块

- [ ] **Step 3: Write minimal implementation**

`commands/result.ts`：

```ts
import type { CliResult } from "../context.js";
import { exitCodeForErrorCode } from "./exit.js";

const USAGE_CODES = new Set([
  "commander.unknownOption",
  "commander.missingArgument",
  "commander.invalidArgument",
  "commander.excessArguments",
  "commander.missingMandatoryOptionValue",
]);

export function usageErrorCode(commandCode: string): "VALIDATION_ERROR" | null {
  return USAGE_CODES.has(commandCode) ? "VALIDATION_ERROR" : null;
}

export function fail(errorCode: string, reason: string, stderrHint: string): CliResult {
  return {
    exitCode: exitCodeForErrorCode(errorCode),
    stdout: `${JSON.stringify({ status: "failed", errorCode, reason })}\n`,
    stderr: stderrHint,
  };
}

export function succeed(payload: Record<string, unknown>, stderr = ""): CliResult {
  return {
    exitCode: 0,
    stdout: `${JSON.stringify({ status: "success", ...payload })}\n`,
    stderr,
  };
}
```

`context.ts` 的 `usageError` 改为调用 `fail("VALIDATION_ERROR", reason, usageHint)`，避免第二份退出码表。schema 的 stdout 为空、只写 stderr 的现有行为保留在 `usageError` 的 schema 分支里，退出码仍为 2。

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/commands/result.test.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/commands/result.ts extensions/cli/src/commands/exit.ts extensions/cli/src/context.ts extensions/cli/test/commands/result.test.ts
git commit -m "$(cat <<'EOF'
feat: build CLI results in the command layer

EOF
)"
```

### Task 3: `loadConfig` 进入 Service

**Files:**
- Create: `extensions/cli/src/services/config.ts`
- Modify: `extensions/cli/src/utils/config.ts`
- Modify: `extensions/cli/test/utils/config.test.ts`
- Modify: callers of `loadConfig` (`services/tasks/result.ts`, `commands/note.ts`, `services/note/types.ts`)

**Interfaces:**
- Consumes: `resolveScope`、`gitRoot` from `services/scope.ts`；`resolveEdgesRoot` 仍留在 `utils/config.ts`
- Produces: `loadConfig(env?: NodeJS.ProcessEnv): RuntimeConfig` from `services/config.ts`。`RuntimeConfig` 字段与今天的 `utils/config.ts` 相同。

- [ ] **Step 1: Write the failing test**

把 `test/utils/config.test.ts` 的 import 改成 `../../src/services/config.js`。先不改实现，运行应失败。

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/utils/config.test.ts'`
Expected: FAIL，找不到 `services/config.js`

- [ ] **Step 3: Write minimal implementation**

把 `loadConfig` 与 `RuntimeConfig` 从 `utils/config.ts` 剪到 `services/config.ts`。`utils/config.ts` 只保留 `resolveEdgesRoot`。全仓库把 `loadConfig` / `RuntimeConfig` 的 import 改到 `services/config.js`。确认 `utils/` 下不再出现 `from "../services/` 或 `from "../../services/`。

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/utils/config.test.ts'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/services/config.ts extensions/cli/src/utils/config.ts extensions/cli/test/utils/config.test.ts extensions/cli/src/services/tasks/result.ts extensions/cli/src/commands/note.ts extensions/cli/src/services/note/types.ts
git commit -m "$(cat <<'EOF'
refactor: load runtime config from the service layer

EOF
)"
```

### Task 4: Tasks 运行时不再接收 CliContext

**Files:**
- Modify: `extensions/cli/src/services/tasks/result.ts`
- Create: `extensions/cli/src/commands/tasks/run.ts`
- Modify: 每个调用 `runTasksCommand` / `succeed` / `fail` 的 `commands/tasks/**` 文件
- Test: 现有 `extensions/cli/test/tasks/*.test.ts` 保持通过

**Interfaces:**
- Consumes: `loadConfig`；`fail` / `succeed` from `commands/result.ts`
- Produces:
  - `openTasksRuntime(input: { env: NodeJS.ProcessEnv; purpose?: "domain" | "maintenance"; indexGroup?: "local" | "descendant" })` 返回今天 `tasksRuntime` 的 `{ location, fs, now, writer }`
  - `runTasksCommand(ctx, fn)` 改由 `commands/tasks/run.ts` 导出。它调用 `openTasksRuntime`，捕获带 `errorCode` 字符串的错误，用 `fail` 写入 `ctx.result`。stderr 提示保持 `See edges tasks --help for usage.\n`

- [ ] **Step 1: Write the failing test**

在 `extensions/cli/test/services/tasks-runtime.test.ts`：

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openTasksRuntime } from "../../src/services/tasks/result.js";

test("tasks service result module does not mention CliContext", () => {
  const source = readFileSync(new URL("../../src/services/tasks/result.ts", import.meta.url), "utf8");
  assert.equal(source.includes("CliContext"), false);
  assert.equal(source.includes("CliResult"), false);
});

test("openTasksRuntime accepts env without a command context", () => {
  const runtime = openTasksRuntime({
    env: { EDGES_REPO: "/tmp/edges-fixture", EDGES_SCOPE: "/tmp/edges-fixture" },
    purpose: "domain",
  });
  assert.equal(typeof runtime.now, "object");
  assert.ok(runtime.location);
});
```

若 `/tmp/edges-fixture` 不是合法 scope，把断言改成捕获 `ScopeResolutionError` 且其 `errorCode === "VALIDATION_ERROR"`。不要为了这个测试去构造 `CliContext`。

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/services/tasks-runtime.test.ts'`
Expected: FAIL，`openTasksRuntime` 不存在或源码仍包含 `CliContext`

- [ ] **Step 3: Write minimal implementation**

`services/tasks/result.ts` 删除 `runTasksCommand`、`fail`、`succeed`、`CliResult`。`tasksRuntime(ctx)` 改名为 `openTasksRuntime`，参数是上面的 input，内部仍 `loadConfig(input.env)`。`asTasksError` 留在 service，供命令层使用，它只认识 `TasksError`，不认识 `CliResult`。

`commands/tasks/run.ts` 实现 `runTasksCommand`。各 task 命令改为从这里 import `runTasksCommand`、`succeed`、`fail`。`succeed` / `fail` 来自 `commands/result.ts`。tasks 的 `fail` 包装成：

```ts
export function failTask(errorCode: string, reason: string) {
  return fail(errorCode, reason, "See edges tasks --help for usage.\n");
}
```

现有调用 `fail(...)` 的任务命令改为 `failTask`。

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter edges-cli exec node --test --import tsx './test/services/tasks-runtime.test.ts' './test/tasks/**/*.test.ts'`
Expected: PASS。tasks 集成测试的 stdout 仍是 `{ status: "success" | "failed", ... }`，校验错误退出码仍为 2。

- [ ] **Step 5: Commit**

```bash
git add extensions/cli/src/services/tasks/result.ts extensions/cli/src/commands/tasks extensions/cli/test/services/tasks-runtime.test.ts
git commit -m "$(cat <<'EOF'
refactor: open the task board without a CLI context

EOF
)"
```

## 本计划不做

- 不改 `list --group-by` 的输出形状。
- 不新增 `tasks delete`、`note create` 或 Memory / Skill 动词。
- 不改 artifacts-preview 的 HTTP。
- 不把 `commands/artifacts/server/ops.ts` 搬进 `services/`。

这些各自一份计划，每份都能单独测试。
