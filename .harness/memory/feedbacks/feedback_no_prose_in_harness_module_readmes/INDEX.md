---
name: feedback_no_prose_in_harness_module_readmes
description: >-
  下放内容或补说明时打开：harness-materials.json 登记的模块 README（含 --super 视角下根上的
  tasks/、notes/、projects/ README）只放标题与受管区块，不加正文；概念进 CONTEXT，命令用法进能力
  README。edges/、archive/ 这类内容目录 README 可以写标准。
metadata:
  edges-title: 模块 README 不写说明文字
  edges-type: feedback
  edges-origin-session-id: e14b5306-8c51-4a25-9410-992239d11143
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-09T17:09:13+08:00'
---

不要往 `.harness` 下各模块的 README 里写说明文字；这些 README 只放标题和工具维护的受管区块。

**Why:** 用户 2026-10-09 在根 README 重写时纠正：「不要向 .harness 下各个模块的 README 里塞东西」。当时为了把旧根 README 的内容下放，往 `tasks/README.md`、`notes/README.md` 里加了说明段落。这些文件是 `harness-materials.json` 登记的模块材料：真系统里挂在 `.harness/` 下，`--super` 时挂的正是作用域根上的同名文件，所以根上的 `tasks/README.md`、`notes/README.md`、`projects/README.md` 同样算模块 README。

**How to apply:** 下放内容标准或补说明时，先对照 `extensions/cli/src/domain/config/harness-materials.json`：路径在清单里的（tasks、projects、notes、memory 各类型、skills 各类型、evaluation、observation 的 README），不加正文，概念放 `CONTEXT.md`，命令用法放对应能力的 README（如 `extensions/cli/README.md`）。不在清单里的内容目录 README（如 `edges/README.md`、`archive/README.md`）可以写内容标准。CLI 自动重算受管区块不算违反。
