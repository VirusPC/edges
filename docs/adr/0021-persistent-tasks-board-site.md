# 持久 `/tasks/` 看板站：始终反映 main，复用 review-page 输出

临时 Artifacts URL 会过期且每次 `publish` 换 UUID，不能当「永远打开同一地址看主分支看板」的入口。2026-09-21 grill 确认（peng cheng）：不新开 status station 产品，只做一条与 teaching 同机的**持久**公网路径 `/tasks/`，内容始终来自 main 看板；GitHub Actions 在现有 `deploy.yml` 部署链上从看板生成数据，再喂给现有 `edges tasks project review-page` 渲 HTML。本轮只定 CONTEXT / 本 ADR，不实现 CLI、nginx 或 CI。**Extends ADR 0012**（页仍只渲染；本站是其 HTML 的持久入口）；**Hard boundary vs ADR 0013**（短 TTL UUID ≠ 固定路径）；**Amended by ADR 0022**（同一壳改为三栏，grouped item 可带可选 Task Doc；仍不写回 git、不加 `--mode`、鉴权仍后做）。叠 ADR 0004 / 0005 / 0009。

**Status:** accepted（ADR 0021；grill 确认于 2026-09-21；2026-09-23 由 ADR 0022 修订壳与文档载荷）

**See also:** ADR 0012（[Task Project 审阅页仍是 render-only CLI](0012-task-project-review-page-is-render-only-cli.md)）；ADR 0022（[审阅壳三栏与 Task Doc](0022-review-shell-three-column-task-doc.md)）；ADR 0013（[Artifacts 预览服务：短 TTL](0013-artifacts-preview-service.md)）；看板 [`knowledge/tasks/agent-clients-ux/in_progress/2026-09-21--Tasks-review-持久站点始终反映-main.md`](../../knowledge/tasks/agent-clients-ux/in_progress/2026-09-21--Tasks-review-持久站点始终反映-main.md)

## Decision

- **不是新产品：** 不要「status station」。持久入口只**端出** review-page 已有的通用 groups+items HTML。
- **持久站，对 Artifacts 硬边界：** `/tasks/` 是固定路径、无 TTL、始终反映 main。Artifacts 预览仍是上传 → UUID URL → TTL 删除（ADR 0013）。一次性人闸继续走 Artifacts；长期看板入口不走 `publish`。
- **公网路径：** `/tasks/`，与 teaching 同一阿里云 ECS、同一路径心智（固定前缀，不是子域）。本轮一页一站，不按 Task Project 拆 URL 树。
- **谁生成内容：** 现有 GitHub Actions 部署链。main 更新后与 teaching 一样 SSH 整仓 pull，再在盒上从看板生成数据并渲染。不要另开 workflow。
- **数据面（Option B）：** CI 先读看板，跑 `edges tasks list --group-by project [--format json]`，得到松耦合**分组列表 schema**（如 `edges.tasks.grouped/v1`）。该 schema **不**按 review-page 命名、也不专属于它。需要 HTML 时，经薄映射变成现有 groups+items，再调用 `edges tasks project review-page`。review-page 仍只渲染（ADR 0012）。
- **鉴权后做：** 本轮公开只读。统一鉴权已有 backlog：[`knowledge/tasks/agent-clients-ux/backlog/2026-09-21--edges-衍生站点统一鉴权.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-21--edges-衍生站点统一鉴权.md)。
- **本轮不写回 git：** 人在页上拖拽不落盘。写回仓与 classify 审阅页是否分模式，见 [`knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Tasks-review-review-page-写回仓接口.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-21--Tasks-review-review-page-写回仓接口.md)。本轮不加 `--mode`。
- **部署形状：** **扩展** `.github/workflows/deploy.yml`（同一 SSH pull / 同一心智）。不要新开 workflow。tmp + persistent 部署目录统一入口另卡：[`knowledge/tasks/agent-clients-ux/backlog/2026-09-21--云端服务统一入口tmp-persistent-部署目录.md`](../../knowledge/tasks/agent-clients-ux/backlog/2026-09-21--云端服务统一入口tmp-persistent-部署目录.md)。
- **本轮范围：** 只落地 glossary + 本 ADR。不实现 `list --group-by`、不改 review-page、不改 nginx、不改 CI、不改看板状态。

## Considered Options

- 新开「status station」产品或另渲状态板：否决；持久入口端出 review-page 输出。
- 用 Artifacts UUID+TTL 当固定看板入口：否决；生命周期与 teaching 式持久站不同（ADR 0013）。
- 子域或其它公网形状：否决本轮；与 teaching 一样走同机 `/tasks/`。
- 请求时在盒上现算、不经 Actions：否决；内容由部署链生成。
- 本轮做鉴权：否决；已拆衍生站统一鉴权 backlog。
- CI 另写渲染器、不喂 `review-page`（非 Option B）：否决；复用现有 render-only CLI。
- 把 `list --group-by` 的 JSON 命名或耦合为 review-page 输入：否决；分组 schema 松耦合，页侧薄映射。
- 按 Task Project 拆 URL 树：否决本轮；一页一站。
- 本轮 git 写回或给 review-page 加 `--mode`：否决；写回与模式拆分另卡。
- 新开 GitHub Actions workflow：否决；扩展 `deploy.yml`。
- 本轮实现 CLI / nginx / CI，或改看板状态：否决。

## Out of scope

- 实现 `edges tasks list --group-by project`、`--format json`、薄映射或改 review-page
- nginx `/tasks/` location、新 workflow、盒上部署脚本
- 鉴权（衍生站统一鉴权 backlog）
- git 写回与 classify / 看板拖拽是否分模式（写回仓接口 backlog）
- tmp + persistent 部署目录统一入口
- 按 project 的 URL 树
- Artifacts TTL、聊天 HTML 预览、本地 HTML 视图（边界不变）
- 看板状态变更
