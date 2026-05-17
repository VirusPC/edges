
#### error handling
```python
from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain.messages import ToolMessage


@wrap_tool_call
def handle_tool_errors(request, handler):
    """Handle tool execution errors with custom messages."""
    try:
        return handler(request)
    except Exception as e:
        # Return a custom error message to the model
        return ToolMessage(
            content=f"Tool error: Please check your input and try again. ({str(e)})",
            tool_call_id=request.tool_call["id"]
        )

agent = create_agent(
    model="gpt-5.4",
    tools=[search, get_weather],
    middleware=[handle_tool_errors]
)
```
The agent will return a [`ToolMessage`](https://reference.langchain.com/python/langchain-core/messages/tool/ToolMessage) with the custom error message when a tool fails:
```python
[
    ...
    ToolMessage(
        content="Tool error: Please check your input and try again. (division by zero)",
        tool_call_id="..."
    ),
    ...
]
```

后端服务里主流做法也是「统一错误处理中间件 + 局部必要时自己 try/except」这一套，而不是每个 handler 里都单独处理 HTTP 层面的错误