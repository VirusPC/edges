---
name: project_node_resource_unit_decision
description: 递归目录与 harness 的现行决定及理由；模型与公开目录已采用，历史讨论保留但不替代现行 spec，私有材料逐克隆审阅。
metadata:
  edges-title: 节点目录单元与组织关系设计
  edges-type: project
  edges-agent-client: codex
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T19:44:23+08:00'
---
## 2026-10-05 现行结论：目录节点模型已收敛

用户确认目录为统一内容单元，物理目录决定唯一父归属，索引承担本层／下层发现；harness 是独立维护关系，遍历组成不自动进入下一层 harness。

**Why:** 让内容与附件共享生命周期，同时防止检索维护内容时无限进入它自身的维护系统。普通跨目录引用不得改变所有权，局部记忆不得因通用递归而上收根层。

**How to apply:** 现行合同见[目录节点模型](../../../../docs/superpowers/specs/2026-10-05-directory-node-model.md)及[迁移指南](../../../../docs/recursive-layout-migration.md)。模型与 CLI 已接入、公开目录采用已完成；旧日志仅检查存在性并拒绝目录转换，不读取其私有快照。本轮不处理真实私有材料、不建设 extensions/memory，也不把 Agent Teams 或自动 RSI 宣称为已交付。

## 历史讨论记录（以下“尚未实现／待讨论”仅指当时）


## 2026-10-05 最新用户决定：统一目录形式，重新讨论基础领域模型

用户明确决定统一采用目录形式，并在此基础上重新讨论基础领域模型与数据结构。单文件与目录不再作为长期并存的两种内容形式；这不是仅修改创建默认值。下文双格式说明是旧实现基线，不能作为新设计目标。

**Why:** 内容及其附件应有统一的资源单元，后续扩展不应再触发单文件到目录的格式转换；同时 AGENTS 的组织职责与内容入口不同，必须明确遍历边界。

**How to apply:** 以目录统一为已确认约束开展模型设计；节点身份与目录/入口文件的对应关系、同目录 AGENTS 与内容入口如何建模、引用与遍历规则仍需讨论。不得据此宣称新模型已实现、批准具体历史数据迁移，或擅自取消先前的可选父子引用要求。讨论依据见[八项执行选择讨论稿](../../../../docs/discussions/2026-10-05-implementation-rulings.md)。

## 先前实现与讨论记录

节点的逻辑归属由 AGENTS 引用决定，物理资源归属只由明确的目录入口合同决定；邻近文件不能自动归属于节点。

**Why:** 单文件旁边可能放着共享附件或其他节点；按物理 dirname 猜归属会让移动、删除和导入触及未授权内容。Skill 则按标准以完整 SKILL.md 目录为单位。

**How to apply（本轮重新设计前的实现基线）:** Task、Memory、Note 可以选择单文件或 index.md 目录入口，Skill 使用 SKILL.md 目录入口。创建目录节点时只导入调用方明确指定的资源目录；已有节点不隐式合并或转换格式。逻辑 reparent 只更新索引，物理 move 限于同文件系统与同入口格式，并拒绝 AGENTS.md 路径移动。多文件写入采用快照校验与可恢复错误报告，不承诺进程崩溃时的原子性。2026-10-05 的[独立纠正计划](../../../../docs/superpowers/plans/2026-10-05-recursive-node-ownership-correction.md)已完成统一节点识别和 43 条公开局部记忆归属恢复；其他克隆的私有记录仍须依据可信本机 journal 显式审阅。


## 2026-10-05 用户补充：遍历时区分组织入口与内容入口

用户强调 AGENTS.md 与 index.md / SKILL.md 的职责差别必须体现在树遍历中。

**Why:** AGENTS 组织本层约束和逻辑归属索引；普通内容及 Skill 的正文、附件不是同一种组织索引。统一目录资源单元不等于遍历所有物理子目录，也不等于同目录的不同入口可以相互替代。

**How to apply:** 后续设计需要分别表达节点角色（组织或内容）与引用关系（local 或 descendant）；沿已登记入口加载，不因发现附件、普通正文链接或同目录 AGENTS 就自动展开。已核对当前 traverse 依据所有 BaseNode 的可选 children 递归，仅按 kind 筛选，尚未实现严格的组织节点展开策略。是否限制内容节点的 children、同目录多个入口如何显式组织，仍需细化，不能据此删除用户此前确认的 BaseNode 可选 parent/children。当前代码仍支持双格式；后续统一目录化与遍历策略的讨论见[八项执行选择讨论稿](../../../../docs/discussions/2026-10-05-implementation-rulings.md)。


