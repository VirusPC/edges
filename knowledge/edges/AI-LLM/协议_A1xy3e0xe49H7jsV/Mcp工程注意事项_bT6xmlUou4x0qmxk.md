# Mcp 工程注意事项

1. Mcp Server主要提供3种资源，Resource，prompts和Resources
    1. Prompts为大模型提供 prompt模板
    2. Resouces 是「额外给予大模型的只读权限」，把 Tools 是「额外给予大模型的读写权限」。
2. Transport
    1. 本地单线程可以直接用stdio网络请求用 streamable http(sse废弃了）
3. Openai，等不同供应商tool的定义不太一样，注意格式转换
4. Client核心要做的事：创建mcpCilent和llm client。通过mcpClient来获取tool/prompts/resource描述列表传递给llm client，llm client选择tool后，通过mcp client调用对应操作。
5. 多server实践。保留多个tools，需要记录tool属于哪个mco client。
6. 



> 更新: 2025-07-10 01:36:19  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ptg2gmk45sry8zov>