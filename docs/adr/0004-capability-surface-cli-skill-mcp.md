# 能力面是 CLI + Skill + MCP；删除仓根 bin/

Agent 与人发现并调用 Edges 扩展能力的入口定为 CLI、Skill 与 MCP 三者，不再把仓根 `bin/`（含 `new-note`）当成人用第三层。Note 入库的 git 迁进 `extensions/clis` 的 TypeScript，并与现脚本全量对等；MCP 用子进程调用 `edges note`，不直连仓根脚本；Skill 放在 `extensions/skills/`，只教何时如何调 CLI（无 shell 宿主则指向 MCP）。npm `package.json` 的 `bin` 只是安装挂钩，不是一层。

对齐 gh / AXI / Agent Skills 的「一个 CLI + 一份 skill」，去掉假的人用 PATH 脚本层；无 shell 宿主仍需要 MCP。

**Status:** accepted（grill 确认于 2026-09-11）

## Considered Options

- 保留仓根 `bin/` 作为人用层：否决。
- Skill → 仓根 `bin/`：否决。
- 只搬 bash、不把 git 迁进 TypeScript：否决。
- 本轮 MCP in-process import CLI：否决；MCP 子进程调 `edges note`。
- 半迁移 git（部分仍留 `bin/`）：否决；整目录删除 `bin/`。
- 把 CLI 定义为「bin entry」：否决；npm `bin` 只是安装挂钩。