## 2026-10-05 用户补充：组成节点包括 Skill 及其他扩展类型

用户指出组成示例遗漏 Skills，并进一步要求考虑其他扩展节点，例如 Notes 可以使用通用 Index.md 入口。

**Why:** 系统二的组成不是封闭的“记忆＋任务”清单；不同业务内容可以共享目录与 Markdown 表达，而每个组成节点又可以有自己的维护系统。

**How to apply:** 新模型须允许 Skill 和其他扩展节点参与已登记组成关系；通用 Markdown 行为可复用基础内容模型，不能仅因新增内容名称就要求新增专用模型类。专用类型与方法的具体划分仍待设计，现有 NoteNode 等类未修改。通用入口不单独决定业务类型，系统一／二不是固定内容类型；读取组成节点不自动加载其自身系统二。用户示例 Index.md 与当前 index.md 的大小写尚未单独确定。


## 2026-10-05 用户明确：领域模型只维护 Markdown 节点

模型只处理 Markdown 节点及其关系，不把图片、脚本等资源纳入领域模型。 用户进一步明确，资源到使用时由 AI 根据任务与节点内容决定如何使用；模型不预先枚举、分类或编排资源。

**Why:** 用户指出管理资源会使基础模型复杂化；统一目录存放不要求为目录内全部文件建立领域对象。

**How to apply:** 基础模型不引入 Resource 对象、附件索引或资源子节点；组成与维护关系仅围绕明确登记的 Markdown 节点讨论。目录中非 Markdown 文件保持文件系统层面的存在，不能因此扫描成逻辑子节点。物理移动、删除和导入的服务边界另行设计，不将“模型不理会资源”解释为可以遗失或删除资源。NodeReference、parent/children 的既有约定仍需结合新模型讨论；独立 harness 字段只是助手提出的方案，未获用户确认。当前实现与 spec 尚未按本次收敛重构。


## 2026-10-05 最新模型讨论：Internal / Leaf 与通用 harness

用户提出 BaseNode 下区分 InternalNode 和 LeafNode，TaskNode、MemoryNode、SkillNode 继承 LeafNode；明确每个 Node 可以有自己的 harness，指向另一个 BaseNode。

**Why:** 组成树的组织节点与叶子应明确区分，但每个节点仍可能拥有自己的维护系统；维护角色不限制为某一种固定内容类型。

**How to apply:** harness 作为所有 BaseNode 可选的独立维护关系，目标允许任意 BaseNode 派生类型，不限定 InternalNode。沿用此前引用与按需加载约定，领域上指向 BaseNode，持久化/内存引用表达仍待新 spec 细化，不据此改成递归嵌套对象或自动创建。普通 children 遍历不跟随 harness；检索当前系统二不自动加载其自身及内部组成节点的 harness。Leaf 无组成子节点仍可有 harness。前文将独立 harness 字段标为未确认属于此前讨论状态，已由此更新；children 在 BaseNode 的只读接口与具体存储规则仍待定，代码未修改。


## 2026-10-05 属性讨论：叶子标志

用户提出需要一个标志属性表明节点是否为叶子。

**Why:** 通用调用方需要明确识别组成树中的叶子；不能把空组织节点误认为叶子，也不能把独立 harness 当成组成子节点。

**How to apply:** 建议 BaseNode 暴露只读 isLeaf，由 InternalNode 固定返回 false、LeafNode 及其子类固定返回 true；不重复保存可变布尔状态，不写入 YAML，不根据 children.length 或 harness 的有无推断。该 getter 形式是助手建议，尚未修改代码或正式 spec。


## 2026-10-05 NodeReference 讨论：引用复用与组织形态

用户同意保留引用按需加载 BaseNode、复用一种 NodeReference，以及 parent/harness 的关系由属性位置表达，不重复编码进 kind。用户提出 local/descendant 或许应在节点层体现组织形态差异。

**Why:** 用户希望区分节点自身的组织形态与引用的职责，避免引用携带本应由节点模型表达的语义。

**How to apply:** 前三项作为已确认约束；local/descendant 是否迁至节点属性、如何表达仍待讨论，不直接删除现有 kind。特别是本层分类 AGENTS 也是 InternalNode，不能未经确认将 local/descendant 简化成 Leaf/Internal；也不能恢复此前被否定的节点资格门槛。索引分组与下层作用域边界是待讨论的候选解释，不作为已确认的新节点类型。


