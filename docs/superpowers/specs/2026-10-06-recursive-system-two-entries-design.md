# 递归系统二入口与组成登记

状态：已落地（2026-10-06 用户批准；实施 Task 1–12 完成）。实施计划见 [recursive-system-two-entries](../plans/2026-10-06-recursive-system-two-entries.md)。不替代 [目录节点模型](2026-10-05-directory-node-model.md) 的已落地部分；与之冲突处以本文件与 ADR 0029 为准。层入口标记改名见 [project-harness-layer-markers](2026-10-06-project-harness-layer-markers-design.md)（该文标题表已被本文件 Q15c 翻案，见下「标题」）。

基线：本分支既有 CONTEXT / 记忆沉淀。

## 目的

行业上 `AGENTS.md` 是给 Agent 的系统二入口。Edges 把它做成**可递归的系统入口树**：每个系统入口登记本层系统维护信息与下层系统入口；系统一的组织清单与内容叶子用另一套入口合同。此前把 Task 列表、类型条目等系统一孩子塞进 `AGENTS.md` 的 `project-harness-local`，或把「有列表」等同于系统入口，都会名实错位。

本轮只定模型、入口合同、标记/标题、遍历规则与迁移边界。**不写生产代码**（Q16=A）；批准后另开 writing-plans。

## 架构图（目标模型）

下列图描述**目标语义**；现行代码仍可能是 InternalNode / LeafNode / `index.md`，落地前以本节为准。

### 1. 四种入口 × 派生状态

四种入口文件**都可以**成为组织节点：有组成登记 → 组织；无 → 叶子。`AGENTS.md` 作为系统入口时组成登记为必有（故通常总是组织节点）。

```mermaid
flowchart TB
  subgraph entries["入口合同（文件名）"]
    A["AGENTS.md"]
    R["README.md"]
    I["INDEX.md"]
    S["SKILL.md"]
  end

  subgraph state["派生状态（不持久化 isLeaf）"]
    Org["有组成登记 → 组织节点"]
    Leaf["无组成登记 → 叶子"]
  end

  A --> Org
  A --> Leaf
  R --> Org
  R --> Leaf
  I --> Org
  I --> Leaf
  S --> Org
  S --> Leaf
```

### 2. 目标领域形状：BaseNode 直继 + `type`

取消 `InternalNode` / `LeafNode` / `internal`。所有具体节点**直接**继承 `BaseNode`。沿用并扩展既有 `type` 字段，**不另造 `entryKind`**。

| `type` | 入口文件 | 含义 |
| --- | --- | --- |
| `agents` | `AGENTS.md` | 系统入口 |
| `readme` | `README.md` | 组织清单 |
| `task` / `memory` / `note` | `INDEX.md` | 业务内容 |
| `skill` | `SKILL.md` | Skill |
| `text` | 通常 `INDEX.md` | 兜底：普通文本内容 |

```mermaid
classDiagram
  class NodeReference {
    <<interface>>
    id: string
    name?: string
    description?: string
  }

  class BaseNode {
    path: string
    directoryPath: string
    type: agents|readme|task|memory|note|skill|text
    constraints?: string[]
    localChildren: NodeReference[]
    descendantChildren: NodeReference[]
    parent?: NodeReference
    harness?: NodeReference
    metadata?: Metadata
    body: string
    addChild(group, ref)
    parse / serialize / validate
  }

  class AgentsNode {
    <<AGENTS.md>>
    type = agents
  }
  class SuperAgentsNode {
    <<runtime>>
    虚拟超节点
    不落盘
    --super
  }
  class ReadmeNode
  class TaskNode
  class MemoryNode
  class NoteNode
  class SkillNode
  class TextNode {
    普通文本内容
  }

  NodeReference <|.. BaseNode
  BaseNode <|-- AgentsNode
  AgentsNode <|-- SuperAgentsNode
  BaseNode <|-- ReadmeNode
  BaseNode <|-- TaskNode
  BaseNode <|-- MemoryNode
  BaseNode <|-- NoteNode
  BaseNode <|-- SkillNode
  BaseNode <|-- TextNode
  BaseNode ..> NodeReference : parent / harness / children
```

组成能力在基类；组织/叶子由是否有组成登记派生。旧 `type: "internal"` 读兼容，写只发 `agents`。`SuperAgentsNode` 继承 `AgentsNode`（同为系统入口形状），无磁盘文件。

