# connector服务端agent用Codex接入与沙箱

> 承接同日 edges connector 讨论：服务端需要一个能加载 skill 的 agent 整理内容并开 PR，这篇记录怎么接 OpenAI Codex、沙箱怎么选。

## 背景

用户想让 ChatGPT、Claude 等聊天窗口通过一个远程 MCP connector，把对话沉淀成 edges 笔记，并且尽量降低每个窗口的接入成本。前面已经定下 capture 这类意图级工具：由服务端 agent 加载 skill 整理内容，再开 PR 交人审。剩下的问题是这个服务端 agent 用什么来跑，于是讨论了 OpenAI Codex 云端怎么接入。

## 主题

这次对话在比较服务端 agent 的几种运行方式：借用 Codex 云端、借用 GitHub Actions，或者在自建服务器 minigtr 上本地跑 Codex。同时讨论了沙箱隔离，以及大仓库的环境准备耗时。

- 难点一：Codex 云端没有公开 API，不能由程序直接创建云端任务并拿回 PR。
- 难点二：在自己机器上跑 agent 时，沙箱只能限制文件和网络，更强的隔离要自己再搭一层。
- 难点三：edges 仓库有几个 G，每个任务都完整 clone 会非常慢。

## 过程

### 20:50 前后 调研 Codex 云端接入

结论是 Codex 云端没有公开的建任务 API。可行的路有三条：
1. GitHub Actions 加 `openai/codex-action`：服务端用 workflow_dispatch 或 repository_dispatch 触发；第一个 job 只读，Codex 按 skill 修改并导出 patch；第二个 job 有写权限，应用 patch 后用 `gh pr create` 开 PR。用 OpenAI API key 认证。
2. 在 minigtr 上用 `codex exec` 或 Codex SDK 本地运行，修改后由服务端自己 push 并开 PR。
3. `codex cloud exec`：真正跑在 OpenAI 云端，但还是实验功能，只能用 ChatGPT 登录、不支持 API key，能否自动开 PR 未核实，不适合做生产链路。

另外，Codex 自动发现 `.agents/skills/*/SKILL.md`，而 edges 的 skill 在 `extensions/skills/`，需要在 prompt 里写明路径或者加链接。

### 20:55 GitHub Actions 方案主流吗

用户觉得 Actions 方案有点奇怪。我的回答：在代码仓库自动化里这是主流，官方的 codex-action、claude-code-action、Copilot coding agent 都是用 Actions 当一次性沙箱。但它们通常由 issue、PR 评论或定时任务触发，从聊天窗口经 MCP 去调工作流比较少见；而且每次都有几十秒到一两分钟的冷启动，排错要去 GitHub 上看。选它主要是因为 Codex 云端不开放 API。

### 20:56 认定第二种更合适

用户认为第二种更正确，我同意：connector 本来就常驻 minigtr，agent 跑在旁边，链路短、响应快、排错集中。代价是隔离要自己做：每个任务一个独立 worktree、只允许写内容目录、使用只开 PR 的窄权限 token、把 capture 原文当不可信内容处理。

### 20:56 第二种能指定沙箱吗

能。`codex exec --sandbox` 有三档：read-only 只读；workspace-write 只能写工作目录，默认禁网；danger-full-access 不限制。在 Linux 上靠系统自带的隔离机制执行，SDK 也能设置。它限制的是文件和网络权限，不是独立的机器；要更强的隔离，就在外面再套一个每任务一次性的 Docker 容器，只挂载 worktree，网络只放行模型 API。建议采用 workspace-write 加每任务一个容器。

### 20:57 Codex 云端环境会预先 clone 吗

会。云端 environment 绑定仓库，任务开始时已经检出分支，然后跑 setup 脚本。做法是用通用基础镜像 codex-universal 起容器，clone 并跑完 setup 后缓存容器状态（官方说最长 12 小时），后续任务从缓存起，再更新到最新代码；改了 setup 脚本或环境变量，缓存就作废。效果类似为仓库打了一个镜像，但不需要自己写 Dockerfile。

