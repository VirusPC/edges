# 全部知识内容目录化 Implementation Plan

> **For agentic workers:** 使用 executing-plans 在当前隔离 worktree 内执行，每项完成后核验；最后用 requesting-code-review 独立审查。

**Goal:** 将原 knowledge 下所有内容统一为目录入口，并把附件归入所属目录。

**Architecture:** TypeScript 脚本先生成文件映射，再统一重写 Markdown、Obsidian wikilink 和 HTML 的实际引用。只改变路径与引用，保留文档正文、代码示例、附件字节和局部维护空间；不引入 Resource 领域模型。

**Tech Stack:** TypeScript、Node fs/git、已有 mdast-util-from-markdown、node:test。

**Spec:** 用户 2026-10-05 补充：不只 notes，原 knowledge 下 edges/posts 等全部使用目录；大规模操作必须脚本化。README「文件系统／目录单元」为长期约定。

## Global Constraints

- 只在现有独立 worktree 修改；不读取私有迁移 journal 或用户记忆。
- 普通内容 `topic.md → topic/index.md`；已有 index.md、AGENTS.md、SKILL.md、目录说明 README.md 保持角色。
- 用户本次明确授权 posts 的结构迁移，范围仅限目录与必要引用，不重写成稿。
- 默认 dry-run，显式 --apply；冲突、源变更、符号链接导致失败，不覆盖现有文件。
- 附件内容必须逐字节保留。共享/无引用附件先列清单；复制与归档策略待用户选择，未选择默认保留原位。

### Task 1: 引用与迁移计划

Files: `extensions/cli/scripts/content-directory-migration.ts`、`scripts/migrate-content-units.mts`、`extensions/cli/test/memory/content-directory-migration.test.ts`、`package.json`。

- [x] 写 fixture：中文路径、空格、锚点、Wiki 别名、代码中的假引用、HTML 图片、外部入链、既有入口、冲突与源变更。
- [x] 运行 `pnpm --filter edges-cli exec node --test --import tsx test/memory/content-directory-migration.test.ts`，先验证缺少实现导致失败。
- [x] 实现 `planContentUnits(root, { shared, unreferenced })` 和 `applyContentUnits(plan)`；计划包括旧新路径、引用编辑、校验快照、未解析引用。按整个计划预检，再写入并支持当前进程失败回滚。
- [x] 重复执行同一 fixture，断言第二次没有移动或引用改写；复制附件哈希一致、未分配附件没有丢失。

### Task 2: 实际迁移和核验

- [x] 先运行无 --apply 的全仓预览，核对文档数、附件数、冲突、缺失和歧义引用。
- [x] 根据用户选定策略应用；保留 before/after 文件映射及哈希审计至临时报告，不提交原文快照。
- [x] 对所有改写文件做引用前后目标比较，所有附件做 SHA-256 比较；正文通过移除实际引用目标后比较，确保未重写文字。
- [x] 更新 README、edges 目录说明和迁移指南；用 project-memory-remember 更新已有目录决策记忆。
- [x] 运行脚本严格类型检查、CLI 类型检查、迁移相关测试和构建；独立代码审查通过后提交并更新原 PR，不合并。
