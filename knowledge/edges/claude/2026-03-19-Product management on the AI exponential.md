这篇文章讲的是在模型能力指数级提升的时代，产品经理如何调整工作方式，特别是围绕 Claude Code 这一类 AI 编程工具形成的新工作流。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)

## 核心观点概览

- 模型能力在 16 个月内从“能完成 21 分钟的人类任务”跃迁到“能完成接近 12 小时的人类任务”，产品的技术边界在项目中途就可能发生变化。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    
- 传统“先调研写 PRD，再长期按路线图执行”的节奏已经不适用，需要围绕“快速实验、持续交付、迭代放大有效方向”来重新设计产品节奏。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    
- Claude Code、Claude.ai、Cowork 等工具组合，正在让 PM、工程师、设计师角色边界变得模糊，每个人都能直接构建原型和评估实验。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    

## 作者个人经历与工具组合

- 作者 Cat Wu 先是产品工程师，后做 VC，再在 Anthropic 做 Research PM，早期就用 Claude Code 写 Streamlit 工具、跑 eval、搭建 RL 环境等，全程几乎不手写代码，只通过大量 prompt 驱动开发。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    
- 她的“工作三件套”是：Claude.ai 做思维伙伴（策略讨论、写文档、问问题），Claude Code 负责写代码和原型，Cowork 负责邮件、待办、PPT、查 Slack 历史、订差旅等知识工作自动化。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    
- 行业内其他 PM（如 Decagon、Datadog 的 PM）也采用类似工作流：先用 Cowork 聚合上下文，再用 Claude Code 在数小时内做出可 demo 的原型，然后用 offline eval + 真实用户反馈来驱动迭代。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    

## “AI 指数级时代”的四个产品管理转变

1. 短周期规划与 side quest
    
    - 不再把“探索”只放在 roadmap 之前，而是鼓励团队成员持续做 side quest：半天时间做一个原型、试一个看似“不太可能”的能力、或把模型推到边界看看能做到什么。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
    - Claude Code 桌面版、AskUserQuestion 工具、todo list 等多个功能，都来自这种非正式 side quest，而不是自上而下规划出来的长期项目。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
2. 用 demo 和 eval 代替文档优先
    
    - 团队更偏向“原型优先”：站会不是读文档，而是放 demo，让内部用户直接上手，用真实使用热度决定要不要打磨成正式功能。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
    - 例如 plugins 规范就是 PM 把 spec 丢给 Claude Code，模型给出接近可上线的原型，再以此为锚点来定 UX 和实现细节；agent teams 功能则通过手工设计 eval 集合来观察它在什么场景好用、什么场景失败，再针对性改进。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
3. 随模型更新反复重访已有功能
    
    - 每次模型大版本更新都意味着“已有功能可能可以做得好很多”，因此要主动回头审视已经上线的能力，而不是“做完就封存”。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
    - 一个例子是 Claude Code with Chrome：用户原本手动在 Code 里写 web app，再切到 Chrome 里用 Claude 测试，频繁手动复制指令；团队观察这种“用户自制工作流”，把它产品化成内建功能。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
    - 原型阶段要优先优化能力而非成本：先用更多 token 测试“事情是否可行”，等确认价值后再在后续用更便宜的模型或优化 prompt 来降本。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
4. 坚持“做最简单可行的实现”
    
    - 如果现在为了绕过模型能力不足做了复杂 workaround，下一个更强模型发布时这些复杂度就会变成累赘，因此实现要尽量简单，以便轻松替换新能力。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        
    - 早期 Claude Code 的 todo list 功能，模型不会可靠勾选完成项，于是加了系统提醒来强行触发更新，这是个“聪明但复杂”的 hack；新模型发布后能力自然提升，这些提醒就可以删掉，系统 prompt 也随模型迭代而持续“瘦身”。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
        

## 对 PM 角色与组织协作的影响

- 在 AI 原生环境下，PM 的核心变成：在模型快速进化带来的不确定性中创建清晰方向，帮助团队大胆设想更大空间，并扫清从想法到上线的障碍。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    
- 作者认为 PM 要同时盯住两条曲线：一是 AI 如何改变你自己的工作方式（例如从文档驱动变成原型驱动），二是它如何改变你能给用户提供的产品可能性。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    
- Anthropic 内部不仅是产品团队，数据科学、金融、市场、法务、设计等职能也都主动用 Claude 工具改造自己的工作流程，让整个组织在同一个“加速节奏”下运转，而不是被交接拖慢。[claude](https://claude.com/blog/product-management-on-the-ai-exponential)
    

如果只针对你自己的工作，你更想深入哪一块：是“如何设计自己的 Claude Code + 工具组合工作流”，还是“如何在团队内推广 side quest / demo-first 这些实践”？