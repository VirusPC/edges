# 观测 (observation/)

`observation/` 观测 Edges **怎么被用**：telemetry 笔记、仪表盘备忘、run log、「野外看到了什么」。这是系统元工作，运营向观测，不替代 [`.memory/`](../.memory/) 里的决策，也不进入 notes → edges → archive 主链。

## 放什么

- 脱敏后的运行记录、使用轨迹摘要
- 指标定义、仪表盘笔记、异常现象
- 还没上升为决策的「我们看到了什么」

## 不放什么

- 凭据、未公开 IP、可识别个人、未脱敏的内部信息
- 已确认的决策、纠错、必须遵守的做法 → [`.memory/`](../.memory/)
- 认知资产、研究笔记 → [`knowledge/`](../knowledge/)
- 接入 Edges 的接口实现 → [`extensions/`](../extensions/README.md)
- 可复现的评测用例、harness 与分数 → [`evaluation/`](../evaluation/README.md)
- 原始 `*.log` 文件（根 [`.gitignore`](../.gitignore) 会忽略它们）；写成脱敏 markdown

本仓公开。写入即等同公开发表，按根 README「公开仓库边界」判断。

## 和其他目录的关系

| 目录 | 关系 |
| --- | --- |
| [`knowledge/`](../knowledge/) | 认知资产。观测记录的是系统如何被使用，不是研究笔记。野外现象若值得沉淀为可复用判断，先回到捕获入口。 |
| [`.memory/`](../.memory/) | 运营账本。观测提供证据；被采纳的决策、纠错与约束写进 `.memory`，不把本目录当成第二份决策库。 |
| [`extensions/`](../extensions/README.md) | 接口层。观测可以记录某个 extension 在野外的表现；实现仍在 extensions。 |
| [`evaluation/`](../evaluation/README.md) | 评测把假设做成可复现对照；本目录只记看到了什么。观测不是评测。 |

## 起步布局

先有真实记录再往下加目录，不要预埋空数据或虚构指标。

- [`logs/`](logs/README.md)：脱敏后的 run / 使用记录
- [`metrics/`](metrics/README.md)：指标定义与仪表盘笔记
- 本 README
