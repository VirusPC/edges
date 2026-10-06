# Cursor Cloud Agent：默认 Auto，以及模型参数可选项

## 【背景】

通过 Grok Bot 把写代码任务交给 Cursor cloud agent 时，会碰到「默认用哪个模型」，以及「上下文长度、是否 thinking、思考程度能不能选」的问题。

## 【过程】

### 默认模型

- 启动 cloud agent 时可以显式指定模型（Claude / GPT / Composer / Grok 等）。
- 不指定时，走的不是某一个固定大模型，而是 **Auto**（模型 id：`default`）。
- Auto 由 Cursor 按账号/团队/全局的 cloud agent 默认设置做路由选模。
- 需要锁死某模型时，在启动指令里点名即可；也可在 Cursor 设置里改 cloud agent 默认。

### 可传的模型参数（model_params）

启动时除了 `model`，还可以带参数（按型号支持与否）：

| 维度 | 常见参数 | 典型取值 | 多见于 |
| --- | --- | --- | --- |
| 是否 thinking | `thinking` | `true` / `false` | Claude Opus / Sonnet / Fable / Haiku |
| 上下文长度 | `context` | Claude：`300k` / `1m`（部分旧 Sonnet：`200k` / `1m`）；GPT-5.x：`272k` / `1m` | Claude、GPT |
| 思考程度 | `effort` 或 `reasoning` | Claude `effort`：low→max；GPT `reasoning`：none→max；Grok `effort`；Gemini Flash `effort` / `reasoning_effort` | 各厂商 |
| 速度 | `fast` | `true` / `false` | 部分 Claude / GPT / Grok / Composer |

约束举例（会随型号变，以 Cursor 当前 catalog 为准）：

- Opus 5：`thinking=false` 时不能配 `effort=xhigh` / `max`。
- 部分 GPT：`fast=true` 时不能开 `context=1m`。

经 Grok Bot 启动时，用户可以说「用 Opus 5，开 thinking，effort high，1m 上下文」——助手应把 model + model_params 一起传入。

## 【所学】

1. 「默认模型」≠ Opus/Sonnet/GPT 某一款，而是 **Auto 路由层**。
2. 模型选择与 **thinking / context / effort** 是两层：先选（或不选）模型，再按该模型 schema 传参数。
3. 讨论成本、风格、可控性时，要分清「没传 model」「只传 model」「model + params」三条路径。

## 【行动指南】

- 一般脚手架/占位：可继续用 Auto。
- 要稳定风格或特定能力：点名模型；要更深推理时显式 `thinking=true` 并设 `effort`/`reasoning`。
- 长仓库/大 diff：考虑更大 `context`（如 `1m`），并注意与 `fast` 的互斥。
- 经 Grok Bot：用户点名模型或参数 → 一并传入；不说 → 省略，落在 Auto + 平台默认参数。

## 【补充说明】

- 来源：2026-09-10 与 Coding Agent 专家关于 cloud agent 模型与参数的对话。
- 可选模型列表会变；以 Cursor cloud agent `models` catalog 为准，不必把完整名单写死进笔记。
- 公开笔记；无凭证/内网标识。
