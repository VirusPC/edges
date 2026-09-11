# 项目记忆布局

[`PROTOCOL.md`](PROTOCOL.md) 的实现。下面按产物层次说明具体布局，破折号后的解释语与协议一致。

可以自由升级，不破协议就行。**但凡改动已发布产物的名字**（区块标记、索引文件名、类型目录名、条目前缀），**要同步给 `$project-memory-doctor` 加旧名识别与改写**；区块内的固定文案不参与解析，改了不必管存量（见 doctor 的「已知缺口」）。普通记忆把实现字段从 YAML 顶层收进 `metadata:` 也算已发布线格式，由 `legacy-flat-frontmatter` 识别并改写文件头。改名不涉及两个消费方——它们不认名字，只认产物里读到的链接与说明。改了 `../scripts/lib/blocks.py` 的标记常量或 `templates/` 的结构，同步改这里。

```text
<仓库根>/
├── AGENTS.md                       # 本层记忆入口：硬约束 + 分类型入口清单 + 下层索引
├── .memory/                        # 工具的地盘：remember 落盘、索引全量重算、doctor 可改写
│   ├── USER.md                     # 分类型入口：只列 users/ 下的记忆（gitignore，不进 git）
│   ├── FEEDBACK.md                 # 分类型入口：只列 feedbacks/ 下的记忆
│   ├── PROJECT.md                  # 分类型入口：只列 projects/ 下的记忆（兜底）
│   ├── REFERENCE.md                # 分类型入口：只列 references/ 下的记忆
│   ├── SKILLS.md                   # 分类型入口：只列 skills/ 下自动沉淀的流程
│   ├── AGENT_SKILLS.md             # 分类型入口：只列 ../.agents/skills/ 下人写或装入的技能
│   ├── users/                      # 用户记忆条目；与 USER.md 一并 gitignore
│   │   └── user_<slug>.md
│   ├── feedbacks/
│   │   └── feedback_<slug>.md      # 记忆文件：一条记忆一个文件，前缀即类型
│   ├── projects/
│   │   └── project_<slug>.md
│   ├── references/
│   │   └── reference_<slug>.md
│   └── skills/
│       └── <name>/SKILL.md         # 自动沉淀的流程，形态遵循 Agent Skills 协议
├── .agents/                        # 人与生态的地盘：本套工具一个字节都不写
│   └── skills/                     # 生态标准位，人写或 `npx skills` 装入
└── <下层记忆目录>/                 # 记忆层级上的直接下层，目录深度任意
    ├── AGENTS.md                   # 本层记忆 + （若有）下层入口
    ├── .memory/                    # 结构同上
    └── <下层记忆目录>/             # 同样的结构可以逐层递归下去
        └── ...
```

## `AGENTS.md` — 本层记忆入口

记忆根是 git 根，没有 git 时取最近的祖先 `AGENTS.md`。

标记是 HTML 注释，成对出现：`<!-- <名字>:start -->` 与 `<!-- <名字>:end -->`，名字带工具前缀（本套是 `project-memory`）。

区块分两层：外层 `project-memory` 是本套在这份共享文件里的属地，本套写的东西全在它里面，顺序恒为 important → local → children。内层区块之间、以及内层与外层标记之间，各空一行（`prune_outer_region()` 每次写入都收成这样）。

| 区块标记 | 出现在 | 内容 | 内容来源 |
| --- | --- | --- | --- |
| `<!-- project-memory:start -->` | 每个持有记忆或索引的目录 | 只是容器，本身不放内容 | 缺失时按需建壳 |
| ├ `<!-- project-memory-important:start -->` | 每个记忆目录 | 本层硬约束，规则直接写在区块里 | 人/agent 手写；缺失时用模板种子，已有正文不覆盖 |
| ├ `<!-- project-memory-local:start -->` | 每个记忆目录 | 本层分类型入口的清单 | 模板里的字面量 |
| └ `<!-- project-memory-children:start -->` | 有下层记忆目录时 | 直接下层记忆目录的 `AGENTS.md` | 增量维护，一次 init 一条 |

硬约束不进 `.memory/`、不做成索引行。种子只有两句：ask / remember 的聚光灯（点名这两个日常 skill，不写用法、不编排 init / doctor / reshape），以及「硬约束写在本区块、不要链到 `.memory`」。各层自己的仓规手写追加在后面。不再单独成块。旧文件没有这个区块时，`$project-memory-doctor` 认 `missing-important`，补上种子正文，**已有规则不覆盖**。旧文件若还留着 `<!-- project-memory-auto:start -->`，`$project-memory-doctor` 认 `stale-auto`，删掉该区块。

