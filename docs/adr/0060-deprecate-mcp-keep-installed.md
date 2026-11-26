---
status: accepted
---

# MCP 标记为已过时，旧随包技能只删 edges 自己装过的

2026-11-26 用户确认 PR #140 的两处实现决定。本 ADR 修订 [ADR 0004](0004-capability-surface-cli-skill-mcp.md) 里「MCP 仍是一等入口」的现行推荐，以及 [ADR 0054](0054-three-entries-and-six-material-types.md) 里「不因技能入口减少而删除 MCP」的范围：MCP 不删除，但标明已过时。

**Status:** accepted

**Amends:** [ADR 0004](0004-capability-surface-cli-skill-mcp.md)、[ADR 0054](0054-three-entries-and-six-material-types.md)

## Decision

1. **MCP 已过时，本轮不删除。** `packages/mcp-servers/`、`new-note` 服务、以及 prompt `edges-create-notes` 都标为 deprecated。代码、README 和术语表写明已过时。进程启动时在 stderr 打出弃用提示。功能仍可调用。新能力不再追加 MCP 入口。

2. **只自动删除 edges 自己装过的旧技能。** `edges skills init` 与包含 skills 的 `edges init` 在目标技能根目录维护 `.edges-skills.json`，记录本次安装的技能目录名和内容哈希。再跑时，清单里有、当前官方集合里没有的目录：哈希未变就删除，并在输出里逐个列出；内容已改则不删，打印警告和手动删除命令。没有清单的首次升级只处理本次并入 `edges` 的旧官方技能名；内容与已发布官方版本一致才删除，否则只警告。指向已删目录的软链一并去掉。`--dry-run` 只预览，不删除、不改清单、不调用安装器。清单和这份旧名单之外的目录不动。

## Consequences

- ADR 0004 的三条能力面仍然是历史决定。现行推荐是 CLI 与 Skill；MCP 保留到另一次决定删除它。
- ADR 0054「不删除 MCP」仍然有效。过时标记不构成删除。
- 本机已经装好、但被改过的旧技能目录不会被这次升级清掉。
