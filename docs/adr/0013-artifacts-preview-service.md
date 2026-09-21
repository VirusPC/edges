# 个人 Artifacts 预览服务：上传→URL→TTL 删除

**主题：** 稳定的 artifacts 预览服务（短生命周期托管 + 真浏览器可开 URL）；聊天内嵌预览是绕开的不可靠路径。

## Context

Agent 产出的交互 HTML 需要人操作。例如 classifyTasks 的 Task Project 审阅页：render-only `edges tasks project review-page` 只写到本地临时路径（ADR 0012）。手机往往没有 localhost / 开发环境。Grok Bot 聊天内嵌 HTML 预览不可靠——手机常无法预览，桌面交互 / 拖拽会坏（见 [`knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`](../../knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md)）。因此自建短生命周期预览托管；与长期站点、持久 `/tasks/` 看板站（ADR 0021）、以及 backlog「review页结果回传Agent客户端」分开。

2026-09-19 grill 确认（peng cheng）：做个人 **Artifacts 预览服务**——上传 → URL → TTL 删除。本轮只定 CONTEXT / 本 ADR，不实现服务或 CLI。**Extends ADR 0012**（人如何打开审阅页；`review-page` 仍只渲染）。叠 ADR 0004。

**Status:** accepted（ADR 0013；grill 确认于 2026-09-19）

**See also:** ADR 0012（[Task Project 审阅页仍是 render-only CLI](0012-task-project-review-page-is-render-only-cli.md)）；ADR 0021（[持久 `/tasks/` 看板站：固定路径，不是本 TTL 服务](0021-persistent-tasks-board-site.md)）；[`knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`](../../knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md)（聊天 HTML 预览不能当交互闸门）

## Decision

- **目的：** 稳定的 artifacts 预览服务（短生命周期托管 + 真浏览器可开 URL）。聊天内嵌预览是绕开的不可靠路径，不是产品本身。
- **语言：** TypeScript，与 `extensions/clis` 同栈。
- **v1 能力：** 上传 → URL → TTL 删除；只做静态托管。本轮不做服务端表单结果存储。
- **部署：** 同一套服务跑在本机与已有 ECS。手机审阅必须用 ECS / 可达 URL，不得假定 localhost。
- **Edges 接线：** `edges artifacts` 薄命令面——`init`/token 与本地配置（如 `~/.config/edges/artifacts.env`）；`publish`/`rm` 读配置。`from` 可选；有任务关联时只写 `{ type: "task", id, project }`（`id` 是 task stem），否则整段省略。`edges tasks project review-page` 仍只渲染（ADR 0012）。Skill 编排：渲染 → 发布 → 给人可达 URL。
- **鉴权：** 写（publish / rm）要共享 token；读（浏览器打开 URL）不鉴权，靠难猜 UUID 路径 + TTL。
- **TTL：** 默认 24h，publish 时可覆盖；服务端到期清理。
- **能力面：** 仍是 ADR 0004 的 CLI + Skill + MCP。本轮不为 artifacts 新开 MCP。
- **本轮范围：** 只落地 glossary + 本 ADR。不实现服务、CLI、Skill 正文，不改看板状态。

## Considered Options

- 做成长期站点 / 博客（Astro / site-and-content）或固定 `/tasks/` 看板入口：否决；长期固定路径是 ADR 0021，不是本 TTL 服务。
- 做成本地 HTML 视图卡：否决；那是仓内 / 本机视图，手机打不开 localhost。
- 本轮做审阅结果回传 Agent 客户端：否决；已拆独立 backlog。
- 靠聊天 HTML 预览当闸门：否决；见 Grok Bot 预览笔记。
- 本轮做服务端表单结果存储：否决；v1 只静态托管。
- 手机审阅走 localhost：否决；必须可达 URL / ECS。
- 把托管并进 `review-page`：否决；review-page 仍只渲染。
- 读 URL 也要登录：否决本轮；写要 token，读靠 UUID + TTL。
- 本轮实现服务或 CLI：否决。

## Out of scope

- 审阅结果 POST / 回传 Agent 客户端
- Astro / site-and-content 长期建站
- 本地 HTML 视图
- 服务端表单结果存储
- 本轮实现服务、`edges artifacts`、改写 classifyTasks / review-page 正文
- 看板状态变更
