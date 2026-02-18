import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { runIngest } from "./service.js";
import { validateInput } from "./validation.js";

export async function startServer(): Promise<void> {
  const config = loadConfig();

  const server = new Server(
    {
      name: "edges-mcp-ingest",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "ingest_summary",
        description: "Ingest a summary into the edges repository and perform commit/push",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            coAuthor: { type: "string" },
          },
          required: ["title", "content", "coAuthor"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "ingest_summary") {
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "failed", errorCode: "UNKNOWN_ERROR", reason: "Unknown tool" }) }],
        isError: true,
      };
    }

    try {
      const input = validateInput(request.params.arguments ?? {});
      const result = await runIngest(input, config);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: result.status === "failed",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid request";
      return {
        content: [{ type: "text", text: JSON.stringify({ status: "failed", errorCode: "VALIDATION_ERROR", reason: message }) }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
