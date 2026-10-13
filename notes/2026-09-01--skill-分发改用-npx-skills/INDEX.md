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

## 三、`npx <cmd>` 可能根本没在跑你以为的那个包

这条是本次最贵的一课，而且它先把我骗过去了一轮。

实测发现分发后少了 6 个文件——`README.md` 和所有 `_` 开头的（含 `__init__.py`、一个运行时模板）。每层目录都丢，稳定复现。我据此认定「发布版行为与公开源码不一致」，还改名绕开、写进了文档。

**归因是错的。** 真实原因：本机全局装了个 `skills@1.0.18`（`~/.nvm/.../lib/node_modules/skills`，2026-01 装的），`npx skills` 发现 PATH 上有同名 binary 就直接执行，**根本不去下载 registry 上的 1.5.23**。而且删掉全局包之后仍然不对——npm 又把 `skills` 这个命令名解析到了已废弃的 `add-skill@1.0.29`：

```
npx skills --version         # 0.1.0    ← 老包，丢文件
npx skills@latest --version  # 1.5.23   ← 真包，一个不丢
```

那条丢弃规则确实存在过：`vercel-labs/skills` 的 PR #7（2026-01-15）明确写了 *"Skip README.md (developer documentation)"* 和 *"Skip files starting with `_` (templates, section definitions)"*，但分别在 **v1.4.1**（2026-02-20，随 PR #297 悄悄移除，release note 里没提）和 **v1.4.5**（PR #548）就修掉了。也就是说我实测到的是**五个月前的行为**。上游还有 issue #61、#292、#543 报过同一件事，全部已关闭。

**教训一**：验证一个工具的行为，先验证**跑的是不是那个工具**。我比对了「装出来的文件 vs 源文件」，差异真实、复现稳定、结论错误——因为我从没确认过被执行的二进制是哪个版本。`--version` 应该是第一步，不是最后一步。

**教训二**：`npx <cmd>` 的解析优先级是坑。PATH 上的同名 binary 优先于 registry，npx 自己还有一层命令名→包名的缓存映射。**凡是写进文档或脚本的 `npx` 命令，一律带 `@latest` 或固定版本**，成本为零。

**教训三**：**「装完能跑」不等于「装完是全的」。** 安装器打印 `✓ Installed 10 skills`，`SKILL.md` 在、目录在、`--help` 也能跑，只有走到 `remember` 那条具体路径才炸。验收要比对文件清单，不能只看退出码：

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

- `project-memory-init` 里被改名的三个文件（`entry_line.tmpl.md`、两个 `OVERVIEW.md`）现在已无必要——那是为绕开老包做的。留着当防御性兼容，代价是丢了 `_` 前缀「这是片段不是产物」的语义。哪天确定不会再碰到老版本，可以改回去。
- 上游那条丢弃规则已在 v1.4.1 / v1.4.5 修掉，不必再提 issue。但**它从未出现在任何文档里**——连至今仍生效的 `metadata.json` 排除也没写——这个文档缺口值得提。
- `npx` 把 `skills` 解析到 `add-skill@1.0.29` 的机制没查清（该包 bin 名其实是 `add-skill`）。带 `@latest` 就绕开了，没继续深挖。
