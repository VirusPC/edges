---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-23T10:37:11.127Z'
  edges-title: 让助手在做事前稳定读到大脑入口并先查记忆
  edges-tasks-status: backlog
  edges-task-priority: none
name: 让助手在做事前稳定读到大脑入口并先查记忆
description: 不会自动读取入口文件的客户端在压缩上下文或新会话后会跳过先查记忆；接入时在助手常驻记忆写入入口规则，并扩大 edges-memory-ask 的触发条件。
---
**背景：**
2026-11-23，Grok Bot 在恢复 weekly-ai-blogs-digest 的编排重构 grill 时，没有先查已有记忆就直接出题。它建议用内容哈希判断哪些节点要重算，但 SKILL.md 已经写明不加内容哈希。用户追问后做了复盘，原因有三个。第一，压缩后的交接只记了"要做什么"，没记"按什么规矩做"，助手把"继续"理解成照旧计划执行。第二，"先查记忆再 grill"写在公开脑的 `AGENTS.md` 和项目记忆里，onboarding 也要求先读入口 `AGENTS.md`，但这一步只有在加载 edges 技能时才会执行，Grok Bot 不会在新会话里自动读。第三，edges-memory-ask 的触发条件只写了"用户提问或动手改代码前"，不覆盖开始或恢复 grill、出设计方案这类场景。用户指出关键在于让助手自己的记忆记住入口，并认同扩大触发条件也是一个改进点，要求两点合成一张卡。
- 现状：onboarding 的 Grok Bot 指南里，"新会话是否自动读大脑 `AGENTS.md`"一项标着待试（E1）；workspace 根目录的 `AGENTS.md` 里没有"先查记忆"，只有公开脑里写了。
- 本次的临时做法：Grok Bot 已经在自己的常驻行为记忆里加了一条"做 Edges 相关工作前，先读 workspace 和公开脑的 `AGENTS.md`"。
- 非目标：不做自动注入入口文件的客户端插件。
- 关联：兄弟卡"接入时提示客户端优先把记忆写入项目记忆"（2026-11-23）和"个人大脑跨客户端与工作空间接入指南"（进行中）。

**目标：**
不会自动加载入口文件的客户端，在新会话或压缩后开始 Edges 相关工作时，能稳定先读入口 `AGENTS.md`，并在 grill 或设计判断之前查过已有记忆。

**动作：**
- onboarding：在 Grok Bot 这类客户端的指南里增加一步，接入时除了把入口路径写进共享记忆，还要在助手自己常驻的记忆里写一条"做 Edges 相关工作前先读入口 `AGENTS.md`"。验收第 2 层相应补一项检查。
- edges-memory-ask：触发条件在"提问或改代码前"之外，增加"开始或恢复 grill、出设计方案或做取舍判断之前"；并说明上下文压缩后算新一轮，要重新查。

完成标准待 grill-with-docs 补。只改技能说明和 onboarding 指南，版本只升 patch。
