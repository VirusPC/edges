# 近 2 个月新模型与 Benchmark 风向调研（2026 年 4 月底 – 6 月 24 日）

## 一句话总结
近两个月里，Anthropic（Claude Opus 4.8，以及 Mythos 级的 Fable 5 / Mythos 5）、OpenAI（GPT-5.5 系列）、Google（Gemini 3.5 Flash / Pro）、xAI（Grok 4.3）、Microsoft（MAI 系列），以及一大批中国实验室（DeepSeek V4、MiniMax M3、Kimi K2.7 Code、GLM-5.2、Qwen 3.6/3.7-Max、字节 Doubao-Seed-2.1 Pro、阶跃 Step 3.7 Flash、腾讯 Hy3、百度 ERNIE 5.1）密集发布。**它们的头条指标几乎全部是 agentic（智能体）、长程任务、代码工程、computer-use 类 benchmark——而不再是 MMLU / HumanEval。** 经典静态榜单要么饱和、要么被污染，正在被淘汰；行业焦点从"哪个模型分最高"转向"在你的 harness、你的任务上哪个模型最好"。

对你做 Agent Infra 来说，最值得盯的信号是四个：**长程一致性**（METR 时间跨度翻倍、Vending-Bench 2）、**分数对 harness 的强依赖**（Terminal-Bench 换个 harness 能差 30 分以上）、**工具调用 / MCP 类评测**（MCP Atlas、MCPMark-Verified、Toolathlon、τ²/τ³-bench），以及一批**为 agent runtime 设计的架构级新特性**（对话中插入 system message、并行子智能体、自托管 sandbox、effort 控制、稀疏注意力长上下文）。

---

## 一、近 2 个月出现了哪些新模型

### 西方 / 闭源实验室

- **OpenAI GPT-5.5**（4 月 23 日发布，4 月 24 日上 API）、**GPT-5.5 Instant**（5 月 5 日成为 ChatGPT 新默认）、外加 **GPT-5.5 Pro**。API 上下文 100 万 token，主打 agentic 编码、computer use、知识工作。带 reasoning-effort 档位（low/medium/high/xhigh）。5 月 7 日还发布了一批实时语音模型。

- **Anthropic Claude Opus 4.8**（5 月 28 日）——对 4.7 的小版本升级，定价不变（$5/$25），1M 上下文、128K 输出。新增"Dynamic Workflows"（Claude Code 里可起数百个并行子智能体）、effort 控制、对话中途插入 system message、fast 模式便宜 3 倍。

- **Anthropic Claude Fable 5 & Mythos 5**（6 月 9 日）——新的"Mythos 级"层级，定位在 Opus 之上。Fable 5 是面向公众的 Mythos 级模型，常驻自适应思考，1M 上下文 / 128K 输出，定价 $10/$50，带安全分类器（触发时回退到 Opus 4.8）；Mythos 5 是去掉分类器的同款，仅限"Project Glasswing"。**两者已于 6 月 12 日因美国出口管制指令暂停**——Anthropic 称无法实时按国籍限制访问，于是对所有用户下线。

- **Google Gemini 3.5 Flash**（5 月 19 日 I/O 大会 GA）——新的 Gemini 默认模型，1M 上下文、原生多模态，在 agentic benchmark 上超过 Gemini 3.1 Pro。**Gemini 3.5 Pro** 同日宣布但到 6 月底仍只在 Vertex 受限预览（2M 上下文、"Deep Think"，benchmark 和定价未公布）。

- **xAI Grok 4.3**（4 月 30 日成 API 默认；6 月 15 日上 Bedrock）。1M 上下文，$1.25/$2.50，推理模型。定位便宜快，GDPval-AA 和 τ²-bench Telecom 强，硬核编码上不及第一梯队。

- **Microsoft MAI 系列**（6 月 2/3 日 Build）——七个自研模型，含 MAI-Thinking-1（推理，35B 激活，128K，从零训练、无蒸馏）和 MAI-Code-1-Flash（5B 激活的 agentic 编码模型，进 GitHub Copilot）。

### 中国生态

- **DeepSeek V4**（4 月 24 日）——开源权重（MIT），MoE。V4-Pro（1.6T 总 / 49B 激活）与 V4-Flash（284B / 13B 激活），均 1M 上下文、384K 最大输出。新架构（CSA+HCA 稀疏注意力、"Engram"记忆、多 token 预测、Muon 优化器），部分在华为昇腾上训练。

