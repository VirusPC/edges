import { parseTaskDoc, type ParsedTaskDoc } from "./frontmatter.js";

export type TaskDoc = {
  name: string;
  description: string;
  metadata: Record<string, string>;
  body: string;
};

export function taskDocFromParsed(doc: ParsedTaskDoc): TaskDoc {
  return {
    name: doc.name,
    description: doc.description,
    metadata: { ...doc.metadata },
    body: doc.body,
  };
}

export function taskDocFromMarkdown(markdown: string): TaskDoc {
  return taskDocFromParsed(parseTaskDoc(markdown));
}
