# Langfuse 的 .env 与密钥只留 minigtr 磁盘，不进 VirusPC/edges

自托管实例需要数据库口令、加密密钥、初始化密钥等。本仓公开（`github.com/VirusPC/edges`），根硬约束已禁止凭据入库。2026-09-20 第二轮 grill 确认（peng cheng）：`.env` 与密钥只活在 minigtr 本机磁盘（例如本机 services 目录）；永远不要提交进 VirusPC/edges。edges 最多留脱敏的 compose 说明或 ADR。

**Status:** accepted（ADR 0018；grill 确认于 2026-09-20）

**See also:** ADR 0016（[官方 compose，本仓不落真源](0016-langfuse-docker-compose.md)）；ADR 0014（[宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；根 `AGENTS.md` 公开仓脱敏

## Decision

- **密钥真源：minigtr 磁盘。** `.env`、密钥文件放在机上本地目录（例如本机 services 目录），不进 git，也不写进 `CONTEXT.md`。
- **edges 只留脱敏纸面。** 可以有 ADR / 脱敏 compose 笔记（无口令、无 token、无具体路径必填项）。不能有可工作的密钥副本。
- **不要把密钥写进用户记忆再「脱敏晋升」进本仓。** 公开仓没有密钥真源。
- **本轮范围：** 只记决策。不创建 compose、`.env` 模板里的真实值，也不实现部署。

## Considered Options

- 把 `.env` / 密钥提交进 VirusPC/edges（含 private 文件或 gitignore 后仍入库）：否决；公开仓，写入即公开发表。
- 密钥放云上密钥库 / 另一台机当 v1 真源：否决本轮；v1 真源就是 minigtr 磁盘。
- 在 CONTEXT 或 ADR 里写端口、路径、口令示例当可复制配置：否决。

## Out of scope

- 具体目录绝对路径、口令、token、证书
- 本仓带密钥的 compose / `.env`
- 看板状态变更
