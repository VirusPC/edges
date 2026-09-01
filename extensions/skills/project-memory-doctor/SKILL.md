---
name: project-memory-doctor
description: 体检整棵项目记忆树，修掉索引不一致（死条目、未登记的记忆目录、重复或错位的条目、别人的 AGENTS.md）。用户要求整理、检查或修复项目记忆时使用；init 返回 needs-doctor 时也用。默认只诊断，改文件要显式确认。
---

# Project Memory Doctor

体检整棵记忆树:先诊断，确认后再修。`<init-dir>` 为 sibling `project-memory-init`（`.claude/skills/` 或 `.agents/skills/`）。

## 什么时候用

- 用户要求整理、检查或修复项目记忆。
- `$project-memory-init` 返回了 `needs-doctor`。
- 手工删过或搬过记忆目录之后。

结构的目标态见 [`<init-dir>/references/LAYOUT.md`](../project-memory-init/references/LAYOUT.md)。本 skill 只把现状收敛到那份文档，不自行发明结构。

## 边界：只管结构，不动正文

**本 skill 从不打开任何条目文件的正文。** 它只看 `AGENTS.md` 的受管区块和索引条目，所以修复是机械的、确定性的、幂等的，信息不会丢。

记忆**内容**层面的合并、抽象、遗忘（文献里叫 consolidation 或 dreaming）不属于这里，也尚未实现。用户要求「精简记忆」「合并重复的记忆内容」时，明确说明本 skill 只能修索引结构，别顺手去改正文。

## 为什么这些问题 init 修不了

init 是单目标、只往前写的，只能处理自己这次动作引起的漂移。下面这些要扫全树才能发现，所以归本 skill：

| `issue` | 含义 | 修复动作 |
| --- | --- | --- |
| `dead-entry` | 索引条目指向的目录已经没有记忆了 | 删掉该条目 |
| `unregistered` | 有 `.memory/` 但没有任何索引登记它 | 登记到正确层级 |
| `misplaced` | 唯一的登记在错误层级 | 删掉旧条目，按原描述改登记到正确层级 |
| `duplicate` | 同一个目录被多份索引登记 | 删掉错误层级那几条，保留正确的 |
| `foreign-agents` | 有 `AGENTS.md` 但不含本套受管标记 | 追加受管区块，**既有正文一字不改** |
| `missing-auto` | 记忆根缺少自动化策略区块 | 补上 |

**已知缺口：区块内的固定文案不会自动更新。** init 对已存在的受管区块只追加或改写条目行，从不按模板重渲染区块正文，所以模板里的标题、引言改了名，存量 `AGENTS.md` 里的旧文案会一直留着。**这纯属文案**：脚本靠区块标记和条目行定位，标题写什么都不影响解析，所以不算 `finding`。用户问起或明确要求时才顺手改，改的是本套自己的受管区块，安全。

## 步骤

1. 先诊断。不带 `--apply`，只读不写：

   ```bash
   python3 <init-dir>/scripts/memory.py doctor --target-dir <记忆树里任一目录>
   ```

2. 把 `findings` 逐条讲给用户听：哪个文件、哪一条、为什么算问题、准备怎么改。`findings` 为空就直说记忆树是干净的，到此为止。

3. 得到用户同意后再改：

   ```bash
   python3 <init-dir>/scripts/memory.py doctor --target-dir <同上> --apply
   ```

4. 汇报 `repaired`。`remaining` 非空说明还有修不掉的，如实说出来，不要假装干净。

## 规则

- **默认只诊断。** 这里的修复会删除索引条目、改写别人的 `AGENTS.md`，属于破坏性操作，所以先报告、经用户确认再 `--apply`。用户已经明确说了「检查并修掉」就可以直接带 `--apply`，但汇报里仍要列清改了什么。
- **`foreign-agents` 只追加，不改写。** 手写正文和别的工具的受管块（如 `runa-memory:*`）都原样保留，只在文件里补挂本套的受管区块。不要自己动手编辑这类文件。
- 只碰 `AGENTS.md` 的受管区块和索引条目。**不动 `.memory/` 里的任何条目文件**——记忆内容的增删是 `$project-memory-remember` 的事。
- 修复是幂等的：跑完再跑一次应该零 `findings`。不是的话说明有 bug，报给用户，别反复重试。
- `--target-dir` 给记忆树里任意一个目录都行，脚本会自己回溯到记忆根。
