# skill跨聊天窗口使用与edges-connector

> 想把 edges 里的 skill（如 conversation-to-notes）带到任意聊天窗口里用，并把对话直接入库；这篇记录为什么聊天窗口做不到、以及最终倾向的「edges connector」方案。

## 背景

用户发现 edges 仓库 `extensions/` 下的 skill（例如 conversation-to-notes）在 ChatGPT 聊天窗口里不能直接使用，于是想弄清：聊天窗口能不能加载 skill、能不能完成入库、依赖 CLI 的 skill 能不能跑；以及怎样在每个聊天窗口里以最低成本把对话整理成笔记写进仓库。

## 主题

这场对话在谈「skill 在聊天类产品和 Agent 类工具之间的可移植性」，以及如何通过自建远程 MCP 服务（edges connector）让各家聊天窗口都能查询、尽量也能写入 edges。

- 难点一：聊天窗口没有持久工作区和 GitHub 写权限，代码沙箱是临时的、通常离线，无法 clone、安装 CLI、push，所以依赖 CLI 的入库步骤跑不了。
- 难点二：当前很多 skill 的设计默认有文件系统和 shell（SKILL.md 是说明书，脚本/CLI 干活），这是聊天工具与 Agent 工具的根本差别，不是改提示词能解决的。
- 难点三：各家聊天产品对自定义 connector（远程 MCP）的支持差异很大，且受套餐、平台、地区限制，写入能力尤其不统一。

## 过程

### 16:05 skill 在 ChatGPT 里不能直接用
用户发现 conversation-to-notes 等 skill 在 ChatGPT 聊天里不能直接用。助手解释：ChatGPT 聊天不会自动发现 SKILL.md。可选做法：放进 ChatGPT Projects 的指令/文件；每个 skill 做一个自定义 GPT；改用原生支持 SKILL.md 的 Codex。

### 16:06 即使加载了也无法入库
用户追问：就算加载了，入库也做不了，因为没有工作区？助手确认：ChatGPT 聊天没有持久工作区和 GitHub 写权限，代码沙箱是临时的，不能 clone/push。给出三个选项：
1. skill 降级模式：只输出完整 Markdown 和目标路径，入库交给有工作区的 Agent；
2. 通过 MCP connector 或自定义 GPT Action 给 ChatGPT GitHub 写权限；
3. 直接用 Codex / Grok Bot。

助手推荐第 1 种，因为改动最小。

### 16:07 依赖 CLI 的 skill 能否用 CLI
助手回答基本不能：沙箱通常离线，不能 npm install 或拉仓库，没有仓库也不能 push，而且用完即弃。需要持久文件系统 + 网络 + GitHub 权限的环境（Codex、Claude Code、Cursor、Grok Bot）。建议把 skill 分两层：内容生成可移植；CLI/入库只在 Agent 环境执行。

### 时刻不详 现在很多 skill 都依赖 CLI 吗
助手确认：是的，Anthropic 的 skill 设计默认有文件系统和 shell，SKILL.md 是说明书，脚本/CLI 负责干活；这是聊天工具与 Agent 工具的根本差别。

### 16:08 想从聊天直接到笔记入库
用户希望聊天内容能变成笔记进仓库。助手先给出经由自己的方式：给分享链接、粘贴、批量导出，或用 Projects 指令让 ChatGPT 产出草稿笔记。用户问有没有不经过助手的办法，助手列出：
1. ChatGPT 内置 GitHub connector（以读为主，写入未确认）；
2. 自定义 GPT + GitHub API Action，配细粒度 token（最可控）；
3. 自建 MCP 服务，封装 edges CLI 和 git。

### 16:10 不计开发成本，只求每个窗口的使用成本最低
用户明确：开发成本不计，目标是每个聊天窗口里用户的操作成本最低。助手推荐自建远程 MCP「edges 记忆服务」：
- 部署在用户自己的家用服务器上，通过 Cloudflare Tunnel 暴露，带 OAuth；
- 服务端持有一份 edges clone，调用 edges CLI 和 git；
- 只暴露少量高层工具：save_note、add_task、search_edges；
- 分类、命名、脱敏、pull、开 PR 都在服务端做；
- skill 规则通过 MCP prompts / 工具描述下发，改一处处处生效；
- 不支持自定义 connector 的窗口，退回到把分享链接交给 Grok Bot。

