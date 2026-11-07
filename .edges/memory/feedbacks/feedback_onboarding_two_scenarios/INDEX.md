---
name: feedback_onboarding_two_scenarios
description: 设计 onboarding 开场时：选项先列用户场景，两条接入流程只作兜底；区分维护整个现有项目和维护某个目录或模块；上下文能确定就不问。
metadata:
  edges-title: 开场先列用户场景，接入流程只作兜底
  edges-type: feedback
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: '2026-11-07T14:35:33+00:00'
  edges-origin-session-id: bc-2f53ec8a-a076-5cff-b804-c01179d4f837
  edges-agent-client: cursor
---

用户确认，开场保留选项列表，但先列用户场景，两条接入流程只作兜底。先从上下文确定场景，缺了再问。不是取消菜单改成纯自由提问。

**Why:** 把「已有项目添加 .edges」「创建独立 edges 仓库」「仅安装并验证 CLI」当作唯一开场菜单时，用户要先理解实现词。场景才是用户能直接选的事。维护整个现有项目，和维护某个目录或模块，是两件不同的事；后者的目录不一定属于代码项目。多个场景仍可以走同一条执行流程。

**How to apply:** 向用户先给这些场景：维护整个现有项目；维护某个目录或模块（目录不一定是代码项目的一部分）；个人大脑；个人可复用的方法与 skills；团队共享的规范和经验。上下文已经明确就沿用，只问缺失项。场景对不上，或用户想直接选方式时，再给「在已有位置添加」和「新建独立仓库」。用户明确只安装 CLI 时只做安装和验证。执行仍映射到已有目录初始化或创建独立仓库；独立仓库默认包含 GitHub 建仓与首次推送，并明确选择 private/public，用户要求仅本地时跳过远程步骤。选项用日常说法，开场不要求用户理解 .edges 或 harness。文档保持简短的三章。
