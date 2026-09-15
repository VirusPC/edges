# STAIR / SearchTome 笔记（ToC 结构检索）

> 论文：*STAIR (STructure Aware Information Retriever): A novel dataset and LLM based retriever for document structure augmentation*  
> arXiv：[2609.03874](https://arxiv.org/abs/2609.03874)（v1，2026-09-03）  
> 作者：Vineet Kumar, Meghanadh Pulivarthi, Vishwajeet Kumar, Jaydeep Sen, Riyaz Ahmad Bhat, Sachindra Joshi（IBM；第一作者现 Amazon）  
> 本地 PDF：[`2609.03874-STAIR-SearchTome.pdf`](./2609.03874-STAIR-SearchTome.pdf)  
> 整理日期：2026-09-16  
> 用途：结构感知检索 / ToC 当检索单元；与 edges「树形索引 + description 两跳」有弱类比，**不是** coding agent memory / `AGENTS.md` 评测

---

## 0. 它在测什么构念

| 项 | 内容 |
| --- | --- |
| **目标构念** | 长文档检索时，能否利用 **Table of Contents（全局层次结构）** 把查询路由到正确 **叶子章节**，降低幻觉、提高召回 |
| **不是什么** | 不是跨任务 agent memory；不是 SWE / CTX BENCH；不是对话 LongMemEval |
| **与 chunk RAG 的差别** | 批评按长度切块会丢掉语义边界；主张 **ToC 条目** 作为检索单元（题目自带语义连贯与边界） |

操作化：给定查询 → 系统输出最可能作答的 **ToC leaf header** → 用 gold leaf 算 Recall@k / nDCG。

---

## 1. 系统：STAIR

- 全称：**ST**ructure **A**ware **I**nformation **R**etriever  
- 范式：在 **Differentiable Search Index (DSI)** 一类「把语料写进模型参数、直接生成 doc id」之上，**把 ToC 结构喂进训练/推理**  
- 底座演示：Mistral Instruct v0.2 instruction finetune  
- 声称收益两维：  
  1. **幻觉极低**（leaf header 幻觉率 **&lt; 0.05%** 量级，相对 DSI 在少样本时幻觉飙升）  
  2. **少样本叶子仍可泛化**（训练样本很少的 leaf 上 Recall 仍高）

人读类比（文中例子）：查 “plurality voting system” → 先看目录缩到 Democracy 相关章 → 再落到 Electoral Systems 小节，而不必通读全书。

---

## 2. 基准：SearchTome

- **18** 本书 × **6** 域：Education / Finance / Law / Medicine / Natural Sciences / Social Sciences（每域 3 本）  
- 从 OpenTextbooks 等抽取 ToC，并把叶子映射到对应正文  
- 每本书有 train / dev / test 查询，且标了 **gold ToC entry**  
- 作者称：这是首个带干净结构化视图、专评 **ToC retrieval** 的长文检索基准（对比 LocoV1 等有 gold passage 但无 ToC）

代码/数据声明链接（论文）：`https://anonymous.4open.science/r/s_331/README.md`（匿名期；以后可能换正式仓）

---

## 3. 主结果（SearchTome，Recall@1 / @3 / nDCG@3 平均）

| 系统 | R@1 | R@3 | nDCG@3 |
| --- | ---: | ---: | ---: |
| out-of-box Mistral | 13.8 | 16.4 | 15.4 |
| BM25 | 59.5 | 77.6 | 70.1 |
| Haiku（Claude Haiku 4.5） | 45.6 | 64.1 | 56.4 |
| DPR | 68.7 | 85.4 | 78.6 |
| DSI（同底座，无显式 ToC） | 76.9 | 85.3 | 81.9 |
| **STAIR** | **82.6** | **90.8** | **87.5** |

相对 DSI 约 **+7.4 R@1**，文中称差异统计显著。六域上 STAIR 均为最优。

机制对照（定性）：BM25/DPR 易被词面带走；DSI 会 **生成 ToC 里不存在的 header**（幻觉）；STAIR 对齐真实 ToC leaf。

---

## 4. 局限（作者自陈）

- 评测限于 **已有全局结构** 的语料（书、带目录文档）；真实世界许多语料没有 ToC  
- 计划：给标准基准 **人工诱导 ToC**；以及企业级百万 URL 级已有结构语料  
- Future：动态生成 ToC；零样本多跳、读 leaf 正文再决策（偏 agentic IR）

---

## 5. 对 edges / project-memory 的启示（克制）

**有用的类比（弱）：**

- 「先读目录/索引，再两跳到正文」≈ edges 的 `AGENTS.md` → `.memory/<TYPE>.md` → 条目文件  
- 「检索单元要有语义边界」≈ type + description，而不是把整仓切成等长 chunk  
- 「生成不在索引里的 id = 幻觉」≈ doctor / 索引全量重算：消费方只认产物上的链接+说明，不认臆造路径

**不要过度外推：**

- STAIR 是 **书本 ToC + 生成式 IR（finetune）**，不是 coding harness 的 filesystem memory  
- SearchTome 分数 **不能** 当 project-memory 有效性证据  
- 与 `2602.11988`（评 `AGENTS.md` 静态 context file）正交：一个管 **文档结构检索**，一个管 **仓库 context file 是否抬 SWE 成功率**

一句话：当 related work / 结构检索灵感记；主评测线仍是 SWE-ContextBench（跨任务）+ MemGym（工作记忆）+ CTX/`AGENTS.md` 冒烟。

---

## 6. 引用

```bibtex
@misc{kumar2026stair,
  title         = {STAIR (STructure Aware Information Retriever): A novel dataset and LLM based retriever for document structure augmentation},
  author        = {Kumar, Vineet and Pulivarthi, Meghanadh and Kumar, Vishwajeet and Sen, Jaydeep and Bhat, Riyaz Ahmad and Joshi, Sachindra},
  year          = {2026},
  eprint        = {2609.03874},
  archivePrefix = {arXiv},
  primaryClass  = {cs.AI}
}
```

相关链接：

- 论文：https://arxiv.org/abs/2609.03874  
- PDF（本目录）：`2609.03874-STAIR-SearchTome.pdf`
