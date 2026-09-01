## 任务执行流程
1. 对于给定的每个blog网站，收集过去一段时间（时间范围默认取过去一周，不含当天）新发布的文章链接。
2. 对每一篇新发布的文章，分别进行不超过200字、突出重点的摘要汇总。. 如果和AI Coding相关，则增加一句话总结对于大前端研发的落地点或值得研究的方向
3. 对所有文章的摘要汇总，总结这段时间的技术风向，插到文章最前。
4. 讲结果按格式要求保存到markdown文件里

## 输出内容模版

### 文章整体框架

```
# {{yyyy-MM-DD}} AI Coding 资讯

## 本周风向：{{yyyy-MM-DD}}～{{yyyy-MM-DD}}
{{本周风向}}

## 文章总结列表
{{ 文章总结1 }}
{{ 文章总结2 }}
{{...}}
{{ 文章总结n }}

```

### 单篇文章总结模版
```md
### {{标题}} - {{yyyy-MM-DD}}

{{一段话内容}}

> 原始链接：{{}}
```
内容总结要求：
1. 200字以内
2. 一段话内讲完
3. 如果和AI Coding相关，则增加一句话总结对于大前端研发的落地点或值得研究的方向。 

## 强制要求

1. 网站链接**必须**确保真实有效。如果不存在，请尝试修复。
2. 文章总结按时间排序 

## 参考博客网址列表
```md
https://claude.com/blog
https://www.anthropic.com/engineering
https://openai.com/zh-Hans-CN/news/
https://research.google/blog/
https://manus.im/blog
https://cursor.com/cn/blog
https://cognition.ai/blog/1
https://blog.langchain.com/
https://www.trae.ai/blog
https://qoder.com/blog
https://www.codebuddy.ai/blog
https://qwen.ai/research
https://huggingface.co/blog
https://aws.amazon.com/cn/blogs/machine-learning/
https://sankalp.bearblog.dev/
https://www.datacamp.com/blog/category/ai
https://ampcode.com/chronicle
https://latitude-blog.ghost.io/blog/
https://lovable.dev/blog
https://kiro.dev/blog/
https://www.philschmid.de/
https://block.github.io/goose/blog
https://zed.dev/blog
https://roocode.com/blog
https://www.coderabbit.ai/blog
https://www.warp.dev/blog
https://www.kimi.com/blog/
https://blog.fsck.com/
https://www.trychroma.com/research
https://baoyu.io/translations/2026-05-10/akshay-pachaar-2041146899319971922
https://antigravity.google/blog
https://jxnl.co/writing/#business-and-product
https://baoyu.io/
https://lucumr.pocoo.org/
https://minimaxi.com/blog
```