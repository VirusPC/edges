<!-- OPENSPEC:START --># OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Agent Developer Guide

## 你的身份与职责

你是维护 **Edges 系统** 的 AI 工程师。
你的核心职责是维护仓库的基础设施、开发扩展工具（extensions）以及辅助用户管理知识库结构。

---

## 1. 了解项目 (Context)

在执行任何任务前，**必须优先阅读 `@/README.md`**。
`README.md` 是本项目业务逻辑、目录结构和内容标准的**唯一真理源**。

- 关于“哪个文件该放哪里” → 看 `README.md`
- 关于“什么是 extensions” → 看 `README.md`

---

## 2. 系统开发 (Development)

当你被要求修改代码（如 `bin/` 脚本, `extensions/` 插件）时：

### 扩展开发 (extensions/)
`extensions/` 是本系统的对外接口层。
- **开发原则**: 确保接口简洁、标准，便于外部 Agent（如 Claude, Cursor）调用。
- **文档**: 修改任何 extension 后，必须同步更新该目录下的 README 说明。

### 脚本维护 (bin/)
- **兼容性**: 脚本应保持 POSIX 兼容或明确指定解释器。
- **路径**: 脚本中严禁硬编码绝对路径，应相对于仓库根目录动态获取。

---

## 3. Git 操作规范

当执行版本控制操作时，严格遵守以下规则：

1.  **Commit Message**:
    - 格式: `type: subject` (如 `feat: add new mcp server`, `docs: update readme`)
    - 保持简洁，一行概括。

2.  **Co-author Trailer**:
    - 必须在提交信息的末尾包含 `Co-authored-by` 字段，表明 AI 的参与。
    - 示例:
      ```
      feat: implement user search skill

      Add fuzzy search capability to the skills library.

      Co-authored-by: Assistant Name <assistant@example.com>
      ```

---

## 4. 交互准则

- **少即是多**: 不要在回复中重复用户已知的信息。
- **安全第一**: 修改 `bin/` 或执行系统级命令前，务必解释潜在风险。
- **配置优先**: 遇到路径、环境问题，优先检查 `.env` 或配置文件，而非硬编码。

---

## Cursor Cloud specific instructions

This repo contains **two** independent projects (the root `README.md` has a committed merge conflict describing both):
1. **Edges pnpm workspace** — the primary product. The runnable service is the `new-note` MCP server at `extensions/mcp-servers/new-note`. See its `README.md` for tool/API details and `package.json` for the standard scripts.
2. **`claude-agent-sdk-test`** — a secondary Python starter (`src/`, `tests/`, `pyproject.toml`).

Dependencies are pre-installed by the update script (`pnpm install` + `pip install --user -e .`); the notes below are non-obvious gotchas, not setup steps.

### Dependency / registry gotcha (important)
- `pnpm-lock.yaml` pins tarball URLs to a **private registry** (`artifactory.devops.xiaohongshu.com`) that is **unreachable from Cursor Cloud**. A handful of packages (`cors`, `@types/cors`, `@esbuild/linux-x64`, `object-assign`) time out there.
- `node_modules` and the pnpm store are **pre-populated in the environment snapshot**, so `pnpm install` is a fast no-op (`Already up to date`) and does not touch the network. **Do not delete `node_modules`** and do not expect a clean-slate `pnpm install` to succeed online — it will hang retrying the private registry. If you ever must repopulate, fetch the missing tarballs from `https://registry.npmjs.org` (they are identical public-npm packages).

### new-note MCP server (`extensions/mcp-servers/new-note`)
- **Run it in dev mode:** `pnpm dev:note-server` (root) or `pnpm dev` (package) → `tsx` runs `src/index.ts` in HTTP mode on `http://localhost:3000` (`/health`, MCP at `/new-note`). Dev mode uses `--env-file=.env`, so create a local (gitignored) `.env` in the package to inject vars.
- **Build output quirk:** `outDir` is defined in the root `tsconfig.base.json`, so `tsc` (via `pnpm build`) emits to **`/workspace/dist`**, not `extensions/mcp-servers/new-note/dist`. Because of this the packaged `pnpm start` (`node dist/index.js`) fails from the package dir. To run the compiled build use `node /workspace/dist/index.js --http --port 3000`, or just use dev mode (`tsx`).
- **Tests:** `pnpm test` (`node --test --import tsx`) discovers **0** tests because Node's default runner doesn't match `.ts` files. Run the suite explicitly: `node --test --import tsx test/*.test.ts` (9 tests pass).
- **Lint:** no lint tooling is configured. Root `pnpm lint` is `pnpm recursive lint`, which errors (invalid syntax); `pnpm -r run lint` reports "no lint script". There is nothing to lint.
- **Testing `new_note` safely:** the tool shells out to `bin/new-note`, which in `direct` mode commits **and pushes** to `EDGES_REPO` (defaults to the repo root) on `main`. To exercise it without mutating the real repo, point `EDGES_REPO` at a scratch git repo (that contains a copy of `bin/new-note`) and set `EDGES_DRY_RUN=true` (skips checkout/pull/push; still does a local commit).

### Python project
- Tests: `python3 -m unittest discover -s tests` (2 tests). Running the actual CLI agent (`claude-agent-sdk-test "..."`) requires Anthropic credentials + the bundled Claude Code CLI; not needed for tests or environment verification.