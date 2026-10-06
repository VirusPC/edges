

## LangChain 已有的优化

## 1. Anthropic Prompt Caching 中间件

LangChain 提供了专门的 Anthropic prompt caching 中间件:[reference.langchain](https://reference.langchain.com/javascript/langchain/index/anthropicPromptCachingMiddleware)

```python
from langchain_anthropic import ChatAnthropic
from langchain_anthropic.middleware import AnthropicPromptCachingMiddleware
from langchain.agents import create_agent
from langchain.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import MemorySaver

LONG_PROMPT = """
Please be a helpful assistant.
<Lots more context ...>
"""

agent = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-6"),
    system_prompt=LONG_PROMPT,
    middleware=[AnthropicPromptCachingMiddleware(ttl="5m")],  # 或 "1h"
    checkpointer=MemorySaver(),  # 保持对话历史
)

# 使用 thread_id 维护会话状态
config: RunnableConfig = {"configurable": {"thread_id": "user-123"}}

# 第一次调用: 创建缓存(system prompt + tools + 消息)
agent.invoke({"messages": [HumanMessage("Hi, my name is Bob")]}, config=config)

# 第二次调用: 复用缓存的 system prompt、tools 和历史消息
result = agent.invoke({"messages": [HumanMessage("What's my name?")]}, config=config)
print(result["messages"][-1].content)
```

Python 版本会自动在以下位置添加 `cache_control` breakpoints:

|缓存内容|说明|
|---|---|
|**System message**|标记系统消息的最后一个内容块,缓存静态系统 prompt [reference.langchain](https://reference.langchain.com/python/langchain-anthropic/middleware/prompt_caching/AnthropicPromptCachingMiddleware)|
|**Tools**|标记所有工具定义,在多轮对话中复用工具 schema [reference.langchain](https://reference.langchain.com/python/langchain-anthropic/middleware/prompt_caching/AnthropicPromptCachingMiddleware)|
|**Last cacheable block**|标记消息序列的最后可缓存块(对话历史) [reference.langchain](https://reference.langchain.com/python/langchain-anthropic/middleware/prompt_caching/AnthropicPromptCachingMiddleware)|

## 2. Node-level Caching (LangGraph)

LangGraph 提供节点级缓存,避免重复计算:[changelog.langchain](https://changelog.langchain.com/announcements/node-level-caching-in-langgraph)

```python
from langgraph.checkpoint import MemorySaver

def cache_key_func(input_data):
    """自定义 cache key 生成逻辑"""
    return hash(input_data["messages"][-1]["content"])

graph = graph_builder.compile(
    cache={
        "node_name": {
            "key_func": cache_key_func,
            "ttl": 3600  # 1 小时
        }
    }
)
```

**特性**:

- 基于节点输入的缓存[changelog.langchain](https://changelog.langchain.com/announcements/node-level-caching-in-langgraph)
    
- 自定义 cache key 生成函数[changelog.langchain](https://changelog.langchain.com/announcements/node-level-caching-in-langgraph)
    
- TTL 控制过期时间[changelog.langchain](https://changelog.langchain.com/announcements/node-level-caching-in-langgraph)
    

## 3. LLM 响应缓存 (应用层)

LangChain 提供应用层 LLM 缓存机制:[youtube](https://www.youtube.com/watch?v=Uk_SJSnQRU8)[ibm](https://www.ibm.com/think/tutorials/implement-prompt-caching-langchain)

```python
from langchain.cache import SQLiteCache
import langchain

# 设置 SQLite 缓存
langchain.llm_cache = SQLiteCache(database_path=".langchain.db")

# 相同 prompt 会直接从缓存返回,不调用 API
response = llm.invoke("What is AI?")
```

**优势**:

- 节省 API 调用成本[youtube](https://www.youtube.com/watch?v=Uk_SJSnQRU8)
    
- 加速应用响应[youtube](https://www.youtube.com/watch?v=Uk_SJSnQRU8)
    
- 支持多种后端: SQLite, Redis, 内存[ibm](https://www.ibm.com/think/tutorials/implement-prompt-caching-langchain)

## 4. System Message 缓存

```python
from langchain.agents import create_agent
from langchain.messages import SystemMessage, HumanMessage

literary_agent = create_agent(
    model="google_genai:gemini-3.1-pro-preview",
    system_prompt=SystemMessage(
        content=[
            {
                "type": "text",
                "text": "You are an AI assistant tasked with analyzing literary works.",
            },
            {
                "type": "text",
                "text": "<the entire contents of 'Pride and Prejudice'>",
                "cache_control": {"type": "ephemeral"}
            }
        ]
    )
)

result = literary_agent.invoke(
    {"messages": [HumanMessage("Analyze the major themes in 'Pride and Prejudice'.")]}
)
```
## 5. 可能破坏 promp chaching 的 Dynamic System Prompt

```python
from typing import TypedDict

from langchain.agents import create_agent
from langchain.agents.middleware import dynamic_prompt, ModelRequest


class Context(TypedDict):
    user_role: str

@dynamic_prompt
def user_role_prompt(request: ModelRequest) -> str:
    """Generate system prompt based on user role."""
    user_role = request.runtime.context.get("user_role", "user")
    base_prompt = "You are a helpful assistant."

    if user_role == "expert":
        return f"{base_prompt} Provide detailed technical responses."
    elif user_role == "beginner":
        return f"{base_prompt} Explain concepts simply and avoid jargon."

    return base_prompt

agent = create_agent(
    model="gpt-5.4",
    tools=[web_search],
    middleware=[user_role_prompt],
    context_schema=Context
)

# The system prompt will be set dynamically based on context
result = agent.invoke(
    {"messages": [{"role": "user", "content": "Explain machine learning"}]},
    context={"user_role": "expert"}
)
```

## LangChain **没有**针对 KV Cache 的优化

**关键问题**: LangChain 的文档 中**没有提到**关于动态工具过滤对 prompt caching 影响的任何说明或优化建议。[langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)

## 缺失的优化

1. **没有工具定义稳定性建议**[langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)
    
    - 文档展示动态工具过滤,但不警告 cache 影响
        
    - 没有"稳定工具集 + 延迟加载"的最佳实践
        
2. **没有 prompt 结构指导**[langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)
    
    - 不建议将工具定义放在 prompt 前缀
        
    - 不提供 cache-friendly 的 prompt 组织方式
        
3. **没有工具序列化顺序保证**[langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)
    
    - 动态工具列表可能因 JSON 序列化顺序不同而破坏 cache
        

## 社区的优化方案

Reddit 上有开发者自己实现了 **sliding window cache strategy**:[reddit](https://www.reddit.com/r/ClaudeAI/comments/1l1njjy/how_to_do_better_prompt_cache_with_langchain/)

```python
# 社区自建的优化策略
class SlidingWindowCacheStrategy:
    """
    - 自动监控 cacheable blocks
    - 跨 agents 复用 cacheable blocks
    - 自动循环 cacheable blocks
    - 内置过期管理
    - 自动删除过期 blocks
    """
    pass

# 潜在成本削减: 90%
```

## LangChain 的优化重点

LangChain 的缓存优化主要在 **应用层**:[ibm](https://www.ibm.com/think/tutorials/implement-prompt-caching-langchain)[youtube](https://www.youtube.com/watch?v=Uk_SJSnQRU8)

|优化层级|LangChain 支持|说明|
|---|---|---|
|**应用层缓存**|✅ 完整支持|SQLite/Redis cache 缓存 LLM 响应 [ibm](https://www.ibm.com/think/tutorials/implement-prompt-caching-langchain)|
|**节点级缓存**|✅ LangGraph 支持|避免重复计算 [changelog.langchain](https://changelog.langchain.com/announcements/node-level-caching-in-langgraph)|
|**Prompt Caching**|⚠️ 部分支持|仅 Anthropic 中间件 [reference.langchain](https://reference.langchain.com/javascript/langchain/index/anthropicPromptCachingMiddleware)|
|**KV Cache 优化**|❌ 无专门支持|没有工具定义稳定性指导 [langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)|
|**Cache-aware 工具管理**|❌ 无|没有延迟加载或工具排序策略 [langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)|

## 对比其他框架

**NVIDIA Dynamo** 有 KV cache routing 优化:[reference.langchain](https://reference.langchain.com/python/langchain-nvidia-ai-endpoints/chat_models_dynamo)

```python
from langchain_nvidia_ai_endpoints import ChatNVIDIA

# 自动注入 nvext.agent_hints 优化 KV cache routing
model = ChatNVIDIA(model="...")
```

## 总结

LangChain 的优化策略:

**有优化的部分**:reference.langchain+1

- ✅ Anthropic prompt caching 中间件
    
- ✅ LangGraph 节点级缓存
    
- ✅ 应用层 LLM 响应缓存
    

**缺失的部分**:[langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)

- ❌ 动态工具对 prompt cache 影响的文档说明
    
- ❌ Cache-friendly 的工具管理最佳实践
    
- ❌ 工具定义稳定性优化建议
    
- ❌ Prompt 结构优化指导
    

**实际建议**:  
如果你关注 prompt caching 和 KV cache 性能,需要**自己实现**优化策略:agentpatterns+1

- 保持工具列表稳定
    
- 使用 Anthropic 中间件(如果用 Claude)
    
- 参考社区的 sliding window 策略
    
- 避免频繁改变工具定义
    

LangChain 更关注**功能灵活性**而非底层 cache 优化 。[langchain](https://docs.langchain.com/oss/python/langchain/agents#runtime-tool-registration)