### 3. 同目录双文件 + 同合同下层递归

下层索引与本层入口**同合同**：`AGENTS` 下层 → `AGENTS`；`README` 下层 → `README`。本层内容可挂 INDEX / SKILL / 其它本层入口。

```mermaid
flowchart TB
  subgraph dir["某一目录（如仓根）"]
    AGENTS["AGENTS.md<br/>系统入口"]
    README["README.md<br/>组织清单"]
  end

  AGENTS -->|project-harness-local<br/>本层系统维护信息| M["系统二材料<br/>.harness/memory · skills · 维护看板 …"]
  AGENTS -->|project-harness-descendants<br/>下层系统维护信息| ChildAgents["其它目录 AGENTS.md"]

  README -->|project-entries-local<br/>本层内容| Sys1["INDEX / SKILL / 本层入口<br/>如 tasks/…、notes/…"]
  README -->|project-entries-descendants<br/>下层内容| ChildReadme["其它目录 README.md"]

  Sys1 -. 该目录若另有系统入口 .-> ChildAgents
  M -. harness；默认不跟随 .-> AGENTS
```

### 4. 默认 scope/AGENTS vs 显式 `--super` 虚拟超节点

虚拟超节点**必须**显式 `--super`；默认用当前 `--scope` 下 `AGENTS.md`。不得因 scope 下没有 `AGENTS.md` 自动合成。

```mermaid
flowchart LR
  CLI["edges --scope"] --> HasAgents{scope 有 AGENTS?}
  HasAgents -->|是| Real["真实系统入口"]
  HasAgents -->|否| Err["报错 / 既有发现失败<br/>不自动虚拟化"]

  Flag["--super"] --> Virtual["虚拟超节点<br/>不落盘"]
  Virtual --> RootReadme["Edges 根 README<br/>本层内容"]
  RootReadme --> Local["本层：INDEX/SKILL/…"]
  RootReadme -->|下层内容| NestedReadme["下层 README.md"]

  Real --> Maint["本层系统维护信息"]
  Real --> MaybeReadme["同目录 README？"]
  MaybeReadme -->|有| Content["本层/下层内容"]
  Maint --> NextSys["下层 AGENTS"]
  Content --> NestedReadme
  Content --> Local
```

默认：走全部组成边 `children`（local ∪ descendants）。只要本层时显式 `localOnly`（或等价）。`includeHarness` 仍默认 false。组成边 ≠ 维护边。

### 5. 仓库根实例（示意）

```mermaid
flowchart TB
  RootAgents["/AGENTS.md<br/>本层系统维护信息 → .harness/*<br/>下层系统维护信息 → teaching/AGENTS.md …"]
  RootReadme["/README.md<br/>本层内容 → tasks/ notes/ …<br/>下层内容 → 其它 README.md"]

  RootAgents --> HMem[".harness/memory/…"]
  RootAgents --> HTasks[".harness/tasks/…"]
  RootAgents --> Teaching["teaching/AGENTS.md"]

  RootReadme --> DomainTasks["tasks/… 本层入口"]
  RootReadme --> Notes["notes/… 本层入口"]
  RootReadme --> NestedR["某下层 README.md"]

  DomainTasks --> TP["Task Project README 或另 init 的 AGENTS"]
  TP --> TaskLeaf["Task · INDEX.md"]
  Notes --> NoteLeaf["Note · INDEX.md"]
```

## 已确认模型（grill Q1–Q16）

