InMemorySaver 和 InMemoryStore 最大的区别是：前者是「检查点 / 对话状态」的内存实现，用来做短期对话记忆（thread-level state）；后者是「键值存储」的内存实现，用来做长期知识 / 用户偏好等数据存储。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)

## 各自负责的功能

- InMemorySaver
    
    - 来自 `langgraph.checkpoint.memory`。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        
    - 用在 `StateGraph(...).compile(checkpointer=checkpointer)` 这里，负责把每一步执行后的 graph state（比如 MessagesState 里的 messages）按 `thread_id` 做持久化，用于多轮对话、time travel、get_state / get_state_history 等。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        
    - 典型示例就是文档里的短期记忆代码：在 `graph.invoke(..., {"configurable": {"thread_id": "1"}})` 下，它会把该 thread 的 message history 存在内存中，下次继续接着这个状态跑。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        
- InMemoryStore
    
    - 来自 `langgraph.store.memory`。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        
    - 用在 `StateGraph(...).compile(store=store)` 这里，提供一个「通用 KV / 文档存储」，可以按 namespace + key 存任何 JSON-like 数据，典型用于用户画像、长久知识库等长期记忆。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        
    - 你在 node 里通过 `Runtime` 拿到 `runtime.store`，调用 `search / asearch / put / aput`，可以做语义检索、写入新记忆等。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        

## 心智模型：短期 vs 长期

可以这样理解：[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)

- InMemorySaver =「每一步执行完，把整个对话 / graph state 的快照存下来」
    
    - 用途：
        
        - 多轮对话（messages 自动累加）
            
        - `get_state` / `get_state_history` 查看 thread 的历史
            
        - time travel / 回滚到某个 checkpoint
            
    - 实现：按 `thread_id`、`checkpoint_id` 存 state 快照和元数据。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        
- InMemoryStore =「一个通用的、跨会话的 KV / 文档 store」
    
    - 用途：
        
        - 用户 profile（偏好、历史行为）
            
        - domain 知识、记事本式记忆
            
        - 带 embeddings 的语义检索（通过 `index={"embed": embeddings, "dims": ...}`）。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
            
    - 实现：按 `(namespace, key)` 存 value，还可以加 embedding index 做 `search / asearch`。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
        

## 典型使用场景对比

|需求场景|用哪个|说明|
|---|---|---|

|需求场景|用哪个|说明|
|---|---|---|
|让对话在同一个 thread 里记住历史|InMemorySaver（作为 checkpointer）[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)|直接用 MessagesState + `thread_id`，state 自动被 checkpoint|
|想看 / 回放某个对话的历史状态|InMemorySaver|用 `graph.get_state` / `get_state_history`。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)|
|存「用户喜欢黑暗模式」这种长期偏好|InMemoryStore（作为 store）|通过 `runtime.store.put / aput` 写入，之后可检索。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)|
|做用户记忆的 semantic search|InMemoryStore + embeddings index|文档里的 `store = InMemoryStore(index={...})` 示例。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)|

## 怎么一起用（一个简单例子）

在生产中你几乎一定是：

- `checkpointer=PostgresSaver(...)` 或 InMemorySaver：管理短期对话 state。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
    
- `store=PostgresStore(...)` 或 InMemoryStore：管理长期知识 / 记忆 + semantic search。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
    

示意：

python

`checkpointer = InMemorySaver() store = InMemoryStore() builder = StateGraph(MessagesState, context_schema=Context) # ... add_node / add_edge graph = builder.compile(checkpointer=checkpointer, store=store)`

这样：

- 对话轮数、消息窗口管理走 checkpointer；
    
- 用户 profile、知识库、semantic search 走 store。[langchain](https://docs.langchain.com/oss/python/langgraph/add-memory)
    

你现在是在做哪种场景多一点：多轮 chat agent，还是带用户画像 / 知识库那种长期记忆 agent 呢？