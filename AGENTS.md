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

### 用户命令 (bin/)
`bin/` 存放用户/Agent 装好后反复调用的命令（如 `new-note`）。它们会被 `pnpm setup` 加入 `$PATH`。
- **兼容性**: 脚本应保持 POSIX 兼容或明确指定解释器。
- **路径**: 脚本中严禁硬编码绝对路径，应相对于仓库根目录动态获取。

### 项目维护脚本 (scripts/)
`scripts/` 存放仓库自身使用的一次性或低频维护脚本（setup、release、migration、cleanup 等）。它们**不**进 `$PATH`，统一通过 `package.json` 的 `scripts` 字段以 `pnpm <name>` 方式对外暴露。
- **新增脚本前先问**: 是不是会有第二个、第三个？如果是，建 `scripts/`；如果只是个例，先放根目录或 `bin/` 也行。
- **每个新脚本都要同步更新**: `package.json` 的 `scripts` 字段 + 本 AGENTS.md 的目录约定 + `README.md` 的对应章节。
- **路径规范**: 同 `bin/`，严禁硬编码绝对路径。

---

## 3. 隐私与脱敏 (Privacy)

> **前提：本仓库是公开仓库（`github.com/VirusPC/edges`）。** 任何写入的内容都等同于公开发表。
> 写笔记时的默认心智是「我在发博客」，不是「我在记私人日记」。

### 3.1 绝对不能进仓库 (Never)

以下内容一旦写入即为事故，不存在「先提交再清理」这个选项——git 历史无法真正删除：

| 类别 | 具体形态 |
|---|---|
| **凭据** | token、API key、密码、私钥、cookie、`.env` 实际值 |
| **个人信息** | 手机号、身份证、住址、非公开邮箱、他人真实姓名/花名 |
| **未公开 IP** | 专利交底书、未发布的方案评审材料、内部立项文档 |
| **二进制办公文档** | `.docx/.xlsx/.pptx` 等（正文与元数据都无法 diff 审查，已在 `.gitignore` 中拒收） |

### 3.2 必须脱敏后才能进仓库 (Redact)

公司内部信息不必一概不写——**方法论可以留，标识符必须去**。脱敏映射：

| 原始 | 替换为 |
|---|---|
| 内部域名与文档链接（`docs.<公司>.com/...` 等） | 整条删除，或写成「（内部文档，略）」 |
| 内部系统 / 自研 Agent 名 | `内部文档平台`、`内部 Agent A/B` 等占位代称 |
| 内部服务名、仓库名、代码路径、类全名 | 删除该行，或改写为通用描述 |
| 同事姓名与花名 | 改为角色（`POC`、`直属负责人`、`QA`） |
| 内部排期日期、具体量化指标 | 改为相对周次 / 量级（`第 3 周`、`一批`） |
| 内部通报、周报、评审记录的原文照搬 | 提炼为通用条目，不保留内部行文口吻 |

脱敏后在文件头加一行说明，让未来的读者知道这不是原文：

```markdown
> 本文为通用方法论记录，已移除具体公司内部系统名称、内部文档链接与排期。
```

### 3.3 截图是最容易漏掉的泄漏面

**文字脱敏了不等于截图脱敏了。** 截图会带上编辑器标签页文件名、终端路径、浏览器地址栏、侧边栏目录树、IM 窗口。

- 引入任何截图前，先实际打开看一遍，而不是只看文件名
- 内部系统 UI 的截图一律不入库；需要示意就自己造一个 demo 再截
- 判据：**这张图放到公开博客里，我会不会需要打码？** 会，就别放

### 3.4 Agent 的动作准则

1. **写入前自查**：向 `knowledge/` 写入内容时，先按 3.1 / 3.2 过一遍；命中就地脱敏，并在回复里明确告诉用户改了什么。
2. **发现即上报**：在仓库任意位置发现疑似泄漏，**立即停下并告知用户**，不要默默修掉——用户需要知道它曾经存在过多久。
3. **历史重写必须用户确认**：`git filter-repo`、`git push --force` 属于不可逆操作。Agent 可以准备命令、做好备份（`git bundle create ... --all`），但**执行必须由用户本人完成**。
4. **删文件 ≠ 删历史**：向用户报告清理结果时，必须明确区分「工作区已清理」和「历史已重写」，不要让用户误以为已经安全。

### 3.5 例行自查

```bash
# 内部标识符扫描（按需扩充 pattern）
grep -rIn -E '<内部域名>|<内部系统名>|<内部服务名前缀>' --include='*.md' . | grep -v node_modules

# 凭据形态扫描
grep -rIn -E '(api[_-]?key|token|secret|password)\s*[:=]\s*["\x27][^"\x27]{16,}' --include='*.md' --include='*.ts' . | grep -v node_modules

# 确认没有办公文档混入
git ls-files | grep -iE '\.(docx?|xlsx?|pptx?)$'
```

---

## 4. Git 操作规范

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

3.  **Obsidian 工作区文件常驻 dirty**:
    - `.obsidian/workspace.json` 是被 Obsidian 后台持续重写的运行时状态，会让 working tree 永远 "有未暂存改动"。
    - 影响: `git pull --rebase`、`git rebase`、`git stash`（无 `--autostash`）会一直报 "cannot rebase: You have unstaged changes"。
    - 解法: 涉及远端同步或 rebase 的命令，统一加 `--autostash`：
      ```bash
      git pull --rebase --autostash origin main
      git rebase --autostash origin/main
      ```
    - 原理: `--autostash` 让 git 在操作前自动 stash、操作后自动 pop，能 cover Obsidian 的 race。
    - 不要尝试用 `git checkout -- .obsidian/workspace.json` 硬清——Obsidian 几秒内会再写一次，且会污染后续 rebase 的工作树状态。

---

## 5. 交互准则

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