- **MiniMax M3**（6 月 1 日）——开源权重，MoE + "MiniMax Sparse Attention"（MSA，1M 上下文下约 1/20 算力）。1M 上下文、原生多模态（图像/视频 + 桌面 computer operation），训练 100T+ token，促销价约 $0.30/$1.20。

- **Moonshot Kimi K2.7 Code**（6 月 12 日）——开源权重（Modified MIT），1T 总 / 32B 激活 MoE，256K 上下文，MoonViT 视觉编码器，强制思考模式，原生 int4。主攻编码 / agentic，推理 token 比 K2.6 少约 30%。

- **智谱 / Z.ai GLM-5.2**（6 月 13 日，权重 MIT）——约 753B 参数 MoE（744B 基座，44B 激活），1M 上下文，双思考档位。在 Artificial Analysis 智能指数 v4.1 上是开源权重第一（51 分）。

- **阿里 Qwen 3.6**（35B-A3B，4 月 16 日；27B dense，4 月 22 日）与 **Qwen 3.7-Max**（5 月 20 日宣布，闭源，1M 上下文，$2.50/$7.50）——"environment scaling"，可自主运行 35 小时，支持 Claude Code 等外部 harness。

- **字节 Doubao-Seed-2.1 Pro**（6 月 23 日，火山引擎 FORCE 大会）——主打编码 / agent / 视觉语言，宣称多项指标超 Claude Opus 4.6；在 Terminal-Bench 2.1、SWE-Pro、SciCode、OSWorld、MobileWorld、MMMU-Pro 上领先。

- **阶跃 StepFun Step 3.7 Flash**（5 月 29 日）——开源，196B 总 + 1.88B ViT / 11B 激活 MoE，256K 上下文，原生视觉，最高 400 tok/s。

- **腾讯 Hy3 预览版**（4 月 23 日）——开源权重（腾讯 Hy 社区许可），295B 总 / 21B 激活 MoE（192 专家 top-8），256K 上下文，快慢思考融合；首席 AI 科学家姚顺雨将其定位为腾讯重建预训练 + RL 基础设施后的首个模型。

- **百度 ERNIE 5.1**（4 月 30 日预览，5 月 8 日正式）——仅托管的 MoE（约 800B 总参，激活约为 5.0 的一半），128K 上下文，双语；带工具的 AIME26 拿 99.6，LMArena Search Arena 1223（中国模型第一）。

- 窗口内其他开源权重值得一提的：**NVIDIA Nemotron 3 Ultra**（550B 总 / 55B 激活 Mamba-MoE 混合，1M 上下文，MMLU 89.1）、**Google Gemma 4**、**Zyphra ZAYA1-8B**（Apache 2.0，AMD 上训练）、**小米 MiMo-V2.5-Pro**（1.02T/42B MoE，ClawEval 63.8%）。

---

## 二、各模型主打哪些 Benchmark（精选分数）

