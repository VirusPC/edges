anthropics/claude-code#58840 —— `[FEATURE] Route memory writes by metadata.type — user/feedback should be user-level, not project-scoped`，willie 于 2026-05-13 提，目前 Open，标签 `enhancement` + `memory`。

https://github.com/anthropics/claude-code/issues/58840

核心论点：frontmatter 声明了一套 scope 层级，但存储位置不认它。系统提示词让 Claude 用 `user` / `feedback` / `project` / `reference` 四种 `metadata.type` 写 memory，前两种本质上是跨项目的——描述的是这个用户、以及 Claude 该怎么为这个用户工作，而不是某个 repo 的事实。但所有 memory 无论什么 type，都落在同一个 project-scoped 路径下。

作者给的实测：一个项目目录下 ~25 条 memory，其中约 17 条是 `feedback_*`，内容全是「命名前先问」「不要臆测」「红绿测试」「不经许可别 push」这类跨项目偏好；真正项目专属的只有约 4 条。

提的方案有两档：按 `metadata.type` 路由写入（user/feedback 进 `~/.claude/memory/`，project 留在原路径）；或者侵入性更小的做法——存储位置不动，但每个 session 额外加载 `~/.claude/memory/`。备选里还有一条更干脆的：在 frontmatter 里直接加 `scope: user | project` 字段，由用户逐文件决定，默认值按 `metadata.type` 推。

值得注意的一句是 「type 字段要么得对 scope 有实际意义，要么就该去掉」——这其实反向印证了我上一条说的：`type` 降到 `metadata` 下之后，它现在更像纯分类标签，而不是任何有行为后果的字段。