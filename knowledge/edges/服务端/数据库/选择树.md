# 选择树

好，这里给你一个可以直接放进 edges / 设计文档里的「选择树（Decision Tree）」。  
不是科普版，是工程决策版，每一个分叉都对应真实 trade-off。

⸻

数据存储选择树（localStorage / IndexedDB / SQLite / MySQL）

目标：在“不过度设计”的前提下，选到长期 ROI 最大的方案

⸻

Step 0：这是前端 / 本地 / 服务端？

你的代码主要运行在哪里？

A. 浏览器里（Web / 插件 UI）

→ 进入 Step 1

B. 本地进程（IDE / CLI / 桌面应用 / Agent）

→ 进入 Step 2

C. 后端服务（多用户 / 网络访问）

→ 直接 MySQL

不纠结，别浪费脑力

⸻

Step 1：浏览器场景（Web / 插件 UI）

这些数据「错了 / 丢了」会不会影响系统判断或行为？

❌ 不会（只是 UI / 配置）

→ localStorage  
    •	主题  
    •	折叠状态  
    •	最近一次选择  
    •	feature flag

👉 停止，不要升级复杂度

⸻

✅ 会（业务 / 离线 / 数据本身有价值）

→ 进入下一问

是否需要离线能力 or 存大量结构化数据？

❌ 不需要  
→ localStorage（勉强）或内存即可

✅ 需要  
→ IndexedDB  
    •	离线表单  
    •	PWA  
    •	大量缓存  
    •	浏览器内数据集

👉 但记住：  
IndexedDB 是“能用”，不是“好用”

⸻

Step 2：本地进程（IDE / Agent / 工具）

这是「系统核心状态」还是「临时/派生数据」？

临时 / 派生 / 可丢

→ 内存 / 文件 / cache  
👉 不要引数据库

⸻

核心状态（source of truth）

→ 进入下一问

是否需要：

+ schema 演进
+ 查询
+ 事务
+ 回放 / debug / 复现

❌ 都不需要

→ 简单文件（JSON / YAML）

⚠️ 但这个分支非常少见，而且很容易后悔

⸻

✅ 需要任意一项

→ SQLite

这是 AI coding / agent / 工具系统的默认分支。

⸻

Step 3：SQLite 之后，是否需要“升级为服务型 DB”？

是否出现以下任一信号？

```plain
•	多用户同时写
•	必须跨网络共享状态
•	明确的 SLA / 运维 / DBA
•	写 QPS 持续偏高，且不可串行化
```

❌ 没有

→ 继续 SQLite

不要被“将来可能”绑架

✅ 有

→ MySQL（或其他服务型 DB）

👉 顺序一定是：  
SQLite → 验证 → 再升级

⸻

一页版速记（你可以直接抄）

UI 状态？  
 └─ 是 → localStorage

浏览器离线 / 大数据？  
 └─ 是 → IndexedDB

本地工具 / Agent 核心状态？  
 └─ 是 → SQLite

多用户 / 网络 / 服务？  
 └─ 是 → MySQL



⸻

给你这种人（AI / Agent / 工具型研发）的终极判断句

当你在犹豫 SQLite 还是 MySQL，  
90% 的时候，说明你其实还在 SQLite 这一层。

而当你真的该用 MySQL 的那一天——  
你不会再问这个问题。

这棵选择树，本质上是在帮你延迟复杂度、放大复利。



> 更新: 2026-01-25 05:29:10  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ff5ualay3gsvrb5h>