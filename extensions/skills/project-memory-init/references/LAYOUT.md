# 项目记忆布局

[`PROTOCOL.md`](PROTOCOL.md) 的实现。下面按产物层次说明具体布局，破折号后的解释语与协议一致。

可以自由升级，不破协议就行。**但凡改动已发布产物的名字**（区块标记、索引文件名、类型目录名、条目前缀），**要同步给 `$project-memory-doctor` 加旧名识别与改写**；区块内的固定文案不参与解析，改了不必管存量（见 doctor 的「已知缺口」）。改名不涉及两个消费方——它们不认名字，只认产物里读到的链接与说明。改了 `../scripts/lib/blocks.py` 的标记常量或 `templates/` 的结构，同步改这里。

```text
<仓库根>/
├── AGENTS.md                       # 本层记忆入口：硬约束 + 分类型入口清单 + 下层索引 + 自动化策略
├── .memory/
│   ├── FEEDBACK.md                 # 分类型入口：只列 feedbacks/ 下的记忆
│   ├── PROJECT.md                  # 分类型入口：只列 projects/ 下的记忆
│   ├── REFERENCE.md                # 分类型入口：只列 references/ 下的记忆
│   ├── SKILLS.md                   # 分类型入口：只列 skills/ 下的技能
│   ├── feedbacks/
│   │   └── feedback_<slug>.md      # 记忆文件：一条记忆一个文件，前缀即类型
│   ├── projects/
│   │   └── project_<slug>.md
│   ├── references/
│   │   └── reference_<slug>.md
│   └── skills/                      # 常规 Agent Skills 根目录，内部结构遵循其自身协议
└── <下层记忆目录>/                 # 记忆层级上的直接下层，目录深度任意
    ├── AGENTS.md                   # 本层记忆 + （若有）下层入口
    ├── .memory/                    # 结构同上
    └── <下层记忆目录>/             # 同样的结构可以逐层递归下去
        └── ...
```

## `AGENTS.md` — 本层记忆入口

记忆根是 git 根，没有 git 时取最近的祖先 `AGENTS.md`。

标记是 HTML 注释，成对出现：`<!-- <名字>:start -->` 与 `<!-- <名字>:end -->`，名字带工具前缀（本套是 `project-memory`）。

区块分两层：外层 `project-memory` 是本套在这份共享文件里的属地，本套写的东西全在它里面，顺序恒为 important → local → children → auto。

| 区块标记 | 出现在 | 内容 | 内容来源 |
| --- | --- | --- | --- |
| `<!-- project-memory:start -->` | 每个持有记忆或索引的目录 | 只是容器，本身不放内容 | 缺失时按需建壳 |
| ├ `<!-- project-memory-important:start -->` | 每个记忆目录 | 本层硬约束，规则直接写在区块里 | 人/agent 手写；缺失时用模板种子，已有正文不覆盖 |
| ├ `<!-- project-memory-local:start -->` | 每个记忆目录 | 本层四份分类型入口的清单 | 模板里的字面量 |
| ├ `<!-- project-memory-children:start -->` | 有下层记忆目录时 | 直接下层记忆目录的 `AGENTS.md` | 增量维护，一次 init 一条 |
| └ `<!-- project-memory-auto:start -->` | 仅记忆根 | 自动检索与沉淀策略 | 模板里的字面量 |

硬约束不进 `.memory/`、不做成索引行。旧文件没有这个区块时，`$project-memory-doctor` 认 `missing-important`，补上种子正文，不改区块外和其它内层。

内层区块一个都不剩时外层不留空壳（`prune_outer_region()`）——只持有索引的目录条目清空后，整块区域一起消失。记忆根走不到这一步：`auto` 一直在，外层跟着一直在。

下层条目的路径相对本层。举例：`src/DC/deep` 有记忆而 `src`、`src/DC` 都没有时，它直接挂在记忆根下，条目写 `src/DC/deep/AGENTS.md`。层级随记忆增减变化时，init 会把错位条目归位（`rehome_index_entries()`）。

## `FEEDBACK.md` / `PROJECT.md` / `REFERENCE.md` / `SKILLS.md` — 本层不同类型记忆入口

协议要求按 `type` 分入口，本实现取四类。四份入口都放在本层 `.memory/` 根部，正文按类型放进**复数**小写目录。每个入口各有一个 `<!-- project-memory-entries:start -->` 区块，内容从对应类型目录全量重算。

**条目**指区块里的一行，与记忆文件一一对应。入口是派生产物、不手写；行格式只存在于 [`templates/entry_line.tmpl.md`](templates/entry_line.tmpl.md)，下层索引与条目索引共用。

`feedback`、`project`、`reference` 沿用 [Claude Code auto memory](https://code.claude.com/docs/en/memory)；官方第四类 `user`（角色、专长、个人偏好）不落盘。本实现另加 `skills`，用于存放可被 Agent 直接发现和加载的标准技能。每类「记什么、不记什么」写在对应入口模板的引言里。

| type | 记忆入口 | 内容位置 | 收什么 |
| --- | --- | --- | --- |
| `feedback` | `FEEDBACK.md` | `feedbacks/feedback_<slug>.md` | 用户的纠正、确认过的做法、禁止模式 |
| `project` | `PROJECT.md` | `projects/project_<slug>.md` | 进行中的工作、时间点、代码里推不出的决策 |
| `reference` | `REFERENCE.md` | `references/reference_<slug>.md` | 项目外的信息去哪找 |
| `skills` | `SKILLS.md` | `skills/` | 可复用的能力说明、操作流程与使用规范 |

目录名是 type 的复数（已经以 `s` 结尾的不再追加），所以 `skills` 的目录名与类型名相同。`--type`、索引文件名、条目前缀仍用单数。`.memory/references/` 和 skill 根的 `references/`（PROTOCOL / LAYOUT / 模板）靠路径区分。旧版单数目录（`feedback/` / `project/` / `reference/`）由 `$project-memory-doctor` 原样改名为复数；新旧位置都在时只报告冲突。

## `<plural>/<type>_<slug>.md` — 详细记忆内容

本节只适用于 `feedback`、`project`、`reference`。`slug` 是小写 snake_case 且不带类型前缀，前缀由脚本按 `type` 加，父目录是 type 的复数。

结构是「扁平 YAML frontmatter + 正文」，字段清单与顺序看 [`templates/type_slug.tmpl.md`](templates/type_slug.tmpl.md)。落盘时**取不到的字段整行省略**。字段的值从哪来、更新时谁覆盖谁，见 [`frontmatter-fields.md`](frontmatter-fields.md)。

九个字段按协议地位分三档：`description` 是协议必需的；`name` / `type` / `updatedAt` 是协议的可选保留键，本实现总是写；其余五个（`title`、`originSessionId`、`agentClient`、`username`、`email`）只属于本实现。

## 模板

**模板名 = 产物文件名去掉后缀 + `.tmpl.md`**。入口模板与普通记忆模板仍统一放在 `templates/`，不按产物目录分层。下划线开头的是行片段，不对应产物；`type_slug.tmpl.md` 是唯一例外，产物名带尖括号，文件名改用角色词。`skills/` 遵循外部标准，不由普通记忆模板定义。

`AGENTS.tmpl.md` 把四对区块标记连嵌套关系一起写在里面。其中本层记忆区块的每一行就是一个类型声明，脚本从中推导 `type` 与索引文件名。索引文件名全大写；类型目录名取 type 的复数（`lib/paths.py` 的 `type_dir_name()`）；普通记忆的条目前缀仍取 `type` 原值，`skills` 的内部结构不在本实现中定义。
