Claude 的这篇博客介绍了一个新的 **Code Review** 功能：在每个 GitHub PR 上自动派出一组代码智能体进行深度审查，目标是像 Anthropic 内部代码评审流程那样，专注质量而不是速度，目前以研究预览形式向 Team 和 Enterprise 用户开放。[claude](https://claude.com/blog/code-review)

## 这个功能解决什么问题

- 过去一年 Anthropic 每位工程师的代码产出增长约 200%，人工 Code Review 成为瓶颈，很多 PR 只能“扫一眼”而不是深读。[claude](https://claude.com/blog/code-review)
    
- 他们需要一个可以信任、在每个 PR 上都能做深度检查的审查者，于是推出了多智能体 Code Review 系统，并在内部几乎所有 PR 上使用。[claude](https://claude.com/blog/code-review)
    
- 使用之后，有“实质性评审意见”的 PR 从 16% 提升到了 54%，系统只给出意见，不会自动批准合并，最终决策仍由人来做。[claude](https://claude.com/blog/code-review)
    

## 它是怎么工作的

- 每当有 PR 打开，系统会派出一个“智能体团队”，并行地寻找潜在 bug，交叉验证以过滤误报，然后按严重程度排序结果。[claude](https://claude.com/blog/code-review)
    
- 评审的输出是一条高信息密度的总览评论，加上一些针对具体问题的行级评论，方便开发者直接在 diff 上修复。[claude](https://claude.com/blog/code-review)
    
- 评审深度随着 PR 大小和复杂度自动调整：大改动会分配更多智能体并进行更深入阅读，小改动只做轻量检查，平均每次评审大约 20 分钟。[claude](https://claude.com/blog/code-review)
    

## 实际效果和案例

- 内部使用中，大型 PR（变更行数 > 1000）中有 84% 能被查出问题，平均每个 PR 发现 7.5 个 issue；小型 PR（< 50 行）有 31% 被发现问题，平均 0.5 个 issue。[claude](https://claude.com/blog/code-review)
    
- 工程师对这些发现基本认同，少于 1% 的发现被标记为“错误”。[claude](https://claude.com/blog/code-review)
    
- 文中举了两个例子：一个看似普通的一行改动被系统标记为“严重”，如果合并会导致某生产服务的认证全部失效；另一个是 TrueNAS 项目里，系统在一次 ZFS 加密重构 PR 的“邻近代码”中发现了历史遗留 bug：类型不匹配导致每次同步时静默清空加密 key 缓存，这种问题人类审查者通常不会特意去查。[claude](https://claude.com/blog/code-review)
    

## 费用和控制方式

- 这个 Code Review 明确是“重质量不轻成本”的产品，比轻量级的 Claude Code GitHub Action 更贵，按 token 计费，平均每次评审约 15–25 美元，随 PR 大小和复杂度浮动。[claude](https://claude.com/blog/code-review)
    
- 管理员可以通过月度组织消费上限、按仓库启用/停用、以及分析看板（查看评审 PR 数量、意见采纳率、总费用）来控制成本和使用范围。[claude](https://claude.com/blog/code-review)
    

## 如何开始使用

- 目前该功能作为研究预览，向 Team 和 Enterprise 计划开放。[claude](https://claude.com/blog/code-review)
    
- 管理员需要在 Claude Code 设置中开启 Code Review、安装 GitHub App，并选择要开启评审的 repo；开发者端则是“零配置”，开启后新 PR 会自动触发评审。[claude](https://claude.com/blog/code-review)
    
- 文章最后提供了文档链接，并引导用户了解更多 Claude 相关产品、计划和资源，比如价格、企业方案、插件、连接器等。[claude](https://claude.com/blog/code-review)
    
