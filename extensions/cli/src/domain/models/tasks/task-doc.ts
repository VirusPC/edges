import { parseTaskDoc, type ParsedTaskDoc } from "./frontmatter.js";

import type { TaskDoc } from "./task-doc-contract.js";
export type { TaskDoc, TaskMetadata, TaskJsonValue } from "./task-doc-contract.js";

/** Preserve the Markdown parser's existing scalar metadata policy. */
type ScalarTaskDoc = TaskDoc & { metadata: Record<string, string> };

export function taskDocFromParsed(doc: ParsedTaskDoc): ScalarTaskDoc {
  return {
    name: doc.name,
    description: doc.description,
    metadata: { ...doc.metadata },
    body: doc.body,
  };
}

export function taskDocFromMarkdown(markdown: string): ScalarTaskDoc {
  return taskDocFromParsed(parseTaskDoc(markdown));
}