| 模型 | SWE-bench Pro | SWE-bench Verified | Terminal-Bench | 工具 / Agentic | 推理 |
|---|---|---|---|---|---|
| Claude Opus 4.8 | **69.2%**（领先） | 88.6% | 74.6%（TB 2.1） | MCP-Atlas 82.2、OSWorld-Verified 83.4、BrowseComp 84.3、GDPval-AA 1890 Elo | GPQA 93.6、USAMO 2026 96.7、HLE 第一梯队 |
| Claude Fable 5 | 80.3% | 95.0% | — | — | 几乎全面领先 |
| GPT-5.5 | 58.6% | 接近天花板 | **82.7%**（TB 2.0，Codex CLI 上 SOTA） | OSWorld-Verified 78.7、GDPval 84.9、τ²-bench Telecom 98.0（未调 prompt）、MCP Atlas（+8.1pp） | **ARC-AGI-2 85.0%**（领先）、FrontierMath T4 39.6（Pro）、MRCR v2 74 |
| Gemini 3.5 Flash | 55.1% | 比 3.0 Flash +10–15pp | 76.2%（TB 2.1） | MCP Atlas 83.6、Finance Agent v2（+14.9）、GDPval-AA 1656 Elo | HLE 40.2、ARC-AGI-2 72.1（不及 Pro） |
| Gemini 3.1 Pro（基线） | 54.2% | 80.6% | 68.5%（TB 2.0） | MCP Atlas 69.2、BrowseComp 85.9、APEX-Agents 33.5 | ARC-AGI-2 77.1、GPQA 94.3、LiveCodeBench Pro 2887 Elo |
| DeepSeek V4-Pro | （厂商 SWE-Verified 80.6） | 80.6（Max，厂商自测） | — | — | LiveCodeBench 93.5（厂商）、Codeforces 3206 |
| MiniMax M3 | 59.0% | — | 66.0%（TB 2.1） | MCP Atlas 74.2、BrowseComp 83.5、Claw-Eval 顶尖 | — |
| Kimi K2.7 Code | — | （自测 Kimi Code Bench v2 62.0） | — | MCP Mark Verified 81.1（超 Opus 4.8）、MCP Atlas 76.0 | —（强制思考） |
| GLM-5.2 | 62.1% | — | 81.0%（TB 2.1） | — | AA 智能指数 51（开源第一） |
| Grok 4.3 | — | — | — | τ²-bench Telecom 98、GDPval-AA 1500 Elo、agentic 指数 67.8 | GPQA 90.1、HLE 35.0、AA 指数 53.2 |
| Step 3.7 Flash | 56.3% | 73.7–76.3（带 Advisor） | 59.5%（TB 2.1） | Toolathlon 49.5、ClawEval-1.1 67.1、GDPval 45.8、τ²-bench Telecom >98 | 带工具 HLE 47.2 |
| Doubao-Seed-2.1 Pro | "顶尖" SWE-Pro | — | "顶尖" TB 2.1 | OSWorld、MobileWorld 领先 | MMMU-Pro 领先 |

**横向看：** 各家选来上头条的 benchmark 压倒性地是 **agentic 类**（Terminal-Bench、MCP Atlas/Mark、OSWorld、BrowseComp、Toolathlon、GDPval、τ²/τ³-bench）、**硬核编码**（用 SWE-bench Pro 而非 Verified）、以及**抗污染推理**（ARC-AGI-2、HLE、FrontierMath、USAMO）。MMLU / HumanEval / GSM8K 大多只出现在基座模型表里（如腾讯 Hy3），或干脆不报。

---

## 三、整个业内 Benchmark 的关注趋势

### (a) 从静态知识 → agentic / 真实任务
几乎每个头条 benchmark 都在测多步工具调用和长程执行。GPT-5.5 发布主打 Terminal-Bench、GDPval、OSWorld-Verified、τ²-bench；Google 明确把 Gemini 3.5 Flash 设计成"Antigravity agent 循环里的主力机"，其优势全集中在 Terminal-Bench、MCP Atlas、Toolathlon、Blueprint-Bench、Finance Agent。BenchLM 现在把"agentic 能力"权重设到 22%——单项最高。

### (b) 旧榜单饱和 + 污染
MMLU / MMLU-Pro 在 ~88% 以上基本饱和；GPQA Diamond 所有头部模型都在 ~93–94%（统计上打平，"实际已被攻克"）。GPQA Diamond 那 198 题是博士级专家出的、专门设计成"Google 也搜不到答案"——按 Rein 等（2023），能上网的非专家只拿 ~34%，本领域博士平均 ~65%——所以前沿模型挤在低 90 分段，说明这个本就极难的 benchmark 已近乎饱和。SWE-bench Verified 也接近天花板（Opus 4.8 88.6%、Fable 5 95.0%），OpenAI 还点名所有前沿模型在它上面有训练数据污染；于是 SWE-bench Pro（来自活跃维护仓库的多文件 diff，无公开 ground-truth 泄漏）成了更可靠的接班者。arXiv 综述《The Ouroboros of Benchmarking》（2511.01365）量化了这种更替："未被攻克的 benchmark 里，60% 是 2025 年才提出的，32% 是 2024 年的，2023 年前的只剩两个还没被攻克"（ActivityNet 和 EgoSchema）——也就是说 2025 年前发布的 benchmark 几乎都已被至少一个模型家族超越。