助手建议先写任务卡 + ADR，再交给全栈开发专家（当时未执行）。

### 16:12 这就是 connector 吗
用户类比助手已连接的 Notion 工具，问这是不是就是一个 connector。助手确认：思路与 Notion 官方托管的远程 MCP 相同，只是存储换成 git 仓库，外加 CLI + PR 这一层。

### 16:13–16:15 调研各家对自定义 connector 的支持
助手在 2026-10-14 做了网页调研，结论见补充说明中的对照表。要点：Claude 支持最好（各套餐可用、可写需审批）；ChatGPT 仅网页端、需开发者模式，写入仅 Business/Enterprise/Edu；Gemini 应用有较多限制；多数国内产品只在编程工具里支持 MCP，聊天网页端未核实。

### 16:16 ChatGPT 不能写吗；那 MCP 还有什么用
助手说明 ChatGPT 能写，但取决于套餐，个人账号大概率要 Business。用户追问那做 MCP 的意义。助手回答：
- Claude 可完整读写（免费版也可，限 1 个）；
- 编程类 Agent（Claude Code、Codex、Cursor、Gemini CLI、ZCode、Kimi Code）在任何仓库里都能记录/查询 edges；
- 在 ChatGPT Pro / Gemini 中即使只读也有价值：查询外部大脑而不是凭空编造；
- 规则集中在服务端；
- 以后新客户端接入零成本。

核心价值是「处处可查」，「处处可写」是附加收益。

### 16:17 触发整理
用户调用 /conversation-to-notes，整理本次对话为本笔记。

## 结果

- 做成：厘清了聊天窗口无法运行依赖 CLI 的 skill 的原因；确定倾向方案为自建远程 MCP「edges connector」；完成了各家客户端对自定义 connector 支持情况的调研。
- 未闭环：
  - edges connector 尚未开发；
  - 对应的任务卡与 ADR 尚未编写；
  - skill 降级模式（只输出 Markdown + 目标路径）尚未加入 skill。
- 无回退。

## 所学

- skill = 说明书 + 执行环境。说明书（SKILL.md）可以搬到任何窗口，执行环境（文件系统、shell、网络、凭证）搬不走。所以可移植的是「内容生成」，不可移植的是「CLI/入库」。
- 取舍补充：
  - Projects 指令 / 自定义 GPT：能让 ChatGPT 按规则写内容，但仍无法入库，且每个 skill、每个平台要各维护一份，规则会漂移，所以不作为主方案。
  - 内置 GitHub connector：以读为主，写入未确认，不可依赖。
  - 自定义 GPT + GitHub Action：可控，但只服务 ChatGPT 一家，不能复用到 Claude、编程 Agent。
  - skill 降级模式：改动最小，可作为任何不支持 connector 窗口的兜底，但每次仍需人工或 Agent 转手入库。
  - 自建远程 MCP：开发成本最高，但一次开发多端复用、规则集中，且符合「不计开发成本、最小化每窗口使用成本」的目标，因此最终倾向它。
- 边界：自定义 connector 的「可写」高度依赖平台与套餐；「否/未核实」只代表没找到公开文档，不等于确定不支持。

## 行动指南

### 主题行动指南

#### 背景
希望在任何聊天窗口或编程 Agent 中，都能以最低操作成本查询个人知识库，并在支持的地方直接把对话写成笔记入库。

#### 核心问题
聊天窗口没有持久工作区、CLI 和仓库写权限；而写入规则（分类、命名、脱敏、PR）需要集中维护，不能每个平台复制一份。

#### 核心解决方案
1. 把 skill 拆两层：内容生成规则可移植；CLI 与入库只在有工作区的环境执行。（可选项：每平台各做 Projects/自定义 GPT——规则分散易漂移，不作主方案。）
2. 建一个远程 MCP 服务，服务端持有知识库仓库副本，调用仓库 CLI 与 git，只暴露少量高层工具（保存笔记、添加任务、检索）。（可选项：单平台 GitHub Action——不能多端复用，不做。）
3. 分类、命名、脱敏、同步主分支、开 PR 全部放在服务端；规则通过 MCP prompts / 工具描述下发。
4. 对外暴露时加身份认证（OAuth），不把仓库凭证交给客户端。
5. 给 skill 增加降级模式：不支持 connector 的窗口只输出完整 Markdown 与目标路径，再交给有工作区的 Agent 入库。
6. 先写任务卡与 ADR，再交给开发执行。

