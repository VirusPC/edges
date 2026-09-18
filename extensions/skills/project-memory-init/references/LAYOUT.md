# 项目记忆布局

[`PROTOCOL.md`](PROTOCOL.md) 的实现。下面按产物层次说明具体布局，破折号后的解释语与协议一致。

可以自由升级，不破协议就行。**但凡改动已发布产物的名字**（区块标记、索引文件名、类型目录名、条目前缀），**要同步给 `$project-memory-doctor` 加旧名识别与改写**；区块内的固定文案不参与解析，改了不必管存量（见 doctor 的「已知缺口」）。普通记忆把实现字段从 YAML 顶层收进 `metadata:` 也算已发布线格式，由 `legacy-flat-frontmatter` 识别并改写文件头。改名不涉及两个消费方——它们不认名字，只认产物里读到的链接与说明。改了 `../scripts/lib/blocks.py` 的标记常量或 `templates/` 的结构，同步改这里。

**扩展一个 Memory Type（ADR 0006，入口形态见 ADR 0012）：** 只改本文件描述的产物——该层 `.memory/<plural>/AGENTS.md` 类型入口、同目录条目、以及层入口 `AGENTS.md` 本层清单一行。用 `$project-memory-add-type`（`memory.py add-type`）登记。**不要**另写 JSON/YAML 类型注册表。PROTOCOL 不枚举类型。官方 init 种子仍是下表六类；`docs` / `progress` / `tasks` / `research` / `reminder` / `scheduler` 只作文档与测试冒烟，不进种子。

```text
<仓库根>/
├── AGENTS.md                       # 层入口：硬约束 + 类型入口清单 + 下层索引
├── .memory/                        # 工具的地盘：remember 落盘、索引全量重算、doctor 可改写
│   ├── users/                      # 用户记忆；整类 gitignore（含本目录 AGENTS.md）
│   │   ├── AGENTS.md               # 类型入口：引言 + 只列本目录条目
│   │   └── user_<slug>.md
│   ├── feedbacks/
│   │   ├── AGENTS.md               # 类型入口：引言 + 只列本目录条目
│   │   └── feedback_<slug>.md      # 记忆文件：一条记忆一个文件，前缀即类型
│   ├── projects/
│   │   ├── AGENTS.md
│   │   └── project_<slug>.md
│   ├── references/
│   │   ├── AGENTS.md
│   │   └── reference_<slug>.md
│   ├── skills/
│   │   ├── AGENTS.md
│   │   └── <name>/SKILL.md         # 自动沉淀的流程，形态遵循 Agent Skills 协议
│   └── agent_skills/
│       └── AGENTS.md               # 类型入口：只列 .agents/skills/；永不写入 .agents/
├── .agents/                        # 人与生态的地盘：本套工具一个字节都不写
│   └── skills/                     # 生态标准位，人写或 `npx skills` 装入
└── <下层记忆目录>/                 # 记忆层级上的直接下层，目录深度任意
    ├── AGENTS.md                   # 层入口：本层记忆 + （若有）下层入口
    ├── .memory/                    # 结构同上
    └── <下层记忆目录>/             # 同样的结构可以逐层递归下去
        └── ...
```

存量平铺索引（`.memory/USER.md` / `FEEDBACK.md` / `PROJECT.md` / `REFERENCE.md` / `SKILLS.md` / `AGENT_SKILLS.md`）由 `$project-memory-doctor` 认 `legacy-flat-index`：搬到对应 `<plural>/AGENTS.md` 后删除旧文件。新旧入口都在且内容不同时认 `legacy-flat-index-conflict`，不覆盖。`user` 迁到 `users/AGENTS.md`（仍 gitignore）；`agent_skills` 迁到 `.memory/agent_skills/AGENTS.md`，永不写入 `.agents/`。

## `AGENTS.md` — 本层记忆入口

记忆根是 git 根，没有 git 时取最近的祖先 `AGENTS.md`。

标记是 HTML 注释，成对出现：`<!-- <名字>:start -->` 与 `<!-- <名字>:end -->`，名字带工具前缀（本套是 `project-memory`）。

区块分两层：外层 `project-memory` 是本套在这份共享文件里的属地，本套写的东西全在它里面，顺序恒为 important → local → children。内层区块之间、以及内层与外层标记之间，各空一行（`prune_outer_region()` 每次写入都收成这样）。

| 区块标记 | 出现在 | 内容 | 内容来源 |
| --- | --- | --- | --- |
| `<!-- project-memory:start -->` | 每个持有记忆或索引的目录 | 只是容器，本身不放内容 | 缺失时按需建壳 |
| ├ `<!-- project-memory-important:start -->` | 每个记忆目录 | 本层硬约束，规则直接写在区块里 | 人/agent 手写；缺失时用模板种子，已有正文不覆盖 |
| ├ `<!-- project-memory-local:start -->` | 每个记忆目录 | 本层类型入口清单，链到 `.memory/<plural>/AGENTS.md` | 种子来自模板；用户 type 由 add-type 追加一行 |
| └ `<!-- project-memory-children:start -->` | 有下层记忆目录时 | 直接下层记忆目录的 `AGENTS.md` | 增量维护，一次 init 一条 |

