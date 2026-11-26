---
status: accepted
---

# 应用层默认全装、CLI 按模块初始化，旧技能名硬切断

2026-11-26 用户确认第二轮 grill。本 ADR 补全 ADR 0054 留待后续的初始化、旧名兼容与存量迁移，并明确材料发现跟随既有查询范围（含范围内的 Compose）。

**Status:** accepted（尚未实现）

**Amends:** [ADR 0054](0054-three-entries-and-six-material-types.md)、[ADR 0031](0031-edges-init-standard-command.md)、[ADR 0036](0036-edges-init-installs-bundled-skills.md)（应用层默认集纳入例程）

## Decision

1. **分层初始化。** 应用层（onboarding / 无参 `edges init`）默认装齐六类官方材料。CLI 底层保持模块独立：`edges init` 只编排各模块；`edges <module> init` 只初始化该模块，并只在此时补该模块在 `AGENTS.md` 里的登记。硬约束只覆盖已初始化的模块——只装记忆时，入口里只写记忆的检索与沉淀时机，不把未装模块写进去；全装后才写齐六类。现行无参 `edges init` 默认集是 memory / skills / tasks / notes / projects，不含 routines；本决策将例程纳入应用层默认集。

2. **旧框架随包技能名硬切断。** 与 [ADR 0051](0051-bundled-skills-single-entry.md)、[ADR 0049](0049-edges-skills-markers-rename.md) 一致：不留旧名别名或软链。被并入 `edges` 的旧技能名不再作为公开入口。CHANGELOG 记录更名；已安装的旧副本需重新 `edges skills init` 才会替换。模板与硬约束改点 `edges`，不再点名旧技能。

3. **存量 AGENTS 迁移范围。** 更新官方种子与模板。作者自己的 workspace 与大脑随实现 PR 一起改硬约束。不提供扫描并自动改写他人已 init 仓库的通用迁移命令。现行重跑 `edges init` 只会在硬约束区块缺失时补上，不会覆盖已有硬约束正文；实现若支持刷新，只刷新仍等于旧官方种子的受管硬约束区块，用户改过的不覆盖，区块外正文始终不动。

4. **发现跟随既有查询范围。** 被 Compose 挂入、且已在当前查询范围内的其他 harness，也按其已初始化的官方材料类型做相关发现。范围含义仍是既有的默认组成、`--super`、`--all`，不新开一套发现边界。仍按相关性打开，并遵守归属与隐私（私密脑只在该 scope 下读）。

## Considered Options

- **任意一次模块 init 都把六类时机写进 AGENTS，未装类型发现时跳过：** 否决。与「装一个模块才加对应 AGENTS.md」冲突，会让未初始化模块出现在硬约束里。
- **CLI 也默认总是写下六类脚手架：** 否决。应用层可以全装，CLI 底层必须按模块分开。
- **保留一个版本或永久保留旧技能名别名：** 否决。两套名字会让调用方继续写旧名，与 ADR 0051 / 0049 的硬切断不一致。
- **做通用迁移命令扫描改写已有 AGENTS，或只改模板、存量一律手动：** 前者会改写他人仓库；后者会让作者自己的仓落后。采用官方种子加作者仓随实现 PR 改。
- **只发现当前 scope 自己的六类，不进入被组合仓库；或默认递归并忽略查询旗标：** 否决。发现应跟随既有查询范围，不缩小也不另造边界。

## Consequences

- ADR 0054 中「初始化、旧名兼容、存量迁移另轮再定」的条款由本 ADR 取代。0054 其余决定仍然有效。硬约束必须写清检索与沉淀时机，这一点不变；但覆盖的材料类型以已初始化模块为准，未装模块不写进同一份硬约束。
- 无参 `edges init` 与 onboarding 的默认集将包含 routines。这是对 ADR 0031 / 0036 默认集的修订。
- 尚未实现。使用方内容仓与 bot 的 UpdateSkill 随实现进行，不在本次文档提交里。
