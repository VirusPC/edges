## ADDED Requirements

### Requirement: MCP ingest 工具接收结构化输入
MCP server MUST 提供 ingest 工具，接收包含 `title`、`content`、`coAuthor` 的结构化输入，并且 MUST 拒绝缺少必填字段的请求。

#### Scenario: 必填字段完整
- **WHEN** 调用方提交了合法且非空的 `title`、`content`、`coAuthor`
- **THEN** 服务端接受请求并启动 ingest 流程

#### Scenario: 缺少必填字段
- **WHEN** 调用方缺少一个或多个必填字段
- **THEN** 服务端返回可机器解析的校验错误码，并且不启动 ingest

### Requirement: MCP ingest 工具返回机器可解析结果
MCP server MUST 为每次 ingest 返回结构化结果对象，至少包含操作状态和自动化所需标识信息。

#### Scenario: Ingest 成功
- **WHEN** ingest 流程成功完成
- **THEN** 返回结果包含 `status=success`，并包含生成文件路径与分支名

#### Scenario: Ingest 失败
- **WHEN** ingest 流程任一步骤失败
- **THEN** 返回结果包含 `status=failed`、错误码和可程序处理的失败原因

### Requirement: MCP ingest 入口执行安全输入约束
MCP server MUST 在触发任何 Git 自动化前执行输入长度与格式约束校验。

#### Scenario: 输入超出限制
- **WHEN** 调用方提交字段超出配置的长度限制
- **THEN** 服务端返回校验错误，并且不执行后续命令

#### Scenario: 输入通过安全校验
- **WHEN** 所有输入字段满足配置的安全约束
- **THEN** 服务端进入 Git 自动化执行阶段
