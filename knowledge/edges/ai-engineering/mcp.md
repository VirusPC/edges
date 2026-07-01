### Steamable HTTP VS SSE
背景：在部署mcp server时，遇到了多pod丢session的问题

官方在 spec 的 transports 文档和 changelog 里给了明确理由,2025-03-26 那版规范正式把 Streamable HTTP 定为 HTTP+SSE 的替代方案,这取代了协议版本 2024-11-05 里的 HTTP+SSE transport。核心是三个结构性缺陷逼出来的:

**官方点名的三大问题**

缺乏可恢复流的支持、要求服务端维持长期存活且高可用的连接、以及服务端消息只能通过 SSE 单向下发。这三条基本就是你我们之前聊的那个多 pod 问题的根源——"必须有一个进程一直攥着这条连接不撒手"。

**逐条对应的动机**

1. **Serverless/弹性部署完全跑不通** —— SSE 要求服务进程在整个 session 期间存活,这跟 serverless 那种函数执行完就销毁的模型直接冲突,所以 SSE 在 serverless 平台上根本没法跑。Streamable HTTP 把这个问题解决了,一次 POST 处理一次调用,返回结果就终止,长任务可以走 Tasks 原语轮询,不需要连接一直挂着。
    
2. **标准 web 基础设施跟 SSE 天生不兼容** —— 负载均衡器、CDN、反向代理不是为无限期的 SSE 连接设计的:很多 LB 有 idle timeout,代理会缓冲 SSE 事件破坏实时性,部署时的连接排空(connection draining)会直接杀掉活跃的流。这跟你我之前讨论的多 pod session affinity 问题是同一枚硬币的两面。
    
3. **安全模型的副作用** —— 这是个额外收获而非最初动机,但官方博客/社区也强调了:长期保持打开的连接会让安全层(API Gateway、反向代理、认证中间件)只在最初检查一次身份,之后连接口子一直开着,少了持续校验;而且浏览器标准 API 很难在握手阶段传安全 header,导致很多实现被迫把 access token 塞进 URL query string,等于把钥匙贴在门上。Streamable HTTP 因为每次都是标准 HTTP 请求,可以正常走 header 认证。
    
4. **架构简化** —— 老方案需要两个独立 endpoint:一个 /sse 建立持久连接接收响应,另一个处理客户端发送的消息;Streamable HTTP 把这些整合成单一端点,既支持无状态通信,也能按需升级到 SSE,更贴合现代 web 架构和基础设施的假设。
    

**跟你的多 pod 问题的关系**

值得注意的是,官方自己也承认这**没有完全解决**水平扩展问题——这个设计对无状态和可恢复是友好的,但有状态 session 仍然要跟水平扩展打架,如果把有状态服务端放在没有 session affinity 的负载均衡器后面,client 完全可能落到一个不认识它 session 的节点上,2026 年的 MCP roadmap 把"session 与负载均衡器"列为优先事项之一。也就是说官方定的调子是:**默认走无状态 request-response,有状态是可选项、且明确留了"这块还没完全解决"的口子**,不是说升级了就自动免疫多 pod 问题——跟我们上一条聊的判断一致,只是把强制绑定的刚性需求降级成了"最好绑定,或者靠 resumability/event store 兜底"。

另外一个时间线信号供参考:各家企业客户端(比如 Atlassian Rovo)都在因为可靠性限制以及对齐 MCP 规范,弃用 HTTP+SSE 转向 Streamable HTTP,并给出了 2026 年 6 月 30 日的下线截止时间,说明这不只是理论上的推荐,生态在真的按时间表往下线走。