## 2026-10-05 术语纠正：撤回临时创造的节点类别

用户质疑“分类索引节点／作用域节点”的来源；这两个词是助手临时创造，不是用户决定或已有领域定义，相关新增节点分类提议已撤回。

**Why:** 助手把用户“local/descendant 或许应在 Node 层体现组织形态”的探索性建议，未经确认解释为新的两类节点，偏离已确认的统一模型。

**How to apply:** 前文该候选解释仅作为历史讨论，不纳入当前设计。继续使用已确认的 BaseNode、InternalNode、LeafNode 与独立 harness 关系讨论；local/descendant 的后续表达仍待澄清，不擅自引入新的节点类别或独立作用域资格标准。


## 2026-10-05 进一步澄清：仅本层与下层

用户明确 local/descendant 只是“本层和下层”，无需创造节点类别。

**Why:** 用户希望沿用已有层级含义，不接受为解释关系而新增术语和分类。

**How to apply:** 在已有 InternalNode 的组织结构内讨论本层与下层，保持 AGENTS 三部分约定。采用两组 NodeReference 表达本层与下层；用户随后明确命名为 localChildren 与 descendantChildren。children 为合并后的派生视图，引用移除 kind；字段命名已确认，可变性及写入 API 仍待细化，代码尚未修改。harness 的维护关系保持独立，不把本层／下层直接等同系统一／系统二。


## 2026-10-05 用户审查确认：遵循目录约定与节点生命周期

用户确认 Internal/Leaf 继承、唯一 parent、两组直属 children 与 isLeaf 语义；说明唯一 parent 的依据是遵循文件系统，遍历和环处理主要看目录。.harness 不算传统 children，但属于节点的维护关系。

**Why:** 文件目录已有明确结构约定，不应为模型再引入一套猜测或重复关系；组成遍历的边界与节点生命周期必须分别表达。

**How to apply:** 通用 MD 入口类型按目录结构约定识别，用户建议将约定集中到 TS 或 schema 文件，具体形式仍待定。加载 SkillNode 时按约定定位其 AGENTS.md harness（InternalNode），该同目录例子已确认，不需要反复讨论身份冲突。harness 的通用目标仍是 BaseNode。用户明确删除 Skill 叶子节点应同步删除对应 AGENTS harness，修正此前“删除 MD 不涉及 harness”的助手建议；不参与 children 并不表示删除时独立存活。物理操作范围需由目录约定明确，资源使用仍由 AI 决定，不新增资源模型。此次为设计确认，未执行目录删除、迁移或实现修改。


## 2026-10-05 最新属性决定：NodeReference 与 BaseNode 的 ID

用户明确 NodeReference 属性改为 id、name、description；BaseNode 必须有 id，并可有 name 与 description。

**Why:** 节点自身与引用都需要表达身份及名称、描述，公共属性不必由各业务子类重复定义。

**How to apply:** NodeReference.id 对应被引用节点的必填 BaseNode.id；name、description 沿用可选说明字段，引用不再使用 target、label、kind。BaseNode.path 继续表示 MD 入口位置，directoryPath 由其派生；具体 ID 格式、唯一性范围及根据目录约定的定位方式尚待确定，不擅自假定 UUID、路径或新增全局数据库。子类复用公共名称描述，Markdown 映射和约束后续细化。此前可选 id、target/label 引用是旧设计；本次只同步讨论稿与记忆，未修改实现。


## 2026-10-05 类型关系：BaseNode implements NodeReference

用户先提出 BaseNode 继承 NodeReference，随后补充“或者说 implement it”，本次按 TypeScript 的 implements 接口语义讨论。

**Why:** 完整节点应满足轻量引用的 id/name/description 公共契约，同时引用本身无需成为有运行时行为的基类。

**How to apply:** NodeReference 保持 interface；BaseNode implements NodeReference 并提供公共属性实现，InternalNode、LeafNode 及业务节点沿已有继承链复用。引用可用普通数据对象，序列化时只取引用字段，不将完整节点内容和关系递归写入引用。当前仅更新设计记录与类图，实现代码尚未修改。


## 2026-10-05 用户提出：由路径生成 ID

用户提出 ID 可以由路径与文件名生成，以文件系统内路径唯一性为依据，并要求继续讨论目录规则。

**Why:** 身份与既有文件系统定位复用，避免为了引用增加独立的身份管理机制。

