# 从 TypeScript 数据契约生成 JSON Schema

2026-10-06 用户确认：以普通 TypeScript 数据契约为定义源，使用 ts-json-schema-generator 导出 JSON Schema，需要运行时结构校验时使用 Ajv。目的是消除 TS 类型、JSON Schema 和消费者之间的重复定义，保留现有 Model 行为及 Service 边界，不为了生成器重写领域架构。

**Status:** accepted，待实施。本次只记录选型与决策原因，未安装仓库依赖、修改节点实现或替换现有 Schema。修订 [ADR 0022](0022-review-shell-three-column-task-doc.md) 的字段定义源：由手工维护 JSON Schema 改为 TS 契约生成；外部消费者共用 Task Doc 契约及审阅壳其他决策继续有效。

## 选择与边界

- **定义源：** 明确的 TS interface/type，复用现有枚举与公共类型，放在对应 Model 模块内。首个迁移对象是 TaskDoc；完整节点数据、创建参数、更新参数是不同契约，不混用，也不为尚无对外需求的节点机械新增 Schema。
- **生成器：** ts-json-schema-generator，选型验证版本为 2.9.0，作为构建期开发依赖；接入时锁定版本。使用标准类型与受支持的 JSDoc 约束，不自写 AST 生成器、自定义 formatter 或字符串修补生成结果。
- **运行环境：** 项目运行、构建、测试统一以 Node 22 为基线，最低 Node >=22；不保留运行 Node 20、构建 Node 22 的双基线。2.9.0 的包元数据要求 Node >=22。
- **产物：** 仓库只提交 TS 契约、TypeScript 生成脚本和必要的测试。JSON Schema 生成到 extensions/cli/dist/schemas/，不提交 Git，随构建/发布包分发；不增加 domain/schemas 手写定义层。2026-10-06 用户进一步纠正：撤销本 ADR 初稿中“生成产物可提交、源码侧 schema 路径保持稳定”的建议。对外稳定的是契约标识及 CLI 获取方式，不是源码中的文件路径。这与 ADR 0022 的预构建资源分发原则一致。
- **校验：** 需要运行时结构校验的边界使用 Ajv 8；date-time 等格式使用 ajv-formats。配置 coerceTypes=false、useDefaults=false、removeAdditional=false，只返回错误，不静默修正输入。Model 的跨字段/关系规则和 Service 的文件系统一致性仍保留，不能把 Schema 当成完整业务校验。不得把原本容许省略的 Markdown frontmatter 直接套入要求完整字段的输出契约。
- **架构：** Model 继续负责单个节点的内容、parse/serialize/validate、字段更新与自身索引；operations 负责集合、遍历和查询；Service 负责完整用例及保存。Schema 描述对外数据，不扫描完整节点类来推断接口，不因此迁移方法、移除继承或引入 immutable/reducer。

## 为什么选择这条路线

现有 Task Doc JSON Schema 与 TS 类型、状态枚举存在独立维护。自动生成使字段及枚举有一个可审查的源码定义，又保留外部系统使用标准 JSON Schema 的能力。生成器作为单独构建步骤运行，不要求改动现有 tsc/tsx 应用执行方式。生成时间、工具版本及 TypeScript 语法兼容性成为构建成本，不成为 CLI 每次调用的成本。

生成物不入 Git，避免手工修改和源码/产物不同步；发布包携带与该版本代码一起构建的 Schema。调用者无需知道安装目录、获取仓库源码或安装 TypeScript 编译器，就能通过 CLI 读取契约。

## CLI 获取与构建分发

目标命令如下，首批只登记 Task Doc；这里记录命令设计，命令尚未实现：

```sh
edges schema list
edges schema get task-doc/v1
edges schema get task-doc/v1 > task-doc.v1.json
```

- list 输出 JSON 数组，每项含 key（例如 task-doc/v1）、id（Schema 的 $id）、title、description；只列本安装包实际分发的契约，不扫描工作区。
- get 成功时 stdout 直接输出标准 JSON Schema，不套 ok/data 包装，便于管道和重定向；错误写 stderr 并返回非零退出码。只接受登记的 key，不把任意用户输入拼成文件路径。
- 这是 CLI 自身的全局只读能力，不解析内容 scope、不读取业务文档、不取写锁、不等待 stdin。输出从安装位置相对定位的编译产物读取，与 cwd 无关；不联网、不运行生成器，也不回退读取仓库源码。
- 构建顺序保证先生成 Schema，再执行依赖它的审阅页构建/测试，最终 CLI 包含生成物；生成器仍为开发依赖。独立运行审阅页 dev/build/test/typecheck 时也须准备其需要的产物，不能依赖上一次全仓构建的残留。后续清理 dist 的步骤不能删掉刚生成的 Schema。
- Schema 缺失时报告构建/安装不完整，提示开发者重新构建；不能静默现场生成。生成和消费共享一个最小契约清单，避免分别维护 key、文件名和版本映射，不建立 SchemaService 框架。
- 迁移验收后移除旧 extensions/cli/schemas/task-doc.v1.json 及其源码路径依赖。开发者仍可显式重定向保存一份导出文件；“不入仓库”不表示禁止用户导出，也不表示发布包不携带 JSON 文件。

