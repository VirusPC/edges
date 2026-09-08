# plugins/

跨机器、跨 Agent 共用的插件。

格式随各家 Agent 而异。能写成一份通用源就写一份；对不上时在本目录下加 Agent 子目录（如 `claude/`），不要按 Agent 切整棵 `shared-extensions/`。

不要把插件实体拷进 `~/.claude/plugins` 等多处——源在这里，发现位用安装脚本或软链对接。安装脚本尚未落地。不要为本目录另开 version 或 changelog，跟 shared-extensions 整层走 [`VERSION`](../VERSION) / [`CHANGELOG.md`](../CHANGELOG.md)。
