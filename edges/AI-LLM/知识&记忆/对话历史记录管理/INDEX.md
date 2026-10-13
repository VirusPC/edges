# 对话历史记录管理

- [背景](#%E8%83%8C%E6%99%AF)
- [messages越来越长的问题？](#messages%E8%B6%8A%E6%9D%A5%E8%B6%8A%E9%95%BF%E7%9A%84%E9%97%AE%E9%A2%98)
  * [**1. 截断历史记录**](#1-%E6%88%AA%E6%96%AD%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95)
  * [2. 对早期对话进行总结](#2-%E5%AF%B9%E6%97%A9%E6%9C%9F%E5%AF%B9%E8%AF%9D%E8%BF%9B%E8%A1%8C%E6%80%BB%E7%BB%93)
  * [3. 仅保留关键对话](#3-%E4%BB%85%E4%BF%9D%E7%95%99%E5%85%B3%E9%94%AE%E5%AF%B9%E8%AF%9D)
  * [~~4. 使用外部存储维护历史~~](#4-%E4%BD%BF%E7%94%A8%E5%A4%96%E9%83%A8%E5%AD%98%E5%82%A8%E7%BB%B4%E6%8A%A4%E5%8E%86%E5%8F%B2)
  * [~~5. 使用模型的 ~~~~system~~~~ 消息定义背景~~](#5-%E4%BD%BF%E7%94%A8%E6%A8%A1%E5%9E%8B%E7%9A%84-system-%E6%B6%88%E6%81%AF%E5%AE%9A%E4%B9%89%E8%83%8C%E6%99%AF)
  * [**优化策略：控制 token 使用**](#%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5%E6%8E%A7%E5%88%B6-token-%E4%BD%BF%E7%94%A8)
    + [**1. 计算 token 数量**](#1-%E8%AE%A1%E7%AE%97-token-%E6%95%B0%E9%87%8F)
    + [**2. 优化消息内容**](#2-%E4%BC%98%E5%8C%96%E6%B6%88%E6%81%AF%E5%86%85%E5%AE%B9)

---

mem0: <https://www.yuque.com/pengcheng-fuigs/zpkvl7/mg7uv80udg0rpil8>

## 背景

openai提供的是无状态http接口。

需要自己来维护历史记录。

历史message通过messages参数，在下次执行prompt时传入。

## messages越来越长的问题？

随着对话轮数增加，传递的 messages 参数会越来越长，因为每次都需要包含完整的历史记录。开发者需要自行处理这种情况，确保 messages 不会超出模型的输入限制（通常是 token 数量限制）。

虽然 `messages` 会随着对话增加而变长，但通过以下方法可以有效控制其长度：

1. **截断历史记录**：保留最近几轮对话。
2. **总结早期内容**：压缩旧对话为摘要。
3. **筛选关键消息**：仅保留重要内容。
4. **外部存储**：将完整历史存储在数据库中，动态生成上下文。
5. **优化 token 使用**：计算 token 数量并提前处理。

这些方法可以确保对话历史不会超出模型的限制，同时维持良好的上下文关联。

### **1. 截断历史记录**

* 只保留最近的几轮对话。
* 在每次请求时，将旧的对话从 `messages` 中移除。

**示例代码**：

```python
MAX_MESSAGES = 20  # 保留最近 20 条消息

if len(messages) > MAX_MESSAGES:
    messages = messages[-MAX_MESSAGES:]  # 截断历史记录，保留最后 20 条
```

***

### 2. 对早期对话进行总结

* 将较早的对话内容压缩为一条简短的摘要，替换原始消息。
* 这种方法可以减少 `messages` 的长度，同时保留上下文信息。

**示例代码**：

```python
import openai

def count_tokens(messages, model="gpt-4"):
    import tiktoken
    encoding = tiktoken.encoding_for_model(model)
    return sum(len(encoding.encode(msg["content"])) for msg in messages)

def summarize_conversation(messages):
    summary_prompt = [
        {"role": "system", "content": "你是一个助手，负责总结对话内容。"},
        {"role": "user", "content": f"请总结以下对话内容：\n{messages}"}
    ]
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=summary_prompt
    )
    return response['choices'][0]['message']['content']

# 示例主流程
MAX_TOKEN_LIMIT = 8000
if count_tokens(messages) > MAX_TOKEN_LIMIT:
    summary = summarize_conversation(messages[:-10])  # 总结早期对话
    messages = [{"role": "system", "content": summary}] + messages[-10:]  # 更新历史记录
```

**示例总结内容**：

```json
{"role": "system", "content": "用户询问了天气、旅行建议和健康问题。"}
```

***

### 3. 仅保留关键对话

mem0可以根据当前query，提取出相关的记忆。

* 对于较长的对话，可以筛选出关键消息（例如用户的主要问题和模型的重要回复），忽略无关内容。
* 这种方法适合对话中有明确主题的场景。

**示例代码**：

```python
# 筛选出关键消息
messages = [msg for msg in messages if is_important(msg)]
```

***

### ~~4. 使用外部存储维护历史~~

* \~~将完整的对话历史存储在数据库或文件中，而不是每次都传递给 API。~~
* \~~在需要时，将历史记录动态加载并生成摘要或上下文。~~

\~~**示例流程**~~~~：~~

1. \~~用户发送消息。~~
2. \~~在数据库中记录完整的历史。~~
3. \~~根据需要生成上下文摘要，并通过 ~~<code>~~messages~~</code>~~ 参数传递给 API。~~

***

### ~~5. 使用模型的 ~~<code>~~system~~</code>~~ 消息定义背景~~

* \~~在 ~~<code>~~messages~~</code>~~ 中的 ~~<code>~~system~~</code>~~ 消息中定义更详细的背景，减少对话历史的依赖。~~
* \~~例如：将早期的对话总结后放入 ~~<code>~~system~~</code>~~ 消息。~~

\~~**示例代码**~~~~：~~

```python
messages = [
    {"role": "system", "content": "用户之前提到他想了解天气和旅行建议。"},
    {"role": "user", "content": "告诉我今天的天气。"}
]
```

***

### **优化策略：控制 token 使用**

#### **1. 计算 token 数量**

* 使用 OpenAI 的 `tiktoken` 库计算 `messages` 的 token 数量，确保不会超过限制。
* 如果超出限制，可以提前截断或总结内容。

**示例代码**：

```python
import tiktoken

def count_tokens(messages, model="gpt-4"):
    encoding = tiktoken.encoding_for_model(model)
    total_tokens = sum(len(encoding.encode(msg["content"])) for msg in messages)
    return total_tokens

# 检查 token 数量
if count_tokens(messages) > 8000:  # 假设 GPT-4 的限制为 8k tokens
    messages = messages[-MAX_MESSAGES:]  # 截断历史记录
```

***

#### **2. 优化消息内容**

* 避免冗长的对话内容，尽量简洁地表达问题和回复。
* 在生成回复时，可以提示模型使用更简短的语言。


> 更新: 2025-09-22 09:52:01  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ybvmbtwvloc1vfyg>