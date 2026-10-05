【背景】
讨论项目级 agent 工作记忆（`.memory`）对人与 agent 的可见性：默认检索是否该扫到、是否该对人可审阅，以及它与 `docs/adr`、`CONTEXT.md`（grill-with-docs / domain-modeling，以及早期 Codex 式 paper trail）的分层关系。触发点是「coding agent 的 grep 会不会检索 `.xxx`」以及「`.memory` 变多会不会干扰默认检索」。

【过程】
1. 确认多数 coding agent 底层类似 `rg`：默认跳过 hidden，并常尊重 `.gitignore`，故 `.memory` 通常不进普通 codebase search。
2. 提出继续用 hidden `.memory` 的理由：树更干净、标明非人主读正文；代价是靠 `AGENTS.md` + ask/remember 协议取用，不能指望泛搜碰巧撞上。
3. 担心「`.memory` 太多干扰默认检索」——澄清方向相反：hidden 越多，对默认检索干扰通常越小；真正污染来自可见 `memory/` 或全局 `--hidden`。规模约束应靠选择性读取协议，而非限制目录个数。
4. 明确隐藏初心之一正是挡住默认检索噪音。
5. 上升到双读者问题：对人偏 UX（开 show hidden / 读索引即可），对 agent 偏正确性（协议一松等于关键约束从未进场）。
6. 对比 grill-with-docs / domain-modeling：`CONTEXT.md`、`docs/adr/` 放可见目录，因为那是人+agent 共用的领域真相，默认搜到是特性；Codex 早期实践几乎只有这一层 paper trail，没有第二层「会话级工作记忆」，故看起来全在 docs、从不隐藏。
7. 补充要求：希望 `.memory` 仍能被人 review / 审阅。区分「可被审阅」与「默认检索可见」：进 git 后可在 PR/diff 中审；审阅面可用 `AGENTS.md` 作目录、PR/diff、Obsidian 显示隐藏文件补强，而不必改成可见目录去抢搜索。
8. 结论确认：最初「用 hidden 挡默认检索」的初心正确；后来补的是边界——挡搜索 ≠ 不给人审，而非推翻初心。

【所学】
- 工作记忆与可检索正文本来就不该同一通道；hidden 是隔离手段，不是把记忆做成黑箱。
- 可见性合同应拆三条：对默认搜索不可见；对按协议工作的 agent 必须可达；对要查账的人可发现、可 diff 审阅，但非主读。
- `docs/adr` / `CONTEXT` = 对外/对后人说明书（可见）；`.memory` = 下次 agent 少踩坑的工作记忆（隐藏 + 协议读）。两层叠在一起，不是互相否定。
- 对人丢便利、对 agent 丢能力边界——同一套 hidden 的不对称，决定了不能只靠「搜得到」当正确性保障。

【行动指南】
- 若写入的是领域术语/难逆决策说明书 → 落 `CONTEXT.md` / `docs/adr/`（或其他可见 docs），让默认检索能撞上。
- 若写入的是反馈、进行中上下文、会话沉淀 skill、不便当正文的边角约定 → 落 hidden `.memory`，经 `AGENTS.md` 索引与 ask/remember 读取；不要为迁就 grep 改成可见 `memory/`。
- 若需要人审 `.memory` → 走 git PR/diff 与 `AGENTS.md` 目录；必要时 Obsidian 显示隐藏文件；不要用「取消 hidden」换审阅便利。
- 若默认检索开始扫到大量记忆噪音 → 先查是否开了全局 hidden / 是否误用了可见目录，而不是先怪「`.memory` 太多」。
- 若 agent 经常漏读关键记忆 → 收紧读协议与索引，而不是默认打开 `--hidden` 泛搜。

【补充说明】
- 本笔记整理自同日关于 `.memory` 可见性的对话推演；不含具体凭证或内网标识。
- 相关约定可对照仓库内 project-memory 系列（`AGENTS.md` + `.memory`）与 domain-modeling / grill-with-docs 对 `CONTEXT.md`、`docs/adr/` 的布局说明。
