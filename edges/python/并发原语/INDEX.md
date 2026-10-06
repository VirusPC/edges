对,前面表格只列了 Lock/Queue/Event,把 RLock/Semaphore/Condition/Barrier 都漏了。完整补上:
完整三套对照表



|原语              |`threading`          |`multiprocessing`|`asyncio`               |
|----------------|---------------------|-----------------|------------------------|
|Lock            |✅                    |✅                |✅                       |
|**RLock**       |✅                    |✅                |❌ **没有**                |
|Semaphore       |✅                    |✅                |✅                       |
|BoundedSemaphore|✅                    |✅                |✅(3.10+)                |
|Condition       |✅                    |✅                |✅                       |
|Event           |✅                    |✅                |✅                       |
|Barrier         |✅                    |✅                |✅(3.11+)                |
|Queue           |`queue.Queue`        |`mp.Queue`       |`asyncio.Queue`         |
|LifoQueue       |`queue.LifoQueue`    |❌                |`asyncio.LifoQueue`     |
|PriorityQueue   |`queue.PriorityQueue`|❌                |`asyncio.PriorityQueue` |
|Timer           |`threading.Timer`    |❌                |`loop.call_later`       |
|私有上下文           |`threading.local`    |(进程天然隔离)         |`contextvars.ContextVar`|

几个值得知道的不对称
1. asyncio 没有 RLock ⭐ 经典 gotcha
asyncio 故意不提供 RLock。理由:协程只在 await 处让出控制,同一协程不会被”并发地”重新调度进入临界区,没有真正的重入并发。真要表达”同一逻辑链能重入”语义,做法是:
	•	改设计,把锁粒度拆细;或者
	•	用 contextvars 记录”当前持有者”,在 acquire 前判断
面试被问”asyncio 缺什么”时主动提这点 = 真用过。
2. multiprocessing 没有 LifoQueue / PriorityQueue
跨进程的优先队列实现成本高(序列化 + 堆维护 + 原子性),官方没做。工程上要这种语义通常用外部中间件:Redis Sorted Set、RabbitMQ priority queue、Kafka 分区。
3. Semaphore vs BoundedSemaphore 的区别(常考)

sem = threading.Semaphore(3)
sem.release()  # ✅ 静悄悄变成 4,然后 5,然后 6 ... 计数无上限
              # 错配会让"最多 3 个"的约束失效

bsem = threading.BoundedSemaphore(3)
bsem.release()  # ❌ 超过初始值抛 ValueError


多数场景应该用 BoundedSemaphore,防止 acquire/release 配对错误悄无声息地破坏限流约束。threading.Semaphore 本质是个无上限计数器,只在你**确实需要”动态扩容信号量上限”**时才合适。
4. threading.local vs contextvars(高频追问)

# 旧式:线程私有
ctx = threading.local()
ctx.user_id = "u123"   # 只在当前线程可见

# 现代:协程/任务私有,且自动跨 await 传播
user_id = contextvars.ContextVar("user_id")
user_id.set("u123")    # 当前 Task 及其子 Task 都能读到


关键区别:asyncio.Task 创建时会拷贝当前 context,所以 trace_id、user_id、tenant_id 这种全链路追踪信息必须用 contextvars。用 threading.local 在 async 代码里会全部串味(多个协程共享一个线程,local 是该线程的而不是该任务的)。
5. Pipe / shared_memory / Manager 不在三套对照里
它们是进程独有概念——线程不需要(本来共享内存)、协程也不需要(本来同一线程内)。所以 multiprocessing 才有,threading 和 asyncio 都没对应物。这是单方向存在的工具,不是三套对应。
几个特别容易忽略的工具
补充几个不在原列表但同类的:
	•	threading.Timer:延迟执行,基于独立线程,适合简单定时任务。注意:每个 Timer 起一个线程,不要在循环里大量创建,该用调度器(APScheduler、loop.call_later)就别硬上。
	•	asyncio.TaskGroup(3.11+):不是同步原语,是结构化并发,但常被归到”并发协调”里。
	•	asyncio.timeout()(3.11+) 和 asyncio.wait_for():超时控制,threading 和 multiprocessing 没有干净的对应物——这也是 asyncio 在 agent runtime 里碾压线程的关键。

完整版的心法:三套不只是 Lock,而是一整套并发原语家族;但家族成员并不一一对应,asyncio 缺 RLock,multiprocessing 缺优先队列,threading.local 在 asyncio 里要换成 contextvars。这些不对称都是面试可被深挖的点。​​​​​​​​​​​​​​​​