| 候选 | 未采用的原因 |
| --- | --- |
| 手写 JSON Schema，再生成 TS 类型 | 是有效路线，但用户选择普通 TS 作为定义源；不继续维护两份定义 |
| typescript-json-schema | 官方 README 标明主要处于维护模式，并推荐 ts-json-schema-generator；新接入优先后者 |
| Typia | 能生成 Schema 和校验代码，但需要编译转换接入，对当前 tsc + tsx 工具链的侵入高于独立生成步骤 |
| Zod 作为统一定义源 | 能统一校验和类型，但要求用 Zod 表达式定义数据；本次选择普通 TS 类型。已有 Note 的 Zod 校验不因本决策自动重写 |
| 直接从带行为的节点类生成 | 当前类含私有状态、getter 与方法；临时验证的产物不能准确代表对外数据，需要显式契约 |

## 验证证据与限制

2026-10-06 在仓库外临时目录，以 ts-json-schema-generator 2.9.0、Ajv 8、ajv-formats 3 做小样验证，未修改仓库依赖。探针运行于本机 Node 25.6.1，因此不能声称已通过 Node 22 验收；正式接入需在 Node 22 重跑。

- 直接使用现有 NodeReference、InternalCreateInput、TaskCreateInput：生成成功，合法数据通过，缺少引用 id 或非法任务状态被拒绝。
- 合成样例：继承、引用、readonly 数组、开放 metadata、枚举及 JSDoc 的 pattern/maxLength/date-time 约束通过正反例；失败校验不改变输入。
- 当前 TaskNode 类虽生成成功，却包含 #initialPath/#metadata/#body 并遗漏 status/priority getter；不能将其产物当作节点对外契约。未指定类型参数的泛型 BaseNode 也不能直接作为该探针的根类型。
- 以上是选型探针，不是全量节点支持、现有 Task Doc 兼容性或运行时业务校验的验收。

## 接入时必须保留的契约

生成器 2.9.0 输出 draft-07，现有 task-doc.v1.json 声明 2020-12。先保留现有文件；正式替换时显式审查方言变化、$id 和消费者，不只替换 $schema 字符串。使用对应方言的校验器对既有与新产物比较正反例；不能证明兼容的变化须另行版本化，不能悄悄改 v1。

Task Doc 继续保持 name、description、metadata、body；metadata 的未知键仍允许，body 是 Markdown；保留七态、优先级、项目 id 正则/长度/排除状态名、指派及时间格式规则。现有 TS 的 Record<string, string> 比 Schema 的未知键规则更窄，接入时要显式建模并验证，不能直接生成后悄悄收窄契约。TS 无法表达的规则用生成器支持的声明补充；业务行为不能从 validate 方法体自动推断。

生成结果可能使用 $ref/definitions，不能假定原先手写 Schema 的内联布局不变。现有审阅页直接读取 properties.metadata.properties 中的枚举，实施时必须验证并调整消费者；优先复用契约源码中的公共常量，避免另写手工枚举或自定义 Schema 展开器。消费者不能继续依赖已删除的源码侧 Schema 文件。

CI 从无 dist 的干净状态构建，验证生成物存在、符合对应方言和既有契约样例；重复生成比较临时产物以检查确定性，不以已提交的生成文件作基准。从不含 TS 源码及开发依赖的分发包，在仓库外执行 list/get，验证命令可用、stdout 是纯 JSON、未知 key/缺失产物报错，且 Git 中没有新增生成的 Schema。

此选型与[通用能力收敛计划](../superpowers/plans/2026-10-06-shared-node-capabilities.md)相互独立：该计划继续执行已确认的 Model/operations/Service 分工；Schema 接入从 TaskDoc 开始，不借此扩大成全节点重构。

## 一手资料

- [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator)：类型与 JSDoc 支持、独立 CLI/API；[2.9.0 包元数据](https://registry.npmjs.org/ts-json-schema-generator/2.9.0)。
- [typescript-json-schema](https://github.com/YousefED/typescript-json-schema)：维护状态与替代建议。
- [Typia setup](https://typia.io/docs/setup/)：编译转换接入要求。
- [Zod JSON Schema](https://zod.dev/json-schema)：从运行时定义导出 Schema 的替代路线。
- [Ajv 配置](https://ajv.js.org/options.html)与[Schema 方言](https://ajv.js.org/json-schema.html)：非修改式校验及方言选择。
