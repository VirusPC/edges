# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.3.1] - 2026-09-27

### Changed

- 「做什么须带可选项」改为默认要求：无比较空间时可省略或写「当时未比较其它方案」，不硬编。

## [2.3.0] - 2026-09-27

### Changed

- 正文章节改为：`背景 → 主题 → 过程 → 结果 → 所学 → 行动指南 → 补充说明`（标题不加括号）。
- `主题` = 一段主题 + 难点列表；本 skill 同时做记录与复盘总结。
- 过程中的真实取舍原样保留；所学与行动指南**补充**取舍，不压缩过程。
- 凡写「做什么」须带相关可选项与不做原因。
- 新增 ADR 0007、0008；更新 CONTEXT。

## [2.2.1] - 2026-09-27

### Changed

- 技术类笔记必须讲清**技术难点**（难在哪、为何难、如何处理或未解）；写入所学与 Constraints，CONTEXT 补术语。
- CONTEXT 注明与 `conversation-to-tasks` 1.2.0 章节同序（验收/完成标准放最后）。

## [2.2.0] - 2026-09-27

### Changed

- 正文强制 Markdown `##` / `###` / `####` 分层；不再用【背景】等方括号栏名作为正式结构。
- **行动指南**拆成主题行动指南（背景 → 核心问题 → 可执行步骤 → 验收标准）与细节与其他（`#### 若…` / 则… 小章节）。
- **过程**强制时间线（小节带时刻）；**验收标准**当作以后任务执行的完成判定清单。
- 主题行动指南须可泛化（不绑主机名/网段/路径）；操作细节只进细节层。
- 行动类对话内容优先进行动指南；学习类对话所学写知识点总结。
- 入库提交通道改为灵活（文档可直接 commit；大代码改动仍走云 agent）。
- 新增同目录 `CONTEXT.md` 与 `docs/adr/`（0001–0006）。

### Removed

- 以方括号四栏名为唯一正式结构的写法。

## [2.1.1] - 2026-09-20

### Changed

- 「写给人审阅」文风规则只写在本 skill 的 Constraints 里，自洽生效，不再另设外部核对指针。

## [2.1.0] - 2026-09-20

### Added

- Constraints 补上「写给人审阅」：白话完整句、例子与上下文够独立读懂；密表进【补充说明】；【所学】只写对错理解与边界；【行动指南】须带触发与步骤；忌「记完四栏」式短稿。

## [2.0.0] - 2026-09-10

### Changed

- 对话整理结构改为复盘四栏：【背景】→【过程】→【所学】→【行动指南】。灵感来自 After Action Review，但不是官方 AAR 模板。
- 【过程】只记对话事实、少评价，不得同义改写成【所学】；【所学】只写可带走的判断，禁止复述过程栏。
- 【行动指南】改为触发条件 + 具体做法，优先「若…则…」，不再写成裸待办清单。
- 本 skill 明确只整理对话为 Note，不在此「升 Edge」。
- 【相关链接】并入【补充说明】；每条链接须附简短说明（是什么 / 为何与本笔记相关）。【补充说明】仍可写其他非四栏细节。

### Removed

- Facts–Insights–Actions 及其中文映射（讨论主题 / 主要结论 / 认知更新）。
- 独立的【相关链接】栏。

## [1.0.0] - 2026-09-01

### Added

- 按 semver 标记的首个版本。

[Unreleased]: https://github.com/VirusPC/edges/compare/skill/conversation-to-notes@2.3.0...HEAD
[2.3.0]: https://github.com/VirusPC/edges/releases/tag/skill/conversation-to-notes@2.3.0
[2.2.1]: https://github.com/VirusPC/edges/releases/tag/skill/conversation-to-notes@2.2.1
[2.2.0]: https://github.com/VirusPC/edges/compare/skill/conversation-to-notes@2.1.1...skill/conversation-to-notes@2.2.0
[2.1.1]: https://github.com/VirusPC/edges/compare/skill/conversation-to-notes@2.1.0...skill/conversation-to-notes@2.1.1
[2.1.0]: https://github.com/VirusPC/edges/compare/skill/conversation-to-notes@2.0.0...skill/conversation-to-notes@2.1.0
[2.0.0]: https://github.com/VirusPC/edges/compare/skill/conversation-to-notes@1.0.0...skill/conversation-to-notes@2.0.0
[1.0.0]: https://github.com/VirusPC/edges/releases/tag/skill/conversation-to-notes@1.0.0
