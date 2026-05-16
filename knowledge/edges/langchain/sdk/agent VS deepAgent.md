Deep Agent 和 LangChain Agent 的核心区别是:**Deep Agent 内置了更多高级能力,而 LangChain Agent 需要你手动实现这些功能** 。[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)

## 主要区别

| 特性        | LangChain Agent | Deep Agent                                                                                                           |
| --------- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **规划能力**  | 需要自己实现          | 内置 `write_todos` 工具进行任务规划 [langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)   |
| **文件系统**  | 需要自己添加工具        | 内置 `grep`、`read_file` 等文件工具 [langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents) |
| **上下文管理** | 手动处理长文本         | 自动使用文件系统管理大量数据 [langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)              |
| **子代理**   | 需要自己实现          | 可以自动生成专门的子代理处理复杂子任务 [langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)         |
| **适用场景**  | 需要精细控制时         | 需要快速构建强大功能时 [langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)                 |

## 实际表现对比

在文档的测试案例中(分析《了不起的盖茨比》文本):[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)

**LangChain Agent 的结果**:

- 返回 `null` 作为答案
    
- 提示缺少代码执行环境和文本处理工具
    
- 无法准确统计行数和定位具体行号[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)
    

**Deep Agent 的结果**:

- 使用 `write_todos` 规划研究步骤
    
- 调用 `fetch_text_from_url` 下载文件
    
- 使用内置的 `grep` 和 `read_file` 工具处理大文本
    
- 必要时生成子代理处理复杂子任务
    
- 提供准确的统计结果[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)
    

## 代码对比

两者的创建方式几乎相同:[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)

```python
# LangChain Agent - 基础版本
from langchain.agents import create_agent

agent = create_agent(
    model=model,
    tools=[fetch_text_from_url],  # 只有你自己定义的工具
    system_prompt=SYSTEM_PROMPT,
    checkpointer=checkpointer,
)

# Deep Agent - 增强版本
from deepagents import create_deep_agent

deep_agent = create_deep_agent(
    model=model,
    tools=[fetch_text_from_url],  # 你的工具 + 内置工具
    system_prompt=SYSTEM_PROMPT,
    checkpointer=checkpointer,
)
```
## 何时选择哪个

**选择 LangChain Agent**:

- 需要完全控制 agent 的每个行为
    
- 项目需求简单,不需要复杂规划
    
- 想要最小化依赖和资源消耗[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)
    

**选择 Deep Agent**:

- 需要快速构建功能强大的 agent
    
- 任务涉及规划、文件处理、复杂推理
    
- 想要开箱即用的高级功能[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)
    

Deep Agent 本质上是 LangChain Agent 的**增强版**,预装了常用的企业级能力,让你可以更快地构建生产就绪的 agent 。[langchain](https://docs.langchain.com/oss/python/langchain/quickstart#langchain-agents)