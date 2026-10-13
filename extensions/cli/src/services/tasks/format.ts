import type { TaskRun } from "./runlog.js";

export function formatRunsTable(runs: TaskRun[]): string {
  const header = ["run-id", "agent", "status", "started_at", "ended_at"];
  const rows = runs.map((run) => [run.runId, run.agent, run.status, run.startedAt, run.endedAt]);
  const widths = header.map((col, i) => Math.max(col.length, ...rows.map((row) => (row[i] ?? "").length), 0));
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ");
  return `${[line(header), ...rows.map(line)].join("\n")}\n`;
}

export function formatRunMessagesTable(
  run: TaskRun,
  messages: Array<{ seq: number; at?: string; text: string }>,
): string {
  const summary = `${run.runId} ${run.status} ${run.agent} ${run.startedAt}`.trim();
  const lines = [summary];
  for (const message of messages) {
    const stamp = message.at ? `${message.at} ` : "";
    lines.push(`${message.seq}. ${stamp}${message.text}`);
  }
  return `${lines.join("\n")}\n`;
}
