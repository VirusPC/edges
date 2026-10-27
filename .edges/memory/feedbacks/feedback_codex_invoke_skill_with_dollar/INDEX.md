---
name: feedback_codex_invoke_skill_with_dollar
description: 在 Codex 里触发某个 skill 时用 $skill-name；/ 是斜杠命令。/skills 只列清单。不要把认不到 skill 当成没装上。
metadata:
  edges-title: Codex 唤起 skill 用 $ 不是 /
  edges-type: feedback
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: "2026-09-08T17:52:03+08:00"
---

在 Codex CLI / IDE 里唤起某个 skill 用 `$skill-name`（例如 `$project-memory-ask`），不要用 `/skill-name`。

**Why:** `/` 走的是斜杠命令命名空间，和 skill 不是同一套。用户一度以为用户目录 skill 没被识别，实际是用错了唤起前缀。官方约定：ChatGPT 用 `@`，Codex 用 `$` 点名 skill；`/skills` 只用来列出已发现的 skill。

**How to apply:** 要跑某个 skill 就输入 `$` 再选或键入 name。怀疑没装上时先 `/skills` 看路径是不是 `~/.agents/skills` 或仓库 `.agents/skills`。隐式匹配仍可能因初始列表预算丢掉一部分，显式 `$` 不受那条限制。
