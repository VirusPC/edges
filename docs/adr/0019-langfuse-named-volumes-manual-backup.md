# v1 Langfuse 数据用 Docker named volume + 偶发 tar，不做 HA

v1 是单机 compose（ADR 0016），没有高可用。2026-09-20 第二轮 grill 确认（peng cheng）：数据落在 Docker named volume；备份是偶尔的手工或脚本打 tar，不是集群复制。定时把备份拷到机外（NAS / 云）是后续，本轮不实现。

**Status:** accepted（ADR 0019；grill 确认于 2026-09-20）

**See also:** ADR 0016（[官方 compose](0016-langfuse-docker-compose.md)）；ADR 0014（[宿主 minigtr](0014-self-hosted-langfuse-on-minigtr.md)）；ADR 0018（[密钥不进仓](0018-langfuse-secrets-stay-on-minigtr.md)）

## Decision

- **v1 数据面：** Docker named volume 存实例数据；没有 HA、没有多机复制。
- **v1 备份：** 偶尔手工或脚本 `tar` 卷数据。备份文件同样不进 VirusPC/edges。
- **机外定时备份另议。** 需要，但不是 v1 已交付能力。
- **本轮范围：** 只记决策。不写备份 cron、不接 NAS/云、不实现卷名。

## Considered Options

- v1 做 HA / 多机复制：否决；单机 compose 不值得开集群。
- v1 就做定时机外备份（NAS / 云）：否决本轮；列为后续。
- 把备份 tar 或卷内容提交进本仓：否决；可能含密钥与运行数据。
- bind-mount 到仓内目录当 v1 数据真源：否决；数据不进 git。

## Follow-up（未做）

- 定时机外备份（NAS / 云）。未实现，不要写成已完成。

## Out of scope

- 卷名、备份脚本、cron、NAS/云账号与路径
- HA / 从 volume 迁集群
- 看板状态变更
