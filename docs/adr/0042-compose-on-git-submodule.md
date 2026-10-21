---
status: accepted
---

# Compose 底层改用 git submodule，装到 `.harness/compose/<name>`

2026-10-20 peng cheng 开卡（个人大脑仓 PR #338，任务卡「Compose 底层改用 git submodule，装到 `.harness/compose/<name>`」）。问题：Compose 把本机绝对路径写进 `AGENTS.md`（相对的 `--path` 会被改成绝对路径，默认的 `~/.edges/composed/<name>` 又固定在本机家目录），换一台机器登记就不能用；`clone` / `pull` / `push` 也都由 CLI 自己实现。两个仓库互相登记时还担心无限展开。同日 peng cheng 又拍板把子命令收成三个，名字跟 git submodule 对应，一次硬切。

**Status:** accepted（ADR 0042）

入口位置、虚拟节点和 `--with-composed` 由 [ADR 0043](0043-compose-readme-entry.md) 取代。子模块路径、`add` / `list` / `update` 和逐条失败仍以本 ADR 为准。

**See also:** ADR 0034（组合 harness 仓库）、ADR 0039（Compose 写入走 worktree，proposed）、ADR 0043（真实的 `compose/README.md` 入口）

## Decision

1. **底层换成 git submodule。** 被组合的仓库默认装在所属 `AGENTS.md` 目录下的 `.harness/compose/<name>`，目录名与 `--name` 一致。
2. **只有三个子命令，名字对应 git submodule：**
   - `edges compose add`（取代 `register`，选项不变：`--name`、`--path`、`--remote`、`--description`）：条目在主仓库工作树里且带 `--remote` 时跑 `git submodule add <remote> <path>`，再写 `AGENTS.md` 的一行。同一 URL 已存在时只登记，URL 不同时报错。同名再 `add` 替换原来那一行（旧条目迁移就靠这个）。不带 `--remote` 时只登记本地目录。
   - `edges compose list`：列出条目，每条带 `initialized`（目录存在且非空），未检出时提示运行 `update`。
   - `edges compose update [--remote] [--name]`：每条 `git submodule update --init -- <path>`，从不带 `--recursive`。`--remote` 跟到远端最新；子模块已在分支上时再加 `--merge`，不把用户的分支切成 detached HEAD。
3. **删掉的命令，不留别名：** `register`、`unregister`、`clone`、`pull`、`push`。旧命令以用法错误退出。
   - **推送 / 同步交给原生 git。** 在子模块里 `git switch <branch>`、提交、`git push`。CLI 不包一层 push，也不做 `compose sync`。
   - **去掉条目：** 手删 `AGENTS.md` 的 Compose 区块里那一行；要连子模块一起删时用 `git submodule deinit` / `git rm`。删 `unregister` 没有结构性影响：没有别的命令或迁移依赖它；Domain 的 `ComposeNode.removeChild` 保留，只是不再有 CLI 入口。
4. **`AGENTS.md` 只写相对路径。** 链接相对于所属 `AGENTS.md` 的目录。`--path` 只收相对路径，规范化后原样写入。绝对路径和 `~` 路径以校验错误拒绝，而不是只给 warning：新写的区块必须换机器可用。
5. **逐条失败。** PR #13 的语义落在 `update` 上：失败条目记 `action: "failed"`，stderr 打 warning，其余条目继续；部分失败退出 0，全部失败或 `--name` 单条失败时非零。
6. **不递归。** 读取、`--with-composed` 和 `update` 只看当前仓库自己登记的条目，不展开被组合仓库的 Compose 条目。系统森林扫描跳过 `.harness/compose/` 和已登记的组合目录。被组合的入口即使在主仓库目录里也只读。两个仓库互相登记时各自只到一层。

> 2026-10-21：「被组合的入口即使在主仓库目录里也只读」由 [ADR 0045](0045-compose-checkout-writable.md) 取代。本条其余内容（不递归、不展开被组合仓库自己的 Compose）仍然有效。
7. **提示。** 条目目录不存在或为空（子模块未初始化）时，`compose list` 和带 `--with-composed` 的命令在 stderr 提示运行 `edges compose update --name <name>`。
8. **兼容旧条目。** 区块里已有的 `~/...` / 绝对路径条目照样读。`update` 对它们和对仓外条目用普通 git：目录不存在时 `git clone`，`--remote` 时 `git pull`，并打迁移提示。不自动迁移。

## Considered Options

- **保留 register / clone / pull / push 并加别名：** 否决。和早先 skills / notes 改名一样一次硬切，命令名直接对上 git submodule，少一层翻译。
- **保留 `compose push` / 新增 `compose sync`：** 否决。子模块里就是一个普通 git 仓库，原生 git 已经够用；包一层还要处理 detached HEAD、凭证、PR 等，收益小。
- **保留 `unregister`：** 否决。删一行文字不值得一个命令；真要删子模块，`git submodule deinit` / `git rm` 才是对的工具，而且会删目录，应由用户自己决定。
- **绝对 / `~` 路径只给 warning 照写：** 否决。区块会继续带上本机路径，违背「换机器可用」。
- **`update` 带 `--recursive`：** 否决。互相登记会套娃，依赖方向也不清。以后要递归时，按 remote 记已访问集合再做（见后续）。
- **继续由 CLI 自己 `git clone` 到家目录：** 否决。登记无法随主仓库走，主仓库也记不住被组合仓库的版本。

## Consequences

- ADR 0039 里「submodule 换底座：否决」与「新增 `edges compose sync`」两条由本 ADR 取代；0039 里 worktree 的部分要按子模块重新评估。
- `add` 会改主仓库的暂存区（`.gitmodules` 与子模块），要和 `AGENTS.md` 一起提交。
- 后续：两个仓库（`VirusPC/edges` 与用户的个人大脑仓）真正添加子模块并迁移 `AGENTS.md` 条目；可选的浅克隆、`edges compose worktree`、带已访问集合的 `--recursive`。
