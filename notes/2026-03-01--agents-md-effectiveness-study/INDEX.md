# AGENTS.md 对 Coding Agents 真的有用吗？

> 来源: [Does AGENTS.md Actually Help Coding Agents?](https://nlp.elvissaravia.com/p/does-agentsmd-actually-help-coding)  
> 论文: [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?](https://arxiv.org/abs/2602.11988)  
> 研究机构: ETH Zurich SRI Lab

---

## 核心问题

很多开发者（包括作者自己）假设在仓库根目录放 CLAUDE.md 或 AGENTS.md 能让 coding agent 表现更好。但这个假设从未被严格验证过。

---

## 研究方法

- **基准测试**: SWE-bench Lite + 新提出的 AGENTbench
- **AGENTbench**: 138 个实例，来自 12 个较小众的 Python 仓库，这些仓库都有开发者手写的 context files
- **测试的 Agents**: Claude Code (Sonnet-4.5)、Codex (GPT-5.2/5.1 mini)、Qwen Code (Qwen3-30b-coder)
- **三种条件对比**:
  1. 无 context file
  2. LLM 生成的 context file
  3. 开发者手写的 context file

---

## 关键发现

### 1. LLM 生成的 context files 反而降低性能

| 条件 | SWE-bench Lite | AGENTbench |
|------|----------------|------------|
| LLM 生成 vs 无文件 | -0.5% | -2% |
| 成本增加 | +20% inference tokens | +2-4 额外步骤 |

**结论**: LLM 自动生成的 context files 不仅没帮助，还增加了成本。

### 2. 手写的 context files 确实有效

- **平均提升 4%** 任务成功率
- 这是 context files 持续存在的原因：在正确的基准测试上，用正确的文件，确实有效

### 3. Agents 会忠实执行指令，但执行≠成功

- 当 context file 提到使用 `uv` 作为包管理器时，`uv` 使用频率从 <0.01 次/实例 提升到 1.6 次/实例
- 但**更多的活动 ≠ 更好的活动**
- Agents 运行更多测试、搜索更多文件、遍历更多代码，但探索更多不意味着探索正确

### 4. 核心差异：冗余 vs 增量信息

| LLM 生成文件 | 手写文件 |
|-------------|---------|
| 重复 README、文档中已有的信息 | 包含代码中不明显的内容 |
| 包含 100% 的目录枚举和代码库概览 | 记录特定的工具决策 |
| **实验验证**: 移除 .md 和 docs/ 后，LLM 生成文件性能提升 2.7% | 记录 CI 设置的 quirks |
| | 记录非默认的约定 |

**关键洞察**: 当文档文件被移除后，LLM 生成的 context files 反而表现得更好——说明冗余信息是有害的。

---

## 实用建议

### ✅ 应该写进 AGENTS.md 的内容

- **工具选择**（偏离默认值的部分）
- **非显而易见的测试配置**
- **代码中不明显的约束**
- **CI 设置的特殊之处**
- **非默认的项目约定**

### ❌ 不应该写的内容

- 重复的 README 信息
- 代码库概览（agent 自己能探索）
- 工作流总结（已经在文档里的）

### 💡 核心原则

> "Context files are useful to the extent they tell agents something they couldn't figure out from the repository itself."
>
> （Context files 只有在告诉 agent 一些它无法从仓库本身推断出的信息时才有用）

**一句话总结**: Write for the gap, not the overview. （为空白处而写，而非写概览）

---

## 成本考量

- 每个 context file 都会增加 **20% 的推理成本**，无论质量如何
- 对于高频 agentic 流程，这是不可忽视的开销
- 性能提升是否值得这个成本，取决于文件质量和任务性质

---

## 局限性与未来方向

1. **仅限 Python 仓库** — TypeScript、Rust 等多语言代码库是否适用尚不清楚
2. **仅测量 issue 解决率** — 未考虑安全性、一致性等其他维度
3. **缺少纵向研究** — context files 太新，无法研究其质量随时间的演化
4. **LLM 生成文件可以改进** — 避免重复现有文档，专注于提取非显而易见的工具决策

---

## 结论

Context files **不是魔法，但也不是无用**。

- ✅ 手写 + 具体 + 非冗余 = 有效
- ❌ LLM 生成 + 重复文档 = 有害
- 关键区别在于**指令质量**，而非指令存在与否

**给写 AGENTS.md 的人的建议**: 保持最小化和具体化。描述代码中不明显的工具和约定。README 里已有的内容就别重复了。
