# 工程知识链与 ADR 定位

ADR 不要单独看。它处在一条工程知识链路里：

**问题 → 方案 → 决策 → 实现 → 复盘**

缺任何一环，后人都能看到 What，却很难还原当时为什么这么选。

## 相关概念：各解决什么问题

| 角色 | 解决什么问题 | 典型时机 |
| --- | --- | --- |
| PRD / Requirement | 要做成什么、成功标准是什么 | 立项、需求冻结前 |
| RFC | 决策前的提议，可被否决 | 方案未定、需要对齐取舍 |
| Design Doc | 若这么做，系统怎么设计 | 方向大致成立、开始画结构 |
| Tech Spec | 怎么落到接口、模块、任务可执行 | 关键决策已定、动手前 |
| ADR | 最终为什么选这个方案 | 关键取舍已冻结 |
| Issue / Task | 拆成可执行工作项 | 进入实现 |
| PR | 代码变更的审查与合入 | 实现完成、待审 |
| Runbook | 出事时按什么步骤操作 | 上线后、值班/运维 |
| RCA / Postmortem | 出了什么事、根因、改什么 | 故障或重大偏差之后 |
| Changelog | 对外/对后人说清变了什么 | 发布时 |

## 最易混的三者

- **RFC**：决策前的提议，可以被否决。
- **Design Doc**：若这么做，系统怎么设计。
- **ADR**：最终为什么选这个方案（含 options / reasons / consequences）。

推荐链路：**RFC → Design → ADR**（提议 → 设计 → 冻结关键决策）。

## 在完整研发流程中的位置

```text
Problem → PRD → Spike → RFC → Design Review → ADR
  → Tech Spec → Tasks → Coding → PR → Release
  → Monitoring → RCA → 新的 ADR
```

闭环可以压成四字：

- **RFC = 提议**
- **ADR = 决策**
- **Code = 实现**
- **RCA = 反馈**

RCA 不是终点：反馈可能推翻旧取舍，于是再写一条新的 ADR。

## ADR 记什么、不记什么

ADR 不记录所有决定。只记 **6 个月后仍可能被问「当初为什么这么搞」** 的关键取舍。

例行改名、显而易见的实现细节、很快会被代码本身说清的选择，不必写成 ADR。

## 对 AI Coding 的含义

仓库里通常不缺 What：code 和 git history 都能回答「现在是什么样、谁改过」。缺的是 Why。

ADR 补的就是 Why。高质量仓库上下文大致是：

**PRD / 目标 + Design + ADR + Code + Git History + RCA**

Agent 能读代码，不等于能还原当时否决了哪些方案、以及代价是什么。

## 最小体系建议

目录不必一次铺满，够用即可：

- `docs/requirements`
- `docs/design`
- `docs/adr`
- `docs/runbooks`
- `docs/postmortems`

生命周期：**需求 → Design / RFC → ADR → Code → RCA → 可能更新 ADR**。

## 对 Edges 的边界

以上是**工程文档角色**，不要自动做成新的 project-memory type。

project memory 只补代码和 git 推不出来的持久 Why 与规则；PRD / RFC / Design / ADR / RCA 仍应落在可见的工程文档里，供人和 Agent 默认检索。