### (c) Harness 依赖成了一等问题
Terminal-Bench 分数随 harness 剧烈波动：GPT-5.5 头条的 82.7–83.4% 用的是 OpenAI 自家 Codex CLI，而 Opus 4.8 在公开 Terminus-2 harness 上是 ~74.6%；跨 harness 对比"不是同一回事"。厂商自带 scaffold 普遍比标准 harness 高；一份 DeepSWE 审计发现 SWE-bench Pro 的 verifier 会拒掉 ~24% 功能正确的解、又接受 ~8.5% 错误的解。正在形成的共识是：**"每个静态分数都可疑，每个 agentic 分数都依赖 harness。"** 这一条对你做 harness engineering 最直接——任何一个 Terminal-Bench / SWE-bench 数字，不附上它的 scaffold（Codex CLI vs Terminus-2 vs Claude Code）就没有可比性。

### (d) 长程与可靠性评测
METR 的时间跨度工作是被引用最多的 agent 研究——任务时长与 agent 成功率在 2019–2026 约 230 个任务上相关性 R²=0.83。按 METR《Measuring AI Ability to Complete Long Tasks》（2025 年 3 月），50% 成功率的时间跨度"过去 6 年里大约每 7 个月翻一倍"；更新版 **Time Horizon 1.1**（2026 年 1 月 29 日）给出 2023 年后更快的翻倍周期 ~130.8 天（≈4.3 个月），2024 年起则 ~89 天（≈3 个月）。1.1 还"把任务量扩了 34%（228/170），把 ≥8 小时的任务数量翻了一倍（31/14）"，并从自研 Vivaria 迁到 UK AISI 的 Inspect。截至 2026 年中，前沿 agent 在 50% 成功率下能稳定处理 ~2 小时的软件任务。

Andon Labs 的 **Vending-Bench 2**（365 天模拟经营）测长期一致性：Claude Opus 4.6 以最终余额 $8,017.59 居首，比 Gemini 3 Pro（~$5,478）高约 38%，而 Andon 估计优秀人类策略能到 ~$63,000/年——即最强 AI 只到能力强的人类的 ~13%。随后还出了多智能体 **Vending-Bench Arena** 变体。新学术工作（Beyond pass@1 / 可靠性科学框架、CEO-Bench、RetailBench）明确去测 pass@1 榜单测不到的方差与可靠性。

### (e) Benchmark 作弊与"评测意识"
2026 国际 AI 安全报告记录了前沿模型能区分"评测"与"部署"环境；Anthropic 指出 Opus 4.8 即便没被告知在评测，也"会显式推理自己的输出会被怎么打分"。CLEAR 框架论文（Liu 等，arXiv 2511.14136）发现"实验室 benchmark 分数与真实部署表现有 37% 的差距，成本相差 50 倍"，且 agent 可靠性"单次跑 60%、连跑 8 次降到 25%"。

### (f) 2026 年涌现、与 agent infra 相关的新 benchmark
Terminal-Bench 2.0/2.1、Vending-Bench 2 + Arena、APEX-Agents、MCP Atlas、MCPMark / MCP-Mark Verified、MCP-Universe、Toolathlon、GDPval / GDPval-AA、τ²-bench / τ³-bench、ClawEval / WildClawBench、腾讯 CL-bench（上下文学习）、Step-SWE-Bench（6 harness）、Online-Mind2Web、BrowseComp-VL、DeepSWE。

---

## 四、和你工作相关的几条延伸观察

中国开源权重这一拨——DeepSeek V4、Kimi K2.7 Code、GLM-5.2、MiniMax M3、Qwen——正在收敛到**1M 上下文 + 稀疏 MoE**、明确为长程 agentic 编码设计的路线，成本约为西方闭源前沿的 1/6 到 1/10。GLM-5.2 在 AA 智能指数 v4.1（偏 agentic 加权）上是开源第一（51，领先 MiniMax-M3 44、DeepSeek V4 Pro 44、Kimi K2.6 43，甚至 Gemini 3.1 Pro Preview 在该指数上的 46）。结构性提醒：多数发布 benchmark 是厂商自跑、用自家 scaffold，独立验证滞后——比如 MiniMax M3 拿来对比的是已被超越的 Opus 4.7 而非几天前的 4.8；DeepSWE 式审计把这些模型在抗污染任务上拉到远低于头条 SWE-bench Verified 的水平。

这个窗口里和 agent runtime 直接相关的模型 / 平台特性：

