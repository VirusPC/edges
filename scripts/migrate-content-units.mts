#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  planContentUnits,
  applyContentUnits,
} from "../extensions/cli/scripts/content-directory-migration.js";
const { values } = parseArgs({
  options: {
    root: { type: "string" },
    apply: { type: "boolean" },
    "copy-shared": { type: "boolean" },
    "archive-unreferenced": { type: "boolean" },
    report: { type: "string" },
  },
});
if (!values.root)
  throw new Error("Explicit --root required; preview by default");
const plan = planContentUnits(values.root, {
  shared: values["copy-shared"] ? "copy" : "retain",
  unreferenced: values["archive-unreferenced"] ? "archive" : "retain",
});
const report = {
  mode: values.apply ? "apply" : "preview",
  documentMoves: plan.documentMoves,
  assetDestinations: plan.assetMoves,
  edits: plan.writes.filter((w) => w.from === w.to).length,
  retained: plan.retained,
  unresolved: plan.unresolved,
  mapping: [...plan.mapping].filter(
    ([from, to]) => to.length !== 1 || to[0] !== from,
  ),
};
if (values.report && fs.existsSync(path.resolve(values.report)))
  throw new Error("Report already exists");
if (values.apply) applyContentUnits(plan);
if (values.report) {
  const file = path.resolve(values.report);
  if (fs.existsSync(file)) throw new Error("Report already exists");
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + "\n", {
    flag: "wx",
  });
}
console.log(
  JSON.stringify(
    {
      ...report,
      mapping: report.mapping.length,
      retained: report.retained.length,
      unresolved: report.unresolved.length,
    },
    null,
    2,
  ),
);
