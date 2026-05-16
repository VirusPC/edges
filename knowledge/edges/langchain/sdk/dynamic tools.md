基于 LangChain 文档,总结 **Dynamic Tools** 的两种主要范式:[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)

## 两种 Dynamic Tools 范式

## 1. 过滤预注册工具 (Filtering Pre-registered Tools)

**适用场景**: 所有可能的工具在 agent 创建时已知,但需要根据运行时条件动态选择哪些工具可用 。[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)

## 基于 State 过滤

python

`@wrap_model_call def state_based_tool_filter(request: ModelRequest, handler) -> ModelResponse:     """根据对话状态过滤工具"""    message_count = len(request.state["messages"])         if message_count < 5:        # 新对话只提供基础工具        tools = [search_tool]    else:        # 深度对话提供全部工具        tools = [search_tool, analysis_tool, export_tool]         return handler(request.override(tools=tools)) agent = create_agent(     model="gpt-5.4",    tools=[search_tool, analysis_tool, export_tool],  # 预注册所有工具    middleware=[state_based_tool_filter] )`

## 基于 Store 过滤 (权限/特性标记)

python

`@wrap_model_call def store_based_tools(request: ModelRequest, handler) -> ModelResponse:     """根据 Store 中的用户偏好/权限过滤工具"""    user_id = request.runtime.context.user_id         # 从 Store 读取用户启用的功能    store = request.runtime.store    feature_flags = store.get(("features",), user_id)         if feature_flags:        enabled_features = feature_flags.value.get("enabled_tools", [])        # 只包含用户启用的工具        tools = [t for t in request.tools if t.name in enabled_features]        request = request.override(tools=tools)         return handler(request) agent = create_agent(     model="gpt-5.4",    tools=[search_tool, analysis_tool, export_tool],    middleware=[store_based_tools],    context_schema=Context,    store=InMemoryStore() )`

## 基于 Runtime Context 过滤

python

`@wrap_model_call def context_based_tools(request: ModelRequest, handler) -> ModelResponse:     """根据运行时上下文过滤工具"""    user_role = request.runtime.context.get("user_role", "user")         if user_role == "admin":        tools = request.tools  # 管理员获得所有工具    elif user_role == "analyst":        tools = [t for t in request.tools if t.name in ["search", "analysis"]]    else:        tools = [t for t in request.tools if t.name == "search"]         return handler(request.override(tools=tools))`

**优势**:

- 所有工具在编译/启动时已知,易于维护和测试[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- 可以基于权限、特性标记、对话状态过滤[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- 工具本身是静态的,只是可用性是动态的[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    

## 2. 运行时工具注册 (Runtime Tool Registration)

**适用场景**: 工具无法在 agent 创建时预先知道,需要根据运行时信息动态生成或注册工具 。[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)

python

`@wrap_model_call def runtime_tool_registration(request: ModelRequest, handler) -> ModelResponse:     """运行时动态生成工具"""    # 根据用户输入或状态动态创建工具    user_databases = request.runtime.context.get("available_dbs", [])         # 动态生成数据库查询工具    dynamic_tools = []    for db in user_databases:        @tool        def query_db(query: str, db_name: str = db) -> str:            f"""Query the {db_name} database"""            return execute_query(db_name, query)                 dynamic_tools.append(query_db)         # 合并静态工具和动态工具    all_tools = list(request.tools) + dynamic_tools    return handler(request.override(tools=all_tools)) agent = create_agent(     model="gpt-5.4",    tools=[search_tool],  # 基础静态工具    middleware=[runtime_tool_registration] )`

**优势**:

- 可以根据用户数据、API 响应等动态生成工具[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- 适合工具集不确定或依赖外部系统的场景[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- 更灵活但复杂度更高[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    

## 选择指南

|场景|推荐范式|
|---|---|

|场景|推荐范式|
|---|---|
|基于权限/角色限制工具访问|**过滤预注册工具** [langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)|
|基于对话阶段调整工具集|**过滤预注册工具** [langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)|
|基于特性标记启用/禁用功能|**过滤预注册工具** (Store) [langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)|
|需要根据用户数据生成工具|**运行时工具注册** [langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)|
|工具依赖外部系统动态变化|**运行时工具注册** [langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)|

## 关键技术点

- **使用 `@wrap_model_call` 装饰器**创建中间件来修改工具集[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- **通过 `request.override(tools=...)`** 修改可用工具列表[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- **访问运行时信息**: `request.runtime.context`、`request.runtime.store`、`request.state`[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    
- **工具过滤 vs 工具生成**: 预注册适合静态集合,运行时注册适合动态生成[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)
    

这两种范式可以组合使用,满足复杂的动态工具需求 。[langchain](https://docs.langchain.com/oss/python/langchain/agents#dynamic-tools)