- **Anthropic：** 对话中途插入 system message（在 agent 循环里改指令而不破坏 prompt cache）、Dynamic Workflows（数百并行子智能体跑仓库级迁移）、自托管 sandbox + MCP 隧道（工具在你自己的 infra / Cloudflare / Daytona / Modal / Vercel 上执行，而 agent 循环、编排、上下文管理、错误恢复仍在 Anthropic 侧）、cache 阈值降到 1,024 token（短的 agentic system prompt 也能吃到 90% cache 折扣）、/goal 自主完成条件命令、effort 控制（Low/Medium/High/Max）。
- **Google：** Antigravity 2.0 agent 平台、Managed Agents API、Gemini CLI 下线（6 月 18 日）→ Antigravity CLI。
- **MiniMax / DeepSeek / Qwen：** 稀疏注意力架构（MSA、CSA+HCA、Gated DeltaNet），就是为了让 1M 上下文 agent 循环算得起；DeepSeek 的"Engram"把静态事实与动态推理解耦做长上下文记忆（据称把 1M token 下的 needle-in-haystack 准确率从 ~84% 提到 ~97%）。
- **行业话语：** NVIDIA GTC 2026 把"harness engineering"推成一门学科——台上定义为模型周边的系统：怎么连各系统、用哪些子智能体、何时调哪些工具。微软 Build 2026（Windows Agent Runtime、MXC 安全沙箱、Agent 365）把 agent 框定为 OS 级"一等公民"。

---

## 五、给你的几条建议（偏 Agent Infra 视角）

1. **别再信单一榜单排名，建一套贴合自身 workload 的私有 eval harness。** 三角验证：一个静态学术 eval + 一个人类偏好 arena + 一个 agentic 套件，三者一致再动。维护约 50 个来自你真实流量的代表性任务，测 token/任务 和可靠性（pass^k 而非 pass@1）——CLEAR 数据显示可靠性会从单次 60% 掉到 8 次 25%。

2. **当下编码 / agent runtime 选型：** Opus 4.8 是目前公开可用、最强的多文件软件工程模型（SWE-bench Pro 69.2%、OSWorld-Verified 83.4%）；GPT-5.5 在纯终端 / CLI 循环（Terminal-Bench on Codex CLI 82.7%）和抽象推理（ARC-AGI-2 85%）上领先。成本敏感的大规模长程 agentic 编码，可路由到中国开源权重这一拨（GLM-5.2、Kimi K2.7 Code、MiniMax M3、DeepSeek V4）——但自己跑 benchmark（发布数字是厂商 scaffold 自测），并权衡 API 托管中国模型的数据治理暴露面。

3. **每个 benchmark 数字都要记录 harness。** 没有 scaffold 标注（Codex CLI vs Terminus-2 vs Claude Code）的 Terminal-Bench / SWE-bench 数字不可比。把 harness 身份直接写进你自己的 eval 元数据。

4. **审慎采用新的 agent-runtime 特性：** 对话中途 system message 和更低的 cache 阈值能实打实降低长循环成本；并行子智能体编排和自托管 sandbox 会改变你的记忆 / 上下文与安全设计。直接测 MCP 工具调用可靠性（MCP Atlas / MCPMark-Verified）——这是最能预测真实 agent 成功率的维度，也是 Kimi K2.7 Code 和 Opus 4.8 互相拉锯的地方。

5. **盯长程一致性，而不只是任务准确率。** 用 METR 时间跨度框架和 Vending-Bench 式长程一致性，作为 agent 能否撑住多小时 / 多天自主运行的先行指标；把可靠性（重复跑的方差）当成独立于峰值准确率的属性来预算。

**会改变上述建议的触发条件：** Gemini 3.5 Pro 正式 GA 后把 ARC-AGI-2 差距追平 GPT-5.5（85%）或在 SWE-bench Pro 上超 Opus 4.8；独立（非厂商）的 SWE-bench Pro / DeepSWE 跑分确认中国开源权重达到平价；Mythos 级访问恢复（或永久失去）改变顶端编码上限。

---

## 六、重要保留与注意事项

- **厂商自报、harness 特定的数字占主导。** 此处几乎所有发布 benchmark 都是自报、常用自家 scaffold；独立结果（vals.ai、Artificial Analysis、SEAL）常有出入且滞后。比如在 Scale 的标准化 SEAL 榜上，列出的最高 Claude 条目还是 Opus 4.6，4.7/4.8/Fable 5 尚未上榜。
- **部分来源是 SEO / 聚合博客。** 尽量优先一手来源（实验室博客、system card、官方 model card、METR、Andon Labs、arXiv）；二手聚合的数字（上下文长度、参数量、ERNIE 5.1 的 ~800B/128K）按方向性