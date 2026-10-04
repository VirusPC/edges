# Optional Markdown frontmatter

Approved design: Task, Memory and AGENTS.md share a Markdown document envelope with optional YAML metadata. AGENTS.md adds its own comment markers, chapters and index rules. Format handling must remain independent from domain validation and filesystem operations.

- [x] Add regression tests for YAML/body separation, optional headers, exact no-op preservation, safe edits, malformed metadata and Tasks' YAML support; observe failures.
- [x] Implement a pure document codec with optional metadata and opaque Markdown body. Compose the node codec above it; preserve existing body codec and storage boundaries.
- [x] Replace Task's handwritten YAML handling with a domain adapter. Keep Task Project restrictions and Python Memory runtime unchanged.
- [x] Build, run workspace tests, obtain independent review and fix findings.
- [x] Update API docs, ADR and project memory; commit and push the existing draft PR.

Metadata is a string-keyed map of JSON-compatible values. No schema is required by the format layer. Unchanged source round trips exactly; changed YAML retains AST comments/styles where supported and must reparse to the requested data. Invalid, ambiguous or unrepresentable edits fail explicitly.


## Verification

- CLI build and core checkJs/type declarations passed.
- `pnpm test`: 418 passed (node-tree 48, CLI 287, MCP 14, artifacts service 42, review app 27).
- Regression cases cover header/body isolation, optional metadata, BOM/CRLF, exact no-op and body-only preservation, multiline YAML, additions/removals, aliases, malformed headers, EOF delimiters, large-integer rejection, array occurrence matching and comments across value-type changes.
- Independent review approved after fixing YAML keep-chomp newline loss, integer precision loss, array/comment replacement and EOF separation. Regressions were observed failing before fixes.
- Task uses the shared codec; Python Memory adoption, Task Project policy changes and real AGENTS header migrations remain outside this increment. Existing Vite warnings remain unchanged.
