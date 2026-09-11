# 用户记忆权威副本在仓库工作树内且 gitignore

用户记忆是项目记忆的一种类型（对齐 Claude Code auto memory 的 `user`），不是独立全局 vault，也不是以 edges-private 为真源。权威副本放哪、目录怎么排、能装什么、能否进 git、绑多少仓、删仓后怎么逃生，都已与用户谈定。

**Decision:** 权威副本落在该仓库工作树内，用 gitignore 挡住，不进入 git。一份用户记忆绑定一个仓库路径，布局与其他项目记忆类型相同：类型 `user` → 目录 `.memory/users/`（复数）、索引 `USER.md`、条目 `user_<slug>.md`。不是机器级单一 vault 再软链进多个仓。

内容闸门从简：个人偏好（非项目共享）、凭据与密钥、以及其他不得公开的材料都可以进用户记忆。gitignore 是凭据可以放这里的前提。v1 不做脱敏后晋升到可提交类型，也不设计那条投影路径。

生命周期跟随工作树（`rm -rf` 克隆可以删掉它）。逃生靠备份 skill 与恢复/回注 skill：备份目标目录由用户指定，默认归档落在仓库根。gitignore 覆盖 `.memory/users/`、`.memory/USER.md`（与其他类型索引同位置的根索引，一并挡住以免只 ignore 条目目录），以及仓库根默认备份名 `user-memory-backup-*.tar.gz` / `user-memory-backup-*.zip`。含斜杠的 gitignore 模式只匹配仓库根，所以实现再加 `**/.memory/users/` 与 `**/.memory/USER.md`，挡住下层记忆目录。

这推翻了 `project_type_set` 里「不要把 `user` 放进仓库树 / 跨项目偏好只放 agent 家目录」的旧结论。skill 接线（init / remember `--type user` 等）等用户确认 shared understanding 后再做，不在本决策里实现。

**Why:** 用户明确否决家目录当真源。仓内权威副本让 Agent 按仓库路径取到与其他记忆类型同一套绑定和同一套复数目录约定；gitignore 把个人材料（含凭据）挡在公开仓之外。生命周期跟随工作树是该绑定的直接后果；备份/恢复是删仓后的逃生口。晋升到可提交类型会重新打开脱敏与闸门设计，v1 不做。

## Considered Options

- 家目录（或 XDG）当真源、仓内只留指针：用户否决。
- 机器级单一 vault 软链进多个仓库：与「按仓库路径绑定」不一致，否决。
- edges-private 当真源：否决；用户记忆是项目记忆类型，不是私有仓角色。
- 复杂内容分类学，或脱敏投影进可提交类型：v1 不做。

## Follow-up

原 Open（`USER.md` 是否一并 ignore）已关：与 `.memory/users/` 一起挡住。不按条目加 `private` 元数据；那是另案，不在本决策范围。skill 接线（init / remember `--type user`、备份/恢复）是本决策之后的实现，不改上述布局与闸门。

