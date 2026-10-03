# 项目记忆布局

[`PROTOCOL.md`](PROTOCOL.md) 的当前实现。作用域入口直接引用类型入口，两跳到正文；物理容器不增加发现层级。常规运行只使用 `.harness` 新布局；旧 `.memory` 由独立 `$project-memory-migrate` 转换，init / remember / add-type 拒绝旧层，doctor 只报告 `migration-required`，不移动或改写旧文件。

## 作用域与采用范围

`AGENTS.md` 是人和 Agent 的入口。本层硬约束直接写在所属层的 important 区块，已有规则不覆盖；本层索引和下层索引只放链接与描述。区块外手写内容、其他工具区块和业务模块入口保持原文。

通用推荐模块为 `memory`、`skills`、`tasks`；推荐不代表自动创建。Project Memory 只初始化用户选择的 Memory / Skills 类型，Tasks 和其他模块使用自己的契约。未采用的模块和类型不创建空目录。

```text
<scope>/
├── AGENTS.md
├── .harness/
│   ├── memory/<plural>/AGENTS.md
│   │                  └── <type>_<slug>.md
│   └── skills/
│       ├── managed/AGENTS.md
│       │           └── <name>/SKILL.md
│       └── referenced/AGENTS.md
└── .agents/skills/<name>/SKILL.md  # 原位正文或安装链接，只读
```

`.harness/`、`memory/`、`skills/` 无必经总入口，不创建 `.harness/skills/AGENTS.md`。下层作用域可跨多层目录，也可在 `.harness/evaluation` 等模块内；目录名称、源码包或业务 `AGENTS.md` 本身不表示独立作用域。

运行时 `is_scope()` 判据：本层 `AGENTS.md` 同时含 `project-memory` 外层标记和 `project-memory-local` 或 `project-memory-children` 区块。Skills-only 层同样满足；只有 Task 模块的层如要成为该树的独立作用域，也须显式提供此作用域契约。类型入口只含 entries/type 元数据，不是子层；Task 看板 AGENTS 不自动成为子层。Doctor 可发现有已采用类型但缺层入口的损坏层并修复，不把普通 `.harness` 目录当作用域。

根参数优先：`--root-dir` 明确封住树，不跨其他 Git root/submodule。未给时取 Git 根，否则最近的受管层入口，否则目标自身。扫描允许穿过 `.harness` 到达真实子层，但跳过其他隐藏目录、node_modules、符号链接目录和嵌套 Git 根。

## 选择式初始化

```bash
python3 <init-dir>/scripts/memory.py init --target-dir S --root-dir R \
  --memory-types project feedback reference user \
  --skill-types managed referenced
```

任一列表可省略；新层两个列表均省略时返回 `selectionRequired: true`、`recommendations`（模块与类型），不修改任何文件。已有层省略列表时只刷新已经采用的类型；显式列表只追加采用，不删旧类型。自定义类型不会被推荐清单重置。类型元数据与实际入口是注册事实源，无 JSON/YAML 注册表。

| type | 模块与入口（相对作用域） | 正文与权限 |
| --- | --- | --- |
| `user` | `.harness/memory/users/AGENTS.md` | `user_<slug>.md`；正文和索引整类 gitignore |
| `feedback` | `.harness/memory/feedbacks/AGENTS.md` | 用户纠正、有效做法和禁止模式 |
| `project` | `.harness/memory/projects/AGENTS.md` | 接手背景、决策、约定；不记可从代码推出的事实 |
| `reference` | `.harness/memory/references/AGENTS.md` | 资料指针 |
| `managed` | `.harness/skills/managed/AGENTS.md` | `<name>/SKILL.md` 及附属文件；工具可维护 |
| `referenced` | `.harness/skills/referenced/AGENTS.md` | 只索引当前层 `.agents/skills/<name>/SKILL.md`；不写正文或安装关系 |

这六个名字是可选官方类型，不是每层必建集合。旧 `skills` / `agent_skills` 不是运行时别名。官方入口优先级仍为 user → feedback → project → reference → managed → referenced。

## 自定义类型与格式

```bash
python3 <init-dir>/scripts/memory.py add-type --target-dir S \
  --module memory --name recipes --description '可复用操作手册' --skills-format
```

`--module memory|skills` 默认 memory。`--gitignore` 忽略整类正文及索引；`--index-only` 使 remember 拒绝写正文；`--skills-format` 采用 `<name>/SKILL.md`。模块、格式、可写性是独立维度。自定义 Skill 格式类型默认仍在 `.harness/memory/<原复数目录>`，不能因格式自动移到 skills。自定义类型身份全层唯一，跨模块重复登记报错；官方名称和路径不能被覆盖。外部自定义来源参数暂不支持。

