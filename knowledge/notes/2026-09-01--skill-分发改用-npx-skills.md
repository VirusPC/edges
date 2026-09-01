# Skill 分发改用 npx skills

> 日期: 2026-09-01
> 来源: 把 `extensions/skills/` 接入 [vercel-labs/skills](https://github.com/vercel-labs/skills) 的过程
> 状态: 已落地（`bin/install-skills` 已退役）

把自研的 215 行 `bin/install-skills` 换成社区标准工具 `npx skills`。过程中有四件事是文档里查不到、只能实测出来的，记在这。

## 一、`~/.agents/skills` 是真实的全局约定，不只是项目级约定

一直以为 `.agents/skills/` 是 AGENTS.md 生态的**项目级**惯例。实际上它在 `$HOME` 下同样成立，五家直读：

| Agent | 全局读 `~/.agents/skills` | 依据 |
| --- | --- | --- |
| Codex CLI | 是 | `codex-rs/ext/skills/src/host_roots.rs`，且源码注释把 `~/.codex/skills` 标为 **deprecated** |
| Cursor | 是 | 官方文档明列 |
| Gemini CLI | 是 | 官方 docs，且 `.agents/` 优先级**高于** `.gemini/` |
| OpenCode | 是 | 官方 docs 明列 |
| Factory droid | 是 | 官方 docs（还额外读单数 `~/.agent/skills`） |
| **Claude Code** | **否** | 只读 `~/.claude/skills/` |

**推论**：给多个 agent 分发 skill，不需要 N 条软链。写一份到 `~/.agents/skills/`，再单独给 Claude Code 建一条，就覆盖了主流全家桶。自研脚本当年那个「六目录扇出」有四个是冗余的。

Claude Code 是这里唯一的孤岛，值得留意——它的 `skills` 生态位和其他家正在分叉。

## 二、`npx skills` 是「取回并物化」，不是「工作区链接器」

这是选型时最该先问的一句。它的单一真源是 `~/.agents/skills`，由 `cp` 填充：

- `installer.ts` 里 `copyDirectory` 无条件执行，且 `cp(..., { dereference: true })` 会把源目录里的软链**解引用成实体文件**——没有任何 flag 能让它链回你的源目录
- `npx skills update` 对本地路径源直接跳过，跳过理由字符串就是 `'Local path'`
- 所以「改完即时生效」这个能力，用它就必然丢掉，只能每次重跑 `add`

**判断**：这类工具选型，先分清它是**分发器**还是**链接器**。分发器优化的是「让别人拿到」，链接器优化的是「我自己改得快」。两个目标在实现上是冲突的（拷贝 vs 软链），指望一个工具全占是不现实的。这次是主动用「即时生效」换「工具链统一」。

## 三、实测出的文件丢弃规则（文档和源码都没写）

**每一层目录**都会静默丢弃这三类文件：

| 丢弃 | 保留 |
| --- | --- |
| `README.md` | `OVERVIEW.md`、`CHANGELOG.md`、`LICENSE`、`notes.txt` |
| 任何 `_` 开头的文件 | `type_slug.md`（下划线不在开头） |
| `metadata.json` | `.gitignore` 等点文件 |

而 `vercel-labs/skills` 的 README 和 main 分支源码**都只声明排除 `metadata.json` / `.git` / `__pycache__` / `__pypackages__`**，没有 `README.md`，也没有下划线规则。发布版行为与公开源码不一致。

代价是真金白银的：`project-memory-init` 的 `references/templates/_entry_line.tmpl.md` 是脚本运行时要读的模板，被丢弃后 `remember` 直接 `{"ok": false, "error": "模板不存在"}`；`scripts/README.md` 被丢弃后，`SKILL.md` 里指向它的链接成了死链。已分别改名为 `entry_line.tmpl.md` 和 `OVERVIEW.md`。

**教训**：**「装完能跑」不等于「装完是全的」。** 当时如果只看安装器打印的 `✓ Installed 10 skills`，会以为完全成功——`SKILL.md` 在、目录在、`--help` 也能跑，只有走到 `remember` 这条具体路径才炸。验收得比对文件清单，不能只看退出码：

```bash
diff <(cd <src> && find . -type f | sort) \
     <(cd ~/.agents/skills/<name> && find . -type f | sort)
```

## 四、分发范围由工具的扫描根决定，不由你的意图决定

想「只分发 `extensions/skills/`」，但 `npx skills add <owner>/<repo>` 的扫描根是一张写死的表：仓库根（只一层）、根下 `skills/`、以及 28 个 agent 目录（`.claude/skills`、`.agents/skills`、`.codex/skills`…）。`extensions/` 不在表里。

本仓库恰好 vendored 了 90 个 openspec 产物在那些 agent 目录下——**短命令装到的全是 openspec，一个自己的 skill 都没有**。

试过的绕法里，只有一个真管用：

- `.claude-plugin/plugin.json` 清单：**叠加**而非过滤，加了它 openspec 照样一起装，排除不掉
- 根级软链 `skills -> extensions/skills`：靠 `readdir` 语义偶然可行，上游无测试覆盖，且 Windows 会挂
- **子路径 URL `npx skills add VirusPC/edges/extensions/skills`：把扫描根整个换掉，那些 agent 目录压根到不了** ✅ 零仓库改动

**判断**：接第三方分发工具前，先搞清它的**发现机制**（扫哪些路径、优先级、能否排除），再谈仓库怎么摆。这里的通用形状是——**很多工具只提供「加」的接口，不提供「减」的接口**；遇到这种，与其想办法排除噪音，不如换一个更窄的入口。

## 待议

- `~/.agents/skills` 下同一个 skill 现在有两条可达路径（中枢 + 各 agent 冗余软链），Codex 的 `dedupe_skill_roots_by_path` 去重的是 root 不是目标，可能重复列出。暂未观察到实际影响。
- 三个 `__init__.py`（只有 docstring）也被丢了。Python 3 命名空间包让它照常工作，init / remember / doctor 三个操作均已实测通过，暂不处理。
- 上游那条未声明的丢弃规则值得提 issue。
