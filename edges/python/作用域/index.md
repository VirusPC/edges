python中if-else 不创建新的作用域：

```python
@wrap_model_call
def dynamic_model_selection(request: ModelRequest, handler) -> ModelResponse:
    """Choose model based on conversation complexity."""
    message_count = len(request.state["messages"])
    
    if message_count > 10:
        # 在 if 块内定义 model
        model = advanced_model
    else:
        # 在 else 块内定义 model
        model = basic_model
    
    # ✅ 可以访问 if/else 内的 model 变量
    return handler(request.override(model=model))
```