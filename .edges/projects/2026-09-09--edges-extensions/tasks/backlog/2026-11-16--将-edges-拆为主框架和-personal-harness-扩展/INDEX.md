---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-16T02:33:11.293Z'
  edges-title: 将 edges 拆为主框架和 personal harness 扩展
  edges-tasks-status: backlog
  edges-task-priority: urgent
name: 将_edges_拆为主框架和_personal_harness_扩展
description: >-
  edges 框架只保留 memory、task 等核心模块并支持自由注册模块；内置 routine、personal
  evaluation、知识分发与反馈模块、输入获取模块等拆成 personal harness 扩展，以注册方式接入。
---
**背景：**
2026-11-16 用户提出记一张高优卡：把 edges 拆成主框架和 personal harness 扩展两部分。edges 框架要保持简洁、具备可扩展性，包含 memory、task 等核心模块，并支持自由注册模块；personal harness 包括一些内置的 routine、personal evaluation，edges、posts 等打通知识分发和获取反馈的模块，以及打通各个输入场景、获取输入的模块等。
- 预期收益：框架本身保持简洁，个人向能力不再挤在核心里；别的使用者可以只用框架，或按需装上自己的 harness 扩展。
- 关联：同 Project 的「.edges 模块插件化」「增强 CLI 可扩展性：模块配置化，支持通过 CLI 添加自定义模块」「.edges 下支持自定义材料类别（如 plan、决策点）」，本卡的「自由注册模块」依赖它们的注册机制。
- 关联：「edges 封装为脚手架+框架并定义升级路径」（框架边界与升级）；进行中的「把个人大脑从 VirusPC/edges 系统仓拆出去」（那张拆的是内容和仓库，本卡拆的是模块和能力）。
- 关联：evaluation Project 下的「Personal Evaluation 自定义目标线上数据自动清洗与定期评测」。

**目标：**
edges 分成两层：简洁、可扩展的主框架（memory、task 等核心模块和模块注册能力），以及一个 personal harness 扩展，包含内置 routine、personal evaluation、edges/posts 等知识分发与反馈模块、各输入场景的输入获取模块，通过框架的注册机制接入。

完成标准待 grill-with-docs 补。待定：核心模块具体包括哪些（notes、projects、skills、routines、compose 算核心还是扩展）；personal harness 扩展放在独立包、独立仓还是个人大脑仓，怎么发布和安装；「内置 routine」与「输入场景」各指哪些；和插件化、配置化两张卡是先做注册机制再拆，还是合成一条线推进。
