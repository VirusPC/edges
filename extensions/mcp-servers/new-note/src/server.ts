import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import { loadConfig } from "./config.js";
import { runIngest } from "./service.js";
import { createAuthMiddleware, validateAuthConfig, type AuthenticatedRequest } from "./authMiddleware.js";

export async function startServer(transportType: 'stdio' | 'http' = 'stdio', port?: number): Promise<void> {
  const config = loadConfig();
  
  // Log server configuration
  console.error(`[new-note] Starting server in ${transportType} mode`);
  console.error(`[new-note] ------------------------------------------`);
  console.error(`[new-note] Configuration:`);
  console.error(`  - Repo path: ${config.repoPath}`);
  console.error(`  - Base branch: ${config.baseBranch}`);
  console.error(`  - Script path: ${config.scriptPath}`);
  
  // Log environment variables status
  console.error(`[new-note] ------------------------------------------`);
  console.error(`[new-note] Environment Variables:`);
  console.error(`  • EDGES_REPO_PATH:`);
  console.error(`    ${process.env.EDGES_REPO_PATH ? '✓ Set: ' + process.env.EDGES_REPO_PATH : '○ Default: ' + config.repoPath}`);
  console.error(`  • EDGES_BASE_BRANCH:`);
  console.error(`    ${process.env.EDGES_BASE_BRANCH ? '✓ Set: ' + process.env.EDGES_BASE_BRANCH : '○ Default: ' + config.baseBranch}`);
  console.error(`  • EDGES_NEW_NOTE_SCRIPT:`);
  console.error(`    ${process.env.EDGES_NEW_NOTE_SCRIPT ? '✓ Set: ' + process.env.EDGES_NEW_NOTE_SCRIPT : '○ Default: ' + config.scriptPath}`);
  
  if (transportType === 'http') {
    console.error(`  • EDGES_AUTH_TOKEN:`);
    console.error(`    ${process.env.EDGES_AUTH_TOKEN ? '✓ Set: ' + process.env.EDGES_AUTH_TOKEN.substring(0, 8) + '...' : '✗ Not set (recommended for HTTP)'}`);
  }
  console.error(`  • GITHUB_TOKEN:`);
  console.error(`    ${process.env.GITHUB_TOKEN ? '✓ Set: ' + process.env.GITHUB_TOKEN.substring(0, 8) + '... (PR creation enabled)' : '○ Not set (PR creation unavailable)'}`);
  
  // Validate auth configuration for HTTP mode
  if (transportType === 'http') {
    validateAuthConfig(config);
  }

  const server = new McpServer({
    name: "new-note",
    version: "0.1.0",
  });

  console.error(`[new-note] Registering MCP tool: new_note`);
  console.error(`  - Title: New Note Tool`);
  console.error(`  - Description: Create a new note in the edges repository and perform commit/push`);

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
    const httpPort = port || 3000;
    const baseUrl = `http://localhost:${httpPort}`;
    
    const app = express();
    app.use(express.json());
    
    // Add authorization middleware
    const authMiddleware = createAuthMiddleware(config);
    app.use(authMiddleware);
    
    // Health check endpoint (no auth required)
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
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
    
    app.listen(httpPort, () => {
      console.error(`\n[new-note] ==========================================`);
      console.error(`[new-note] 🚀 HTTP Server Started Successfully`);
      console.error(`[new-note] ==========================================`);
      console.error(`[new-note] Port: ${httpPort}`);
      console.error(`[new-note] Base URL: ${baseUrl}`);
      console.error(`[new-note] Authentication: ${config.authToken ? '✓ Enabled (Bearer token required)' : '✗ Disabled'}`);
      console.error(`[new-note] ------------------------------------------`);
      console.error(`[new-note] Available Endpoints:`);
      console.error(`[new-note]   • Health Check:`);
      console.error(`[new-note]     GET ${baseUrl}/health`);
      console.error(`[new-note]   • MCP Endpoint (Streamable HTTP):`);
      console.error(`[new-note]     POST ${baseUrl}/new-note`);
      console.error(`[new-note] ------------------------------------------`);
      console.error(`[new-note] Available Tools:`);
      console.error(`[new-note]   • new_note: Create a new note and commit/push`);
      console.error(`[new-note] ==========================================\n`);
    });
    
    await server.connect(transport);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[new-note] Server started successfully in stdio mode`);
  }
}
