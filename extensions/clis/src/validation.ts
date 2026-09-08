import { z } from "zod";
import type { IngestRequest } from "./types.js";

export const ingestInputSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(50_000),
  coAuthor: z.string().min(3).max(200),
});

export function validateInput(input: unknown): IngestRequest {
  return ingestInputSchema.parse(input);
}

export function formatZodReason(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`).join("; ");
}
