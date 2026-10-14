# Folo与BestBlogs订阅源及OPML白嫖路径

## 背景

2026-10-14 深夜到 2026-10-15 00:24（Asia/Shanghai），用户 peng cheng 在使用 Folo 阅读器时，和助手 Grok Bot 讨论了订阅源从哪里来、能不能免费使用别人整理好的订阅源，以及 RSS 对 Agent 获取内容有什么价值。同一会话更早的 edges connector、Codex、OAuth 部分已经单独入库，本笔记只整理 Folo 与 BestBlogs 订阅源这一段。

## 主题

这次讨论的核心是弄清 Folo 里的订阅源是怎么来的，区分站点原生 RSS 和由 RSSHub、Wechat2RSS、XGo.ing 等服务转换出来的 RSS，并确认 BestBlogs 公开的 OPML 可以免费导入任意阅读器，最后得出 Agent 取内容应优先走 RSS 而不是默认开浏览器爬页面的判断。

难点如下：

- Folo 中常见的 `rsshub://` 地址是应用内协议，不能直接在其他 RSS 阅读器里使用。
- BestBlogs 是半开源产品，需要分清哪些部分开源、哪些部分是商业服务。
- 免费的推特和微信公众号订阅源大多依赖第三方转换实例，稳定性取决于对方，而不是源站。

## 过程

### 2026-10-14 深夜 Folo 订阅源的来源

用户问 Folo 的订阅源是怎么做的，是不是他们自己把原始文章转化成了 RSS。助手回答订阅源分两类：第一类是站点自己提供的原生 RSS 或 Atom；第二类是由 RSSHub 等路由把网页或 API 转换成 RSS。Folo 的重点是阅读器加发现，而不是自己统一爬取全网。

用户追问第二类自己能不能做。助手回答可以，既可以自建 RSSHub 实例，也可以用公开实例，但需要自己维护路由并应对反爬。

### 2026-10-14 深夜 rsshub 协议地址能否通用

用户截了 Folo trends 的图，问下面的链接是不是 RSS 地址，又问随便一个 RSS App 是否都能用，rsshub 的是否不行。助手回答 Folo 里常出现 `rsshub://…` 这种应用内协议，它不是任意 RSS App 都能直接使用的 http(s) URL。原生的 `https://…xml` 类地址任何阅读器都能用；裸的 `rsshub://` 不行，需要换成某个可解析的 RSSHub 实例域名加路径才能通用。

### 2026-10-14 深夜 wechat2rss.bestblogs.dev 与 BestBlogs 是否开源

用户问 `wechat2rss.bestblogs.dev` 是什么、是谁做的。助手回答这是 BestBlogs（ginobefun，即 Gino）维护的公共 Wechat2RSS 实例，底层是开源项目 Wechat2RSS，BestBlogs 公开了微信公众号的 OPML。

用户问 BestBlogs 本身是否开源。助手回答是半开源：公开仓库里有 OPML、文档、OpenAPI、CLI（MIT 许可）和 Agent Skills，但仓库根目录没有明确的许可证；主站是 Free 加 Pro 的商业产品，不能当作完整的开源项目自行部署。真正开源的是它依赖的 Wechat2RSS、RSSHub 等项目。

### 2026-10-14 深夜 Folo 与 BestBlogs 对比

用户要求把两者做对比。助手回答 Folo 是订阅一切的阅读器，出自 DIYgod 和 RSSHub 一系，客户端开源；BestBlogs 是 AI 策展和筛读助手，半开源加 Pro 付费。很多人把 Folo 当阅读器，把 BestBlogs 当早报或策展来源。

### 2026-10-14 深夜 推特订阅源、OPML 与 XGo.ing

用户问 BestBlogs 是否提供了许多免费的推特 RSS 源、是否真的免费。助手回答是的，公开 OPML 中约有 160 条，可以从仓库下载，导入阅读器不需要 Pro；底层多为第三方转换，不是 X 官方 RSS。

用户问 OPML 是什么、缩写是什么、长什么样。助手回答 OPML 是 Outline Processor Markup Language 的缩写，是用于批量导入订阅的 XML 文件，示例中每个 outline 元素带有 text、type、xmlUrl 等属性。

用户让助手看看推特部分有哪些源，问 XGo.ing 是什么、这些是否都免费、还有没有类似供应商。助手回答推特 OPML 里几乎全是 `api.xgo.ing/rss/user/...` 形式的地址；XGo.ing 是第三方商业推文转 RSS 服务，公开 feed 当前可以免费使用，但稳定性取决于对方。同类服务还有 RSS.app、Narro、Keep、RSSHub 或 RSS-Bridge、twikit-rss 等；Nitter 不稳定。

### 2026-10-15 00:00 前后 微信 OPML 是否 BestBlogs 自己转换

