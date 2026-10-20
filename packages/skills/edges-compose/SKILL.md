---
name: edges-compose
description: 把外部 harness 仓库挂到当前 scope 时使用。教 AI 用 edges compose register、clone、list，以及可选的 pull、push、unregister。底层是 git submodule，默认装到仓内 .harness/compose/<name>，AGENTS.md 只写相对路径。register 必须带 --description，写清这个仓存什么、什么时候该写进去，供后续 AI 判断。不经手 git token。
version: 0.1.0
---

# edges compose

本 skill 是 beta（`0.1.0`）。人和有 shell 的 Agent 用 [`edges` CLI](../../cli/README.md) 的 `edges compose` 把外部 harness 仓库登记进当前 scope 的 Compose 区块。这里只说明何时调用、命令怎么写。落盘在 CLI 里，不要手改 `AGENTS.md` 的组合区块，也不要自己跑 `git submodule add`。

底层是 git submodule：被组合的仓库默认装在当前仓库里的 `.harness/compose/<name>`，`AGENTS.md` 只写相对路径，换一台机器 clone 主仓库后跑一次 `edges compose clone` 就能用。

## 什么时候用

- 用户要把另一个 harness 仓库挂到当前工作目录，让 Agent 开场就能看到它的入口。
- 用户要 clone、列出、更新、推送或取消一条已经登记的组合仓库。
- 不要用它写笔记、建任务或改项目记忆。那些走各自的 skill。

## 硬规则

1. **`compose register` 必须带 `--description`。** 不传，或只传空白，命令以校验错误退出（退出码 2，`errorCode` 为 `VALIDATION_ERROR`），不会写入 Compose 区块。说明要写清两件事：这个仓存什么，以及什么情况下该往它写。后续 AI 靠这段文字决定该不该写进去，不要写成空话。
2. **命令以 CLI 为准。** 用 `--scope`（或已设置的 `EDGES_SCOPE`）、`--name`、`--remote`、`--path`、`--description`。没有列在下面的旗标不要猜。`--path` 可选；不传时目录是 `.harness/compose/<name>`。传 `--path` 时只能写相对路径，相对于 scope 的 `AGENTS.md` 所在目录；绝对路径和 `~` 开头的路径会被拒绝（校验错误），不写区块。
3. **register 会改主仓库的 git 索引。** 带 `--remote` 且 scope 在 git 仓库里时，`register` 先执行 `git submodule add <remote> <path>`，再写 `AGENTS.md`。`.gitmodules` 和子模块目录会进主仓库的暂存区，要和 `AGENTS.md` 一起提交。同一路径已经是同一 URL 的子模块时只登记，不再 add；URL 不同则报错，不写区块。不带 `--remote` 时只登记一个本地目录，不碰 git。
4. **不经手 token。** 不要让用户把 token、密码、cookie、私钥贴进对话。`clone`、`pull`、`push` 需要 git 鉴权时，让用户在自己的终端完成（例如 `gh auth login`），不要代跑带凭证的命令，也不要读取或复述凭证。
5. **只在用户要求时 push。** `push` 会在子模块目录里执行该仓库自己的 `git push`。用户没要求发布时不要 push。
6. **不递归。** 只看当前仓库自己登记的条目。被组合仓库自己的 Compose 条目不会被 clone，也不会被读取或经 `--with-composed` 展开。两个仓库互相登记也只展开一层。不要手动跑 `git submodule update --recursive`。

## 常见流程

先登记，再 clone，然后 list 确认：

```bash
edges --scope <目录> compose register \
  --name brain \
  --remote https://github.com/example/brain.git \
  --description "个人大脑：只在记跨项目判断时写入"
edges --scope <目录> compose clone --name brain
edges --scope <目录> compose list
```

检出要放在别的仓内目录时加上相对的 `--path`：

```bash
edges --scope <目录> compose register \
  --name brain \
  --path vendor/brain \
  --remote https://github.com/example/brain.git \
  --description "个人大脑：只在记跨项目判断时写入"
```

可选：

```bash
edges --scope <目录> compose pull --name brain
edges --scope <目录> compose push --name brain
edges --scope <目录> compose unregister --name brain
```

各命令底层做的事：

| 命令 | 仓内条目（git submodule） |
| --- | --- |
| `register --remote` | `git submodule add <remote> <path>`，再写 `AGENTS.md` |
| `clone` | `git submodule update --init -- <path>`，不带 `--recursive`；已初始化的记为 `present` |
| `pull` | `git submodule update --init --remote -- <path>`；子模块在分支上时加 `--merge`，留在该分支 |
| `push` | 在子模块目录里 `git push`；子模块是 detached HEAD 时这一条失败 |

子模块默认是 detached HEAD。要在被组合的仓库里提交并推送，先在子模块目录里 `git switch <分支>`（例如 `git -C .harness/compose/brain switch main`），在分支上提交，再 `edges compose push --name brain`。

`unregister` 只从 Compose 区块去掉这一条，不删除目录，也不移除子模块。真要移除时，让用户自己跑 `git submodule deinit` / `git rm`。`clone` / `pull` / `push` 的 `--name` 只处理一条；不传则处理全部已登记条目。

## 提示与旧条目

- 子模块目录不存在或是空的（新 clone 的主仓库还没初始化）时，`compose list` 和带 `--with-composed` 的命令在 stderr 打 `warning: compose entry <名字> is not checked out at <路径>; run edges compose clone --name <名字>`。看到它就跑 `edges compose clone`。
- 旧条目（指向 `~/...` 或绝对路径，例如以前默认的 `~/.edges/composed/<name>`）照样能读，`clone` / `pull` / `push` 对它们仍用普通的 `git clone` / `git pull` / `git push`。读取和这三个命令会在 stderr 打迁移提示：先 `unregister`，再不带 `--path` 重新 `register --remote`，条目就搬到 `.harness/compose/<name>`。迁移前先问用户，旧目录由用户自己决定是否删除。
- 条目在主仓库外（例如 `--path ../brain`），或 scope 不在 git 仓库里时，`register --remote` 跳过 `git submodule add` 并打 warning，之后按旧条目的方式 clone。

`clone` / `pull` / `push` 逐条处理。某一条失败时，它在 `entries` 里是 `action: "failed"`，原因在 `error`，stderr 有一行 `warning: compose <动作> failed for <名字>: ...`；其余条目照常执行。至少一条成功时退出码是 0，所以要看 `entries` 里有没有 `failed`，再把失败的条目和原因告诉用户。全部请求的条目都失败（含 `--name` 那一条失败）时非零退出。

stdout 只有 JSON。失败时读 `reason`。退出码 `2` 是用法或校验错误。
