
这篇文章在讲「Loop Engineering（循环工程）」——也就是不再由人类一轮轮手动 prompt coding agent，而是设计一整套“闭环系统”，让系统自己找活、分配任务、调用代理、验证结果并记录状态，人只负责设计 loop 和审核关键结果。[[x](https://x.com/addyosmani/status/2064127981161959567)]

## Loop engineering 是什么

- 作者将 loop engineering 定义为：用系统替代你自己去 prompt agent，把目标定义成一个“递归的任务/goal”，让 AI 不断迭代直到满足可验证的完成条件。以前是你一轮轮输入，现在是你只设计 loop。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- 他认为这很可能是未来使用 coding agents 的主流方式，但目前仍早期，需要谨慎对待 token 成本和质量控制问题。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## 和传统“写 prompt 用代理”有何不同

- 过去两年常见模式：人类写好 prompt + 上下文 → 看结果 → 再下一轮，整条交互链都需要人“在场”操作，agent 更像一个工具。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Loop 模式下，你搭建一个小系统：自动发现工作、分配任务、检查结果、记录进度、决定下一步，让系统去“戳”代理而不是你来戳。Loop engineering 位于 agent harness 之上，一层把整个工厂式软件生产线跑起来。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## Loop 的五个核心组件 + 记忆

作者抽象出一个 loop 必须具备的 5 个构件，加上一个外部记忆载体：[[x](https://x.com/addyosmani/status/2064127981161959567)]

1. Automations：定时自动任务，用于发现和分拣工作（triage）。
    
2. Worktrees：并行工作目录，避免多个 agent 改动同一份代码产生冲突。
    
3. Skills：把项目知识、惯例等固化下来，避免每次从零解释。
    
4. Plugins & connectors：让 agent 连接 issue tracker、数据库、Slack 等真实工具。
    
5. Sub-agents：区分“执行者”和“审查者”，不同 agent 分工协作。
    

第六个是 memory：例如 markdown 文件或 Linear board，作为 loop 的外部状态与记忆，记录已完成/未完成工作，因为模型在不同 session 间不持久记忆，状态必须落在磁盘中而不是 context 里。[[x](https://x.com/addyosmani/status/2064127981161959567)]

## Automations：循环的心跳

- 在 Codex 中，Automation 可以按项目、prompt、频率配置，决定跑在本地 checkout 还是 background worktree；能自动把发现的问题放入 triage inbox，找不到问题的 run 自动归档，还能调用 skill 使复杂任务可维护。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- 在 Claude Code 中，通过 /loop、定时任务、hooks 或推到 GitHub Actions 来实现同样能力；/loop 是按节奏重跑，/goal 则是“直到完成条件为真”为止，每轮由一个小模型检查是否达成“所有测试通过且 lint 干净”等条件，执行者和判定者分离。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## Worktrees：并行但不混战

- 多个 agent 并行时容易写到同一文件，是和多人开发冲突完全类似的问题。Git worktree 提供独立工作目录和分支，共享历史但互不干扰。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Codex 内建 worktree 支持；Claude Code 通过 git worktree、--worktree flag 以及 subagent 的 isolation: worktree 配置，让每个子代理开独立 checkout 并在完成后清理。尽管工具解决文件层面的冲突，人类的 review 带宽仍是上限（“orchestration tax”）。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## Skills：把项目上下文写成资产

- Skill 的形式是在一个文件夹里放 SKILL.md（说明与元数据）以及可选脚本和资源，两家产品格式类似；Codex 用 $ 或 /skills 调用或自动匹配，Claude Code 也有相同模式。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Skills 把“意图与约定”写在外部，避免每次 session 模型靠猜填补空白（作者称为 intent debt）。没有 skills，loop 每次都要从零重建项目理解；有了 skills，理解会复利积累。Skill 是 authoring 格式，而 plugin 是跨项目分发这些 skill 的载体。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## Plugins & connectors：打通真实环境

- 仅能访问文件系统的 loop 作用有限。基于 MCP 的 connectors 让 agent 读 issue tracker、查 DB、打 staging API、发 Slack 等。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Codex 和 Claude Code 都支持 MCP，因此通常一个 connector 可以跨工具服用。Plugins 可以把多个 connectors 和 skills 打包，让团队成员一键安装同样的 loop 能力。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## Sub-agents：执行者 vs 审查者

- 核心思想是把写代码的 agent 和检查代码的 agent 分离，避免“自己给自己作业打高分”。第二个 agent（可能使用不同模型和指令）负责抓出第一个 agent 的盲点。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Codex 通过 .codex/agents/ 下的 TOML 配置定义子代理；Claude Code 通过 .claude/agents/ 和 agent teams 传递工作。常见分工是：一个探索、一个实现、一个按 spec 验证。多子代理会增加 token 消耗，因此需要在“值得第二意见”的场景下使用。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## 一个典型 loop 的运行形态

作者给了一个典型 loop 示例：[[x](https://x.com/addyosmani/status/2064127981161959567)]

- 每天早上一个 automation 跑起来，触发 triage skill，从 CI 失败、open issues、最近 commits 中提取需要处理的事项，写入 markdown 或 Linear。
    
- 对每个值得做的项，开一个隔离 worktree，派一个 sub-agent 出草案，一个 sub-agent 做 review，依据项目 skills 和测试体系校验。Connectors 负责开 PR、更新工单。
    
- 状态文件记录尝试过什么、通过了什么、有哪些未完成任务，下一次循环从这个状态继续。你只设计了这个 loop 一次，而不是每一步都手动 prompt。Codex 和 Claude Code 中的 loop 形态高度相似。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## Loop 的局限与风险

- 验证责任仍然在工程师身上：无人值守的 loop 也会无人值守地犯错，“done” 只是声明不是证明。作者反复强调你仍然要对上线代码负责。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Comprehension debt：loop 越快地产出你没亲自写的代码，你对系统真实状态的理解就越容易腐烂，除非你认真阅读 loop 产出的变更。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- Cognitive surrender：当 loop 自动跑得很好时，人类很容易变成“毫无判断地接受结果的人”，这是危险姿态。正确的用法是用判断力去设计 loop，而不是用 loop 来逃避思考。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

## 作者给工程师的态度建议

- 作者认为这是软件工程工作方式演化的一个预览：loop 的 leverage 比 prompt 更大，但不代表工作更轻松，只是“杠杆点”移动了。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- 他的态度是：可以放心搭 loop，但不要完全依赖自动 loop 修代码，否则质量会下滑，形成“越修越坑”的下行螺旋。直接 prompt agent 仍然有效，关键是找到两者之间的平衡。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    
- 同样的 loop 不同人会得到完全不同的结果：一个用它加速理解深刻的领域，另一个用它逃避理解本身；loop 分不清这两者，只有你分得清。这也是为什么“设计 loop”比“写 prompt”更难。[[x](https://x.com/addyosmani/status/2064127981161959567)]
    

你现在在做的系统里（agent harness / RAG infra 等）有没有某个任务，你最想先用这套 5+1 组件试着搭一个“小 loop”来跑一周看看效果？