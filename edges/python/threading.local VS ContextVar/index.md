
---

### 1. `contextvars.ContextVar` — 协程隔离

`asyncio.create_task()` 内部调用 `copy_context()` 给每个 Task 一份快照，协程间互不污染。

```python
import asyncio, contextvars

request_id = contextvars.ContextVar('request_id', default=None)

async def handler(rid):
    request_id.set(rid)
    await asyncio.sleep(0.1)          # 让出控制权
    print(request_id.get())           # 仍是自己的值

asyncio.run(asyncio.gather(handler("req-A"), handler("req-B")))
# req-A
# req-B
```

---

### 2. `contextvars` 模块三件套

```python
import contextvars

# ContextVar：存值，set 返回 Token 可回滚
var = contextvars.ContextVar('x', default=None)
token = var.set(42)
var.get()          # 42
var.reset(token)   # 回滚
var.get()          # None

# copy_context()：拍快照
ctx = contextvars.copy_context()

# Context.run()：在快照内隔离执行，修改不泄漏到外部
def fn():
    var.set(99)
    print(var.get())  # 99

ctx.run(fn)
print(var.get())      # None，外部不受影响

# Context 也可以当 dict 用
for v, val in ctx.items():
    print(v.name, val)
```

---

### 3. 进程隔离 — OS 虚拟内存

OS 层 MMU 强制隔离，每个进程有独立虚拟地址空间，`fork()` 用 Copy-on-Write 复制父进程内存。

```python
from multiprocessing import Process

x = 42

def worker():
    global x
    x = 99
    print(f"子进程: {x}")   # 99

p = Process(target=worker)
p.start(); p.join()
print(f"父进程: {x}")       # 42，父进程不受影响
```

进程间通信必须显式 IPC（Pipe、Queue、共享内存等）。

---

### 4. `threading.local` — 线程隔离，不支持协程

```python
import threading

local = threading.local()

def worker(name):
    local.request_id = name
    print(local.request_id)

threading.Thread(target=worker, args=("req-A",)).start()
threading.Thread(target=worker, args=("req-B",)).start()
```

没有默认值，新线程访问未赋值属性会 `AttributeError`，用继承解决：

```python
class MyLocal(threading.local):
    def __init__(self):
        self.request_id = None   # 每个新线程自动初始化
```

---

### 5. 三种隔离横向对比

||进程|线程|协程|
|---|---|---|---|
|隔离层|OS MMU 硬件|CPU 寄存器 + 栈，堆共享|Python 运行时快照|
|强度|最强，无法绕过|中，靠程序员自律|弱，同线程内软隔离|
|工具|`multiprocessing`|`threading.local`|`ContextVar`|
|默认值|—|❌ 需继承|✅ `default=` 参数|
|回滚|—|❌|✅ `reset(token)`|
|隔离快照|—|❌|✅ `copy_context().run()`|
|协程安全|✅|❌|✅|

**一句话记忆**：`ContextVar` = `threading.local` 的协程增强版；进程隔离是 OS 兜底，不需要也无法绕过。