用户问 BestBlogs 的 wechat2rss 是否用了什么服务，并要求看一下 OPML，确认是否都是他们自己转换的。助手回答他们使用开源的 Wechat2RSS，在 `wechat2rss.bestblogs.dev` 自建了实例。微信 OPML 共 375 条，地址全部在该域名下，是他们自己实例转换的，不是公众号官方 RSS。该文件曾下载到箱内 `/workspace/bestblogs_wechat2rss_opml_all.opml`。

### 2026-10-15 00:24 前后 RSS 对 Agent 的价值

用户说参考他们的项目，自己可以白嫖很多订阅源了，而且 RSS 完全不需要 Agent 自己开浏览器爬内容，可以直接拿到文章内容。助手表示同意：OPML 可以批量导入，RSS 是结构化的入口，Agent 拉取 feed 即可，不必开浏览器爬页面。

## 结果

已经做成的事情：

- 摸清了 Folo 订阅源的构成，即原生 RSS 加 RSSHub 等转换源。
- 弄清了 BestBlogs 的半开源边界：OPML、文档、OpenAPI、CLI、Agent Skills 公开，主站为商业产品。
- 确认了免费 OPML 的获取路径：微信公众号 375 条，推特约 160 条，均可从 BestBlogs 仓库下载并导入任意阅读器。
- 理解了 OPML、XGo.ing、Wechat2RSS 的概念和作用。
- 得出了 RSS 对 Agent 有价值的判断：用 feed 取内容，不必开浏览器爬页面。

对话里尚未拍板的事项：

- 用户是否要把某份 OPML 导入自己的 Folo。
- 是否自建 RSSHub 或 Wechat2RSS 实例。
- 是否把「Agent 用 RSS 替代浏览器爬取」做成 edges 任务。

## 所学

- 原生 RSS 由源站自己提供，比较稳定；RSSHub、Wechat2RSS、XGo.ing 这类转换源依赖转换方维护，稳定性不同。
- `rsshub://` 是 Folo 的应用内协议，只有换成具体 RSSHub 实例的 http(s) 地址才能在其他阅读器里使用。
- 免费使用别人的 OPML 不等于拥有源站的服务保障，实际依赖的是第三方实例。
- Agent 获取内容应优先使用 RSS 或 feed，用浏览器爬页面只是退路。

## 行动指南

### 主题行动指南

#### 背景

想要大量订阅源，或者想让 Agent 稳定获取文章内容，而公开的 OPML 和 RSS 转换服务已经存在。

#### 核心问题

如何区分可用的订阅地址与不可通用的地址，如何低成本批量获取订阅源，以及 Agent 应该用什么方式取内容。

#### 核心解决方案

先判断订阅源是原生 RSS 还是转换源。需要在 Folo 以外使用时，把 `rsshub://` 换成具体 RSSHub 实例的 http(s) 地址。批量获取订阅源时，直接从 BestBlogs 仓库下载 OPML 导入阅读器，导入不需要 Pro。可选的推特转换服务有 XGo.ing、RSS.app、Narro、Keep、RSSHub 或 RSS-Bridge、twikit-rss；Nitter 因为不稳定不作为首选。也可以选择自建 RSSHub 或 Wechat2RSS，代价是要自己维护路由和应对反爬，对话中尚未决定是否自建。Agent 方案中默认拉取 feed，不默认开浏览器爬页面。

#### 验收标准

- 能区分一个订阅源是原生源还是转换源。
- 能把一份 OPML 导入任意阅读器。
- Agent 方案里明确写出使用 feed 获取内容，而不是默认开浏览器。

### 细节与其他

#### 若订阅地址是 rsshub:// 开头，则需要换成具体 RSSHub 实例域名加路径后才能在其他阅读器使用

#### 若依赖 XGo.ing 或 wechat2rss.bestblogs.dev 等第三方实例，则要接受其可用性取决于对方，必要时考虑自建实例

#### 若需要 BestBlogs 的完整功能，则要知道主站是 Free 加 Pro 的商业产品，不能当作完整开源项目自行部署

## 补充说明

### 原始材料引用

- 会话：Grok Bot 与 peng cheng，约 2026-10-14 至 2026-10-15（Asia/Shanghai）。
- BestBlogs 仓库：https://github.com/ginobefun/BestBlogs
- 微信 OPML 在仓库中的路径：`opml/bestblogs_wechat2rss_opml_all.opml`
- Wechat2RSS：https://github.com/ttttmr/Wechat2RSS
- 箱内下载副本（不在仓库内）：`/workspace/bestblogs_wechat2rss_opml_all.opml`
- 同一会话更早已入库的笔记：`notes/2026-10-14--connector服务端agent用codex接入与沙箱/`（PR #247、#249），本笔记不再重复展开。