---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-14T09:16:15.066Z'
  edges-title: edges memory init / remember 支持 --super，写入仓库根 memory/
  edges-tasks-status: backlog
  edges-task-priority: none
name: edges_memory_init_remember_支持_super写入仓库根_memory
description: 现在 --super 只对读取和 tasks 生效，memory 写入命令会忽略；补上后仓库根的通用备忘可由 CLI 初始化和写入。
---
**背景：**
讨论在 edges 仓库根放一个通用 `memory/`（与专题无关的备忘）。第一条内容「调研 Agent 能力时优先关注的产品与团队」已随 PR #240 合入，但目录和 README 是手写的，不是 CLI 生成的。用户发现格式不对，提出用 `--super` 加 CLI init。
- 实测（临时仓库）：`edges --scope <根> --super memory init --memory-types reference` 会忽略 `--super`，仍写到 `.harness/memory/references/`。
- CLI 设计已支持该形状：`--super` 下 scope 目录即超节点的 harness；`harness-materials.json` 已登记 `memory/references/README.md` 等根级材料路径，list 类读取能找到。
- 预期收益：根级通用备忘也由 CLI 管理，索引不再手写。
- 非目标：不改 `.harness/memory/` 维护记忆；不改 tasks 现有的 `--super` 行为。
- 关联：PR #240；`cli`；skill `project-memory-init` / `project-memory-remember`。

**目标：**
`memory init` 和 `remember` 支持 `--super`，把类型入口和条目写进 `<scope>/memory/<type>/`；随后用 CLI 把根目录 `memory/` 重整为合规格式。

**动作：**
- 云端 agent 修改 `cli`：memory init / remember 接上 `--super`，补测试，更新两份 skill 文档。
- 合并后在仓库根跑 `--super memory init`，用 `remember --import-entry` 导入关注清单到 `memory/references/`，删除手写 README 和旧目录。

**完成标准：**
- [ ] `edges --scope <根> --super memory init --memory-types reference` 生成 `<根>/memory/references/README.md`，不碰 `.harness/memory/`。
- [ ] `--super memory remember --type reference` 生成 `<根>/memory/references/reference_<slug>/INDEX.md`，索引自动刷新。
- [ ] 不带 `--super` 时行为不变，原有测试全部通过。
- [ ] 根目录 `memory/` 只剩 CLI 生成的结构，关注清单经 CLI 导入。