#### 验收标准
- [ ] 至少一个聊天客户端（如 Claude）通过自定义 connector 调用保存笔记工具，能在仓库产生一个 PR。
- [ ] 至少一个编程 Agent 能通过同一服务检索知识库。
- [ ] 修改一次服务端规则，所有客户端行为同步变化，无需逐个更新。
- [ ] 服务需认证才能访问，客户端侧没有仓库凭证。
- [ ] 不支持 connector 的窗口可用降级模式产出可直接入库的 Markdown。
- [ ] 任务卡与 ADR 已入库。

### 细节与其他

#### 若要部署 edges connector
则：部署在自己的家用服务器上，通过 Cloudflare Tunnel 暴露并配 OAuth；服务端持有 VirusPC/edges 的 clone，调用 `extensions/cli` 的 edges CLI 和 git；首批工具为 save_note、add_task、search_edges。

#### 若在 ChatGPT 中使用
则：仅网页端、需开启开发者模式；Pro 只能用只读/fetch 类 MCP；完整 MCP（可写）仅 Business/Enterprise/Edu；深度研究只读；agent 模式不能用自定义应用。个人账号写入大概率需要 Business。

#### 若在 Claude 中使用
则：网页/桌面可添加，移动端经云端同步可用；所有套餐可用，免费版限 1 个；写操作需逐次审批。

#### 若在 Gemini 中使用
则：Gemini 应用仅网页端添加（之后移动端可用），限美国、18 岁以上、个人账号、英文、开启 Keep Activity，写操作逐次确认；Gemini CLI 无套餐限制。

#### 若客户端不支持自定义 connector
则：把对话分享链接交给 Grok Bot 整理入库，或用 skill 降级模式输出 Markdown 后转交。

#### 若要把遗留项开卡
则：本笔记暂不开卡；遗留项见「结果」，后续按 conversation-to-tasks 一次 1～2 条问清后再开。

## 补充说明

### 自定义 connector 支持对照（2026-10-14 调研）

| 客户端 | 支持情况 | 写入 |
| --- | --- | --- |
| Claude | 支持，网页/桌面（移动端经云端），全部套餐，免费限 1 个 | 可写，需审批 |
| ChatGPT | 部分，仅网页，需开发者模式 | 仅 Business/Enterprise/Edu；Pro 只读；Free/Plus/Go 未提及 |
| Gemini 应用 | 部分，网页添加，地区/年龄/账号/语言限制 | 可写，逐次确认 |
| Gemini CLI | 支持，无套餐限制 | 可 |
| Kimi | 仅 Kimi Code（CLI/桌面/VS Code） | 网页聊天未核实 |
| MiniMax | MiniMax Code 桌面支持 | Agent 网页端仅见 GitHub issue，未核实 |
| ZCode（智谱） | 桌面编程工具支持 | Z.ai 聊天未核实 |
| DeepSeek | 聊天应用/网页未找到支持 | 否 |
| 豆包 | 豆包工作支持按 URL 添加自定义插件（HTTP+headers，也支持 STDIO） | 可写；普通聊天未核实 |

注：「否/未核实」表示未找到公开文档。

### 参考链接
- https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta — ChatGPT 开发者模式与完整 MCP connector
- https://help.openai.com/en/articles/11487775-connectors-in-chatgpt — ChatGPT connector 总览与套餐差异
- https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp — Claude 自定义远程 MCP connector
- https://support.google.com/gemini/answer/17209137 — Gemini 应用连接 MCP
- https://geminicli.com/docs/tools/mcp-server/ — Gemini CLI MCP 配置
- https://zcode.z.ai/cn/docs/mcp-services — ZCode MCP 服务
- https://www.doubao.com/work/docs/zh-cn/articles/705018132598-plugins — 豆包工作插件

### 原始材料
- 原始对话：2026-10-14 约 16:05–16:17（Asia/Shanghai），用户 peng cheng 与助手 Grok Bot 的聊天会话。
- 相关 skill：`extensions/skills/conversation-to-notes/`。
