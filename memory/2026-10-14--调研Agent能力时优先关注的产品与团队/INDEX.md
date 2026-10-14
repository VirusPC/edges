# 调研 Agent 能力时优先关注的产品与团队

> 落库日期：2026-10-14（Asia/Shanghai）  
> 来源：以 weekly-ai-blogs-digest skill 的「参考博客网址列表」为底，合并此前已在跟的 Devin、Codex、Anthropic、Letta、Mem0、Kimi Code、pi、DeepSeek、ZCode、MiniMax Code。  
> 核验：链接都在 2026-10-14 打开确认过，X 账号逐个查过；无法确认的标 【未证实】，没有的写 —。  
> 相关长文：[`projects/memory/2026-10-14-Agent-Memory-Dreaming调研.md`](../../projects/memory/2026-10-14-Agent-Memory-Dreaming调研.md)

## 模型厂商

- **Anthropic**：Claude；Managed Agents / Dreams 有 API 级 dreaming job
  - 代码仓库：https://github.com/anthropics/claude-code
  - 博客：https://claude.com/blog（现跳到 claude.com/resources/articles）；https://www.anthropic.com/engineering
  - X：[@AnthropicAI](https://x.com/AnthropicAI)、[@claudeai](https://x.com/claudeai)
- **OpenAI**：Codex 公开了 memories 管线；ChatGPT Dreaming 是另一套闭源产品能力，不要混为一谈
  - 代码仓库：https://github.com/openai/codex
  - 博客：https://openai.com/zh-Hans-CN/news/
  - X：[@OpenAI](https://x.com/OpenAI)、[@OpenAIDevs](https://x.com/OpenAIDevs)
- **Google Research**
  - 代码仓库：https://github.com/google-research
  - 博客：https://research.google/blog/
  - X：[@GoogleResearch](https://x.com/GoogleResearch)
- **Qwen（阿里）**
  - 代码仓库：https://github.com/QwenLM
  - 博客：https://qwen.ai/research
  - X：[@Alibaba_Qwen](https://x.com/Alibaba_Qwen)
- **Moonshot / Kimi**：Kimi Code 内置长期记忆还弱，主要靠 issue 和插件
  - 代码仓库：https://github.com/MoonshotAI/kimi-code
  - 博客：https://www.kimi.com/blog/（现跳到 kimi.ai/blog）
  - X：[@Kimi_Moonshot](https://x.com/Kimi_Moonshot)
- **MiniMax**：MiniMax Code（mcode）有 Proactive Memory 和 `/memory`，没看到 Dreaming
  - 代码仓库：https://github.com/MiniMax-AI/minimax-code
  - 博客：https://minimaxi.com/blog（现跳到 minimax.cn/blog）
  - X：[@MiniMax_AI](https://x.com/MiniMax_AI)
- **DeepSeek**：之前清单里写的是 dsh；dsh 本体是否就是 DeepSeek 出品 【未证实】
  - 代码仓库：https://github.com/deepseek-ai
  - 博客：https://api-docs.deepseek.com/news/
  - X：[@deepseek_ai](https://x.com/deepseek_ai)
- **Z.ai（智谱）**：ZCode
  - 代码仓库：https://github.com/zai-org/ZCode
  - 博客：—（z.ai/blog 返回 404）
  - X：[@Zai_org](https://x.com/Zai_org)
- **Hugging Face**
  - 代码仓库：https://github.com/huggingface
  - 博客：https://huggingface.co/blog
  - X：[@huggingface](https://x.com/huggingface)
- **AWS Machine Learning**
  - 代码仓库：https://github.com/aws-samples
  - 博客：https://aws.amazon.com/cn/blogs/machine-learning/
  - X：[@awscloud](https://x.com/awscloud)

## Coding Agent 产品

- **Cognition / Devin**：Memory Drive 和产品侧 Dreaming；开源的只是 Agent Memory Repo 格式
  - 代码仓库：https://github.com/AgentMemoryRepo/agentmemoryrepo
  - 博客：https://cognition.ai/blog/1（现跳到 cognition.com/blog）
  - X：[@cognition](https://x.com/cognition)
- **Cursor**
  - 代码仓库：https://github.com/cursor
  - 博客：https://cursor.com/cn/blog
  - X：[@cursor_ai](https://x.com/cursor_ai)
- **pi（Mario Zechner）**：长期记忆和 dreaming 靠扩展生态
  - 代码仓库：https://github.com/badlogic/pi-mono（现跳到 github.com/earendil-works/pi）
  - 博客：https://mariozechner.at/
  - X：[@badlogicgames](https://x.com/badlogicgames)
- **Amp**
  - 代码仓库：—
  - 博客：https://ampcode.com/chronicle
  - X：[@AmpCode](https://x.com/AmpCode)
- **Kiro**
  - 代码仓库：https://github.com/kirodotdev/Kiro
  - 博客：https://kiro.dev/blog/
  - X：[@kirodotdev](https://x.com/kirodotdev)
- **Google Antigravity**
  - 代码仓库：—
  - 博客：https://antigravity.google/blog
  - X：[@antigravity](https://x.com/antigravity)
- **TRAE**
  - 代码仓库：https://github.com/Trae-AI
  - 博客：https://www.trae.ai/blog
  - X：[@Trae_ai](https://x.com/Trae_ai)
- **Qoder**
  - 代码仓库：—
  - 博客：https://qoder.com/blog
  - X：[@qoder_ai_ide](https://x.com/qoder_ai_ide)
- **CodeBuddy（腾讯）**
  - 代码仓库：—
  - 博客：https://www.codebuddy.ai/blog 【未证实：两次抓取都失败】；可打开的替代：https://www.codebuddy.cn/blog/
  - X：[@CodebuddyAI](https://x.com/CodebuddyAI)
- **goose**
  - 代码仓库：https://github.com/block/goose（现跳到 github.com/aaif-goose/goose）
  - 博客：https://goose-docs.ai/blog/（原 block.github.io/goose/blog 已 404，已改）
  - X：[@goose_oss](https://x.com/goose_oss)
- **Zed**
  - 代码仓库：https://github.com/zed-industries/zed
  - 博客：https://zed.dev/blog
  - X：[@zeddotdev](https://x.com/zeddotdev)
- **Roo Code**：roocode.com 现在跳到 roomote.dev
  - 代码仓库：https://github.com/RooCodeInc/Roo-Code
  - 博客：https://roocode.com/blog（现跳到 roomote.dev，只是主页，不是博客列表）
  - X：[@roomote](https://x.com/roomote)（Roo Code 原账号 【未证实】）
- **Warp**
  - 代码仓库：https://github.com/warpdotdev/Warp
  - 博客：https://www.warp.dev/blog
  - X：[@warpdotdev](https://x.com/warpdotdev)
- **CodeRabbit**
  - 代码仓库：https://github.com/coderabbitai
  - 博客：https://www.coderabbit.ai/blog
  - X：[@coderabbitai](https://x.com/coderabbitai)
- **Lovable**
  - 代码仓库：—
  - 博客：https://lovable.dev/blog
  - X：[@Lovable](https://x.com/Lovable)
- **Manus**
  - 代码仓库：https://github.com/manus-ai
  - 博客：https://manus.im/blog
  - X：[@ManusAI](https://x.com/ManusAI)

## Agent 框架与记忆

- **Letta**：Sleep-time / Dreaming 有文档和 SDK
  - 代码仓库：https://github.com/letta-ai/letta
  - 博客：https://www.letta.com/blog
  - X：[@Letta_AI](https://x.com/Letta_AI)
- **Mem0**：库开源；Dream 只在托管平台提供
  - 代码仓库：https://github.com/mem0ai/mem0
  - 博客：https://mem0.ai/blog
  - X：[@mem0ai](https://x.com/mem0ai)
- **LangChain**
  - 代码仓库：https://github.com/langchain-ai/langchain
  - 博客：https://blog.langchain.com/（现跳到 langchain.com/blog）
  - X：[@LangChain](https://x.com/LangChain)
- **Chroma**
  - 代码仓库：https://github.com/chroma-core/chroma
  - 博客：https://www.trychroma.com/research
  - X：[@trychroma](https://x.com/trychroma)
- **Latitude**
  - 代码仓库：https://github.com/latitude-dev/latitude-llm
  - 博客：https://latitude.so/blog（原 latitude-blog.ghost.io/blog/ 返回 402，已改）
  - X：[@trylatitude](https://x.com/trylatitude)

## 个人博客与媒体

- **Philipp Schmid**
  - 代码仓库：https://github.com/philschmid
  - 博客：https://www.philschmid.de/
  - X：[@_philschmid](https://x.com/_philschmid)
- **Armin Ronacher**
  - 代码仓库：https://github.com/mitsuhiko
  - 博客：https://lucumr.pocoo.org/
  - X：[@mitsuhiko](https://x.com/mitsuhiko)
- **Jesse Vincent（obra）**：X 简介写着已不在 X 发帖
  - 代码仓库：https://github.com/obra
  - 博客：https://blog.fsck.com/
  - X：[@obra](https://x.com/obra)
- **Jason Liu（jxnl）**
  - 代码仓库：https://github.com/jxnl
  - 博客：https://jxnl.co/writing/#business-and-product
  - X：[@jxnlco](https://x.com/jxnlco)
- **sankalp**
  - 代码仓库：—
  - 博客：https://sankalp.bearblog.dev/
  - X：[@dejavucoder](https://x.com/dejavucoder)
- **宝玉**：中文翻译和评论
  - 代码仓库：https://github.com/JimLiu
  - 博客：https://baoyu.io/
  - X：[@dotey](https://x.com/dotey)
- **Akshay Pachaar**：skill 里放的是宝玉翻译的一篇文章
  - 代码仓库：—
  - 博客：https://baoyu.io/translations/2026-05-10/akshay-pachaar-2041146899319971922
  - X：[@akshay_pachaar](https://x.com/akshay_pachaar)
- **DataCamp**
  - 代码仓库：https://github.com/datacamp
  - 博客：https://www.datacamp.com/blog/category/ai
  - X：[@DataCamp](https://x.com/DataCamp)
