# 模型 - ollama



ollama run xxx-model，会自动下载并运行模型

模型接口可通过 localhost:11434 (非docker) 或 http://host.docker.internal:11434（docker）直接访问

```typescript
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3",
    "prompt": "用一句话解释什么是向量数据库",
    "stream": false
  }'

```



macmini 16 跑个 qwen2.5-coder:7b差不多



> 更新: 2026-02-14 07:04:46  
> 原文: <https://www.yuque.com/viruspc/el3mi0/nhof6s2gaymti4yd>