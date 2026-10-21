---
status: accepted
---

# 被组合仓库直接可写

2026-10-21。被组合仓库装在 `.harness/compose/<name>`，底层是 git submodule。ADR 0043 第 9 条把这些内容定成只读，NodeService 会拒绝写入。子模块工作区本身是普通 git 工作区，只读挡不住别的工具去写，只是让 edges 自己的写命令不能用。一个工作空间挂多个仓库时，挂了却写不进去。

原则就一句：保持简单，不加额外机制。被组合仓库可写，只是删掉 Compose 只读特例之后的自然结果。

**Status:** accepted（ADR 0045）

**See also:** ADR 0043（第 9 条「被组合的内容只读」由本 ADR 取代）、ADR 0042（「被组合的入口只读」由本 ADR 取代；子模块路径与不递归仍有效）、ADR 0039（独立 worktree 与 `compose sync`，不采用）

## Decision

1. **保持简单，不加额外机制。** 不增加挂载分类、可写标记、独立 worktree、同步命令、权限层，也不在 `compose/README.md` 或 Compose 契约里加字段。
2. **删掉只读特例。** 已检出的仓库上，现有写命令直接写进子模块工作区 `.harness/compose/<name>`（条目用了相对 `--path` 时，就是那个检出目录）。CLI 只改文件。提交和推送用原生 git。
3. **Compose 仍不递归。** 不展开被组合仓库自己的 `.harness/compose/`。

## Considered Options

- **保持只读：** 否决。只读只挡住 edges 自己；子模块工作区照样能被别的方式改掉。挂多个仓库时，写命令不能用。
- **在条目上加可写 / 只读标记：** 否决。那是新的挂载分类，要改 Compose 契约。
- **沿用 ADR 0039 的独立 worktree，再加同步命令：** 否决。子模块工作区已经是 git 工作区。再套一层 worktree，并让 CLI 负责 commit / push，是另一套机制。
- **空检出单独报错：** 否决。`git submodule update` 在冲突时已经会表现出来，不必再为写入加特例。

## Consequences

- `ComposeReadmeNode` 不再把子节点标成只读。NodeService 也不再因为路径落在组合检出里就拒绝写入。
- 已检出的仓库上，`notes` / `memory` / `tasks` 等走 NodeService 的写命令直接改那个工作区里的文件。
- 不新增命令，也不改 `add` / `list` / `update` 的契约。