**How to apply:** 以路径派生 ID 作为用户提出的设计方向继续讨论；绝对或相对路径、规范化、移动后身份变化和引用更新仍需明确。不得擅自将该提问解释为已批准 UUID、哈希、持久化 ID 注册表，或已批准具体路径编码规则。当前代码与正式 spec 未修改。


## 2026-10-05 用户补充：layout 覆盖 AGENTS 章节组织约定

用户指出 AGENTS.md 的部分章节划分涉及文件系统组织关系，提出也应写入 layout。

**Why:** 目录入口和 AGENTS 的本层／下层索引共同表达节点组织约定，仅集中入口文件名不足以描述完整结构。

**How to apply:** 后续 layout 设计纳入既有三部分章节与 constraints/localChildren/descendantChildren 的映射，沿用已有章节名与标记，不借机重新命名或增加章节。助手建议 layout 保存声明式约定，InternalNode 负责对应解析序列化，Service 负责文件读写；本层／下层依据显式索引分组，不由物理路径深度替代，保留跨层直接引用能力。具体接口仍待收敛，未修改实现。


## 2026-10-05 用户确认：layout 与模型、Service 的职责

用户确认 layout 同时覆盖目录结构和 AGENTS 入口文档中的组织约定。

**Why:** 入口文件位置与本层／下层索引共同定义组织结构，集中约定可避免解析和文件操作各自重复解释。

**How to apply:** layout 定义目录与入口名、既有三部分章节及区块标记、constraints/localChildren/descendantChildren 映射，以及链接相对来源入口解析的基准；InternalNode 按约定解析序列化，Service 负责文件操作。本层／下层依据索引分组而非物理目录深度，继续支持跨层直接引用。上一节相应助手建议现已获用户确认；具体配置接口与其余目录规则继续细化，尚未修改实现。


## 2026-10-05 用户强调：自身维护继续遵循递归原则

用户明确自身维护当然也递归，递归是系统核心设计原则；不得反复将是否递归作为新选项询问。

**Why:** 每个节点可有自己的 harness，而该 harness 本身仍是节点，相同组织规则必须能够继续应用。

**How to apply:** 延续本次讨论的默认递归布局：内容入口 index.md / SKILL.md 的 harness 在同目录 AGENTS.md；AGENTS.md 自身的 harness 按 .harness/AGENTS.md 继续递归，复用相同目录与章节规则，按需存在而非自动生成无限层级。通用 harness 类型仍可指向 BaseNode；默认入口约定不收窄类型。结构递归与检索边界分别遵守：检索当前系统二沿组成关系展开，不自动跨入它自身或其组成节点的 harness。当前为设计确认，未实现或执行目录迁移。


## 2026-10-05 用户决定：操作规则使用节点多态

用户明确 Node 层应定义好接口，各个 Node 实现具体规则。

**Why:** 通用 NodeService 不应分散承载 Memory、Task、Skill 等节点各自的规则；统一接口让新增节点通过具体实现扩展行为。

**How to apply:** BaseNode 定义统一操作校验契约，由具体节点实现细节，NodeService 调用契约并执行 CRUD 与文件 IO。该决定修正 discussion 第 4 项此前优先采用业务层校验回调的助手建议。服务读取来源、作用域、Git 忽略状态等必要事实并传入节点作为上下文，是助手提出的实现方向，具体方法与上下文接口继续讨论；不据此将文件 IO 放进节点模型。当前只更新设计记录，未修改代码。


## 2026-10-05 用户补充：节点实现创建等操作的业务逻辑

用户指出创建等操作的具体逻辑也应由各类 Node 实现；节点统一接口不能只有 validateOperation 等校验方法。

**Why:** 节点差异不仅是能否操作，还包括创建时的默认数据与文档组织、更新时的领域行为及删除时的业务要求。

**How to apply:** 后续接口须同时表达各节点的业务行为和校验。Service 继续执行文件 CRUD 与多节点协调；Node 负责自身数据和业务规则，不因此引入文件 IO 或 Resource 模型。操作前准备方法是助手建议，create/update/destroy 与 before/prepare 等具体命名、上下文和返回值尚待讨论。此前仅列三个校验／选项接口的方案已被指出不完整，不能照此直接实施。


## 2026-10-05 用户进一步明确：统一契约包括 parse 与 serialize

用户强调序列化、parse 等也属于各节点自行实现细节的统一接口。

