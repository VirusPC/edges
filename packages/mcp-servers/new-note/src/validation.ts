import { z } from "zod";
import type { IngestRequest } from "./types.js";

export const ingestInputSchema = z.object({
  title: z.string().min(1).max(120).describe("Note title, 1–120 characters"),
  body: z.string().max(50_000).default("").describe("Note markdown body"),
  project: z.string().min(1).optional().describe("Existing Project path relative to .edges/projects, or to projects when super is true, such as P/projects/Q"),
  super: z.boolean().optional().describe("Use scope-relative materials. With project, resolve that Project under <scope>/projects; its materials stay in P/<module>"),
});

export function validateInput(input: unknown): IngestRequest {
  return ingestInputSchema.parse(input);
}
