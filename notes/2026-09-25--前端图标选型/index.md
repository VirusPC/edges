# 前端图标选型

来源：peng cheng 与设计同学（2026-09-25）锁定。tasks-review 与后续前端共用。

## 结论

项目默认用 **Lucide**（React / TS 的 `lucide-react`，按需引入，可调 size、color、stroke）。同一产品固定一套风格，不因为用了聚合库就混搭。

## 什么时候换

- 界面 Tailwind 味很重：可以改用 Heroicons。
- 需要品牌图标，或同一处要多套风格：再考虑 Font Awesome（有一部分是付费的）。

换的是整套，不是在 Lucide 旁边再插几个别的库的图标。

## 平台

- 搜图标：Iconify。
- 设计师自定义图标、整理后导出：IcoMoon。

## tasks-review

审阅壳已经按这套落地。大章节（Projects / Tasks / Details）和状态小节（待办、进行中等）的折叠用 Lucide `ChevronDown`（展开）和 `ChevronRight`（收起）。筛选抽屉的关闭用 Lucide `X`；打开入口仍是文字「筛选」。

这些控件不要写成可见文字「收起」「展开」「关闭」。`aria-label` 可以用中文。不要再为它们另引一套图标库。

## 边界

这是选型约定，不是某一屏的布局说明。
