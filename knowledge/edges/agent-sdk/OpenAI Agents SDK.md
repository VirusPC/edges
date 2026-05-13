只看这段 ReAct 流式输出，把关键经验点 + 对应代码片段列出来，方便你以后照着套模板。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

---

## 1. 标准的异步事件循环骨架

**经验点：** 用 `async for` 消费一次性事件流，是 Agent streaming 的标准形态，就像 TS 里的 `for await ... of`。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

python

`async def _run():     streamed_run = Runner.run_streamed(agent, prompt)    current_stream_kind = None     async for event in streamed_run.stream_events():        ...`

---

## 2. ReAct 语义到事件类型的映射

**经验点：** 把 ReAct 的 Thought / Answer / Action / Observation 映射到不同事件类型，只用一个统一事件流。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

python

`from agents.stream_events import RawResponsesStreamEvent, RunItemStreamEvent from openai.types.responses import (     ResponseTextDeltaEvent,    ResponseReasoningSummaryTextDeltaEvent, ) async for event in streamed_run.stream_events():     if isinstance(event, RawResponsesStreamEvent):        # Thought / Answer        if isinstance(event.data, ResponseReasoningSummaryTextDeltaEvent):            ...        elif isinstance(event.data, ResponseTextDeltaEvent):            ...     elif isinstance(event, RunItemStreamEvent):        # Action / Observation        item = event.item        if item.type == "tool_call_item":            ...        elif item.type == "tool_call_output_item" and verbose:            ...`

- reasoning delta ⇒ Thought
    
- text delta ⇒ Answer
    
- tool_call_item ⇒ Action
    
- tool_call_output_item ⇒ Observation
    

---

## 3. 用小状态机控制输出分段

**经验点：** 用一个很小的状态机（`current_stream_kind`）管理“当前在输出哪一类内容”，只负责控制换行和前缀，让 log 清晰分段。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

python

`current_stream_kind = None  # None / "reasoning" / "text" # reasoning 分支 if isinstance(event.data, ResponseReasoningSummaryTextDeltaEvent):     if current_stream_kind != "reasoning":        if current_stream_kind is not None:            print()        print("\n[reasoning]: ", end="", flush=True)    delta = event.data.delta    print(delta, end="", flush=True)    current_stream_kind = "reasoning" # text 分支 elif isinstance(event.data, ResponseTextDeltaEvent):     if current_stream_kind != "text":        if current_stream_kind is not None:            print()        print("\n[text]: ", end="", flush=True)    delta = event.data.delta    print(delta, end="", flush=True)    current_stream_kind = "text" # loop 结束收尾 if current_stream_kind is not None:     print()`

---

## 4. 工具调用 / 工具输出的标准打印格式

**经验点：** Action / Observation 事件统一打印成结构化前缀 `[tool call]` / `[tool call output]`，并在模式切换时加换行，保证 trace 易读。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

python

`elif isinstance(event, RunItemStreamEvent):     item = event.item     # Action: 工具调用    if item.type == "tool_call_item":        if current_stream_kind is not None:            print()        raw = item.raw_item        args = getattr(raw, "arguments", "{}")        args_str = f"({args})" if verbose else ""        print(f"\n[tool call]: {raw.name}{args_str}", flush=True)        current_stream_kind = None     # Observation: 工具输出（仅在 verbose 下）    elif item.type == "tool_call_output_item" and verbose:        if current_stream_kind is not None:            print()        output = str(item.output)        preview = output[:200] + "..." if len(output) > 200 else output        print(f"\n[tool call output]: {preview}", flush=True)        current_stream_kind = None`

要点：

- 每次打印工具相关内容前，若之前在输出 reasoning/text，就先 `print()` 换行。
    
- 工具输出只打预览（前 200 字符），避免刷屏。
    

---

## 5. verbose 开关控制 trace 粒度

**经验点：** 用 `verbose` 控制“内部细节”打印（工具参数 + 工具输出），默认模式对用户友好，开启后对开发者友好。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

python

`def query_agent(..., verbose: bool = False) -> str:     ...     async for event in streamed_run.stream_events():        ...        if item.type == "tool_call_item":            ...            args_str = f"({args})" if verbose else ""            print(f"\n[tool call]: {raw.name}{args_str}", flush=True)         elif item.type == "tool_call_output_item" and verbose:            ...            print(f"\n[tool call output]: {preview}", flush=True)`

- `verbose=False`：只看 `[reasoning]` 和 `[text]`。
    
- `verbose=True`：额外看到工具调用参数和工具输出预览，便于调试 ReAct 过程。
    

---

## 6. 流式打印 vs 最终返回值分离

**经验点：** streaming loop 负责“边跑边打印”，最终结果从 `streamed_run.final_output` 取，函数对外仍然返回完整 answer，而不是让调用方依赖打印输出。[pageindex](https://docs.pageindex.ai/cookbook/agentic-vectorless-rag-pageindex)

python

`async def _run():     streamed_run = Runner.run_streamed(agent, prompt)    ...    async for event in streamed_run.stream_events():        ...    if current_stream_kind is not None:        print()    return "" if not streamed_run.final_output else str(streamed_run.final_output)`

- side-effect：`print(...)` 做实时可视化。
    
- 真正的 return：`streamed_run.final_output` 聚合好的最终回答。
    

---

如果你打算抽成自己的模板，下次写 ReAct agent 只要保留这 6 个点的结构，把事件类型名和标签名换成你自己的即可。你要不要我帮你把这套模式翻译成一份 TypeScript 版本的“通用 ReAct streaming loop 模板”？