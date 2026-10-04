---
name: project_node_resource_unit_decision
description: 设计或修改节点目录生命周期时：资源归属由明确入口决定、导入须显式；逻辑父子与物理资源分离。
metadata:
  edges-title: 节点逻辑归属与资源单元分离
  edges-type: project
  edges-agent-client: codex
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T05:43:44+08:00'
---

节点的逻辑归属由 AGENTS 引用决定，物理资源归属只由明确的目录入口合同决定；邻近文件不能自动归属于节点。

**Why:** 单文件旁边可能放着共享附件或其他节点；按物理 dirname 猜归属会让移动、删除和导入触及未授权内容。Skill 则按标准以完整 SKILL.md 目录为单位。

**How to apply:** Task、Memory、Note 可以选择单文件或 index.md 目录入口，Skill 使用 SKILL.md 目录入口。创建目录节点时只导入调用方明确指定的资源目录；已有节点不隐式合并或转换格式。逻辑 reparent 只更新索引，物理 move 限于同文件系统与同入口格式，并拒绝 AGENTS.md 路径移动。多文件写入采用快照校验与可恢复错误报告，不承诺进程崩溃时的原子性。2026-10-05 的[独立纠正计划](../../../docs/superpowers/plans/2026-10-05-recursive-node-ownership-correction.md)已完成统一节点识别和 43 条公开局部记忆归属恢复；其他克隆的私有记录仍须依据可信本机 journal 显式审阅。
