---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-03T15:10:23.904Z'
  edges-title: 讲清「仓库本身当 edges 作用域」场景
  edges-tasks-status: backlog
  edges-task-priority: none
name: 讲清仓库本身当_edges_作用域场景
description: 在 onboarding / edges skill 里写明：整仓就是材料根（如个人大脑），与在别人项目里挂一块 edges 区分开。
---
**背景：**
朋友想用 Edges 搭个人大脑，辅助快速学习和沉淀知识。peng cheng 突然意识到引导可能不够：现有文案偏「任意目录 = scope」，没有点名「仓库本身就是这份 `.edges` 材料根（个人大脑）」的用法，也缺少与「在别人/团队项目仓里挂一块 edges」的对照。Agent 或新人容易选错目录或装不全。
- 相关：edges-onboarding、edges skill；对话里还改过 onboarding 安装为 @latest（PR #99 已合）
- 非目标：本卡不实现 CLI 行为变更

**目标：**
人读 skill 就能分清两种用法：整仓当作用域 vs 在既有项目仓内挂 edges；个人大脑类仓库落在前一种。

**动作：**
- 在 `edges-onboarding`、`edges`（及必要的 reference）补一小段场景说明与选 scope 示例
- 不改 CLI 行为，只补文案

**完成标准：**
- [ ] 两 skill 都能读到「仓库根 = scope、材料在仓内 `.edges/`」的说明
- [ ] 与「在他人/团队项目仓内接入」有对照，避免混用
- [ ] PR 合入 VirusPC/edges
