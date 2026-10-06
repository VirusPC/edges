#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  planTaskIndexes,
  applyTaskIndexes,
} from "../extensions/cli/src/services/tasks/index-migration.js";
const { values } = parseArgs({
  options: {
    root: { type: "string" },
    apply: { type: "boolean" },
    report: { type: "string" },
  },
});
if (!values.root)
  throw new Error("Explicit --root required; preview by default");
const reportPath = values.report ? path.resolve(values.report) : undefined;
if (reportPath && fs.existsSync(reportPath))
  throw new Error(`Report already exists: ${reportPath}`);
const plan = await planTaskIndexes(values.root);
if (values.apply) await applyTaskIndexes(plan);
const report = {
  mode: values.apply ? "apply" : "preview",
  root: plan.root,
  tasks: plan.tasks.map((source) => ({ source, destination: source })),
  edits: plan.edits,
  validation: {
    tasks: plan.tasks.length,
    edits: plan.edits.length,
    privateContent: "excluded",
    sourceSnapshots: "all discovered public task entries and AGENTS indexes",
    applied: !!values.apply,
  },
};
if (reportPath)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", {
    flag: "wx",
  });
console.log(
  JSON.stringify(
    {
      ...report,
      tasks: report.tasks.length,
      edits: report.edits.map((edit) => edit.path),
    },
    null,
    2,
  ),
);
