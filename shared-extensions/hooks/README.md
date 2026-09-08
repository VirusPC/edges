# hooks/

跨机器、跨 Agent 共用的生命周期钩子。

各家 hook 的配置文件名、事件名和脚本接口都不同，**禁止**把本目录整棵软链到 `~/.claude/hooks` 或 `~/.codex/hooks`。能共用的脚本放本目录根；对不上的格式放 Agent 子目录（如 `claude/`、`codex/`）。

凭据、内部路径、未脱敏信息不要写进 hook 脚本。安装脚本尚未落地。不要为本目录另开 version 或 changelog，跟 shared-extensions 整层走 [`VERSION`](../VERSION) / [`CHANGELOG.md`](../CHANGELOG.md)。
