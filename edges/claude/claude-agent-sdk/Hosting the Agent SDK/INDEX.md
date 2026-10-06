该页面介绍了如何在生产环境中部署和托管 Claude Agent SDK。核心点是：Agent SDK 是长期运行、有状态的进程，需要放在安全的容器沙箱中运行，并根据不同业务场景选择合适的会话/容器模式。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)

## SDK 与托管要求概要

- SDK 是一个**长时间运行**的进程，能在持久 shell 里执行命令、读写文件，并携带上下文调用工具，而不是传统一次一问的无状态 API 调用。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 推荐使用容器化沙箱来提供进程隔离、资源限制、网络控制和临时文件系统，支持通过代码配置沙箱参数。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    

## 系统和资源要求

- 运行时依赖：Python 3.10+（Python SDK）或 Node.js 18+（TypeScript SDK），以及 SDK 自带的 Node.js 用于 Claude Code CLI（不需单独安装）。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 资源建议：单实例推荐 1GiB 内存、5GiB 磁盘和 1 个 CPU，可按任务负载调整；需要能访问 `api.anthropic.com` 的出站 HTTPS，以及可选访问 MCP 服务器或外部工具。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    

## 容器/沙箱选型

- 文档列出一些托管安全执行环境的第三方提供方，如 Modal Sandbox、Cloudflare Sandboxes、Daytona、E2B、Fly Machines、Vercel Sandbox，并指出自托管可用 Docker、gVisor、Firecracker 等技术增强隔离。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    

## 四种典型部署模式

- 模式 1：短暂会话（Ephemeral Sessions）  
    每个任务启动一个新容器，用完即销毁，适合一次性任务，如单次调试、发票/收据抽取、批量翻译、图像视频处理。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 模式 2：长连接会话（Long-Running Sessions）  
    长时间保持容器和多个 Agent 进程，适合邮件代理、站点构建、需要高吞吐和低延迟的聊天机器人等持续处理场景。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 模式 3：混合会话（Hybrid Sessions）  
    容器本身是短暂的，但会从数据库或 SDK 的会话恢复功能中加载历史和状态，适合个人项目管理、深度研究、多轮客户工单等间歇交互场景。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 模式 4：单容器多 Agent  
    在一个全局容器里运行多个 Agent 进程，适合需要紧密协作的 Agent 模拟（如游戏仿真），但需避免相互覆盖文件和状态，因此通常不如前三种常用。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    

## FAQ 关键点

- 与沙箱通信：通过暴露容器端口，由应用提供 HTTP/WebSocket 接口，容器内部运行 SDK。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 成本：主要成本在模型 Token，容器本身按资源计费，最低约每小时 0.05 美元级别。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 何时关停空闲容器：依赖具体提供商的空闲超时配置，需要根据预期用户请求频率调优。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 更新 Claude Code CLI：使用语义化版本（semver），破坏性变更会提升主版本号。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 监控：容器就是普通服务，可以沿用现有后端日志和监控系统。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    
- 会话超时：Agent 会话本身不会自动超时，但建议设置 `maxTurns` 防止模型陷入循环。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    

## 后续文档链接

- 页面最后给出了若干拓展文档链接，包括安全部署、TypeScript 沙箱配置、会话管理、权限配置、成本追踪和 MCP 集成等，用于进一步细化生产级部署方案。[platform.claude](https://platform.claude.com/docs/en/agent-sdk/hosting)
    

你是打算在自己的基础设施上自托管，还是更倾向用现成的云沙箱服务来跑这些 Agent？