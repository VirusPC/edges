import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.js";
import { runIngest } from "./service.js";
import { createAuthMiddleware, validateAuthConfig, type AuthenticatedRequest } from "./authMiddleware.js";

// Create MCP server instance with tools and prompts registered
function createMcpServer(config: ReturnType<typeof loadConfig>) {
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
      content: z.string().describe("笔记内容。应包含以下结构化内容：\n\n【讨论主题】\n简洁描述本次对话的背景和核心议题\n\n【主要结论】\n(事实与共识)\n提取对话中达成的共识、定论或发现的关键事实\n\n【认知更新】\n(洞察与 Edge 雏形)\n识别对话中产生的关键洞察、逻辑转变或可复用的 Edge（判断优势）\n\n【行动指南】\n(决策与后续动作)\n列出明确的具体决策、后续行动项或实验计划\n\n【补充说明】\n(其他重要细节或备注)\n记录不属于上述分类但重要的琐碎信息、背景补充或相关参考"),
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

  console.error(`[new-note] Registering MCP prompt: conversation-to-notes`);
  server.registerPrompt("conversation-to-notes", 
    {
      description: "Summarize a conversation into a structured note for the Edges system",
      argsSchema: {
        transcript: z.string().optional().describe("The raw conversation transcript to summarize"),
      }
    }, 
    async ({ transcript }) => {
      try {
        const skillFile = path.join(config.skillsPath, "conversation-to-notes/SKILL.md");
        const skillContent = await fs.readFile(skillFile, "utf-8");
        
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `${skillContent}\n\n${transcript ? `HERE IS THE TRANSCRIPT TO SUMMARIZE:\n\n${transcript}` : "Please summarize our current conversation following the instructions above."}`,
              },
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to load skill template: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  return server;
}

export async function startServer(transportType: 'stdio' | 'http' = 'stdio', port?: number): Promise<void> {
  const config = loadConfig();
  
  // Log server configuration
  console.error(`[new-note] Starting server in ${transportType} mode`);
  console.error(`[new-note] ------------------------------------------`);
  console.error(`[new-note] Configuration:`);
  console.error(`  - Repo path: ${config.repoPath}`);
  console.error(`  - Base branch: ${config.baseBranch}`);
  console.error(`  - Mode: ${config.mode.toUpperCase()}${config.mode === 'pr' ? ' (Create branch + PR)' : ' (Direct commit to base)'}`);
  console.error(`  - Script path: ${config.scriptPath}`);
  
  // Log environment variables status
  console.error(`[new-note] ------------------------------------------`);
  console.error(`[new-note] Environment Variables:`);
  
  if (transportType === 'http') {
    console.error(`  • EDGES_AUTH_TOKEN: ${process.env.EDGES_AUTH_TOKEN ? '✓ Set' : '✗ Not set'}`);
  }
  console.error(`  • GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✓ Set (PR enabled)' : '○ Not set (PR disabled)'}`);
  
  // Validate auth configuration for HTTP mode
  if (transportType === 'http') {
    validateAuthConfig(config);
  }

  if (transportType === 'http') {
    const httpPort = port || 3000;
    const baseUrl = `http://localhost:${httpPort}`;
    const MCP_PATH = "/new-note";
    
    const app = express();
    
    // Configure CORS
    app.use(cors({ 
      origin: '*', 
      exposedHeaders: ['mcp-session-id', 'Mcp-Session-Id'], 
      allowedHeaders: ['Content-Type', 'mcp-session-id', 'Mcp-Session-Id', 'Authorization'], 
      credentials: false,
    }));
    
    // Add authorization middleware
    const authMiddleware = createAuthMiddleware(config);
    app.use(authMiddleware);
    
    // Health check endpoint (no auth required)
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Root endpoint
    app.get('/', (req, res) => {
      res.type('text/plain').send('New Note MCP server');
    });
    
    // Handle OPTIONS preflight requests for MCP endpoint
    app.options(MCP_PATH, (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id, Authorization");
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
      res.status(204).end();
    });
    
    // Handle MCP requests (POST, GET, DELETE)
    const MCP_METHODS = ['POST', 'GET', 'DELETE'];
    MCP_METHODS.forEach(method => {
      app[method.toLowerCase() as 'post' | 'get' | 'delete'](MCP_PATH, async (req, res) => {
        // Set CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
        
        // Create new server and transport for each request (stateless mode)
        const server = createMcpServer(config);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // stateless mode - no session ID required
          enableJsonResponse: true,
        });
        
        // Clean up on request close
        req.on("close", () => {
          // TODO: 看下什么导致的迅速 close
          console.error("[new-note] Request closed");
          // transport.close();
          // server.close();
        });
        
        try {
          await server.connect(transport);
          await transport.handleRequest(req, res);
        } catch (error) {
          console.error("[new-note] Error handling MCP request:", error);
          if (!res.headersSent) {
            res.status(500).type('text/plain').end("Internal server error");
          }
        }
      });
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
      console.error(`[new-note]   • MCP Endpoint (Streamable HTTP, stateless):`);
      console.error(`[new-note]     POST/GET/DELETE ${baseUrl}${MCP_PATH}`);
      console.error(`[new-note] ------------------------------------------`);
      console.error(`[new-note] Available Tools:`);
      console.error(`[new-note]   • new_note: Create a new note and commit/push`);
      console.error(`[new-note] ==========================================\n`);
    });
  } else {
    // STDIO mode - reuse server instance
    const server = createMcpServer(config);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[new-note] Server started successfully in stdio mode`);
  }
}
