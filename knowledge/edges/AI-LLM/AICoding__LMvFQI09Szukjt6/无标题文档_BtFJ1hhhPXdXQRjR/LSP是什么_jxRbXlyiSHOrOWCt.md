# LSP是什么

[https://chatgpt.com/s/t_697f904cc96c81919e9e3434f8282bb2](https://chatgpt.com/s/t_697f904cc96c81919e9e3434f8282bb2)



好，这个问题问到本质层了。



我直接给你一句结论：



LSP 本身什么都不“做”。

真正在做 AST / 语义 / 半编译的，是 LSP Server。



LSP = 协议外壳。

Language Server = 干活的人。



下面拆清楚。









一、结论先行（给你工程视角版）







LSP 在体系里的真实定位：



编译器前端 ≈ LSP Server ＞ LSP 协议 ＞ 编辑器/Agent

绝大多数主流 LSP Server：



✅ 有完整 Parser

✅ 有 AST

✅ 有 Symbol Table

✅ 有 Type System

❌ 没有最终机器码生成



它们是：



“常驻内存的编译器前半截”









二、编译器视角拆 LSP Server





先复习一下标准编译流程：

源码

 ↓

Lexer（分词）

 ↓

Parser（语法树）

 ↓

AST

 ↓

Semantic Analysis（类型/作用域）

 ↓

IR

 ↓

Optimization

 ↓

CodeGen

LSP Server 一般做到这里：

源码

 ↓

Lexer

 ↓

Parser

 ↓

AST

 ↓

Semantic

到这就停了。



👉 不生成 IR / 二进制。









三、不同语言：做的深度不同





不是所有 LSP 一样“重”。





1️⃣ TypeScript / Go / Rust（重型）



|  |  |  |
| --- | --- | --- |
| 语言 | Server | 本质 |
| TS | tsserver | TS Compiler 前端 |
| Go | gopls | Go Compiler API |
| Rust | rust-analyzer | 自研前端 |


特点：



+ 几乎全编译语义
+ 类型系统完整
+ 跨文件依赖图
+ 增量更新





👉 接近“编译器 daemon”。









2️⃣ Python / JS / PHP（中型）



|  |  |
| --- | --- |
| 语言 | Server |
| Python | pyright |
| JS | eslint-lsp |


特点：



+ AST 有
+ 类型是推断的
+ 动态性高
+ 精度有限





👉 半静态分析。









3️⃣ HTML / JSON / Markdown（轻型）



|  |  |
| --- | --- |
| 类型 | Server |
| JSON | jsonls |
| HTML | html-lsp |


特点：



+ 只做 parse
+ 没有语义系统





👉 纯语法工具。









四、LSP Server 内部到底在干什么？





我们抽象一个典型流程：









1️⃣ 持久 AST 树





不是“临时 parse”。



是：

整个项目 → AST Forest

在内存里维护：



+ 文件A AST
+ 文件B AST
+ import 关系
+ symbol map





这是为什么吃内存。









2️⃣ 符号表（Symbol Table）





类似：

Map<Identifier, Definition>

支持：



+ go to definition
+ find references
+ rename





本质是编译器核心结构。









3️⃣ 类型推导系统





例如 TS：

const x = foo(bar())

LSP 要算出：

x: Promise<Result>

要跑整个类型推导链。



非常重。









4️⃣ 增量编译模型（关键）





不是每次全算。



是：

diff → invalidate → recompute

类似 build cache。



这是复杂度来源。









5️⃣ 诊断系统





把编译器错误转成：

line:col

message

severity

实时反馈。









五、为什么说“半编译器”？





因为：

|  |  |  |
| --- | --- | --- |
| 能力 | LSP Server | Compiler |
| Lexer | ✅ | ✅ |
| AST | ✅ | ✅ |
| Types | ✅ | ✅ |
| IR | ❌ | ✅ |
| Optimize | ❌ | ✅ |
| Binary | ❌ | ✅ |


👉 少后端。



但前端全有。









六、为什么不直接用编译器？





你可能会问：



那干嘛不直接跑编译器？



好问题。



原因：









1️⃣ 编译器不是常驻的





编译器设计是：

run → exit

LSP 是：

daemon → cache → incremental









2️⃣ 编译器不是交互式的





编译器输出：

一坨 log

LSP 输出：

结构化 JSON

适合工具消费。









3️⃣ 编译器太慢





全量编译：



秒级~分钟级。



LSP：



ms~100ms 级响应。









七、那 LSP 是 AST？语义？还是编译？





准确分类：



❌ 不是“只做 AST”

❌ 不是“完整编译”

✅ 是“增量语义分析服务”



最准确叫法：



Incremental Semantic Analyzer









八、为什么这在 Agent 时代变尴尬？





回到你前面的问题。



LSP 做的是：

“静态世界的推理”

Compiler/Test 给的是：

“现实世界的事实”

当 Agent 能跑现实世界时：



静态价值下降。









九、给你一个工程判断公式





什么时候 LSP 值钱？

运行成本 > 分析成本

比如：



+ 嵌入式
+ 巨型 C++ 项目
+ 编译 30 分钟





LSP 很香。



什么时候不值？

npm test 5s 内

直接跑。









十、最终一句话（核心）





LSP Server 本质是：



一个常驻内存、增量更新的“编译器前端 + 语义引擎”。



不是玩具 AST parser。



而是：



👉 半个编译器 + 巨大工程复杂度。







如果你有兴趣，下一步我可以给你拆：



rust-analyzer / tsserver 内部架构，对应你做 Agent 会怎么用得上。



> 更新: 2026-02-01 17:54:44  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ger71q5k2cutcqp1>