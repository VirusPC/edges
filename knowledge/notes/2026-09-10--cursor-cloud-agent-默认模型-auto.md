# Cursor Cloud Agent 默认模型是 Auto

## 【背景】

通过 Grok Bot 把写代码任务交给 Cursor cloud agent 时，会碰到「默认用哪个模型」的问题。

## 【过程】

- 启动 cloud agent 时可以显式指定模型（Claude / GPT / Composer / Grok 等）。
- 不指定时，走的不是某一个固定大模型，而是 **Auto**（模型 id：`default`）。
- Auto 由 Cursor 按账号/团队/全局的 cloud agent 默认设置做路由选模。
- 需要锁死某模型时，在启动指令里点名即可；也可在 Cursor 设置里改 cloud agent 默认。

## 【所学】

「默认模型」≠ Opus/Sonnet/GPT 某一款，而是 **Auto 路由层**。讨论成本、风格、可控性时，要分清「没传 model」和「传了具体 model id」两种路径。

## 【行动指南】

- 一般脚手架/占位任务：可继续用 Auto。
- 要稳定风格或特定能力：启动时写明模型名（或改 Cursor cloud agent 默认）。
- 经 Grok Bot 启动时：用户说「用 X 跑」→ 传入对应 model；不说 → 省略 model，落在 Auto。

## 【补充说明】

- 来源：2026-09-10 与 Coding Agent 专家关于 cloud agent 模型选择的对话。
- 公开笔记；无凭证/内网标识。
