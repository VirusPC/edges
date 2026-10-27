---
name: feedback_grill_rounds_as_html_plan
description: >-
  跑 grill 或交付实现 PR 审阅页时打开：默认 grill → html-plan 打包 → Artifacts 发布并验证链接 → 用户 Copy
  response 回传；不要停在本地 HTML 或等用户提醒发布。
metadata:
  edges-title: grill 每轮经 html-plan 发布到 Artifacts
  edges-type: feedback
  edges-origin-session-id: sand-subagent-91de785a-85c8-d2ad-e2bf-4dd7c12708f9
  edges-agent-client: grok-bot
  edges-username: VirusPC
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-26T00:11:16+08:00'
---

grill-with-docs 的每一轮默认走完整流程：**grill → html-plan → Artifacts → 用户回传回答 → 更新文档与记忆**。实现 PR 的审阅页也按同样方式发布；不等用户再提醒 publish，不以本地文件或 localhost 链接作为最终交付。

**Why:**

2026-10-18 审 #274（安装 skills 的 grill 结论与 ADR 0036）时，用户说纯 Markdown 的 PR「太难 review」。试用 html-plan 后用户明确要求「memory 里记下，grill-with-docs 每一轮用 html plan」，并纠正是「每一轮」，不是「每一步」。随后 #276 实现 PR 没附页面时，用户追问「html 图呢」。

2026-10-26 讨论 routines 模块时，助手只交付了本地 HTML 和 localhost 预览，用户补充要求「publish artifacts 吧」，发布后进一步要求「需要记录下。grill 到 html plan 到 artifacts」。因此默认交付必须包含 Artifacts 发布与可直接打开的链接，而不是停在渲染或本机预览。

**How to apply:**

1. Grill：只问前置条件已确定的问题，把本轮问题、选项和推荐项组织成一页；已确认的决定保留，依赖未回答问题的分支留到下一轮。
2. HTML plan：按 html-plan 生成并打包成独立 HTML，检查页面与选项是否能正常使用。源码和打包文件放工作区 `.work/<任务名>/`；页面只是视图，任务卡、plan、ADR 的 Markdown 仍是正本，HTML 不进主线。
3. Artifacts：通过 `edges --scope <工作区根> artifacts publish <packed.html>` 发布，默认采用 CLI 的 24 小时有效期；用户指定有效期时按要求。有关联任务时一起传 `--from-type task --from-id <任务 stem> --task-project <分组>`。发布内容遵守仓库的公开与脱敏约束，不上传凭据或私密正文。
4. 交付：确认返回的外网 URL 能打开，给用户该链接与有效期。提醒点 Respond → Copy response，再把结果粘回对话；页面不会自动回传。发布失败时说明具体失败点并保留本地文件，不把 localhost 当成已发布。
5. 回写：根据用户实际回答更新设计树、任务卡、必要的 ADR，以及项目记忆。未查看的默认项不视为确认。事实或题目有改动时，重新打包、发布并交付新链接，不能只在聊天中口头更正。

背景与来源：公开 brain 的 `notes/2026-10-19--html-plan-审阅页与-grill-with-docs-的配合/INDEX.md`；2026-10-26 routines 模块 grill 对话。
