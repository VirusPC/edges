---
name: feedback_changelog_no_schema_dump
description: 写根 CHANGELOG Unreleased 时打开：用人话完整句写能做什么，对照 [1.2.0]；不要把 schema 字段表、flag 汤或运维细节塞进一段。缘起 https://github.com/VirusPC/edges/pull/110。
metadata:
  edges-title: 根 changelog 不要堆 schema 字段表
  edges-type: feedback
  edges-origin-session-id: bc-58ed36dc-a709-54d2-91ab-1e96861d7ceb
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-21T08:29:25+00:00"
---

根 `CHANGELOG.md` 的 Unreleased 条目要像 `[1.2.0]` 那样用完整中文写人能做什么；不要把 schema 字段表、flag 汤或运维细节堆进一段。

**Why:**
2026-09-21 用户连续纠正 PR #110：先是 `任务看板与项目` 把 `edges.tasks.grouped/v1` 字段表塞进一段；接着 `Artifacts 预览` 把每个 flag、环境变量、迁移脚本和 workflow 细节塞进两段。对照 `[1.2.0]` 都读不下去。用户所述。

**How to apply:**
- 先写人能做什么，再立刻给出真实命令名（如 `edges tasks list --group-by project`、`edges artifacts publish`、`edges artifacts server install`）。
- schema 只写稳定名字，不要展开字段表。
- 同一能力若有几步（列出、部署生成、nginx、只渲染；或 init/publish/rm、装服务、反代），宁可拆成几条短句。
- 不要把 env 文件名、迁移脚本路径、每个可选 flag、公网 IP 当天状态写进根 changelog；那些留给 README / ADR。
- 对照 `[1.2.0]` 的「任务看板与项目」语气；不要改成电报体。
