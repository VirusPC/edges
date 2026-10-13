这篇文章的核心：在生产环境里，要让 agent 稳定、安全、高效地“够到”你的真实系统，最佳做法是围绕 MCP 打一层通用协议层，再配合技能（skills）、OAuth、vault 等机制，把可达性、语义表达和运维成本都做到可规模化。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)

---

## 在解决什么问题？

- 生产 agent 需要访问各种真实系统（API、SaaS、内部服务），但传统直连 API 或 CLI 模式会造成 M×N 集成地狱（每个 agent × 每个服务一套定制集成）。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- 本地/容器环境可用 CLI，但一旦上云、上移动端/浏览器，CLI 覆盖范围和鉴权模型都受限，很难成为统一方案。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- 企业希望一个集成同时服务多客户端（Claude、ChatGPT、Cursor、VS Code 等），并把鉴权、交互 UI、上下文管理标准化，而不是为每个平台重写一次集成。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    

---

## 文章提出的解法（高层）

- 引入 MCP 作为“协议层”：服务端暴露工具和数据源，客户端（各类 agent 宿主）统一用协议发现、鉴权和调用，形成一个一对多的通用层。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- 对于服务端，强调：
    
    - 远程 MCP server（而不是本地）以覆盖 web、移动端和云端 agent。
        
    - 工具按“意图”聚合，而不是 1:1 映射 API endpoint，降低调用步数（例如 create_issue_from_thread 一步搞定而不是多步组合）。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
    - 面向超大 API 面时，提供“代码编排”入口（让 agent 写短脚本，由 server 执行 API 调用，返回聚合结果），像 Cloudflare MCP server 那样用少量工具覆盖上千 endpoint。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
    - 利用 MCP Apps 返回交互式 UI（图表、表单、dashboard），提高 adoption 与留存，而不仅仅是纯文本返回。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
- 对于客户端（agent runtime），强调上下文效率：
    
    - Tool search 按需加载工具定义，而不是一口气塞满，测试里可减少 85%+ 的工具定义 token。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
    - Programmatic tool calling：在代码沙箱中循环/过滤/聚合工具结果，仅将最终摘要喂回模型，复杂工作流可节省约 37% token。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

---

## 效果和趋势

- MCP SDK 每月下载量从年初的 1 亿增长到 3 亿，说明协议层在企业和平台里快速普及；Claude 自家的 Cowork、Managed Agents、Claude Code channels 等核心能力都建立在 MCP 之上。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- MCP Apps 与 elicitation（表单模式、URL 模式）让工具交互更“产品化”：可以在对话中弹 UI、补参数、做 OAuth 或支付，引导用户持续在流中完成关键动作。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- 标准化 OAuth（CIMD）与 vault（在 Claude Managed Agents 中托管 OAuth token）减少你自己搭密钥管理和 token 传递的工作，把安全与续期交给平台处理。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- 成熟方案往往三件套同时存在：
    
    - API：底层能力；
        
    - CLI：本地/DevOps 工作流；
        
    - MCP：云端 agent 的关键“复利层”，随着协议扩展和客户端增加，你的同一个 MCP server 不断被放大能力。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

---

## 作为 agent infra 工程师：可执行行动

## 1. 统一接入层：优先建设 MCP server

- 为核心业务系统设计 1–2 个 **远程** MCP server：
    
    - 选定 SDK（TS/Go/Python 等），先覆盖最关键的几类任务，而不是平铺所有 API。
        
    - 以“任务意图”为维度设计工具，例如：create_customer_and_contract、sync_tickets_from_jira_to_internal_system。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
- 对大型平台（如你们对接的云厂商、K8s、内部 service mesh）：
    
    - 实现一个“执行脚本”工具（execute_script / run_ops_code），把长尾操作放在脚本层，而不是在 MCP 层暴露几百个 endpoint。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

## 2. 标准化鉴权与凭证管理

- 按 MCP 最新 spec 接入 OAuth + CIMD：
    
    - 给每个客户端准备 Client ID Metadata Document，减少首登体验摩擦和重复 re-auth。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
- 对接 Claude Managed Agents 或你自建的 agent 平台时，借鉴“vault”模式：
    
    - 把用户 OAuth token 统一存到一个“凭证库”实体，session 只引用 vault ID，不直接传 token。
        
    - 在平台层实现自动刷新逻辑，避免微服务之间互相传 token。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

## 3. 把 MCP Apps 和 elicitation 做成产品规范

- 为关键工具设计 MCP Apps：
    
    - 常见场景：数据分析结果图表、运营 dashboard、工作流配置表单、审批界面等，统一通过“Apps”在对话中展示。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
- 对所有“有破坏性操作”或“需要用户补充信息”的工具，统一接入 elicitation：
    
    - form mode：缺参数/需要确认时直接弹表单。
        
    - URL mode：OAuth 回调、支付、极敏感凭证统一跳浏览器完成。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

## 4. 在你们的 agent runtime 里落地“上下文节省模式”

- 实现 tool search：
    
    - 用索引/向量检索或规则，按需求将少量相关工具的 definition 注入上下文，而不是一次性加载全 catalog。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
- 实现 programmatic tool calling：
    
    - 把多步查询与复杂数据处理迁移至代码沙箱（可用 Node/Python 容器），模型只负责规划与总结。
        
    - 对现有复杂链路（多系统汇总报表、批量运维等）做一次迁移，看 token 与时延的实际收益。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

---

## 作为业务开发：如何用这些能力做事情

- 针对每条业务线，先梳理“高价值场景 + 需要跨系统”的任务，比如：
    
    - 销售：从 CRM + 邮件 +内部审批系统生成报价及合同草稿。
        
    - 运营：从监控 + 工单系统一键生成问题复盘报告。
        
- 然后：
    
    - 用 MCP server 暴露这些系统的关键任务接口，按业务意图封装工具。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
    - 为这些任务写技能（skills）：把业务流程的“操作 SOP”变成可复用的 procedural knowledge，比如“如何从异常告警走到创建问题单并通知相关负责人”。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
    - 将技能和 MCP server 打包成插件（plugin），供公司内部各种 IDE、聊天界面或工作台复用。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        

---

## 与最新 AI 进展的关联

- 现在的 SOTA 模型（包括 Claude、GPT 系列等）越来越强在“多工具编排”和“长流程执行”，但真正的价值来自：
    
    - 通用协议层（MCP）让模型可触达更多系统和 UI。
        
    - skills 把“怎么用这些系统完成任务”的流程知识标准化、版本化。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
        
- Agent 的竞赛正在从“单模型能力”转向“生态与协议”：谁有更多优质 MCP servers、apps、skills，就更容易构建高质量 agent 产品，且跨平台可复用。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    
- 标准化 OAuth、vault、Apps、elicitation 等其实是在把“企业级约束”（合规、安全、审计、复杂流程）编码进协议，让大模型在真实生产环境中可控地发挥能力，而不是停留在 demo。[claude](https://claude.com/blog/building-agents-that-reach-production-systems-with-mcp)
    

---

如果按你现在的体系，只能优先做一块的话，你更想先推进的是统一的 MCP server（接业务系统），还是 agent runtime 里的 tool search / programmatic calling 能力？