---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-11T11:10:47.150Z'
  edges-title: Memory 把 Agent 行为类条目与项目知识分开
  edges-tasks-status: backlog
  edges-task-priority: none
name: memory_把_agent_行为类条目与项目知识分开
description: >-
  项目记忆里，纠正 Agent
  行为的规则和项目本身的事实、约定混在一起；模型升级或换模型后，前者可能过时，却很难单独找出来清理。要做到行为类条目能单独识别、复查和整块删除，项目知识不受影响。
---
**背景：**
2026-10-08 发完 v1.4.0 之后，用户在对话里提出：Memory 里应该把 Agent 行为那部分单独区分出来，因为这部分会随着模型进化或换模型而变化。这个想法来自最近 Codex 团队的一期播客，节目里提到这类 Markdown 指令可能会随时间消失；用户的判断是，在它消失之前，应该先把它从其它记忆里解耦出来。按用户要求搜索后，找到两期最可能的节目，下面两条作为事实背景，原话出自自动转写：
- The Pragmatic Engineer，2026-09-09，[Building Codex with Tibo Sottiaux](https://newsletter.pragmaticengineer.com/p/building-codex-with-tibo-sottiaux)。Tibo 说，起初要提醒 Agent 去跑测试，训练出更强的模型之后就不用再说了，所以随着时间推移，每轮注入的 developer message 会缩短，模型外层的 harness 也会变薄（"the developer message shrinks. And then the harness also shrinks."）。转写里没有直接提到 AGENTS.md。
- Lenny's Podcast，2026-10-04，[We're entering a new era of AI (again)](https://www.lennysnewsletter.com/p/openais-head-of-chatgpt-were-entering)，也是 Tibo，在 DevDay 现场录的。他认为手工配置 Agent 工作流只是过渡阶段，以后会由能理解目标和偏好、从反馈里学习的 Agent 取代。完整转写要付费，能看到的部分里没提到 AGENTS.md。
- 现状：本仓 `.edges/memory` 现在分 `feedbacks`、`projects`、`references` 三类。其中 feedbacks 里既有针对 Agent 行为的纠正，也有用户拍板的仓库约定，目前没有字段或目录区分这两种。
- 未验证的假设：行为类条目大多是在弥补某一代模型的不足，换模型后需要复查，有的会变得多余甚至起反作用；项目事实和约定则不受模型变化影响。
- 非目标：这张卡不在现在就删掉任何行为类记忆，也不改 AGENTS.md 的硬约束机制。
- 关联：兄弟卡「project-memory 跨 Agent 继承经验」，讲的是换 Agent 后还能续用；这张卡讲的是换模型后哪些该复查、该淘汰。另一张兄弟卡是「Memory 模块解耦与可插拔接口」。

**目标：**
项目记忆里的 Agent 行为类条目可以和项目知识区分开，单独列出、在换模型时复查，也能整块淘汰，项目知识不受影响。

完成标准待 grill-with-docs 后补。待 grill 的问题：用新的 memory type 还是加元数据来区分；要不要记下这条规则当时针对的是哪个模型；AGENTS.md 硬约束里的行为条目要不要一起算进来。
