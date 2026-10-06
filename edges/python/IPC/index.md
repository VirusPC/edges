好,把注释重做一遍,只标为什么和坑点,不写”这是个变量”这种废话。
1. Pipe

from multiprocessing import Process, Pipe

def worker(conn):
    # send 会 pickle 对象,大对象很慢——大数据走 shared_memory
    conn.send({"msg": "hello", "data": [1, 2, 3]})
    # recv 是阻塞的,直到对端 send;对端 close 后会抛 EOFError
    print("worker recv:", conn.recv())
    conn.close()

if __name__ == "__main__":
    # 默认 duplex=True,双向;duplex=False 返回 (read_end, write_end)
    parent_conn, child_conn = Pipe()

    # fork 后两端在父子进程都存在,约定每端只用各自那个
    # 父进程不会用到 child_conn,但不显式 close 也没事(进程退出会清理)
    p = Process(target=worker, args=(child_conn,))
    p.start()

    print("parent recv:", parent_conn.recv())
    parent_conn.send("ack")
    p.join()


2. Queue

from multiprocessing import Process, Queue

def consumer(q, worker_id):
    while True:
        item = q.get()  # 阻塞;非阻塞用 get(timeout=N) 抛 queue.Empty

        # Queue 没有内建的"流结束"信号 → 用 poison pill 通知退出
        if item is None:
            break
        print(f"[{worker_id}] processing {item}")

if __name__ == "__main__":
    # maxsize 是关键的背压机制:满了 put 会阻塞
    # 不设上限的话,慢消费会让生产者把内存打爆
    q = Queue(maxsize=100)

    workers = [Process(target=consumer, args=(q, i)) for i in range(3)]
    for w in workers: w.start()

    for i in range(10):
        q.put(i)

    # ⚠️ 每个 worker 都要收到一个 None,因为是一对一消费不是广播
    # 少一个 None 就有 worker 永远卡在 q.get()
    for _ in workers:
        q.put(None)

    for w in workers: w.join()


3. shared_memory

import numpy as np
from multiprocessing import Process
from multiprocessing.shared_memory import SharedMemory

def worker(shm_name, shape, dtype):
    # ⚠️ 不能直接把 SharedMemory 对象传过来,必须传 name(字符串)
    # 子进程通过 name 在 OS 层面 attach 到同一块物理内存
    # shape / dtype 是构造 numpy 视图必需的元信息,SharedMemory 自身只是裸字节
    shm = SharedMemory(name=shm_name)

    # 在共享内存的 buffer 上建 numpy 视图——零拷贝的关键就是这一步
    arr = np.ndarray(shape, dtype=dtype, buffer=shm.buf)

    arr *= 2  # 原地修改,父进程立即可见,无需任何同步调用

    shm.close()  # 仅解除本进程的映射,底层共享内存依然存在

if __name__ == "__main__":
    data = np.arange(1_000_000, dtype=np.float64)

    # create=True 创建一块新共享内存,size 是字节数
    shm = SharedMemory(create=True, size=data.nbytes)

    # 拷贝一次把数据装进共享内存(data 本身在普通进程内存里)
    # 这次拷贝避不开,但之后跨进程访问就零拷贝了
    shared = np.ndarray(data.shape, dtype=data.dtype, buffer=shm.buf)
    shared[:] = data

    # 跨进程只传 name + 元信息,几十字节——这才是"零拷贝"的核心
    p = Process(target=worker, args=(shm.name, data.shape, data.dtype))
    p.start(); p.join()

    print(shared[:5])  # [0. 2. 4. 6. 8.] —— 子进程改的,父进程立即看到

    shm.close()   # 解除映射
    shm.unlink()  # ⚠️ 必须显式销毁,否则常驻 /dev/shm 内存泄漏
                  # close 和 unlink 的区别是新手最容易踩的坑


4. Value / Array

from multiprocessing import Process, Value, Array

def worker(counter, arr):
    # ⚠️ counter.value += 1 不是原子的(读-改-写三步)
    # 多进程并发不加锁会丢更新——典型面试题
    with counter.get_lock():
        counter.value += 1

    arr[0] = 99  # 单元素赋值在 CPython 层面是原子的,不用锁

if __name__ == "__main__":
    # 类型码同 array 模块:'i' int, 'd' double, 'f' float, 'b' byte
    counter = Value('i', 0)
    arr = Array('d', [1.0, 2.0, 3.0])

    procs = [Process(target=worker, args=(counter, arr)) for _ in range(10)]
    for p in procs: p.start()
    for p in procs: p.join()

    print(counter.value)   # 10 —— 如果不加锁可能小于 10
    print(list(arr))       # [99.0, 2.0, 3.0]


5. Manager

from multiprocessing import Process, Manager

def worker(shared_dict, shared_list, idx):
    # ⚠️ 这里的每个 [] 操作和 append 都是一次跨进程 RPC + pickle 往返
    # 看起来像本地字典,实际开销是本地字典的 1000 倍以上
    shared_dict[idx] = idx * idx
    shared_list.append(idx)