内层区块一个都不剩时外层不留空壳（`prune_outer_region()`）——只持有索引的目录条目清空后，整块区域一起消失。记忆根至少有 important 和 local，外层跟着一直在。

下层条目的路径相对本层。举例：`src/DC/deep` 有记忆而 `src`、`src/DC` 都没有时，它直接挂在记忆根下，条目写 `src/DC/deep/AGENTS.md`。层级随记忆增减变化时，init 会把错位条目归位（`rehome_index_entries()`）。

## `USER.md` / `FEEDBACK.md` / `PROJECT.md` / `REFERENCE.md` / `SKILLS.md` / `AGENT_SKILLS.md` — 本层不同类型记忆入口

协议要求按 `type` 分入口，本实现取六类。**六份入口都放在本层 `.memory/` 根部**，正文按类型放进**复数**小写目录——`agent_skills` 是唯一例外，它的内容根在 `.memory/` 之外。每个入口各有一个 `<!-- project-memory-entries:start -->` 区块，内容从对应内容根全量重算。`.memory/USER.md` 与 `.memory/users/` 被 gitignore，不进 git；Agent 读的是本机这份 `USER.md`。

**条目**指区块里的一行，与记忆文件一一对应。入口是派生产物、不手写；行格式只存在于 [`templates/entry_line.tmpl.md`](templates/entry_line.tmpl.md)，下层索引与条目索引共用。

