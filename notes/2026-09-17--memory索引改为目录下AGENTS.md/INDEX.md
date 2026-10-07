# `.memory` 改造：类型索引改为类型目录下的 `AGENTS.md`

来源：peng cheng 口述 idea（2026-09-17）。未定实现细节，先落盘。

## Idea 核心

`.memory` 要改造。里面的**索引文件**不要再做成 `.memory/` 内的 `FEEDBACK.md` / `PROJECT.md` / `REFERENCE.md` 这种平铺索引；应：

1. **作为 `AGENTS.md`**
2. **直接放到对应文件夹下**

示例形态：

```text
feedbacks/AGENTS.md
projects/AGENTS.md    # 名称待定，示意
references/AGENTS.md
```

即：按类型（或作用域）建目录，索引就是该目录下的 `AGENTS.md`，而不是 hidden `.memory/` 里的另一套入口文件。

## Why

比 `.memory/` 内平铺类型索引**更加具备一致性和可扩展性**：索引形态统一为各处都认识的 `AGENTS.md`；新类型只需加目录 + 一份 `AGENTS.md`，不必再发明/维护另一套索引文件名约定。

## 对照现状（待推翻或收缩）

当前常见：目录根有一份 `AGENTS.md`，另在 `.memory/` 内维护类型索引文件。本 idea 指向索引出口下沉到**类型目录下的 `AGENTS.md`**（如 `feedbacks/AGENTS.md`），降低双索引漂移。

## 开放点（未拍板）

- 目录名是 `feedbacks/` 复数，还是保持 `feedback` / 与现 type 一一对应？
- 条目正文仍放目录内（`feedbacks/*.md`），还是仍进 hidden 某处、仅索引公开？
- 原「作用域目录根的 `AGENTS.md`」与「类型子目录的 `AGENTS.md`」如何分层、是否并存？
- init / remember / doctor / PROTOCOL 的迁移路径。

## 边界

- 布局 / 协议改造 idea，不是某次手工搬家任务。
- 交叉：`knowledge/notes/2026-09-11--项目memory可见性思考.md`；project-memory-init 的 PROTOCOL / LAYOUT / design-decisions。

## 看板

已升格：`knowledge/tasks/_default/backlog/2026-09-17--memory类型索引改为目录下AGENTS.md.md`（协议级特殊 task）。
