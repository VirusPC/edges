## Context

当前目标是在远程仓库环境提供一个可被外部 AI 调用的 MCP server（目录为 `extensions/mcp-servers/new-note`），使其把总结内容安全地写入仓库并执行 commit/push。现有仓库已存在 `bin/new-note` 脚本，具备从标题和内容生成文件、创建分支、commit、push、可选建 PR 的能力；但它是 CLI 入口，不是可编排的服务接口，且默认仓库路径为本地固定路径，无法直接作为远程服务契约。

约束条件：
- 服务端实现语言固定为 TypeScript + Node.js。
- 需要兼容当前 Git 流程与凭据模式（SSH key 或 token）。
- 外部调用方是 AI agent，要求结构化错误与稳定返回，避免仅靠终端文本判断结果。

## Goals / Non-Goals

**Goals:**
- 提供一个 MCP 工具接口（工具名 `new_note`），接收 `title/content/coAuthor` 等入参并完成一次 ingest 流程。
- 将入参校验、路径生成、Git 操作执行、结果回传标准化，形成可重复自动化能力。
- 优先复用现有 `bin/new-note` 能力，减少重复实现；同时保留未来迁移到纯 TS Git 执行链路的空间。
- 输出对调用方友好的结构化结果（成功返回文件路径/分支/PR；失败返回错误码与原因）。

**Non-Goals:**
- 本次不实现复杂权限系统（如多租户 RBAC）。
- 本次不重构整个知识目录策略（notes/edges/archive 分类规则保持不变）。
- 本次不要求替换 `bin/new-note` 为全量 TypeScript 实现。

## Decisions

1. **MCP server 采用 TypeScript + Node.js 单服务进程**
- Rationale: 与 MCP 生态和工具链兼容性高，便于定义强类型请求/响应 schema，降低外部 AI 调用时的参数歧义；部署目录统一到 `extensions/mcp-servers/new-note`，便于后续多服务并存。
- Alternative considered:
  - Python server：可行，但与已确定技术方向不一致，后续与 Node 生态组件整合成本更高。

2. **执行策略采用“TS 编排 + 脚本适配层”**
- Rationale: 第一阶段由 TS 服务做参数校验、上下文准备和结果解析，再调用 `bin/new-note`，可最快落地并复用现有流程。
- Alternative considered:
  - 纯 TS 直接执行 git/gh/curl：长期更可控，但首期实现成本和回归风险更高。

3. **为 `bin/new-note` 增加服务化适配约定（必要时小幅改造）**
- Rationale: 当前脚本硬编码 `EDGES_REPO`，MCP 服务部署时需要可配置仓库根路径（例如环境变量覆盖），否则无法在远程服务器稳定运行。
- Alternative considered:
  - 在 TS 层临时 `chdir` 到固定目录并依赖用户 HOME：环境耦合强，不利于部署与测试。

4. **返回模型标准化（machine-readable first）**
- Rationale: MCP 调用方需要可靠解析，返回中应包含 `status`, `filePath`, `branch`, `prUrl`, `stdout/stderr摘要`, `errorCode`。
- Alternative considered:
  - 直接透传脚本原始文本：可读但不可稳定解析，失败自动恢复能力差。

5. **安全边界：输入校验 + 命令参数隔离**
- Rationale: `title/content/coAuthor` 来自外部，必须限制长度、字符集与必填字段；执行脚本时使用参数数组而非 shell 拼接，避免注入风险。
- Alternative considered:
  - 最小校验快速上线：短期快，但故障与安全风险高。

## Risks / Trade-offs

- [脚本兼容性风险] `bin/new-note` 的输出和行为可能随修改变化，影响 TS 解析稳定性。 → Mitigation: 定义最小稳定输出契约（例如固定前缀行或 JSON 模式），并在集成测试锁定。
- [凭据与权限风险] 远程环境缺失 Git/gh 凭据会导致 push 或 PR 失败。 → Mitigation: 启动时做依赖自检，运行前校验凭据并返回明确错误码。
- [并发冲突风险] 多次并发 ingest 可能在分支名/文件名冲突。 → Mitigation: 分支名加入时间戳或随机后缀，写入前检查冲突并重试。
- [对 Python 的隐式依赖] 当前脚本部分 URL/JSON 处理依赖 `python3`。 → Mitigation: 在部署文档中显式声明，后续迭代替换为 Node 原生实现。

## Migration Plan

1. 新增 TypeScript MCP server 骨架与 ingest tool 定义，先完成请求/响应 schema。
2. 增加脚本调用适配层（spawn/execFile），打通 `title/content/coAuthor` 到脚本参数映射。
3. 对 `bin/new-note` 做最小改造（如允许环境变量覆盖仓库路径），保证远程可部署。
4. 在测试环境验证成功路径与失败路径（git 失败、push 失败、参数缺失）。
5. 渐进上线：先内部调用，再开放给外部 AI；保留回滚开关（禁用 MCP ingest tool，回退手工流程）。

## Open Questions & Decisions

- **是否要求 MCP server 直接创建 PR？**
  - Decision: 是。`bin/new-note` 已实现优先尝试 `gh` CLI，其次回退到 `curl` 调用 GitHub API 创建 PR。
- **目标写入目录是否固定？**
  - Decision: 目前固定写入 `knowledge/notes/`。
- **`coAuthor` 字段策略？**
  - Decision: 强制必填，由 MCP server 在输入层进行校验。
- **外部 AI 接入认证？**
  - Decision: 已在 HTTP 模式下通过 `authMiddleware` 实现 Token 校验。

