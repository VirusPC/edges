---
name: feedback_harness_modules_are_local_scope
description: >-
  划分 AGENTS 本层与下层索引时：维护当前作用域的 evaluation、tasks、observation
  等属于本层，不因模块有独立入口或验证职责就归下层。
metadata:
  edges-title: 本作用域的维护模块登记在本层
  edges-type: feedback
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T23:06:45+08:00'
---

当前作用域采用的维护模块应登记在本层索引；用户明确纠正，根 .harness/evaluation/AGENTS.md 属于根的本层，与维护 tasks、observation 一致。

**Why:** 本层／下层表达相对作用域的组织关系，不等于物理目录深度，也不能因为模块有自己的 AGENTS.md 或独立验证职责就判为下层。错误登记会让默认只读取本层的检索遗漏当前系统的维护能力。

**How to apply:** 按模块维护的对象判断所属作用域。维护当前作用域的模块登记为 localChildren；模块自身需要维护时，它自己的 harness 才构成新的维护层。检查根入口时，应将 evaluation 与其他根维护模块一起核对，不改变模块内部局部记忆的归属。