| 题 | 决定 |
| --- | --- |
| Q1=B | 节点身份：从 scope 对应的系统入口（或虚拟超节点）经组成登记可达 |
| Q2/Q5/Q6 | 入口概念是**系统入口**；文件名为 `AGENTS.md` |
| Q3=A | 不持久化 `isLeaf`；任意节点可 `addChildren`；有无组成登记只表示当前状态 |
| Q4 | CLI 传 `--scope`；正常以该 scope 下系统入口为根 |
| Q7=A | 系统入口**必须**带组成登记（推翻「AGENTS 不带 entries」） |
| Q8=A | Task / Note / Memory / Skill 由某系统入口（或组织清单）的组成登记挂入 |
| Q9 / Q11′=A | **虚拟超节点**不落盘：主体（如「人」）无真实 AGENTS 时用；个人任务查询是用例；实现另卡 |
| Q9b | Edges 根 `README.md` 增组成登记，指向 `tasks/` 等；`--super` 超节点经此再下钻 |
| 术语 | 对外名「虚拟超节点」；flag **`--super`**；类名 **`SuperAgentsNode` extends `AgentsNode`**（废止 VirtualSuperNode / virtual-root） |
| Q20=A | traverse 默认走全部 `children`（local∪descendants）；本层-only 用显式 `localOnly`；`includeHarness` 仍默认 false |
| Q10 | 任意目录可由用户 init 真实系统入口；配套 **project harness init** skill（演进现 `project-memory-init`） |
| Q12 | 组织清单 → `README.md`；内容叶子 → `INDEX.md`；Skill → `SKILL.md`；系统入口 → `AGENTS.md` |
| Q13=A | 同目录双文件：系统一孩子**只**在 README entries；AGENTS **只**挂系统二材料与下级系统入口（遍历核心规则） |
| Q14=B | 存量 `index.md`→`INDEX.md` 全部迁，**含 `posts/`**（本轮改名授权）；脚本套 CLI traverse，可预览、幂等 |
| Q15 | README 标记 `project-entries-local` / `project-entries-descendants`；标题见下 |
| Q15c | AGENTS 两章标题改为「系统维护信息」；硬约束标题不变 |
| Q16=A | 先本 spec + ADR，人审后再实施计划 |
| 架构审 1 | 四种入口均可因组成登记成为组织节点 |
| 架构审 3 | 下层同合同递归：AGENTS→AGENTS，README→README |
| 架构审 4 | 虚拟超节点须显式 `--super`；默认 scope/AGENTS；缺 AGENTS 不自动合成 |
| Q17 | 取消 Internal/Leaf/internal；各节点直继 BaseNode；`type` 扩展 `agents`/`readme`/`text`，不另造 entryKind |
| Q18=A | 类型入口统一为 `README.md` + `project-entries-*`（`type=readme`）；迁移后不用 `project-memory-entries` |

## 入口合同

| 角色 | 文件 | 组成登记 | 下层组指向 |
| --- | --- | --- | --- |
| 系统入口 | `AGENTS.md` | 必有：`project-harness-*`（外加 constraints） | 其它 `AGENTS.md` |
| 组织清单 | `README.md` | 可选：`project-entries-*` | 其它 `README.md` |
| 内容入口 | `INDEX.md` | 可选；有则当前为组织状态 | （若有下层组）同合同或按登记 |
| Skill | `SKILL.md` | 同 INDEX；同目录可另有 `AGENTS.md` 作 harness | 同上 |

四种入口都支持组织节点状态。不按文件名区分 Internal / Leaf 类；实现可保留过渡类名。

同一目录可以同时有 `AGENTS.md` 与 `README.md`（根目录即此形状）。**禁止**把同一批系统一孩子双写进两份文件。

## 标记与标题

### `AGENTS.md`（Project Harness）

| 区块 | HTML 标记 | Markdown 标题 |
| --- | --- | --- |
| 外层 | `project-harness` | （无独立 H2） |
| 硬约束 | `project-harness-constraints` | `本层硬约束` |
| 本层 | `project-harness-local` | `本层系统维护信息` |
| 下层 | `project-harness-descendants` | `下层系统维护信息` |

读兼容旧标题：`本层组成`、`本层记忆`、`下层节点`、`下层记忆索引`、`下层作用域`、`本层重要约束`。写只发上表。

本层系统维护信息：`.harness/memory`、skills、维护看板、evaluation、observation 等系统二材料，以及需要在本层发现的其它维护入口。下层系统维护信息：更窄作用域上的系统入口（其它目录的 `AGENTS.md`）。

### `README.md`（组织清单）

| 区块 | HTML 标记 | Markdown 标题 |
| --- | --- | --- |
| 本层 | `project-entries-local` | `本层内容` |
| 下层 | `project-entries-descendants` | `下层内容` |

给人看的说明可写在区块外；工具只改标记区块。根 README 的本层内容应能指向 `tasks/` 等本层入口（Q9b）；下层内容只登记其它 `README.md`。

### 类型入口（Q18=A）

类型入口（如 `.harness/memory/projects/` 下的索引）**统一为组织清单**：`README.md`，`type=readme`，组成用 `project-entries-*`。层 `AGENTS.md` 的本层系统维护信息链到这些 README。  
读兼容旧 `AGENTS.md` + `project-memory-type` / `project-memory-entries`；写与迁移后只发 README 规范。`project-memory-type` 身份头若仍需要区分「这是哪类记忆目录」，可留在 README 或目录约定里——实施计划定落点，但**列表区块不再用 `project-memory-entries`**。