### 20:58 大仓库能省多少

edges 有几个 G，完整 clone 要几分钟，缓存命中后只拉增量，几秒钟。minigtr 上可以常驻一份本地仓库，平时只 fetch，每个任务用 `git worktree add` 新开工作目录，对象共享、几乎不占额外空间；还可以用 sparse checkout 只检出内容目录。

## 结果

方向定为在 minigtr 上本地运行 Codex（exec 或 SDK）作为 connector 的服务端 agent，沙箱用 workspace-write 外加每任务一个容器，环境用常驻仓库加 worktree。还没有写进 edges connector 任务卡，也没有实现。

## 所学

- Codex 云端只面向人用（网页、CLI 登录），程序化接入只能走 Actions、本地 exec 或 SDK。
- Actions 方案的优点是借用现成沙箱、服务端只需要一个 GitHub token；不选它，是因为冷启动慢，从聊天窗口触发也不太自然。
- `codex cloud exec` 不选，因为它是实验功能、不支持 API key、能否开 PR 未核实。
- Codex 的 sandbox 是权限限制，不等于隔离环境；要防提示注入和资源滥用，需要容器这一层。
- 大仓库的环境准备，关键在缓存和增量，worktree 是本地版的缓存。

## 行动指南

### 主题行动指南

#### 背景

远程 connector 需要一个服务端 agent，把聊天内容按 skill 整理后提交到仓库审阅。

#### 核心问题

用什么运行这个 agent，既要响应快，又要隔离安全，还要能应对大仓库。

#### 核心解决方案

1. 在 connector 所在的服务器上用 Codex SDK 或 `codex exec` 运行 agent。可选项有 GitHub Actions（冷启动慢，暂不选）和 Codex 云端（无 API，不选）。
2. 常驻一份本地仓库，每个任务从最新 main 新开一个 worktree，结束后删除；仓库很大时可以加 sparse checkout。
3. 用 `--sandbox workspace-write`，外面再套一个每任务一次性的容器，只挂载 worktree，网络只放行模型 API。
4. 只允许写内容目录，推送使用只能开 PR 的窄权限 token，由人工审阅后合并。
5. 把 capture 原文当不可信数据放进 prompt，防止提示注入。

#### 验收标准

- 一次 capture 能在一分钟内产出一个 PR，且只改内容目录。
- 任务之间互不影响，结束后不留下 worktree 和容器。
- agent 无法 push 到 main，也无法访问模型 API 以外的网络。
- 构造的提示注入内容不能让 agent 越权。

### 细节与其他

#### 若以后量变大或要更强隔离

则可以切到 GitHub Actions 加 openai/codex-action，两段 job：只读 job 产 patch，写 job 开 PR。

#### 若 skill 不被 Codex 自动发现

则在 prompt 里写明 `extensions/skills/<name>/SKILL.md`，或者在仓库里加 `.agents/skills` 链接。

## 补充说明

- 原始材料：Grok Bot 与 peng cheng 的对话，2026-10-14 约 20:45 至 20:58（Asia/Shanghai），紧接在 edges connector 设计讨论之后。
- 相关笔记：notes/2026-10-14--skill跨聊天窗口使用与edges-connector（PR #243）。
- 相关任务卡：tasks/agent-clients-ux/backlog/2026-10-14--edges-connector自建远程-MCP-让各聊天窗口读写-edges（PR #244）。
- [Codex GitHub Action](https://developers.openai.com/codex/github-action)：Actions 接入文档。
- [Codex 非交互模式](https://developers.openai.com/codex/noninteractive)：codex exec 与 sandbox 参数。
- [Codex SDK](https://developers.openai.com/codex/sdk)：程序化调用。
- [Codex 云端](https://developers.openai.com/codex/cloud)：environment 与缓存机制。
- [Codex Skills](https://developers.openai.com/codex/skills)：skill 发现路径。