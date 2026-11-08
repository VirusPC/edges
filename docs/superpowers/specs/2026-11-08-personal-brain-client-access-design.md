# 个人大脑接入各 Agent 客户端：设计稿

状态：grill 进行中（2026-11-08）。「已确认」一节是用户拍板的结论；「方案草案」与「待决问题」尚未确认，不代表已采用或已实现。onboarding 与 references 目前均未改动。

- 任务卡：[个人大脑跨客户端与工作空间接入指南](../../../.edges/projects/2026-09-09--agent-clients-ux/tasks/backlog/2026-11-08--个人大脑跨客户端与工作空间接入指南/INDEX.md)
- 记忆索引：[project_personal_brain_client_workspace_access](../../../.edges/memory/projects/project_personal_brain_client_workspace_access/INDEX.md)
- 现行 onboarding：[edges-onboarding/SKILL.md](../../../packages/skills/edges-onboarding/SKILL.md)

## 问题

创建个人大脑已有流程，但缺少「把已有大脑接到不同 Agent 客户端，并在多个客户端之间复用同一份大脑」的指南。

## 已确认（用户拍板）

1. **主路径**：同一份大脑在不同客户端的工作区里复用；把大脑 Compose 进某个代码项目只是可选旁路，不是主路径。
2. **指南位置**：`packages/skills/edges-onboarding/references/`，每个客户端分组一份。
3. **权限**：默认可写，不设「先只读再升级」门禁；读写权限不作为本议题的重点。
4. **优先级**：personal agent（Grok Bot、Muse、Dot 等）→ work 类简单工作区 → coding 项目空间（Codex、Claude Code、Cursor 等）→ chat（等服务端接口，只留坑位）。
5. **首期重点**：Codex 与 Grok Bot；Cursor、Claude Code 作对照示例。
6. **新场景**：「我已经有个人大脑，想在新的客户端里继续用（接入已有大脑）」，与「创建个人大脑」分开；开场菜单由现行五场景 + 两条流程兜底（七项）变为六场景 + 两条兜底（八项）。宿主提问组件的选项上限（如 Kimi Work 最多 4 项）属宿主限制，不因此删场景。

## 已核实的事实边界

- 「Codex Cowork」：未找到 OpenAI 官方页面使用此名；OpenAI 帮助中心有 ChatGPT Work，「Cowork」见于 Anthropic Claude Cowork 的报道。用户所指形态未确认，不与 ChatGPT Work 等同。
- Codex（本机）【官方】：从项目根走到 cwd 逐层拼接 `AGENTS.md`；技能扫描 `.agents/skills`（仓库）或 `~/.agents/skills`（用户）；用 `$skill-name` 唤起。桌面 App 只从 primary 文件夹自动发现这些文件。Codex Cloud 的本机个人文件不会自动带过去。
- Claude Code【官方】：工作目录及以上没有 `CLAUDE.md` 时才读 `AGENTS.md`；有则可在其中 `@AGENTS.md` 导入；技能认 `.claude/skills`。
- Cursor【官方】：读项目根与子目录 `AGENTS.md`。
- Grok Bot【环境】：所有 bot 共用一台 box；技能来自 Grok Bot 的技能目录，与大脑仓库 `.agents/skills` 是两套存放，clone 完成不等于技能已装上或版本一致。目前**没有证据**表明仅 clone 或切目录就会自动加载大脑 `AGENTS.md`。

## 方案草案（未确认）

### 两个入口汇到同一流程

```text
入口 A：创建个人大脑（建仓、init、推送）──┐
                                            ├─► 识别客户端 ─► 打开分组指南 ─► 核验
入口 B：接入已有大脑（定位本地目录或远端仓）┘
```

入口 B 不 init 新仓、不在 GitHub 建仓，也不套用「已有项目添加 harness」。客户端从会话与环境识别，只补问识别不出的部分；不让用户选分组菜单。

### 提案文件布局

```text
packages/skills/edges-onboarding/references/client-access/
  contract.md     共享核验契约
  personal.md     personal agent
  work-space.md   work 类工作区
  coding.md       coding 项目空间
  chat.md         只写限制与接口坑位
```

### 核验契约（草案）

每层要有人能看到的证据；Agent 只说「我加载了」不算通过。

| 层 | 可观察证据 |
| --- | --- |
| 1 打开 / 绑定 | 客户端显示的工作区根（或绑定路径）是大脑仓库根 |
| 2 规则加载 | 不提示路径，问一条只写在大脑 `AGENTS.md` 的约定，回答引用路径与段落 |
| 3 技能发现 | 技能列表或唤起结果出现 edges，且有读取 `SKILL.md` 的工具记录 |
| 4 读 | 工具记录显示读取了已有笔记，复述与文件一致 |
| 5 写 | 新建测试 idea，`git status` 可见，测完删除 |
| 6 跨会话 | 新会话读回第 5 层写入的内容 |
| 7 Git 同步 | 推送后另一份 clone pull 能读到同一条 |

客户端客观上不能写时，记为该客户端限制，不改成产品默认。

### 并发与同步（草案）

同机多个客户端同时写时各用 worktree；单客户端直接用原 checkout；跨 checkout 靠 `pull --rebase --autostash`。不要求每个本机客户端各自 clone；私有大脑凭据不写进仓库或客户端配置。

### Grok Bot 最小实验（待执行）

- E1 规则加载：新会话不提示路径，问只写在大脑 `AGENTS.md` 的约定。答不出则需要显式入口。
- E2 技能发现：问 edges 技能版本，对照技能目录里的 `SKILL.md`。
- E3 跨 bot：bot A 在 worktree 写临时 idea 并推送，bot B pull 后读回。
- E4 技能更新：大脑仓库技能升版后，检查 Grok Bot 技能目录是否仍旧版，记录同步步骤。

## 待决问题（下一轮 grill）

1. **术语**：[CONTEXT.md](../../../CONTEXT.md) 里「工作空间」已指 Compose 的组合结果（就地 harness + 被组合仓库），而本议题的「工作空间」指客户端打开的根目录或绑定目录（Codex primary 文件夹、Grok Bot 的 box 目录）。是另立术语（候选：「客户端工作区」）进 CONTEXT，还是改写本议题用词？
2. **Grok Bot 规则入口**：若 E1 证明不会自动加载，固定入口选哪种——技能里写「先读 `<大脑>/AGENTS.md`」、会话/长期记忆提示，还是两者都要？
3. **技能来源**：客户端用大脑仓库里的 skills，还是用户级全局安装？两边版本不一致时以谁为准、谁负责同步？
4. **入口 B 的定位方式**：已有大脑默认从哪里找——本机已知路径、远端仓库地址，还是先问一句？多份 clone 并存时选哪份？
5. **work 类工作区首期是否写指南**：形态未确认前，`work-space.md` 只放占位，还是以 ChatGPT Work 作参考写一版？
6. **Codex 首期覆盖面**：只做本机 CLI / 桌面 App，还是同时覆盖 Codex Cloud（需 environment 与 PR 回流）？
7. **核验契约强度**：七层是否都必过；第 7 层 Git 同步对只在单机使用的用户是否可跳过？
8. **创建流程是否追加「接入当前客户端」步骤**：建完大脑后自动接到当前客户端，还是只提示可以接入？
9. **ADR 门槛**：上面 1–3 若定下，是否有决定满足「难逆、不看背景会意外、真实取舍」三条而需要写 ADR（候选：技能来源归属）。目前未写 ADR。