## 遍历规则（核心）

1. 默认从 `--scope` 下真实 `AGENTS.md` 出发；**仅当显式 `--super`** 时才用虚拟超节点。缺 AGENTS 且未开 flag → 报错 / 发现失败，不静默虚拟化。
2. 展开系统入口的 **系统维护信息**：系统二材料 + 下层 `AGENTS.md`。默认不跟随 `harness`。
3. 同目录（或登记路径上的）`README.md` 的本层/下层内容展开系统一树；**不**从同目录 AGENTS 找系统一孩子。README 下层组只跟到其它 `README.md`。
4. `INDEX.md` / `SKILL.md` 无组成登记则不再下钻；有登记则按其 local/descendant 继续。
5. 默认展开全部 `children`；`localOnly` 才限制本层；`includeHarness` 显式才跟维护边。不得用目录扫描冒充组成。

## 虚拟超节点

- 不落盘；仅运行时对象。语义：相对当前 scope **再上一级** 的超节点。
- **须显式 `--super`**（CLI/API）开启；默认仍取 scope 下真实 `AGENTS.md`。
- 不因 scope 无 AGENTS 自动出现。
- 用途：主体无 AGENTS（个人根）时查询个人相关任务等。
- 挂载形状：经 Edges 根 README 的组成登记进入仓内树（Q9b）；不在超节点上扁平挂全部 Task 叶子。
- 实现类名：**`SuperAgentsNode` extends `AgentsNode`**（勿用 VirtualSuperNode）。

## 谁拥有系统入口

任意目录可由用户调用 init（现 `$project-memory-init`，演进为 **project harness init**）创建真实 `AGENTS.md`。不是路径白名单，也不要求每个 Task Project / 类型目录都是系统入口。未 init 的目录不要伪造系统入口标记。组织清单用 README+entries 即可列孩子。

## 迁移与非目标

**要做（实施阶段）：**

- codec / layout：README `project-entries-*`；AGENTS 新标题；读旧标题。
- 根 README 增加本层内容登记（Q9b）。
- 可预览脚本：`index.md`→`INDEX.md`，复用 `operations/traverse`，含 `posts/`（仅改名；不改博客正文）。
- project harness init skill 待办（已有卡则跟卡）。
- 去掉 InternalNode/LeafNode/internal；`type` 写入 `agents`/`readme`/`text`；领域不持久化 isLeaf。
- CONTEXT / ADR 0029 / models README 与本 spec 对齐（文档可在审前先改术语）。

**非目标：**

- 本轮不改 `.harness/` 目录名、`edges memory` 命令名、skill 目录名 `project-memory-*`。
- 不自动给所有目录铺 AGENTS。
- 不把虚拟超节点默认写成文件。
- 不借迁移改写 `posts/` 正文（改名除外）。
- （已批准）实施按计划分 Wave A/B，勿跳过迁移预览。

## 文档关系

- 术语：根 `CONTEXT.md`
- 修订 ADR 0024：`docs/adr/0029-recursive-system-two-entries.md`
- 原则摘要：`extensions/cli/src/domain/models/README.md`「设计原则」
- 记忆：`project_recursive_system_two_entry`、`project_document_entry_readme_index`、`project_grill_system_entry_q13_q14`、`project_grill_entries_markers_and_titles`、`project_harness_layer_markers`、`project_grill_q16_spec_and_adr_first`

## 验收（实施后）

- 新建/刷新的系统入口只含 `project-harness` 标记与「本层硬约束 / 本层系统维护信息 / 下层系统维护信息」。
- 组织清单只含 `project-entries-*` 与「本层内容 / 下层内容」。
- 同目录双文件 traverse 单测：系统一孩子不出现在 AGENTS 组成解析结果中。
- `index.md` 迁移 dry-run / apply 幂等；posts 仅文件名变更。
- 旧 AGENTS 标题仍能 parse；写回为新标题。

## 开放实施题（不阻塞本 spec 语义）

- 旧 `InternalNode` / `LeafNode` 类是删除还是短暂兼容别名（语义上已取消）。
- 类型目录里原 `project-memory-type` 身份信息迁到 README 何处（YAML / HTML 注释 / 文件名约定）。
- 已锁定 flag 名 `--super`；挂载默认经根 README 组成（Q9b）。
