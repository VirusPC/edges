import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { runIngest } from "./service.js";

export async function startServer(): Promise<void> {
  const config = loadConfig();

  const server = new McpServer({
    name: "edges-mcp-ingest",
    version: "0.1.0",
  });

  server.registerTool("new_note", {
    title: "New Note Tool",
    description: "Create a new note in the edges repository and perform commit/push",
    inputSchema: {
      title: z.string().describe("Note title"),
      content: z.string().describe("Note content"),
      coAuthor: z.string().describe("Co-author for git commit"),
    },
  }, async ({ title, content, coAuthor }) => {
      try {
        const result = await runIngest({ title, content, coAuthor }, config);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "invalid request";
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { status: "failed", errorCode: "VALIDATION_ERROR", reason: message },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