**Why:** 节点类型的差异同时存在于文档表示和业务行为，仅统一操作许可或生命周期校验无法覆盖完整领域行为。

**How to apply:** BaseNode 定义契约与通用实现，各 Node 扩展实例 parse/serialize、创建／更新／删除的业务逻辑和校验；相同行为直接继承。InternalNode 按 layout 将 AGENTS 三部分与分组 children 相互转换。Service 负责读取后调用 parse、写入前调用 serialize 及文件操作协调。保留既定 gray-matter 默认行为、实例方法和模型无文件 IO 的边界；生命周期具体签名尚待收敛。


## 2026-10-05 用户确认：节点与 Service 的方法集

用户确认 BaseNode 的实例 parse/serialize、create(input, context)、update(input, context)、destroy(context)、validate，以及 protected parseBody/serializeBody；具体节点按差异覆盖，通用行为继承。

**Why:** 节点多态统一文档转换和领域操作，Service 无须按业务类型散布规则，同时保持文件 IO 与模型分离。

**How to apply:** InternalNode 额外提供 setConstraints、addChild(group, reference)、updateChild(id, name/description patch)、removeChild(id)、moveChild(id, group)；后者仅切换本层／下层分组。LeafNode 不提供组成索引操作。NodeService 提供 create(node,input)、get(path)、update(node,input)、destroy(node)、move(node,destinationPath)，负责文件操作和关系协调；get 读取后调用实例 parse。validateOperation 不再单独暴露，操作检查归入节点行为。此方法集取代前面只列校验／选项接口的提案；上下文、输入类型与详细错误契约留正式 spec 细化，代码未修改。


## 2026-10-05 用户纠正：不对外提供脱离物理目录的 reparent

用户明确不应有不遵循物理目录的独立 reparent；它最多是过程步骤，不能作为对外原子操作，否则破坏协议和一致性。

**Why:** 节点归属须与物理目录一致，仅更新 parent 或归属索引却保留原目录会让两者矛盾。

**How to apply:** 对外通过完整 move 协调目录移动、路径派生 ID、parent 和相关父子索引；reparent 仅可作为内部步骤，不暴露独立完成接口。跨目录普通引用不改变归属，跨物理层级直接引用能力不因此取消。内部索引编辑也不能绕过整体一致性；InternalNode.moveChild 只调整本层／下层分组，不改 parent。此结论取代前文独立逻辑 reparent 的旧实现约定；多文件恢复细节待 spec 定义，不宣称跨文件系统事务原子性，代码未修改。


## 2026-10-05 用户确认：移动同步管理范围内的引用

用户确认 move 必须维护明确管理范围内的节点引用一致性，范围外引用不自动修改。

**Why:** 路径同时决定节点位置与 ID，只改新旧父索引会使其他节点的引用失效；移动目录内部指向外部的相对引用也可能改变含义。

**How to apply:** move 同步新旧父节点索引和 parent，更新被移动目录及所属 harness 的跨目录相对引用，并修复管理范围内其他节点指向旧位置的引用。范围应明确（例如当前仓库根），不承诺发现其他仓库或机器上的引用；图片等资源只随目录移动，不建立资源模型。替代旧实现仅协调已知父索引的限制。具体发现及恢复机制待 spec 细化，代码尚未实现。


## 2026-10-05 用户决定：当前采用原地更新，immutable 延后

用户明确暂时采用原地更新策略；immutable 单独作为普通优化待办，已记录为 edges-cli-platform 的 medium/backlog 任务。

**Why:** 不将不可变模型改造作为当前递归节点重构的前置条件，先保持操作和对象使用方式直接一致。

**How to apply:** Node 操作更新现有实例；move 成功后更新该实例的 path/id 和关系并返回同一实例，不创建替代对象或使原对象失效。受控内部改路径仍须由完整 move 协调，不允许普通 update 绕过目录与索引协议。该决定替代前述移动返回新实例的旧实现／建议；外部只读 getter 不等于整体 immutable。具体实现未修改，不把未来优化待办当作当前接口要求。


## 2026-10-05 用户决定：自动导入入口所在的整个目录

用户明确导入逻辑应简单：自动导入入口文件所在的整个目录。

**Why:** 已采用统一目录单元，不需要再另选资源目录或逐一判断附件归属。

