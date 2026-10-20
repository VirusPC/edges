---
name: project_langfuse_named_volumes_manual_backup
description: 选自托管 Langfuse 的 v1 数据面、HA 或备份方案时打开：Docker named volume + 偶尔手工/脚本 tar；无 HA。定时机外备份（NAS/云）是后续未做。决策见 docs/adr/0019-langfuse-named-volumes-manual-backup.md。
metadata:
  edges-title: v1 Langfuse 用 named volume + 偶发 tar
  edges-type: project
  edges-origin-session-id: bc-8f1d5fb6-9160-5c0a-a840-06865f80e964
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T11:22:55+00:00"
---

v1 自托管 Langfuse 数据落在 Docker named volume，备份是偶尔的手工或脚本 tar，没有 HA。定时把备份拷到机外（NAS / 云）是后续，本轮未做。

**Why:**
2026-09-20 第二轮 grill 确认（peng cheng）：单机 compose 不值得开集群；机外定时备份需要，但不能把未做的 cron/NAS 写成 v1 已具备。

**How to apply:**
- 不要把 HA、多机复制或定时机外备份当成 v1 已交付。
- 备份 tar 与卷内容不进 VirusPC/edges。
- 不要在 ADR/CONTEXT 里 pin 卷名、cron 或 NAS/云路径。
- 对照 ADR `docs/adr/0019-langfuse-named-volumes-manual-backup.md`；编排见 ADR 0016。
