import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { loadConfig } from "./config.js";
import { runIngest } from "./service.js";

export async function startServer(transportType: 'stdio' | 'http' = 'stdio', port?: number): Promise<void> {
  const config = loadConfig();

  const server = new McpServer({
    name: "new-note",
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

  if (transportType === 'http') {
    const app = express();
    app.use(express.json());
    
    // Set up Streamable HTTP transport with single endpoint
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    
    // Mount the transport at /new-note endpoint
    app.use('/new-note', async (req, res, next) => {
      try {
        await transport.handleRequest(req, res);
      } catch (error) {
        next(error);
      }
    });
    
    const httpPort = port || 3000;
    app.listen(httpPort, () => {
      console.log(`MCP server listening on http://localhost:${httpPort}`);
      console.log(`Streamable HTTP endpoint: http://localhost:${httpPort}/new-note`);
    });
    
    await server.connect(transport);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}
