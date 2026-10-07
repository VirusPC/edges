# 开socks代理时，httpx[socks] 问题

- [解决方法](#%E8%A7%A3%E5%86%B3%E6%96%B9%E6%B3%95)
- [为什么会发生这种情况？](#%E4%B8%BA%E4%BB%80%E4%B9%88%E4%BC%9A%E5%8F%91%E7%94%9F%E8%BF%99%E7%A7%8D%E6%83%85%E5%86%B5)
- [如果还是不行（备选方案）](#%E5%A6%82%E6%9E%9C%E8%BF%98%E6%98%AF%E4%B8%8D%E8%A1%8C%E5%A4%87%E9%80%89%E6%96%B9%E6%A1%88)

---

执行时假如出现如下的报错：

```typescript
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/langchain_ollama/chat_models.py", line 45, in <module>
    from ollama import AsyncClient, Client, Message
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/ollama/__init__.py", line 44, in <module>
    _client = Client()
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/ollama/_client.py", line 125, in __init__
    super().__init__(httpx.Client, host, **kwargs)
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/ollama/_client.py", line 111, in __init__
    self._client = client(
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/httpx/_client.py", line 697, in __init__
    self._mounts: dict[URLPattern, BaseTransport | None] = {
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/httpx/_client.py", line 700, in <dictcomp>
    else self._init_proxy_transport(
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/httpx/_client.py", line 750, in _init_proxy_transport
    return HTTPTransport(
  File "/Users/chengpeng/Documents/ai/langchain-test/.venv/lib/python3.9/site-packages/httpx/_transports/default.py", line 191, in __init__
    raise ImportError(
ImportError: Using SOCKS proxy, but the 'socksio' package is not installed. Make sure to install httpx using `pip install httpx[socks]`.
```

这个报错是一个非常经典的环境配置“小坑”。

**问题核心：**\
你的电脑系统环境（或者终端）设置了 **SOCKS 代理**（可能是为了科学上网），而 `ollama` 库依赖的 `httpx` 在发起请求时检测到了代理设置。由于 `httpx` 默认不包含 SOCKS 支持，所以它提示你缺少 `socksio` 库。

既然你正在使用 **uv**，解决这个问题非常简单，不需要按照报错提示去用 `pip`。

***

## 解决方法

在你的项目目录下执行以下命令，让 `uv` 把缺少的依赖补全：

```bash
uv add "httpx[socks]"

```

或者直接安装 `socksio`：

```bash
uv add socksio

```

执行完毕后，再次运行 `uv run main.py` 应该就能正常工作了。

***

## 为什么会发生这种情况？

1. **环境变量：** 你的终端很可能设置了类似 `ALL_PROXY=socks5://127.0.0.1:xxxx` 的环境变量。
2. **库的依赖：** LangChain 调用 Ollama 时，底层是通过 `httpx` 发送 HTTP 请求的。
3. **静默失败：** `httpx` 发现有代理，尝试去加载处理 SOCKS 的模块，发现没装，于是抛出了这个 `ImportError`。

***

## 如果还是不行（备选方案）

如果你不想安装额外的库，也可以在运行脚本时临时**屏蔽掉代理**（因为 Ollama 是跑在你本地 `127.0.0.1` 的，其实不需要走代理）：

```bash
# 在运行命令前加上代理置空
export all_proxy= && export ALL_PROXY= && uv run main.py

```

**小建议：**\
对于本地 AI 开发，我建议在 `.zshrc` 或 `.bash_profile` 中将 `127.0.0.1` 和 `localhost` 加入 `no_proxy` 列表，这样可以避免以后很多类似的麻烦：

```bash
export no_proxy="localhost,127.0.0.1,localaddress,.localdomain.com"

```

解决这个报错后，你的第一个 LangChain 打印出结果了吗？如果有其他关于模型连接的问题，随时告诉我。


> 更新: 2026-02-14 08:26:43  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ts5avn7dwmwxyzwm>