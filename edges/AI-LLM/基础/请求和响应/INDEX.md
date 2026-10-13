# 请求和响应

- [标准应答](#%E6%A0%87%E5%87%86%E5%BA%94%E7%AD%94)
- [Streaming](#streaming)

---

MCP Transports：[https://modelcontextprotocol.io/docs/concepts/transports](https://modelcontextprotocol.io/docs/concepts/transports)



## 标准应答
<font style="color:rgb(51, 51, 51);">先来看正常的 HTTP 应答，也就是一个请求过去，大模型直接回复一个完整的应答。下面是一个应答的例子：</font>

```typescript
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
const { text } = await generateText({
  model: openai("gpt-4o-mini"),
  prompt: "Hello"
})
```

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o-mini",
  "system_fingerprint": "fp_44709d6fcb",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "\n\nHello there, how may I assist you today?",
    },
    "logprobs": null,
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

+ id，应答的唯一标识。
+ object，对象类型。这是 OpenAI API 应答的一个通用字段，不同类型的应答都会有自己固定的对象类型，在聊天补全接口中，它的值就是 chat.completion。
+ created，Unix 时间戳。它表明了这个应答生成的时间。
+ model，生成应答的模型。大部分情况下，它就是请求时所带的模型。不过，同一个模型可能存在不同版本的情况，它有时会返回具体的版本，比如：gpt-4o-mini-2024-07-18。
+ system_fingerprint，系统指纹。它代表了模型运行时使用的后端配置。在讲到请求中的技术参数时，我们提到过一个 seed 参数，可以当做后端缓存来看。seed 参数就是要与这个 system_fingerprint 配合使用的。
+ choices：本身是一个对象列表，其中的每个对象就是大模型生成文本的一部分。
    - index，索引。这就是一个顺序编号，如果文本被切分了，通过索引就可以将内容重新排列，生成正确的顺序。不过，如果对于标准的 HTTP 应答，切片的必要性不大，往往只有一块。
    - finish_reason，停止生成 token 的原因。文本不会无限生成，总会停下来。到了停止点或遇到停止序列，原因就是 stop，到了一定的长度，原因就是 length，生成了工具调用就是 tool_calls。
    - message，回复的消息。在这个例子中，包含了两个字段：角色（role）和内容（content）。这个部分与请求中的消息是一样的，最核心的字段就是内容。<font style="color:rgb(51, 51, 51);">除了常规的回复内容之外，如果回复内容是一个工具调用，也是通过 message 里返回的，</font>

```json
{
  "index": 0,
  "message": {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "get_current_weather",
          "arguments": "{\n\"location\": \"Boston, MA\"\n}"
        }
      }
    ]
  },
  "logprobs": null,
  "finish_reason": "tool_calls"
}
```



<font style="color:rgb(51, 51, 51);">设置 logprobs 就可以让大模型把概率返回给我们，设置 top_logprobs 可以返回概率比较高的几个选项。开启了 logprobs，还把 top_logprobs 设置成了 2:</font>

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1702685778,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "logprobs": {
        "content": [
          {
            "token": "Hello",
            "logprob": -0.31725305,
            "bytes": [72, 101, 108, 108, 111],
            "top_logprobs": [
              {
                "token": "Hello",
                "logprob": -0.31725305,
                "bytes": [72, 101, 108, 108, 111]
              },
              {
                "token": "Hi",
                "logprob": -1.3190403,
                "bytes": [72, 105]
              }
            ]
          },
          {
            "token": "!",
            "logprob": -0.02380986,
            "bytes": [
              33
            ],
            "top_logprobs": [
              {
                "token": "!",
                "logprob": -0.02380986,
                "bytes": [33]
              },
              {
                "token": " there",
                "logprob": -3.787621,
                "bytes": [32, 116, 104, 101, 114, 101]
              }
            ]
          },
          {
            "token": " How",
            "logprob": -0.000054669687,
            "bytes": [32, 72, 111, 119],
            "top_logprobs": [
              {
                "token": " How",
                "logprob": -0.000054669687,
                "bytes": [32, 72, 111, 119]
              },
              {
                "token": "<|end|>",
                "logprob": -10.953937,
                "bytes": null
              }
            ]
          },
          {
            "token": " can",
            "logprob": -0.015801601,
            "bytes": [32, 99, 97, 110],
            "top_logprobs": [
              {
                "token": " can",
                "logprob": -0.015801601,
                "bytes": [32, 99, 97, 110]
              },
              {
                "token": " may",
                "logprob": -4.161023,
                "bytes": [32, 109, 97, 121]
              }
            ]
          },
          {
            "token": " I",
            "logprob": -3.7697225e-6,
            "bytes": [
              32,
              73
            ],
            "top_logprobs": [
              {
                "token": " I",
                "logprob": -3.7697225e-6,
                "bytes": [32, 73]
              },
              {
                "token": " assist",
                "logprob": -13.596657,
                "bytes": [32, 97, 115, 115, 105, 115, 116]
              }
            ]
          },
          {
            "token": " assist",
            "logprob": -0.04571125,
            "bytes": [32, 97, 115, 115, 105, 115, 116],
            "top_logprobs": [
              {
                "token": " assist",
                "logprob": -0.04571125,
                "bytes": [32, 97, 115, 115, 105, 115, 116]
              },
              {
                "token": " help",
                "logprob": -3.1089056,
                "bytes": [32, 104, 101, 108, 112]
              }
            ]
          },
          {
            "token": " you",
            "logprob": -5.4385737e-6,
            "bytes": [32, 121, 111, 117],
            "top_logprobs": [
              {
                "token": " you",
                "logprob": -5.4385737e-6,
                "bytes": [32, 121, 111, 117]
              },
              {
                "token": " today",
                "logprob": -12.807695,
                "bytes": [32, 116, 111, 100, 97, 121]
              }
            ]
          },
          {
            "token": " today",
            "logprob": -0.0040071653,
            "bytes": [32, 116, 111, 100, 97, 121],
            "top_logprobs": [
              {
                "token": " today",
                "logprob": -0.0040071653,
                "bytes": [32, 116, 111, 100, 97, 121]
              },
              {
                "token": "?",
                "logprob": -5.5247097,
                "bytes": [63]
              }
            ]
          },
          {
            "token": "?",
            "logprob": -0.0008108172,
            "bytes": [63],
            "top_logprobs": [
              {
                "token": "?",
                "logprob": -0.0008108172,
                "bytes": [63]
              },
              {
                "token": "?\n",
                "logprob": -7.184561,
                "bytes": [63, 10]
              }
            ]
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 9,
    "total_tokens": 18
  },
  "system_fingerprint": null
}
```

## Streaming
> <font style="color:rgb(51, 51, 51);">SSE 是服务器发送事件（Server-Sent Event），它是一种服务器推送技术，客户端通过 HTTP 连接接收来自服务器的自动更新，它描述了服务器如何在建立初始客户端连接后向客户端发起数据传输。——Wikipedia</font>
>

[https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

<font style="color:rgb(51, 51, 51);">常规的应答会在建立起的 HTTP 通道上，一次性地把所有内容都发送给客户端，而 SSE 的方式是在连接建立之后，一块一块地把消息发给用户。对应到大模型上，就是每生成一部分内容就发送一次。</font>



<font style="color:rgb(51, 51, 51);">SSE 通常分成纯数据消息和事件消息。纯数据消息，顾名思义就是只有数据的消息，下面是一个例子：</font>

+ 纯数据消息

```latex
data: This is the first message.

data: This is the second message, it
data: has two lines.

data: This is the third message.
```

+ 事件消息

```latex
event: add
data: 73857293

event: remove
data: 2153

event: add
data: 113411
```



openai 聊天补全中：

```json
{"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4o-mini", "system_fingerprint": "fp_44709d6fcb", "choices":[{"index":0,"delta":{"role":"assistant","content":""},"logprobs":null,"finish_reason":null}]}

{"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4o-mini", "system_fingerprint": "fp_44709d6fcb", "choices":[{"index":0,"delta":{"content":"Hello"},"logprobs":null,"finish_reason":null}]}

....

{"id":"chatcmpl-123","object":"chat.completion.chunk","created":1694268190,"model":"gpt-4o-mini", "system_fingerprint": "fp_44709d6fcb", "choices":[{"index":0,"delta":{},"logprobs":null,"finish_reason":"stop"}]}
```



openai 代码示例：

+ sse中，response.data 是一个ReadableStream，而非JSON对象。需要不断循环await，直至done标志位为true。
+ 目前，OpenAI 官方的 TypeScript SDK (openai 包) 不直接支持通过事件监听的方式来处理流式响应（SSE）

```typescript
import { Configuration, OpenAIApi } from 'openai';

async function streamChatGPT(apiKey: string, prompt: string) {
  // 配置 OpenAI API 客户端
  const configuration = new Configuration({
    apiKey: apiKey,
  });
  const openai = new OpenAIApi(configuration);

  try {
    // 调用 Chat Completions 接口，启用流式响应
    const response = await openai.createChatCompletion(
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        stream: true, // 启用 SSE
      },
      { responseType: 'stream' } // 指定流式响应
    );

    // 处理流式响应
    const stream = response.data as any; // `response.data` 是一个 ReadableStream

    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');

    console.log('Streaming response:');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonString = line.replace(/^data: /, '').trim();

            if (jsonString === '[DONE]') {
              console.log('Stream finished.');
              return;
            }

            try {
              const parsedData = JSON.parse(jsonString);
              console.log('Parsed data:', parsedData);
            } catch (err) {
              console.error('Failed to parse line:', line, err);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during SSE:', error);
  }
}

// Example usage:
const apiKey = 'your_openai_api_key';
const prompt = 'What is the weather like today?';
streamChatGPT(apiKey, prompt);
```



vercel/ai sdk的写法，简单很多

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const { textStream } = streamText({
  model: openai('gpt-4-turbo'),
  prompt: 'Write a poem about embedding models.',
});

for await (const textPart of textStream) {
  console.log(textPart);
}
```



> 更新: 2025-08-08 07:31:02  
> 原文: <https://www.yuque.com/viruspc/el3mi0/sukdr0i59oielq9f>