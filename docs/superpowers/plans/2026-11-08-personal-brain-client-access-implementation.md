# 个人大脑客户端接入：实施计划

状态：2026-11-08 用户已审阅并批准本计划；**尚未实施**。设计取舍的真源是 [ADR 0053](../../adr/0053-personal-brain-reused-across-agent-clients.md)，本文只写怎么落地，不重新决定设计。

- 任务卡：[个人大脑跨客户端与工作空间接入指南](../../../.edges/projects/2026-09-09--agent-clients-ux/tasks/backlog/2026-11-08--个人大脑跨客户端与工作空间接入指南/INDEX.md)
- 术语：客户端工作区，见 [CONTEXT.md](../../../CONTEXT.md)

## 要做到的行为

1. 用户能在开场菜单选「接入已有大脑」，该流程不建仓。
2. 建完个人大脑后，默认继续接入当前客户端，缺参数再补问；用户可选稍后再接。
3. Agent 按客户端分组打开 references 里的指南；onboarding 主流程不写客户端细节。
4. Grok Bot 接入时把大脑路径写进长期记忆；被加载的 edges 技能按该路径先读 `AGENTS.md`。
5. 用户按指南接入后，能用可观察证据跑完七层核验。

## 文件范围

路径相对仓库根。

| 动作 | 文件 | 内容 |
| --- | --- | --- |
| 新增 | `packages/skills/edges-onboarding/references/client-access/README.md` | 分组怎么选；未实测声明 |
| 新增 | `packages/skills/edges-onboarding/references/client-access/contract.md` | 七层输入、证据、失败不挡后续 |
| 新增 | `packages/skills/edges-onboarding/references/client-access/personal.md` | Grok Bot 为主；记忆路径机制；E1–E4 |
| 新增 | `packages/skills/edges-onboarding/references/client-access/work-space.md` | 参考 ChatGPT Work；不写 Claude Cowork |
| 新增 | `packages/skills/edges-onboarding/references/client-access/coding.md` | Codex CLI / 桌面 App / Cloud；Cursor、Claude Code 对照 |
| 新增 | `packages/skills/edges-onboarding/references/client-access/chat.md` | 只写限制与接口坑位 |
| 修改 | `packages/skills/edges-onboarding/SKILL.md` | 菜单 6+2、接入已有大脑流程、建脑后接入路由、Compose 标为旁路 |
| 修改 | `packages/skills/edges/SKILL.md` | 加一句条件说明（见步骤 4） |
| 修改 | `packages/skills/edges-onboarding/CHANGELOG.md` | 记录行为变更 |

## 步骤

1. **开场菜单**（`edges-onboarding/SKILL.md` 场景表与第一步选项，现为五场景加两条兜底）：在「创建个人大脑」之后插入「我已经有个人大脑，想在新的 Agent 客户端或客户端工作区里继续使用（接入已有大脑）」，变为六场景加两条兜底。
2. **接入已有大脑流程**（新小节，不走「创建独立 edges harness 仓库」）：
   1. 先问大脑在哪；有多份 clone 时列候选，只有真实使用记录才标「最近使用」。
   2. 从环境识别当前客户端；用户不选分组。
   3. 打开 `references/client-access/` 中对应分组的指南。
   4. 按 `contract.md` 做七层核验。
   - 不做：init 新仓、GitHub 建仓、套用「已有项目添加 edges harness 目录」。
3. **建脑后路由**：在「创建独立 edges harness 仓库」推送之后、Compose 之前，插入「接入当前客户端」，走第 2 步的 2–4。Compose 仍只在用户要求挂载时执行，并标明是旁路。
4. **通用 edges 技能**：在 `packages/skills/edges/SKILL.md` 加一句条件说明：若长期记忆里记有个人大脑路径，先读该路径下的 `AGENTS.md`。不写死路径，不加 Grok 专有步骤。
5. **references 指南**：
   - `contract.md`：默认可写；每层要可观察证据，Agent 自报不算；第 2 层规则加载与第 3 层技能发现分开验收；第 7 层 Git 同步所有接入必验，失败记入报告、不阻塞其他层；同名技能两个版本时记下两边版本与路径并继续；文首声明未实测的客户端不得写成已支持。
   - `personal.md`：确认客户端工作区就是大脑 clone 路径；写入长期记忆「个人大脑路径 = 绝对路径」（只定位，不抄规则正文）；技能用已有 edges 技能或按环境安装，两边皆可；写明限制：技能正文只在被加载时执行，记忆按需检索、检索不到要问路径，未证实每个新会话会自动读仓库文件。Muse、Dot 列为待核验。
   - `work-space.md`：按 ChatGPT Work 官方资料写步骤并标【官方】；Work 会话是否加载 `AGENTS.md` 标【待试】；不写 Claude Cowork。
   - `coding.md`：Codex 本机 CLI、桌面 App、Cloud 三种形态；Cursor、Claude Code 作对照；Cloud 是否同规则读 `AGENTS.md` 与 `.agents/skills` 标【待试】。
   - `chat.md`：需要服务端接口，只留坑位。
6. **CHANGELOG**：记录上述行为变更。按 skill 版本约定决定是否升版本号；发包另行决定。

## 七层核验

| 层 | 测试输入 | 通过的证据 | 不算通过 |
| --- | --- | --- | --- |
| 1 打开 / 绑定 | 「报告你当前的工作目录或项目根。」 | 路径是大脑仓库根，或客户端界面显示该路径 | 只说「已打开」 |
| 2 规则加载 | 不给路径，问一条只写在大脑 `AGENTS.md` 的约定 | 答出约定，并给出路径或段落；或工具记录显示读了该文件 | 答案来自常识；说「我会遵守」 |
| 3 技能发现 | 列出 edges 技能，再点名唤起一个（Codex 用 `$edges`） | 列表里有；唤起后有读取 `SKILL.md` 的记录 | 只凭名字描述功能 |
| 4 读 | 读一条已有笔记，给出相对路径和标题 | 路径存在，内容一致 | 编造路径 |
| 5 写 | 记一条临时 idea「接入测试-客户端-日期」 | `git status` 看到新文件 | 只在对话里写 |
| 6 跨会话 | 新会话读回那条 idea | 复述与文件一致 | 依赖上一会话记忆 |
| 7 Git 同步 | 提交推送；另一份 clone pull 后读回 | 另一份 clone 看到同一条 | 只提交未推送 |

## 验证（实施后执行）

- 对 Codex 本机与 Grok Bot 各跑一遍七层；任一层失败写入报告，不挡其他层。
- Grok 实验 E1–E4：新会话不提示路径能否答出大脑 `AGENTS.md` 的约定；技能版本对照；两个 bot 经 Git 写入并读回；大脑仓库技能升版后 Grok 侧版本。
- 另记：ChatGPT Work 会话是否加载 `AGENTS.md`；Codex Cloud 是否同规则读 `AGENTS.md` 与技能。
- 指南里凡未跑通的地方保持「未实测」或「待试」，不写「已支持」。
- 改完后在本仓跑相关文档测试（若有覆盖 onboarding 的测试），并按 PR 分支 raw URL 方式试一句话接入。

## 不在范围

- 不改 CLI 行为、init 默认装技能、Compose 协议、远端服务、MCP。
- 不把 init 与 skill 安装解耦。
- 不写 Claude Cowork。
- 本计划不包含发包；不把 HTML 审阅稿的 packed 文件提交进仓库。