硬约束不进 `.memory/`、不做成索引行。种子只有两句：ask / remember 的聚光灯（点名这两个日常 skill，不写用法、不编排 init / doctor / reshape），以及「硬约束写在本区块、不要链到 `.memory`」。各层自己的仓规手写追加在后面。不再单独成块。旧文件没有这个区块时，`$project-memory-doctor` 认 `missing-important`，补上种子正文，**已有规则不覆盖**。旧文件若还留着 `<!-- project-memory-auto:start -->`，`$project-memory-doctor` 认 `stale-auto`，删掉该区块。

内层区块一个都不剩时外层不留空壳（`prune_outer_region()`）——只持有索引的目录条目清空后，整块区域一起消失。记忆根至少有 important 和 local，外层跟着一直在。

下层条目的路径相对本层。举例：`src/DC/deep` 有记忆而 `src`、`src/DC` 都没有时，它直接挂在记忆根下，条目写 `src/DC/deep/AGENTS.md`。层级随记忆增减变化时，init 会把错位条目归位（`rehome_index_entries()`）。

## `<plural>/AGENTS.md` — 本层不同类型记忆入口

协议要求按 `type` 分入口。官方 init 种子是六类；本层还可以有用户登记的 type。发现顺序以本层 `AGENTS.md` 的 `project-memory-local` 清单为准；清单链到 `.memory/<plural>/AGENTS.md`，发现（概念上的 `index_files()`）跟着这些链接走，而不是再从链接 basename 拼出一份根部 `TYPE.md`。**种子入口都放在对应复数目录的 `AGENTS.md`**，条目与入口同处——`agent_skills` 的内容根仍在 `.memory/` 之外，但它的类型入口现在也在 `.memory/agent_skills/AGENTS.md`。每个入口各有一个 `<!-- project-memory-entries:start -->` 区块，内容从对应内容根全量重算。`.memory/users/`（含 `users/AGENTS.md`）被 gitignore，不进 git；Agent 读的是本机这份类型入口。

类型入口与层入口同名、契约不同：类型入口只有引言 + 条目清单，**没有** important / local / children。类型入口与条目同目录；部分 harness 读条目时会顺带加载同目录 `AGENTS.md`——接受，类型入口保持短小，不要写入层入口那三类区块。

用户登记的 type 可在入口文件里写特权注释 `<!-- project-memory-type:start -->` … `<!-- project-memory-type:end -->`，字段是 `name` / `description` / `gitignore` / `writable` / `format`（`ordinary` 或 `skills`）。已实现的 flag：`gitignore`（按 ADR-0003 的目录 pattern 追加仓库根 `.gitignore`；类型入口随 `users/` 一类目录被挡住，存量根部 `USER.md` 迁走前仍按 ADR-0003 挡住）、`writable: false`（`--index-only`，remember 拒绝、doctor 不报 `missing-type-dir`）、`format: skills`（条目形态与 `skills` 相同）。内容根放在 `.memory/` 外仍只有官方 `agent_skills`；`--external-content-dir` 本轮是 stub。

**条目**指区块里的一行，与记忆文件一一对应。入口是派生产物、不手写；行格式只存在于 [`templates/entry_line.tmpl.md`](templates/entry_line.tmpl.md)，下层索引与条目索引共用。

