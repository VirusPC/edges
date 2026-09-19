# Services

Long-running Edges-bound HTTP processes that are not MCP servers and not Commander command nodes.

Local agents still prefer [`../clis`](../clis/) (`edges …`). Skills say when to call the CLI. MCP stays in [`../mcp-servers`](../mcp-servers/) for hosts without a shell. Capability Surface is CLI + Skill + MCP.

## Services

- `artifacts-preview/`: Artifacts 预览服务 (ADR 0013). Upload → public URL → TTL delete. Client: `edges artifacts`.

## Conventions

- Each service directory has its own `package.json`, `src/`, `test/`, `README.md`
- Workspace glob: `extensions/services/*` in the repo `pnpm-workspace.yaml`
- Do not put `createServer` inside `extensions/clis` (that tree is **file = one command node**)
