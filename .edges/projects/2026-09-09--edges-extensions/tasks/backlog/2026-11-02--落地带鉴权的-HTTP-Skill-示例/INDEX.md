---
metadata:
  edges-type: task
  edges-updated-at: '2026-11-02T10:47:09.833Z'
  edges-title: 落地带鉴权的 HTTP Skill 示例
  edges-tasks-status: backlog
  edges-task-priority: none
name: 落地带鉴权的_http_skill_示例
description: 在 Edges 里做出可复用的带鉴权 HTTP Skill/模板，默认不依赖自定义 MCP。
---
**背景：**
- 对话里先看了 C 端 Agent 对自定义 MCP 的限制，再转向「有可执行环境时，Skill + HTTP 可能更实际」。
- 接着问鉴权怎么做：结论是鉴权挂在 HTTP 接口上，Skill 只负责取凭证并带上；凭证不进仓库。
- 现有卡「CLI 与 MCP 需加鉴权」偏 CLI/MCP 侧，不覆盖这条 Skill+HTTP 路径，故新开一张。
- 非目标：不要求改 C 端产品协议，也不把 MCP 整层去掉。
- 关联：看板任务「CLI 与 MCP 需加鉴权」；对话结论 Skill+HTTP 与 MCP 分工。

**目标：**
在 Edges 仓库里有一份可跟跑的带鉴权 HTTP Skill（或同等模板），别人能照着接自己的 HTTP API。

**动作：**
- 选一种鉴权演示（API Key 或 OAuth/短时 token）
- 写 Skill：发现凭证 → 调 HTTP → 处理错误
- 补最短说明：适用场景、与 MCP 的分工

**完成标准：**
- [ ] 仓库内可找到该 Skill/模板，按说明能对一个受鉴权的 HTTP 接口跑通一次
- [ ] 说明里写清凭证从哪来、如何注入，且示例不含真实密钥
- [ ] 与「CLI 与 MCP 需加鉴权」的边界在卡里或说明里点明
