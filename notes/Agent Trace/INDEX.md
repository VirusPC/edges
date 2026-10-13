## Summary
Agent Trace 是一个用于“标记哪些代码是 AI 写的、哪些是人写的”的开放规范，面向任何带版本控制的代码仓库。[agent-trace](https://agent-trace.dev/)

## 核心目的

- 提供统一、**中立** 的数据格式，把代码改动和“贡献者”（人类或 AI 模型）关联起来。[agent-trace](https://agent-trace.dev/)
    
- 支持在文件级、行级知道“这段代码是哪次对话、哪个模型生成/修改的”。[agent-trace](https://agent-trace.dev/)
    
- 让不同 IDE、代理、平台之间可以读写同一种追踪格式（互操作）。[agent-trace](https://agent-trace.dev/)
    

## 不做的事情

- 不定义法律层面的代码**所有权**，只做技术归因。[agent-trace](https://agent-trace.dev/)
    
- 不追踪训练数据来源，不解决“这行代码是从哪里学来的”。[agent-trace](https://agent-trace.dev/)
    
- 不评价代码质量，也不要求特定 UI 或产品形态。[agent-trace](https://agent-trace.dev/)
    

## 关键概念与数据模型

- Contribution：一次代码变更（增删改）。[agent-trace](https://agent-trace.dev/)
    
- Contributor：贡献者，可以是 human / ai / mixed / unknown。[agent-trace](https://agent-trace.dev/)
    
- Trace Record：一个 JSON 对象，描述某次归因记录，包含：version、id（UUID）、timestamp、vcs 信息、tool 信息、files 数组和 metadata。[agent-trace](https://agent-trace.dev/)
    

在 files 里，每个文件有：

- path：仓库相对路径。[agent-trace](https://agent-trace.dev/)
    
- conversations：一组“对话”。每个对话包含：
    
    - url：能回溯到那次代理/模型对话的链接；
        
    - contributor：默认贡献者（比如 ai + model_id）；
        
    - ranges：一组行区间（start_line, end_line，可加 content_hash）；
        
    - related：关联资源（如 session、prompt 的 URL 等）。[agent-trace](https://agent-trace.dev/)
        

## 与版本控制和行级追踪

- 支持多种 VCS：git、jj、hg、svn，通过 `vcs.type` + `vcs.revision` 记录对应 revision。[agent-trace](https://agent-trace.dev/)
    
- 行号基于记录时的 revision，不是当前文件行号；要查某行是谁写的，需要：blame 找到那行的 revision，再在对应 trace record 里查 ranges。[agent-trace](https://agent-trace.dev/)
    
- 可选 content_hash 用于代码搬移/重排后仍然追踪归因（位置无关追踪）。[agent-trace](https://agent-trace.dev/)
    

## 扩展性与实现

- 规范版本号采用主/次版本：主版本用于破坏性变更，次版本用于向后兼容的新增字段。[agent-trace](https://agent-trace.dev/)
    
- metadata 字段允许厂商用类似 `dev.cursor`、`com.github.copilot` 这样的反向域名 key 存储自定义数据（如置信度、后处理工具、workspace id）。[agent-trace](https://agent-trace.dev/)
    
- 提供参考实现，包括 trace-store.ts（读写 Trace Record 存储层）和 trace-hook.ts（在文件变更时自动捕获 trace），目前示例面向 Cursor / Claude Code，但适用于任意 AI coding agent。[agent-trace](https://agent-trace.dev/)
    

你更关心的是规范本身（JSON schema & 设计权衡），还是想知道在你现有的 agent / editor 里如何集成和落地？

## VS git blame
不太够——`Co-authored-by` + `git blame` 解决的是“这次 commit 有 AI 参与”，但没法精确回答“这一行代码是在第几次对话、由哪个模型、用什么上下文生成的”，而 Agent Trace 就是专门来补这几个洞的。agent-trace+2

## git co-author + blame 能做到什么

- 可以在 commit 粒度标记“这次更改有 AI 参与”，方便以后审计和做粗粒度统计，比如“这个模块大部分 commit 都有 Claude co-author”。reddit+1
    
- `git blame` 能告诉你“这一行最后是哪个 commit 改的，以及该 commit 的 author/co-author”，所以你大概知道“这块是某个 AI + 某个开发同一批改动里产生的”。cloudbees+1
    
- 对“给 AI 一点 credit”“简单透明披露 AI 参与”已经够用，而且和现有 Git / GitHub / GitLab 完全兼容。dev+1
    

## 它解决不了 / Agent Trace 想解决的

1. 粒度问题：commit 太粗
    
    - 一次 commit 里经常混有人手改的、AI 改的、不知道谁改的，而 co-author 只在 commit 级别，没法说“文件 A 的第 20–40 行是 AI 写的，其他是人写的”。[agent-trace](https://agent-trace.dev/)
        
    - 甚至一个 commit 里可能包含多轮对话、多个模型、不同 agent 的自动流程，这在 commit 里全都挤成一个 `Co-authored-by`。
        
2. 对话 / 模型上下文完全丢失
    
    - blame 只能带你回到 commit 和 PR，最多看到 commit message 和 PR 描述，没法直连到“当时这行代码是哪个 session / 哪个 prompt / 哪个 agent 生成的”。dev+1
        
    - Agent Trace 的设计目标是：给每个文件的一段行区间挂上一个或多个 “conversation”，其中包含：
        
        - 对话 URL（IDE/agent 的 session 链接）
            
        - 模型信息、contributor 类型（human / ai / mixed）
            
        - optional 的 related 链接：比如 prompt log、评审记录等。[agent-trace](https://agent-trace.dev/)
            
3. 多轮覆盖、重构后的追踪
    
    - 真实开发里，一行代码会被多次 AI 重写、refactor、move，`git blame` 最终只展示“最后一个 commit 的作者”，之前所有 AI / 人类的“接力”过程看不到。oneuptime+1
        
    - Agent Trace 的思路是：每次 AI 改动时记录当前 revision 下的行区间和 hash，将“那一轮 AI 参与”的信息记录成独立 trace record，之后可以通过 blame 的原始行位置 + content_hash 反查对应的多次贡献历史。usegitai+1
        
4. 责任与审计场景
    
    - 对很多合规 /风控/审计场景，“只知道有 AI co-author”不够，需要知道：
        
        - 具体哪几行是 AI 提的建议
            
        - 哪些是人类后续重写的
            
        - 哪些敏感改动（比如加密/支付/权限）是在哪个 agent 流程里产出的。github+1
            
    - Agent Trace 偏向“可机器处理的结构化 provenance 规范”，让你可以做诸如 “列出 repo 中所有 AI 写过且未被人类重写的 auth 相关代码” 这种自动分析。github+2
        

## Git 视角：Agent Trace 是补充层，而不是替代

- Git 负责：提交历史、内容 diff、行级 blame；co-author 只是对 commit metadata 的轻量扩展。dev+1
    
- Agent Trace 负责：
    
    - 把“这一段 diff 是哪个 agent / 哪次对话产生的”以标准 JSON 记录下来；
        
    - 通过 revision + 行区间 / hash 和 Git 对接，从而在 blame 之上 overlay 出 AI/human/mixed 归属信息。usegitai+1
        

所以如果你只关心“有没有 AI 参与”，git co-author + blame 基本够用；但如果你想要的是：

- 行级看：这段是哪个模型、哪轮对话写的
    
- PR 里一键标色：哪些行来自 AI / 人 / 混合
    
- 后面做仓库级别的 AI 贡献分析 / 审计 / 合规
    

那就需要类似 Agent Trace 这种更细粒度的 provenance 规范，而不仅仅是 co-author 这一维信息。usegitai+1

你现在是在考虑给你自己的 agent/IDE 里加归因能力吗？如果是，你更倾向优先解决“行级可视化归因”，还是“事后可以做审计/统计分析”？