`feedback`、`project`、`reference` 沿用 [Claude Code auto memory](https://code.claude.com/docs/en/memory)；官方第四类 `user` 按 ADR-0003 落在仓库工作树内且 gitignore，按仓绑定，索引路径按 ADR 0012 改为 `users/AGENTS.md`。本实现另加两类可执行流程，按**谁有权改写**分开。

本层清单顺序是检索优先级：先更具体的 `user` / `feedback`，`project` 是兜底，然后 `reference`；`skills` / `agent_skills` 仍靠后。

| type | 记忆入口 | 内容位置 | remember 可写 | 收什么 |
| --- | --- | --- | --- | --- |
| `user` | `users/AGENTS.md` | `users/user_<slug>.md` | 是 | 本仓个人偏好、凭据与不得公开材料；整类 gitignore |
| `feedback` | `feedbacks/AGENTS.md` | `feedbacks/feedback_<slug>.md` | 是 | 用户的纠正、确认过的做法、禁止模式 |
| `project` | `projects/AGENTS.md` | `projects/project_<slug>.md` | 是 | 进行中的工作、时间点、代码里推不出的决策，以及项目内的规范；对不上更具体类型时的兜底 |
| `reference` | `references/AGENTS.md` | `references/reference_<slug>.md` | 是 | 项目外的信息去哪找 |
| `skills` | `skills/AGENTS.md` | `skills/<name>/SKILL.md` | 是 | 从会话里沉淀出来的可复用流程 |
| `agent_skills` | `agent_skills/AGENTS.md` | `.agents/skills/<name>/SKILL.md` | **否** | 人写或 `npx skills` 装入的标准技能 |

用户后加的 type 与普通种子同构：`--name docs` → 入口 `docs/AGENTS.md`、条目前缀 `docs_`。`tasks` Memory Type 的目录是 `.memory/tasks/`，与 `knowledge/tasks/` 看板不是同一套文件。

每类「记什么、不记什么」写在对应入口模板的引言里。类型入口由既有类型模板（`FEEDBACK.tmpl.md`、`USER.tmpl.md`、`TYPE.tmpl.md` 等）生成，**不用**层入口的 `AGENTS.tmpl.md`。

目录名是 type 的复数（已经以 `s` 结尾的不再追加），所以 `skills` 的目录名与类型名相同。`--type`、条目前缀仍用单数。用户记忆目录是 `users/`。`.memory/references/` 和 skill 根的 `references/`（PROTOCOL / LAYOUT / 模板）靠路径区分。旧版单数目录（`feedback/` / `project/` / `reference/`）由 `$project-memory-doctor` 原样改名为复数；新旧位置都在时只报告冲突。`user` 没有旧单数目录。根部平铺的 `FEEDBACK.md` 一类旧入口见上文迁移意图。

### `agent_skills`：唯一内容根在 `.memory/` 外的类型

`.agents/skills/` 是生态标准位（`npx skills` 扫描根表的首项，Codex / Amp / Cursor 等的项目级 skillsDir），但**只有仓库根那一层**会被各家 harness 扫到，嵌套层没有任何工具读。层入口逐层索引是唯一 vendor 中立的嵌套发现机制，所以这一份类型入口不是冗余——它是嵌套层唯一的路。

类型入口在 `.memory/agent_skills/AGENTS.md`（ADR 0012）。内容根仍在 `.agents/skills/`。两条硬规则：

- **本套工具绝不往 `.agents/` 写任何东西。** 不创建目录、不生成索引、不改写内容。`doctor` 对这一类跳过内容根的 `missing-type-dir` 与 `legacy-type-dir`，`apply` 阶段的补建也排除 `.agents/`——`.agents/skills/` 不存在就是正常状态，类型入口渲染成空清单。`.memory/agent_skills/` 只装这份类型入口，不是内容根。
- **索引条目的路径指向 `.agents/skills/`**，相对写法随入口下沉到 `agent_skills/AGENTS.md` 而改。这是同目录相对写法之外的唯一形态，靠它一眼区分两类的来源。

内容根的映射在 `lib/paths.py` 的 `type_content_dir()`。`agent_skills` 结尾是 `s`，`type_dir_name()` 默认会落到 `.memory/agent_skills`——现在这个目录名正好是类型入口所在处；内容根仍必须由映射指到 `.agents/skills/`，不能把 `.memory/agent_skills/` 当成技能正文目录。

## `<plural>/<type>_<slug>.md` — 详细记忆内容

本节只适用于 `feedback`、`project`、`reference`、`user`。`slug` 是小写 snake_case 且不带类型前缀，前缀由脚本按 `type` 加，父目录是 type 的复数。`user` 的类型入口与目录被 gitignore，落盘形态与其他普通记忆相同。

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

**模板名 = 产物文件名去掉后缀 + `.tmpl.md`**，类型入口是例外。类型入口的产物现为 `<plural>/AGENTS.md`，但仍由既有类型模板（`FEEDBACK.tmpl.md`、`USER.tmpl.md`、`PROJECT.tmpl.md`、`REFERENCE.tmpl.md`、`SKILLS.tmpl.md`、`AGENT_SKILLS.tmpl.md`、`TYPE.tmpl.md`）渲染，**不改用**层入口的 `AGENTS.tmpl.md`。模板文件名暂时仍跟旧产物名；实现落地时只改输出路径与文件名，不改模板正文形状。入口模板与记忆模板仍统一放在 `templates/`，不按产物目录分层。下划线开头的是行片段，不对应产物；`type_slug.tmpl.md` 是另一处例外，产物名带尖括号，文件名改用角色词。两份记忆模板都是 Agent Skills 闭集 + `metadata.edges-*`：`type_slug.tmpl.md` 多一个 `edges-type`（普通三类的 `type` 仍要落盘），`SKILL.tmpl.md` 不写 `type`（由目录位置编码）。`agent_skills` 的类型入口用 `AGENT_SKILLS.tmpl.md`；工具仍不写 `.agents/` 下的技能正文。

`AGENTS.tmpl.md` 把三对内层区块标记连嵌套关系一起写在里面，只用于层入口。层入口本层清单链到 `.memory/<plural>/AGENTS.md`；**运行时** remember / doctor / ask 从该层入口 / 类型入口产物发现。内容根取 `lib/paths.py` 的 `type_content_dir()`；普通记忆的条目前缀仍取 `type` 原值。