**How to apply:** 接收入口文件时以 dirname 确定完整导入目录，连同其中其他内容一起导入；不再要求显式 resources 参数或额外的 AI/Skill 整理步骤。模型仍只管理 Markdown 节点，其他文件随目录处理，不增加资源模型。该决定取代历史的显式附件目录选择规则；目标冲突与文件操作失败处理另按统一契约收敛，不解释为自动覆盖授权。当前仅设计记录，未实际导入或修改实现。


## 2026-10-05 用户纠正：新建任务由 create 参数生成文档

用户明确 AI 新建任务应提供 create 方法所需参数，由 CLI 组织生成文档；不要求 AI 先拼好完整任务 Markdown 再录入。

**Why:** 节点已经承担创建逻辑和序列化，应统一产生合法的字段与文档格式，避免 AI 另行维护完整文件封装。

**How to apply:** AI 提供标题、简介、正文等创建输入；CLI/Service 调用具体 Node.create 和 serialize，再负责落盘与索引。正文可以是 Markdown 参数，但完整 frontmatter 不由调用方手拼。导入磁盘已有文档另走整个目录导入与解析流程，不把导入和常规创建混为一谈。具体 create 输入字段与旧完整 Markdown CLI 入口的兼容处理尚待 spec 收敛，未修改实现。


## 2026-10-05 用户提出：导入校验报错，由模型修改

用户要求已有文档场景校验格式，发现问题返回 error，让模型修正。

**Why:** 节点契约已定义格式和领域规则，不应让 CLI 猜测修复或为不规范 Markdown 添加特殊兼容行为。

**How to apply:** 导入时通过具体 Node.parse/validate 检查节点文档；失败给出文件、字段或章节与原因，模型修改输入后重试，通过后才执行目标导入与登记。具体错误结构待 spec 细化，行列位置仅使用解析器实际提供的信息。不据此为资源创建模型或改变整体目录导入规则；当前仅设计记录。


## 2026-10-05 用户要求：保留 Markdown 非受控区域

用户提醒 Markdown 往往存在非受控区域，必须保留。

**Why:** 节点只管理文档的一部分结构，人写说明、其他章节和注释仍有价值；从结构化模型重建整份文档可能丢失这些内容。

**How to apply:** parse/serialize 必须保留非受控正文，更新只作用于节点约定管理的字段和区块；AGENTS 等不能因为只建模三部分就删掉区块外内容。校验不能把额外合法章节本身视为错误。原文加区块定位或等价局部更新是实现方向，尚待 spec 细化。此要求不恢复先前明确放弃的 YAML 注释／样式保真目标，frontmatter 继续采用 gray-matter 默认行为。代码未修改。


## 2026-10-05 用户决定：不管理操作系统文件权限

用户明确系统权限不是 Edges 应管理的职责，按简单方式处理。

**Why:** 节点系统应聚焦内容、目录协议与关系，不额外承载操作系统权限政策。

**How to apply:** 文件权限沿用操作系统和常规文件操作，不按 Memory 类型额外 chmod，不设计 createMode/resourceMode 或权限专用 getCreateOptions 接口。此决定取代 discussion 第 6 项的旧权限转换实现；后续重构移除相应特殊分支，不批量改变已有文件权限。Git 忽略、节点业务约束与文件操作一致性仍按各自已有约定执行，不混同系统权限。此次只记录设计，未改代码或文件权限。


## 2026-10-05 用户确认：旧迁移日志简单处理

用户确认旧版未完成迁移日志属于兼容处理，简单直接即可，不展开为核心架构问题。

**Why:** 该项来自历史错误归属方案被纠正后的防御性考虑，本次未确认当前工作树存在未完成旧日志现场，不应为假设场景扩大设计。

**How to apply:** 实际遇到已作废方案的旧日志时停止续跑并报告，结合现有文件按新规则处理；不开发旧日志自动转换，不盲目续跑或删除现场。新方案正常恢复逻辑仍保留，不因本条擅自执行现场修复。


## 2026-10-05 用户确认：其他体系内容先不改造

用户确认 ADR 等其他体系的内容简单处理，暂不纳入本次改造。

**Why:** 这些内容已有所属 Skill／工具的目录和格式约定，不应为了节点遍历或统一目录而扩张本次重构范围。

**How to apply:** 无约定入口的目录保留普通导航引用，不自动补 AGENTS.md、不伪装成节点；有合法入口时采用通用识别规则，不为 ADR 特设逻辑。不迁移或重写其他体系文档，后续有明确接入需求再处理。八项讨论至此收口，新模型仍待正式 spec／计划同步与实现。
