## ADDED Requirements

### Requirement: 服务通过 TypeScript 编排执行 ingest
TypeScript 服务 MUST 以确定性顺序编排 ingest，并触发仓库自动化路径：校验、文件生成、commit、push。

#### Scenario: 顺序执行路径
- **WHEN** 收到合法的 ingest 请求
- **THEN** 系统先执行校验再执行文件生成，并且仅在文件创建成功后执行 commit/push

#### Scenario: 上游失败即提前终止
- **WHEN** 校验或文件生成失败
- **THEN** 系统终止流程并且 MUST NOT 执行 commit 或 push

### Requirement: Git commit 元数据标准化
自动化流程 MUST 执行统一分支命名与 commit 元数据规则，并包含请求中传入的 co-author 信息。

#### Scenario: 提交元数据生效
- **WHEN** 系统为 ingest 请求创建 commit
- **THEN** commit message 包含 ingest 标题上下文，并包含传入的 co-author trailer

#### Scenario: 分支命名规则生效
- **WHEN** 流程为 ingest 创建分支
- **THEN** 分支名符合配置的 ingest 命名规范

### Requirement: 自动化明确报告外部依赖失败
自动化流程 MUST 识别并分类报告 git/push/PR 相关依赖失败，返回明确错误类别。

#### Scenario: Push 鉴权失败
- **WHEN** 因凭据缺失或无效导致 push 失败
- **THEN** 流程返回凭据相关错误码，并将请求标记为失败

#### Scenario: 可选 PR 创建能力不可用
- **WHEN** PR 创建依赖不可用但 commit 与 push 已成功
- **THEN** 流程返回 ingest 成功，并将 PR 状态标记为不可用
