# Evaluating AGENTS.md / CTX BENCH 笔记

> 论文：*Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?*  
> arXiv：[2602.11988](https://arxiv.org/abs/2602.11988)（v2，2026-06-23）  
> 作者：Thibaud Gloaguen, Niels Mündler, Mark Müller, Veselin Raychev, Martin Vechev（ETH Zurich / LogicStar.ai）  
> 本地 PDF：[`2602.11988-Evaluating-AGENTS-md.pdf`](./2602.11988-Evaluating-AGENTS-md.pdf)  
> 整理日期：2026-09-16  
> 用途：对照 edges 的 `AGENTS.md` + `.memory` 分层；**不是**跨任务 project-memory 主证据

---

## 0. 它在测什么构念

| 项 | 内容 |
| --- | --- |
| **目标构念** | 仓库级 **context file**（`AGENTS.md` / `CLAUDE.md` 等）对 coding agent **解决真实 issue** 是否有帮助 |
| **不是什么** | 不是对话长期记忆；不是 remember→ask 跨任务经验迁移；不是 working-memory 压缩（MemGym） |
| **与 edges 的关系** | 直接打在 **`AGENTS.md` 这一层**（发现、硬指令、overview 是否该堆）；正文下沉到 `.memory` 的闭环要另用 SWE-ContextBench 等评 |

操作化：同仓同任务，三档对照——**None**（无 context file）/ **LLM**（按厂商推荐生成）/ **Dev**（开发者已提交的文件）；看成功率、步数、推理成本、工具行为。

---

## 1. 基准与设定

### 1.1 CTX BENCH（本文新建）

- **138** 个 Python SE 任务（修 bug + 加功能）
- **12** 个较新、小众仓库，且仓里**已有**开发者提交的 context file
- 从真实 GitHub issue / PR 构造；平均改动约 **119** 行；测试对改动代码平均覆盖约 **75%**
- 设计动机：热门仓上的 SWE-bench 往往没有真实 context file，无法评「人已经在用的 AGENTS.md」

### 1.2 SWE-bench Lite（互补）

- **300** 题 / 11 个热门 Python 仓
- 这些仓**没有**开发者 context file → 主要评 **LLM 生成** 的 context file

### 1.3 三档条件

1. **None**：去掉 context file  
2. **LLM**：用 agent / 厂商推荐的 `/init` 类流程生成  
3. **Dev**：仅 CTX BENCH；用 patch 前仓库里的开发者文件  

跨多个 LLM 与 coding agent harness 复验。

---

## 2. 主结论（对外可复述）

1. **整体：context file 并不显著抬高任务成功率**（跨模型、agent、生成/人手文件大体成立）。
2. **成本：平均推理成本上升约 20%+**（文中 SWE-bench / CTX BENCH 大约 **+20% / +23%**）；步数与探索也增多。
3. **人手优于生成**：开发者提交的文件平均比 LLM 生成大约好 **7%**；相对 None，Dev 平均大约 **+2.4%**（显著性弱，`p≈0.21`），但仍显著好于 LLM 生成（`p≈0.038`）。
4. **指令会被遵守**：提到的工具（如 `uv`、仓内专用工具）使用次数数量级上升 → 失败不是因为「agent 不听话」。
5. **Overview 不帮忙**：厂商常推的仓库总览 / 目录枚举，**不能**让 agent 更快找到相关文件；生成文件里 overview 极普遍（部分模型生成文件几乎 100% 带 overview）。
6. **作者建议**：暂时别指望 LLM 生成的 context file 提分；人手文件只写 README 里没有的**非标准约定 / 非功能要求**，并**上线前自测**。

---

## 3. 机制层（为什么贵却不涨分）

- Context file → 更多测试、更广探索、更多 reasoning token（量级约 **+10%–22%**）→ **成本↑**。
- Overview 对「尽快摸到相关文件」无效 → 导航收益落空。
- Ablation：更强模型生成的文件、换 Codex/Claude 的 init prompt，**都不能稳定变成更好的 context file**；长度与删掉某几类指令也无明显救场。

---

## 4. 对 edges / project-memory 的启示

1. **`AGENTS.md` 不是性能银弹**；堆 overview 与「仓库说明书」符合厂商话术，但与本文负结果对齐——应压常驻体积，overview 慎写。
2. **硬指令 / 非标准约定**才是会被执行的部分 → 支持把 **important** 与可检索的 `.memory` 条目拆开；spotlight 点名 ask/remember，而不是塞长文总览。
3. **init / reshape 生成物要实测**：三档协议（None / 生成 / 人手）可直接抄到 `evaluation/`，先打 `AGENTS.md` 层冒烟，再谈跨任务 memory 增益。
4. **不能替代** SWE-ContextBench（跨任务经验）或 MemGym（轨迹内 working memory）；本文是 **静态 context file** 评测。

### 建议记进实验纪律的一句话

> 改 `AGENTS.md` 或跑 `/init` 之后，必须报：成功率 Δ、成本 Δ、以及「指令是否被遵守」；只报 Resolve Rate 不够。

---

## 5. 引用

```bibtex
@misc{gloaguen2026evaluating,
  title         = {Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?},
  author        = {Gloaguen, Thibaud and Mündler, Niels and Müller, Mark and Raychev, Veselin and Vechev, Martin},
  year          = {2026},
  eprint        = {2602.11988},
  archivePrefix = {arXiv},
  primaryClass  = {cs.SE}
}
```

相关链接：

- 论文：https://arxiv.org/abs/2602.11988  
- PDF（本目录）：`2602.11988-Evaluating-AGENTS-md.pdf`
