1. langchain 创建 agent 主要有2种
```python
agent = create_agent(
	model=model,
	tools=[fetch_text_from_url],
	system_prompt=SYSTEM_PROMPT,
	checkpointer=checkpointer,
)

deep_agent = create_deep_agent(
	model=model,
	tools=[fetch_text_from_url],
	system_prompt=SYSTEM_PROMPT,
	checkpointer=checkpointer,
)
```
1. 需要客户端管理 thread_id
```python
agent_result = agent.invoke(
	{"messages": [{"role": "user", "content": content}]},
	config={"configurable": {"thread_id": "great-gatsby-lc"}},
) 

deep_agent_result = deep_agent.invoke(
	{"messages": [{"role": "user", "content": content}]},
	config={"configurable": {"thread_id": "great-gatsby-da"}},
)
```
3. `result["messages"][-1].content` 是获取 agent 返回的**最后一条消息的文本内容** 。
4. `agent.invoke(messages)` 其实就是在修改State中的message list。
5. `response_format` 参数 + `ToolStrategy or Provider Strategy` 用于结构化输出
```python
from pydantic import BaseModel
from langchain.agents import create_agent

class ContactInfo(BaseModel):
    name: str
    email: str
    phone: str


# 1. ToolStragety
from langchain.agents.structured_output import ToolStrategy
agent = create_agent(
    model="gpt-5.4-mini",
    tools=[search_tool],
    response_format=ToolStrategy(ContactInfo)
)

# 2. ProviderStragety
from langchain.agents.structured_output import ProviderStrategy

agent = create_agent(
    model="gpt-5.4",
    response_format=ProviderStrategy(ContactInfo)
)

# 3. Auto. As of `langchain 1.0`, simply passing a schema (e.g., `response_format=ContactInfo`) will default to `ProviderStrategy` if the model supports native structured output. It will fall back to `ToolStrategy` otherwise.

agent = create_agent(
    model="gpt-5.4",
    response_format=ContactInfo
)


result = agent.invoke({
    "messages": [{"role": "user", "content": "Extract contact info from: John Doe, john@example.com, (555) 123-4567"}]
})

result["structured_response"]
# ContactInfo(name='John Doe', email='john@example.com', phone='(555) 123-4567')

```
3. Memory，支持 middleware 和 state_schema 两种方式

