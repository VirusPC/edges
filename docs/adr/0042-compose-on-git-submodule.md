---
status: accepted
---

# Compose 底层改用 git submodule，装到 `.harness/compose/<name>`

2026-10-20 peng cheng 开卡（`edges-brain-viruspc` PR #338，任务卡「Compose 底层改用 git submodule，装到 `.harness/compose/<name>`」）。问题：Compose 把本机绝对路径写进 `AGENTS.md`（相对的 `--path` 会被改成绝对路径，默认的 `~/.edges/composed/<name>` 又固定在本机家目录），换一台机器登记就不能用；`clone` / `pull` / `push` 也都由 CLI 自己实现。两个仓库互相登记时还担心无限展开。

**Status:** accepted（ADR 0042）

**See also:** ADR 0034（组合 harness 仓库）、ADR 0039（Compose 写入走 worktree，proposed）

## Decision

1. **命令不变，底层换成 git submodule。** 仍是 `edges compose register` / `unregister` / `list` / `clone` / `pull` / `push`。被组合的仓库默认装在所属 `AGENTS.md` 目录下的 `.harness/compose/<name>`，目录名与 `--name` 一致。
2. **`AGENTS.md` 只写相对路径。** 链接相对于所属 `AGENTS.md` 的目录。`--path` 只收相对路径，规范化后原样写入。绝对路径和 `~` 路径以校验错误拒绝，而不是只给 warning：新写的区块必须换机器可用。
3. **git 步骤：** `register --remote` 在条目位于主仓库工作树里时跑 `git submodule add <remote> <path>`，同一 URL 已存在时只登记，URL 不同时报错。`clone` 是 `git submodule update --init -- <path>`，从不带 `--recursive`。`pull` 是 `git submodule update --init --remote -- <path>`；子模块在分支上时加 `--merge`，避免把用户的分支切成 detached HEAD。`push` 在子模块里 `git push`；detached HEAD 时这一条失败，原因提示先切到分支。PR #13 的逐条失败处理不变。
4. **不递归。** 读取、`--with-composed` 和 `clone` 只看当前仓库自己登记的条目，不展开被组合仓库的 Compose 条目。系统森林扫描跳过 `.harness/compose/` 和已登记的组合目录。被组合的入口即使在主仓库目录里也只读。两个仓库互相登记时各自只到一层。
5. **提示。** 条目目录不存在或为空（子模块未初始化）时，`compose list` 和带 `--with-composed` 的命令在 stderr 提示运行 `edges compose clone`。
6. **兼容旧条目。** 区块里已有的 `~/...` / 绝对路径条目照样读，`clone` / `pull` / `push` 对它们和对仓外条目仍用普通 `git clone` / `pull` / `push`，并打迁移提示。不自动迁移。

## Considered Options

- **绝对 / `~` 路径只给 warning 照写：** 否决。区块会继续带上本机路径，违背「换机器可用」。
- **`clone` 带 `--recursive`：** 否决。互相登记会套娃，依赖方向也不清。以后要递归时，按 remote 记已访问集合再做（见后续）。
- **继续由 CLI 自己 `git clone` 到家目录：** 否决。登记无法随主仓库走，主仓库也记不住被组合仓库的版本。

## Consequences

- ADR 0039 里「submodule 换底座：否决」一条由本 ADR 取代；0039 其余内容（worktree、`compose sync`）不变，仍是 proposed。
- `register` 会改主仓库的暂存区（`.gitmodules` 与子模块），要和 `AGENTS.md` 一起提交。
- 后续：两个仓库（`VirusPC/edges` 与 `VirusPC/edges-brain-viruspc`）真正添加子模块并迁移 `AGENTS.md` 条目；可选的浅克隆、`edges compose worktree`、带已访问集合的 `--recursive`。
