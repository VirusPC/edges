`contextvars.ContextVar` 是**跨协程（per-coroutine）** 隔离的，准确说是 **per-execution-context**。

## 三个维度的行为

|维度|行为|说明|
|---|---|---|
|**进程**|❌ 不共享|不同进程各自独立，天然隔离|
|**线程**|✅ 隔离|每个线程有自己的 Context，互不干扰|
|**协程**|✅ 隔离（关键！）|`asyncio` 的每个 Task 有独立的 Context 副本|

## 核心机制

Python 3.7 引入了 `contextvars`，解决的正是 `threading.local` 无法解决的协程隔离问题。

```python
import asyncio
import contextvars

request_id = contextvars.ContextVar('request_id', default=None)

async def handler(rid):
    request_id.set(rid)
    await asyncio.sleep(0.1)  # 让出控制权
    print(f"request_id = {request_id.get()}")  # 仍然是自己的值

async def main():
    await asyncio.gather(
        handler("req-A"),
        handler("req-B"),
    )
# 输出:
# request_id = req-A
# request_id = req-B
# 两个协程不会互相污染
```

如果用 `threading.local` 替代，因为两个协程跑在同一个线程上，`set` 会互相覆盖。

## asyncio Task 的隔离原理

```
main context
    │
    ├── Task A  → 创建时 copy_context() 快照
    │              └── ContextVar['request_id'] = "req-A"
    │
    └── Task B  → 创建时 copy_context() 快照
                   └── ContextVar['request_id'] = "req-B"
```

`asyncio.create_task()` 内部调用 `contextvars.copy_context()`，每个 Task 拿到的是**父 context 的浅拷贝**，之后各自修改互不影响。

## 与 `threading.local` 的对比

||`threading.local`|`ContextVar`|
|---|---|---|
|线程隔离|✅|✅|
|协程隔离|❌（同线程共享）|✅|
|父子传播|❌|✅（子 Task 继承父 context 快照）|
|手动传递|需要|不需要|

## 典型应用场景

- **FastAPI / Starlette** — 每个请求的 `request` 对象注入
- **SQLAlchemy async session** — 每个协程独立的数据库 session
- **链路追踪** — trace_id 在整个调用链中自动传播，不用显式传参
- **Celery worker** — 任务上下文隔离

简单记忆：**`ContextVar` = `threading.local` 的协程增强版**。