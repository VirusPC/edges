# 个人大脑以跨客户端复用为主路径，接入指南按客户端分组路由

2026-11-08 grill 确定：个人大脑建好后，主路径是让同一份大脑在不同 Agent 客户端里被直接打开或绑定使用，而不是把大脑 Compose 进某个代码项目。onboarding 只做路由：识别当前客户端，再交给 `packages/skills/edges-onboarding/references/` 中对应分组的一份指南；客户端差异只写在这些指南里，不写进 onboarding 主流程。用户已确认这些取舍；onboarding 与 references 尚未实现。

## 取舍

曾经的自然路径是 [ADR 0034](0034-compose-harness-repos-into-workspace.md) 的 Compose：把大脑叠加进当前项目。用户澄清，个人大脑的主要使用场景是 personal agent 与工作类客户端，它们有自己打开或绑定的目录，却不一定有代码项目。用 Compose 作主路径会要求先有项目，也把「客户端读到了大脑」偷换成「项目登记了大脑」。因此 Compose 降为可选旁路，只在用户要在某个代码项目里顺带读大脑材料时使用。

客户端加载规则与技能的方式各不相同（例如 Codex 从项目根逐层读 `AGENTS.md`，Claude Code 有 `CLAUDE.md` 时不直接读 `AGENTS.md`，Grok Bot 的技能与大脑仓库里的 skills 分开存放）。把这些差异写进 onboarding 会让主流程随每个客户端变化；按分组放进 references，主流程保持稳定，新增客户端只改对应指南。

## 已确定

- 指南放在 `edges-onboarding/references`，每个客户端分组一份。
- 落地顺序：personal agent（Grok Bot、Muse、Dot 等）→ work 类简单工作区 → coding 项目空间（Codex、Claude Code、Cursor 等）→ chat（需服务端接口，只留坑位）。分组由 Agent 从会话与环境判断，不让用户选分组菜单。
- 首期重点 Codex 与 Grok Bot；Cursor、Claude Code 作对照示例。
- Codex 首期指南覆盖本机 CLI、桌面 App 与 Codex Cloud 三种形态。
- 默认可写，不设「先只读再升级」门禁；客户端客观上不能写时记为该客户端的限制。
- 新增独立场景「已有个人大脑，接入新客户端」：定位已有大脑后接入，不新建仓库、不在 GitHub 建仓，也不套用「已有项目添加 harness」。开场菜单由现行五场景加两条流程兜底（七项）变为六场景加两条兜底（八项）；宿主提问组件的选项上限（如 Kimi Work 最多四项）属宿主限制，不因此删场景。
- 建完个人大脑后，默认继续接入当前客户端；缺参数再补问。用户仍可选稍后再接。
- 客户端打开或绑定的那个目录称为**客户端工作区**，与 Compose 语境下的「工作空间」区分；术语见 [CONTEXT.md](../../CONTEXT.md)。
- 接入是否成功要看人能观察到的证据，不凭 Agent 自称已加载。核验按七层给出可观察证据（打开或绑定、规则加载、技能发现、读、写、跨会话、Git 同步）；每一层都要有证据。Git 同步在所有接入中都必须验收；用户批注：绝大部分情况下没有 GitHub 同步就没有意义。某一层（含 Git 同步）测试不通过时，不阻塞其他步骤继续，失败结果记入报告。

## 待验证事实

- 尚无证据表明 Grok Bot 仅 clone 或切换目录就会自动加载大脑 `AGENTS.md`。待做最小实验：新会话不提示路径时能否答出只写在大脑 `AGENTS.md` 的约定；技能版本与 Grok Bot 技能目录是否一致；两个 bot 经 Git 写入并读回；大脑仓库技能升版后 Grok Bot 侧是否仍是旧版。
- 用户所称「Codex Cowork」对应哪种产品形态未确认；未找到 OpenAI 官方使用此名的页面，不与 ChatGPT Work 等同。
- 各客户端完整接入链路均未实测；实测前指南不得宣称已支持。Codex Cloud 是否按与本机相同的规则读取 `AGENTS.md` 与 `.agents/skills` 仍待试。

## 开放问题

以下尚未决定，不得当作已定：

1. Grok Bot 若不会自动加载规则，固定入口用技能内显式读取、会话或长期记忆提示，还是两者都要。
2. 客户端使用大脑仓库里的 skills 还是用户级全局安装；版本不一致时以谁为准、谁负责同步。
3. 接入已有大脑时默认从哪里定位大脑，多份 clone 并存时用哪份。
4. work 类工作区形态确认前，其指南只放占位还是参考 ChatGPT Work 先写一版。

后续工作见[任务卡](../../.edges/projects/2026-09-09--agent-clients-ux/tasks/backlog/2026-11-08--个人大脑跨客户端与工作空间接入指南/INDEX.md)。
