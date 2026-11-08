# 个人大脑以跨客户端复用为主路径，接入指南按客户端分组路由

2026-11-08 grill 确定：个人大脑建好后，主路径是让同一份大脑在不同 Agent 客户端里被直接打开或绑定使用，而不是把大脑 Compose 进某个代码项目。onboarding 只做路由：识别当前客户端，再交给 `packages/skills/edges-onboarding/references/` 中对应分组的一份指南；客户端差异只写在这些指南里，不写进 onboarding 主流程。用户已确认这些取舍；onboarding 与 references 尚未实现。

## 取舍

曾经的自然路径是 [ADR 0034](0034-compose-harness-repos-into-workspace.md) 的 Compose：把大脑叠加进当前项目。用户澄清，个人大脑的主要使用场景是 personal agent 与工作类客户端，它们有自己打开或绑定的目录，却不一定有代码项目。用 Compose 作主路径会要求先有项目，也把「客户端读到了大脑」偷换成「项目登记了大脑」。因此 Compose 降为可选旁路，只在用户要在某个代码项目里顺带读大脑材料时使用。

客户端加载规则与技能的方式各不相同（例如 Codex 从项目根逐层读 `AGENTS.md`，Claude Code 有 `CLAUDE.md` 时不直接读 `AGENTS.md`，Grok Bot 的技能与大脑仓库里的 skills 分开存放）。把这些差异写进 onboarding 会让主流程随每个客户端变化；按分组放进 references，主流程保持稳定，新增客户端只改对应指南。

## 已确定

- 指南放在 `edges-onboarding/references`，每个客户端分组一份。
- 落地顺序：personal agent（Grok Bot、Muse、Dot 等）→ work 类简单工作区（首期参考 ChatGPT Work 写一版；Claude Cowork 暂不处理） → coding 项目空间（Codex、Claude Code、Cursor 等）→ chat（需服务端接口，只留坑位）。分组由 Agent 从会话与环境判断，不让用户选分组菜单。
- 首期重点 Codex 与 Grok Bot；Cursor、Claude Code 作对照示例。
- Codex 首期指南覆盖本机 CLI、桌面 App 与 Codex Cloud 三种形态。
- 接入已有大脑时先问一句大脑在哪；有多份 clone 时列出候选让人选，只有存在真实使用记录时才把某份标为「最近使用」并优先，不猜。
- 客户端用大脑仓库里的 skills 或用户级全局安装都可以，不约定哪边是权威，也不规定同步责任。
- Grok Bot 规则入口两条都要：通用 edges 技能写明「按长期记忆里的大脑路径先读 `AGENTS.md`」，会话或长期记忆作兜底。接入时把大脑路径写入长期记忆；不生成写死路径的专属技能。长期记忆只定位路径，不替代仓库规则。新会话是否加载仍取决于技能是否被唤起、记忆是否被检索到；未证实宿主会自动读仓库文件。
- 实施范围（2026-11-08 用户审阅实施计划后选定）：除 `personal.md` 外，通用 `packages/skills/edges/SKILL.md` 也加一句条件说明——「若长期记忆里记有个人大脑路径，先读该路径下的 `AGENTS.md`」。只写条件，不写死任何个人路径，不塞 Grok 专有步骤；与「长期记忆记路径」的决定一致。实施计划见[实施计划](../superpowers/plans/2026-11-08-personal-brain-client-access-implementation.md)，尚未实施。
- 第 3 层发现同名技能两个版本时：记下两边版本与路径，继续后面各层；仍不设权威、不强制同步。
- 默认可写，不设「先只读再升级」门禁；客户端客观上不能写时记为该客户端的限制。
- 新增独立场景「已有个人大脑，接入新客户端」：定位已有大脑后接入，不新建仓库、不在 GitHub 建仓，也不套用「已有项目添加 harness」。开场菜单由现行五场景加两条流程兜底（七项）变为六场景加两条兜底（八项）；宿主提问组件的选项上限（如 Kimi Work 最多四项）属宿主限制，不因此删场景。
- 建完个人大脑后，默认继续接入当前客户端；缺参数再补问。用户仍可选稍后再接。
- 客户端打开或绑定的那个目录称为**客户端工作区**，与 Compose 语境下的「工作空间」区分；术语见 [CONTEXT.md](../../CONTEXT.md)。
- 接入是否成功要看人能观察到的证据，不凭 Agent 自称已加载。核验按七层给出可观察证据（打开或绑定、规则加载、技能发现、读、写、跨会话、Git 同步）；每一层都要有证据，第 7 层才是 Git 同步。规则加载看 Agent 能否在不提示路径时引用大脑 `AGENTS.md` 里的约定，技能发现看技能能否被列出或唤起，两者分开验收。Git 同步在所有接入中都必须验收；用户批注：绝大部分情况下没有 GitHub 同步就没有意义。某一层（含 Git 同步）测试不通过时，不阻塞其他步骤继续，失败结果记入报告。

## 待验证事实

- 尚无证据表明 Grok Bot 仅 clone 或切换目录就会自动加载大脑 `AGENTS.md`。待做最小实验：新会话不提示路径时能否答出只写在大脑 `AGENTS.md` 的约定；技能版本与 Grok Bot 技能目录是否一致；两个 bot 经 Git 写入并读回；大脑仓库技能升版后 Grok Bot 侧是否仍是旧版。
- 未找到 OpenAI 官方使用「Codex Cowork」这个名字的页面；它与 Anthropic 的 Claude Cowork 是两回事，不混写。Claude Cowork 由用户决定暂不处理。
- ChatGPT Work【官方，learn.chatgpt.com/docs/projects】：桌面 App 的本地项目可挂多个文件夹，新会话从 primary 文件夹开始；文档写明 Codex 从 primary 文件夹自动发现 `AGENTS.md`、skills 与 `config.toml`，次要文件夹不自动发现。Work 会话本身是否同样加载 `AGENTS.md` 文档未明说，待试。Work 用 Cloud 时需挂文件夹的电脑在线，会话同步不上传整个文件夹【官方，learn.chatgpt.com/docs/enterprise/chatgpt-work-overview】。
- 各客户端完整接入链路均未实测；实测前指南不得宣称已支持。Codex Cloud 是否按与本机相同的规则读取 `AGENTS.md` 与 `.agents/skills` 仍待试。

## 开放问题

本轮开放问题已清。剩余项均为待验证事实（见上一节），不是未决设计决策。

后续工作见[任务卡](../../.edges/projects/2026-09-09--agent-clients-ux/tasks/in_progress/2026-11-08--个人大脑跨客户端与工作空间接入指南/INDEX.md)。
