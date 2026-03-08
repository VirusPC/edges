# AI 技术栈的加速收敛

> 来源: [Claude Code Picks - Amplifying AI](https://amplifying.ai/research/claude-code-picks/report)

## 核心观察

AI 正在加速技术栈的收敛。Claude Code 测试了下收敛情况：

## 关键发现

1. **Agent 更常"自己写代码片段"**，不是优先用第三方库。

2. **存在默认技术栈**：
   - Vercel
   - Postgres
   - Stripe
   - shadcn/ui
   - tailwind.css
   - GitHub Actions

3. **某些类别几乎锁死**：
   - CI/CD → GitHub Actions
   - 支付 → Stripe
   - UI 组件 → shadcn/ui

4. **不同模型的选择高度一致**：18/20 类别选同一 Top 工具

5. **上下文 > 提示词**：仓库结构决定工具选择，换提示词影响小
