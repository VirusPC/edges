import { TasksError } from "./types.js";

export type TaskRun = {
  runId: string;
  stem: string;
  n: number;
  agent: string;
  startedAt: string;
  endedAt: string;
  status: string;
  errorCode: string;
};

export type TaskRunNote = { at?: string; text: string; raw: string };

const NOTE_TS = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:[+-]\d{2}:\d{2}|Z)?)/;
const FULL_RUN_ID = /^(.*)--(\d+)$/;

function splitCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) {
    return [];
  }
  return trimmed
    .slice(1, trimmed.endsWith("|") ? -1 : undefined)
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparator(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell) || cell === "");
}

function headerIndex(headers: string[], ...names: string[]): number {
  const lowered = headers.map((h) => h.toLowerCase());
  for (const name of names) {
    const idx = lowered.indexOf(name);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function cell(cells: string[], index: number): string {
  if (index < 0) {
    return "";
  }
  return cells[index] ?? "";
}

export function parseRunLog(markdown: string, stem: string): { runs: TaskRun[]; notes: TaskRunNote[] } {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const runs: TaskRun[] = [];
  const notes: TaskRunNote[] = [];
  let headers: string[] | undefined;
  let inNotes = false;
  let implicitN = 0;

  for (const line of lines) {
    if (/^##\s+Notes\b/i.test(line.trim())) {
      inNotes = true;
      continue;
    }
    if (inNotes) {
      if (line.startsWith("#")) {
        inNotes = false;
      } else if (line.trim().startsWith("- ")) {
        const raw = line.trim().slice(2).trim();
        const match = raw.match(NOTE_TS);
        notes.push({
          at: match?.[1],
          text: raw,
          raw,
        });
        continue;
      }
    }

    const cells = splitCells(line);
    if (cells.length === 0) {
      continue;
    }
    if (!headers) {
      const lowered = cells.map((c) => c.toLowerCase());
      if (lowered.includes("started_at") || lowered.includes("#") || lowered.includes("run-id")) {
        headers = cells;
      }
      continue;
    }
    if (isSeparator(cells)) {
      continue;
    }
    implicitN += 1;
    const nCell = cell(cells, headerIndex(headers, "#"));
    const n = Number.parseInt(nCell, 10);
    const order = Number.isFinite(n) ? n : implicitN;
    const explicitId = cell(cells, headerIndex(headers, "run-id"));
    runs.push({
      runId: explicitId || `${stem}--${order}`,
      stem,
      n: order,
      agent: cell(cells, headerIndex(headers, "agent")),
      startedAt: cell(cells, headerIndex(headers, "started_at")),
      endedAt: cell(cells, headerIndex(headers, "ended_at")),
      status: cell(cells, headerIndex(headers, "status")),
      errorCode: cell(cells, headerIndex(headers, "error_code")),
    });
  }

  return { runs, notes };
}

export function resolveRunId(
  runId: string,
  taskStem?: string,
): { stem: string; n: number; runId: string } {
  if (/^\d+$/.test(runId)) {
    if (!taskStem) {
      throw new TasksError("VALIDATION_ERROR", "short run-id requires --task <stem>");
    }
    return { stem: taskStem, n: Number(runId), runId: `${taskStem}--${runId}` };
  }
  const match = runId.match(FULL_RUN_ID);
  if (!match) {
    throw new TasksError("VALIDATION_ERROR", `invalid run-id: ${runId}`);
  }
  return { stem: match[1] ?? "", n: Number(match[2]), runId };
}

function parseTs(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

function coveringRun(runs: TaskRun[], at?: string): TaskRun | undefined {
  if (runs.length === 0) {
    return undefined;
  }
  if (!at) {
    return runs[runs.length - 1];
  }
  const ts = parseTs(at);
  if (ts === undefined) {
    return runs[runs.length - 1];
  }
  let chosen: TaskRun | undefined;
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (!run) {
      continue;
    }
    const start = parseTs(run.startedAt);
    const nextStart = parseTs(runs[i + 1]?.startedAt);
    if (start !== undefined && ts < start) {
      continue;
    }
    if (nextStart !== undefined && ts >= nextStart) {
      continue;
    }
    chosen = run;
  }
  return chosen ?? runs[runs.length - 1];
}

export function messagesForRun(
  parsed: { runs: TaskRun[]; notes: TaskRunNote[] },
  runId: string,
): Array<{ seq: number; at?: string; text: string }> {
  const run = parsed.runs.find((item) => item.runId === runId);
  if (!run) {
    throw new TasksError("RUN_NOT_FOUND", `run not found: ${runId}`);
  }
  if (parsed.runs.length === 0) {
    throw new TasksError("RUN_NOT_FOUND", `run not found: ${runId}`);
  }
  const messages: Array<{ seq: number; at?: string; text: string }> = [];
  for (const note of parsed.notes) {
    const owner = coveringRun(parsed.runs, note.at);
    if (owner?.runId !== run.runId) {
      continue;
    }
    messages.push({ seq: messages.length + 1, at: note.at, text: note.text });
  }
  return messages;
}
