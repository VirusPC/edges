---
name: project-memory-init
description: 在指定目录创建或修复项目记忆（AGENTS.md + .memory）。用户要求初始化项目记忆时使用；不覆盖已有正文。
version: 1.0.0
---

# Project Memory Init

在一个已存在的目录里建好 `.memory/` 的三个索引文件，并维护该目录的 `AGENTS.md` 索引。

两份文档，别混：

- [`references/PROTOCOL.md`](references/PROTOCOL.md) 是**协议**，冻结的。四个 skill 共同遵守，两个消费方（`project-memory-ask` 检索、`project-memory-remember` 沉淀）只以它为准。
- [`references/LAYOUT.md`](references/LAYOUT.md) 是协议的**实现**，三节与协议三条一一对应。本 skill 和 `project-memory-doctor` 共同拥有它，可以自由升级，只要不破协议。改了 `scripts/lib/blocks.py` 的标记常量就同步改那份文档，体检拿它当目标态，漂移了就没有判据。

所以升级实现时守住协议，两个消费方都不用跟着改，因为**它们各有一个自描述的东西可依赖**：`remember` 经 `scripts/memory.py` 落盘，`--help` 就是它看到的全部接口；`ask` 只认产物本身——每个链接后面那句说明就是挑选判据，而那些说明由脚本全量重算，永远和磁盘一致。所以别指望它们知道区块标记名、索引文件名或记忆目录名，也不必为改名去改它们。

## init 与体检的分界

**init 是单目标、只往前写的**：它只管一个目录，假设仓库是干净的，所以能整份渲染理想态；它也只处理自己这次动作引起的层级漂移。

需要**扫全树才能发现**的问题不属于 init——死条目、没被登记的记忆目录、重复条目、别人的 `AGENTS.md`。这些交给 `$project-memory-doctor`。

所以 init 遇到已有 `AGENTS.md` 时分两种情况：里面已有本套受管标记就做区块级刷新；只有别人的内容（手写正文、别的工具的受管块）就返回 `needs-doctor` 并且不动文件。碰到 `needs-doctor` 不要自己动手改，告诉用户跑 `$project-memory-doctor`。

## 步骤

1. 确认目标目录已经存在。`--root-dir` 可以省略，省略时按「Git 根目录 → 最近的祖先 `AGENTS.md` → 目标目录自身」的顺序推断。
2. 如果目标不是记忆根，补一句它的职责说明。说不清楚就写「`<目录名>` 目录的项目记忆与规范入口」，不要凭空猜业务。
3. 执行下面的命令，其中 `<skill-dir>` 是本 SKILL.md 所在的目录：

   ```bash
   python3 <skill-dir>/scripts/memory.py init \
     --target-dir <目录> \
     [--root-dir <工作区根>] \
     [--description <目录职责说明>]
   ```

4. 按脚本返回的 JSON 汇报结果。`agentsAction` / `autoAction` / `indexAction` 里出现 `needs-doctor` 要单独点出来；`inheritedEntries` 或 `detachedEntries` 非空说明有下层条目被移动过，也要说明。

## 规则

- 改动范围：目标目录的 `AGENTS.md` 与 `.memory/`、记忆根的 `AGENTS.md`（策略区块），以及登记本层时那一层祖先的 `AGENTS.md`。
- 已存在的索引文件一律不覆盖，受管区块之外的正文原样保留；重复执行只刷新受管区块。
- 所有生成的文案都来自 `references/templates/`，脚本运行时读取。模板名 = 产物名 + `.tmpl.md`，所以 `AGENTS.tmpl.md` 生成 `AGENTS.md`，`type_slug.tmpl.md` 生成 `<type>_<slug>.md`。要改文案，改模板，别改脚本。
- **扩展这套东西时守住一条：模板尽可能体现内容结构，脚本只做占位符替换。** 判据是「盯着模板能不能说出产物长什么样」。所以字段清单、行格式、类型清单都在模板里，不要为了省事挪回脚本。
- `scripts/` 按层分目录，依赖只朝下。入口仍是 `scripts/memory.py`（已发布契约，路径不改）。目录地图、改哪里、怎么跑见 [`scripts/OVERVIEW.md`](scripts/OVERVIEW.md)。
- 目标就是记忆根时，`indexAction` 返回 `not-applicable`。索引条目只在传了 `--description` 时才刷新已有描述，没刷新时 `indexDescription` 返回 `null`。
- 索引逐层披露：本层只登记直接下层的记忆目录，条目路径相对本层。「直接下层」按记忆层级算，不带记忆的中间目录被跳过。层级随记忆增减变化时，init 会自动把错位条目归位。
