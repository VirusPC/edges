---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-14T16:40:34.643Z'
  edges-title: Agent 取外部内容优先走 RSS，浏览器爬取只作退路
  edges-tasks-status: backlog
  edges-task-priority: none
name: agent_取外部内容优先走_rss浏览器爬取只作退路
description: 现在 Agent 抓文章常靠开浏览器爬页面，又慢又不稳。改成先找 RSS 源拉结构化内容，找不到再爬。
---
**背景：**
2026-10-14 深夜聊 Folo 的订阅源是怎么来的，弄清了两类来源：一类是站点自带的原生 RSS，另一类是 RSSHub、Wechat2RSS、XGo.ing 这类服务转换出来的。接着发现 BestBlogs 公开了两份免费 OPML，一份 375 个微信公众号源，一份约 160 个推特源，任意阅读器都能导入。用户随后指出：RSS 本身就能直接拿到文章内容，Agent 完全不用自己开浏览器去爬，于是开了这张卡。
- 现状：转换源要依赖第三方实例，比如 `wechat2rss.bestblogs.dev` 和 `api.xgo.ing`，稳定性不归我们管。`rsshub://` 是 Folo 自己的简写，换到别处要补上实例域名才能用。
- 预期收益：Agent 取内容更快、更稳，省掉浏览器开销。
- 非目标：这张卡不负责自建 RSSHub 或 Wechat2RSS，也不负责把 OPML 导进 Folo。
- 关联：笔记 `notes/2026-10-15--folo与bestblogs订阅源及opml白嫖路径/`。

**目标：**
Agent 需要外部文章时，默认先通过 RSS 或 feed 获取，只有没有可用源时才回退到浏览器爬取。
