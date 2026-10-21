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
2. **写入落在子模块工作区。** 路径就是 `.harness/compose/<name>`（条目用了相对 `--path` 时，就是那个检出目录）。CLI 只把文件写下去，不 commit、不 push。提交和推送在子模块里用原生 git。
3. **按被组合仓库自己的作用域写。** 父索引、`.harness` 布局和该仓库自己的规则，都停在这个检出里，不套用宿主仓库的规则。
4. **Compose 仍不递归。** 不展开被组合仓库自己的 `.harness/compose/`。
5. **空检出写不进去。** 条目目录不存在或为空时，写入失败，并提示运行 `edges compose update --name <name>`。缺失的节点或引用跳过，不挡住其余操作。

## Considered Options

- **保持只读：** 否决。只读只挡住 edges 自己；子模块工作区照样能被别的方式改掉。挂多个仓库时，写命令不能用。
- **在条目上加可写 / 只读标记：** 否决。那是新的挂载分类，要改 Compose 契约。
- **沿用 ADR 0039 的独立 worktree，再加同步命令：** 否决。子模块工作区已经是 git 工作区。再套一层 worktree，并让 CLI 负责 commit / push，是另一套机制。

## Consequences

- `ComposeReadmeNode` 不再把子节点标成只读。NodeService 也不再因为路径落在组合检出里就拒绝写入。
- 已检出的仓库上，`notes` / `memory` / `tasks` 等走 NodeService 的写命令直接改那个工作区里的文件。
- 目录还没初始化时，写入报错并带上 `edges compose update --name <name>`。读的时候，缺了的条目仍然只是一条警告，不让整条命令失败。
- 不新增命令，也不改 `add` / `list` / `update` 的契约。
