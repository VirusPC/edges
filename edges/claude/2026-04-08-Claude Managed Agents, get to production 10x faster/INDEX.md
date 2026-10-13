Claude Managed Agents 是 Anthropic 在 Claude Platform 上推出的一套托管式智能体基础设施，让团队用可组合的 API 在云端快速构建、部署和运行代理（agents），从原型到生产可以从“数月”缩短到“数天”，并按用量计费。[claude](https://claude.com/blog/claude-managed-agents)

## 产品是什么

- 提供“Managed Agents”托管运行时：你只需定义任务、工具和安全边界，执行、编排、容错等都由平台托管。[claude](https://claude.com/blog/claude-managed-agents)
    
- 面向单一任务代理和复杂多代理流水线场景，支持在云端长时间运行、自动决策和重试。[claude](https://claude.com/blog/claude-managed-agents)
    
- 当前处于 Claude Platform 公共测试（public beta）阶段。[claude](https://claude.com/blog/claude-managed-agents)
    

## 关键能力

- **生产级代理运行环境**：内置安全沙箱、认证、工具执行，减少自建基础设施的需求。[claude](https://claude.com/blog/claude-managed-agents)
    
- 长时会话：支持自主运行数小时，会话进度和输出在断线后依然保留。[claude](https://claude.com/blog/claude-managed-agents)
    
- 多代理协同：支持一个代理拉起并调度其他代理以并行处理复杂任务（研究预览，需要申请访问）。[claude](https://claude.com/blog/claude-managed-agents)
    
- 治理与权限：内置身份管理、权限范围控制和执行追踪，方便审计和合规。[claude](https://claude.com/blog/claude-managed-agents)
    

## 与 Claude 模型的结合

- 专门为 Claude“agentic”能力设计，支持你声明目标与成功标准，由模型自评估并迭代直到达成目标（研究预览）。[claude](https://claude.com/blog/claude-managed-agents)
    
- 相比传统 prompt loop，内部测试中在结构化文件生成任务上，成功率最高提升约 10 个百分点，尤其在复杂任务上提升明显。[claude](https://claude.com/blog/claude-managed-agents)
    
- 在 Claude Console 中提供完整的会话追踪、集成分析和排错视图，可以逐步查看每一次工具调用和决策。[claude](https://claude.com/blog/claude-managed-agents)
    

## 已有落地案例

文中列举了多个用 Managed Agents 上生产的例子：[claude](https://claude.com/blog/claude-managed-agents)

- Notion：在 Notion 工作区内提供可委派任务的代理（Notion Custom Agents 私测），支持从写代码到生成网站、PPT 等，并行执行多任务。[claude](https://claude.com/blog/claude-managed-agents)
    
- Rakuten：在 Slack / Teams 中为产品、销售、市场、财务团队提供企业级代理，一周内即可部署各类专家代理，输出表格、幻灯片、应用等内容。[claude](https://claude.com/blog/claude-managed-agents)
    
- Asana：构建 Asana AI Teammates，代理在项目中接任务并产出交付物，依托 Managed Agents 快速添加复杂能力。[claude](https://claude.com/blog/claude-managed-agents)
    
- Vibecode：用 Managed Agents 作为默认集成，从 prompt 到部署应用的链路完全代理化，让用户可以 10x 更快获得同等基础设施能力。[claude](https://claude.com/blog/claude-managed-agents)
    
- Sentry：将调试代理 Seer 与 Claude 写补丁代理串联，从定位根因到生成 PR 在一个流程内完成，几周内上线且减少持续运维成本。[claude](https://claude.com/blog/claude-managed-agents)
    

页面还穿插多家公司的工程和产品负责人引用，核心观点都是：之前自建 LLM 运行沙箱、工具集成和生命周期管理需要数周到数月，现在几行代码即可获得相同能力，开发和迭代速度大幅提升。[claude](https://claude.com/blog/claude-managed-agents)

## 定价与接入方式

- 计费模式：按消耗计费，使用标准 Claude Platform token 单价，外加每小时 0.08 美元的“active runtime session-hour”费用。[claude](https://claude.com/blog/claude-managed-agents)
    
- 接入路径：
    
    - 通过 Claude Platform 文档的 Managed Agents 章节进行集成。[claude](https://claude.com/blog/claude-managed-agents)
        
    - 在 Claude Console 中使用 agent quickstart 页面或新 CLI 部署首个代理。[claude](https://claude.com/blog/claude-managed-agents)
        
    - 也可以在最新 Claude Code 中使用内置的 claude-api Skill，通过对话方式触发“managed agents”入门流程。[claude](https://claude.com/blog/claude-managed-agents)
        

你更关心的是整体产品定位（比如和自建 agent runtime 的对比），还是想看一下具体 API/架构细节如何落地到你当前的系统里？