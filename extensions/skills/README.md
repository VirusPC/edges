# Skills (extensions/skills/)

本目录是 Edges 系统所有 skill 的**唯一真源**，供外部 AI Agent（Claude Code、Codex、Cursor、Gemini CLI、Factory、opencode）加载。

## 目录规范

每个 skill 一个子目录，目录下必须有 `SKILL.md`，且其 YAML frontmatter 的 `name` **与目录名完全一致**：

```markdown
---
name: <目录名>
description: <一句话，说明何时该触发、何时不该触发>
---

<正文>
```

`description` 是 agent 决定要不要加载这个 skill 的唯一依据，写清楚触发场景和边界（"如果 X 请改用 Y"），不要写成 `summarize ai article` 这种同义反复。

## 分发

```bash
./bin/install-skills            # 装到本机所有 agent 的全局配置目录
./bin/install-skills --list     # 看装到哪了
./bin/install-skills --dry-run  # 预演
./bin/install-skills --uninstall
```

分发走软链，**改本目录下的文件即时生效**，无需重跑。只有新增或删除 skill 才需要重跑。详见 [`bin/README.md`](../../bin/README.md)。

## 命名注意

skill 名会跟各 agent 的内置 skill 处在同一命名空间，同名会遮蔽内置的。取名前先确认不撞车——例如 `deep-research` 是 Claude Code 的内置名，本仓库那份横纵分析法因此叫 `horizontal-vertical-research`。
