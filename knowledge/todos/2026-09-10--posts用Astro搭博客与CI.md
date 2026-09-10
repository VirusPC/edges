【讨论主题】
posts 对外展示，后续用 Astro + GitHub Actions 搭博客与 CI。

【主要结论】
- `posts` 是要对外展示的内容。
- 后面要把 `posts` 作为数据，通过 Astro 搭建博客。
- 并配置 GitHub Actions，在服务器做 CI。

【认知更新】
- `posts` 与对内的 notes/todos/记忆层不同：面向公开站点消费，数据形态要能被静态站点生成器稳定读取。

【行动指南】
- 规划 Astro 博客：以 `posts` 为内容源。
- 配置 GitHub Actions，在服务器侧跑 CI（构建/部署链路待定）。
- 定 posts 目录与 frontmatter 约定时，兼顾「可对外展示」与 Astro 内容集合需求。

【补充说明】
- 来源：Todo 记录员对话速记（2026-09-10）。
- 状态：方向已定，实现未开始。

【相关链接】
无
