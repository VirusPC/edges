---
status: accepted
---

# 废止个人仓 shared-extensions 隔间

2026-10-27 用户确认。使用方的个人脑仓就是一份可 Compose 的共享 `.edges`，不需要再加概念。框架只废止 `shared-extensions/` 这一隔间，不再打 `shared-extensions@` tag。不绑定 Edges 的通用 skill 与个人 harness 放使用方自己的内容仓，经 Compose 挂载；布局由该仓自定。本仓只记录这个决定并改现行文档。隔间里的搬家、打 tag 与删除目录由使用方自己的仓另做。

**Status:** accepted（ADR 0048）

**Supersedes（局部）：** [ADR 0036](0036-edges-init-installs-bundled-skills.md) 里「与 edges CLI 无关的 skill 放 `shared-extensions/skills/`」；[ADR 0040](0040-flatten-extensions-posts-to-personal-repo.md) 里「个人仓放入 `shared-extensions/`」的安置句。两条的其余决定不变。[ADR 0024](0024-scope-first-content-ownership.md) 里把个人仓 `shared-extensions/` 写成对外分发落点的那句，同样不再作为现行位置。

**See also:** [ADR 0034](0034-compose-harness-repos-into-workspace.md)、[ADR 0042](0042-compose-on-git-submodule.md)（Compose 挂外部仓）、[ADR 0047](0047-rename-harness-directory-to-edges.md)（材料目录是 `.edges/`）

## 背景

2026-10-18，ADR 0036 把不调用 edges CLI 的 skill 移出 npm 包，落到 `shared-extensions/skills/`。2026-10-20，ADR 0040 取消框架仓的 `extensions/` 层，并把当时的 `new-server/`、`others/` 交给个人仓的 `shared-extensions/`。这之后，跨机器、跨 Agent、又不绑定 Edges 的材料被说成要进这一隔间：通用 skill、MCP 配置、plugin、hook，外加整层 `VERSION`、`CHANGELOG.md` 和 `shared-extensions@x.y.z` tag。

使用方自己的内容仓已经是跨机器携带的单元，也就是可 Compose 的共享 `.edges`。Compose 把这份仓挂进当前工作区。再维持一个平行隔间和一条独立 tag，新内容会被指到两处，版本线也和该仓自己的 Git 历史重复。隔间里的 mcp、plugins、hooks 在参考用法上是空的，继续为它们保留目录名没有落点。

同日文档曾先后把通用 skill 写成使用方 `.edges/skills/managed/`，再写成仓根 `skills/managed/`。用户随后确认：框架不要在这两处之间做规定。内容仓内部怎么放 skill，由该仓自己的布局决定。

## Decision

1. **废止隔间。** 使用方个人仓不再设 `shared-extensions/`。不要为新材料创建这个目录，不要再维护该层的 `VERSION` 或 `CHANGELOG.md`。`shared-extensions@6.0.0` 是该系列最后一版 annotated tag，打在使用方个人仓上，不打在本框架仓。之后不再打 `shared-extensions@*`。打 tag 和删除隔间由使用方自己的仓执行。
2. **材料归使用方内容仓，布局由该仓自定。** 不绑定 Edges 的通用 skill 与个人 harness 放使用方自己的内容仓。这份仓就是可 Compose 的共享 `.edges`，不另起隔间。它们不打进 `@viruspc/edges`，也不进入 `edges skills init` 的安装范围。框架不规定这些 skill 落在 `.edges/skills/managed/` 还是仓根 `skills/managed/`。
3. **跨机器靠 Compose。** 要在另一台机器或另一个工作区用到这些材料，用 `edges compose` 挂上使用方自己的内容仓。不为它们再写一套装进 `~/.agents/skills` 的全局安装。
4. **不新开 mcp / plugins / hooks 目录名。** 与 Edges 无关的 MCP 配置、plugin、hook 仍然不放本框架仓，也不再收回 `shared-extensions/` 下的同名目录。本决定不另起一套目录。若仍要跨机器携带，跟使用方自己的内容仓走，由 Compose 挂上；放在该仓的哪一层，由该仓自定。
5. **接入 Edges 的边界不变。** 为了让 Agent 或外部系统接入、操作 Edges 的 CLI、skill、MCP、服务、应用和 prompt，仍在本仓 `packages/` 下的对应目录。判据仍是「是不是为了接入或操作 Edges」，不是「换机器能不能带走」。

## Considered Options

- **只把 skill 搬进某一处 managed，隔间和 tag 继续留着：** 否决。空的 mcp / plugins / hooks 和独立版本线仍是第二套家。后来的材料还会被指回隔间。
- **把通用 skill 打进 `packages/skills/` 和 npm 包：** 否决。ADR 0036 把它们移出包，是因为它们不调用 edges。打进框架包会把使用方的方法跟框架一起发。
- **从使用方内容仓再装一份到全局 `~/.agents/skills`：** 否决。Compose 挂上使用方自己的内容仓之后，工作区里已经有这份材料。再装一份会和仓内副本分开走。
- **隔间删掉之后继续打 `shared-extensions@*`：** 否决。tag 系列表示这一层还在发版。最后一版标明废弃后停止。
- **由框架规定落在 `.edges/skills/managed/` 或仓根 `skills/managed/`：** 否决。两处都是内容仓自己可以选择的布局。框架只废止 `shared-extensions/`，不替使用方选定其中一种。

## Consequences

- 现行文档把「不绑定 Edges 的通用 skill 放哪」写成使用方自己的内容仓，经 `edges compose` 挂载，布局由该仓自定。根 `AGENTS.md` 的对应硬约束按此改写，不写死 `skills/managed` 路径。
- ADR 0036 仍决定：这些 skill 不进 npm 包，`edges skills init` 只装包内 skill。变的是包外那一份跟使用方内容仓走，而不是跟一个隔间走。
- ADR 0040 仍决定：框架仓没有 `extensions/` 层，`posts/` 在个人仓。变的是个人仓不再用 `shared-extensions/` 接收搬走的材料。
- 本仓 CHANGELOG 已发版段落、已完成的迁移说明里的当时事实、旧讨论和已完成任务卡里出现的 `shared-extensions/`，保留当时事实。读那些句子时，不要把它当成现在该写入的目录。
- 本 ADR 不改 CLI 行为，不移动使用方内容仓里的文件，也不改 Edges 自己作用域里受管 skill 的材料布局。