类型入口特权注释为 `project-memory-type`，字段包括 `name`、`module`、`description`、`gitignore`、`writable`、`format`。省略 module 的现有自定义元数据默认 memory；`format` 为 `ordinary|skills`，布尔字段严格使用 `true|false`。未知元数据不影响发现，刷新仅替换 entries 区块，保留原 metadata 与手写引言。没有 metadata 的官方类型按官方契约推导；自定义类型必须保留 metadata 区块，且显式包含 writable 与 gitignore 权限字段；单个权限字段缺失也拒绝推断。索引或区块缺失时无法安全恢复身份与权限，报告 unsafe-layout 并拒绝写入，不能从目录名猜测可写/公开默认值。

`TypeSpec.index_file`、`discover_layer_types()` 的值和 `type_index_relpath()` 均为**作用域相对路径**，包含 `.harness/<module>/...`。`TypeSpec.module` 记录模块。消费者使用 `type_index_path(target, type)`、`type_content_dir(target, type)`；不能把全部 type 拼到 `memory_dir()` 下。

## 来源和写入边界

`remember --type managed --slug my-method --description '用途' --content '步骤'` 写本地 Skill。`referenced` 不接受 remember，即使元数据尝试开启 writable 也报错；`managed` 必须保持 writable: true 与 format: skills，元数据尝试改成只读或普通条目格式同样报错。类型与条目的真实路径必须留在选定 owner 内；受管容器、索引与写入路径上的符号链接不扩大权限。日常命令不更改安装链接。

每类只扫描当前来源的直接条目：普通记忆 `<type>_*.md`，Skill 格式 `*/SKILL.md`。不递归吸收子作用域或全机技能。只读安装根可链接外部来源；本地内容不能越出所属 type。每类内部按 realpath 去重，同名不同真源保留；同一真源同时属于 managed 和 referenced 时两份入口各自保留。

缺失、断链、无法读取/解码来源不是成功空扫描。init 返回 `complete: false` 和 `diagnostics`（含 `source-scan-error`）；doctor 在 findings/remaining 保留此诊断，刷新保持已有索引原字节。初次选择 referenced 时可以创建类型入口，但来源缺失仍报告不完整，绝不代建 `.agents/skills`。存在且可读的空来源才是成功的空清单。格式缺陷由 doctor 报 `invalid-entry`，不改原位正文；frontmatter 必须有起止分隔符，未闭合时即使出现 description 也不算有效。

私有类型写正文或索引前先补 Git 根 ignore：`.harness/<module>/<plural>/` 与 `**/.harness/<module>/<plural>/`，包含类型入口。无 Git 时返回 skipped-no-git；不会创建仓库。已采用类型被刷新时重新保证其私有忽略规则。

## 受管区块与条目

区块标记沿用 `<!-- project-memory:start -->` 外层，内部按 important → local → children；类型入口用 `project-memory-entries`，自定义特权元数据用 `project-memory-type`。层入口本层列表直接链到类型 AGENTS，下层列表只列最近的真正子层，保留原描述。修复不覆盖人工文本。

普通条目为 YAML frontmatter + Markdown，前缀仍是类型原值，slug 为 snake_case。Skill 格式 slug 为 kebab-case（1–64 字符），name 为目录名。详细字段见 [`frontmatter-fields.md`](frontmatter-fields.md)：顶层遵循 Agent Skills 闭集，实现字段放 `metadata.edges-*`；读取既有顶层字段不等于支持旧目录布局，常规 doctor 不重写文件头。

模板在 `templates/`：层入口 `AGENTS.tmpl.md`；官方类型 `USER/FEEDBACK/PROJECT/REFERENCE/MANAGED/REFERENCED.tmpl.md`；自定义类型 `TYPE.tmpl.md`；普通正文 `type_slug.tmpl.md`、Skill 正文 `SKILL.tmpl.md`；列表行 `entry_line.tmpl.md`。模板官方全集用于推荐与选中类型渲染，不自动采用全部类型。

## Doctor

默认只诊断；已有修复授权时使用 `--apply`。修复已采用官方类型的缺失入口（自定义入口丢失时无法恢复身份/权限，报告 unsafe-layout 要求恢复原索引）、漂移索引、漏登记或错位下层，补缺失硬约束区块；foreign AGENTS 只追加受管区块。不会初始化未采用类型、移动旧布局或改正文。返回 `findings`、`repaired`、`remaining`；每个 finding 同时含 `code` 与兼容消费字段 `issue`。无法读取的来源、无效正文和旧布局会留在 remaining，不宣称已全部修好。
