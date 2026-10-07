import { z } from "zod";
import type { IngestRequest } from "./types.js";

export const ingestInputSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().max(50_000).default(""),
});

export function validateInput(input: unknown): IngestRequest {
  return ingestInputSchema.parse(input);
}
