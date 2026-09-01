# Edges 基础设施 (bin/)

该目录存放 Edges 系统原生的维护与操作脚本。这些工具主要用于本地开发、系统配置以及自动化的内容管理。

## 核心脚本

- **`new-note`**: 主力笔记入库工具。支持“创建 PR”或“直接提交”模式（由 `EDGES_MODE` 环境变量控制，默认为 `direct`）。
- **`install-skills`**: 把 `extensions/skills/` 里的技能分发到本机各 AI Agent 的**全局**配置目录，装一次所有项目都能用。

### install-skills

采用两跳软链，仓库绝对路径只出现在中枢这一层，仓库搬家重跑一次即可：

```
~/.agents/skills/<name>  ->  <repo>/extensions/skills/<name>   (绝对)
~/.claude/skills/<name>  ->  ../../.agents/skills/<name>       (相对)
```

分发目标：`~/.claude`、`~/.codex`、`~/.cursor`、`~/.gemini`、`~/.factory` 下的 `skills/`，以及 `~/.config/opencode/skills/`。

逐个 skill 软链而非整目录软链——各 agent 目录里混着别处装的技能，整目录链会把它们盖掉。目标位置若已是实体目录或指向别处的软链，脚本会 warning 并跳过，**绝不覆盖**。

因为是软链，改 `extensions/skills/` 下的源文件即时生效，无需重跑。只有新增/删除 skill 才需要重跑。

| 参数 | 作用 |
| --- | --- |
| （无） | 执行分发 |
| `--dry-run` | 只打印将要做的动作，不改动任何东西 |
| `--list` | 列出各 skill 已装到几个目标 |
| `--uninstall` | 只删除指向本仓库的软链，别处装的一律不动 |

脚本会校验每个 skill 目录：必须有 `SKILL.md`，且其 frontmatter 的 `name` 与目录名一致，否则 warning 并跳过——不合规的 skill 本来就加载不了，早暴露好过静默漏装。

## 开发建议

- 脚本应尽量保持 POSIX 兼容性。
- 严禁硬编码绝对路径，应使用 `$(dirname "$0")` 等方式动态获取仓库根目录。
- 增加新脚本后，请运行 `chmod +x` 并在此 README 中同步更新说明。
