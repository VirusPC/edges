import { z } from "zod";
import type { IngestRequest } from "./types.js";

export const ingestInputSchema = z.object({
  title: z.string().min(1).max(120).describe("Note title, 1–120 characters"),
  body: z.string().max(50_000).default("").describe("Note markdown body"),
  project: z.string().min(1).optional().describe("Existing Project path relative to the server scope's .edges/projects, such as P/projects/Q"),
  super: z.boolean().optional().describe("Use scope-relative materials instead of .edges; project takes precedence"),
});

export function validateInput(input: unknown): IngestRequest {
  return ingestInputSchema.parse(input);
}
