你说的是这里这段吧：

python

`try:     asyncio.get_running_loop()    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:        return pool.submit(asyncio.run, _run()).result() except RuntimeError:     return asyncio.run(_run())`

而不是简单写成外面一行 `asyncio.run(_run())`。原因主要是 **兼容“已有事件循环”的环境**，比如 Jupyter、某些框架/REPL 里已经有 event loop 在跑了。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

## 1. asyncio.run 的限制

- `asyncio.run(coro)` 要求当前线程里 **没有正在运行的事件循环**，否则会抛 `RuntimeError: asyncio.run() cannot be called from a running event loop`。
    
- 在普通命令行脚本里这么写没问题：`if __name__ == "__main__": asyncio.run(_run())`；但在 notebook、某些集成环境、或者被别的 async 代码调用时，就会撞上“已经有 loop 在跑”的情况。
    

## 2. 这段代码在做什么

python

`try:     asyncio.get_running_loop()    # 如果能拿到 running loop，说明当前线程已经在一个事件循环里    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:        # 在单独线程里调用 asyncio.run(_run())        return pool.submit(asyncio.run, _run()).result() except RuntimeError:     # 如果 get_running_loop 抛 RuntimeError，说明当前线程没有 loop，    # 就可以直接在当前线程里 asyncio.run(_run())    return asyncio.run(_run())`

- `asyncio.get_running_loop()`：
    
    - 成功 ⇒ 当前线程已经有一个 event loop 在跑。
        
    - 抛 `RuntimeError` ⇒ 当前线程没有 event loop。
        
- 有 loop 时：开一个单独线程（`ThreadPoolExecutor`），在线程里面安全地 `asyncio.run(_run())`，绕过“当前线程 loop 已经在跑”的限制。
    
- 没 loop 时：直接在当前线程 `asyncio.run(_run())`，最简单。
    

这样写的好处是：

- 在“正常脚本”环境下行为和直接写 `asyncio.run(_run())` 完全一样。
    
- 在 notebook / 已有 event loop 环境下也能工作，不会因为 `asyncio.run` 的限制直接炸掉。
    

## 3. 要记住的“考点模式”

对于“同步函数里封装一个 async 实现、又要兼容各种运行环境”，这段是一个可以硬记的模式：

python

`def sync_wrapper(...):     async def _run():        ...     try:        asyncio.get_running_loop()    except RuntimeError:        # 当前线程没 loop        return asyncio.run(_run())     # 当前线程已有 loop，用子线程跑    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:        return pool.submit(asyncio.run, _run()).result()`

以后你在自己的 SDK / 工具函数里想提供一个“同步 API + 内部 async 实现”，并且希望 notebook / REPL 不踩坑，就可以直接套这个模板。

你现在更倾向的风格是：统一用 async API 让上层自己管 event loop，还是像这里这样提供一个“同步包装”，方便脚本和 CLI 直接调用？