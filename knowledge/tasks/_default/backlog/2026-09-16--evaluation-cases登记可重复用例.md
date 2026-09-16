---
name: evaluation_cases_register_repeatable
description: 在 evaluation/cases 登记可重复 case 定义；冒烟本次只写 reports，cases 另开
metadata:
  edges-type: task
  edges-title: evaluation/cases 登记可重复 case 定义
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-16T15:10:00+08:00"
---

在 `evaluation/cases/` 登记可重复的 case 定义（输入、期望、复跑方式），与单次冒烟报告分开。

**Why:**
Agent Memory 专家约定：LoCoMo 冒烟本轮只写 `reports`，不把可复用 case 定义塞进冒烟交付。`evaluation/cases/README.md` 也要求有真实用例再加文件。需要单独条目把「可重复 case」做成可复跑资产。

**How to apply:**
- 链到：`knowledge/tasks/_default/backlog/2026-09-16--LoCoMo评测流水线冒烟.md`（冒烟产出 reports；本条收 cases）。
- 对照仓内 `evaluation/cases/README.md`：有真实用例再落文件，不预埋空数据。
- 与「知识库 Evaluation 系统」相关但更窄：本条是 cases 目录的可重复定义，不是整套 Evaluation 系统。
- **非目标：** 不扩大当前 LoCoMo 冒烟范围；不把 LoCoMo 当 project-memory 证明。
- 派发时默认先 grill-with-docs。
