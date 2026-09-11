# 评测 (evaluation/)

`evaluation/` 评测**整套 Edges**：skills、记忆循环、note→edge 流程、Agent 对着本仓库的行为等。这是系统元工作，不是个人知识笔记，也不进入 notes → edges → archive 主链。

## 放什么

- 评测用例、harness、benchmark 定义、scorecard
- 对照某次变更或某条假设的评测报告
- 用来判断「系统有没有变好」的可复现实验设计

## 不放什么

- 个人认知资产、研究笔记、对外博客 → [`knowledge/`](../knowledge/)
- 已采纳的决策、纠错、操作手册 → [`.memory/`](../.memory/)
- 接入 Edges 的 CLI / MCP / skill 实现 → [`extensions/`](../extensions/README.md)
- 野外使用记录、运行日志、仪表盘笔记 → [`observation/`](../observation/README.md)
- 编造的数据集、假分数、尚未跑过的「结果」

本仓公开。用例与报告按根 README「公开仓库边界」脱敏；不要写入凭据、未公开 IP 或可识别个人。

## 和其他目录的关系

| 目录 | 关系 |
| --- | --- |
| [`knowledge/`](../knowledge/) | 认知资产。评测可以*调用*其中的材料当输入，但不把报告写成 Note / Edge / Post。一条评测结论若值得沉淀为可复用判断，先回到捕获入口。 |
| [`.memory/`](../.memory/) | 运营账本。评测*发现*并被采纳的决策写进 `.memory`；过程、用例和分数留在本目录。 |
| [`extensions/`](../extensions/README.md) | 接口层。评测对象常常是 extensions 的行为；评测用例本身不因此变成 extension。 |
| [`observation/`](../observation/README.md) | 观测提供「野外看到了什么」；本目录把假设做成可复现对照。观测不是评测。 |

## 起步布局

先有真实用例再往下加目录，不要预埋空数据文件。

- [`cases/`](cases/README.md)：用例与 benchmark 定义
- [`reports/`](reports/README.md)：某次运行的报告
- 本 README
