---
name: feedback_help_forbid_verb_line_anchor
description: 写 edges tasks --help 测例、禁止某个动词出现时：用 ^\s+verb\b 锚定命令列表行，不要用 /\bverb\b/，以免 after-help 的 “There is no X command” 被当成命令。
metadata:
  edges-title: 禁止动词的 help 测例锚定命令行
  edges-type: feedback
  edges-origin-session-id: bc-e5926b1f-5826-5660-94a3-0ab47a4652db
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-17T03:01:50+00:00"
---

写 edges tasks --help 测例、禁止某个动词出现时：用 `^\s+verb\b` 锚定命令列表行，不要用 `/\bverb\b/`。

**Why:**
after-help 会用自然语言写 “There is no classify command / verb”。全词匹配会把说明句当成命令。2026-09-17 Task 5 brief 同时要求 verbatim after-help 和 `doesNotMatch(/\bclassify\b/)`，两者冲突；已用行首锚定修好测例。

**How to apply:**
禁止命令用 `^\s+<verb>\b`（可加 `m`）；允许 after-help 提到该词。根 help 已有 `^\s+delete\b` / `^\s+log\b` 同款。
