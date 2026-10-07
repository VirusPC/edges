# 2025.5 - Cline - Why Cline Doesn't Index Your Codebase (And Why That's a Good Thing)

- [关键点](#%E5%85%B3%E9%94%AE%E7%82%B9)

---

[https://cline.bot/blog/why-cline-doesnt-index-your-codebase-and-why-thats-a-good-thing](https://cline.bot/blog/why-cline-doesnt-index-your-codebase-and-why-thats-a-good-thing)



为什么Cline不索引您的代码库（以及为什么这是件好事）

### 关键点
+ Cline选择不使用RAG索引代码库，而是通过智能探索来提高代码质量、安全性和可靠性。
+ RAG在处理代码时存在三大问题：**<font style="color:#DF2A3F;">代码逻辑被拆分、索引过时、以及安全性风险</font>**。
+ Cline通过逐步探索代码文件及其连接，构建自然的代码理解，而不是依赖索引或嵌入。
+ Cline的探索方法更适合现代语言模型的扩展上下文窗口，提供高质量的代码上下文。
+ 与传统RAG方法相比，Cline能够根据代码结构和团队模式提供更准确的建议。
+ Cline**<font style="color:#DF2A3F;">直接读取代码文件</font>**而非复制到向量数据库，以确保上下文质量优于检索速度。
+ Cline认为AI应该像开发人员一样“思考”，而不是仅仅检索代码片段。
+ 用户可以试用Cline并加入社区交流以探索AI辅助开发的潜力。





Cline的方案充分利用了大语言模型（如Claude 4）的巨大上下文窗口能力，确保代码信息的相关性和准确性。这种approach基于一个重要判断：当前AI能力已经足以像经验丰富的开发者一样进行代码思考和理解。



文章提出了一个具有前瞻性的观点：未来属于真正理解代码的智能系统，而非仅仅依赖检索机制的工具。这种技术路线选择体现了对AI核心能力的深度信任，以及对代码理解本质的深刻洞察。



> 更新: 2025-08-28 06:40:57  
> 原文: <https://www.yuque.com/viruspc/el3mi0/gnq1hkgcoira29oi>