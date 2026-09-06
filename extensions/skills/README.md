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

`name` 与目录名一致这条**没有机器校验了**（旧的 `install-skills` 脚本会拦，已退役）。`npx skills` 按 frontmatter 里的 `name` 决定安装后的目录名，本地目录名只是兜底；两个 skill 的 `name` 撞车时，后一个会被静默丢弃。

### 一定要带 `@latest`

**所有 `npx skills` 命令都写成 `npx skills@latest`。** 不带版本号时，npm 可能把 `skills` 这个命令名解析到已废弃的 `add-skill` 老包（本机上就是 `add-skill@1.0.29`，`--version` 报 `0.1.0`）：

```bash
npx skills --version         # 0.1.0   ← 老包，会静默丢文件
npx skills@latest --version  # 1.5.23  ← 真包
```

老包（对应 `skills` ≤ 1.4.0 那一代）分发时会**静默丢弃** `README.md` 和所有 `_` 开头的文件，每层目录都生效，装完不报任何错。踩过一次：`project-memory-init` 的 `_entry_line.tmpl.md` 是脚本运行时要读的模板，丢了之后 `remember` 直接报「模板不存在」，但安装器照样打印 `✓ Installed 10 skills`。

本目录的命名已经避开了这两类（用 `entry_line.tmpl.md` 和 `OVERVIEW.md`），所以旧版也能正常装。但**新版 1.4.1 / 1.4.5 起已分别修掉 README 和下划线的排除**，不必为此约束新 skill——只有 `metadata.json` 是至今仍会被丢的（这条有文档）。

> 改完 skill 目录结构后，用这条复核，别只看退出码：
> ```bash
> diff <(cd <src> && find . -type f | sort) \
>      <(cd ~/.agents/skills/<name> && find . -type f | sort)
> ```

## 项目级（本仓库工作区）

约定：**能读 `.agents/skills` 的 Agent 不再占一份目录；读不到的，只留一条软链，不拷贝。**

- 实体只在 `.agents/skills/`（目前是 OpenSpec 的产物）
- Claude Code 不读 `.agents/skills`，所以 `.claude/skills` → `.agents/skills`
- `.codex/skills`、`.cursor/skills`、`.factory/skills`、`.gemini/skills`、`.opencode/skills`、`.agent/skills` 都不留

`openspec update` 可能把那些目录再拷回来，删掉即可，不要改回实体拷贝。

## 分发

统一走 [`vercel-labs/skills`](https://github.com/vercel-labs/skills)。

### 本机（作者）

```bash
pnpm skills:install
```

内容装到中枢 `~/.agents/skills/<name>/`（实体拷贝），再给 `~/.claude/skills/` 建一条软链。Codex、Cursor、Gemini CLI、Factory、opencode 原生读中枢（Codex 源码里 `~/.codex/skills` 已标 deprecated），不必再占一份目录。只有 Claude Code 不读中枢，那条软链是它能看到 skill 的唯一原因。

> ⚠️ **改完必须重跑。** 中枢里是实体拷贝而非软链——`npx skills` 会把源目录里的软链一并 `dereference` 掉——所以改了本目录下的文件不会自动生效。`npx skills@latest update` 对本地路径源直接跳过（跳过理由就是 `Local path`），只能重跑上面那条命令。

### 外部用户

```bash
npx skills@latest add VirusPC/edges/extensions/skills
```

**子路径不能省。** `npx skills@latest add VirusPC/edges` 装不到本目录的 skill：CLI 的扫描根是一张写死的表，`extensions/` 不在表里，而仓库根下的 `.agents/skills/`（以及 Claude 那条软链）在表里、且 vendored 了 openspec 的产物——短命令会把那些当成本仓库的 skill 装走。子路径形式把扫描根整个换掉，正好只命中这 10 个。

单装某一个：

```bash
npx skills@latest add VirusPC/edges/extensions/skills --skill paper-10-questions
```

> `project-memory-ask` / `-doctor` / `-init` / `-remember` **必须四个一起装**。后三个靠同级目录定位 `project-memory-init`，单独装会找不到它的 `scripts/memory.py` 和 `references/`。

维护这组 skill 时，按 [`project-memory-init/.memory/projects/project_development.md`](project-memory-init/.memory/projects/project_development.md) 的顺序修改和验证。

### 卸载

```bash
npx skills@latest remove <name> -g
```

它按名字删，会清掉所有 agent 目录下的同名条目，**不区分是谁装的**。

## 命名注意

skill 名会跟各 agent 的内置 skill 处在同一命名空间，同名会遮蔽内置的。取名前先确认不撞车——例如 `deep-research` 是 Claude Code 的内置名，本仓库那份横纵分析法因此叫 `horizontal-vertical-research`。