`feedback`、`project`、`reference` 沿用 [Claude Code auto memory](https://code.claude.com/docs/en/memory)；官方第四类 `user` 按 ADR-0003 落在仓库工作树内且 gitignore，按仓绑定。本实现另加两类可执行流程，按**谁有权改写**分开。

本层清单顺序是检索优先级：先更具体的 `user` / `feedback`，`project` 是兜底，然后 `reference`；`skills` / `agent_skills` 仍靠后。

| type | 记忆入口 | 内容位置 | remember 可写 | 收什么 |
| --- | --- | --- | --- | --- |
| `user` | `USER.md` | `users/user_<slug>.md` | 是 | 本仓个人偏好、凭据与不得公开材料；整类 gitignore |
| `feedback` | `FEEDBACK.md` | `feedbacks/feedback_<slug>.md` | 是 | 用户的纠正、确认过的做法、禁止模式 |
| `project` | `PROJECT.md` | `projects/project_<slug>.md` | 是 | 进行中的工作、时间点、代码里推不出的决策，以及项目内的规范；对不上更具体类型时的兜底 |
| `reference` | `REFERENCE.md` | `references/reference_<slug>.md` | 是 | 项目外的信息去哪找 |
| `skills` | `SKILLS.md` | `skills/<name>/SKILL.md` | 是 | 从会话里沉淀出来的可复用流程 |
| `agent_skills` | `AGENT_SKILLS.md` | `../.agents/skills/<name>/SKILL.md` | **否** | 人写或 `npx skills` 装入的标准技能 |

每类「记什么、不记什么」写在对应入口模板的引言里。

目录名是 type 的复数（已经以 `s` 结尾的不再追加），所以 `skills` 的目录名与类型名相同。`--type`、索引文件名、条目前缀仍用单数。用户记忆目录是 `users/`。`.memory/references/` 和 skill 根的 `references/`（PROTOCOL / LAYOUT / 模板）靠路径区分。旧版单数目录（`feedback/` / `project/` / `reference/`）由 `$project-memory-doctor` 原样改名为复数；新旧位置都在时只报告冲突。`user` 没有旧单数目录。

### `agent_skills`：唯一内容根在 `.memory/` 外的类型

`.agents/skills/` 是生态标准位（`npx skills` 扫描根表的首项，Codex / Amp / Cursor 等的项目级 skillsDir），但**只有仓库根那一层**会被各家 harness 扫到，嵌套层没有任何工具读。`AGENTS.md` 逐层索引是唯一 vendor 中立的嵌套发现机制，所以这一份索引不是冗余——它是嵌套层唯一的路。

两条硬规则：

- **本套工具绝不往 `.agents/` 写任何东西。** 不创建目录、不生成索引、不改写内容。`doctor` 对这一类跳过 `missing-type-dir` 与 `legacy-type-dir`，`apply` 阶段的补建目录也排除它——`.agents/skills/` 不存在就是正常状态，索引渲染成空清单。
- **索引条目的路径相对 `.memory/`**，所以会渲染成 `../.agents/skills/<name>/SKILL.md`。这是 `<plural>/` 相对写法之外的唯一形态，靠它一眼区分两类的来源。

内容根的映射在 `lib/paths.py` 的 `type_content_dir()`；`type_dir_name()` 那条「不以 s 结尾才加复数」对它不适用（`agent_skills` 结尾是 `s`，默认会落到 `.memory/agent_skills`，必须由映射覆盖）。

## `<plural>/<type>_<slug>.md` — 详细记忆内容

本节只适用于 `feedback`、`project`、`reference`、`user`。`slug` 是小写 snake_case 且不带类型前缀，前缀由脚本按 `type` 加，父目录是 type 的复数。`user` 的入口与目录被 gitignore，落盘形态与其他普通记忆相同。

落盘形态跟 [Agent Skills 规范](https://agentskills.io/specification) 同一套闭集：顶层只写 spec 认的键（本实现用 `name` / `description` / `metadata`），实现字段进 `metadata:`，键名前缀 `edges-`。字段清单与顺序看 [`templates/type_slug.tmpl.md`](templates/type_slug.tmpl.md)。落盘时**取不到的字段整行省略**。字段的值从哪来、更新时谁覆盖谁，见 [`frontmatter-fields.md`](frontmatter-fields.md)。

九个逻辑字段按协议地位分三档：`description` 是协议必需的；`name` / `type` / `updatedAt` 是协议的可选保留键，本实现总是写（后两个在 `metadata:` 里，不出现在 YAML 顶层）；其余五个（`title`、`originSessionId`、`agentClient`、`username`、`email`）只属于本实现，同样进 `metadata:`。

读兼容旧的扁平顶层键（`title` / `type` / `originSessionId` / `agentClient` / `username` / `email` / `updatedAt`）：解析时顶层与 `metadata:` 都收，两边都有则 `metadata:` 赢。doctor 的 `legacy-flat-frontmatter` 把旧文件头改写成当前模板，正文不动。

## `skills/<name>/SKILL.md` — 自动沉淀的流程

本节只适用于 `skills`。产物是一个合法的 [Agent Skills](https://agentskills.io/specification) 目录，所以将来可以原样搬进 `.agents/skills/`——那正是分成两类而不是一类的意义。

`--slug` 在这一类里是**目录名**，走 kebab-case（`^[a-z0-9]+(-[a-z0-9]+)*$`，1–64 字符），不是其余类型的 snake_case。spec 要求 `name` 必须等于父目录名，脚本据此填。

**出处与审计一律放进 `metadata:`，键名前缀 `edges-`。** spec 的顶层字段是闭集（`name` / `description` / `license` / `compatibility` / `metadata` / `allowed-tools`），`metadata` 是它唯一承诺「clients 不解释其内容」的命名空间。顶层塞自定义键在运行时通常不报错，但会跟将来某个 vendor 赋予同名字段的语义**静默撞车**，也过不了 Anthropic 的打包上传路径。字段清单看 [`templates/SKILL.tmpl.md`](templates/SKILL.tmpl.md)。

`edges-updated-at` 恒有值，所以 `metadata:` 不会退化成没有子键的空映射（那会被 Claude Code 当成非 map 丢掉）。**别把这个字段改成可选。**

`parse_frontmatter()` 会展开 `metadata:` 的 `edges-*` 子键（以及未加前缀的旧名）成内部字段名，供索引与更新使用；`title` 缺失时条目自动回落到 `name`。旧版把实现字段写在 YAML 顶层的文件仍然能读。

## 模板

**模板名 = 产物文件名去掉后缀 + `.tmpl.md`**。入口模板与记忆模板仍统一放在 `templates/`，不按产物目录分层。下划线开头的是行片段，不对应产物；`type_slug.tmpl.md` 是唯一例外，产物名带尖括号，文件名改用角色词。两份记忆模板都是 Agent Skills 闭集 + `metadata.edges-*`：`type_slug.tmpl.md` 多一个 `edges-type`（普通三类的 `type` 仍要落盘），`SKILL.tmpl.md` 不写 `type`（由目录位置编码）。`agent_skills` 没有模板——工具不写它。

`AGENTS.tmpl.md` 把三对内层区块标记连嵌套关系一起写在里面。其中本层记忆区块的每一行就是一个类型声明，脚本从中推导 `type` 与索引文件名。索引文件名全大写、可含下划线（`AGENT_SKILLS.md` → `agent_skills`）；内容根取 `lib/paths.py` 的 `type_content_dir()`；普通记忆的条目前缀仍取 `type` 原值。
