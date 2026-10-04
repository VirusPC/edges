# Optional Markdown frontmatter

> 后续用户修正：这些能力现已迁入 [CLI 的 TypeScript utils](../../../extensions/cli/src/utils/node-tree/README.md)，不再使用独立 `@edges/node-tree` 包；frontmatter 直接采用 `gray-matter` 默认解析/序列化，删除自定义格式行为及 `js-yaml` 直接依赖；不合约定的文档直接修正。下文旧包路径、旧实现与验证属于历史记录，现行约定以链接的 API 文档为准。

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


## 后续文档类型与 codec 验证

文档模型新增可选 type（base、agents、memory、task）和泛型 DocumentCodec 接口。调用方显式选择处理方式；AGENTS 继续返回章节 NodeModel，Task 在领域模块校验字段，Memory 暂复用基础文档格式。类型提示、树上下文与实际 YAML 分类字段分别表达，不自动互相写入或推导。

- CLI build、TypeScript 检查与完整工作区测试通过：424 项（CLI 341、MCP 14、服务 42、页面 27）。
- 新回归覆盖基础/Memory 类型标记、AGENTS 章节编辑、错误类型 codec 拒绝、Task 格式校验及保真写回；相关 66 项测试通过。
- 独立 TypeScript review 通过。没有新增动态注册框架，Python Memory 接入仍单独待办。


## 取消 YAML 展示格式保留目标（历史实现，已被默认行为方案替代）

用户确认无需保留 YAML 注释和样式；这不是原始需求。当时实现删除 YAML AST reconcile，frontmatter 读取使用 gray-matter 与 js-yaml core-schema engine，写回直接 dump 头部，避免裁剪多行字段值或给正文追加换行。数据、正文、可选头部和领域边界保留；头部注释、引号、空白与集合样式不再保证。

- 相关 68 项测试、CLI TypeScript 检查及构建通过；完整工作区 426 项测试通过（CLI 343、MCP 14、服务 42、页面 27）。
- 独立复核发现并修复分隔符前缀键被截断、别名展开缺少预算、非字符串键与根 null 被静默转换的问题；新增回归均验证失败后修复通过。
- 独立复审通过，无剩余阻断项。AGENTS 正文编辑规则及 Python Memory 接入边界不变。

## Default gray-matter behavior (current implementation)

The user rejected custom format behavior and the direct js-yaml dependency. The document adapter now maps gray-matter data/content to metadata/body and delegates YAML parsing and serialization to its defaults. Dates, aliases, delimiters, empty headers and final newlines follow the library. Domain field checks remain in Tasks. Documents that violate their conventions must be corrected instead of extending parser compatibility. Non-YAML declarations are rejected before parsing to prevent the library's JavaScript engine from executing document content.

- Removed custom YAML engine, schema, splitter, recursive value conversion, expansion budgets and lossless-output checks. Metadata values are unknown until narrowed by a domain.
- Removed tests for the abandoned custom behavior; retained domain integration and added default-behavior, mutable-cache isolation and non-executing document-read regressions.
- Scanned 1,666 tracked Markdown paths: 263 YAML headers, no parsing errors, missing closing delimiters or unquoted Task date fields found. No source documents required repair.
- CLI build, TypeScript checks and 416 workspace tests passed (CLI 333, MCP 14, service 42, app 27). Independent review approved.
