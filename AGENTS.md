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