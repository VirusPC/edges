---
metadata:
  edges-type: task
  edges-task-project: agent-clients-ux
  edges-updated-at: '2026-10-14T08:20:48.150Z'
  edges-title: edges connector：自建远程 MCP 让各聊天窗口读写 edges
  edges-tasks-status: backlog
  edges-task-priority: none
name: edges-connector远程MCP
description: 自建远程 MCP 服务，让各聊天窗口和编程 Agent 以最低成本查询并写入 edges
---
**背景：**
2026-10-14 下午，用户发现 edges 仓库 `extensions/` 下的 skill（如 conversation-to-notes）在 ChatGPT 聊天窗口里不能直接使用。讨论下来，原因是聊天窗口不会自动发现 SKILL.md，更没有持久工作区、CLI 和 GitHub 写权限，代码沙箱临时且通常离线，所以入库这一步跑不了。助手先给了几种做法：skill 降级模式（只输出 Markdown 和目标路径，由有工作区的 Agent 入库）、自定义 GPT + GitHub Action、内置 GitHub connector，以及自建 MCP 服务。用户随后明确「不计开发成本，只求每个聊天窗口里的使用成本最低」，于是方案收敛到自建远程 MCP 服务，也就是类似 Notion 托管 MCP 的「edges connector」，只是存储换成 git 仓库，多一层 CLI + PR。之后的调研发现各客户端对写入的支持差异很大，用户一度质疑做 MCP 的意义，最后的结论是：核心价值是「处处可查」，「处处可写」是附加收益。
- 现状（2026-10-14 调研）：Claude 网页/桌面支持自定义 connector，全部套餐可用，免费版限 1 个，写操作需审批。ChatGPT 仅网页端、需开发者模式，Pro 只读，可写的完整 MCP 仅限 Business/Enterprise/Edu，所以个人套餐按只读考虑。Gemini 应用有地区、年龄、语言等限制，写操作逐次确认；Gemini CLI 无套餐限制。编程 Agent（Claude Code、Codex、Cursor、ZCode、Kimi Code）支持 MCP。豆包工作可以按 URL 添加插件。
- 预期收益：任何窗口都能查询 edges，不必凭空回答；支持写入的窗口一句话就能保存笔记或任务；规则集中在服务端，改一处处处生效；以后新增客户端零成本接入。
- 非目标：不保证所有客户端都能写入（受各平台套餐限制）；不在本卡内修改 skill 的降级模式（另行处理）。
- 关联：笔记 `notes/2026-10-14--skill跨聊天窗口使用与edges-connector/INDEX.md`（PR https://github.com/VirusPC/edges/pull/243 ）；原始对话为 2026-10-14 约 16:05–16:17（Asia/Shanghai）用户与 Grok Bot 的会话。
- 负责人建议：先 grill-with-docs 细化，再交全栈开发专家实现。

**目标：**
建成并部署一个自建的远程 MCP 服务「edges connector」，让 Claude、ChatGPT（开发者模式）、Gemini、各类编程 Agent 和豆包工作都能以最低的单窗口操作成本查询 edges，并在支持写入的客户端里直接写入笔记和任务。

**动作：**
- 先写 ADR，记录为什么选自建远程 MCP 而不选 Projects 指令、自定义 GPT + GitHub Action、内置 GitHub connector，以及部署、认证和工具粒度的决策。
- 部署在家用服务器上，通过 Cloudflare Tunnel 对外暴露，并配 OAuth 认证；仓库凭证只留在服务端。
- 服务端持有一份 edges clone，通过 edges CLI 和 git 完成读写。
- 只暴露少量高层工具：save_note、add_task、search_edges。
- 分类、命名、脱敏、拉取 main、开 PR 全部在服务端完成。
- skill 规则通过 MCP prompts 和工具描述下发，保证改一处处处生效。
- 不支持自定义 connector 的窗口，退回到把分享链接交给 Grok Bot 入库；ChatGPT 个人套餐按只读接入。

**完成标准：**
- [ ] ADR 已入库。
- [ ] 服务经 Cloudflare Tunnel 可公网访问，未通过 OAuth 认证的请求被拒绝。
- [ ] 在 Claude 中通过 save_note 保存一篇笔记后，edges 仓库出现对应 PR，且内容已脱敏。
- [ ] 在 Claude 中通过 add_task 能生成看板任务的 PR。
- [ ] 至少一个编程 Agent 和 ChatGPT（只读）能通过 search_edges 查到已有笔记。
- [ ] 修改服务端的一处规则后，无需改客户端配置，各客户端行为即同步变化。
