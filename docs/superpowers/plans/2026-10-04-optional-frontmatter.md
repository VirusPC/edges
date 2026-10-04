# Optional Markdown frontmatter

> 后续用户修正：这些能力现已迁入 [CLI 的 TypeScript utils](../../../extensions/cli/src/utils/node-tree/README.md)，不再使用独立 `@edges/node-tree` 包；YAML 继续使用 `yaml` 库。下文独立包路径和验证为当时实施记录。

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


## 后续目录与语言调整验证

用户要求无需独立 package，改为 CLI utils 内的 TypeScript；YAML 使用现成库。实现现位于 `extensions/cli/src/utils/node-tree/`，模型、codec、存储及遍历边界保留，直接依赖 `yaml` 与 `mdast-util-from-markdown`；原包、workspace 入口和预构建步骤已删除。

- CLI TypeScript 检查及 build 通过。
- 迁入 CLI 的 48 项节点/文档测试均保留；工作区总计 418 项通过（CLI 335、MCP 14、服务 42、页面 27）。
- 隔离目录源码经 tsx 运行；复制 CLI 编译产物后直接运行节点文档 API 和 `--help` 均通过，无独立 workspace 包依赖。
- 独立 TypeScript review 通过，无阻断项。原有 Vite 配置/依赖警告未改变。