if __name__ == "__main__":
    # Manager() 启动一个后台 server 进程持有真实对象
    # 各 worker 通过代理对象走 socket RPC 操作它
    with Manager() as mgr:  # 用 with 保证 server 进程被清理
        d = mgr.dict()
        lst = mgr.list()

        procs = [Process(target=worker, args=(d, lst, i)) for i in range(5)]
        for p in procs: p.start()
        for p in procs: p.join()

        # dict(d) 是把代理对象的内容拉一遍回本地,这一步也是 RPC
        print(dict(d))    # {0:0, 1:1, 2:4, 3:9, 4:16}
        print(list(lst))  # 顺序不定(并发 append)


6. connection.Listener/Client

# server.py
from multiprocessing.connection import Listener

# authkey 必须两端一致,防止外部进程随意连接
# 地址可以是 ('host', port) TCP,或 '/tmp/x.sock' Unix domain(更快)
with Listener(('localhost', 6000), authkey=b'secret') as listener:
    with listener.accept() as conn:  # 阻塞等连接
        while True:
            msg = conn.recv()
            if msg == 'close':
                break
            conn.send(f"echo: {msg}")

# client.py
from multiprocessing.connection import Client

# authkey 不匹配会抛 AuthenticationError
with Client(('localhost', 6000), authkey=b'secret') as conn:
    conn.send("hello")
    print(conn.recv())    # "echo: hello"
    conn.send("close")


7. Signal

import signal, os, time

def handle_sigusr1(signum, frame):
    # ⚠️ Signal handler 在异步上下文执行,不可重入
    # 只做最小工作:置 flag、写 self-pipe、简单 print
    # 不要在这里调用复杂函数、申请锁、做 I/O,可能死锁或丢信号
    print(f"[{os.getpid()}] got SIGUSR1, reloading config...")

def handle_sigterm(signum, frame):
    print(f"[{os.getpid()}] graceful shutdown")
    raise SystemExit(0)   # 抛 SystemExit 是优雅退出的标准做法

if __name__ == "__main__":
    # 注册必须在主线程,而且只能在主线程处理信号
    signal.signal(signal.SIGUSR1, handle_sigusr1)
    signal.signal(signal.SIGTERM, handle_sigterm)

    print(f"pid={os.getpid()}, try: kill -USR1 {os.getpid()}")
    while True:
        time.sleep(1)  # ⚠️ 信号会打断 sleep 让其提前返回,这是预期行为


8. ProcessPoolExecutor

from concurrent.futures import ProcessPoolExecutor, as_completed

# ⚠️ 必须 module 顶层定义,不能是 lambda / 嵌套函数 / 类的实例方法
# 否则 pickle 失败,worker 拿不到函数
def compute(x):
    return x * x

if __name__ == "__main__":
    # max_workers 默认 = CPU 核数;CPU 密集设为核数,I/O 密集可以更多
    with ProcessPoolExecutor(max_workers=4) as ex:
        # map: 保序返回,适合"批量算+按顺序收"
        results = list(ex.map(compute, range(10)))
        print(results)

        # submit + as_completed: 谁先完成谁先返回,适合长尾任务
        futures = [ex.submit(compute, i) for i in range(10)]
        for f in as_completed(futures):
            # f.result() 会重新抛出 worker 里的异常,千万别忘
            print(f.result())
    # with 退出时自动 shutdown,等所有 worker 干完


9. 同步原语

from multiprocessing import Lock, Semaphore, Event, Barrier

lock = Lock()                  # 互斥锁:任意时刻最多 1 个进程持有
sem = Semaphore(3)             # 信号量:任意时刻最多 N 个进程持有(限流)
event = Event()                # 一次性开关:wait 阻塞,set 后全部放行
barrier = Barrier(parties=4)   # 集合点:凑齐 N 个进程才一起放行

# 用法
with lock:
    pass  # 临界区,自动 acquire / release(异常也会释放)

with sem:
    pass  # 并发上限 3 的资源(连接池、外部 API 限流)

# Event 适合"等初始化完成"这种一次性同步
event.wait()    # 阻塞直到别的进程调 event.set()
event.set()     # 唤醒所有 wait,且后续 wait 立即通过

# Barrier 适合"分阶段并行计算":阶段间所有进程必须对齐
barrier.wait()  # 凑齐 parties 个进程才一起返回


10. sub-interpreters(3.13 实验 / 3.14+ stdlib)

from concurrent import interpreters

interp = interpreters.create()  # 创建新的解释器,有独立 GIL

# 跨解释器通信用 Queue,因为各自有独立的对象空间
q = interpreters.create_queue()

# prepare_main:把对象注入到子解释器的 __main__ 命名空间
# ⚠️ 不是所有对象都能跨解释器共享,只有可共享的(int/str/bytes/Queue 等)
interp.prepare_main(q=q)

interp.exec("""
import os
print(f"sub-interpreter, pid={os.getpid()}")  # pid 相同,但 GIL 独立
q.put('hello from sub-interp')
""")

print(q.get())  # 'hello from sub-interp'


注释密度大概就是这个程度,把”为什么这样写、不这样写会怎么死”都点到。要哪个再深挖?或者想要我把这些打包成一个可运行的 .py 文件?​​​​​​​​​​​​​​​​