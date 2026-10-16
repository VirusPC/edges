# 学 AI Infra 的硬件选型与真实环境模拟

## 背景

2026-10-16 20:46–20:49（Asia/Shanghai），用户 peng cheng 问 Grok Bot：想学 AI Infra，买 Mac Studio 还是 DGX Spark；随后追问 Spark 是否已过时、DGX Station 如何、Spark 与两张 RTX PRO 6000 怎么选，最后问怎样真正模拟生产环境。以下价格与时间线来自助手当晚的网页检索，未经本人核实，购买前需重查渠道、到货与保修。

## 结论

- 目标是「学 AI Infra」时，优先 **DGX Spark**，不是 Mac Studio。行业主流栈是 Linux + CUDA、Docker、vLLM / TensorRT-LLM、NCCL、多机互联；Spark 把这一套桌面化。Mac Studio（MLX、统一内存大、带宽高）适合本地推理与日常，但生态与公司 GPU 集群对不上。
- 只有在主要诉求是本地跑大模型聊天、几乎不碰 CUDA 运维时，才考虑高内存 Mac Studio。

## 各选项要点

| 选项 | 要点 | 适合 |
| --- | --- | --- |
| DGX Spark | GB10 Grace Blackwell，128GB 统一内存，带宽约 273 GB/s，标称 1 PFLOP FP4，DGX OS 开箱即用，功耗约 240W；2025-03 发布、2025-10 出货，2026-10 新增 64GB 配置（检索到起价约 $4,999）。单 GPU、推理不快；可两台用 ConnectX-7 互连练多机 | 预算约 1 万美元内，学整套栈 |
| Mac Studio | 统一内存可很大、带宽高，本地推理强；macOS/MLX 生态 | 本地推理 + 日常机，不是学 CUDA infra |
| DGX Station | GB300 Blackwell Ultra，约 748GB 连贯内存（252GB HBM3e + 496GB LPDDR5X），HBM 约 7.1 TB/s，约 1600W，ConnectX-8；走 OEM，公开报价约 9–16 万美元 | 企业桌面迷你机房，个人学习性价比差 |
| 2× RTX PRO 6000 | 每张 96GB GDDR7、约 1.8 TB/s，合计 192GB；能真练单机多卡（张量并行、NCCL、vLLM 多卡、多卡微调）。两张卡约 3.5 万美元另加整机，无 NVLink 走 PCIe，千瓦级功耗与散热需自理 | 预算 4 万美元以上，明确要练多卡或拿来干活 |

「Spark 是否过时」：它约满一年、仍在扩 SKU，是个人 DGX 入门机的在售型号。更新的 **RTX Spark**（2026-05 宣布）面向 Windows 笔记本/小主机，不是同一条线。

## 怎样真正模拟生产环境

关键不是再买卡，而是分层对齐：

1. **软件栈**：本地用 Docker 固定 CUDA、驱动、`nvidia-container-toolkit`、vLLM / TensorRT-LLM / Triton、`nccl-tests`。很多 infra 难点在版本矩阵和容器，而不在算力。
2. **多卡行为**：云上按小时租 2–8 卡 H100/A100/B200 练张量并行和 NCCL，用完就关，比自购两张卡更接近数据中心。
3. **编排**：单机 k3s + GPU device plugin（可选 Volcano / Kueue），练申请 GPU、排队、挂 PVC、拉镜像。
4. **观测与发布**：Prometheus + DCGM、Grafana、日志；完整做一次模型服务上线（镜像、健康检查、滚动更新、回滚）。
5. **别用 Mac / CPU 模拟 CUDA**：学不到驱动、NCCL、拓扑、OOM、显存碎片等真问题。

最小练习闭环：本机（或 Spark）固定 CUDA + Docker → 云上 2×H100 跑通 vLLM 多卡与 `nccl-tests` → 本机 k3s 把同一任务改成 Job/Deployment → 加 DCGM 看板。

## 待定

- 用户尚未表态买哪台、预算多少；助手提出可按现有 minigtr 与预算压成「本周命令清单」，用户未回应。
